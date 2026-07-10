import { _CreateProcess, _CreateContext, _kePrivilegedGetProcesses, _keCreateHandle, _keResolveHandle, _keFreeHandle, _kePrivilegedGetHandles } from "./process";
import { init, getTTY } from "../textmode/index";
import { EmbeddableTerminalHandle, TerminalHandle } from "../textmode/types";
import { gui_init } from "../gui/index";
import { ramfs } from "../ramfs";
import { bindings, driveTypes } from "./filesystem";
import { Uint8 } from "./utils";
import { Sentinel } from "./sentinel";

declare const cfg: Record<string, any>;
if(!cfg.embeddable) {
    document.documentElement.innerHTML = '';
}
export let config: Record<string, any> = {};
var date = 0;

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

export function _amtTerminateSystem(kernel: amtKernel, keUserIdentifier: number, keProcessHandle: number) {
    var kePrivilegedGetProcesses = _kePrivilegedGetProcesses(kernel);
    var keResolveHandle = _keResolveHandle(kernel);
    var keFreeHandle = _keFreeHandle(kernel);
    var kePrivilegedGetHandles = _kePrivilegedGetHandles(kernel);
    return function amtTerminateSystem(errorCode: amtErrorCode) {
        const tHandle = kernel.tty;
        if(!tHandle) {
            // fallback
            throw errorCode;
        }
        if(keUserIdentifier != 0) {
            return -0x21400000;
        }
        kernel.running = false;
        kernel.error = errorCode;
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

export function log(tHandle: TerminalHandle | EmbeddableTerminalHandle | null, msg: string) {
    if(tHandle == null) {
        return;
    }
    tHandle.write('[' + (Math.floor(((Date.now() - date) / (60 * 1000)) * 10000) / 10000) + '] ' + msg + '\n');
}

function _kernel_init(kernel: amtKernel) {
    return function kernel_init(cmdLine: string | Record<string, any>): Promise<amtErrorCode> {
        return new Promise((resolve, reject) => {
            kernel.running = true;
            date = Date.now();
            if(typeof cmdLine == 'string') {
                var split = cmdLine.split(' '), tmp: {value: any} = {value: ''};
                for(var i = 0; i < split.length; i++) {
                    tmp.value = split[i].split('=')[1] || '';
                    if(tmp.value == '') {
                        tmp.value = true;
                    }
                    config[split[i].split('=')[0].slice(1)] = tmp.value;
                }
            } else {
                config = cmdLine;
            }
    
            const tHandle = kernel.tty;
            if(!tHandle) {
                // fallback
                return reject(-0x21500000);
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
                    _amtTerminateSystem(kernel, 0, -1)(-0x21500000);
                    return reject(-0x21500000);
                }
            }
            
            if(config.kdbg) {
                console.log('[kdbg] bootargs =', config);
                log(tHandle, 'bootargs = ' + JSON.stringify(config));
                if(!cfg.embeddable) {
                    console.log('[kdbg] starting sentinel');
                    log(tHandle, 'starting sentinel');
                }
            }
        
            if(!cfg.embeddable) {
                Sentinel.init(kernel).then(function() {
                    if(config.kdbg) {
                        console.log('[kdbg] sentinel started');
                        log(tHandle, 'sentinel started');
                    }
                });
            }
        
            if(config.break) {
                if(config.kdbg) {
                    console.log('[kdbg] break initiated, terminating system...');
                    log(tHandle, 'break initiated, terminating system...');
                }
                _amtTerminateSystem(kernel, 0, -1)(<amtErrorCode>(typeof config.break == 'string' ? parseInt(config.break, 16) : -0x21500000));
                return reject(typeof config.break == 'string' ? parseInt(config.break, 16) : -0x21500000);
            }
        
            _CreateProcess(kernel)('init', async (ctx) => {
                try {
                    if(config.kdbg) {
                        console.log('[kdbg] mounting initramfs');
                        log(tHandle, 'mounting initramfs');
                    }
                    var ramKeys = Object.keys(ramfs);
                    bindings.ramfs = driveTypes.ram('ramfs');
                    for(var i = 0; i < ramKeys.length; i++) {
                        await ctx.writeFile('/ramfs/' + ramKeys[i], new Blob([Uint8(ramfs[ramKeys[i]])]));
                    }
        
                    if(config.kdbg) {
                        console.log('[kdbg] done, running init...');
                        log(tHandle, 'done, running init...');
                    }
                    var file = await ctx.readFile('/ramfs/' + ctx.buildConfig.ramfsInitJS);
                    if(typeof file == 'number') {
                        if(config.kdbg) {
                            console.log('[kdbg] oops! could not read file, terminating system...');
                            log(tHandle, 'oops! could not read file, terminating system...');
                        }
                        (_amtTerminateSystem(kernel, 0, 0))(file);
                        return reject(file);
                    }
                    eval(await file.text())(ctx, {tHandle, gui_init, log, bindings});
                    resolve(-0x10000000);
                } catch(e) {
                    console.error(e);
                    (_amtTerminateSystem(kernel, 0, 0))(-0x21500000);
                    reject(-0x21500000);
                }
            }, 0);
        });
    }
}

export function amtCreateKernel() {
    var kernel: amtKernel = {
        running: false,
        init: (cmdLine: string | Record<string, any>) => new Promise(resolve => resolve(-0x10000000)),
        error: null,
        state: {
            processes: [],
            latestPID: 0,
            latestHandle: 0,
            handles: {},
            highestZIndex: 0,
            wnds: [],
            tHandle: init(document.body).tHandle
        },
        tty: null
    };
    kernel.tty = getTTY(kernel.state.tHandle);
    if(!kernel.tty) {
        throw new Error('TTY not found!');
    }
    if(!cfg.embeddable && kernel.tty instanceof TerminalHandle) {
        Sentinel.register(kernel.tty.internal.handle);
    }
    kernel.state.root = _keCreateHandle(kernel)({
        uid: 0
    });
    kernel.init = _kernel_init(kernel);
    return kernel;
}