import { Hero } from "./_sections/Hero";
import { Problem } from "./_sections/Problem";
import { LiveActivity } from "./_sections/LiveActivity";
import { FeaturedVaults } from "./_sections/FeaturedVaults";
import { HowItWorks } from "./_sections/HowItWorks";
import { OperatorsAgents } from "./_sections/OperatorsAgents";
import { ClosingHero } from "./_sections/ClosingHero";
import { BuiltOn } from "./_sections/BuiltOn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
 * Orquestra-pattern narrative — short landing, deep elsewhere.
 *
 *   Hero              (Pay-per-cite tagline + concrete buyer names)
 *   Problem           (3-tile compare, copy trimmed to its essentials)
 *   LiveActivity      (real on-chain settlement feed — strongest proof)
 *   FeaturedVaults    (catalog teaser; deeper list on /vaults)
 *   HowItWorks        (Mermaid sequence: operator + agent flow merged)
 *   OperatorsAgents   (single bento — left card "for operators",
 *                      right card "for agent buyers", each one
 *                      paragraph plus a "learn more" link rather
 *                      than a full pitch section)
 *   ClosingHero       (orquestra-style closing breath: "Mount once.
 *                      Get paid forever." + 2 CTAs + brand glyph)
 *   BuiltOn           (tech marquee — visible protocol stack)
 *
 * Old standalone ForExperts + ForAgents sections live on disk for now
 * but are no longer composed into the home; their copy condensed
 * into OperatorsAgents above.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <LiveActivity />
      <FeaturedVaults />
      <HowItWorks />
      <OperatorsAgents />
      <ClosingHero />
      <BuiltOn />
    </>
  );
}
