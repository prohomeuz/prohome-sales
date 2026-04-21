import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";

const STT_URL           = "/uzbekvoice/api/v1/stt";
const API_KEY           = import.meta.env.VITE_UZBEKVOICE_KEY;
const SILENCE_THRESHOLD = 12;    // 0-255: ovoz bor/yo'q chegarasi
const SILENCE_DELAY_MS  = 1500;  // gapirib to'xtagandan 1.5s keyin yuborish
const MAX_RECORD_MS     = 7000;  // max bir yozuv (ms)

// ─── Navigatsiya buyruq parser ─────────────────────────────────────────────────
function parseCommand(text) {
  const t = text.toLowerCase().replace(/[''`']/g, "").trim();

  if (["bosh sahifa", "dashboard", "statistika", "asosiy sahifa"].some(w => t.includes(w)))
    return { type: "navigate", path: "/dashboard" };

  if (["boshqaruv panel", "boshqaruv", "loyihalar", "tjm royxat"].some(w => t.includes(w)))
    return { type: "navigate", path: "/" };

  if (["tjm", "тжм", "turar joy"].some(w => t.includes(w)))
    return { type: "navigate", path: "/tjm" };

  if (["shartnoma", "kontrakt", "contract"].some(w => t.includes(w)))
    return { type: "navigate", path: "/contracts" };

  // CRM – UzbekVoice ba'zan ingliz harflarni boshqacha yozishi mumkin
  if (["crm", "si ar em", "kliyent", "mijozlar", "клиент"].some(w => t.includes(w)))
    return { type: "navigate", path: "/crm" };

  if (["kompaniya", "kompaniyalar", "company"].some(w => t.includes(w)))
    return { type: "navigate", path: "/company" };

  if (["sozlama", "nastroyka", "setting", "profil"].some(w => t.includes(w)))
    return { type: "navigate", path: "/settings" };

  // Sotuv menejerlar sahifasi
  if (["sotuv menejer", "salesmanager", "menejerlar", "sotuvchilar", "sales"].some(w => t.includes(w)))
    return { type: "navigate", path: "/salesmanager" };

  // ROP sahifasi
  if (["rop", "savdo boshlig", "sotuv boshlig"].some(w => t.includes(w)))
    return { type: "navigate", path: "/rop" };

  return null;
}

// ─── MediaRecorder mime ────────────────────────────────────────────────────────
function getBestMime() {
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/ogg", "audio/mp4"])
    if (MediaRecorder.isTypeSupported(t)) return t;
  return "";
}

// ─── UzbekVoice ga yuborish ───────────────────────────────────────────────────
async function sendToSTT(blob) {
  if (!API_KEY) { toast.error("VITE_UZBEKVOICE_KEY topilmadi"); return null; }
  const mime = blob.type || "audio/webm";
  const ext  = mime.includes("ogg") ? "ogg" : mime.includes("mp4") ? "mp4" : "webm";

  const form = new FormData();
  form.append("file",            blob, `voice.${ext}`);
  form.append("language",        "uz");
  form.append("model",           "general");
  form.append("blocking",        "true");
  form.append("return_offsets",  "false");
  form.append("run_diarization", "false");

  const res = await fetch(STT_URL, {
    method:  "POST",
    headers: { Authorization: `Bearer ${API_KEY}` },
    body:    form,
  });
  if (res.status === 402) throw new Error("PAYMENT_REQUIRED");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data?.result?.text || data?.result?.conversation_text || "").trim();
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
// status: "idle" | "listening" | "recording" | "processing"
//   idle      – o'chirilgan
//   listening – yoqilgan, ovoz kutilmoqda (API chaqirilmaydi!)
//   recording – gapirilmoqda, yozilmoqda
//   processing – UzbekVoice ga yuborildi

export function useVoiceCommand({ onCommand }) {
  const [status,  setStatus]  = useState("idle");
  const [enabled, setEnabled] = useState(false); // foydalanuvchi yoqdi/o'chirdi
  const activeRef    = useRef(false);
  const streamRef    = useRef(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  // ─── VAD + yozuv sikli ──────────────────────────────────────────────────────
  const startListening = useCallback((stream) => {
    const mime      = getBestMime();
    const audioCtx  = new AudioContext();
    const source    = audioCtx.createMediaStreamSource(stream);
    const analyser  = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);

    function getVolume() {
      analyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      return sum / data.length;
    }

    let rec          = null;
    let chunks       = [];
    let isRecording  = false;
    let silenceTimer = null;
    let maxTimer     = null;

    function stopRec() {
      clearTimeout(silenceTimer);
      clearTimeout(maxTimer);
      silenceTimer = null;
      if (rec?.state === "recording") rec.stop();
    }

    async function onStop() {
      isRecording = false;
      if (!activeRef.current) { audioCtx.close(); return; }
      setStatus("processing");

      try {
        const blob = new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" });
        const text = await sendToSTT(blob);
        if (text) {
          const command = parseCommand(text);
          if (command) onCommandRef.current?.(command, text);
        }
      } catch (err) {
        if (err?.message === "PAYMENT_REQUIRED") {
          toast.error("UzbekVoice balansi tugagan — navigatsiya ishlamaydi, tema boshqaruvi davom etadi");
          activeRef.current = false;
          stream.getTracks().forEach(t => t.stop());
          streamRef.current = null;
          setStatus("idle");
          // enabled = true qoladi → useThemeSpeech (Chrome) ishlashda davom etadi
          audioCtx.close();
          clearInterval(vadId);
          return;
        }
        if (err?.name !== "AbortError") toast.error("UzbekVoice bilan aloqa uzildi");
      }

      if (activeRef.current) setStatus("listening");
    }

    function startRec() {
      if (isRecording || !activeRef.current) return;
      isRecording = true;
      chunks = [];
      rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      rec.ondataavailable = e => { if (e.data.size > 0) chunks.push(e.data); };
      rec.onstop = onStop;
      rec.start();
      setStatus("recording");

      // Maksimal uzunlik himoyasi
      maxTimer = setTimeout(stopRec, MAX_RECORD_MS);
    }

    // VAD: har 80ms audio darajasini tekshiradi
    const vadId = setInterval(() => {
      if (!activeRef.current) {
        clearInterval(vadId);
        stopRec();
        audioCtx.close();
        return;
      }

      const vol = getVolume();

      if (vol > SILENCE_THRESHOLD) {
        // Ovoz bor
        clearTimeout(silenceTimer);
        silenceTimer = null;
        if (!isRecording) startRec();
      } else {
        // Ovoz yo'q
        if (isRecording && !silenceTimer) {
          silenceTimer = setTimeout(() => {
            silenceTimer = null;
            stopRec();
          }, SILENCE_DELAY_MS);
        }
      }
    }, 80);

    setStatus("listening");
  }, []);

  // ─── Toggle ─────────────────────────────────────────────────────────────────
  const toggle = useCallback(async () => {
    if (enabled) {
      // O'chirish
      activeRef.current = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      setStatus("idle");
      setEnabled(false);
      return;
    }

    // Yoqish
    if (!navigator.mediaDevices?.getUserMedia) {
      toast.error("Mikrofon funksiyasi qo'llab-quvvatlanmaydi");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      activeRef.current = true;
      setEnabled(true); // tema speech shu yerdan boshlanadi
      startListening(stream);
    } catch (err) {
      toast.error(err?.name === "NotAllowedError" ? "Mikrofon ruxsati berilmadi" : "Mikrofon ishga tushmadi");
    }
  }, [enabled, startListening]);

  return { status, enabled, toggle };
}
