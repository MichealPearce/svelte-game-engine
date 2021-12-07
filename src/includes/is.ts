import { isFunction, isObject } from "lodash"

module is {
	export function aObject<Thing extends Record<any, any>>(
		what: any
	): what is Thing {
		return isObject(what)
	}

	export function notaObject<T, O extends Record<any, any>>(
		what: T
	): what is Exclude<T, O> {
		return !aObject(what)
	}

	export function aMap<Thing extends Map<any, any>>(what: any): what is Thing {
		return what instanceof Map
	}

	export function notaMap<T>(what: T): what is Exclude<T, Map<any, any>> {
		return !aMap(what)
	}

	export function aSet<Thing extends Set<any>>(what: any): what is Thing {
		return what instanceof Set
	}

	export function notaSet<T>(what: T): what is Exclude<T, Set<any>> {
		return !aSet(what)
	}

	export function aArray<Thing extends Array<any>>(what: any): what is Thing {
		return Array.isArray(what)
	}

	export function notaArray<T>(what: T): what is Exclude<T, Array<any>> {
		return !aArray(what)
	}

	export function aFunction<Thing extends (...args: any[]) => any>(
		what: any
	): what is Thing {
		return isFunction(what)
	}

	export function notaFunction<T>(
		what: T
	): what is Exclude<T, (...args: any[]) => any | Function> {
		return !aFunction(what)
	}

	export function True(what: any): what is true {
		return typeof what === "boolean" && what
	}

	export function notTrue<T>(what: T): what is Exclude<T, true> {
		return !True(what)
	}

	export function False(what: any): what is false {
		return typeof what === "boolean" && !what
	}

	export function notFalse<T>(what: T): what is Exclude<T, false> {
		return !False(what)
	}

	export function Null(what: any): what is null {
		return what === null
	}

	export function notNull<T>(what: T): what is Exclude<T, null> {
		return !Null(what)
	}

	export function Undefined(what: any): what is undefined {
		return typeof what === "undefined"
	}

	export function Defined<T>(what: T): what is Exclude<T, undefined> {
		return !Undefined(what)
	}
}

export function isExtended<Config extends Record<string, any>>(
	config: ThisType<typeof is> & Config
): typeof is & Config {
	Object.setPrototypeOf(config, is)
	return Object.assign({}, config) as any
}

declare global {
	interface String {
		is(what: string): boolean
	}
}

Object.defineProperty(String.prototype, "is", {
	value(what: any) {
		return what === this
	},
})

export default is
