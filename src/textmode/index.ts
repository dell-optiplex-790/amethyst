import { EmbeddableTerminalHandle, TerminalHandle } from './types';

let tty: Record<number, TerminalHandle | EmbeddableTerminalHandle> = {};
let idx = 0;

declare const cfg: Record<string, any>;
declare const sku: AmtSKU;

function init(tParentDiv?: HTMLElement): {tHandle: number, tParentDiv?: HTMLElement} {
    if(sku.features.includes('embeddable')) {
        const tHandle: EmbeddableTerminalHandle = new EmbeddableTerminalHandle();

        tty[idx++] = tHandle;
    
        return {tHandle: idx - 1};
    }
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
    document.body.style.margin = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.height = '100vh';

    // do stuff
    if(!tParentDiv) {
        document.body.appendChild(tElmntParentHandle);
    }
    tElmntParentHandle.appendChild(tElmntHandle);

    const tHandle: TerminalHandle = new TerminalHandle(tElmntHandle);

    tty[idx++] = tHandle;

    return {tHandle: idx - 1, tParentDiv: tElmntParentHandle};
} 

function getTTY(id: number): TerminalHandle | EmbeddableTerminalHandle | null {
    if(!tty[id]) {
        return null;
    } else {
        return tty[id];
    }
}


export {init, getTTY};