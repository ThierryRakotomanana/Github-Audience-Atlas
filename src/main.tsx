import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { WorldMap } from "@/components/WorldMap.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<WorldMap width={900} height={450} />
	</StrictMode>
);
