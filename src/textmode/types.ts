type TerminalEvent = {value: number | string}
type TerminalHooksObj = Record<string, [((event: TerminalEvent) => void)]>
type TerminalHook = (event: TerminalEvent) => void
import { pushkeyev } from '../drivers/hid';

interface ITerminalHandle {
    internal: {
        handle: HTMLElement
        hooks: TerminalHooksObj
    }
    write: (text: string) => void;
    clear: () => void;
    on: (event: string, callback: TerminalHook) => TerminalHook | false;
    unhook: (event: string, hook: TerminalHook) => boolean;
    setTitle: (title: string) => void;
    setBackground: (bg: string) => void;
    setForeground: (fg: string) => void;
}

export class TerminalHandle implements ITerminalHandle {
    constructor(handle: HTMLTextAreaElement) {
        this.internal.handle = handle;
        pushkeyev(key => {
            this.internal.hooks.input.forEach(e => {
                e({value: key.charCodeAt(0)});
            })
        });
    }
    internal = {
        handle: document.createElement('textarea'),
        hooks: {
            input: [(e: TerminalEvent) => {}]
        } as TerminalHooksObj
    }
    write(text: string) {
        this.internal.handle.textContent += text;
        return null;
    }
    clear() {
        this.internal.handle.textContent = '';
        return null;
    }
    on(event: string, callback: TerminalHook) {
        const hookList = this.internal.hooks[event];
        if(!hookList) {
            return false;
        }
        hookList.push(callback);
        return callback;
    }
    unhook(event: string, hook: TerminalHook) {
        const hookList = this.internal.hooks[event];
        if(!hookList) {
            return false;
        }
        if(hookList.indexOf(hook) == -1) {
            return false;
        }
        hookList.splice(hookList.indexOf(hook), 1);
        return true
    }
    setTitle(title: string) {
        document.title = title;
    }
    setBackground(bg: string) {
        this.internal.handle.style.background = bg;
    }
    setForeground(fg: string) {
        this.internal.handle.style.color = fg;
    }
}

