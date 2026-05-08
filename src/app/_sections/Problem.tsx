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
    label: "Today’s RAG",
    value: "Spam-prone, free",
    caption: "No quality signal, nothing rewards an expert for keeping the corpus current.",
  },
  {
    label: "Today’s APIs",
    value: "Key-gated",
    caption: "Approval queues, terms of service, a platform middleman taking a cut.",
  },
  {
    label: "Brain Drain",
    value: "Pay-per-cite",
    caption: "Permissionless x402 settlement straight to the operator — no custody, no gating.",
    accent: true,
  },
];

export function Problem() {
  return (
    <section
      id="why"
      className="relative overflow-hidden border-t border-[var(--color-border)]"
    >
      <div className="relative mx-auto max-w-[1280px] px-6 lg:px-10 pt-24 pb-24 lg:pt-28 lg:pb-28">
        <p className="text-eyebrow">Why Brain Drain</p>
        <h2 className="text-display mt-6 text-[clamp(36px,5.5vw,68px)] text-[var(--color-text)] max-w-[900px] leading-[1.02]">
          AI agents need facts. The web gives them{" "}
          <em className="not-italic font-normal text-[var(--color-accent)]">
            hallucinations.
          </em>
        </h2>
        <p className="mt-6 max-w-2xl text-[var(--color-text-muted)] text-lg leading-[1.55]">
          Free RAG is noisy and unowned — nobody&apos;s on the hook to keep
          it accurate. Paid APIs lock you behind keys, terms, and an
          intermediary that takes a cut. Experts who actually know things
          have no clean way to monetize their corpus, and agents have no
          clean way to discover and pay them.
        </p>

        <ul className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] border-y border-[var(--color-border)]">
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

        <p className="mt-10 max-w-2xl text-[var(--color-text-muted)] text-base leading-[1.55]">
          Brain Drain ships the missing layer: an agent discovers a vault via
          the MCP catalog, previews a free chunk, settles USDC on Solana to
          the operator&apos;s own wallet — never through a platform — and
          rates the result so future agents prioritize the experts whose
          work actually moves them forward.
        </p>
      </div>
    </section>
  );
}
