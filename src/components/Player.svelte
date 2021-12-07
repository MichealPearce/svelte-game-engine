<script context="module" lang="ts">
import { useGameHooks } from "@includes/GameHook"
import type { GameCords } from "@includes/GameTypes"
import is from "@includes/is"
import { getContext, onDestroy, setContext } from "svelte"
import { writable, Writable } from "svelte/store"

export type Player = Writable<{
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
}>

export function createPlayer(): Player {
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
				max: 5,
			},
			velocity: 0.2,
			get vthreshold() {
				return this.velocity * 1.5
			},
			withinVelocityThreshold(speed: number) {
				return speed < this.vthreshold && speed > -this.vthreshold
			},
		},
	})
}

export function providePlayer(player: Player) {
	setContext("player", player)
}

export function usePlayer() {
	return getContext<Player>("player")
}
</script>

<script lang="ts">
const hooks = useGameHooks()
const keyboard = hooks.to("keyboard")

const player = createPlayer()

$: cords = $player.cords
$: movement = $player.movement
$: direction = movement.direction
$: speed = movement.speed
$: is_moving = Object.values(direction).some(is.True)

const listeners = [
	keyboard.listen("keydown", event => setMovement(event.key, true)),
	keyboard.listen("keyup", event => setMovement(event.key, false)),

	hooks.listen("tick", () => {
		if (is_moving) calculateSpeed()
		else reduceSpeed()
		checkMaxSpeed()

		cords.x += speed.x
		cords.y += speed.y
	}),

	hooks.listen("render", render => {
		render.fillStyle = "white"
		render.fillRect(cords.x, cords.y, 100, 100)
	}),
]

function setMovement(key: string, state: boolean) {
	if (key === "w") direction.up = state
	else if (key === "d") direction.right = state
	else if (key === "s") direction.down = state
	else if (key === "a") direction.left = state
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

onDestroy(() => {
	listeners.forEach(mute => mute())
})
</script>
