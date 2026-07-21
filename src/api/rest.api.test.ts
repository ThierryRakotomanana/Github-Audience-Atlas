import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchProfilesByLoginRest } from "./rest.api";

const mockFetchUserProfileRest = vi.hoisted(() => vi.fn());

vi.mock("./rest.api", async (importOriginal) => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const actual = await importOriginal<any>();
	return {
		...actual,
		fetchUserProfileRest: mockFetchUserProfileRest
	};
});

describe("fetchProfilesByLoginRest", () => {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mockPool = {} as any;

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("pushes users to unresolved if a generic error occurs (e.g., 500 Server Error)", async () => {
		mockFetchUserProfileRest.mockRejectedValueOnce(new Error("GitHub API is down"));

		const result = await fetchProfilesByLoginRest(["unlucky-user"], mockPool);

		expect(result.profiles.size).toBe(0);
		expect(result.unresolved).toEqual(["unlucky-user"]);
	});
});
