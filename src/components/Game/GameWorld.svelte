<script lang="ts" context="module">
import { getAssetURL } from "@includes/functions"
import { onMount } from "svelte"
import GameImage, { GameImageOptions } from "./GameImage.svelte"
import GameScreen from "./GameScreen.svelte"
</script>

<script lang="ts">
const tiles_map: Record<string, Partial<GameImageOptions> & { src: string }> =
	{}
const tile_url = getAssetURL("Tile/medievalTile_44.png")

for (let x = 0; x < 25; x++) {
	for (let y = 0; y < 25; y++) {
		const cords = {
			x: x * 128,
			y: y * 128,
		}

		tiles_map[`${cords.x}:${cords.y}`] = {
			src: tile_url,
			cords,
		}
	}
}

$: tiles = Object.values(tiles_map)

onMount(() => {})
</script>

<GameScreen>
	{#each tiles as tile}
		<GameImage data={tile} />
	{/each}

	<slot />
</GameScreen>
