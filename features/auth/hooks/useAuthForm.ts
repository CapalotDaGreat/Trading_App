import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type DefaultValues, type FieldValues, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Enter a valid email address');

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Include at least one uppercase letter')
  .regex(/[a-z]/, 'Include at least one lowercase letter')
  .regex(/[0-9]/, 'Include at least one number');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(50),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const mfaSchema = z.object({
  verificationCode: z
    .string()
    .trim()
    .min(6, 'Enter the 6-digit code')
    .max(8, 'Code is too long')
    .regex(/^\d+$/, 'Code must contain only numbers'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type MfaFormValues = z.infer<typeof mfaSchema>;

export function useLoginForm(defaultValues: DefaultValues<LoginFormValues> = { email: '', password: '' }) {
  return useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues,
    mode: 'onBlur',
  });
}

export function useRegisterForm(
  defaultValues: DefaultValues<RegisterFormValues> = {
    displayName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
) {
  return useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues,
    mode: 'onBlur',
  });
}

export function useForgotPasswordForm(
  defaultValues: DefaultValues<ForgotPasswordFormValues> = { email: '' },
) {
  return useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues,
    mode: 'onBlur',
  });
}

export function useMfaForm(defaultValues: DefaultValues<MfaFormValues> = { verificationCode: '' }) {
  return useForm<MfaFormValues>({
    resolver: zodResolver(mfaSchema),
    defaultValues,
    mode: 'onBlur',
  });
}

export function useAuthForm<T extends FieldValues>(
  schema: z.ZodTypeAny,
  defaultValues: DefaultValues<T>,
): UseFormReturn<T> {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });
}
