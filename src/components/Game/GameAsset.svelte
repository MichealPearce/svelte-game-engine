<script lang="ts" context="module">
import { onMount, setContext } from "svelte"
import { writable, Writable } from "svelte/store"

export type GameAsset = Writable<{
	src: string
	image: HTMLImageElement
	loaded: boolean
}>

export function createAsset(src: string): GameAsset {
	return writable({
		src,
		image: new Image(),
		loaded: false,
	})
}

export function provideAsset(asset: GameAsset) {
	setContext("game-asset", asset)
}

export function useAsset(asset: GameAsset) {}
</script>

<script lang="ts">
export let src: string

const asset = createAsset(src)

onMount(() => {
	console.log($asset.image)
})
</script>

<img
	bind:this={$asset.image}
	{src}
	alt=""
	on:load={() => ($asset.loaded = true)}
/>
