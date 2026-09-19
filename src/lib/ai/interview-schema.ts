import { z } from "zod";

export const INTERVIEW_ANSWER_MIN_LENGTH = 40;
export const INTERVIEW_ANSWER_MAX_LENGTH = 4000;
const MAX_QUESTION_LENGTH = 500;

/** Request contract for POST /api/interview. The floor keeps a one-word answer from spending a model call. */
export const InterviewRequestSchema = z.object({
  question: z.string().min(1).max(MAX_QUESTION_LENGTH),
  answer: z.string().min(INTERVIEW_ANSWER_MIN_LENGTH).max(INTERVIEW_ANSWER_MAX_LENGTH),
});

export type InterviewRequest = z.infer<typeof InterviewRequestSchema>;

export const InterviewResultSchema = z.object({
  summary: z.string().min(1),
  strengths: z.array(z.string().min(1)),
  improvements: z.array(z.string().min(1)),
  /** A natural next question an interviewer might ask, based on something the student actually said. */
  followUpQuestion: z.string().min(1),
});

export type InterviewResult = z.infer<typeof InterviewResultSchema>;
