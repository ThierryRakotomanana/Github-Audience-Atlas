export function Stat({ label, value }: { label: string; value: number }) {
	return (
		<div className='text-center'>
			<p className='font-mono text-sm font-medium text-card-foreground'>
				{value.toLocaleString()}
			</p>
			<p className='text-[10px] text-muted-foreground uppercase tracking-widest font-medium'>
				{label}
			</p>
		</div>
	);
}
