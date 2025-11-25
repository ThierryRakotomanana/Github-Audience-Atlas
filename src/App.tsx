import { useState } from "react";
import "./App.css";
import { GithubExplorer } from "./components/GithubExplorer";
import type { Credentials } from "./types/api.types";
import CredentialForm from "./components/CredentialForm";
import { useAudience } from "./hooks/useAudience";

function App() {
	const [credentials, setCredential] = useState<Credentials>({
		user: "",
		token: ""
	});

	const controller = new AbortController();

	const { following, followers, ghosts, user } = useAudience(
		credentials,
		controller
	);
	const handleCredentials = (credentials: Credentials) => {
		setCredential({ ...credentials });
	};

	return (
		<>
			<div>
				<CredentialForm handleCredentials={handleCredentials} />
				{user
					&& ` Here you are  :  ${user.name} You have ${user.followers} followers and ${user.following} following`}
				{following && followers && ghosts && (
					<GithubExplorer
						followers={followers}
						following={following}
						ghosts={ghosts}
					/>
				)}
			</div>
		</>
	);
}

export default App;
