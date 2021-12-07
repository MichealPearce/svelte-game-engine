import { getContext, setContext } from "svelte"
import Hookable from "./Hookable"

export type GameHooks = {
	global: {
		tick(): void
		render(render: CanvasRenderingContext2D): void
	}
	keyboard: {
		keydown(event: KeyboardEvent): void
		keyup(event: KeyboardEvent): void
		keypress(event: KeyboardEvent): void
	}
}

export class GameHook<Namespace extends keyof GameHooks> extends Hookable<
	GameHooks,
	Namespace,
	GameHooks[Namespace]
> {
	static listeners = {} as any

	static clear() {
		GameHook.listeners = {} as any
	}

	get is_active() {
		return this.active && GameHook.active
	}

	protected get global() {
		return GameHook as any
	}

	to<NS extends Exclude<keyof GameHooks, Namespace>>(
		namespace: NS
	): GameHook<NS> {
		return new (this.constructor as any)(namespace, this.context)
	}
}

export function createGameHooks() {
	return new GameHook("global")
}

export function provideGameHooks(hooks: GameHook<"global">) {
	setContext("game-hooks", hooks)
}

export function useGameHooks(ns?: keyof GameHooks) {
	return getContext<GameHook<"global">>("game-hooks")
}

if (import.meta.hot) {
	import.meta.hot.on("vite:beforeUpdate", () => {
		console.info("[hotreload] clearing hooks")
		GameHook.listeners = {}
	})
}
