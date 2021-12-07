<script lang="ts">
import { useCamera } from "./GameCamera.svelte"
import { useEngine } from "./GameEngine"

const engine = useEngine()
const camera = useCamera()

const hooks = $engine.hooks

hooks.listen("render", render => {})
</script>

<slot />
