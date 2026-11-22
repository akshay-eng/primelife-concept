import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	// GitHub Pages serves a project site under /<repo>/; CI sets BASE_PATH.
	base: process.env.BASE_PATH ?? "/",
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: { "@": path.resolve(import.meta.dirname, "src") },
	},
	build: {
		target: "es2022",
		chunkSizeWarningLimit: 1600,
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes("node_modules/three") || id.includes("@react-three")) return "three";
					if (id.includes("node_modules/gsap") || id.includes("node_modules/lenis")) return "scroll";
				},
			},
		},
	},
});
