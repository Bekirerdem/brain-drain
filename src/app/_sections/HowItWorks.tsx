import { env } from "@/lib/env";
import { HowItWorksClient } from "../_components/HowItWorksClient";

export function HowItWorks() {
  const price = env.X402_DEFAULT_PRICE_USDC.toFixed(2);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-28 pb-32 lg:pt-36 lg:pb-44">
        <div className="grid lg:grid-cols-[5fr_7fr] gap-10 lg:gap-16 lg:items-start">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-eyebrow">Protocol</p>
            <h2 className="text-display-lg mt-7 text-[var(--color-text)]">
              From question to USDC,
              <span className="block text-[var(--color-text-muted)]">in four on-chain steps.</span>
            </h2>
            <p className="text-lead mt-8 max-w-md">
              x402 fully implemented — no custom deviations, no facilitator
              fees. Every input Zod-bounded, every payment on-chain, every
              snippet shipped with its tx signature.
            </p>
            <p className="mt-8 text-mono-tight text-[11px] uppercase tracking-[0.22em] text-[var(--color-text-faint)]">
              Default price · {price} USDC per cited snippet
            </p>
          </div>

          <div>
            <HowItWorksClient price={price} />
          </div>
        </div>
      </div>
    </section>
  );
}
