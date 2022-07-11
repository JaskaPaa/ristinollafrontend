import { writable, derived } from 'svelte/store';

export const vw = writable(window.visualViewport.width);
export const vh = writable(window.visualViewport.height);
export const gameBackground = writable("#202020");
export const gameLineColor = writable("#606060");

/* Jos värien keskiarvo on tumma niin valkoinen, päinvastoin niin musta. */
export const gameMarkColor = derived(
	gameBackground,
	$gameBackground => {
        let colors = [$gameBackground.slice(1,3), $gameBackground.slice(3,5), $gameBackground.slice(5,7)];
        colors = colors.map(c => parseInt(c,16));
        let sum = colors.reduce((partialSum, a) => partialSum + a, 0);
        return (sum/3 < 127) ? "white" : "black";
    }
);