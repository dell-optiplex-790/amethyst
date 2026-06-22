import { _amtTerminateSystem, amtErrorDictionary, config } from "./index";
import { getFlags } from "./index";
import { driveTypes, mkdir, readDir, readFile, remove, type, writeFile } from "./filesystem";
import { CreateWindow, SetWindowContent, SetWindowPos, SetWindowProc, SetWindowState } from "../gui/index";
import { restricted } from "./secure";
import { loadbin } from "./binload";
import { stringify } from "./utils";

var processes: Array<Process> = [];
var latestPID = 0;
var latestHandle = 0;
var handles: Record<number, any> = {}
declare const cfg: Record<string, any>;

export function keFreeHandle(handle: number): boolean {
    if(handle > 0) {
        return false;
    }
    return delete handles[handle];
}

export function keResolveHandle<T extends Record<string, any>>(handle: __handle<T>): T | null {
    if(handle > 0) {
        return null;
    }
    return handles[handle] || null;
}

export function keCreateHandle(value: Record<string, any>) {
    var handle = -1 * latestHandle++;
    handles[handle] = value;
    return handle;
}

export function kePrivilegedGetHandles(): number[] {
    return <number[]><unknown>Object.keys(handles);
}

var keRootUser = keCreateHandle({
    uid: 0
});

export function CreateContext(keUserHandle: __handle<__user>, keProcessHandle: __handle<Process>, bin: Record<string, Uint8Array> | null, exportCtx: amtContext | null): amtContext {
    var $ctx: amtContext = {
        amtTerminateSystem: _amtTerminateSystem(keUserHandle, keProcessHandle),
        amtGetUID: function() {
            var user = keResolveHandle(keUserHandle);
            if(!user) {
                return null;
            }
            
            if(typeof user.uid != 'number') {
                return null;
            } else {
                return user.uid;
            }
        },
        readFile,
        readDir,
        writeFile,
        mkdir: mkdir,
        remove,
        getFSType: type,
        createWindow: CreateWindow,
        setWindowPos: SetWindowPos,
        setWindowState: SetWindowState,
        setWindowContent: SetWindowContent,
        setWindowProc: SetWindowProc,
        driveTypes,
        config,
        buildConfig: cfg,
        amtErrorDictionary,
        createProcess: _CreateProcessSecure(keUserHandle),
        terminateProcess: TerminateProcess,
        hProcess: keProcessHandle,
        getBinarySection: function(name: string): null | Uint8Array {
            if(!bin) {
                return null;
            }
            if(!bin[name]) {
                return null;
            }
            return bin[name];
        },
        exportFunc: function(name: string, func: Function): boolean {
            if(!exportCtx) {
                return false;
            }
            if(typeof exportCtx[name] != 'undefined') {
                return false;
            }
            exportCtx[name] = func;
            return true;
        },
        loadLibrary: function(keProcessFunction: ((context: amtContext) => void) | string | Uint8Array) {
            return null;
        }
    };
    $ctx.loadLibrary = _LoadLibrary($ctx, keUserHandle, keProcessHandle);
    return $ctx;
}

export function CreateProcess(keProcessName: string | null, keProcessFunction: ((context: amtContext) => void) | string | Uint8Array, keUserHandle: number) {
    var config = getFlags();
    if(config.kdbg) {
        console.log('[kdbg] try create process:\n name = %s\n func = (%s)%o\n user = %d', keProcessName, (typeof keProcessFunction == 'function' ? keProcessFunction.name : null) || 'anonymous', keProcessFunction, keUserHandle)
    }
    var user = keResolveHandle(keUserHandle);
    if(!user) {
        return null;
    }
    
    if(typeof user.uid != 'number') {
        return null;
    }
    var pid = latestPID++;
    var handle = -1 * latestHandle++;
    var ctx: amtContext;
    var bin: Record<string, Uint8Array> | null, text: string = '';
    if(keProcessFunction instanceof Uint8Array) {
        bin = loadbin(keProcessFunction);
        if(!bin) {
            return null;
        }
        if(!bin.text) {
            return null;
        }
        ctx = CreateContext(keUserHandle, pid, bin, null);
        text = stringify(bin.text)
    } else {
        ctx = CreateContext(keUserHandle, pid, null, null);
    }
    setTimeout(async function() {
        if(typeof keProcessFunction == 'string') {
            restricted.eval(keProcessFunction)(ctx);
        } else if(typeof keProcessFunction == 'function') {
            keProcessFunction(ctx);
        } else if(keProcessFunction instanceof Uint8Array) {
            if(bin && text) {
                restricted.eval(text)(ctx);
            } else {
                return null;
            }
        }
    }, 0);
    // @ts-ignore
    processes[pid] = {user, pid, valid: true, libs: {}}; 

    if(keProcessName) {
        processes[pid].name = keProcessName;
    }
    handles[handle] = processes[pid];
    processes[pid].handle = handle;
    var config = getFlags();
    if(config.kdbg) {
        console.log('[kdbg] proc handle = %d', handle);
    }
    return handle;
}

export function _LoadLibrary(_ctx: amtContext, keUserHandle: number, keProcessHandle: number) {
    return function LoadLibrary(keProcessFunction: ((context: amtContext) => void) | string | Uint8Array) {
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] try load library');
        }
        var user = keResolveHandle(keUserHandle);
        if(!user) {
            return null;
        }
        
        if(typeof user.uid != 'number') {
            return null;
        }
        var ctx: amtContext;
        var bin: Record<string, Uint8Array> | null, text: string = '';
        if(keProcessFunction instanceof Uint8Array) {
            bin = loadbin(keProcessFunction);
            if(!bin) {
                return null;
            }
            if(!bin.text) {
                return null;
            }
            ctx = CreateContext(keUserHandle, keProcessHandle, bin, _ctx);
            text = stringify(bin.text)
        } else {
            ctx = CreateContext(keUserHandle, keProcessHandle, null, _ctx);
        }
        setTimeout(async function() {
            if(typeof keProcessFunction == 'string') {
                restricted.eval(keProcessFunction)(ctx);
            } else if(typeof keProcessFunction == 'function') {
                keProcessFunction(ctx);
            } else if(keProcessFunction instanceof Uint8Array) {
                if(bin && text) {
                    restricted.eval(text)(ctx);
                } else {
                    return null;
                }
            }
        }, 0);
        return null;
    }
}

export function TerminateProcess(pid: number): amtErrorCode {
    if(!(processes[pid] && processes[pid].valid)) {
        return -0x21600000;
    }
    processes[pid].valid = false;
    return -0x10000000;
}

function _CreateProcessSecure(uHandle: number) {
    return function CreateProc(name: string | null, keProcessFunction: ((context: amtContext) => void) | string | Uint8Array) {
        return CreateProcess(name, keProcessFunction, uHandle);
    }
}

export function kePrivilegedGetProcesses(): {processes: Array<__handle<Process>>} {
    return {processes: processes.map(e => e.handle)};
}