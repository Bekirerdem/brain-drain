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
       * Upper-junction bg — futuristic-8.jpg. The orange tile junction
       * sits in the image's upper half; cover-fit + center position
       * keeps it visible in the section. The image's bottom edge
       * meets OperatorsAgents' top edge at the section boundary —
       * its mirror pair (junction-bottom.jpg) continues the streaks
       * downward so the two reads as one continuous panel.
       * mix-blend-mode: screen drops the image's black backdrop.
       */}
      <div
        aria-hidden="true"
        className="pointer-events-none hidden lg:block absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/bg/junction-top.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center bottom",
          backgroundRepeat: "no-repeat",
          mixBlendMode: "screen",
        }}
      />

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
