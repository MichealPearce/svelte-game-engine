import type { TypedObject } from "@includes/functions"
import { is_promise } from "svelte/internal"

export interface HookableObjects {
	test: {
		var: string
		method1(a: number): string
	}
}

export class HookableObject<
	Name extends keyof HookableObjects = keyof HookableObjects,
	Obj extends HookableObjects[Name] = HookableObjects[Name]
> {
	// static objects: Map<Symbol, HookableObject.Obj> = new Map()
	// static namespaces: HookableObject.NamespaceMap = new Map()

	static listeners: Map<
		keyof HookableObjects,
		HookableObject.ListenerMap<any>
	> = new Map()

	static filters: Map<keyof HookableObjects, HookableObject.FilterMap<any>> =
		new Map()

	static use<Name extends keyof HookableObjects>(
		name: Name
	): HookableObject<Name> | undefined {
		return new HookableObject(name)
	}

	private get con(): typeof HookableObject {
		return this.constructor as any
	}

	get listeners(): HookableObject.ListenerMap<Obj> {
		if (!this.con.listeners.has(this.namespace))
			this.con.listeners.set(this.namespace, new Map())
		return this.con.listeners.get(this.namespace) as any
	}

	get filters(): HookableObject.FilterMap<Obj> {
		if (!this.con.filters.has(this.namespace))
			this.con.filters.set(this.namespace, new Map())
		return this.con.filters.get(this.namespace) as any
	}

	methods: HookableObject.Methods<Obj>
	properties: HookableObject.Properties<Obj>

	#reference: Symbol
	get reference() {
		if (!this.#reference) this.#reference = Symbol()
		return this.#reference
	}

	constructor(public namespace: Name) {}

	create(obj: Obj): Obj {
		const proxy = new Proxy(obj, {
			get: (target: any, prop: any) => {
				let value = target[prop]
				const applyListeners = (val: Promise<any> | any) => {
					const applyListener = (actor: Function) =>
						is_promise(val)
							? val.then(v => actor.call(proxy, v))
							: actor.call(proxy, val)

					const listeners = this.listeners.get(prop)
					if (listeners)
						for (const level of listeners) {
							if (!level || !level.size) continue
							for (const actor of level.values()) {
								val = applyListener(actor)
							}
						}

					return val
				}

				if (typeof value === "function") {
					return (...args: any) => {
						const filters = this.filters.get(prop)
						if (filters) {
							for (const level of filters) {
								if (!level || !level.size) continue
								for (const filter of level.values()) {
									args = filter.call(proxy, args)
								}
							}
						}

						const r = value.apply(proxy, args)
						return applyListeners(r)
					}
				} else return applyListeners(value)
			},
			set: (target: any, prop: any, value) => {
				const filters = this.filters.get(prop)
				if (!filters) {
					target[prop] = value
					return true
				}

				for (const level of filters) {
					if (!level || !level.size) continue
					for (const filter of level.values()) {
						value = filter.call(proxy, value)
					}
				}

				target[prop] = value

				return true
			},
		})

		return proxy
	}

	on<
		Prop extends keyof Obj,
		Listener extends HookableObject.Listener<Obj, Prop>
	>(prop: Prop, listener: Listener, level: number = 10) {
		const listeners = this.listeners.get(prop) ?? []

		if (!listeners[level]) listeners[level] = new Set()
		listeners[level].add(listener)
		this.listeners.set(prop, listeners)

		return () => this.remove("listener", prop, listener, level)
	}

	onReturn<
		Prop extends HookableObject.MethodNames<Obj>,
		Listener extends HookableObject.Listener<Obj, Prop>
	>(prop: Prop, listener: Listener, level: number = 10) {
		return this.on(prop, listener, level)
	}

	filter<
		Prop extends keyof Obj,
		Filter extends HookableObject.Filter<Obj, Prop>
	>(prop: Prop, filter: Filter, level: number = 10) {
		const filters = this.filters.get(prop) ?? []

		if (!filters[level]) filters[level] = new Set()
		filters[level].add(filter)
		this.filters.set(prop, filters)

		return () => this.remove("filter", prop, filter, level)
	}

	filterParams<
		Prop extends HookableObject.PropertyNames<Obj>,
		Listener extends HookableObject.Filter<Obj, Prop>
	>(prop: Prop, listener: Listener, level: number = 10) {
		return this.filter(prop, listener, level)
	}

	remove<Prop extends keyof Obj>(type: "listener" | "filter", prop: Prop): this
	remove<
		Prop extends keyof Obj,
		Actor extends
			| HookableObject.Filter<Obj, Prop>
			| HookableObject.Listener<Obj, Prop>
	>(type: "listener" | "filter", prop: Prop, actor: Actor, level: number): this
	remove<
		Prop extends keyof Obj,
		Actor extends
			| HookableObject.Filter<Obj, Prop>
			| HookableObject.Listener<Obj, Prop>
	>(
		type: "listener" | "filter",
		prop: Prop,
		actor?: Actor,
		level?: number
	): this {
		const items: any = type === "listener" ? this.listeners : this.filters

		if (!items.has(prop)) return this
		if (!actor && !level) {
			items.set(prop, [])
			return this
		} else if (!level) {
			console.warn(
				`unable to remove listener or filter for ${prop}, no call level provided`
			)

			return this
		}

		const actors = items.get(prop)
		actors[level].delete(actor)
		items.set(prop, actors)

		return this
	}
}

export namespace HookableObject {
	export type Obj<T = Record<any, any>> = TypedObject<T>

	export type MethodNames<O extends Obj> = {
		[Prop in keyof O]: O[Prop] extends Function ? Prop : never
	}[keyof O]

	export type Methods<O extends Obj> = Pick<O, MethodNames<O>>

	export type PropertyNames<O extends Obj> = {
		[Prop in keyof O]: O[Prop] extends Function ? never : Prop
	}[keyof O]

	export type Properties<O extends Obj> = Pick<O, PropertyNames<O>>

	type Awaited<T> = T extends PromiseLike<infer R> ? Awaited<R> : T

	export type ListenerValue<
		O extends Obj,
		Prop extends keyof O,
		Property extends O[Prop] = O[Prop]
	> = Property extends (...args: any[]) => any ? ReturnType<Property> : Property

	export type FilterValue<
		O extends Obj,
		Prop extends keyof O,
		Property extends O[Prop] = O[Prop]
	> = Property extends (...args: infer Params) => any ? Params : Property

	export type Filter<
		O extends Obj,
		Prop extends keyof O,
		Property extends O[Prop] = O[Prop],
		Value = FilterValue<O, Prop, Property>
	> = (this: O, value: Value) => Value

	export type Listener<
		O extends Obj,
		Prop extends keyof O,
		Property extends O[Prop] = O[Prop],
		Value = ListenerValue<O, Prop, Property>
	> = (this: O, value: Awaited<Value>) => Value

	export type ListenerSet<O extends Obj> = Array<Set<Listener<O, any>>>
	export type ListenerMap<O extends Obj> = Map<keyof O, ListenerSet<O>>

	export type FilterSet<O extends Obj> = Array<Set<Filter<O, any>>>
	export type FilterMap<O extends Obj> = Map<keyof O, FilterSet<O>>

	export type NamespaceMap = Map<keyof HookableObjects, HookableObject<any>>
}

export function useHookableObject<Name extends keyof HookableObjects>(
	name: Name
) {
	return new HookableObject(name)
}

let setHotReloader = true
if (import.meta.hot && setHotReloader) {
	setHotReloader = false
	import.meta.hot.on("vite:beforeUpdate", () => {
		console.info("[hotreload] clearing hookable objects")
		// HookableObject.namespaces.clear()
		HookableObject.listeners.clear()
		HookableObject.filters.clear()
	})
}
