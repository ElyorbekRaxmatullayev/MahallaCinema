"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { CheckCircle2, XCircle, Camera } from "lucide-react";
import { scanBooking } from "@/app/admin/scan-actions";
import { ZONE_LABELS } from "@/lib/zones";

type ScanResult = Awaited<ReturnType<typeof scanBooking>>;

export default function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lockRef = useRef(false);
  const lastDecodeRef = useRef(0);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function handleDecoded(data: string) {
      if (lockRef.current) return;
      lockRef.current = true;
      setScanning(false);
      const res = await scanBooking(data);
      if (!cancelled) setResult(res);
    }

    const DECODE_INTERVAL_MS = 150;

    function tick() {
      const now = performance.now();
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video && canvas && now - lastDecodeRef.current >= DECODE_INTERVAL_MS && video.readyState === video.HAVE_ENOUGH_DATA) {
        lastDecodeRef.current = now;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && !lockRef.current) {
            handleDecoded(code.data);
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        tick();
      } catch {
        setError("Не удалось получить доступ к камере");
      }
    }

    start();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function reset() {
    setResult(null);
    setScanning(true);
    lockRef.current = false;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black aspect-square max-w-sm mx-auto w-full">
        <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {!scanning && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
            <Camera className="text-white/40" size={48} />
          </div>
        )}
      </div>

      {error && <div className="text-center text-red-400 text-sm">{error}</div>}

      {result && (
        <div
          className={`rounded-2xl p-4 border ${
            result.success ? "border-[#22c55e]/30 bg-[#22c55e]/10" : "border-red-500/30 bg-red-500/10"
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            {result.success ? (
              <CheckCircle2 className="text-[#22c55e]" size={20} />
            ) : (
              <XCircle className="text-red-400" size={20} />
            )}
            <span className={`font-bold ${result.success ? "text-[#22c55e]" : "text-red-400"}`}>
              {result.success ? "Подтверждено" : result.error}
            </span>
          </div>
          {result.booking && (
            <div className="text-sm text-gray-300 flex flex-col gap-1">
              <div>{result.booking.eventTitle}</div>
              <div className="text-xs text-gray-400">
                {result.booking.userName || "Без имени"} · {ZONE_LABELS[result.booking.zone] ?? result.booking.zone} x
                {result.booking.quantity}
              </div>
            </div>
          )}
          <button onClick={reset} className="w-full bg-white/10 text-white font-medium py-2.5 rounded-xl mt-3">
            Сканировать ещё
          </button>
        </div>
      )}
    </div>
  );
}
