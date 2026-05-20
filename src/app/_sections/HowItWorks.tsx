import { env } from "@/lib/env";
import { HowItWorksClient } from "../_components/HowItWorksClient";

export function HowItWorks() {
  const price = env.X402_DEFAULT_PRICE_USDC.toFixed(2);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-border bg-transparent"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-16 pb-20 md:pt-20 md:pb-24">
        
        {/* Eyebrow */}
        <div className="text-[10px] font-mono tracking-widest text-text-muted uppercase font-bold">
          [ Protocol ]
        </div>

        {/* Heading */}
        <h2 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-mono tracking-tight font-black uppercase text-text max-w-3xl leading-[0.95]">
          From question to USDC, <br />
          <span className="text-[var(--color-accent)] bg-[var(--color-accent)]/10 px-2 py-0.5 mt-2 inline-block border border-[var(--color-accent)]/20">
            in four steps.
          </span>
        </h2>

        {/* Description */}
        <p className="mt-6 max-w-2xl text-text-muted text-sm font-mono leading-relaxed pl-4 border-l border-border-strong">
          x402 fully implemented — no custom protocol deviations, no facilitator fees.
          Every input is Zod-bounded, every payment is on-chain, every snippet ships
          with its tx signature.
        </p>

        <div className="mt-10 md:mt-12">
          <HowItWorksClient price={price} />
        </div>
      </div>
    </section>
  );
}
