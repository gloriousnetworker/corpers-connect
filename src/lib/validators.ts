import { z } from 'zod';

// ── Reusable field schemas ─────────────────────────────────────────────────
const stateCodeSchema = z
  .string()
  .min(1, 'State code is required')
  .regex(
    /^[A-Z]{2}\/\d{2}[A-Z]\/\d{3,5}$/i,
    'Invalid format. Example: AB/23A/1234'
  );

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

const otpSchema = z
  .string()
  .length(6, 'OTP must be exactly 6 digits')
  .regex(/^\d{6}$/, 'OTP must contain only digits');

// ── Auth schemas ──────────────────────────────────────────────────────────
export const lookupSchema = z.object({
  stateCode: stateCodeSchema,
});

export const registerInitiateSchema = z
  .object({
    stateCode: stateCodeSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const registerVerifySchema = z.object({
  stateCode: z.string().min(1),
  otp: otpSchema,
});

export const loginSchema = z.object({
  identifier: z.string().min(1, 'Email or state code is required'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Enter your email address or state code'),
});

export const resetPasswordSchema = z
  .object({
    otpToken: z.string().min(1),
    otp: otpSchema,
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm new password'),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const twoFAChallengeSchema = z.object({
  challengeToken: z.string().min(1),
  totpCode: otpSchema,
});

export const verify2FASchema = z.object({
  totpCode: z.string().min(6).max(8),
});

// ── User schemas ──────────────────────────────────────────────────────────
export const updateProfileSchema = z.object({
  bio: z.string().max(160, 'Bio must be 160 characters or less').optional(),
  corperTag: z.boolean().optional(),
  corperTagLabel: z.string().max(30).nullable().optional(),
});

export const onboardingSchema = z.object({
  bio: z.string().max(160).optional(),
  corperTag: z.boolean().optional(),
  corperTagLabel: z.string().max(30).optional(),
});

// ── Post schemas ──────────────────────────────────────────────────────────
export const createPostSchema = z
  .object({
    content: z.string().max(2000).optional(),
    mediaUrls: z.array(z.string().url()).max(4).default([]),
    visibility: z.enum(['PUBLIC', 'STATE', 'FRIENDS', 'ONLY_ME']).default('PUBLIC'),
  })
  .refine((d) => (d.content && d.content.trim().length > 0) || d.mediaUrls.length > 0, {
    message: 'Post must have content or media',
    path: ['content'],
  });

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(1000),
  parentId: z.string().optional(),
});

// ── Opportunity schemas ───────────────────────────────────────────────────
export const createOpportunitySchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(10).max(5000),
  type: z.enum(['JOB', 'INTERNSHIP', 'VOLUNTEER', 'CONTRACT', 'OTHER']),
  companyName: z.string().min(2).max(100),
  location: z.string().min(2).max(100),
  isRemote: z.boolean().default(false),
  salary: z.string().max(50).optional(),
  deadline: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal('')),
  companyWebsite: z.string().url().optional().or(z.literal('')),
});

// TypeScript inferred types
export type LookupInput = z.infer<typeof lookupSchema>;
export type RegisterInitiateInput = z.infer<typeof registerInitiateSchema>;
export type RegisterVerifyInput = z.infer<typeof registerVerifySchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type TwoFAChallengeInput = z.infer<typeof twoFAChallengeSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type AddCommentInput = z.infer<typeof addCommentSchema>;
