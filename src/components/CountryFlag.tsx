import { memo, type ComponentType, type SVGProps } from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { hasFlag } from "country-flag-icons";
import { getRegionName } from "@/lib/region";

interface CountryFlagProps {
	isoCode: string;
	className?: string;
}

const FLAG_COMPONENTS = Flags as unknown as Record<
	string,
	ComponentType<SVGProps<SVGSVGElement>>
>;

function CountryFlagBase({
	isoCode,
	className = "h-full w-full object-cover"
}: CountryFlagProps) {
	const code = isoCode.toUpperCase();
	const label = getRegionName(code);

	if (!hasFlag(code)) {
		return (
			<span className={className} role='img' aria-label={label}>
				{code}
			</span>
		);
	}

	const Flag = FLAG_COMPONENTS[code];
	return <Flag className={className} role='img' aria-label={label} />;
}

CountryFlagBase.displayName = "CountryFlag";

export const CountryFlag = memo(CountryFlagBase);
