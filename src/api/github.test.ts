import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	vi,
	type MockedFunction
} from "vitest";
import { githubFetch } from "./github";

const mockFetch = (): MockedFunction<typeof fetch> => vi.mocked(fetch);

const RESET_EPOCH = 9_999_999_999;

function rateLimitHeaders({
	limit = 5000,
	remaining = 4000,
	reset = RESET_EPOCH
}: { limit?: number; remaining?: number; reset?: number } = {}): Headers {
	return new Headers({
		"X-RateLimit-Limit": String(limit),
		"X-RateLimit-Remaining": String(remaining),
		"X-RateLimit-Reset": String(reset)
	});
}

function makeResponse(
	body: unknown,
	{ status = 200, headers }: { status?: number; headers?: Headers } = {}
): Response {
	return {
		status,
		ok: status >= 200 && status < 300,
		statusText: status === 200 ? "OK" : String(status),
		headers: headers ?? rateLimitHeaders(),
		json: vi.fn().mockResolvedValue(body)
	} as unknown as Response;
}

beforeEach(() => {
	vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
	vi.unstubAllGlobals();
	vi.restoreAllMocks();
});

const abortSignal = AbortSignal.timeout(5_000);

describe("github fecth", () => {
	it("returns parsed JSON and rate-limit on 200", async () => {
		mockFetch().mockResolvedValue(makeResponse({ login: "alice" }));
		const { data, rateLimit } = await githubFetch("users/alice", abortSignal);

		expect(data).toEqual({ login: "alice" });
		expect(rateLimit.limit).toBe(5000);
	});
});
