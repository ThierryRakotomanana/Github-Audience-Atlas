const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export const UNKNOWN_REGION = "UNKNOWN";

export function getRegionName(code: string): string {
	if (code === UNKNOWN_REGION) return "Unknown location";
	try {
		return regionNames.of(code) ?? code;
	} catch {
		return code;
	}
}
