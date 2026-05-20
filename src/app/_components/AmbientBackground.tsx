"use client";

import { useEffect, useState } from "react";

interface NodeItem {
  id: number;
  text: string;
  top: string;
  left: string;
  delay: string;
  duration: string;
}

export function AmbientBackground() {
  const [nodes, setNodes] = useState<NodeItem[]>([]);

  useEffect(() => {
    // Generate random background debug nodes to mimic a scanning network
    const labels = [
      "[SYS_OK // PORT_3000]",
      "[X402_ROUTER // LISTENING]",
      "[SOLANA_DEVNET // CONFIRMED]",
      "[CDP_MPC_SIGNER // READY]",
      "[EMBEDDING_CATALOG // INDEXED]",
      "[COSINE_SIMILARITY // k=5]",
      "[USDC_SETTLED // 0.00 USDC]",
      "[MEM_POOL // IDLE]",
      "[DNS_RESOLVED // HELIUS_IP]"
    ];

    const generatedNodes = Array.from({ length: 8 }).map((_, i) => {
      const top = `${10 + Math.random() * 80}%`;
      const left = `${5 + Math.random() * 90}%`;
      const delay = `${Math.random() * 6}s`;
      const duration = `${12 + Math.random() * 12}s`;
      const text = labels[i % labels.length];

      return {
        id: i,
        text,
        top,
        left,
        delay,
        duration
      };
    });

    setNodes(generatedNodes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-bg">
      {/* Moving Brutalist Grid Lines */}
      <div 
        className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(to right, var(--color-text) 1px, transparent 1px),
            linear-gradient(to bottom, var(--color-text) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          animation: "brutalist-grid-scroll 45s linear infinite"
        }}
      />

      {/* Sweeping scanline */}
      <div 
        className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-[0.16]"
        style={{
          animation: "brutalist-scanline 8s ease-in-out infinite"
        }}
      />

      {/* Floating Monospace Protocol Log Coordinates */}
      {nodes.map((node) => (
        <span
          key={node.id}
          className="absolute font-mono text-[9px] text-text-faint tracking-widest uppercase opacity-0"
          style={{
            top: node.top,
            left: node.left,
            animation: `brutalist-node-fade ${node.duration} ease-in-out infinite`,
            animationDelay: node.delay
          }}
        >
          {node.text}
        </span>
      ))}

      {/* Styling specific custom animations */}
      <style jsx global>{`
        @keyframes brutalist-grid-scroll {
          0% {
            background-position: 0px 0px;
          }
          100% {
            background-position: 60px 60px;
          }
        }
        @keyframes brutalist-scanline {
          0% {
            top: -10%;
          }
          50% {
            top: 110%;
          }
          100% {
            top: -10%;
          }
        }
        @keyframes brutalist-node-fade {
          0%, 100% {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          10%, 40% {
            opacity: 0.45;
            transform: translateY(0) scale(1);
          }
          50%, 90% {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
