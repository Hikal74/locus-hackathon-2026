import { Hero } from "@/components/landing/Hero";
import { Pillars } from "@/components/landing/Pillars";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <Hero />
      <Pillars />
    </div>
  );
}
