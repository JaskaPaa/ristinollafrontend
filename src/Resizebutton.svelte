<script>

import { gameBackground } from './stores.js';

export let size = 620;
export let top = size;
export let left = size;
export let resized = size;

let top2 = size;
let left2 = size;

let started = false;

function startDrag(e) {    
    started = true;
    window.addEventListener('mousemove', handleMousemove);
    window.addEventListener('mouseup', stopDrag);
}

function handleMousemove(e) {
    if (started) {
        left2 += e.movementX;
        top2  += e.movementY;
        
        resized = Math.min(top2, left2);       
    }
}

function stopDrag(e) {
    console.log(`Mouse up: ${e.x}, ${e.y}`);
    started = false;
    window.removeEventListener("mousemove", handleMousemove);
    window.removeEventListener('mouseup', stopDrag);
}


</script>

<button on:mousedown={startDrag} style="top:{top+8}px; left:{left+8}px; color:{$gameBackground}; width:{12}px; height:{12}px;">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <!--path d="M12 0l5 5-12 12-5-5v12h12l-5-5 12-12 5 5v-12h-12z" /-->
        <!--path d="M0 0h12 l-5 5 12 12 5 -5 v12h-12l5-5 -12 -12 -5 5z " fill={$gameBackground}/-->
        <line  opacity="0.6" stroke={$gameBackground} stroke-width="12%" x1="10%" y1="90%" x2="90%" y2="10%"/>
        <line  opacity="0.6" stroke={$gameBackground} stroke-width="12%" x1="40%" y1="90%" x2="90%" y2="40%"/>
        <line  opacity="0.6" stroke={$gameBackground} stroke-width="12%" x1="70%" y1="90%" x2="90%" y2="70%"/>
    </svg>
</button>


<style>
    button {
        position: absolute;
        border: none;
        background: none;
        /*margin-top: -5px;
        margin-left: -5px;*/
        color: black;
        margin: 0;
        padding: 0;
        border-radius: 0;
        line-height: 0; /* !! muista tämä !! */
        cursor: nwse-resize;
    }
    button:active{
        background: none;
        cursor: nwse-resize;
    }    
</style>
