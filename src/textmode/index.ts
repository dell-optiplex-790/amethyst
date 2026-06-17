import { TerminalHandle } from './types';
import { restricted } from "../core/secure";

let tty: Record<number, TerminalHandle> = {};
let idx = 0;

function init(tParentDiv?: HTMLElement): {tHandle: number, tParentDiv: HTMLElement} {
    // define
    const tElmntParentHandle: HTMLElement = tParentDiv ?? document.createElement('div');
    const tElmntHandle: HTMLTextAreaElement = document.createElement('textarea');


    // make terminal
    const tElmntStyleHandle = tElmntHandle.style;
    tElmntStyleHandle.background = 'black';
    tElmntStyleHandle.fontFamily = 'monospace';
    tElmntStyleHandle.color = 'white';
    tElmntStyleHandle.border = 'none';
    tElmntStyleHandle.fontSize = '10px';
    tElmntStyleHandle.resize = 'none';
    tElmntStyleHandle.width = '100%';
    tElmntStyleHandle.height = '100%';
    tElmntStyleHandle.overflow = 'scroll';
    tElmntStyleHandle.accentColor = 'rgba(0,0,0,0)';
    tElmntHandle.readOnly = true;


    // do some of *that* stuff
    restricted.document.body.style.margin = '0';
    restricted.document.body.style.overflow = 'hidden';
    restricted.document.body.style.height = '100vh';

    // do stuff
    if(!tParentDiv) {
        restricted.document.body.appendChild(tElmntParentHandle);
    }
    tElmntParentHandle.appendChild(tElmntHandle);

    const tHandle: TerminalHandle = new TerminalHandle(tElmntHandle);

    tty[idx++] = tHandle;

    return {tHandle: idx - 1, tParentDiv: tElmntParentHandle};
} 

function getTTY(id: number): TerminalHandle | null {
    if(!tty[id]) {
        return null;
    } else {
        return tty[id];
    }
}


export {init, getTTY};