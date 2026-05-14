import { z } from 'zod';

export const PlaceholderSchema = z.object({ id: z.string().uuid() });
export type Placeholder = z.infer<typeof PlaceholderSchema>;
