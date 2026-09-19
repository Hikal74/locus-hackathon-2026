import type { FieldOfStudy } from "./types";

export interface InterviewQuestion {
  id: string;
  question: string;
  /** Generic guidance on what an interviewer usually listens for — coaching advice, not a claim about any one university. */
  lookFor: string;
}

const GENERAL: InterviewQuestion[] = [
  {
    id: "why-field",
    question: "Why do you want to study this field?",
    lookFor: "A real story behind the interest, not just a statement that you like it.",
  },
  {
    id: "challenge",
    question: "Tell me about a challenge you faced and how you handled it.",
    lookFor: "What you personally did, what happened, and what you'd do differently.",
  },
  {
    id: "proud",
    question: "What is something you've done that you're proud of?",
    lookFor: "Specific detail and your own contribution — small and real beats big and vague.",
  },
  {
    id: "why-abroad",
    question: "Why do you want to study in another country, and why this one?",
    lookFor: "Concrete reasons connected to you, plus signs you've thought about the practical side.",
  },
  {
    id: "failure",
    question: "Describe a time you failed at something. What did you learn?",
    lookFor: "Honesty about what went wrong and a specific change in how you act now.",
  },
  {
    id: "teamwork",
    question: "Tell me about a time you worked with a group. What was your role?",
    lookFor: "Your actual role and how you handled disagreement, not just 'we worked well together'.",
  },
  {
    id: "changed-mind",
    question: "Tell me about something you changed your mind about.",
    lookFor: "Curiosity and the ability to update — what convinced you.",
  },
  {
    id: "ten-years",
    question: "Where do you hope your studies will take you in ten years?",
    lookFor: "A direction, held loosely — and how this degree fits into it.",
  },
];

const BY_FIELD: Record<FieldOfStudy, InterviewQuestion> = {
  computer_science: {
    id: "field-cs",
    question: "Tell me about something you built. What broke, and how did you fix it?",
    lookFor: "Technical specifics you can explain simply, and how you debug when stuck.",
  },
  business: {
    id: "field-business",
    question: "Describe a business or organization you admire. What do they do well, and what would you change?",
    lookFor: "An opinion backed by reasons, not just a famous name.",
  },
  engineering: {
    id: "field-engineering",
    question: "Tell me about a time something didn't work the way you expected. How did you figure out why?",
    lookFor: "A methodical approach: what you tried, what you ruled out, what you learned.",
  },
  medicine: {
    id: "field-medicine",
    question: "Why medicine — and how have you tested that interest so far?",
    lookFor: "Evidence you understand the reality of the work, not just the idea of it.",
  },
  natural_sciences: {
    id: "field-sciences",
    question: "What's a science question you can't stop thinking about?",
    lookFor: "Genuine curiosity and how you'd start finding out — not a memorized fact.",
  },
  humanities: {
    id: "field-humanities",
    question: "What's a book, idea, or event that changed how you see the world?",
    lookFor: "A clear thought of your own about it, not a summary.",
  },
  arts: {
    id: "field-arts",
    question: "Walk me through something you made. What choices did you make, and why?",
    lookFor: "Intention behind your decisions and what you'd do differently.",
  },
};

/** The student's field question comes first, followed by the general set in a fixed order. */
export function getInterviewQuestions(field?: FieldOfStudy): InterviewQuestion[] {
  return field ? [BY_FIELD[field], ...GENERAL] : GENERAL;
}
