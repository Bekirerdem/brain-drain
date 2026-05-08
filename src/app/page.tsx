import { Hero } from "./_sections/Hero";
import { Problem } from "./_sections/Problem";
import { LiveActivity } from "./_sections/LiveActivity";
import { FeaturedVaults } from "./_sections/FeaturedVaults";
import { ForAgents } from "./_sections/ForAgents";
import { HowItWorks } from "./_sections/HowItWorks";
import { AgentLoop } from "./_sections/AgentLoop";
import { ForExperts } from "./_sections/ForExperts";
import { SystemMap } from "./_sections/SystemMap";
import { BuiltOn } from "./_sections/BuiltOn";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <LiveActivity />
      <FeaturedVaults />
      <ForAgents />
      <HowItWorks />
      <AgentLoop />
      <ForExperts />
      <SystemMap />
      <BuiltOn />
    </>
  );
}
