import { useState } from "react";

import CredentialForm from "./components/CredentialForm";
import { GithubExplorer } from "./components/GithubExplorer";
import { useAudience } from "./hooks/useAudience";
import type { Credentials } from "./types/api.types";

import styles from "./App.module.css";
import { LoadingView } from "./LoadingView";

function App() {
	const [credentials, setCredentials] = useState<Credentials>({
		user: "",
		token: ""
	});

	const { status, steps, pct, user, audience } = useAudience(credentials);

	const isAuthorized = Boolean(credentials.user && credentials.token);

	if (!isAuthorized) {
		return <CredentialForm handleCredentials={setCredentials} />;
	}

	return (
		<div className={styles.root}>
			{user && (
				<header className={styles.banner}>
					<img
						className={styles.bannerAvatar}
						src={user.avatar_url}
						alt={`${user.login}'s avatar`}
						width={38}
						height={38}
					/>
					<div className={styles.bannerInfo}>
						<p className={styles.bannerName}>{user.name ?? user.login}</p>
						<p className={styles.bannerHandle}>@{user.login}</p>
					</div>
					<div className={styles.stats}>
						<div className={styles.stat}>
							<span className={styles.statValue}>
								{user.followers.toLocaleString()}
							</span>
							<span className={styles.statLabel}>Followers</span>
						</div>
						<div className={styles.stat}>
							<span className={styles.statValue}>
								{user.following.toLocaleString()}
							</span>
							<span className={styles.statLabel}>Following</span>
						</div>
					</div>
				</header>
			)}

			{status === "loading" && <LoadingView steps={steps} pct={pct} />}

			{status === "success" && audience && (
				<GithubExplorer
					followers={audience.followers}
					following={audience.following}
					ghosts={audience.ghosts}
				/>
			)}
		</div>
	);
}

export default App;
