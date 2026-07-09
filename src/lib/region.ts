const regionNames = new Intl.DisplayNames(["en"], { type: "region" });

export function getRegionName(code: string): string {
	try {
		return regionNames.of(code) ?? code;
	} catch {
		return code;
	}
}
