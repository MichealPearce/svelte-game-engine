<script lang="ts">
import { GameHook, provideGameHooks } from "@includes/GameHook"
import is from "@includes/is"
import { afterUpdate, onDestroy, onMount } from "svelte"
import { createEngine, provideEngine } from "./GameEngine"
import GameEventListener from "./GameEventListener.svelte"

const engine = createEngine()

engine.watch("canvas", function (canvas) {
	this.render = canvas?.getContext("2d") ?? null
})

const listeners = [
	$engine.hooks.listen("tick", () => {
		$engine.ticks.logic++
	}),

	$engine.hooks.listen(
		"render",
		render => {
			if (is.Undefined($engine.canvas)) return
			const [width, height] = [$engine.canvas.width, $engine.canvas.height]
			$engine.ticks.render++

			render.resetTransform()
			render.clearRect(0, 0, width, height)
		},
		0
	),
]

provideGameHooks($engine.hooks)
provideEngine(engine)

onMount(() => {
	engine.start()
})

afterUpdate(() => {})

onDestroy(() => {
	listeners.forEach(mute => mute())
	GameHook.clear()
	$engine.running = false
})
</script>

<svelte:window on:resize={engine.resizeCanvas.bind(engine)} />

<div class="game-engine">
	<slot name="overlay" />
	<canvas bind:this={$engine.canvas}>
		<GameEventListener>
			<slot />
		</GameEventListener>
	</canvas>
</div>

<style>
.game-engine {
	width: 100%;
	height: 100%;
}

canvas {
	background-color: black;
}
</style>
