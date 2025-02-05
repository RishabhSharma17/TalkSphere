import { z } from 'zod';

export const signupSchema = z.object({
    username: z.string().min(3,"username must be greater than 3 characters!"),
    email: z.string().email(),
    password: z.string().min(6,"password must be greater than 6 characters!"),
});

export const signinSchema = z.object({
    identifier:z.string().min(3,"username or email can'nt be less than 3 characters"),
    password: z.string().min(6,"password must be greater than 6 characters"),
});

export type signup = z.infer<typeof signupSchema>;
export type signin = z.infer<typeof signinSchema>;