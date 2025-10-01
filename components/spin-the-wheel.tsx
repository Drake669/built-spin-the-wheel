"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface Prize {
  label: string;
  color: string;
  textColor: string;
}

const prizes: Prize[] = [
  {
    label: "Free 1 month\nsubscription",
    color: "#e11d48",
    textColor: "#ffffff",
  },
  { label: "10%\ndiscount", color: "#8b5cf6", textColor: "#ffffff" },
  { label: "20%\ndiscount", color: "#eab308", textColor: "#000000" },
  { label: "5%\ndiscount", color: "#06b6d4", textColor: "#000000" },
  { label: "10gh\nairtime", color: "#ec4899", textColor: "#ffffff" },
  { label: "15gh\nairtime", color: "#f97316", textColor: "#ffffff" },
  { label: "20gh\nairtime", color: "#22c55e", textColor: "#ffffff" },
  { label: "Try\nagain", color: "#6366f1", textColor: "#ffffff" },
];

const SpinTheWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const cheeringAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    drawWheel();
    audioContextRef.current = new (window.AudioContext ||
      (window as typeof window & { webkitAudioContext: AudioContext })
        .webkitAudioContext)();

    cheeringAudioRef.current = new Audio("/crowd-cheering.mp3");
    cheeringAudioRef.current.volume = 0.7;
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = canvas.width / 2 - 10;
    const numberOfSegments = prizes.length;
    const anglePerSegment = (2 * Math.PI) / numberOfSegments;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    prizes.forEach((prize, index) => {
      const startAngle = index * anglePerSegment - Math.PI / 2;
      const endAngle = startAngle + anglePerSegment;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = prize.color;
      ctx.fill();

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = prize.textColor;
      ctx.font = "bold 16px monospace, sans-serif";

      const lines = prize.label.split("\n");
      const lineHeight = 20;
      const textRadius = radius * 0.65;

      lines.forEach((line, lineIndex) => {
        const yOffset = (lineIndex - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(line, textRadius, yOffset);
      });

      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    ctx.fillStyle = "#072E55";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.stroke();
  };

  const triggerConfetti = () => {
    const count = 200;
    const defaults = {
      origin: { y: 0.5 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55,
    });

    fire(0.2, {
      spread: 60,
    });

    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
    });

    fire(0.1, {
      spread: 120,
      startVelocity: 45,
    });
  };

  const playTickSound = () => {
    if (!audioContextRef.current) return;

    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  };

  const playCheering = () => {
    if (!cheeringAudioRef.current) return;

    cheeringAudioRef.current.currentTime = 0;
    cheeringAudioRef.current.play().catch((error) => {
      console.error("Error playing cheering sound:", error);
    });
  };

  const spinWheel = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    setResult(null);

    playTickSound();

    const spins = 5 + Math.random() * 5;
    const extraDegrees = Math.random() * 360;
    const totalRotation = spins * 360 + extraDegrees;
    const newRotation = rotation + totalRotation;

    const tickInterval = setInterval(() => {
      playTickSound();
    }, 100);

    if (wheelRef.current) {
      wheelRef.current.style.transition =
        "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
      wheelRef.current.style.transform = `rotate(${newRotation}deg)`;
    }

    setTimeout(() => {
      clearInterval(tickInterval);

      const finalRotation = newRotation % 360;
      const anglePerSegment = 360 / prizes.length;
      const adjustedRotation = (360 - finalRotation + 90) % 360;
      const winningIndex =
        Math.floor(adjustedRotation / anglePerSegment) % prizes.length;
      const winningPrize = prizes[winningIndex].label.replace("\n", " ");

      setRotation(newRotation);
      setResult(winningPrize);
      setIsSpinning(false);

      if (!winningPrize.includes("Try again")) {
        playCheering();
        triggerConfetti();
      }

      if (wheelRef.current) {
        wheelRef.current.style.transition = "none";
      }
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-8 p-8 font-mono">
      <div className="w-full max-w-xl mb-6">
        <img
          src="/customer-service-week.webp"
          alt="Built Customer Service Week"
          className="w-full h-full object-contain rounded-xl shadow-2xl"
        />
      </div>

      <h1 className="text-4xl md:text-5xl font-bold font-mono text-primary text-center">
        Spin to Win!
      </h1>

      <div className="relative">
        {/* Pointer */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-t-[40px] border-t-primary drop-shadow-lg" />
        </div>

        {/* Wheel Container */}
        <div className="relative bg-card rounded-full p-4 shadow-2xl border-4 border-border">
          <div ref={wheelRef} style={{ transform: `rotate(${rotation}deg)` }}>
            <canvas ref={canvasRef} width={500} height={500} />
          </div>
        </div>
      </div>

      <Button
        onClick={spinWheel}
        disabled={isSpinning}
        size="lg"
        className="text-lg px-8 py-6 font-bold bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {isSpinning ? "Spinning..." : "SPIN THE WHEEL"}
      </Button>

      {result && (
        <div className="mt-4 p-6 bg-card rounded-lg border-2 border-primary shadow-lg animate-in fade-in zoom-in duration-500">
          <p className="text-2xl font-bold text-center text-foreground">
            🎉 You won: <span className="text-primary">{result}</span> 🎉
          </p>
        </div>
      )}
    </div>
  );
};

export default SpinTheWheel;
