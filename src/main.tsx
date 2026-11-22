import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
