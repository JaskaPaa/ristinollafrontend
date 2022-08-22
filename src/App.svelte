<script>

	//import Square from './Square.svelte';
	import { onMount } from "svelte";
	import Game from './Game.svelte';
	import { gameBackground, gameLineColor, vw, vh } from './stores.js';

	let win = '';
	let boardSize = 18;
	let gameRef;
	let score = {X: 0, O: 0};

	let color2 = "#222222";
	$: gameBackground.set(color2);

	let color1 = "#777777";
	$: gameLineColor.set(color1);
	$: console.log(color1);
	$: if (gameRef !== undefined) gameRef.newGame(boardSize);

	$: if (win === 'X') { score.X++ }
	$: if (win === 'O') { score.O++ }

	function viewportResize() {
		vw.set(window.visualViewport.width);
		vh.set(window.visualViewport.height);
	}

	function changeSize() {
		boardSize += 1;
		gameRef.newGame(boardSize);
	}

	window.visualViewport.addEventListener('resize', viewportResize);

</script>

<svelte:head>
	<title>Ristinolla</title>
	<meta name="robots" content="noindex nofollow" />
	<html lang="fi" />
</svelte:head>

<div class="header">
	<h1>Ristinolla</h1>
</div>
  
<main>
	<div class="left" style="background: {color2+"55"}; color: {"black"}">
		<fieldset>
			<legend align="center">Pelitilanne</legend>			
			<table class="scores">
				<tr>
				  <th>X</th>
				  <th>O</th>
				</tr>
				<tr>
				  <td id="xscore" class="scores">{score.X}</td>
				  <td id="oscore" class="scores">{score.O}</td>
				</tr>
			</table>
			<br>
			<p>{(win === '') ? "Sinun vuorosi" : "Voittaja: " + win}</p>
			<!--p>Pisteet: {score.X + "-" + score.O}</p-->
		</fieldset>
		<button on:click={() => gameRef.newGame(boardSize)} disabled='{(win !=='') ? false : true}'>Uusi peli</button>
		<button on:click={gameRef.showLastMove}>Viime siirto</button>
	</div>

	<div class="middle">		
		<Game bind:winner={win} bind:this={gameRef} bSize={boardSize}/>
		<!--h1>vw: {$vw} vh: {$vh}</h1-->
	</div>
	<div class="right" style="background: {color2+"55"}; color: {"black"}">
		<h1>Asetukset</h1>
		<div>
			<input type="color" id="head" name="head"
				bind:value={color2}>
			<label for="head">Tausta</label>
		</div>		
		<div>
			<input type="color" id="body" name="body"
				bind:value={color1}>
			<label for="body">Reuna</label>
		</div>
		<p>Väri: {color2}</p>
		<button on:click={ () => {boardSize += 1; gameRef.newGame(boardSize)} }>++</button>
		<button on:click={ () => {boardSize -= 1; gameRef.newGame(boardSize)} }>--</button>
		<input type=range bind:value={boardSize} min=5 max=30>
	</div>	
</main>

<style>
	
	:global(*) {
		margin: 0;
    	padding: 0;
		box-sizing: border-box;
	}
	:global(body) {
		margin: 0;
    	padding: 0;
		box-sizing: border-box;
		user-select: none;
	}
	.header {
		border: 0px solid blue;
		padding: 15px;
		text-align: center;		
	}	
	main {
		text-align: center;
		padding: 0;
		max-width: none;
		display: flex;
		justify-content: center;
		align-items: normal;
		flex-wrap: wrap;
		flex-direction: row;
	}
	h1 {
		/*color: #222;*/
		text-transform: uppercase;
		font-size: 2em;
		font-weight: 100;
	}
	.left {
		background-color: #999;
		padding: 20px;
		/*float: left;
		width: 30%;*/ /* The width is 20%, by default */
	}	
	.middle {
		background-color: #fff;
		padding: 0px;
		/*float: left;
		width: 60%;*/ /* The width is 60%, by default */
	}
	.right {
		background-color: #999;
		padding: 20px;
		/*float: left;
		width: 10%; *//* The width is 20%, by default */
	}
	input {
    	margin: 0.1rem;
		height: 3vh;
	}	
	fieldset {
		border-radius: 0px;
		padding: 1vh;
		border-color: #000;
		border-width: 10px;
	}
	legend {
    	background-color: #0000;
    	color: #000;
    	/*padding: 3px 6px;*/
	}
	table.scores, td.scores {
		border-collapse: collapse;
	}
	td.scores {
		border: 1px solid black;
		width: 100px;
		text-align: center;
		background-color:  #ffffff77;
	}

	td, tr {
		padding: 0;
	}

	th {
		background-color:  #00000000;
		border-bottom: 3px solid #444;
	}

	@media screen and (max-width: 480px) {
  		.left, .middle, .right {
    		width: 120%; /* The width is 100%, when the viewport is 800px or smaller */
  		}
		main :nth-child(1) { order: 2; }
    	main :nth-child(2) { order: 1; }
    	main :nth-child(3) { order: 3; }  
	}

	
</style>