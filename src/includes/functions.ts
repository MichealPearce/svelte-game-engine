import Hookable from "./Hookable"

export function getAssetURL(asset: string) {
	return new URL(`../assets/${asset}`, import.meta.url).href
}

export type TypedObject<Obj extends Record<any, any>> = Obj & ThisType<Obj>

export function typedObject<Obj extends Record<any, any>>(
	obj: TypedObject<Obj>
) {
	return obj
}
