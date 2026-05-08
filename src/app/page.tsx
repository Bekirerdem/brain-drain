import { Hero } from "./_sections/Hero";
import { BuiltOn } from "./_sections/BuiltOn";
import { LiveActivity } from "./_sections/LiveActivity";
import { ForExperts } from "./_sections/ForExperts";
import { ForAgents } from "./_sections/ForAgents";
import { HowItWorks } from "./_sections/HowItWorks";
import { SystemMap } from "./_sections/SystemMap";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Home() {
  return (
    <>
      <Hero />
      <BuiltOn />
      <LiveActivity />
      <ForExperts />
      <ForAgents />
      <HowItWorks />
      <SystemMap />
    </>
  );
}
