<script lang="ts">

import { fade } from 'svelte/transition';
import { vw } from './stores.js';
import { vh } from './stores.js';
import { gameBackground, gameLineColor, gameMarkColor } from './stores.js';

export let text = '';
export let onClick: any; //(x: number, y: number) => void;
export let anim = false;
export let size: number;

//$: console.log($gameMarkColor);

let testValue = 2;

</script>

<animate attributeType="XML" attributeName="stroke" values="blue;green;blue"
            dur="0.5s" repeatCount="1"/>


<button on:click|preventDefault={onClick} class="square" style="width:{size}px; height:{size}px; background:{$gameBackground}; border-color:{$gameLineColor}">
    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    {#if text === 'X'}	
        <line class:anim={anim} opacity="0.6" stroke={$gameMarkColor} stroke-width="12%" x1="20%" y1="20%" x2="80%" y2="80%"></line>
        <line class:anim={anim} opacity="0.6" stroke={$gameMarkColor} stroke-width="12%" x1="80%" y1="20%" x2="20%" y2="80%"></line>
    {/if}
    {#if text === 'O'}    
        <circle class:anim={anim} fill="none" opacity="0.6" stroke={$gameMarkColor} stroke-width="12%" cx="50%" cy="50%" r="30%">
        </circle>
    {/if} 
    </svg>  
</button>
    
<style>
    .square {
        background: #222;
        border: solid #666;
        border-width: thin 0px 0px thin; /* top and left 1px */
        float: left;
        /*font-size: 24px;
        font-weight: bold;*/
        /*color: black;*/
        /*height: 2.5vw;
        width:  2.5vw;*/
        /*margin-right: 0px;
        margin-top: 0px;
        margin-bottom: 0px;*/
        margin: 0;
        padding: 0;
        /*text-align: center;*/
        border-radius: 0px; /* Why this's 2px in global.css ?? */
        line-height: 0;
    }

    .anim {
        animation: pulse 0.25s;
        animation-iteration-count: 2;
    }

    .square:focus {
        outline: none;
    }

    @keyframes pulse {
        0%   { opacity: 1.0; }
        50%  { opacity: 0.2; }
        100% { opacity: 0.5; }
    }

    @media screen and (max-width: 1200px) {
        .square {
            width: 33px;
            height: 33px;
        }
    }
    
</style>

