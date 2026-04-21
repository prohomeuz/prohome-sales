import { useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/shared/lib/utils";
import { useVoiceCommand } from "@/features/voice-control/model/use-voice-command";

function applyTheme(value) {
  const root   = document.documentElement;
  const isDark = root.classList.contains("dark");
  if (value === "dark"   &&  isDark) return;
  if (value === "light"  && !isDark) return;
  if (value === "dark")   { root.classList.add("dark");    localStorage.setItem("theme", "dark"); }
  if (value === "light")  { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
  if (value === "toggle") { const d = root.classList.toggle("dark"); localStorage.setItem("theme", d ? "dark" : "light"); }
}

const PAGE_NAMES = {
  "/dashboard": "Bosh sahifa",
  "/":          "Loyihalar",
  "/tjm":       "TJM",
  "/contracts": "Shartnomalar",
  "/crm":       "CRM",
  "/company":   "Kompaniyalar",
  "/settings":  "Sozlamalar",
};

// ─── Web Speech API: faqat toggle yoqilganda dark/light tema ─────────────────
function useThemeSpeech(enabled) {
  useEffect(() => {
    if (!enabled) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    let active = true;

    function tryStart() {
      if (!active) return;
      try { recognition.start(); } catch { /* ignore already-started */ }
    }

    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript.toLowerCase().trim();
      if (t.includes("dark"))  applyTheme("dark");
      else if (t.includes("light")) applyTheme("light");
    };

    recognition.onend  = () => { if (active) setTimeout(tryStart, 300); };
    recognition.onerror = (e) => { if (active && e.error !== "aborted") setTimeout(tryStart, 500); };

    tryStart();
    return () => { active = false; try { recognition.abort(); } catch {} };
  }, [enabled]);
}

export function MicVoiceButton() {
  const navigate = useNavigate();

  const handleCommand = useCallback((command, recognizedText) => {
    if (command.type === "navigate") {
      const label = PAGE_NAMES[command.path] ?? command.path;
      toast.success(`${label} sahifasiga o'tilmoqda…`);
      navigate(command.path);
    } else if (command.type === "theme") {
      applyTheme(command.value);
    }
  }, [navigate]);

  const { status, enabled, toggle } = useVoiceCommand({ onCommand: handleCommand });

  // enabled — foydalanuvchi toggle ni yoqdi (UzbekVoice ishlamasada tema ishlaydi)
  useThemeSpeech(enabled);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggle}
        title={
          status === "listening"   ? "Tinglayapman — gapiring…" :
          status === "recording"   ? "Yozilmoqda…" :
          status === "processing"  ? "Tahlil qilinmoqda…" :
          "Ovozli buyruq — bosing"
        }
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md transition-colors [&_svg]:size-5!",
          status === "recording"
            ? "text-green-500 bg-green-500/10 animate-pulse"
            : enabled
              ? status === "processing"
                ? "text-amber-500 bg-amber-500/10"
                : "text-green-500 bg-green-500/10"
              : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {enabled ? <Mic /> : <MicOff />}
      </button>
      <span className="pointer-events-none absolute -right-0.5 -top-0.5 rounded-full bg-amber-500 px-1 py-0.5 text-[8px] font-bold leading-none text-white">
        BETA
      </span>
    </div>
  );
}
