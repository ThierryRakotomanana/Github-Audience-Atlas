import { SearchX } from "lucide-react";

export function EmptyState({ text }: { text: string }) {
	return (
		<div className='flex flex-col items-center gap-2 px-3 py-10 text-center'>
			<SearchX className='h-5 w-5 text-muted-foreground/60' />
			<p className='text-sm text-muted-foreground'>{text}</p>
		</div>
	);
}
