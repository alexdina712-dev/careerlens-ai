import { z } from 'zod';
const password = z
  .string()
  .min(10)
  .max(72)
  .refine(
    (s) => new TextEncoder().encode(s).length <= 72,
    'Password must be at most 72 UTF-8 bytes.',
  );
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((v) => v.toLowerCase()),
  password: z.string().min(1).max(72),
});
export const registerSchema = loginSchema.extend({
  name: z.string().trim().min(2).max(80),
  password,
});
export const cvSchema = z.object({
  title: z.string().trim().min(2).max(100),
  text: z.string().trim().min(50).max(50000),
  sourceName: z.string().max(150).optional(),
});
export const versionSchema = z.object({
  text: z.string().trim().min(50).max(50000),
  sourceName: z.string().max(150).optional(),
});
export const statuses = [
  'INTERESTED',
  'APPLIED',
  'INTERVIEW',
  'OFFER',
  'REJECTED',
  'ARCHIVED',
] as const;
export const statusSchema = z.object({ status: z.enum(statuses) });
const url = z
  .string()
  .url()
  .max(1000)
  .refine((s) => ['https:', 'http:'].includes(new URL(s).protocol), 'Use an HTTP or HTTPS URL.');
export const jobSchema = z.object({
  company: z.string().trim().min(2).max(100),
  position: z.string().trim().min(2).max(120),
  location: z.string().max(120).default(''),
  url: url.nullable().optional(),
  description: z.string().trim().min(50).max(30000),
  notes: z.string().max(5000).default(''),
});
export const analysisSchema = z
  .object({
    cvVersionId: z.string().min(1).max(100),
    jobId: z.string().min(1).max(100),
    useExternal: z.boolean().default(false),
    consent: z.boolean().default(false),
  })
  .refine(
    (v) => !v.useExternal || v.consent,
    'Consent is required before sending CV text to an external AI provider.',
  );
export const resultSchema = z.object({
  summary: z.string().min(10).max(2500),
  overlappingSkills: z.array(z.string().max(100)).max(40),
  missingSkills: z.array(z.string().max(100)).max(40),
  keywords: z
    .array(z.object({ term: z.string().max(80), inCv: z.boolean(), inJob: z.boolean() }))
    .max(40),
  experience: z.object({
    requiredYears: z.number().min(0).max(50).nullable(),
    statedYears: z.number().min(0).max(50).nullable(),
    note: z.string().max(1500),
  }),
  recommendations: z.array(z.string().max(800)).min(1).max(10),
  interviewQuestions: z.array(z.string().max(800)).min(1).max(10),
  evidence: z.array(z.object({ skill: z.string().max(100), excerpt: z.string().max(500) })).max(40),
  limitations: z.array(z.string().max(800)).min(1).max(10),
});
export type AnalysisResult = z.infer<typeof resultSchema>;
