import {
	useState,
	type ChangeEvent,
	type CSSProperties,
	type SubmitEvent
} from "react";
import type { Credentials } from "../types/api.types";

const CredentialForm = (props: {
	handleCredentials: (credentials: Credentials) => void;
}) => {
	const [formData, setFormData] = useState<Credentials>({
		user: "",
		token: ""
	});

	const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: value
		}));
	};

	const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		props.handleCredentials(formData);
		// Add your authentication logic here
	};

	// --- Inline Styles ---
	const styles: Record<string, CSSProperties> = {
		container: {
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			padding: "2rem",
			backgroundColor: "#f9f9f9",
			borderRadius: "8px",
			boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
			width: "320px",
			margin: "2rem auto",
			fontFamily: "system-ui, -apple-system, sans-serif"
		},
		header: {
			marginBottom: "1.5rem",
			color: "#333",
			fontSize: "1.25rem",
			fontWeight: "600"
		},
		form: {
			width: "100%",
			display: "flex",
			flexDirection: "column",
			gap: "1rem"
		},
		inputGroup: {
			display: "flex",
			flexDirection: "column",
			gap: "0.5rem"
		},
		label: {
			fontSize: "0.875rem",
			color: "#666",
			fontWeight: "500"
		},
		input: {
			padding: "0.75rem",
			borderRadius: "4px",
			border: "1px solid #ddd",
			fontSize: "1rem",
			outline: "none",
			transition: "border-color 0.2s"
		},
		button: {
			marginTop: "0.5rem",
			padding: "0.75rem",
			backgroundColor: "#0070f3",
			color: "white",
			border: "none",
			borderRadius: "4px",
			fontSize: "1rem",
			fontWeight: "500",
			cursor: "pointer",
			transition: "background-color 0.2s"
		}
	};

	return (
		<div style={styles.container}>
			<h2 style={styles.header}>Audience Atlas</h2>
			<form style={styles.form} onSubmit={handleSubmit}>
				<div style={styles.inputGroup}>
					<label style={styles.label} htmlFor='user'>
						Github User
					</label>
					<input
						style={styles.input}
						type='text'
						id='user'
						name='user'
						placeholder='Enter user'
						value={formData.user}
						onChange={handleChange}
						required
					/>
				</div>

				<div style={styles.inputGroup}>
					<label style={styles.label} htmlFor='token'>
						Token
					</label>
					<input
						style={styles.input}
						id='token'
						name='token'
						placeholder='Enter secure token'
						value={formData.token}
						onChange={handleChange}
					/>
				</div>

				<button
					style={styles.button}
					type='submit'
					onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#005bc1")}
					onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#0070f3")}>
					Authorize
				</button>
			</form>
		</div>
	);
};

export default CredentialForm;
