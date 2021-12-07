<script context="module" lang="ts">
import { Writable, writable } from "svelte/store"
import { getContext, onDestroy, setContext } from "svelte"
import { useGameHooks } from "@includes/GameHook"
import type { GameCords } from "@includes/GameTypes"
import is, { isExtended } from "@includes/is"

export type GameCamera = Writable<{
	cords: GameCords
	movement: {
		direction: {
			up: boolean
			down: boolean
			left: boolean
			right: boolean
		}
		speed: {
			x: number
			y: number
			max: number
		}
		velocity: number
		vthreshold: number
		withinVelocityThreshold(speed: number): boolean
	}
	zoom: {
		current: number
		min: number
		max: number
	}
}>

export function createCamera(): GameCamera {
	return writable({
		cords: {
			x: 0,
			y: 0,
		},
		movement: {
			direction: {
				up: false,
				down: false,
				left: false,
				right: false,
			},
			speed: {
				x: 0,
				y: 0,
				max: 3,
			},
			velocity: 0.1,
			get vthreshold() {
				return this.velocity * 1.5
			},
			withinVelocityThreshold(speed: number) {
				return speed < this.vthreshold && speed > -this.vthreshold
			},
		},
		zoom: {
			current: 1,
			min: 0.25,
			max: 2,
		},
	})
}

export function provideCamera(camera: GameCamera) {
	setContext("game-camera", camera)
}

export function useCamera() {
	return getContext<GameCamera>("game-camera")
}
</script>

<script lang="ts">
const hooks = useGameHooks()
const keyboard = hooks.to("keyboard")

const camera = createCamera()

$: cords = $camera.cords
$: zoom = $camera.zoom
$: movement = $camera.movement
$: direction = movement.direction
$: speed = movement.speed
$: is_moving = Object.values(direction).some(is.True)

const listeners = [
	hooks.listen("tick", () => {
		if (is_moving) calculateSpeed()
		else reduceSpeed()
		checkMaxSpeed()

		cords.x += speed.x
		cords.y += speed.y
	}),

	hooks.listen(
		"render",
		render => {
			render.setTransform(zoom.current, 0, 0, zoom.current, -cords.x, -cords.y)
		},
		1
	),

	keyboard.listen("keydown", event => setMovement(event.key, true)),
	keyboard.listen("keyup", event => setMovement(event.key, false)),
]

function setMovement(key: string, state: boolean) {
	if (key.is("ArrowUp")) direction.up = state
	else if (key.is("ArrowRight")) direction.right = state
	else if (key.is("ArrowDown")) direction.down = state
	else if (key.is("ArrowLeft")) direction.left = state
}

function calculateSpeed() {
	if (direction.right) speed.x += movement.velocity
	else if (direction.left) speed.x -= movement.velocity

	if (direction.up) speed.y -= movement.velocity
	else if (direction.down) speed.y += movement.velocity
}

function reduceSpeed() {
	if (!movement.withinVelocityThreshold(speed.x)) {
		if (speed.x > 0) speed.x -= movement.velocity
		else if (speed.x < 0) speed.x += movement.velocity
	} else if (speed.x !== 0) speed.x = 0

	if (!movement.withinVelocityThreshold(speed.y)) {
		if (speed.y > 0) speed.y -= movement.velocity
		else if (speed.y < 0) speed.y += movement.velocity
	} else if (speed.y !== 0) speed.y = 0
}

function checkMaxSpeed() {
	if (speed.x > 0 && speed.x > speed.max) speed.x = speed.max
	else if (speed.x < 0 && speed.x < -speed.max) speed.x = -speed.max
	if (speed.y > 0 && speed.y > speed.max) speed.y = speed.max
	else if (speed.y < 0 && speed.y < -speed.max) speed.y = -speed.max
}

provideCamera(camera)

onDestroy(() => {
	listeners.forEach(mute => mute())
})
</script>

<slot />
