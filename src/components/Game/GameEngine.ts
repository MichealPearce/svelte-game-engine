import { createGameHooks, GameHook } from "@includes/GameHook"
import is from "@includes/is"
import { useHookableObject } from "@lib/HookableObject"
import Store from "@lib/Store"
import { getContext, setContext } from "svelte"

declare module "@lib/HookableObject" {
	export interface HookableObjects {
		engine: GameEngine
	}
}

export interface GameEngineState {
	running: boolean
	canvas?: HTMLCanvasElement
	render: CanvasRenderingContext2D | null
	hooks: GameHook<"global">
	fps: number
	tps: number
	ticks: {
		logic: number
		render: number
	}
	assets: Map<string, any>
}

export class GameEngine extends Store<GameEngineState> {
	start() {
		this.resizeCanvas()
		this.tick()
		this.render()
	}

	resizeCanvas() {
		const canvas = this.state.canvas
		if (is.Undefined(canvas) || is.Null(canvas.parentElement)) return
		canvas.width = canvas.parentElement.offsetWidth
		canvas.height = canvas.parentElement.offsetHeight
	}

	tick() {
		const state = this.state
		if (is.False(this.state.running)) return
		setTimeout(async () => {
			await state.hooks.trigger("tick")
			this.tick()
		}, 1000 / state.tps)
	}

	render() {
		const state = this.state
		if (is.False(this.state.running)) return
		setTimeout(async () => {
			requestAnimationFrame(() => this.triggerRender())
			this.render()
		}, 1000 / state.fps)
	}

	triggerRender() {
		if (is.Null(this.state.render)) return Promise.resolve()
		return this.state.hooks.trigger("render", this.state.render)
	}
}

export function createEngine() {
	const hook = useHookableObject("engine")
	return hook.create(
		new GameEngine({
			running: true,
			canvas: undefined,
			render: null,
			hooks: createGameHooks(),
			fps: 60,
			tps: 60,
			ticks: {
				logic: 0,
				render: 0,
			},
			assets: new Map(),
		})
	)
}

export function provideEngine(engine: GameEngine) {
	setContext("game-engine", engine)
}

export function useEngine() {
	return getContext<GameEngine>("game-engine")
}
