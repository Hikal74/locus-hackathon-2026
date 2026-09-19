import { Hero } from "@/components/landing/Hero";
import { Pillars } from "@/components/landing/Pillars";
import { MoreTools } from "@/components/landing/MoreTools";
import { ToolTile } from "@/components/landing/ToolTile";
import { RoadmapTile } from "@/components/landing/RoadmapTile";
import { DebureaucratizeTool } from "@/components/translate/DebureaucratizeTool";
import { VibeCheckTool } from "@/components/vibecheck/VibeCheckTool";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <Hero />

      <section aria-label="Tools" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <ToolTile
          title="De-Bureaucratizer"
          description="Dense admissions text in, plain English out."
          href="/translate"
        >
          <DebureaucratizeTool compact />
        </ToolTile>
        <ToolTile
          title="Professor Vibe Check"
          description="Paste reviews or a syllabus — get a teaching-style read."
          href="/vibe-check"
        >
          <VibeCheckTool compact />
        </ToolTile>
        <RoadmapTile />
      </section>

      <MoreTools />

      <Pillars />
    </div>
  );
}
