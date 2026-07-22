import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, PageHeader } from "@/components/AppLayout";
import { useRef, useState } from "react";
import { useDetectDisease } from "@/lib/ai-client";
import { Camera, Upload, CheckCircle2, AlertTriangle, Loader2, X } from "lucide-react";
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
  const call = useDetectDisease();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<Diag | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [crop, setCrop] = useState("");
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

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
      const out = await call({ data: { imageDataUrl: dataUrl, crop: crop || undefined } });
      setResult(out);
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

      <div className="mb-3">
        <label className="text-xs font-semibold text-muted-foreground">Crop (optional)</label>
        <input
          value={crop}
          onChange={(e) => setCrop(e.target.value)}
          placeholder="e.g. tomato, cotton, paddy"
          className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
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
          <p className="mt-3 text-sm text-muted-foreground">AI is analyzing your leaf…</p>
        </div>
      )}

      {result && (
        <div className="mt-6 overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div
            className="flex items-center gap-3 p-4"
            style={{
              background:
                result.severity === "None" ? "var(--gradient-primary)" : "var(--gradient-sunset)",
            }}
          >
            <AlertTriangle className="h-8 w-8 text-white" />
            <div className="text-white">
              <h3 className="text-lg font-bold">{result.name}</h3>
              <p className="text-xs opacity-90">
                Severity: {result.severity} · {Math.round(result.confidence)}% confidence
              </p>
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Symptoms
              </h4>
              <p className="text-sm text-muted-foreground">{result.symptoms}</p>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Treatment
              </h4>
              <p className="text-sm text-muted-foreground">{result.treatment}</p>
            </div>
            <div>
              <h4 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Prevention
              </h4>
              <p className="text-sm text-muted-foreground">{result.prevent}</p>
            </div>
            <button
              onClick={reset}
              className="w-full rounded-xl border border-border bg-card py-3 text-sm font-semibold text-foreground"
            >
              Scan another leaf
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
