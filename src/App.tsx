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

	const { userFollowers, userFollowing, ghosts, user, loading, steps } =
		useAudience(credentials);
	const handleCredentials = (credentials: Credentials) => {
		setCredential({ ...credentials });
	};

	return (
		<>
			<div>
				{/**
				 * TODO
				 * need to refactor this
				 **/}
				<CredentialForm handleCredentials={handleCredentials} />
				{loading ?
					`steps : ${steps?.steps} and status: ${steps?.done}`
				:	user
					&& ` Here you are  :  ${user.name} You have ${user.followers} followers and ${user.following} following`
				}
				{!loading && userFollowers && userFollowing && ghosts && (
					<GithubExplorer
						followers={userFollowers}
						following={userFollowing}
						ghosts={ghosts}
					/>
				)}
			</div>
		</>
	);
}

export default App;
