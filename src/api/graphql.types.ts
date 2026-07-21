export type AudienceType = "followers" | "following";

export interface GithubProfileNode {
	login: string;
	id: string;
	name: string | null;
	avatarUrl: string;
	url: string;
	company: string | null;
	location: string | null;
	twitterUsername: string | null;
	isSiteAdmin: boolean;
}

export interface PageInfo {
	hasNextPage: boolean;
	endCursor: string | null;
}

export interface AudienceConnection {
	totalCount: number;
	pageInfo: PageInfo;
	nodes: GithubProfileNode[];
}

export interface RateLimit {
	limit: number;
	cost: number;
	remaining: number;
	resetAt: string;
}

export interface AudiencePageResult {
	login: string;
	audience: AudienceConnection;
	rateLimit: RateLimit;
}

export type GithubUserProfile = GithubProfileNode & {
	followersCount: number;
	followingCount: number;
};

export interface UserProfileResult {
	profile: GithubUserProfile;
	rateLimit: RateLimit;
}

export interface RawAudienceQueryResponse {
	user: {
		login: string;
		followers?: AudienceConnection;
		following?: AudienceConnection;
	} | null;
	rateLimit: RateLimit;
}

export interface RawUserProfileQueryResponse {
	user:
		| (GithubProfileNode & {
				followers: { totalCount: number };
				following: { totalCount: number };
		  })
		| null;
	rateLimit: RateLimit;
}

export type Credentials = { user: string; token: string };

export type LocalizedGithubProfile = GithubProfileNode & { country: string };

export type AudienceData = {
	followers: LocalizedGithubProfile[];
	following: LocalizedGithubProfile[];
	ghosts: LocalizedGithubProfile[];
};

export type StepId = "fetch" | "geocode" | "done";
export type StepStatus = "idle" | "active" | "done";

export type Step = {
	id: StepId;
	label: string;
	status: StepStatus;
	detail: string;
};

export type ProfileProgress = {
	done: number;
	total: number;
};

export type CostEstimate = {
	pointsNeeded: number;
	remaining: number;
	willExceed: boolean;
};

export interface AllAudienceResult {
	nodes: GithubProfileNode[];
	totalCount: number;
}

export type ReconcileStage = "graphql" | "rest" | "backfill";

export interface ReconciledAudienceResult {
	nodes: GithubProfileNode[];
	graphqlTotalCount: number;
	restTotalCount: number;
	recoveredLogins: string[];
	unresolvedLogins: string[];
}

export interface ReconciliationCostEstimate {
	graphqlPoints: number;
	restRequests: number;
	worstCaseBackfillPoints: number;
}
