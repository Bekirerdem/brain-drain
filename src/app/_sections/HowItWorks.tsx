import { env } from "@/lib/env";
import { HowItWorksClient } from "../_components/HowItWorksClient";

export function HowItWorks() {
  const price = env.X402_DEFAULT_PRICE_USDC.toFixed(2);

  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-32 lg:pt-32 lg:pb-44">
        <p className="text-eyebrow">Protocol</p>
        <h2 className="text-display mt-6 text-[clamp(36px,6vw,72px)] text-[var(--color-text)] max-w-3xl">
          From question to USDC,
          <span className="block text-[var(--color-text-muted)]">in four on-chain steps.</span>
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
