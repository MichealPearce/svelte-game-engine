export type HookableListenerMap = Record<string, (...args: any[]) => any>

export type HookableNamespaceMap = Record<string, HookableListenerMap>

export default class Hookable<
	NSMap extends HookableNamespaceMap,
	Namespace extends keyof NSMap,
	Events extends NSMap[Namespace],
	Context = any
> {
	static active = true
	static listeners: {
		[namespace: string]: {
			[event: string]: Array<Set<Function>>
		}
	} = {}

	protected active = true

	get is_active() {
		return this.active && Hookable.active
	}

	protected get global() {
		return Hookable
	}

	protected get global_listeners() {
		return this.global.listeners
	}

	protected get listeners() {
		const ns: any = this.namespace
		if (!this.global_listeners[ns]) this.global_listeners[ns] = {}
		return this.global_listeners[ns]
	}

	constructor(
		public namespace: Namespace,
		protected context: Context = {} as any
	) {}

	to<NS extends Exclude<keyof NSMap, Namespace>>(
		namespace: NS
	): Hookable<NSMap, NS, NSMap[NS]> {
		return new (this.constructor as any)(namespace, this.context)
	}

	async trigger<E extends keyof Events>(
		event: E,
		...args: Parameters<Events[E]>
	): Promise<ReturnType<Events[E]> | undefined> {
		if (!this.is_active) {
			console.log("hook not active")
			return
		}
		const actors = this.process(event, ...args)

		let r: any = undefined
		for (const actor of actors) {
			r = await actor
		}

		return r
	}

	*process<
		E extends keyof Events,
		P extends Parameters<Events[E]>,
		R extends ReturnType<Events[E]>
	>(event: E, ...args: P): Generator<R, R[] | void, R | undefined> {
		if (!this.is_active) {
			console.log("hook not active")
			return
		}
		const listeners = this.listeners[event as any]
		if (!listeners) return

		for (const level of listeners) {
			if (!level) continue
			for (const actor of level) {
				yield actor.apply(this.context, args)
			}
		}
	}

	listen<E extends keyof Events>(event: E, actor: Events[E], level = 10) {
		const listeners = this.listeners[event as any] ?? []

		if (!listeners[level]) listeners[level] = new Set()
		listeners[level].add(actor)

		this.listeners[event as any] = listeners
		return () => this.mute(event, actor, level)
	}

	mute<E extends keyof Events>(event: E, actor: Events[E], level = 10) {
		const listeners = this.listeners[event as any] ?? []
		if (!listeners[level]) return
		listeners[level].delete(actor)
	}

	activate() {
		this.active = true
		return this
	}

	deactivate() {
		this.active = false
		return this
	}
}

if (import.meta.hot) {
	import.meta.hot.on("vite:beforeUpdate", () => {
		console.info("[hotreload] clearing hooks")
		Hookable.listeners = {}
	})
}
