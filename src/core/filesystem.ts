import { getFlags } from "./index";
import { blobToUint8, Uint8, Uint8Str } from "./utils";

export let bindings: Record<string, DriveBinding> = {};

function RamDrive(mount: string) {
    let ramFS: Record<string, Uint8Array> = {};
    const ramdrv: DriveBinding = {
        mount: mount,
        readDir: async function(path: string) {
            return Object.keys(ramFS).filter(k => {
                return k.startsWith(path == '' ? path : (path + '/')) && k.split('/').length == path.split('/').length
            });
        },
        readFile: async function(path: string) {
            if(ramFS[path] instanceof Uint8Array) {
                return ramFS[path];
            } else {
                return -0x21700000;
            }
        },
        writeFile: async function(path: string, content: Uint8Array) {
            ramFS[path] = content;
            return -0x10000000;
        },
        remove: async function(path: string) {
            if(ramFS[path] instanceof Uint8Array) {
                if(delete ramFS[path]) {
                    return -0x10000000;
                } else {
                    return -0x21000000;
                }
            } else {
                return -0x21700000;
            }
        }
    };
    return ramdrv;
}

function LocalStorageDrive(mount: string) {
    const lsdrv: DriveBinding = {
        mount: mount,
        readDir: async function(path: string) {
            return Object.keys(localStorage).filter(k => {
                return k.startsWith(path == '' ? path : (path + '/')) && k.split('/').length == path.split('/').length
            });
        },
        readFile: async function(path: string) {
            if(typeof localStorage.getItem(path) == 'string') {
                return Uint8(localStorage.getItem(path) || '');
            } else {
                return -0x21700000;
            }
        },
        writeFile: async function(path: string, content: Uint8Array) {
            localStorage.setItem(path, Uint8Str(content));
            return -0x10000000;
        },
        remove: async function(path: string) {
            if(typeof localStorage.getItem(path) == 'string') {
                localStorage.removeItem(path);
                return -0x10000000;
            } else {
                return -0x21700000;
            }
        }
    };
    return lsdrv;
}

export var driveTypes = {
    localStorage: LocalStorageDrive,
    ram: RamDrive
};

function getDrive(path: string) {
    return path.split('/')[1];
}

function getDrivePath(path: string) {
    return path.split('/').slice(2).join('/');
}

export function _readFile(kernel: amtKernel) {
    return async function readFile(path: string): Promise<amtErrorCode | Blob> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] read file: %s', path);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return -0x21700000;
        }
        var res = await bindings[drive].readFile(getDrivePath(path));
        if(typeof res == 'number') {
            return res;
        }
        return new Blob([res]);
    }
}

export function _writeFile(kernel: amtKernel) {
    return async function writeFile(path: string, content: Blob): Promise<amtErrorCode> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] write file: %s', path);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return -0x21700000;
        }
        return await bindings[drive].writeFile(getDrivePath(path), await blobToUint8(content));
    }
}

export function _readDir(kernel: amtKernel) {
    return async function readDir(path: string): Promise<amtErrorCode | string[]> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] read dir: %s', path);
        }
        if(path == '/') {
            return Object.keys(bindings);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return -0x21700000;
        }
        return await bindings[drive].readDir(getDrivePath(path)).then(_ => _ instanceof Array ? (_.filter(itm => !itm.endsWith('/.directory'))) : _);
    }
}

export function _remove(kernel: amtKernel) {
    return async function remove(path: string): Promise<amtErrorCode> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] delete file: %s', path);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return -0x21700000;
        }
        return await bindings[drive].remove(getDrivePath(path));
    }
}

export function _mkdir(kernel: amtKernel) {
    var type = _type(kernel);
    return async function mkdir(path: string): Promise<amtErrorCode> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] mkdir: %s', path);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return -0x21700000;
        }
        if((await type(path)) != 'none') {
            return -0x21400000; // you cannot overwrite a file or a directory
        }
        return await bindings[drive].writeFile(getDrivePath(path) + '/.directory', new Uint8Array([]));
    }
}

export function _type(kernel: amtKernel) {
    return async function type(path: string): Promise<amtFilesystemType> {
        if(!kernel.running) {
            throw new Error('System is not running!');
        }
        var config = getFlags();
        if(config.kdbg) {
            console.log('[kdbg] typeof: %s', path);
        }
        var drive = getDrive(path);
        if(!bindings[drive]) {
            return 'none';
        }
        var res = await bindings[drive].readFile(getDrivePath(path) + '/.directory');
        var res2 = await bindings[drive].readFile(getDrivePath(path));
        if(res instanceof Uint8Array || getDrivePath(path) == '') {
            return 'dir';
        }
        if(res2 instanceof Uint8Array) {
            return 'file';
        }
        return 'none';
    }
}