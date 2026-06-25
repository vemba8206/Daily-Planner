import { useEffect, useRef } from "react";
import { gsap } from "gsap";

const colors = ["#8b5cf6", "#d946ef", "#ed2939", "#4c1d95"];

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    red: parseInt(value.slice(0, 2), 16),
    green: parseInt(value.slice(2, 4), 16),
    blue: parseInt(value.slice(4, 6), 16),
  };
}

export default function AnimatedAura() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const particles = Array.from({ length: 18 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      radius: 100 + Math.random() * 180,
      color: colors[index % colors.length],
      alpha: 0.12 + Math.random() * 0.12,
    }));

    function resize() {
      canvas.width = window.innerWidth * window.devicePixelRatio;
      canvas.height = window.innerHeight * window.devicePixelRatio;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    }

    function draw() {
      context.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((particle) => {
        const x = particle.x * canvas.width;
        const y = particle.y * canvas.height;
        const gradient = context.createRadialGradient(x, y, 0, x, y, particle.radius);
        const color = hexToRgb(particle.color);
        gradient.addColorStop(0, `rgba(${color.red}, ${color.green}, ${color.blue}, ${particle.alpha})`);
        gradient.addColorStop(1, `rgba(${color.red}, ${color.green}, ${color.blue}, 0)`);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(x, y, particle.radius, 0, Math.PI * 2);
        context.fill();
      });
    }

    resize();
    window.addEventListener("resize", resize);
    const tweens = particles.map((particle, index) =>
      gsap.to(particle, {
        x: Math.random(),
        y: Math.random(),
        duration: 8 + index * 0.35,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      }),
    );
    gsap.ticker.add(draw);

    return () => {
      window.removeEventListener("resize", resize);
      tweens.forEach((tween) => tween.kill());
      gsap.ticker.remove(draw);
    };
  }, []);

  return <canvas aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 opacity-80" ref={canvasRef} />;
}
