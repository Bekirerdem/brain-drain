import { env } from "@/lib/env";
import { HowItWorksClient } from "../_components/HowItWorksClient";

export function HowItWorks() {
  const price = env.X402_DEFAULT_PRICE_USDC.toFixed(2);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      {/*
       * Background grid-particles loop — futuristic-3.gif converted to
       * VP9 WebM (2.4 MB → 864 KB). object-cover spans the full
       * section, mix-blend-mode: screen drops the video's black
       * backdrop. Desaturated heavily so the cyan particle grid reads
       * as ambient texture, not branded color. Hidden below lg to
       * skip the decode cost on mobile.
       */}
      <video
        aria-hidden="true"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="pointer-events-none hidden lg:block absolute inset-0 w-full h-full object-cover z-0"
        style={{
          opacity: 0.28,
          filter: "saturate(0.25) brightness(1.05)",
          mixBlendMode: "screen",
        }}
      >
        <source src="/video/grid-particles.webm" type="video/webm" />
      </video>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-32 lg:pt-32 lg:pb-44">
        <p className="text-eyebrow">Protocol</p>
        <h2 className="text-display mt-6 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
          From question to USDC,{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            in four steps.
          </em>
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          x402 fully implemented — no custom protocol deviations, no facilitator fees.
          Every input is Zod-bounded, every payment is on-chain, every snippet ships
          with its tx signature.
        </p>

        <HowItWorksClient price={price} />
      </div>
    </section>
  );
}
