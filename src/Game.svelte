<script lang="ts">
import "./style.css"
import Player from "@components/Player.svelte"
import FpsOverlay from "@components/FpsOverlay.svelte"
import GameWorld from "@components/Game/GameWorld.svelte"
import GameCamera from "@components/Game/GameCamera.svelte"
import { useHookableObject } from "@lib/HookableObject"
import { onMount } from "svelte"
import GameEngine from "@components/Game/GameEngine.svelte"

const hook = useHookableObject("engine")

onMount(() => {})
</script>

<GameEngine>
	<FpsOverlay slot="overlay" />
	<GameCamera>
		<GameWorld>
			<Player />
		</GameWorld>
	</GameCamera>
</GameEngine>
