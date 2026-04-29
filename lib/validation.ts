// lib/validation.ts
import { z } from 'zod';

// Lead creation schema
export const LeadSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Valid phone number required'),
    propertyInterest: z.string().min(1, 'Property interest required'),
    budget: z.number().positive('Budget must be positive'),
    status: z.enum(['New', 'Contacted', 'In Progress', 'Closed']).optional(),
    notes: z.string().optional(),
    assignedTo: z.string().optional(), // ObjectId as string
});

// User registration schema
export const RegisterSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'agent']).optional(),
});

// Login schema
export const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Helper function to validate request body
export async function validateBody<T>(req: Request, schema: z.ZodSchema<T>): Promise<{ data: T; errors: any }> {
    try {
        const body = await req.json();
        const data = schema.parse(body);
        return { data, errors: null };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { data: null as any, errors: error.issues };
        }
        throw error;
    }
}