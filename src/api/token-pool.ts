export interface RateLimitSnapshot {
	limit: number;
	remaining: number;
	resetAt: Date;
}

interface TokenState {
	token: string;
	remaining: number | null;
	limit: number | null;
	resetAt: Date | null;
}

const LOW_QUOTA_RATIO = 0.02;

export class AllTokensExhaustedError extends Error {
	constructor(public readonly resetAt: Date) {
		super(
			`All tokens exhausted. Earliest reset at ${resetAt.toLocaleTimeString()}.`
		);
		this.name = "AllTokensExhaustedError";
	}
}

export class TokenPool {
	private readonly states: TokenState[];
	private cursor = 0;

	constructor(tokens: string[]) {
		const unique = [...new Set(tokens.map((t) => t.trim()).filter(Boolean))];
		if (unique.length === 0) {
			throw new Error("TokenPool requires at least one non-empty token.");
		}
		this.states = unique.map((token) => ({
			token,
			remaining: null,
			limit: null,
			resetAt: null
		}));
	}

	get size(): number {
		return this.states.length;
	}

	private isUsable(state: TokenState, now: number): boolean {
		if (state.remaining === null) return true;
		const buffer =
			state.limit ? Math.max(Math.ceil(state.limit * LOW_QUOTA_RATIO), 1) : 1;
		if (state.remaining > buffer) return true;
		return state.resetAt !== null && state.resetAt.getTime() <= now;
	}

	acquire(exclude: ReadonlySet<string> = new Set()): string | null {
		const now = Date.now();
		for (let i = 0; i < this.states.length; i++) {
			const idx = (this.cursor + i) % this.states.length;
			const state = this.states[idx];
			if (exclude.has(state.token)) continue;
			if (this.isUsable(state, now)) {
				this.cursor = idx;
				return state.token;
			}
		}
		return null;
	}

	report(token: string, snapshot: RateLimitSnapshot): void {
		const state = this.states.find((s) => s.token === token);
		if (!state) return;
		state.remaining = snapshot.remaining;
		state.limit = snapshot.limit;
		state.resetAt = snapshot.resetAt;
	}

	markExhausted(token: string, resetAt: Date): void {
		const state = this.states.find((s) => s.token === token);
		if (!state) return;
		state.remaining = 0;
		state.resetAt = resetAt;
	}

	earliestResetAt(): Date {
		return this.states.reduce(
			(earliest, s) => {
				const reset = s.resetAt ?? new Date(Date.now() + 60_000);
				return reset < earliest ? reset : earliest;
			},
			new Date(Date.now() + 24 * 60 * 60 * 1000)
		);
	}
}

export function resetAtFromHeaders(headers?: Record<string, string>): Date {
	const retryAfter = headers?.["retry-after"];
	if (retryAfter) return new Date(Date.now() + Number(retryAfter) * 1000);
	const resetHeader = headers?.["x-ratelimit-reset"];
	if (resetHeader) return new Date(Number(resetHeader) * 1000);
	return new Date(Date.now() + 60_000);
}

export async function withTokenRotation<T>(
	pool: TokenPool,
	fn: (token: string) => Promise<T>,
	classify: (error: unknown) => Date | null
): Promise<T> {
	const tried = new Set<string>();

	while (true) {
		const token = pool.acquire(tried);
		if (!token) throw new AllTokensExhaustedError(pool.earliestResetAt());

		try {
			return await fn(token);
		} catch (error) {
			const resetAt = classify(error);
			if (!resetAt) throw error;
			pool.markExhausted(token, resetAt);
			tried.add(token);
		}
	}
}
