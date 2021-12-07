<script context="module" lang="ts">
import { useGameHooks } from "@includes/GameHook"
</script>

<script lang="ts">
const hooks = useGameHooks()
const keyboard = hooks.to("keyboard")

const keyDown = (event: any) => keyboard.trigger("keydown", event)
const keyUp = (event: any) => keyboard.trigger("keyup", event)
const keyPress = (event: any) => keyboard.trigger("keypress", event)
</script>

<svelte:window on:keydown={keyDown} on:keyup={keyUp} on:keypress={keyPress} />

<slot />
