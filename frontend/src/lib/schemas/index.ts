import { z } from 'zod';
import { isValidGitHubUrl, isValidHttpsUrl } from '../format';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z
    .string()
    .min(10, 'Password must be at least 10 characters')
    .regex(/[A-Z]/, 'Include at least one uppercase letter')
    .regex(/[0-9]/, 'Include at least one number'),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    password: z.string().min(10, 'Password must be at least 10 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords must match',
    path: ['confirm_password'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const registerStudentSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  program_level: z.enum(['ug', 'pg']),
  year: z.number().int().min(1).max(5).optional(),
  status: z
    .enum(['incoming', 'enrolled', 'dropout', 'alumni', 'masters'])
    .optional()
    .default('enrolled'),
  choice: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('detect') }),
    z.object({
      kind: z.literal('student_id'),
      university_id: z.string(),
      student_id_number: z.string().min(1, 'Student ID number is required'),
    }),
    z.object({
      kind: z.literal('unregistered'),
      university_name: z.string().min(2, 'University name is required'),
    }),
  ]),
});
export type RegisterStudentInput = z.input<typeof registerStudentSchema>;

export const submissionFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(120, 'Title must be 120 characters or fewer'),
  description: z
    .string()
    .max(2000, 'Description must be 2000 characters or fewer')
    .default(''),
  skills_claimed: z
    .array(z.string())
    .min(1, 'Choose at least one skill this project shows.'),
  live_url: z
    .string()
    .optional()
    .refine((val) => !val || isValidHttpsUrl(val), {
      message: 'Live link must be a valid https:// URL',
    }),
  github_url: z
    .string()
    .optional()
    .refine((val) => !val || isValidGitHubUrl(val), {
      message: 'GitHub link must be in the format https://github.com/owner/repo',
    }),
  video_url: z.string().optional(),
  video_source: z.enum(['upload', 'link', 'none']).default('none'),
  originality_responses: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string().max(600, 'Answer must be 600 characters or fewer'),
        answered_in_video: z.boolean().optional().default(false),
      })
    )
    .default([]),
  ai_used: z.boolean().default(false),
  ai_tools: z.array(z.string()).default([]),
  ai_notes: z
    .string()
    .max(300, 'AI notes must be 300 characters or fewer')
    .default(''),
});
export type SubmissionFormInput = z.input<typeof submissionFormSchema>;

export const respondAccessSchema = z.object({
  request_id: z.string(),
  decision: z.enum(['accept', 'decline']),
  granted_scope: z
    .array(z.enum(['profile', 'scorecard', 'projects', 'contact']))
    .optional(),
  duration_days: z.union([z.literal(7), z.literal(30), z.literal(90)]).optional(),
});
export type RespondAccessInput = z.infer<typeof respondAccessSchema>;

export const ticketFormSchema = z.object({
  submission_id: z.string(),
  skill_name: z.string(),
  reason: z
    .string()
    .min(20, 'Reason must be at least 20 characters')
    .max(1000, 'Reason must be 1000 characters or fewer'),
});
export type TicketFormInput = z.infer<typeof ticketFormSchema>;

export const profileOverviewSchema = z.object({
  full_name: z.string().min(2, 'Name is required'),
  headline: z.string().max(80, 'Headline must be 80 characters or fewer').default(''),
  bio: z.string().max(500, 'Bio must be 500 characters or fewer').default(''),
  location: z.string().default(''),
  languages: z.array(z.string()).default([]),
  links: z
    .object({
      website: z.string().optional(),
      github: z.string().optional(),
      linkedin: z.string().optional(),
      portfolio: z.string().optional(),
    })
    .default({}),
  target_skills: z.array(z.string()).max(3).default([]),
  target_roles: z.array(z.string()).max(3).default([]),
});
export type ProfileOverviewInput = z.infer<typeof profileOverviewSchema>;
