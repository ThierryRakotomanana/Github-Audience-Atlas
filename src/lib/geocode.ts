import { delay } from "../api/github";
import { ISO_WORD_BLOCKLIST } from "../constants/commonWords";
import { CN, countryCodesSet } from "../constants/countries";
import { CDICT } from "../constants/lookupTables";
import { SKIP } from "../constants/unlocated";
import type { GithubProfile } from "../types/api.types";

export type GeocodeResult = {
	pcMap: Map<string, string>;
	needLoc: Map<string, string | null>;
	skipped: Map<string, string>;
};

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
		if (
			token.length === 2
			&& !ISO_WORD_BLOCKLIST.has(token)
			&& countryCodesSet.has(token.toUpperCase())
		) {
			return token.toUpperCase();
		}

		for (const [city, country] of Object.entries(CDICT)) {
			if (token === city.toLowerCase()) return country;
		}
	}

	return null;
};

export async function geocode(
	rawData: GithubProfile[],
	onProgress: ({ done, total }: { done: number; total: number }) => void
): Promise<GeocodeResult> {
	const pcMap = new Map<string, string>();
	const needLoc = new Map<string, string | null>();
	const skipped = new Map<string, string>();

	const total = rawData.length;

	for (let i = 0; i < total; i++) {
		const profile = rawData[i];
		const clean = cleanLoc(profile.location);
		const country = guessCountry(clean);

		if (!country && 0 < clean.length) {
			needLoc.set(profile.login, profile.location);
		} else if (country === "SKIP") {
			skipped.set(clean.join("|"), "SKIP");
		} else if (!country && clean.length == 0) {
			skipped.set(clean.join("|"), "SKIP");
		} else {
			pcMap.set(
				profile.login,
				`location: ${profile.location}, country : ${country}`
			);
		}

		onProgress({ done: i + 1, total });
		await delay(10);
	}

	return { pcMap, needLoc, skipped };
}
