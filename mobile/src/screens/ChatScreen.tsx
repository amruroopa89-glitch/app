import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { supabase } from "../services/supabase";
import { askAssistant, ChatMessage, ChatProfile } from "../services/ai";
import { Send, Mic, Trash2, Sparkles, AlertCircle, Sprout, FlaskConical, ShieldAlert, Droplets, CloudSun } from "lucide-react-native";

type Msg = {
  role: "user" | "assistant";
  content: string;
};

const LANGS: Record<string, { label: string }> = {
  English: { label: "English" },
  Hindi: { label: "हिन्दी" },
  Telugu: { label: "తెలుగు" },
  Tamil: { label: "தமிழ்" },
  Kannada: { label: "ಕನ್ನಡ" },
  Marathi: { label: "मराठी" },
  Bengali: { label: "বাংলা" },
  Gujarati: { label: "ગુજરાતી" },
};

const CATEGORY_SUGGESTIONS = [
  {
    category: "Crop Recommendations",
    icon: <Sprout size={18} color="#2E7D32" />,
    prompt: "Recommend the best crops for my soil and current season.",
  },
  {
    category: "Fertilizer Suggestions",
    icon: <FlaskConical size={18} color="#2E7D32" />,
    prompt: "What is the optimal NPK fertilizer dose for groundnut and cotton?",
  },
  {
    category: "Plant Disease Guidance",
    icon: <ShieldAlert size={18} color="#2E7D32" />,
    prompt: "How do I identify and treat yellow leaf spot organically?",
  },
  {
    category: "Irrigation Advice",
    icon: <Droplets size={18} color="#2E7D32" />,
    prompt: "What is the best irrigation schedule for maize during summer?",
  },
  {
    category: "Weather Farming Tips",
    icon: <CloudSun size={18} color="#2E7D32" />,
    prompt: "Give me farming tips based on recent weather and rainfall forecasts.",
  },
];

export function ChatScreen() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content:
        "Hello! 👋 I am your **Green Harvest AI Assistant**.\n\nI can help you with:\n- 🌾 **Crop recommendations**\n- 🧪 **Fertilizer suggestions**\n- 🌿 **Plant disease guidance**\n- 💧 **Irrigation advice**\n- ☀️ **Weather-based farming tips**\n\nHow can I help your farm today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [lang, setLang] = useState("English");
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<ChatProfile | null>(null);

  const [langModalVisible, setLangModalVisible] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    async function loadUserData() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          // Load Profile
          const { data: profData } = await supabase
            .from("profiles")
            .select(
              "full_name,village,district,state,farm_size,farm_unit,soil_type,soil_ph,nitrogen,phosphorus,potassium,water_availability,irrigation_type,current_season,crop_history,language"
            )
            .eq("user_id", currentUser.id)
            .maybeSingle();

          if (profData) {
            if (profData.language) {
              setLang(profData.language);
            }
            setProfile({
              fullName: profData.full_name ?? undefined,
              location: [profData.village, profData.district, profData.state].filter(Boolean).join(", ") || undefined,
              farmSize: profData.farm_size ?? undefined,
              farmUnit: profData.farm_unit ?? undefined,
              soilType: profData.soil_type ?? undefined,
              soilPh: profData.soil_ph ?? undefined,
              nitrogen: profData.nitrogen ?? undefined,
              phosphorus: profData.phosphorus ?? undefined,
              potassium: profData.potassium ?? undefined,
              water: profData.water_availability ?? undefined,
              irrigation: profData.irrigation_type ?? undefined,
              season: profData.current_season ?? undefined,
              cropHistory: profData.crop_history ?? undefined,
            });
          }

          // Load Chat History
          const { data: chatHistory, error: chatErr } = await (supabase as any)
            .from("chat_messages")
            .select("role, content")
            .eq("user_id", currentUser.id)
            .order("created_at", { ascending: true });

          if (!chatErr && chatHistory && chatHistory.length > 0) {
            setMessages(chatHistory.map((m: any) => ({ role: m.role, content: m.content })));
          }
        }
      } catch (err) {
        console.warn("Failed to load saved chat history:", err);
      } finally {
        setInitialLoading(false);
      }
    }
    loadUserData();
  }, []);

  const handleLanguageChange = async (newLang: string) => {
    setLang(newLang);
    setLangModalVisible(false);
    if (user?.id) {
      try {
        await supabase
          .from("profiles")
          .upsert({ user_id: user.id, language: newLang }, { onConflict: "user_id" });
      } catch (err) {
        console.warn("Failed to persist language in database:", err);
      }
    }
  };

  const saveMessageToSupabase = async (role: "user" | "assistant", content: string) => {
    if (!user?.id) return;
    try {
      await (supabase as any).from("chat_messages").insert({
        user_id: user.id,
        role,
        content,
      });
    } catch (err) {
      console.warn("Could not persist message to database:", err);
    }
  };

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;

    const userMsg: Msg = { role: "user", content: q };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    saveMessageToSupabase("user", q);

    try {
      const response = await askAssistant(nextMessages, lang, profile ?? undefined);
      const replyText = response.reply || "Sorry, I couldn't generate a reply. Please try again.";
      const assistantMsg: Msg = { role: "assistant", content: replyText };
      
      setMessages([...nextMessages, assistantMsg]);
      saveMessageToSupabase("assistant", replyText);
    } catch (err: any) {
      Alert.alert("Assistant Error", err.message || "Could not reach AI assistant.");
    } finally {
      setLoading(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const clearChatHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear your chat history?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (user?.id) {
              try {
                await (supabase as any).from("chat_messages").delete().eq("user_id", user.id);
              } catch (err) {
                console.warn("Error clearing chat messages:", err);
              }
            }
            setMessages([
              {
                role: "assistant",
                content:
                  "Chat history cleared. 👋 I am Green Harvest AI Assistant. How can I help you today?",
              },
            ]);
          },
        },
      ]
    );
  };

  const startVoiceSimulation = () => {
    Alert.alert("Voice Input", "Speech to text is simulated. Please type your query in the field.");
  };

  const formatMessageContent = (content: string, isUser: boolean) => {
    const lines = content.split("\n");
    const textColor = isUser ? styles.userText : styles.assistantText;

    return lines.map((line, i) => {
      let isHeader = false;
      let cleanLine = line;

      if (line.startsWith("### ")) {
        isHeader = true;
        cleanLine = line.slice(4);
      } else if (line.startsWith("## ")) {
        isHeader = true;
        cleanLine = line.slice(3);
      } else if (line.startsWith("# ")) {
        isHeader = true;
        cleanLine = line.slice(2);
      }

      const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("* ") || line.trim().startsWith("• ");
      if (isBullet) {
        cleanLine = "•  " + line.trim().substring(2);
      }

      const parts = cleanLine.split("**");
      return (
        <Text
          key={i}
          style={[
            styles.messageLine,
            textColor,
            isHeader && styles.headerText,
            isBullet && styles.bulletText,
          ]}
        >
          {parts.map((part, idx) => {
            if (idx % 2 === 1) {
              return (
                <Text key={idx} style={styles.boldText}>
                  {part}
                </Text>
              );
            }
            return part;
          })}
        </Text>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Language & Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.langSelector}>
          <Text style={styles.langLabel}>Language:</Text>
          <TouchableOpacity
            style={styles.langButton}
            onPress={() => setLangModalVisible(true)}
          >
            <Text style={styles.langButtonText}>{LANGS[lang]?.label || lang}</Text>
          </TouchableOpacity>
        </View>

        {messages.length > 1 && (
          <TouchableOpacity style={styles.clearBtn} onPress={clearChatHistory}>
            <Trash2 size={15} color="#DC3545" />
            <Text style={styles.clearBtnText}>Clear History</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Message Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {initialLoading ? (
            <View style={styles.loaderWrapper}>
              <ActivityIndicator size="small" color="#2E7D32" />
              <Text style={styles.loaderText}>Loading history...</Text>
            </View>
          ) : (
            messages.map((m, i) => (
              <View
                key={i}
                style={[
                  styles.messageRow,
                  m.role === "user" ? styles.userRow : styles.assistantRow,
                ]}
              >
                <View
                  style={[
                    styles.messageBubble,
                    m.role === "user" ? styles.userBubble : styles.assistantBubble,
                  ]}
                >
                  {m.role === "assistant" && (
                    <View style={styles.assistantBadge}>
                      <Sparkles size={12} color="#2E7D32" />
                      <Text style={styles.assistantBadgeText}>Green Harvest AI</Text>
                    </View>
                  )}
                  {formatMessageContent(m.content, m.role === "user")}
                </View>
              </View>
            ))
          )}

          {/* Typing Indicator */}
          {loading && (
            <View style={[styles.messageRow, styles.assistantRow]}>
              <View style={[styles.messageBubble, styles.assistantBubble, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#2E7D32" style={styles.typingLoader} />
                <Text style={styles.typingText}>Green Harvest AI is thinking...</Text>
              </View>
            </View>
          )}

          {/* Category suggestions (only shown initially) */}
          {messages.length <= 1 && !loading && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Recommended Topics:</Text>
              {CATEGORY_SUGGESTIONS.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.suggestionCard}
                  onPress={() => send(item.prompt)}
                >
                  <View style={styles.suggestionIcon}>{item.icon}</View>
                  <View style={styles.suggestionTextWrapper}>
                    <Text style={styles.suggestionLabel}>{item.category}</Text>
                    <Text style={styles.suggestionPrompt} numberOfLines={1}>
                      {item.prompt}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Input Bar */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            placeholder={loading ? "Thinking..." : "Ask crops, fertilizers, weather..."}
            placeholderTextColor="#A0AEC0"
            value={input}
            onChangeText={setInput}
            editable={!loading}
          />
          <TouchableOpacity
            style={styles.voiceBtn}
            onPress={startVoiceSimulation}
            disabled={loading}
          >
            <Mic size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={loading || !input.trim()}
          >
            <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Language Modal */}
      <Modal
        visible={langModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLangModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setLangModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose Language</Text>
            <FlatList
              data={Object.entries(LANGS)}
              keyExtractor={([k]) => k}
              renderItem={({ item: [code, details] }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => handleLanguageChange(code)}
                >
                  <Text style={styles.modalItemText}>{details.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7FAFC",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  langSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  langLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718096",
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(220, 53, 69, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(220, 53, 69, 0.15)",
  },
  clearBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC3545",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 12,
  },
  loaderWrapper: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: "#718096",
    fontWeight: "600",
  },
  messageRow: {
    flexDirection: "row",
    width: "100%",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  assistantRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    maxWidth: "85%",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  userBubble: {
    backgroundColor: "#2E7D32",
    borderTopRightRadius: 2,
  },
  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  assistantBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    paddingBottom: 4,
    marginBottom: 6,
  },
  assistantBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
  },
  messageLine: {
    fontSize: 14,
    lineHeight: 19,
    marginBottom: 2,
  },
  userText: {
    color: "#FFFFFF",
  },
  assistantText: {
    color: "#2D3748",
  },
  headerText: {
    fontWeight: "700",
    fontSize: 15,
    marginTop: 6,
    marginBottom: 4,
  },
  bulletText: {
    paddingLeft: 4,
  },
  boldText: {
    fontWeight: "800",
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typingLoader: {
    transform: [{ scale: 0.8 }],
  },
  typingText: {
    fontSize: 12,
    color: "#718096",
    fontWeight: "600",
  },
  suggestionsContainer: {
    marginTop: 10,
    gap: 8,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#718096",
    marginBottom: 4,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
    gap: 10,
  },
  suggestionIcon: {
    backgroundColor: "rgba(46, 125, 50, 0.08)",
    padding: 8,
    borderRadius: 10,
  },
  suggestionTextWrapper: {
    flex: 1,
  },
  suggestionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2D3748",
  },
  suggestionPrompt: {
    fontSize: 10,
    color: "#718096",
    marginTop: 1,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F7FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 24,
    height: 44,
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#1A202C",
  },
  voiceBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#6A5ACD", // Purple
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#2E7D32", // Forest Green
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#A0AEC0",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#2D3748",
    marginBottom: 12,
    textAlign: "center",
  },
  modalItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF2F7",
    alignItems: "center",
  },
  modalItemText: {
    fontSize: 15,
    color: "#2D3748",
    fontWeight: "600",
  },
});
