import { Progress } from "@/components/ui/progress";
import type { Step } from "../types";

const CheckIcon = () => (
	<svg className='w-4 h-4 text-primary' viewBox='0 0 16 16' fill='none'>
		<circle cx='8' cy='8' r='8' fill='currentColor' opacity='0.15' />
		<circle cx='8' cy='8' r='7' stroke='currentColor' strokeWidth='1.5' />
		<path
			d='M5 8l2 2 4-4'
			stroke='currentColor'
			strokeWidth='1.5'
			strokeLinecap='round'
			strokeLinejoin='round'
		/>
	</svg>
);

const Spinner = () => (
	<svg
		className='w-4 h-4 animate-spin text-primary'
		viewBox='0 0 24 24'
		fill='none'>
		<circle
			cx='12'
			cy='12'
			r='10'
			stroke='currentColor'
			strokeWidth='2'
			opacity='0.2'
		/>
		<path
			d='M12 2a10 10 0 0 1 10 10'
			stroke='currentColor'
			strokeWidth='2'
			strokeLinecap='round'
		/>
	</svg>
);

const IdleDot = () => (
	<span className='w-2 h-2 rounded-full border border-border block' />
);

function StepRow({ step }: { step: Step }) {
	return (
		<div className='flex items-start gap-3 py-2'>
			<span className='w-4 h-4 flex items-center justify-center mt-0.5 shrink-0'>
				{step.status === "done" && <CheckIcon />}
				{step.status === "active" && <Spinner />}
				{step.status === "idle" && <IdleDot />}
			</span>
			<div className='flex-1 min-w-0'>
				<p
					className={`text-sm font-medium ${
						step.status === "active" ? "text-card-foreground"
						: step.status === "done" ? "text-foreground"
						: "text-muted-foreground"
					}`}>
					{step.label}
				</p>
				<p className='font-mono text-xs text-muted-foreground min-h-[16px] mt-0.5'>
					{step.detail}
				</p>
			</div>
		</div>
	);
}

export function LoadingView({ steps, pct }: { steps: Step[]; pct: number }) {
	return (
		<div className='flex flex-col items-center justify-center min-h-[60vh] gap-8 px-8'>
			<p className='text-sm font-medium text-card-foreground'>
				Fetching your audience…
			</p>
			<div className='w-full max-w-xs flex flex-col gap-2'>
				<Progress value={pct} className='h-1 [&>div]:bg-primary' />
				<span className='font-mono text-xs text-muted-foreground text-right'>
					{pct}%
				</span>
			</div>
			<div className='w-full max-w-xs'>
				{steps.map((step) => (
					<StepRow key={step.id} step={step} />
				))}
			</div>
		</div>
	);
}
