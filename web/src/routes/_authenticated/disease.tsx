import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useRef, useState, useEffect } from "react";
import { useDetectDisease } from "@/lib/ai-client";
import { Camera, Upload, CheckCircle2, AlertTriangle, AlertCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/disease")({
  head: () => ({
    meta: [
      { title: "Disease Detection — AI Crop Recommendation" },
      {
        name: "description",
        content: "Upload a crop leaf photo to detect disease and get treatment.",
      },
    ],
  }),
  component: DiseasePage,
});

type Diag = {
  name: string;
  confidence: number;
  severity: string;
  symptoms: string;
  treatment: string;
  prevent: string;
};

function DiseasePage() {
  // Dynamically load TensorFlow.js and MobileNet client-side for offline crop detection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const tfScript = document.createElement("script");
      tfScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js";
      tfScript.async = true;
      tfScript.onload = () => {
        const mobilenetScript = document.createElement("script");
        mobilenetScript.src = "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js";
        mobilenetScript.async = true;
        mobilenetScript.onload = () => {
          console.log("MobileNet model loaded client-side successfully.");
        };
        document.body.appendChild(mobilenetScript);
      };
      document.body.appendChild(tfScript);
    }
  }, []);

  const classifyImageWithMobileNet = (imgElement: HTMLImageElement): Promise<string> => {
    return new Promise((resolve) => {
      try {
        // @ts-ignore
        if (typeof mobilenet !== "undefined") {
          // @ts-ignore
          mobilenet.load().then((model) => {
            model.classify(imgElement).then((predictions: any[]) => {
              console.log("MobileNet Predictions:", predictions);
              if (predictions && predictions.length > 0) {
                resolve(predictions[0].className);
              } else {
                resolve("");
              }
            }).catch(() => resolve(""));
          }).catch(() => resolve(""));
        } else {
          resolve("");
        }
      } catch {
        resolve("");
      }
    });
  };

  const getCropFromPrediction = (pred: string): string => {
    const p = pred.toLowerCase();
    if (p.includes("banana")) return "banana";
    if (p.includes("corn") || p.includes("maize") || p.includes("ear of corn")) return "maize";
    if (p.includes("pepper") || p.includes("chili") || p.includes("chilli")) return "chilli";
    if (p.includes("tomato")) return "tomato";
    if (p.includes("cotton")) return "cotton";
    if (p.includes("rice") || p.includes("paddy")) return "paddy";
    if (p.includes("wheat")) return "wheat";
    if (p.includes("sugarcane")) return "sugarcane";
    if (p.includes("peanut") || p.includes("groundnut")) return "groundnut";
    if (p.includes("pomegranate")) return "pomegranate";
    if (p.includes("potato")) return "potato";
    if (p.includes("watermelon") || p.includes("melon")) return "watermelon";
    if (p.includes("mango")) return "mango";
    if (p.includes("apple")) return "apple";
    if (p.includes("grape")) return "grape";
    return "";
  };

  const call = useDetectDisease();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Diag | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

    const analyzeImageColors = (file: File): Promise<{
    greenPercentage: number;
    whitePercentage: number;
    yellowPercentage: number;
    darkPercentage: number;
    fileNameClues: string[];
  }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ greenPercentage: 0, whitePercentage: 0, yellowPercentage: 0, darkPercentage: 0, fileNameClues: [] });
            return;
          }
          canvas.width = 64;
          canvas.height = 64;
          ctx.drawImage(img, 0, 0, 64, 64);
          const imgData = ctx.getImageData(0, 0, 64, 64);
          const data = imgData.data;
          
          let greenCount = 0;
          let whiteCount = 0;
          let yellowCount = 0;
          let darkCount = 0;
          const totalPixels = 64 * 64;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i+1];
            const b = data[i+2];

            // White/light backgrounds (like graphics or papers)
            if (r > 200 && g > 200 && b > 200) {
              whiteCount++;
            }
            // Dark spots or very dark regions
            else if (r < 65 && g < 65 && b < 65) {
              darkCount++;
            }
            // Green leaves
            else if (g > r && g > b && g > 40) {
              greenCount++;
            }
            // Yellow/brown lesions
            else if (r > 90 && g > 80 && b < 80) {
              yellowCount++;
            }
          }

          URL.revokeObjectURL(img.src);

          const nameClues: string[] = [];
          const fn = file.name.toLowerCase();
          if (fn.includes("banana")) nameClues.push("banana");
          if (fn.includes("tomato")) nameClues.push("tomato");
          if (fn.includes("cotton")) nameClues.push("cotton");
          if (fn.includes("paddy") || fn.includes("rice")) nameClues.push("paddy");
          if (fn.includes("wheat")) nameClues.push("wheat");
          if (fn.includes("chilli") || fn.includes("pepper")) nameClues.push("chilli");
          if (fn.includes("maize") || fn.includes("corn")) nameClues.push("maize");
          if (fn.includes("groundnut") || fn.includes("peanut")) nameClues.push("groundnut");
          if (fn.includes("sugarcane")) nameClues.push("sugarcane");
          if (fn.includes("potato")) nameClues.push("potato");
          if (fn.includes("watermelon") || fn.includes("melon")) nameClues.push("watermelon");
          if (fn.includes("mango")) nameClues.push("mango");
          if (fn.includes("pomegranate")) nameClues.push("pomegranate");
          if (fn.includes("apple")) nameClues.push("apple");
          if (fn.includes("grape")) nameClues.push("grape");

          resolve({
            greenPercentage: Math.round((greenCount / totalPixels) * 100),
            whitePercentage: Math.round((whiteCount / totalPixels) * 100),
            yellowPercentage: Math.round((yellowCount / totalPixels) * 100),
            darkPercentage: Math.round((darkCount / totalPixels) * 100),
            fileNameClues: nameClues,
          });
        } catch (err) {
          resolve({ greenPercentage: 0, whitePercentage: 0, yellowPercentage: 0, darkPercentage: 0, fileNameClues: [] });
        }
      };
      img.onerror = () => {
        resolve({ greenPercentage: 0, whitePercentage: 0, yellowPercentage: 0, darkPercentage: 0, fileNameClues: [] });
      };
    });
  };

  const onPick = async (file?: File) => {
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) {
      toast.error("Image too large — keep under 6 MB.");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.onerror = () => rej(r.error);
      r.readAsDataURL(file);
    });
    setPreview(dataUrl);
    setResult(null);
    setScanning(true);
    try {
      const colorMeta = await analyzeImageColors(file);
      
      // Determine crop type client-side using MobileNet local neural network if crop is not manually selected
      let detectedCrop = crop;
      if (!detectedCrop) {
        const img = new Image();
        img.src = dataUrl;
        const predClass = await new Promise<string>((resolve) => {
          img.onload = async () => {
            const pred = await classifyImageWithMobileNet(img);
            resolve(pred);
          };
          img.onerror = () => resolve("");
        });
        if (predClass) {
          detectedCrop = getCropFromPrediction(predClass);
          if (detectedCrop) {
            // Automatically set crop highlight in UI
            setCrop(detectedCrop);
          }
        }
      }

      const out = await call({ 
        data: { 
          imageDataUrl: dataUrl, 
          crop: detectedCrop || undefined,
          metadata: colorMeta
        } 
      });setResult(out);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setScanning(false);
    }
  };
  const reset = () => {
    setPreview(null);
    setResult(null);
  };

  return (
    <AppLayout variant="disease">
      <PageHeader
        title="Disease Detection"
        subtitle="Snap a leaf, get instant diagnosis"
        emoji="🔬"
      />

      <div className="mb-4">
        <label className="text-xs font-semibold text-muted-foreground block mb-2">Select Crop to Scan</label>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "tomato", label: "Tomato", emoji: "🍅" },
            { id: "cotton", label: "Cotton", emoji: "🌿" },
            { id: "paddy", label: "Paddy", emoji: "🌾" },
            { id: "groundnut", label: "Groundnut", emoji: "🥜" },
            { id: "wheat", label: "Wheat", emoji: "🌾" },
            { id: "chilli", label: "Chilli", emoji: "🌶️" },
            { id: "maize", label: "Maize", emoji: "🌽" },
            { id: "banana", label: "Banana", emoji: "🍌" },
            { id: "sugarcane", label: "Sugarcane", emoji: "🎋" },
            { id: "potato", label: "Potato", emoji: "🥔" },
            { id: "watermelon", label: "Watermelon", emoji: "🍉" },
            { id: "mango", label: "Mango", emoji: "🥭" },
            { id: "pomegranate", label: "Pomegranate", emoji: "🍎" },
            { id: "apple", label: "Apple", emoji: "🍎" },
            { id: "grape", label: "Grape", emoji: "🍇" },
          ].map((item) => {
            const selected = crop === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCrop(selected ? "" : item.id)}
                className={`flex items-center gap-1.5 shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all ${
                  selected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-foreground border-border hover:bg-muted"
                }`}
              >
                <span>{item.emoji}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!preview ? (
        <div className="rounded-3xl border-2 border-dashed border-primary/40 bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <div
            className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full text-primary-foreground shadow-[var(--shadow-soft)]"
            style={{ background: "var(--gradient-primary)" }}
          >
            <Camera className="h-12 w-12" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">Upload or capture a leaf</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Clear, well-lit photo of the affected area works best
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => cameraRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)]"
              style={{ background: "var(--gradient-primary)" }}
            >
              <Camera className="h-4 w-4" /> Camera
            </button>
            <button
              onClick={() => uploadRef.current?.click()}
              className="flex items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
            >
              <Upload className="h-4 w-4" /> Upload
            </button>
          </div>
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
          <input
            ref={uploadRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onPick(e.target.files?.[0])}
          />
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <img src={preview} alt="Captured leaf" className="h-64 w-full object-cover" />
          <button
            onClick={reset}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {scanning && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Analyzing leaf…</p>
        </div>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div
            className="flex items-center gap-3 p-4"
            style={{
              background:
                result.confidence === 0 || result.name.toLowerCase().includes("no leaf")
                  ? "linear-gradient(135deg, #64748b 0%, #475569 100%)"
                  : result.severity === "None"
                    ? "var(--gradient-primary)"
                    : "var(--gradient-sunset)",
            }}
          >
            {result.confidence === 0 || result.name.toLowerCase().includes("no leaf") ? (
              <AlertCircle className="h-8 w-8 text-white" />
            ) : result.severity === "None" ? (
              <CheckCircle2 className="h-8 w-8 text-white" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-white" />
            )}
            <div className="text-white">
              <h3 className="text-lg font-bold">{result.name}</h3>
              <p className="text-xs opacity-90">
                {result.confidence > 0
                  ? `Severity: ${result.severity} · ${Math.round(result.confidence)}% confidence`
                  : "No Crop Leaf Identified"}
              </p>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Symptoms / Analysis
              </h4>
              <p className="text-sm text-muted-foreground">{result.symptoms}</p>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Treatment / Action
              </h4>
              <p className="text-sm text-muted-foreground">{result.treatment}</p>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Prevention / Recommendation
              </h4>
              <p className="text-sm text-muted-foreground">{result.prevent}</p>
            </div>
            <button
              onClick={reset}
              className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
            >
              Scan another photo
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
