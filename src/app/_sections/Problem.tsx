/* ─────────────────────────────────────────────────────────
 * PROBLEM — why Brain Drain exists.
 *
 * Sits below the hero so a juror gets the antagonist + resolution
 * before they hit the proof feed. Pure content section: no new
 * components, no new tokens — uses the existing typography +
 * grid-px-border tile pattern from Hero/HeroStats.
 * ───────────────────────────────────────────────────────── */

interface Tile {
  readonly label: string;
  readonly value: string;
  readonly caption: string;
  readonly accent?: boolean;
}

const TILES: readonly Tile[] = [
  {
    label: "Free RAG",
    value: "Noisy + unowned",
    caption: "Nothing rewards experts for keeping the corpus accurate. Quality drifts, agents hallucinate.",
  },
  {
    label: "Paid APIs",
    value: "Gated + middlemen",
    caption: "Approval queues, terms of service, a platform skimming a cut from every call.",
  },
  {
    label: "Brain Drain",
    value: "Pay-per-cite",
    caption: "x402 settles USDC direct to the operator. No platform custody, no gating, no waitlist.",
    accent: true,
  },
];

export function Problem() {
  return (
    <section
      id="why"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-20 pb-20 lg:pt-24 lg:pb-24">
        <p className="text-eyebrow">Why Brain Drain</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,64px)] text-[var(--color-text)] max-w-[900px] leading-[1.04]">
          AI agents need facts. The web gives them{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            hallucinations.
          </em>
        </h2>

        <ul className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
          {TILES.map((t) => (
            <li key={t.label} className="bg-[var(--color-bg)] px-6 py-7 lg:px-7 lg:py-8">
              <p className="text-eyebrow">{t.label}</p>
              <p
                className={`mt-3 text-display text-[clamp(20px,2.6vw,26px)] tabular-nums ${
                  t.accent
                    ? "text-[var(--color-accent)]"
                    : "text-[var(--color-text)]"
                }`}
              >
                {t.value}
              </p>
              <p className="mt-2.5 text-[13px] leading-[1.55] text-[var(--color-text-muted)] max-w-[280px]">
                {t.caption}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
