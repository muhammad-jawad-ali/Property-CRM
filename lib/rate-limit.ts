// lib/rate-limit.ts
import { NextRequest } from 'next/server';

interface RateLimitRecord {
    count: number;
    resetTime: number; // timestamp (ms)
}

// Store: key = userId or IP (if no user)
const rateLimitStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
        if (now > record.resetTime) {
            rateLimitStore.delete(key);
        }
    }
}, 5 * 60 * 1000);

export async function checkRateLimit(
    request: NextRequest,
    userId: string,
    maxRequests: number = 50,
    windowMs: number = 60 * 1000 // 1 minute
): Promise<{ allowed: boolean }> {
    // Use user ID if available, otherwise IP address
    const key = userId || request.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const record = rateLimitStore.get(key);

    if (!record) {
        // First request from this user
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true };
    }

    if (now > record.resetTime) {
        // Window expired, reset
        rateLimitStore.set(key, {
            count: 1,
            resetTime: now + windowMs,
        });
        return { allowed: true };
    }

    if (record.count >= maxRequests) {
        return { allowed: false };
    }

    // Increment and allow
    record.count += 1;
    rateLimitStore.set(key, record);
    return { allowed: true };
}