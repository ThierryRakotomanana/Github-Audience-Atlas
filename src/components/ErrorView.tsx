import { Button } from "@/components/ui/button";

const ErrorIcon = () => (
	<svg
		className='w-6 h-6'
		viewBox='0 0 24 24'
		fill='none'
		stroke='currentColor'
		strokeWidth='1.75'
		strokeLinecap='round'
		strokeLinejoin='round'>
		<circle cx='12' cy='12' r='10' />
		<line x1='12' y1='8' x2='12' y2='12' />
		<line x1='12' y1='16' x2='12.01' y2='16' />
	</svg>
);

export function ErrorView({
	message,
	resetAt,
	onRetry
}: {
	message: string;
	resetAt: Date | null;
	onRetry: () => void;
}) {
	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] gap-5 px-8 text-center'>
			<div className='w-12 h-12 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive flex items-center justify-center opacity-80'>
				<ErrorIcon />
			</div>

			<div className='max-w-sm'>
				<h2 className='text-base font-medium text-card-foreground'>
					Something went wrong
				</h2>
				<p className='text-sm text-destructive mt-2 leading-relaxed'>{message}</p>
				{resetAt && (
					<p className='text-xs text-muted-foreground mt-2'>
						Quota refills at{" "}
						<span className='font-medium text-card-foreground'>
							{resetAt.toLocaleTimeString([], {
								hour: "2-digit",
								minute: "2-digit"
							})}
						</span>
					</p>
				)}
			</div>

			<Button variant='outline' onClick={onRetry} className='mt-1'>
				← Try again
			</Button>
		</div>
	);
}
