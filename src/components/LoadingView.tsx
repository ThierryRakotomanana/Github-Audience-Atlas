import { Progress } from "@/components/ui/progress";
import type { Step } from "../types/api.types";
import { CheckCircle2, Loader, SnowflakeIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

function StepRow({ step }: { step: Step }) {
	return (
		<div className='flex items-start gap-3 py-2'>
			<span className='w-5 h-5 flex items-center justify-center mt-0.5 shrink-0'>
				{step.status === "done" && (
					<CheckCircle2 fill='#001a00' className='text-accent' strokeWidth={1} />
				)}
				{step.status === "active" && (
					<Loader className='animate-spin text-primary' />
				)}
				{step.status === "idle" && <SnowflakeIcon className='text-foreground' />}
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
				<p className='font-mono text-xs text-muted-foreground min-h-4 mt-0.5'>
					{step.detail}
				</p>
			</div>
		</div>
	);
}

export function LoadingView({ steps, pct }: { steps: Step[]; pct: number }) {
	return (
		<div className='w-full m-auto flex flex-col items-center gap-4'>
			<div className='w-md'>
				<p className='text-xl font-medium atlas-brand-text text-center mb-4'>
					{pct <= 50 ? "Fetching your audience…" : "Building your atlas…"}
				</p>
				<div className='w-full flex flex-col items-center gap-2'>
					<span className='font-mono text-xs text-muted-foreground text-right'>
						{pct}%
					</span>
					<Progress value={pct} className='h-1 [&>div]:bg-primary' />
				</div>
			</div>
			<Card className='w-md'>
				<CardContent className='m-auto max-w-sm '>
					{steps.map((step) => (
						<StepRow key={step.id} step={step} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
