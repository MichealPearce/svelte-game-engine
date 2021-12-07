import { defineConfig } from "vite"
import { svelte } from "@sveltejs/vite-plugin-svelte"
import path from "path"

// https://vitejs.dev/config/
export default defineConfig({
	resolve: {
		alias: {
			"@components": path.resolve("src/components"),
			"@includes": path.resolve("src/includes"),
			"@lib": path.resolve("src/lib"),
		},
	},
	plugins: [svelte()],
})
