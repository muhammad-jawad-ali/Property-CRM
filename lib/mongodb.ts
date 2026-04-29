import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error('Define MONGODB_URI in environment');

type Cached = {
	conn: typeof mongoose | null;
	promise: Promise<typeof mongoose> | null;
};

declare global {
	// eslint-disable-next-line no-var
	var mongooseCache: Cached | undefined;
}

const cached: Cached = global.mongooseCache || (global.mongooseCache = { conn: null, promise: null });

export async function connectToDatabase() {
	if (cached.conn) return cached.conn;

	if (!cached.promise) {
		const opts = {
			// Recommended options can go here
			// keep it minimal to avoid deprecation warnings
			bufferCommands: false,
		};
		cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => m);
	}

	cached.conn = await cached.promise;
	return cached.conn;
}
