import { CountryFlag } from "@/components/CountryFlag";
import { UNKNOWN_REGION } from "@/lib/region";
import { cn } from "@/lib/utils";
import { Globe2 } from "lucide-react";

export function RegionIcon({
	code,
	className
}: {
	code: string;
	className?: string;
}) {
	if (code === UNKNOWN_REGION) {
		return (
			<span
				className={cn(
					"flex items-center justify-center bg-muted text-muted-foreground",
					className
				)}>
				<Globe2 className='h-3 w-3' />
			</span>
		);
	}
	return <CountryFlag isoCode={code} className={className} />;
}
