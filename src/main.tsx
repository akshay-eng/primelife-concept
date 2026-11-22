import "@fontsource-variable/bricolage-grotesque/standard.css";
import "@fontsource-variable/atkinson-hyperlegible-next";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

// GitHub Pages serves each route as a folder and redirects /homes/x to /homes/x/. Routes have no trailing slash.
const { pathname, search, hash } = window.location;
if (pathname.length > import.meta.env.BASE_URL.length && pathname.endsWith("/")) {
	window.history.replaceState(null, "", pathname.replace(/\/+$/, "") + search + hash);
}

const root = document.getElementById("root");
if (root) {
	createRoot(root).render(
		<StrictMode>
			<App />
		</StrictMode>,
	);
}
