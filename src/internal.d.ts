declare global {
    // internal kernel stuff: do not use
    // type __lib_table = Record<string, __lib_init<string>>;
    interface __user {
        uid: number;
        name: string;
    }
    // type __lib_init<lib extends string> = (keUserHandle: __handle<__user>, keProcessHandle: __handle<Process>) => amtLibrary<lib>;
    interface Process {
        pid: number;
        valid: boolean;
        user: __user
        name?: string;
        // libs: __lib_table;
        handle: __handle<Process>;
    }
    type __handle<Type> = number;

    interface __window {
        title: string;
        el: HTMLElement;
        x: number;
        y: number;
        w: number;
        h: number;
        mxw: number | null;
        mxh: number | null;
        mnw: number | null;
        mnh: number | null;
        state: amtWindowState;
        titleEl: HTMLElement;
        titleCaptionEl: HTMLElement;
        style: amtWindowStyle;
        windowContentEl: HTMLElement;
        interval: number;
        wndproc: amtWindowEventCB;
    }

    interface DriveBinding {
        readFile: (path: string) => Promise<Uint8Array | amtErrorCode>;
        writeFile: (path: string, content: Uint8Array) => Promise<amtErrorCode>;
        readDir: (path: string) => Promise<string[] | amtErrorCode>;
        remove: (path: string) => Promise<amtErrorCode>;
        mount: string;
    }

} export {}