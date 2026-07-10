import { _amtTerminateSystem, amtErrorDictionary, config } from "./index";
import { getFlags } from "./index";
import { driveTypes, _mkdir, _readDir, _readFile, _remove, _type, _writeFile } from "./filesystem";
import { _CreateWindow, _SetWindowContent, _SetWindowPos, _SetWindowProc, _SetWindowState } from "../gui/index";
import { loadbin } from "./binload";
import { stringify } from "./utils";

declare const cfg: Record<string, any>;

export function _keFreeHandle(kernel: amtKernel) {
    return function keFreeHandle(handle: number): boolean {
        if(handle > 0) {
            return false;
        }
        return delete kernel.state.handles[handle];
    }
}

export function _keResolveHandle(kernel: amtKernel) {
    return function keResolveHandle<T extends Record<string, any>>(handle: __handle<T>): T | null {
        if(handle > 0) {
            return null;
        }
        return kernel.state.handles[handle] || null;
    }
}

export function _keCreateHandle(kernel: amtKernel) {
    return function keCreateHandle(value: Record<string, any>) {
        var handle = -1 * kernel.state.latestHandle++;
        kernel.state.handles[handle] = value;
        return handle;
    }
}

export function _kePrivilegedGetHandles(kernel: amtKernel) {
    return function kePrivilegedGetHandles(): number[] {
        return <number[]><unknown>Object.keys(kernel.state.handles);
    }
}


export function _CreateContext(kernel: amtKernel) {
    var keResolveHandle = _keResolveHandle(kernel);
    return function CreateContext(keUserHandle: __handle<__user>, keProcessHandle: __handle<Process>, bin: Record<string, Uint8Array> | null, exportCtx: amtContext | null): amtContext {
        var $ctx: amtContext = {
            amtTerminateSystem: _amtTerminateSystem(kernel, keUserHandle, keProcessHandle),
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
            readFile: _readFile(kernel),
            readDir: _readDir(kernel),
            writeFile: _writeFile(kernel),
            mkdir: _mkdir(kernel),
            remove: _remove(kernel),
            getFSType: _type(kernel),
            createWindow: _CreateWindow(kernel),
            setWindowPos: _SetWindowPos(kernel),
            setWindowState: _SetWindowState(kernel),
            setWindowContent: _SetWindowContent(kernel),
            setWindowProc: _SetWindowProc(kernel),
            driveTypes,
            config,
            buildConfig: cfg,
            amtErrorDictionary,
            createProcess: _CreateProcessSecure(kernel, keUserHandle),
            terminateProcess: _TerminateProcess(kernel),
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
        $ctx.loadLibrary = _LoadLibrary(kernel, $ctx, keUserHandle, keProcessHandle);
        return $ctx;
    }
}

export function _CreateProcess(kernel: amtKernel) {
    var keResolveHandle = _keResolveHandle(kernel);
    var CreateContext = _CreateContext(kernel);
    return function CreateProcess(keProcessName: string | null, keProcessFunction: ((context: amtContext) => void) | string | Uint8Array, keUserHandle: number) {
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
        var pid = kernel.state.latestPID++;
        var handle = -1 * kernel.state.latestHandle++;
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
                eval(keProcessFunction)(ctx);
            } else if(typeof keProcessFunction == 'function') {
                keProcessFunction(ctx);
            } else if(keProcessFunction instanceof Uint8Array) {
                if(bin && text) {
                    eval(text)(ctx);
                } else {
                    return null;
                }
            }
        }, 0);
        // @ts-ignore
        kernel.state.processes[pid] = {user, pid, valid: true, libs: {}}; 
    
        if(keProcessName) {
            kernel.state.processes[pid].name = keProcessName;
        }
        kernel.state.handles[handle] = kernel.state.processes[pid];
        kernel.state.processes[pid].handle = handle;
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] proc handle = %d', handle);
        }
        return handle;
    }
}

export function _LoadLibrary(kernel: amtKernel, _ctx: amtContext, keUserHandle: number, keProcessHandle: number) {
    var keResolveHandle = _keResolveHandle(kernel);
    var CreateContext = _CreateContext(kernel);
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
                eval(keProcessFunction)(ctx);
            } else if(typeof keProcessFunction == 'function') {
                keProcessFunction(ctx);
            } else if(keProcessFunction instanceof Uint8Array) {
                if(bin && text) {
                    eval(text)(ctx);
                } else {
                    return null;
                }
            }
        }, 0);
        return null;
    }
}

export function _TerminateProcess(kernel: amtKernel) {
    return function TerminateProcess(pid: number): amtErrorCode {
        if(!(kernel.state.processes[pid] && kernel.state.processes[pid].valid)) {
            return -0x21600000;
        }
        kernel.state.processes[pid].valid = false;
        return -0x10000000;
    }
}

function _CreateProcessSecure(kernel: amtKernel, uHandle: number) {
    var CreateProcess = _CreateProcess(kernel);
    return function CreateProc(name: string | null, keProcessFunction: ((context: amtContext) => void) | string | Uint8Array) {
        return CreateProcess(name, keProcessFunction, uHandle);
    }
}

export function _kePrivilegedGetProcesses(kernel: amtKernel) {
    return function kePrivilegedGetProcesses(): {processes: Array<__handle<Process>>} {
        return {processes: kernel.state.processes.map(e => e.handle)};
    }
}