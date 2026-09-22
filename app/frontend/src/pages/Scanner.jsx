import React, { useRef, useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, Camera, ScanLine, CheckCircle2, Loader2, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import api from "@/lib/api";
import { toast } from "sonner";

const STEPS = [
    "Detecting label",
    "Reading chemical information",
    "Identifying hazard symbols",
    "Evaluating exposure factors",
    "Calculating risk score",
];

export default function Scanner() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const initialTab = sp.get("mode") === "camera" ? "camera" : "upload";
    const [tab, setTab] = useState(initialTab);
    const [preview, setPreview] = useState(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [stepIdx, setStepIdx] = useState(0);
    const fileInput = useRef(null);
    const cameraFileInput = useRef(null);
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [cameraOn, setCameraOn] = useState(false);

    useEffect(() => {
        if (tab !== "camera") stopCamera();
        return stopCamera;
    }, [tab]); // eslint-disable-line

    useEffect(() => {
        if (!analyzing) return;
        setStepIdx(0);
        const t = setInterval(() => setStepIdx((i) => Math.min(i + 1, STEPS.length - 1)), 900);
        return () => clearInterval(t);
    }, [analyzing]);

    const onFile = (f) => {
        if (!f) return;
        if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { toast.error("Please choose a JPG, PNG or WEBP image"); return; }
        if (f.size > 8 * 1024 * 1024) { toast.error("Image too large (max 8MB)"); return; }
        const reader = new FileReader();
        reader.onload = () => setPreview(reader.result);
        reader.readAsDataURL(f);
    };

    const onDrop = (e) => {
        e.preventDefault();
        onFile(e.dataTransfer.files?.[0]);
    };

    const startCamera = async () => {
        // Mobile browsers block live camera APIs on an HTTP LAN address.
        if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
            cameraFileInput.current?.click();
            return;
        }
        try {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
            } catch (error) {
                if (error?.name !== "OverconstrainedError" && error?.name !== "NotFoundError") throw error;
                stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            }
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setCameraOn(true);
        } catch (error) {
            if (error?.name === "NotAllowedError") {
                toast.error("Camera permission was denied. Allow camera access in your browser settings.");
            } else {
                toast.error("Camera unavailable. Try uploading an image instead.");
            }
        }
    };
    const stopCamera = () => {
        streamRef.current?.getTracks?.().forEach((t) => t.stop());
        streamRef.current = null;
        setCameraOn(false);
    };
    const capture = () => {
        const video = videoRef.current;
        if (!video) return;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth; canvas.height = video.videoHeight;
        canvas.getContext("2d").drawImage(video, 0, 0);
        setPreview(canvas.toDataURL("image/jpeg", 0.9));
        stopCamera();
    };

    const analyze = async () => {
        if (!preview) return;
        setAnalyzing(true);
        try {
            const { data } = await api.post("/scans", { image_base64: preview, filename: "scan.jpg" });
            if (data.error) {
                toast.error(data.error);
                setAnalyzing(false);
                return;
            }
            toast.success("Analysis complete");
            nav(`/result/${data.scan_id}`);
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Analysis failed");
            setAnalyzing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <header className="cs-rise">
                <div className="text-xs tracking-widest uppercase text-cyan-400">Scanner</div>
                <h1 className="font-display text-3xl sm:text-4xl font-bold mt-1">Chemical Risk Scanner</h1>
                <p className="text-muted-foreground mt-1">Position the product label clearly. AI will do the rest.</p>
            </header>

            <div className="grid lg:grid-cols-2 gap-5">
                <div className="cs-glass p-5">
                    <Tabs value={tab} onValueChange={setTab}>
                        <TabsList className="grid grid-cols-2 w-full rounded-xl bg-secondary">
                            <TabsTrigger value="upload" data-testid="tab-upload" className="rounded-lg gap-2"><Upload className="w-4 h-4" /> Upload</TabsTrigger>
                            <TabsTrigger value="camera" data-testid="tab-camera" className="rounded-lg gap-2"><Camera className="w-4 h-4" /> Camera</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="mt-4">
                            <div
                                data-testid="drop-zone"
                                onDrop={onDrop} onDragOver={(e)=>e.preventDefault()}
                                className="relative rounded-2xl border-2 border-dashed border-border p-10 text-center hover:border-cyan-400/60 transition-colors cursor-pointer"
                                onClick={()=>fileInput.current?.click()}
                            >
                                <input ref={fileInput} data-testid="file-input" type="file" accept="image/*" onChange={(e)=>onFile(e.target.files?.[0])} className="hidden" />
                                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 border border-cyan-400/30 grid place-items-center mb-3">
                                    <Upload className="w-6 h-6 text-cyan-400" />
                                </div>
                                <div className="font-display text-lg font-semibold">Drag & drop image here</div>
                                <div className="text-sm text-muted-foreground mt-1">or click to browse</div>
                                <div className="text-[11px] text-muted-foreground mt-3">Supported: JPG, PNG, WEBP · Max 8MB</div>
                            </div>
                        </TabsContent>

                        <TabsContent value="camera" className="mt-4">
                            <input id="camera-file-input" ref={cameraFileInput} data-testid="camera-file-input" type="file" accept="image/*" capture="environment" onChange={(e)=>onFile(e.target.files?.[0])} className="hidden" />
                            <div className="relative rounded-2xl overflow-hidden bg-black aspect-[4/3]" data-testid="camera-view">
                                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                {!cameraOn && (
                                    <div className="absolute inset-0 grid place-items-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <Button data-testid="start-camera-btn" onClick={startCamera} className="rounded-xl gap-2">
                                                <Camera className="w-4 h-4" /> Start Camera
                                            </Button>
                                            <label htmlFor="camera-file-input" className="text-xs text-cyan-300 underline underline-offset-4 cursor-pointer">
                                                Use device camera or choose photo
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {cameraOn && (
                                    <>
                                        <div className="absolute inset-8 rounded-2xl border border-cyan-400/60 pointer-events-none">
                                            <span className="cs-corner cs-corner-tl" />
                                            <span className="cs-corner cs-corner-tr" />
                                            <span className="cs-corner cs-corner-bl" />
                                            <span className="cs-corner cs-corner-br" />
                                        </div>
                                        <div className="absolute bottom-3 left-0 right-0 text-center text-xs text-white/90">Position the chemical label inside the frame</div>
                                    </>
                                )}
                            </div>
                            {cameraOn && (
                                <div className="mt-3 flex gap-2 justify-center">
                                    <Button data-testid="capture-btn" onClick={capture} className="rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold">
                                        <ScanLine className="w-4 h-4" /> Capture & Analyze
                                    </Button>
                                    <Button variant="outline" onClick={stopCamera} className="rounded-xl">Stop</Button>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="cs-glass p-5 min-h-[360px]" data-testid="preview-pane">
                    {!preview && !analyzing && (
                        <div className="h-full min-h-[300px] grid place-items-center text-center text-sm text-muted-foreground">
                            <div>
                                <ScanLine className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                                Your selected image will appear here.
                            </div>
                        </div>
                    )}

                    {preview && !analyzing && (
                        <div>
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] cs-scan-beam">
                                <img src={preview} alt="Selected label" className="w-full h-full object-cover" />
                                <button data-testid="clear-preview-btn" onClick={()=>setPreview(null)} className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <Button onClick={analyze} data-testid="analyze-btn" className="mt-4 w-full h-11 rounded-xl gap-2 bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-900 font-semibold hover:from-cyan-300 hover:to-emerald-300">
                                <Sparkles className="w-4 h-4" /> Analyze with AI
                            </Button>
                            <p className="text-[11px] text-muted-foreground mt-3 text-center italic">AI-generated assessment — verify with the official SDS.</p>
                        </div>
                    )}

                    {analyzing && (
                        <div>
                            <div className="relative rounded-xl overflow-hidden aspect-[4/3] cs-scan-beam">
                                <img src={preview} alt="Analyzing" className="w-full h-full object-cover" />
                            </div>
                            <div className="mt-4 space-y-2">
                                <div className="text-xs tracking-widest uppercase text-cyan-400">Analyzing Product...</div>
                                {STEPS.map((s, i) => (
                                    <div key={s} data-testid={`analyze-step-${i}`} className={`flex items-center gap-2 text-sm ${i <= stepIdx ? "text-foreground" : "text-muted-foreground/60"}`}>
                                        {i < stepIdx ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                                         i === stepIdx ? <Loader2 className="w-4 h-4 animate-spin text-cyan-400" /> :
                                         <div className="w-4 h-4 rounded-full border border-border" />}
                                        {s}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
