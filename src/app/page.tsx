import { Hero } from "./_sections/Hero";
import { HowItWorks } from "./_sections/HowItWorks";
import { ForExperts } from "./_sections/ForExperts";
import { ForAgents } from "./_sections/ForAgents";
import { WhyBrainDrain } from "./_sections/WhyBrainDrain";
import { SystemMap } from "./_sections/SystemMap";
import { LiveActivity } from "./_sections/LiveActivity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ForExperts />
      <ForAgents />
      <WhyBrainDrain />
      <SystemMap />
      <LiveActivity />
    </>
  );
}
