<script lang="ts">
import { useGameHooks } from "@includes/GameHook"
import { onDestroy, onMount } from "svelte"

const hooks = useGameHooks()

let ticker: any
let fps = 0
let frames = 0

const mute = hooks.listen("render", () => {
	frames++
})

onMount(() => {
	ticker = setInterval(() => {
		fps = frames
		frames = 0
	}, 999)
})

onDestroy(() => {
	clearInterval(ticker)
	mute()
})
</script>

<div class="fps">
	{fps}
</div>

<style>
.fps {
	padding: 1em;

	position: absolute;
	right: 0px;
	top: 0px;
	z-index: 999;

	background-color: white;
	color: black;
}
</style>
