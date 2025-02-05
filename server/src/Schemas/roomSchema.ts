import { z } from 'zod';

export const roomCreateSchema = z.object({
    name: z.string().min(2,"name must contain at least 3 character")
})