"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { OrbitVisual } from "../_components/OrbitVisual";
import { animateTypewriter, animateSteppedFade, animateGlitchSnap } from "@/lib/motion/gsap";

export function Hero() {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<"curl" | "mcp">("curl");

  useEffect(() => {
    // Elegant reveal animations using GSAP
    if (titleRef.current) animateGlitchSnap(titleRef.current, 0.1);
    if (subtitleRef.current) animateSteppedFade(subtitleRef.current, 0.3, 0.2, 3);
    if (contentRef.current) animateSteppedFade(contentRef.current, 0.4, 0.3, 4);
    if (visualRef.current) animateSteppedFade(visualRef.current, 0.4, 0.5, 4);
    if (statsRef.current) animateSteppedFade(statsRef.current, 0.5, 0.7, 5);
  }, []);

  return (
    <section className="bg-transparent text-text relative border-b border-border overflow-hidden select-none">
      
      {/* Background visible grid line guide */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 lg:grid-cols-12 gap-6 px-6 lg:px-10 opacity-[0.02] border-x border-border max-w-[1280px] mx-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full border-r border-text" />
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1280px] px-6 lg:px-10 pt-12 pb-16 md:pt-20 md:pb-24 flex flex-col gap-12 md:gap-16">
        
        {/* Core Layout Grid - Aligns perfectly with header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Panel: Content & CTAs (Spans 7 cols) */}
          <div ref={contentRef} className="lg:col-span-7 space-y-8 flex flex-col justify-center">
            
            <div className="space-y-6">
              {/* Running Status Badge */}
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--color-accent)] opacity-75 animate-ping" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-accent)]" />
                </span>
                <span className="text-[10px] font-mono tracking-widest text-[var(--color-accent)] uppercase font-bold">
                  [ PROTOCOL // ACTIVE // SOLANA DEVNET ]
                </span>
              </div>

              {/* Massive Monospace Header */}
              <h1 
                ref={titleRef} 
                className="text-4xl md:text-5xl lg:text-6xl font-mono tracking-tight font-black uppercase text-text leading-[0.95]"
              >
                AI Cites You. <br />
                <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 mt-2 inline-block border border-[var(--color-accent)]/20">
                  USDC Arrives.
                </span>
              </h1>

              {/* Short Pitch */}
              <p 
                ref={subtitleRef} 
                className="text-text-muted text-sm md:text-base font-mono leading-relaxed pl-4 border-l border-border-strong max-w-xl"
              >
                Your Claude Desktop, Cursor, or custom MCP agent reads your knowledge base and pays your Solana wallet directly. ~400ms settlement, zero platform custody.
              </p>
            </div>

            {/* Clean Code Snippet Console */}
            <div className="border border-border bg-bg-card overflow-hidden">
              <div className="flex border-b border-border bg-bg text-[10px] font-mono divide-x divide-border">
                <button 
                  onClick={() => setActiveTab("curl")}
                  className={`px-4 py-2 uppercase font-bold focus:outline-none ${activeTab === "curl" ? "text-[var(--color-accent)] bg-bg-card" : "text-text-faint hover:text-text"}`}
                >
                  [ curl_request.sh ]
                </button>
                <button 
                  onClick={() => setActiveTab("mcp")}
                  className={`px-4 py-2 uppercase font-bold focus:outline-none ${activeTab === "mcp" ? "text-[var(--color-accent)] bg-bg-card" : "text-text-faint hover:text-text"}`}
                >
                  [ mcp_config.json ]
                </button>
              </div>
              <div className="p-4 font-mono text-[10.5px] text-text-muted overflow-x-auto whitespace-pre leading-relaxed select-text">
                {activeTab === "curl" ? (
                  <code>
                    <span className="text-text-faint"># Query a public knowledge vault</span>
                    <br />
                    curl -X POST https://api.braindrain.xyz/v1/query \<br />
                    &nbsp;&nbsp;-H <span className="text-[var(--color-accent)]">&quot;Authorization: Bearer x402_...&quot;</span> \<br />
                    &nbsp;&nbsp;-d <span className="text-text">&apos;&#123;&quot;query&quot;: &quot;avalanche consensus&quot;&#125;&apos;</span>
                  </code>
                ) : (
                  <code>
                    <span className="text-text-faint">// MCP Server client config</span>
                    <br />
                    &#123;
                    <br />
                    &nbsp;&nbsp;<span className="text-[var(--color-accent)]">&quot;mcpServers&quot;</span>: &#123;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&quot;braindrain-settlement&quot;: &#123;
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;command&quot;: &quot;npx&quot;, &quot;args&quot;: [&quot;-y&quot;, &quot;@braindrain/mcp&quot;]
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&#125;
                    <br />
                    &nbsp;&nbsp;&#125;
                    <br />
                    &#125;
                  </code>
                )}
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href="/vaults/new"
                className="bg-[var(--color-accent)] text-[var(--color-bg)] font-mono font-bold text-xs uppercase px-6 h-11 inline-flex items-center justify-center border border-[var(--color-accent)] hover:bg-bg hover:text-[var(--color-accent)] transition-colors duration-100"
              >
                [ Mount Vault ]
              </Link>
              <Link
                href="/vaults"
                className="bg-transparent text-text font-mono font-bold text-xs uppercase px-6 h-11 inline-flex items-center justify-center border border-border-strong hover:bg-border-strong transition-colors duration-100"
              >
                [ Open Directory ]
              </Link>
              <a
                href="#how-it-works"
                className="font-mono text-xs text-text-muted hover:text-[var(--color-accent)] transition-colors ml-2"
              >
                GETTING_STARTED.md &darr;
              </a>
            </div>
          </div>

          {/* Right Panel: Visualization (Spans 5 cols) */}
          <div ref={visualRef} className="lg:col-span-5 flex items-center justify-center relative overflow-hidden py-4 w-full">
            <div className="w-full max-w-[520px] aspect-[520/380] flex items-center justify-center relative">
              <OrbitVisual active={true} />
            </div>
          </div>
        </div>

        {/* Stats Stripe - Clean 4-Column Monospace */}
        <div 
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 border border-border bg-bg-card divide-y lg:divide-y-0 lg:divide-x divide-border font-mono text-[11px]"
        >
          <div className="p-5">
            <span className="text-[10px] text-text-faint block uppercase tracking-wider">[SYS_UPTIME]</span>
            <span className="text-lg font-black text-text block mt-1">99.98%</span>
            <span className="text-[10px] text-text-muted block mt-1">Live validator feed</span>
          </div>
          <div className="p-5">
            <span className="text-[10px] text-text-faint block uppercase tracking-wider">[AVG_SETTLEMENT]</span>
            <span className="text-lg font-black text-text block mt-1">~400ms</span>
            <span className="text-[10px] text-text-muted block mt-1">Direct token route</span>
          </div>
          <div className="p-5">
            <span className="text-[10px] text-text-faint block uppercase tracking-wider">[PROTOCOL_FEE]</span>
            <span className="text-lg font-black text-text block mt-1">0.00 USDC</span>
            <span className="text-[10px] text-text-muted block mt-1">Brain Drain holds 0%</span>
          </div>
          <div className="p-5">
            <span className="text-[10px] text-text-faint block uppercase tracking-wider">[INTEGRATION]</span>
            <span className="text-lg font-black text-[var(--color-accent)] block mt-1">x402 SPL</span>
            <span className="text-[10px] text-text-muted block mt-1">Claude & Cursor native</span>
          </div>
        </div>
      </div>
    </section>
  );
}
