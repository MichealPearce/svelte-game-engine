import Game from "./Game.svelte"

const game = new Game({
	target: document.getElementById("game"),
})

export default game
