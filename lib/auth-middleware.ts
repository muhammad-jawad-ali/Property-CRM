// lib/auth-middleware.ts
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthUser {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'agent';
}

export async function verifyAuth(token: string): Promise<AuthUser> {
    return new Promise((resolve, reject) => {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) reject(err);
            resolve(decoded as AuthUser);
        });
    });
}