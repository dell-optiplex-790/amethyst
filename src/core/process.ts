import { _amtTerminateSystem, amtErrorDictionary, config } from "./index";
import { getFlags } from "./index";
import { driveTypes, readDir, readFile, remove, writeFile } from "./filesystem";
import { CreateWindow, SetWindowContent, SetWindowPos, SetWindowState } from "../gui/index";
import { restricted } from "./secure";

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

export function CreateContext(keUserHandle: __handle<__user>, keProcessHandle: __handle<Process>): amtContext {
    return {
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
        remove,
        createWindow: CreateWindow,
        setWindowPos: SetWindowPos,
        setWindowState: SetWindowState,
        setWindowContent: SetWindowContent,
        driveTypes,
        config,
        buildConfig: cfg,
        amtErrorDictionary
    }
}

export function CreateProcess(keProcessName: string | null, keProcessFunction: ((context: amtContext) => void) | string, keUserHandle: number): number | null {
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
    var ctx = CreateContext(keUserHandle, pid);
    setTimeout(async function() {
        if(typeof keProcessFunction == 'string') {
            restricted.eval(keProcessFunction)(ctx);
        } else {
            keProcessFunction(ctx);
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

export function kePrivilegedGetProcesses(): {processes: Array<__handle<Process>>} {
    return {processes: processes.map(e => e.handle)};
}