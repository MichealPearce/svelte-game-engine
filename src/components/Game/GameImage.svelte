<script lang="ts" context="module">
import { onDestroy, onMount, setContext } from "svelte"
import { writable, Writable } from "svelte/store"
import { useGameHooks } from "@includes/GameHook"
import type { GameCords } from "@includes/GameTypes"
import _ from "lodash"

export type GameImageOptions = {
	src: string
	image: HTMLImageElement
	loaded: boolean
	cords: GameCords
}

export type GameImage = Writable<GameImageOptions>

export function createImage(
	data: Partial<GameImageOptions> & { src: string }
): GameImage {
	return writable(
		_.defaultsDeep(data, {
			image: new Image(),
			loaded: false,
			cords: {
				x: 0,
				y: 0,
			},
		})
	)
}

export function provideImage(image: GameImage) {
	setContext("game-image", image)
}

export function useImage(image: GameImage) {}
</script>

<script lang="ts">
export let data: Partial<GameImageOptions> & { src: string }

const hooks = useGameHooks()

const asset = createImage(data)

$: cords = $asset.cords
$: image = $asset.image

const muteRender = hooks.listen("render", render => {
	if (!$asset.loaded) return
	render.drawImage(image, cords.x, cords.y)
})

provideImage(asset)

onDestroy(() => {
	muteRender()
})
</script>

<img
	bind:this={$asset.image}
	src={$asset.src}
	alt=""
	on:load={() => ($asset.loaded = true)}
/>
<slot />
