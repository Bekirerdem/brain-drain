import { Hero } from "./_sections/Hero";
import { Problem } from "./_sections/Problem";
import { LiveActivity } from "./_sections/LiveActivity";
import { FeaturedVaults } from "./_sections/FeaturedVaults";
import { HowItWorks } from "./_sections/HowItWorks";
import { ForExperts } from "./_sections/ForExperts";
import { ForAgents } from "./_sections/ForAgents";
import { BuiltOn } from "./_sections/BuiltOn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/*
 * Hibrit narrative — 10 sections trimmed to 7 so a juror's first-glance
 * scroll lands on the proof feed before fatigue sets in.
 *   Hero          (Pay-per-cite tagline + concrete buyer names)
 *   Problem       (3-tile compare: Free RAG / Paid APIs / Brain Drain)
 *   LiveActivity  (real on-chain settlement feed — strongest proof)
 *   FeaturedVaults(catalog teaser, "what people actually mounted")
 *   HowItWorks    (Mermaid sequence: operator + agent flow merged)
 *   ForExperts    (operator pitch — your decision log is a paid API)
 *   ForAgents     (buyer pitch — drop into Claude / Cursor / MCP)
 *   BuiltOn       (tech marquee — protocol stack visible to humans)
 *
 * Removed AgentLoop + SystemMap — their signal merges into HowItWorks
 * (loop) and the README (architecture detail) without forcing a juror
 * through twelve scroll viewports before the CTA.
 */
export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <LiveActivity />
      <FeaturedVaults />
      <HowItWorks />
      <ForExperts />
      <ForAgents />
      <BuiltOn />
    </>
  );
}
