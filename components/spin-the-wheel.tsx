"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

interface Prize {
  label: string;
  color: string;
  textColor: string;
}

interface EligibilityData {
  eligible: boolean;
  hasWonPrize?: boolean;
  numberOfSpins?: number;
  reason?: string;
  activity?: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    prize: string | null;
    wheelId: string;
  };
}

const prizes: Prize[] = [
  {
    label: "Subscription\nupgrade",
    color: "#e11d48",
    textColor: "#ffffff",
  },
  {
    label: "Thanks for\nparticipating",
    color: "#6366f1",
    textColor: "#ffffff",
  },
  {
    label: "Free Accounting\nTax Consultation",
    color: "#f97316",
    textColor: "#ffffff",
  },
  {
    label: "Thanks for\nparticipating",
    color: "#6366f1",
    textColor: "#ffffff",
  },
  { label: "T-Shirt", color: "#eab308", textColor: "#000000" },
  {
    label: "Thanks for\nparticipating",
    color: "#6366f1",
    textColor: "#ffffff",
  },
  {
    label: "GH100 E-Payment\nsubscription",
    color: "#06b6d4",
    textColor: "#ffffff",
  },
];

interface SpinTheWheelProps {
  wheelId: string;
  email: string;
  name: string;
  phoneNumber: string;
  initialEligibilityData: EligibilityData;
}

const SpinTheWheel = ({
  wheelId,
  email,
  name,
  phoneNumber,
  initialEligibilityData,
}: SpinTheWheelProps) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const [canSpin, setCanSpin] = useState(true);
  const [activityId, setActivityId] = useState<string | null>(
    initialEligibilityData?.activity?.id || null
  );
  const [numberOfSpins, setNumberOfSpins] = useState(
    initialEligibilityData?.numberOfSpins || 0
  );
  const [message, setMessage] = useState<string | null>(null);
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

    const handleResize = () => {
      drawWheel();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isMobile = window.innerWidth < 768;
    const canvasSize = isMobile ? Math.min(window.innerWidth - 40, 350) : 500;

    canvas.width = canvasSize;
    canvas.height = canvasSize;

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
      ctx.lineWidth = isMobile ? 2 : 3;
      ctx.stroke();

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(startAngle + anglePerSegment / 2);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = prize.textColor;

      const fontSize = isMobile ? 12 : 16;
      ctx.font = `bold ${fontSize}px monospace, sans-serif`;

      const lines = prize.label.split("\n");
      const lineHeight = isMobile ? 16 : 20;
      const textRadius = radius * 0.65;

      lines.forEach((line, lineIndex) => {
        const yOffset = (lineIndex - (lines.length - 1) / 2) * lineHeight;
        ctx.fillText(line, textRadius, yOffset);
      });

      ctx.restore();
    });

    const centerRadius = isMobile ? 20 : 30;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#072E55";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = isMobile ? 3 : 4;
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

  const updateOrCreateActivity = async (
    prize: string,
    isWinningPrize: boolean
  ) => {
    try {
      const newNumberOfSpins = numberOfSpins + 1;

      if (!activityId) {
        const response = await fetch("/api/spin-activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            phoneNumber,
            wheelId,
            prize: isWinningPrize ? prize : null,
            hasWonPrize: isWinningPrize,
            numberOfSpins: newNumberOfSpins,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error("Failed to save your spin", {
            description:
              data.error || "Something went wrong. Please try again.",
          });
          return;
        }

        if (data.success) {
          setActivityId(data.activity.id);
          setNumberOfSpins(newNumberOfSpins);
        }
      } else {
        const response = await fetch("/api/spin-activity", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activityId,
            prize: isWinningPrize ? prize : null,
            hasWonPrize: isWinningPrize,
            numberOfSpins: newNumberOfSpins,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          toast.error("Failed to update your activity", {
            description:
              data.error || "Something went wrong. Please try again.",
          });
          return;
        }

        if (data.success) {
          setNumberOfSpins(newNumberOfSpins);
        }
      }

      setCanSpin(false);

      if (isWinningPrize) {
        setMessage(
          "Congratulations! You've won a prize! We will contact you shortly with the next steps to claim your reward."
        );
        toast.success("🎉 Congratulations!", {
          description: `You won: ${prize}! We'll contact you soon.`,
        });
      } else {
        setMessage("Thank you for participating!");
        toast.info("Thank you for participating!", {
          description: "Better luck next time!",
        });
      }
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("Network error", {
        description: "Unable to save your spin. Please check your connection.",
      });
    }
  };

  const spinWheel = () => {
    if (isSpinning || !canSpin) return;

    setIsSpinning(true);
    setResult(null);
    setMessage(null);

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

    setTimeout(async () => {
      clearInterval(tickInterval);

      const finalRotation = newRotation % 360;
      const anglePerSegment = 360 / prizes.length;
      const adjustedRotation = (360 - finalRotation) % 360;
      const winningIndex =
        Math.floor(adjustedRotation / anglePerSegment) % prizes.length;
      const winningPrize = prizes[winningIndex].label.replace("\n", " ");
      const isWinningPrize = !winningPrize.includes("Thanks for participating");

      setRotation(newRotation);
      setResult(winningPrize);
      setIsSpinning(false);

      if (isWinningPrize) {
        playCheering();
        triggerConfetti();
      }

      if (wheelRef.current) {
        wheelRef.current.style.transition = "none";
      }

      await updateOrCreateActivity(winningPrize, isWinningPrize);
    }, 4000);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 sm:gap-6 lg:gap-8 p-4 sm:p-6 lg:p-8 font-mono min-h-screen">
      <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-mono text-primary text-center px-4">
        Spin to Win!
      </h1>

      <div className="relative w-full max-w-[500px]">
        <div className="absolute -top-3 sm:-top-4 lg:-top-6 left-1/2 -translate-x-1/2 z-10">
          <div className="w-0 h-0 border-l-[12px] sm:border-l-[16px] lg:border-l-[20px] border-l-transparent border-r-[12px] sm:border-r-[16px] lg:border-r-[20px] border-r-transparent border-t-[24px] sm:border-t-[32px] lg:border-t-[40px] border-t-primary drop-shadow-lg" />
        </div>

        <div className="relative bg-card rounded-full p-2 sm:p-3 lg:p-4 shadow-2xl border-2 sm:border-3 lg:border-4 border-border mx-auto">
          <div ref={wheelRef} style={{ transform: `rotate(${rotation}deg)` }}>
            <canvas
              ref={canvasRef}
              className="w-full h-auto max-w-full"
              style={{ maxWidth: "100%", height: "auto" }}
            />
          </div>

          <button
            onClick={spinWheel}
            disabled={isSpinning || !canSpin}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] lg:w-[70px] lg:h-[70px] rounded-full z-20 flex items-center justify-center font-bold text-white transition-all duration-300 ${
              isSpinning || !canSpin
                ? "cursor-not-allowed opacity-70"
                : "cursor-pointer hover:scale-110 hover:shadow-2xl active:scale-95"
            }`}
            style={{
              background:
                isSpinning || !canSpin
                  ? "linear-gradient(145deg, #061f3d, #072E55)"
                  : "linear-gradient(145deg, #072E55, #0a3d6e)",
              boxShadow:
                isSpinning || !canSpin
                  ? "inset 2px 2px 5px rgba(0,0,0,0.3)"
                  : "0 8px 15px rgba(7, 46, 85, 0.4), 0 0 20px rgba(7, 46, 85, 0.2)",
            }}
            aria-label="Spin the wheel"
          >
            <span className="text-[10px] sm:text-xs font-mono text-center leading-tight">
              {isSpinning ? "..." : canSpin ? "SPIN" : "DONE"}
            </span>
          </button>
        </div>
      </div>

      {result && (
        <div className="mt-2 sm:mt-4 p-4 sm:p-6 bg-card rounded-lg border-2 border-primary shadow-lg animate-in fade-in zoom-in duration-500 mx-4 sm:mx-0">
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-center text-foreground">
            {result.toLowerCase().includes("thanks for participating") ? (
              <span className="text-muted-foreground">{result}</span>
            ) : (
              <>
                🎉 You won: <span className="text-primary">{result}</span> 🎉
              </>
            )}
          </p>
        </div>
      )}

      {message && (
        <div className="mt-2 sm:mt-4 p-3 sm:p-4 bg-yellow-500/20 border border-yellow-500 rounded-lg mx-4 sm:mx-0">
          <p className="text-sm sm:text-base lg:text-lg font-semibold text-center text-foreground">
            {message}
          </p>
        </div>
      )}

      <div className="mt-2 text-xs sm:text-sm text-muted-foreground">
        <p>Spins: {numberOfSpins} / 1</p>
      </div>

      <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-black/100 rounded-lg border border-muted-foreground/20 max-w-md mx-4 sm:mx-0">
        <h3 className="text-xs sm:text-sm font-semibold text-white mb-2">
          Terms & Conditions:
        </h3>
        <ul className="text-[10px] sm:text-xs text-white space-y-1">
          <li>
            • For subscription upgrade: if you are on the highest tier plan
            (Plus), no upgrade can be issued
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SpinTheWheel;
