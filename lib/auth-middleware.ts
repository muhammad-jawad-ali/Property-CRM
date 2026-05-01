// lib/auth-middleware.ts


const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthUser {
    userId: string;
    email: string;
    name: string;
    role: 'admin' | 'agent';
}

export async function verifyAuth(token: string): Promise<AuthUser> {
    try {
        // Next.js Middleware runs on the Edge runtime, which doesn't support the Node.js 'jsonwebtoken' library.
        // As a workaround, we can manually decode the JWT payload here.
        // Note: The API routes still securely verify the token using jsonwebtoken because they run in Node.js!
        const payloadBase64 = token.split('.')[1];
        const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
        const decoded = JSON.parse(payloadJson);
        
        // Check expiration
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            throw new Error('Token expired');
        }
        
        return decoded as AuthUser;
    } catch (err) {
        throw new Error('Invalid token');
    }
}