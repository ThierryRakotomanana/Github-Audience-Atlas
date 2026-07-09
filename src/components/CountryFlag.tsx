import React from "react";
import * as Flags from "country-flag-icons/react/3x2";
import { hasFlag } from "country-flag-icons";

interface CountryFlagProps extends React.ImgHTMLAttributes<HTMLImageElement> {
	isoCode: string;
}

export const CountryFlag: React.FC<CountryFlagProps> = ({ isoCode }) => {
	const formattedCode = isoCode.toUpperCase();

	if (!hasFlag(formattedCode)) {
		return <span>{formattedCode}</span>;
	}

	const FlagComponent = (
		Flags as Record<string, React.ComponentType<{ className?: string }>>
	)[formattedCode as keyof typeof Flags];

	return <FlagComponent className='h-full w-full object-cover' />;
};
