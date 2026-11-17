"use client";

// Componentes do Magic UI (https://magicui.design, licença MIT, © Magic UI) portados pro motor:
// a lógica é a oficial; as classes Tailwind viraram CSS do motor (o Tailwind desta máquina não lê classes).
// - TextReveal: as palavras acendem uma a uma conforme a rolagem
// - LightRays: raios de luz descendo, na cor do brilho da página
// - ImageText: o texto vira janela para uma foto (ideia do VideoText, com foto no lugar do vídeo)
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import s from "./Page.module.css";

export function TextReveal({ text, className = "" }: { text: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref });
  const words = text.split(" ");
  return (
    <div ref={ref} className={`${s.reveal} ${className}`}>
      <div className={s.revealStick}>
        <p className={s.revealText}>
          {words.map((w, i) => {
            const start = i / words.length;
            return <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]}>{w}</Word>;
          })}
        </p>
      </div>
    </div>
  );
}

function Word({ children, progress, range }: { children: ReactNode; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0, 1]);
  return (
    <span className={s.rw}>
      <span className={s.rwGhost} aria-hidden>{children}</span>
      <motion.span style={{ opacity }}>{children}</motion.span>
    </span>
  );
}

type Ray = { id: string; left: number; rotate: number; width: number; swing: number; delay: number; duration: number; intensity: number };
const makeRays = (count: number, cycle: number): Ray[] =>
  Array.from({ length: count }, (_, i) => {
    const left = 8 + Math.random() * 84;
    return {
      id: `${i}-${Math.round(left * 10)}`, left, rotate: -28 + Math.random() * 56, width: 160 + Math.random() * 160,
      swing: 0.8 + Math.random() * 1.8, delay: Math.random() * cycle, duration: cycle * (0.75 + Math.random() * 0.5), intensity: 0.6 + Math.random() * 0.5,
    };
  });

export function LightRays({ color, count = 7, blur = 36, speed = 14, length = "70vh" }: { color: string; count?: number; blur?: number; speed?: number; length?: string }) {
  // a prévia só renderiza no navegador, então dá pra sortear os raios já no primeiro render
  const [rays] = useState<Ray[]>(() => (matchMedia("(prefers-reduced-motion: reduce)").matches ? [] : makeRays(count, Math.max(speed, 0.1))));
  return (
    <div className={s.rays} aria-hidden style={{ "--rc": color, "--rb": `${blur}px`, "--rl": length } as CSSProperties}>
      <div className={s.raysGlowA} />
      <div className={s.raysGlowB} />
      {rays.map((r) => (
        <motion.div
          key={r.id}
          className={s.ray}
          style={{ "--rx": `${r.left}%`, "--rw": `${r.width}px` } as CSSProperties}
          initial={{ rotate: r.rotate }}
          animate={{ opacity: [0, r.intensity, 0], rotate: [r.rotate - r.swing, r.rotate + r.swing, r.rotate - r.swing] }}
          transition={{ duration: r.duration, repeat: Infinity, ease: "easeInOut", delay: r.delay, repeatDelay: r.duration * 0.1 }}
        />
      ))}
    </div>
  );
}

/** O nome vira janela pra foto; a foto anda dentro das letras com a rolagem. */
export function ImageText({ text, src, size, className = "" }: { text: string; src: string; size?: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const pos = useTransform(scrollYProgress, [0, 1], ["50% 20%", "50% 80%"]);
  return (
    <div ref={ref} className={`${s.itWrap} ${className}`}>
      <motion.p className={s.itText} style={{ backgroundImage: `url("${src.replace(/"/g, "%22")}")`, backgroundPosition: pos, fontSize: size }} aria-label={text}>
        {text}
      </motion.p>
    </div>
  );
}
