import type { Step } from "./types/api.types";

import styles from "./LoadingView.module.css";

const CheckIcon = () => (
	<svg
		className={styles.iconDone}
		viewBox='0 0 16 16'
		fill='none'
		aria-hidden='true'>
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

const StepRow = ({ step }: { step: Step }) => {
	const icon = {
		idle: <span className={styles.iconIdle} aria-hidden='true' />,
		active: <span className={styles.iconActive} aria-hidden='true' />,
		done: <CheckIcon />
	}[step.status];

	return (
		<div
			className={styles.step}
			role='listitem'
			aria-label={`${step.label}: ${step.status}${step.detail ? `, ${step.detail}` : ""}`}>
			<span className={styles.stepIcon}>{icon}</span>
			<div className={styles.stepBody}>
				<p className={`${styles.stepLabel} ${styles[step.status]}`}>{step.label}</p>
				<p className={styles.stepDetail} aria-live='polite'>
					{step.detail}
				</p>
			</div>
		</div>
	);
};

type LoadingViewProps = {
	steps: Step[];
	pct: number;
};

export const LoadingView = ({ steps, pct }: LoadingViewProps) => (
	<div
		className={styles.root}
		role='status'
		aria-label='Loading your audience data'
		aria-live='polite'>
		<p className={styles.title}>Fetching your audience…</p>

		<div className={styles.barWrapper}>
			<div className={styles.barTrack}>
				<div
					className={styles.barFill}
					style={{ width: `${pct}%` }}
					role='progressbar'
					aria-valuenow={pct}
					aria-valuemin={0}
					aria-valuemax={100}
				/>
			</div>
			<span className={styles.barPct}>{pct}%</span>
		</div>
		<ol className={styles.steps} role='list' aria-label='Loading steps'>
			{steps.map((step) => (
				<StepRow key={step.id} step={step} />
			))}
		</ol>
	</div>
);
