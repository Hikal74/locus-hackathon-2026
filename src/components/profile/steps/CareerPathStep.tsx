import { Chip } from "@/components/ui/Chip";
import type { FieldOfStudy } from "@/lib/data/types";
import type { StepProps } from "../types";

/** Curated per-field career suggestions — e.g. a STEM field like Natural Sciences surfaces "Scientist". */
const CAREER_SUGGESTIONS: Record<FieldOfStudy, string[]> = {
  computer_science: [
    "Software Engineer",
    "Data Scientist",
    "AI / ML Researcher",
    "Systems Architect",
    "Cybersecurity Analyst",
    "Product Manager",
    "Game Developer",
    "DevOps Engineer",
  ],
  business: [
    "Entrepreneur",
    "Financial Analyst",
    "Management Consultant",
    "Marketing Manager",
    "Investment Banker",
    "Product Manager",
    "HR Manager",
    "Supply Chain Analyst",
  ],
  engineering: [
    "Mechanical Engineer",
    "Civil Engineer",
    "Robotics Engineer",
    "Aerospace Engineer",
    "Industrial Designer",
    "Electrical Engineer",
    "Chemical Engineer",
    "Structural Engineer",
  ],
  medicine: [
    "Doctor",
    "Surgeon",
    "Medical Researcher",
    "Pharmacist",
    "Public Health Specialist",
    "Dentist",
    "Psychiatrist",
    "Physical Therapist",
  ],
  natural_sciences: [
    "Scientist",
    "Research Scientist",
    "Lab Technician",
    "Environmental Scientist",
    "Biotechnologist",
    "Marine Biologist",
    "Geologist",
    "Astrophysicist",
  ],
  humanities: [
    "Writer",
    "Lawyer",
    "Diplomat",
    "Journalist",
    "Historian / Academic",
    "Translator",
    "Policy Analyst",
    "Editor",
  ],
  arts: [
    "Designer",
    "Graphic Designer",
    "Artist",
    "Illustrator",
    "Art Director",
    "Film / Media Producer",
    "Animator",
    "Photographer",
    "Musician",
    "Fashion Designer",
    "Actor / Performer",
    "Curator",
  ],
};

export function CareerPathStep({ draft, update }: StepProps) {
  const suggestions = CAREER_SUGGESTIONS[draft.intendedField];

  return (
    <>
      <h1 className="text-2xl font-semibold text-ink">What&apos;s your target career?</h1>
      <p className="text-sm text-ink-soft">
        Based on your field and interests — this helps the AI advisor reason about which programs actually set you
        up for it.
      </p>
      <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
        {suggestions.map((career) => (
          <Chip
            key={career}
            selected={draft.careerPath === career}
            onClick={() => update("careerPath", draft.careerPath === career ? "" : career)}
            className="shrink-0"
          >
            {career}
          </Chip>
        ))}
      </div>
    </>
  );
}
