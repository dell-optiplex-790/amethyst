import { getFlags } from "./index";
import { restricted } from "./secure";
import { Uint8, Uint8Str } from "./utils";

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
            return Object.keys(restricted.localStorage).filter(k => {
                return k.startsWith(path == '' ? path : (path + '/')) && k.split('/').length == path.split('/').length
            });
        },
        readFile: async function(path: string) {
            if(typeof restricted.localStorage.getItem(path) == 'string') {
                return Uint8(restricted.localStorage.getItem(path) || '');
            } else {
                return -0x21700000;
            }
        },
        writeFile: async function(path: string, content: Uint8Array) {
            restricted.localStorage.setItem(path, Uint8Str(content));
            return -0x10000000;
        },
        remove: async function(path: string) {
            if(typeof restricted.localStorage.getItem(path) == 'string') {
                restricted.localStorage.removeItem(path);
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

export async function readFile(path: string): Promise<amtErrorCode | Blob> {
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

export async function writeFile(path: string, content: Blob): Promise<amtErrorCode> {
    var config = getFlags();
    if(config.kdbg) {
        console.log('[kdbg] write file: %s', path);
    }
    var drive = getDrive(path);
    if(!bindings[drive]) {
        return -0x21700000;
    }
    return await bindings[drive].writeFile(getDrivePath(path), await content.bytes());
}

export async function readDir(path: string): Promise<amtErrorCode | string[]> {
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
    return await bindings[drive].readDir(getDrivePath(path));
}

export async function remove(path: string): Promise<amtErrorCode> {
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