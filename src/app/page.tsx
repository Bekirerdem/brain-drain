import { Hero } from "./_sections/Hero";
import { LiveActivity } from "./_sections/LiveActivity";
import { HowItWorks } from "./_sections/HowItWorks";
import { OperatorsAgents } from "./_sections/OperatorsAgents";
import { ClosingHero } from "./_sections/ClosingHero";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
 * Five-section landing — every block earns its real estate, every-
 * thing else lives one click away.
 *
 *   Hero            Pay-per-cite tagline, concrete buyer names,
 *                   stats stripe — the reader's "what is this".
 *   LiveActivity    On-chain settlement feed. Strongest proof; the
 *                   numbers move while you read them.
 *   HowItWorks      Mermaid sequence — operator mount + agent pay
 *                   flow in a single diagram.
 *   OperatorsAgents Two-card bento. Left "for operators", right
 *                   "for agent buyers". Each side a single
 *                   paragraph plus a CTA into the deeper page.
 *   ClosingHero     Orquestra-style closing breath. Big headline,
 *                   live proof line, two CTAs, brand glyph on the
 *                   right. The Built-On tech marquee is tucked into
 *                   the same section underneath so the ecosystem
 *                   strip rides the closing rhythm.
 *
 * Removed from the home composition: Problem (the 3-tile
 * compare-row's claim is already won by LiveActivity below it),
 * FeaturedVaults (the public catalog lives on /vaults and is
 * linked from OperatorsAgents), and the standalone BuiltOn
 * section (folded into ClosingHero so it stops competing for a
 * separate viewport). The component files stay on disk for the
 * post-submit cleanup pass.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <LiveActivity />
      <HowItWorks />
      <OperatorsAgents />
      <ClosingHero />
    </>
  );
}
