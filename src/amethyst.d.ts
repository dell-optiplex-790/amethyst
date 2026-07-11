import { EmbeddableTerminalHandle, TerminalHandle } from "textmode/types";

declare global {

    type amtContext = {
        [key: string]: any;
        /* amtTerminateSystem
         * A function that will return "true" if the system has crashed, or 0x21400000 (ACCESS_DENIED)
         * if you do not have a context with sufficient privileges.
         * WARNING: Users do not want their system to crash, and if one occurs, the user will lose unsaved work.
         */
        amtTerminateSystem: (errorCode: amtErrorCode) => true | -0x21400000;
        amtGetUID: () => null | number;
        readFile: (path: string) => Promise<amtErrorCode | Blob>;
        readDir: (path: string) => Promise<amtErrorCode | string[]>;
        writeFile: (path: string, content: Blob) => Promise<amtErrorCode>;
        mkdir: (path: string) => Promise<amtErrorCode>;
        remove: (path: string) => Promise<amtErrorCode>;
        getFSType: (path: string) => Promise<amtFilesystemType>;
        createWindow: (title: string, width: number, height: number, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null, style: amtWindowStyle | null) => __handle<__window>;
        setWindowPos: (hWnd: __handle<__window>, width: number | null, height: number | null, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null) => boolean;
        setWindowState: (hWnd: __handle<__window>, state: amtWindowState) => boolean;
        setWindowContent: (hWnd: __handle<__window>, content: HTMLElement) => boolean;
        setWindowProc: (hWnd: __handle<__window>, proc: amtWindowEventCB) => boolean;
        driveTypes: {
            localStorage: (mount: string) => DriveBinding;
            ram: (mount: string) => DriveBinding;
        };
        config: Record<string, any>;
        buildConfig: Record<string, any>;
        amtErrorDictionary: amtErrorDictionary;
        createProcess: (name: string | null, keProcessFunction: ((context: amtContext) => void) | string | Uint8Array) => number | null;
        terminateProcess: (pid: number) => amtErrorCode;
        hProcess: number;
        getBinarySection: (name: string) => null | Uint8Array;
        exportFunc: (name: string, func: Function) => boolean;
        loadLibrary: (keProcessFunction: ((context: amtContext) => any) | string | Uint8Array) => Promise<null>;
    }
    
    type amtLibraryName = 'core.aml' | string;
    type amtErrorCode = -0x21000000 | -0x21030000 | -0x21400000 | -0x21460000 | -0x21500000 | -0x21600000 | -0x10000000 | -0x21700000;

    type amtErrorDictionary = Record<amtErrorCode, string> & {
        [-0x21000000]: 'GENERAL_SYSTEM_FAULT';
        [-0x21030000]: 'INTERNAL_FAILURE'
        [-0x21400000]: 'ACCESS_DENIED';
        [-0x21460000]: 'KERNEL_SECURITY_EXCEPTION'
        [-0x21500000]: 'SYSTEM_INITIALIZATION_FAILED';
        [-0x21600000]: 'INVALID_PROCESS';
        [-0x21700000]: 'NOT_FOUND';
        [-0x10000000]: 'SUCCESS';
    };

    interface amtWindowStyle {
        closeBtn: boolean;
        maxBtn: boolean;
        caption: boolean;
        resizable: boolean;
    }

    interface amtWindowEvent {
        hWnd: __handle<__window>;
        w: number;
        h: number;
        state: amtWindowState;
        x: number;
        y: number;
        event: amtWindowEventType;
    }

    type amtWindowState = "normal" | "maximized" | "closed" | "hidden";
    type amtWindowEventType = "close" | "move";
    type amtWindowEventCB = (evt: amtWindowEvent) => Promise<void>;
    type amtFilesystemType = "none" | "dir" | "file";


    // embeddable kernel
    interface amtKernel {
        running: boolean;
        init: (cmdLine: string | Record<string, any>) => Promise<amtErrorCode>
        error: amtErrorCode | null;
        state: {
            processes: Array<Process>;
            latestPID: number;
            latestHandle: number;
            handles: Record<number, any>;
            root?: __handle<__user>;
            wnds: Array<__window>; 
            highestZIndex: number;
            tHandle: number;
        },
        tty: TerminalHandle | EmbeddableTerminalHandle | null;
        guiEl: HTMLDivElement;
    }
}export {};