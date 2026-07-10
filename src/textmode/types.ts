type TerminalEvent = {value: number | string}
type TerminalHooksObj = Record<string, [((event: TerminalEvent) => void)]>
type TerminalHook = (event: TerminalEvent) => void
import { pushkeyev } from '../drivers/hid';

interface ITerminalHandle {
    internal: {
        handle?: HTMLElement
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

export class EmbeddableTerminalHandle implements ITerminalHandle {
    constructor() {
        pushkeyev(key => {
            this.internal.hooks.input.forEach(e => {
                e({value: key.charCodeAt(0)});
            })
        });
    }
    internal = {
        hooks: {
            input: [(e: TerminalEvent) => {}],
        } as TerminalHooksObj,
        _hook: (event: TTYHookEvent) => {},
        buffer: '',
        bg: '#000',
        fg: '#fff',
        setHook: function(hook: (event: TTYHookEvent) => void) {
            this._hook = hook;
        },
        title: '',
        pushkey: function(e: TerminalEvent) {
            for(var i = 0; i < this.hooks.input.length; i++){
                this.hooks.input[i](e);
            }
        }
    }
    write(text: string) {
        this.internal.buffer += text;
        this.internal._hook({
            type: 'write',
            data: this.internal.buffer,
            updateData: text
        });
        return null;
    }
    clear() {
        this.internal.buffer = '';
        this.internal._hook({
            type: 'clear',
            data: '',
            updateData: ''
        });
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
        this.internal.title = title;
        this.internal._hook({
            type: 'update',
            data: 'title',
            updateData: title
        });
    }
    setBackground(bg: string) {
        this.internal.bg = bg;
        this.internal._hook({
            type: 'update',
            data: 'background',
            updateData: bg
        });
    }
    setForeground(fg: string) {
        this.internal.fg = fg;
        this.internal._hook({
            type: 'update',
            data: 'foreground',
            updateData: fg
        });
    }
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

