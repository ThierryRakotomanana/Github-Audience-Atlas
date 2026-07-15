import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Loader2, CircleDashed } from "lucide-react";
import type { Step } from "../types/api.types";

function StepIcon({ status }: { status: Step["status"] }) {
	if (status === "done") {
		return <CheckCircle2 className='h-5 w-5 text-green-600' aria-hidden />;
	}
	if (status === "active") {
		return <Loader2 className='h-5 w-5 animate-spin text-primary' aria-hidden />;
	}
	return <CircleDashed className='h-5 w-5 text-muted-foreground' aria-hidden />;
}

function StepRow({ step }: { step: Step }) {
	return (
		<div className='flex items-start gap-3 py-2'>
			<span className='w-5 h-5 flex items-center justify-center mt-0.5 shrink-0'>
				<StepIcon status={step.status} />
			</span>
			<div className='flex-1 min-w-0'>
				<p
					className={`text-sm font-medium transition-colors ${
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
		<div
			role='status'
			aria-live='polite'
			className='w-full flex-1 flex flex-col items-center justify-center gap-4 px-4 py-8'>
			<div className='w-full max-w-md'>
				<p className='text-xl font-medium text-center text-muted-foreground mb-4'>
					{pct <= 50 ? "Fetching your audience..." : "Building your atlas..."}
				</p>
				<div className='w-full flex items-center justify-between gap-2 mb-2'>
					<span className='text-xs text-muted-foreground'>Progress</span>
					<span className='font-mono text-xs text-muted-foreground'>{pct}%</span>
				</div>
				<Progress value={pct} className='h-1.5 [&>div]:bg-primary' />
			</div>
			<Card className='w-full max-w-md'>
				<CardContent className='p-4 flex flex-col divide-y divide-border'>
					{steps.map((step) => (
						<StepRow key={step.id} step={step} />
					))}
				</CardContent>
			</Card>
		</div>
	);
}
