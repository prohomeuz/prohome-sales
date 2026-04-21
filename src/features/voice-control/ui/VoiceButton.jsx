/**
 * @file Mikrofon tugmasi — Chrome Speech API orqali dark/light mode.
 * @module features/voice-control/ui/VoiceButton
 *
 * Tugmani bosib yoqiladi. Yoqilganda "dark" yoki "light" desangiz tema o'zgaradi.
 */

import { useCallback, useEffect } from "react";
import { Mic, MicOff } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useVoiceCommand } from "@/features/voice-control/model/use-voice-command";

// Tugma bosilganda user gesture bo'ladi — AudioContext muammosiz ishlaydi
function playActivationSound() {
  try {
    const ctx = new AudioContext();
    [
      { freq: 660,  t: 0.00, dur: 0.09, vol: 0.18 },
      { freq: 880,  t: 0.10, dur: 0.09, vol: 0.20 },
      { freq: 1100, t: 0.20, dur: 0.12, vol: 0.15 },
    ].forEach(({ freq, t, dur, vol }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const s = ctx.currentTime + t;
      gain.gain.setValueAtTime(0, s);
      gain.gain.linearRampToValueAtTime(vol, s + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, s + dur);
      osc.start(s);
      osc.stop(s + dur + 0.05);
    });
    setTimeout(() => ctx.close(), 600);
  } catch { /* ignore */ }
}

function applyTheme(value) {
  const root   = document.documentElement;
  const isDark = root.classList.contains("dark");
  if (value === "dark"  &&  isDark) return;
  if (value === "light" && !isDark) return;
  if (value === "dark")  { root.classList.add("dark");    localStorage.setItem("theme", "dark");  }
  if (value === "light") { root.classList.remove("dark"); localStorage.setItem("theme", "light"); }
}

function useThemeSpeech(enabled) {
  useEffect(() => {
    if (!enabled) return;

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const recognition = new SR();
    recognition.lang            = "en-US";
    recognition.continuous      = false;
    recognition.interimResults  = false;

    let active = true;

    function tryStart() {
      if (!active) return;
      try { recognition.start(); } catch { /* ignore */ }
    }

    recognition.onresult = (e) => {
      const t = e.results[0][0].transcript.toLowerCase().trim();
      if (t.includes("dark"))  applyTheme("dark");
      else if (t.includes("light")) applyTheme("light");
    };

    recognition.onend   = () => { if (active) setTimeout(tryStart, 300);  };
    recognition.onerror = (e) => {
      if (active && e.error !== "aborted") setTimeout(tryStart, 500);
    };

    tryStart();
    return () => { active = false; try { recognition.abort(); } catch { /* ignore */ } };
  }, [enabled]);
}

export function MicVoiceButton() {
  const { enabled, toggle } = useVoiceCommand();
  useThemeSpeech(enabled);

  const handleClick = useCallback(() => {
    if (!enabled) playActivationSound(); // faqat yoqilganda tovush
    toggle();
  }, [enabled, toggle]);

  return (
    <div className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        title={enabled ? "Mikrofon yoqiq — \"dark\" yoki \"light\" deng" : "Mikrofon o'chiq — yoqish uchun bosing"}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-md transition-colors [&_svg]:size-5!",
          enabled
            ? "text-green-500 bg-green-500/10"
            : "text-muted-foreground hover:bg-accent hover:text-foreground",
        )}
      >
        {enabled ? <Mic /> : <MicOff />}
      </button>
      <span className="pointer-events-none absolute -top-0.5 -right-0.5 rounded-full bg-amber-500 px-1 py-px text-[8px] font-bold leading-none text-white">
        BETA
      </span>
    </div>
  );
}
