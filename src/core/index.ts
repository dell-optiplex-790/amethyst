import { restricted } from "./secure";
import { CreateProcess, CreateContext, kePrivilegedGetProcesses, keResolveHandle, keFreeHandle, kePrivilegedGetHandles } from "./process";
import { init, getTTY } from "../textmode/index";
import { TerminalHandle } from "../textmode/types";
import { gui_init } from "../gui/index";
import { ramfs } from "../ramfs";
import { bindings, driveTypes, readDir, readFile, writeFile } from "./filesystem";
import { Uint8 } from "./utils";
import { Sentinel } from "./sentinel";

restricted.document.documentElement.innerHTML = '';
const { tHandle: tID } = init(document.body);
var tty = getTTY(tID);
if(!tty) {
    throw new Error('TTY not found!');
}
Sentinel.register(tty.internal.handle);
export let config: Record<string, any> = {};
var date = 0;

var status: {running: boolean, error: amtErrorCode | null} = {
    running: false,
    error: null
};

export function getStatus() {
    return status;
}

export const amtErrorDictionary: amtErrorDictionary = {
    [-0x21000000]: 'GENERAL_SYSTEM_FAULT',
    [-0x21030000]: 'INTERNAL_FAILURE',
    [-0x21400000]: 'ACCESS_DENIED',
    [-0x21460000]: 'KERNEL_SECURITY_EXCEPTION',
    [-0x21500000]: 'SYSTEM_INITIALIZATION_FAILED',
    [-0x21600000]: 'INVALID_PROCESS',
    [-0x21700000]: 'NOT_FOUND',
    [-0x10000000]: 'SUCCESS'
}

var crashCBs: Array<(error: amtErrorCode) => void> = [];

export function _amtTerminateSystem(keUserIdentifier: number, keProcessHandle: number) {
    return function amtTerminateSystem(errorCode: amtErrorCode) {
        const tHandle = getTTY(tID);
        if(!tHandle) {
            // fallback
            throw errorCode;
        }
        if(keUserIdentifier != 0) {
            return -0x21400000;
        }
        status.running = false;
        status.error = errorCode;
        for(var i = 0; i < crashCBs.length; i++) {
            crashCBs[i](errorCode);
        }
        tHandle.write(`*** STOP 0x${(errorCode * -1).toString(16)} (${amtErrorDictionary[errorCode]})
The system has encountered a problem and needs to restart.
Running processes:\n\n`);
        var _ = kePrivilegedGetProcesses();
        var procs = _.processes.map(e => keResolveHandle<Process>(e))
        for(let i = 0; i < _.processes.length; i++) {
            tHandle.write(`${'='.repeat(127)}\nName: ${procs[i]?.name ?? '(unknown)'}\nPID: ${procs[i]?.pid}\nUID: ${procs[i]?.user.uid}\n${'='.repeat(127)}\n\n`);
            keFreeHandle(_.processes[i]);
        }
        // free handles
        let handles = kePrivilegedGetHandles();
        for(let i = 0; i < handles.length; i++) {
            keFreeHandle(handles[i]);
        }
        if(config.nofailexit) {
            return true;
        }
        setTimeout(function() {
            if(typeof location == 'object' && typeof location.reload == 'function') {
                return location.reload();
            }
            tHandle.write('System should have restarted.');
        }, Number(config.failexitms) || 2000);
        return true;
    }
}

export function handleCrash(cb: (error: amtErrorCode) => void) {
    crashCBs.push(cb);
}

export function getFlags(): Record<string, any> {
    return config;
}

export function log(tHandle: TerminalHandle | null, msg: string) {
    if(tHandle == null) {
        return;
    }
    tHandle.write('[' + (Math.floor(((Date.now() - date) / (60 * 1000)) * 10000) / 10000) + '] ' + msg + '\n');
}

export function kernel_init(cmdLine: string) {
    status.running = true;
    date = Date.now();
    var split = cmdLine.split(' '), tmp: {value: any} = {value: ''};
    for(var i = 0; i < split.length; i++) {
        tmp.value = split[i].split('=')[1] || '';
        if(tmp.value == '') {
            tmp.value = true;
        }
        config[split[i].split('=')[0].slice(1)] = tmp.value;
    }
    const tHandle = getTTY(tID);
    if(!tHandle) {
        // fallback
        throw -0x21500000;
    }
    tHandle.setBackground(typeof config.bkcolor == 'string' ? config.bkcolor : '#171A4B' /* modern: '#172E63' */ );
    if(config.startmsg == true || typeof config.startmsg == 'undefined') {
        tHandle.write('Project Amethyst v1.00\n\n');
    } else if(typeof config.startmsg == 'string' && config.startmsg != '0') {
        try {
            tHandle.write(atob(config.startmsg) + '\n\n');
        } catch(e) {
            if(config.kdbg) {
                console.log('[kdbg] bootargs =', config);
                log(tHandle, 'bootargs = ' + JSON.stringify(config));
                console.log('[kdbg] error =', e);
                log(tHandle, 'error = ' + e);
                console.log('[kdbg] oops! terminating system...');
                log(tHandle, 'oops! terminating system...');
            }
            throw _amtTerminateSystem(0, -1)(-0x21500000);
        }
    }
    
    if(config.kdbg) {
        console.log('[kdbg] bootargs =', config);
        log(tHandle, 'bootargs = ' + JSON.stringify(config));
        console.log('[kdbg] starting sentinel');
        log(tHandle, 'starting sentinel');
    }

    Sentinel.init().then(function() {
        if(config.kdbg) {
            console.log('[kdbg] sentinel started');
            log(tHandle, 'sentinel started');
        }
    });
    

    if(config.break) {
        if(config.kdbg) {
            console.log('[kdbg] break initiated, terminating system...');
            log(tHandle, 'break initiated, terminating system...');
        }
        throw _amtTerminateSystem(0, -1)(<amtErrorCode>(typeof config.break == 'string' ? parseInt(config.break, 16) : -0x21500000));
    }

    CreateProcess('init', async (ctx) => {
        try {
            Object.defineProperty(window, 'ctx', { value: ctx, configurable: true });
            if(config.kdbg) {
                console.log('[kdbg] mounting initramfs');
                log(tHandle, 'mounting initramfs');
            }
            var ramKeys = Object.keys(ramfs);
            bindings.ramfs = driveTypes.ram('ramfs');
            for(var i = 0; i < ramKeys.length; i++) {
                await writeFile('/ramfs/' + ramKeys[i], new Blob([Uint8(ramfs[ramKeys[i]])]));
            }

            if(config.kdbg) {
                console.log('[kdbg] done, running init...');
                log(tHandle, 'done, running init...');
            }
            var file = await readFile('/ramfs/' + ctx.buildConfig.ramfsInitJS);
            if(typeof file == 'number') {
                if(config.kdbg) {
                    console.log('[kdbg] oops! could not read file, terminating system...');
                    log(tHandle, 'oops! could not read file, terminating system...');
                }
                return (_amtTerminateSystem(0, 0))(file);
            }
            restricted.eval(await file.text())(ctx, {tHandle, gui_init, log, bindings});
        } catch(e) {
            console.error(e);
            (_amtTerminateSystem(0, 0))(-0x21500000);
        }
    }, 0);
}