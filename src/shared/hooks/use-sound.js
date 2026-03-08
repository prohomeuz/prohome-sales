import { useRef, useEffect } from "react";

export default function useSound(url) {
  const audioContextRef = useRef(null);
  const bufferRef = useRef(null);

  useEffect(() => {
    audioContextRef.current = new (window.AudioContext ||
      window.webkitAudioContext)();

    fetch(url)
      .then((res) => res.arrayBuffer())
      .then((data) => audioContextRef.current.decodeAudioData(data))
      .then((buffer) => {
        bufferRef.current = buffer;
      });
  }, [url]);

  function sound() {
    const ctx = audioContextRef.current;

    if (!ctx || !bufferRef.current) return;

    const source = ctx.createBufferSource();
    source.buffer = bufferRef.current;
    source.connect(ctx.destination);
    source.start(0);
  }

  return { sound };
}
