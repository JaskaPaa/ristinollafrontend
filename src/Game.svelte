<script lang='ts'>

    import * as AI from "./AI.js";
	import Square from './Square.svelte';
    import Resizebutton from './Resizebutton.svelte';
    import { fade } from 'svelte/transition';
    import { beforeUpdate, afterUpdate } from 'svelte';
    import { vw } from './stores.js';
    import { gameBackground, gameLineColor, gameMarkColor } from './stores.js';
    import App from "./App.svelte";
    //export let move = {x: -1, y: -1};

    //const axios = require('axios').default;
    import axios from "axios";
    
    export let winner = '';
    export let bSize = 15;

    let squares = Array(bSize).fill(null).map(()=> Array(bSize).fill("-"));
    let winnerLine = [];
    let lastMove = {x: 0, y: 0};
    let visible = false;
    let humanPlaysFirstMove = false;
    let line = [0, 0, 0, 0];
    let switchXO = false;
    
    let background = '#777';
    gameBackground.subscribe(value => {background = value});

    let borderColor = '#abc'
    gameLineColor.subscribe(value => {borderColor = value});

    let resizedSize = 620;

    let testMove = {x: 0, y: 0};

    $: console.log(`Changed testMove: ${testMove.x}, ${testMove.y}`); 

    $: console.log("Resized: " + resizedSize + " " + squareSize +" "+ Math.floor(resizedSize/bSize)%2 ); 

    //$: squareSize = (Math.floor(resizedSize/20)%2 === 0) ? Math.floor(resizedSize/20) + 1 : Math.floor(resizedSize/20);
    //$: squareSize = Math.floor($vw/50 - 1) + Math.floor($vw/50)%2; // make it to be an odd number
    //$: squareSize = resizedSize/20
    $: squareSize = (Math.round(resizedSize/bSize)%2 === 0) ? Math.round(resizedSize/bSize) + 1 : Math.round(resizedSize/bSize);

    $: if (winnerLine.length > 0) {
        
        let ss = squareSize;

        line[0] = Math.floor(winnerLine[1]*ss + ss/2 + 1);
        line[1] = Math.floor(winnerLine[0]*ss + ss/2 + 1);
        line[2] = Math.floor(winnerLine[9]*ss + ss/2 + 1);
        line[3] = Math.floor(winnerLine[8]*ss + ss/2 + 1);        
        
        console.log("line: " + line);
        console.log("ss: " + ss);
        winner = squares[lastMove.x][lastMove.y];
        console.log("GAME OVER");

    }

    function markMove(x: number, y: number) {
        if (winner !== '')
            return; // game over
        if (squares[x][y] !== '-')
            return; // square played   
        squares[x][y] = 'X';
        lastMove = {x: x, y: y};
        winnerLine = AI.checkFive(x, y, squares);
        console.log("winnerLine: " + winnerLine);
        
        if (winnerLine.length > 0)
            return;
        
        console.log("Tasuri? " + AI.checkDraw(squares));
        if (AI.checkDraw(squares)) {
            winner = "Tasapeli";
            return;
        }
        
        playAI('O');
        //background = "#251";    
    }
    
    async function testNode() {
        let str = "";
        squares.forEach(r => r.forEach(s => str+=s));
        console.log(str.length);
        console.log(...squares[0]);

        fetch("http://localhost:3001/api/position/" + str)
            .then(response => response.json())
            .then(data => {
                console.log(data);
            }).catch(error => {
                console.log(error);
                return [];
            });
        
    };

    function doGet() {
        let str = "";
        squares.forEach(r => r.forEach(s => str+=s));
        console.log(str.length);
        console.log(...squares[0]);

        let urlA = 'https://ristinollabackend.herokuapp.com/api/position/';
        let urlB = 'http://localhost:3001/api/position/';

        axios.get(urlB + str)
            .then(function (response) {
                // handle success
                console.log(response);
                console.log(response.data.move);
                testMove = response.data.move;
            })
            .catch(function (error) {
                // handle error
                console.log(error);
            })
            .then(function () {
                console.log("Aina vaaaaan...");
            });

    }

    function doPost (inTurn = 'X') {        
        
        let urlA = 'https://ristinollabackend.herokuapp.com/api/position/';
        let urlB = 'http://localhost:3001/api/position/';

        axios.post( urlB, { squares: squares.slice(), nextMove: inTurn } )
            .then( response =>  doMove(JSON.parse(response.data)) )
            .catch(function (error) {
                console.log(error);
                alert("Ei yhteyttä palvelimeen");
            });

    }

    let count = 0;

    function doMove(move: { x: number; y: number; mark: string }) {
        //console.log(move.x + ", " + move.y)

        squares[move.x][move.y] = move.mark;
        lastMove = {x: move.x, y: move.y};
        winnerLine = AI.checkFive(move.x, move.y, squares);        
        
        if (winnerLine.length > 0)
            return;
        
        console.log("Tasuri? " + AI.checkDraw(squares));
        if (AI.checkDraw(squares)) {
            winner = "Tasapeli";
            return;
        }
        count++;
        
        doPost((move.mark === 'X') ? 'O' : 'X');
    }

    function playAI(inTurn) {
        console.log("AI plays...");
        
        //testNode();
        // doPost(inTurn);
        //testMove = doGet();

        //console.log('Move: ' + testMove);

        if (winner !== '')
            return; // game over
        let move = AI.playMove(squares.slice());        
        squares[move.x][move.y] = 'O';
        lastMove = {x: move.x, y: move.y};
        winnerLine = AI.checkFive(move.x, move.y, squares);
        console.log("winnerLine: " + winnerLine);
        
        console.log("Tasuri? " + AI.checkDraw(squares));
        if (AI.checkDraw(squares))
            winner = "Tasapeli";   
    }

    export function newGame(size=15) {
        bSize = size;
        squares = Array(bSize).fill(null).map(()=> Array(bSize).fill("-"));
        winnerLine = [];
        winner = '';
        humanPlaysFirstMove = (humanPlaysFirstMove) ? false : true;

        //console.log("bSize: " + bSize);

        if (humanPlaysFirstMove === false) {
            let move = AI.playMove(squares.slice());        
            squares[move.x][move.y] = 'O';
            lastMove = {x: move.x, y: move.y};
        }
    }    
    
    export function showLastMove() {        
        visible = true;        
        setTimeout(()=> {visible = false}, 500);        
    }

    function changeXO(mark: string) {
        // stupid AI play always as 'O', so we have to change it this way  
        if (switchXO === true)
            return (mark === 'X') ? 'O' : 'X';
        else
            return mark;
    }
	
</script>

<div class="wrapper" style="background-color:{$gameBackground}; width:{bSize*(squareSize) + 39}px; border-color:{borderColor}">
    {#if winner === 'X' || winner === 'O'}
    <svg height={bSize*(squareSize)} width={bSize*(squareSize)}>
        <line class="path--" x1={line[0]} y1={line[1]} x2={line[2]} y2={line[3]} 
            stroke={$gameMarkColor} opacity="0.6" stroke-width={squareSize/3} 
            stroke-linecap="round">            
            <animate attributeType="XML" values={(winner === 'X') ? "green;blue" : "blue;green"}
            attributeName="stroke" dur="0.5s" repeatCount="5"/>
        </line>
        <!--line x1="0" y1="0" x2="500" y2="500" opacity="1.0" stroke="white" stroke-width={1} />
        <line x1="11" y1="0" x2="11" y2="400" stroke="white" stroke-width={1} />
        <line x1={squareSize*10 + 1} y1="0" x2="0" y2={squareSize*10 + 1} opacity="1.0" stroke="white" stroke-width={1} /-->               
    </svg>
    {/if}
    {#each squares as row, i}
		<div class="board-row">
		{#each row as square, j}
            <Square onClick={() => markMove(i, j)}
                text={(squares[i][j] === '-') ? '' :  changeXO(squares[i][j])}
                anim={(i == lastMove.x && j == lastMove.y && visible) ? true : false}
                size={squareSize}
                />            		
		{/each}
		</div>
	{/each}
    <Resizebutton bind:resized={resizedSize} top={bSize*(squareSize)} left={bSize*(squareSize)}  />    
</div>
<!--p> {resizedSize} </p-->


<style>

    .board-row:after {
        clear: both;
        content: "";
        display: table;
    }

    svg {
        position: absolute;
        top: 0px; left: 0px;
    }

    .wrapper {
        position: relative;
        border: solid #666;
        border-width: 19px 20px 20px 19px;
        /*background-color: #222;*/
        /*resize: both;
	    overflow: hidden;*/
    }

    @keyframes dash {
        to {
            stroke-dashoffset: 1000;
        }
    }

    @media screen and (max-width: 1200px) {
        svg {
            width:  640px;
            height: 640px;
        }
    }


</style>
	