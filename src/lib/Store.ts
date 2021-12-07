export type StoreState = Record<string, any>

export type StoreListener<State = StoreState> = (
	this: State,
	state: State
) => void

export type StorePropListener<
	State extends StoreState,
	Prop extends keyof State
> = (this: State, value: State[Prop], oldValue: State[Prop]) => void

type StorePropListenerMap<State extends StoreState> = Map<
	keyof State,
	Set<StorePropListener<State, any>>
>

export default class Store<
	State extends StoreState = StoreState,
	Listener extends StoreListener<State> = StoreListener<State>
> {
	private _slisteners = new Set<Listener>()
	private _sPropListeners: StorePropListenerMap<State> = new Map()
	state: State

	constructor(state: State) {
		this.state = new Proxy(state, {
			set: (target: any, prop: any, value) => {
				this.notifyPropListeners(prop, value, target[prop])
				target[prop] = value
				return true
			},
		})

		if (import.meta.hot) {
			import.meta.hot.on("vite:beforeUpdate", () => {
				console.log("[hotreload] clearing store listeners")
				this._slisteners.clear()
				this._sPropListeners.clear()
			})
		}
	}

	private notifyListeners(state?: State) {
		this._slisteners.forEach(listener =>
			listener.call(this.state, state ?? this.state)
		)
	}

	private notifyPropListeners<
		Prop extends keyof State,
		Value extends State[Prop]
	>(prop: Prop, newVal: Value, oldVal: Value) {
		if (!this._sPropListeners.has(prop)) return
		const listeners = this._sPropListeners.get(prop)
		listeners.forEach(actor => actor.call(this.state, newVal, oldVal))
	}

	subscribe(listener: Listener) {
		listener.call(this.state, this.state)
		this._slisteners.add(listener)
		return () => this.unsubscribe(listener)
	}

	unsubscribe(listener: Listener | "all") {
		if (listener === "all") this._slisteners.clear()
		else this._slisteners.delete(listener)
	}

	set(state: State) {
		this.notifyListeners(state)
		this.state = state
	}

	watch<Prop extends keyof State>(
		prop: Prop,
		listener: StorePropListener<State, Prop>,
		immediate: boolean = false
	) {
		const listeners = this._sPropListeners.get(prop) ?? new Set()
		listeners.add(listener)
		this._sPropListeners.set(prop, listeners)

		if (immediate) listener.call(this.state, this.state[prop])

		return () => this.unwatch(prop, listener)
	}

	unwatch<Prop extends keyof State>(
		prop: Prop,
		listener?: StorePropListener<State, Prop>
	) {
		if (!this._sPropListeners.has(prop)) return
		const listeners = this._sPropListeners.get(prop)

		if (listener) listeners.delete(listener)
		else listeners.clear()

		this._sPropListeners.set(prop, listeners)
	}
}
