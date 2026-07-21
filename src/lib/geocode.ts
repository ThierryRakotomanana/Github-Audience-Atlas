import type { GithubProfileNode, ProfileProgress } from "@/api/graphql.types";
import { CN } from "../constants/countries";
import { CDICT } from "../constants/lookupTables";
import { SKIP } from "../constants/unlocated";
import { delay } from "@/api/graphql.api";

export type GeocodeResult = {
	usersByCountry: Map<string, GithubProfileNode[]>;
	profileCountryMap: Map<string, string>;
	missingDictionaryMatches: Map<string, string | null>;
	invalidOrSkippedLocations: Map<string, string>;
};

const LOWER_CDICT = new Map<string, string>(
	Object.entries(CDICT).map(([city, country]) => [city.toLowerCase(), country])
);

const NOISE_WORDS =
	/\b(remote|currently|based in|living in|from|near|@|formerly|ex-)\b/gi;
const NON_LETTER = /[^a-zA-Z\p{L}\u{1F1E6}-\u{1F1FF}]/gu;
const LONE_FLAG =
	/(?<![\u{1F1E6}-\u{1F1FF}])[\u{1F1E6}-\u{1F1FF}](?![\u{1F1E6}-\u{1F1FF}])/gu;
const DELIMITER =
	/(?<=[a-z])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])|[()|/\s\-_.,;:!?@#&[\]{}<>*+=%^~$`"\\]+/;

const normalise = (s: string): string => s.normalize("NFD").replace(/\p{Mn}/gu, "");

export const cleanLoc = (raw: string | null): string[] => {
	if (!raw?.trim()) return [];

	const pieces = raw
		.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "")
		.split(DELIMITER)
		.map((chunk) =>
			normalise(
				chunk
					.replace(NOISE_WORDS, "")
					.replace(NON_LETTER, "")
					.replace(LONE_FLAG, "")
					.trim()
					.toLowerCase()
			)
		)
		.filter(Boolean);

	if (pieces.length === 0) return [];
	if (pieces.length === 1) return pieces;

	const ngrams: string[] = [];
	for (let len = pieces.length; len >= 1; len--) {
		for (let start = 0; start <= pieces.length - len; start++) {
			ngrams.push(pieces.slice(start, start + len).join(" "));
		}
	}
	return [...new Set(ngrams)];
};

export const guessCountry = (locations: string[]) => {
	if (locations.length === 0) return null;

	for (const token of locations) {
		const country = CN[token as keyof typeof CN];
		if (country) return country;
	}

	for (const TOKEN of locations) {
		const token = TOKEN.toLowerCase();
		if (SKIP.has(token)) return "SKIP";

		const countryFromDict = LOWER_CDICT.get(token);
		if (countryFromDict) return countryFromDict;
	}

	return null;
};

export async function geocode(
	rawData: GithubProfileNode[],
	onProgress: ({ done, total }: { done: number; total: number }) => void,
	signal?: AbortSignal
): Promise<GeocodeResult | undefined> {
	const profileCountryMap = new Map<string, string>();
	const missingDictionaryMatches = new Map<string, string | null>();
	const invalidOrSkippedLocations = new Map<string, string>();
	const usersByCountry = new Map<string, GithubProfileNode[]>();

	if (signal?.aborted) return;

	const total = rawData.length;
	const YIELD_BATCH_SIZE = 100;

	const safeOnProgress = (progress: ProfileProgress) => {
		if (signal?.aborted) return;
		onProgress(progress);
	};

	for (let i = 0; i < total; i++) {
		if (signal?.aborted) return;

		const profile = rawData[i];
		const clean = cleanLoc(profile.location);

		if (clean.length === 0) {
			invalidOrSkippedLocations.set(profile.login, "EMPTY");
		} else {
			const country = guessCountry(clean);
			const locationKey = clean.join("|");

			if (country === "SKIP") {
				invalidOrSkippedLocations.set(locationKey, "SKIP");
			} else if (country === null) {
				missingDictionaryMatches.set(profile.login, profile.location);
			} else {
				profileCountryMap.set(profile.login, country);

				let regionalUsers = usersByCountry.get(country);
				if (!regionalUsers) {
					regionalUsers = [];
					usersByCountry.set(country, regionalUsers);
				}
				regionalUsers.push(profile);
			}
		}

		safeOnProgress({ done: i + 1, total });

		if ((i + 1) % YIELD_BATCH_SIZE === 0) {
			if (signal?.aborted) return;
			await delay(0);
			if (signal?.aborted) return;
		}
	}

	return {
		usersByCountry,
		profileCountryMap,
		missingDictionaryMatches,
		invalidOrSkippedLocations
	};
}
