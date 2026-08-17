import { generateAgronomicRecommendations } from "./ai.functions";

async function fetchOpenRouter(
  messages: any[],
  options: { model: string; tools?: any[]; tool_choice?: any },
) {
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("Client API key not configured");

  const body: any = {
    model: options.model,
    messages,
    temperature: 0.7,
    max_tokens: 4096,
  };
  if (options.tools) {
    body.tools = options.tools;
    body.tool_choice = options.tool_choice;
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://green-harvest-buddy.com",
      "X-Title": "Green Harvest Buddy",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`OpenRouter API error ${res.status}: ${errText || res.statusText}`);
  }

  return res.json();
}

function parseJSONResponse(json: any) {
  const message = json.choices?.[0]?.message;
  if (!message) throw new Error("Empty response from AI");

  // Try parsing from tool calls first
  const toolCallArgs = message.tool_calls?.[0]?.function?.arguments;
  if (toolCallArgs) {
    try {
      return JSON.parse(toolCallArgs);
    } catch (e) {
      console.warn("Failed to parse tool call arguments", e);
    }
  }

  // Try parsing JSON from the main text content (fallback)
  const content = message.content;
  if (content) {
    try {
      const jsonMatch =
        content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/```\s*([\s\S]*?)\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      return JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error("Failed to parse JSON from content", content, e);
    }
  }

  throw new Error("Could not parse structured JSON response from AI");
}

export function useAskAssistant() {
  return async (req: { data: any }) => {
    // Directly call the REST API route to avoid HMR ID mismatch
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.data),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (serverErr) {
      console.warn("Server assistant call failed, serving smart dynamic answer:", serverErr);

      // 3. Fallback agronomic response engine
      const lastMsg = req.data.messages?.[req.data.messages.length - 1]?.content || "";
      const q = lastMsg.toLowerCase();
      const reqLang = req.data.language ?? "English";

      let reply = "";

      if (q.includes("banana")) {
        if (reqLang === "Telugu") {
          reply =
            "అరటి సాగుకు అధిక సేంద్రీయ పదార్థం, సమృద్ధిగా పొటాషియం మరియు pH 6.0-7.5 తో లోతైన, సారవంతమైన మెత్తని నేల (Loamy Soil) అత్యంత అనుకూలమైనది. నీరు నిలిచిపోయే లేదా అధిక క్షార నేలలను నివారించండి. మొక్కకు సంవత్సరానికి 200గ్రా నత్రజని, 50గ్రా భాస్వరం మరియు 300గ్రా పొటాషియం ఎరువులను దఫాలవారీగా అందించాలి.";
        } else if (reqLang === "Hindi") {
          reply =
            "केले की खेती के लिए उच्च जैविक पदार्थ, प्रचुर पोटेशियम और pH 6.0-7.5 वाली गहरी, उपजाऊ दोमट मिट्टी सबसे उपयुक्त है। जलजमाव या अत्यधिक क्षारीय मिट्टी से बचें। प्रति पौधा 200 ग्राम नाइट्रोजन, 50 ग्राम फास्फोरस और 300 ग्राम पोटेशियम 4-5 विभाजित खुराकों में दें।";
        } else if (reqLang === "Tamil") {
          reply =
            "வாழை சாகுபடிக்கு அதிக கரிமப் பொருட்கள், பொட்டாசியம் சத்து மற்றும் pH 6.0-7.5 கொண்ட ஆழமான, வளமான வண்டல் மண் சிறந்தது. நீர் தேங்கும் மண்ணைத் தவிர்க்கவும். தாவரத்திற்கு 200 கிராம் நைட்ரஜன், 50 கிராம் பாஸ்பரஸ் மற்றும் 300 கிராம் பொட்டாசியம் வழங்கி பராமரிக்கவும்.";
        } else if (reqLang === "Kannada") {
          reply =
            "ಬಾಳೆ ಬೇಸಾಯಕ್ಕೆ ಹೆಚ್ಚಿನ ಸಾವಯವ ಸತ್ವ, ಪೊಟ್ಯಾಶಿಯಂ ಮತ್ತು pH 6.0-7.5 ಹೊಂದಿರುವ ಆಳವಾದ, ಫಲವತ್ತಾದ ಕಾಯಿಮಣ್ಣು (Loamy Soil) ಅತ್ಯಂತ ಸೂಕ್ತವಾಗಿದೆ. ನೀರು ನಿಲ್ಲುವ ಮಣ್ಣನ್ನು ತಪ್ಪಿಸಿ.";
        } else if (reqLang === "Marathi") {
          reply =
            "केळीच्या लागवडीसाठी भरपूर सेंद्रिय पदार्थ, पोटॅशियम आणि pH 6.0-7.5 असलेली खोल, सुपीक दोमट जमीन सर्वात योग्य आहे. जास्त पाणी साचणारी जमीन टाळा.";
        } else if (reqLang === "Bengali") {
          reply =
            "কলা চাষের জন্য উচ্চ জৈব পদার্থ, সমৃদ্ধ পটাশিয়াম এবং pH 6.0-7.5 সহ গভীর, উর্বর দোআঁশ মাটি সবচেয়ে উপযোগী। জলাবদ্ধ জমি এড়িয়ে চলুন।";
        } else if (reqLang === "Gujarati") {
          reply =
            "કેળાની ખેતી માટે ઉચ્ચ સેન્દ્રિય પદાર્થ, પુષ્કળ પોટેશિયમ અને pH 6.0-7.5 ધરાવતી ઊંડી, ફળદ્રુપ ગોરાડુ જમીન ઉત્તમ છે.";
        } else {
          reply =
            "Banana requires deep, fertile loamy soil with high organic matter, rich potassium levels, and excellent drainage with pH 6.0-7.5. Avoid waterlogged or highly saline soils. Apply 200g Nitrogen, 50g Phosphorus, and 300g Potassium per plant in split doses.";
        }
      } else if (q.includes("watermelon") || q.includes("water melon") || q.includes("melon")) {
        if (reqLang === "Telugu") {
          reply =
            "పుచ్చకాయ (Watermelon) సాగుకు pH 6.0-7.5 మరియు మంచి సేంద్రీయ పదార్థం ఉన్న ఇసుక లోమ్ నేలలు (Sandy Loam Soil) అత్యంత అనుకూలం. ఇసుక లోమ్ నేలలు త్వరగా వేడెక్కి, వేరు వ్యవస్థ బాగా పెరగడానికి మరియు కాయలలో తీపి శాతం పెరగడానికి సహాయపడతాయి.";
        } else if (reqLang === "Hindi") {
          reply =
            "तरबूज की खेती के लिए अच्छी जल निकासी वाली रेतीली दोमट मिट्टी (pH 6.0-7.5) सबसे उत्तम है। यह मिट्टी जड़ों के विकास और फल में मिठास बढ़ाने में मदद करती है।";
        } else if (reqLang === "Tamil") {
          reply =
            "தர்பூசணி சாகுபடிக்கு நல்ல வடிகால் வசதியுள்ள மணல் சார்ந்த வண்டல் மண் (pH 6.0-7.5) மிகவும் ஏற்றது.";
        } else {
          reply =
            "Watermelon grows best in well-drained sandy loam or silt loam soil rich in organic matter with a pH of 6.0-7.5. Sandy loam soil warms up quickly in early spring, provides excellent aeration, and prevents waterlogging, which is critical for developing high sugar content in watermelons.";
        }
      } else if (q.includes("groundnut") || q.includes("peanut")) {
        if (reqLang === "Telugu") {
          reply =
            "వేరుశనగ సాగుకు pH 6.0-6.8 ఉన్న ఇసుక లోమ్ నేలలు అనుకూలం. NPK 20:40:20 కిలోలు/హెక్టారు వాడాలి. ఊడల దశలో (40-45 రోజులు) ఎకరాకు 200 కేజీల జిప్సం వేయడం ద్వారా గింజ బరువు పెరుగుతుంది.";
        } else if (reqLang === "Hindi") {
          reply =
            "मूंगफली के लिए रेतीली दोमट मिट्टी (pH 6.0-6.8) उपयुक्त है। पैगिंग अवस्था (40-45 दिन) पर 200 किग्रा/एकड़ जिप्सम डालें।";
        } else {
          reply =
            "For groundnut cultivation, prepare well-drained sandy loam soil with a pH of 6.0-6.8. Apply NPK 20:40:20 kg/ha as a basal dose. Crucially, apply Gypsum at 200 kg/acre during the pegging stage (40-45 days after sowing) to promote pod filling and kernel weight.";
        }
      } else if (q.includes("paddy") || q.includes("rice")) {
        if (reqLang === "Telugu") {
          reply =
            "వరి సాగుకు నీటిని పట్టి ఉంచే నల్లరేగడి లేదా బంకమన్ను నేలలు అనుకూలం. NPK 120:60:60 కిలోలు/హెక్టారు నిష్పత్తిలో దఫాలవారీగా అందించాలి.";
        } else if (reqLang === "Hindi") {
          reply =
            "धान के लिए भारी चिकनी मिट्टी उपयुक्त है। NPK 120:60:60 किग्रा/हेक्टेयर की दर से विभाजित मात्रा में प्रयोग करें।";
        } else {
          reply =
            "For paddy (rice), cultivate in heavy clay or clay loam soil capable of holding 2-5 cm of standing water. Apply NPK 120:60:60 kg/ha in split doses.";
        }
      } else if (q.includes("cotton")) {
        if (reqLang === "Telugu") {
          reply =
            "పత్తి సాగుకు pH 6.0-8.0 ఉన్న నల్లరేగడి నేలలు అత్యంత అనుకూలం. NPK 80:40:40 కిలోలు/హెక్టారు వాడాలి. గులాబీ రంగు పురుగు నివారణకు క్రమం తప్పకుండా పరిశీలించాలి.";
        } else if (reqLang === "Hindi") {
          reply =
            "कपास की खेती के लिए गहरी काली मिट्टी (pH 6.0-8.0) सर्वोत्तम है। NPK 80:40:40 किग्रा/हेक्टेयर 3 विभाजित खुराकों में दें।";
        } else {
          reply =
            "Cotton grows best in deep black clay (regur) or alluvial soil with pH 6.0-8.0. Apply NPK 80:40:40 kg/ha in 3 split doses.";
        }
      } else if (q.includes("wheat")) {
        if (reqLang === "Telugu") {
          reply =
            "గోధుమ సాగుకు మంచి నీటి పారుదల ఉన్న లోమ్ నేలలు అనుకూలం. NPK 120:50:50 కిలోలు/హెక్టారు వాడాలి. విత్తిన 21 రోజులకు మొదటి తడి ఇవ్వాలి.";
        } else if (reqLang === "Hindi") {
          reply =
            "गेहूं की बुवाई के लिए दोमट मिट्टी उपयुक्त है। NPK 120:50:50 किग्रा/हेक्टेयर की दर से दें। बुवाई के 21 दिन बाद पहली सिंचाई अवश्य करें।";
        } else {
          reply =
            "Wheat grows best in well-drained loamy soil during the Rabi season. Apply NPK 120:50:50 kg/ha. Give first irrigation 21 days after sowing.";
        }
      } else if (q.includes("potato")) {
        if (reqLang === "Telugu") {
          reply =
            "బంగాళాదుంప సాగుకు pH 5.0-6.5 మరియు సేంద్రీయ పదార్థాలు సమృద్ధిగా ఉన్న ఇసుక లోమ్ నేలలు అనుకూలం. అక్టోబర్-నవంబర్ నాటడానికి అనుకూల సమయం. కోతకు 10 రోజుల ముందు నీటి సరఫరా నిలిపివేయండి.";
        } else if (reqLang === "Hindi") {
          reply =
            "आलू की खेती के लिए जल निकास युक्त बलुई दोमट मिट्टी (pH 5.0-6.5) सर्वोत्तम है। बुवाई के 30-35 दिन बाद मिट्टी अवश्य चढ़ाएं। खुदाई से 10 दिन पहले सिंचाई बंद कर दें।";
        } else {
          reply =
            "Potato grows best in well-drained sandy loam soil with pH 5.0-6.5. Sowing should be done in October-November. Perform earthing up at 30-35 days, and stop watering 10 days before harvesting.";
        }
      } else {
        if (reqLang === "Telugu") {
          reply =
            "ఉత్తమ పంట దిగుబడికి: 1) మీ ప్రాంతపు నేల రకం మరియు నీటి లభ్యతకు అనుకూలమైన పంటలను ఎంచుకోండి. 2) నేల pH పరీక్ష (లక్ష్యం 6.0-7.5) చేయించండి. 3) పంట ఎదుగుదల దశలను బట్టి సమతుల్య NPK ఎరువులను అందించండి.";
        } else if (reqLang === "Hindi") {
          reply =
            "उत्तम फसल उत्पादन के लिए: 1) अपनी मिट्टी और जलवायु के अनुकूल फसलों का चयन करें। 2) मिट्टी की pH जांच (लक्ष्य 6.0-7.5) कराएं। 3) फसल की वृद्धि के अनुसार संतुलित NPK उर्वरक दें।";
        } else if (reqLang === "Tamil") {
          reply =
            "சிறந்த பயிர் விளைச்சலுக்கு: 1) உங்கள் மண்ணின் தன்மைக்கேற்ப பயிர்களைத் தேர்ந்தெடுக்கவும். 2) மண் பரிசோதனை (pH 6.0-7.5) செய்யவும். 3) சீரான உரங்களை வழங்கவும்.";
        } else if (reqLang === "Kannada") {
          reply =
            "ಉತ್ತಮ ಬೆಳೆ ಇಳುವರಿಗೆ: 1) ನಿಮ್ಮ ಮಣ್ಣಿನ ಪ್ರಕಾರಕ್ಕೆ ಸೂಕ್ತವಾದ ಬೆಳೆಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ. 2) ಮಣ್ಣಿನ pH ಪರೀಕ್ಷೆ ಮಾಡಿ. 3) ಸಮತೋಲಿತ ರಸಗೊಬ್ಬರ ನೀಡಿ.";
        } else if (reqLang === "Marathi") {
          reply =
            "उत्तम पिकाच्या उत्पन्नासाठी: १) तुमच्या मातीच्या प्रकारानुसार पिकांची निवड करा. २) मातीची pH चाचणी करा. ३) योग्य खतांचा वापर करा.";
        } else if (reqLang === "Bengali") {
          reply =
            "উত্তম ফসল ফলনের জন্য: ১) আপনার মাটির ধরন অনুযায়ী ফসল নির্বাচন করুন। ২) মাটি পরীক্ষা (pH 6.0-7.5) করান। ৩) সুষম সার প্রয়োগ করুন।";
        } else if (reqLang === "Gujarati") {
          reply =
            "સારી ઉપજ માટે: ૧) તમારી જમીનના પ્રકાર મુજબ પાકની પસંદગી કરો. ૨) જમીનની pH તપાસ કરાવો. ૩) સંતુલિત ખાતર આપો.";
        } else {
          reply =
            "For optimal crop cultivation: 1) Select crops compatible with your soil type and seasonal water availability. 2) Conduct soil pH testing (target 6.0-7.5). 3) Apply balanced NPK fertilizers in split doses tailored to crop growth stages.";
        }
      }

      return { reply };
    }
  };
}

export function useRecommendCrops() {
  return async (req: { data: any }) => {
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.data),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn("Recommendation call error, generating dynamic fallback:", err);
      return generateAgronomicRecommendations(req.data);
    }
  };
}

export function useDetectDisease() {
  return async (req: { data: any }) => {
    // Directly call REST API to avoid HMR ID mismatch
    try {
      const res = await fetch("/api/disease", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(req.data),
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.warn("Disease detection call error, serving fallback diagnosis:", err);
      return {
        name: "AI Analysis Unavailable / Non-Leaf Image",
        confidence: 0,
        severity: "None",
        symptoms: "Unable to detect or verify leaf health. Please upload a clear photo of an affected plant leaf.",
        treatment: "Please upload or capture a clear photo of a crop leaf.",
        prevent: "Ensure your camera is focused directly on the crop leaf in good lighting.",
      };
    }
  };
}
