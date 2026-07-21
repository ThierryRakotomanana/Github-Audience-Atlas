import { fetchAllAudience, GITHUB_MAX_PAGE_SIZE } from "./graphql.api";
import {
	BACKFILL_CONCURRENCY,
	fetchAllAudienceLoginsRest,
	fetchProfilesByLoginRest
} from "./rest.api";
import type { TokenPool } from "./token-pool";
import type {
	AllAudienceResult,
	AudienceType,
	GithubProfileNode,
	ReconcileStage,
	ReconciledAudienceResult,
	ReconciliationCostEstimate
} from "./graphql.types.js";

export const fetchAllAudienceReconciled = async (
	login: string,
	audienceType: AudienceType,
	pool: TokenPool,
	onProgress?: (stage: ReconcileStage, done: number, total: number | null) => void,
	signal?: AbortSignal
): Promise<ReconciledAudienceResult> => {
	const graphqlResult: AllAudienceResult = await fetchAllAudience(
		login,
		audienceType,
		pool,
		(done, total) => onProgress?.("graphql", done, total),
		signal
	);

	const byLogin = new Map<string, GithubProfileNode>(
		graphqlResult.nodes.map((node) => [node.login, node])
	);

	const restLogins = await fetchAllAudienceLoginsRest(
		login,
		audienceType,
		pool,
		() => onProgress?.("rest", byLogin.size, null),
		signal
	);

	const missing = [...restLogins].filter((restLogin) => !byLogin.has(restLogin));
	const reconciledTotal = byLogin.size + missing.length;

	const recoveredLogins: string[] = [];
	const unresolvedLogins: string[] = [];

	onProgress?.("backfill", byLogin.size, reconciledTotal);

	const PROGRESS_CHUNK = 20;
	for (let i = 0; i < missing.length; i += PROGRESS_CHUNK) {
		const chunk = missing.slice(i, i + PROGRESS_CHUNK);
		const { profiles, unresolved } = await fetchProfilesByLoginRest(
			chunk,
			pool,
			signal,
			BACKFILL_CONCURRENCY
		);

		for (const [chunkLogin, node] of profiles) {
			byLogin.set(chunkLogin, node);
			recoveredLogins.push(chunkLogin);
		}
		unresolvedLogins.push(...unresolved);
		onProgress?.("backfill", byLogin.size, reconciledTotal);
	}

	return {
		nodes: [...byLogin.values()],
		graphqlTotalCount: graphqlResult.totalCount,
		restTotalCount: restLogins.size,
		recoveredLogins,
		unresolvedLogins
	};
};

export function estimateReconciliationCost(
	audienceCount: number
): ReconciliationCostEstimate {
	const pages = Math.max(Math.ceil(audienceCount / GITHUB_MAX_PAGE_SIZE), 1);
	return {
		graphqlPoints: pages,
		restRequests: pages,
		worstCaseBackfillPoints: audienceCount
	};
}
