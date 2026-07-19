# Project Amethyst Documentation
## First app
Code:
```js
// ctx is of the type `amtContext`
var hWnd = ctx.createWindow('App', 640, 400);
var content = document.createElement('div');
var h1 = document.createElement('h1');
h1.innerText = 'Hello, Amethyst!';
content.appendChild(h1);
var p = document.createElement('p');
p.innerText = 'This app is running under Project Amethyst.';
content.appendChild(p);
ctx.setWindowContent(hWnd, content);
```
To compile it, use `amtc --in=index.js --out=app`. Refer to [the package's documentation](https://npmjs.com/amethyst-compiler).
Old apps should work in newer versions of Amethyst, as the executable format won't change.

## APIs

`amtContext`:
 * `amtTerminateSystem`: `(errorCode: amtErrorCode) => true | -0x21400000` - Crashes the system, returns true if the system has crashed or `ACCESS_DENIED` (-0x21400000) if you're not root.
 * `amtGetUID`: `() => null | number` - Gets your user ID (most likely 0)
 * `readFile`: `(path: string) => Promise<amtErrorCode | Blob>` - Read file
 * `readDir`: `(path: string) => Promise<amtErrorCode | string[]>` - Read directory, similar to `fs.readdirSync()`
 * `writeFile`: `(path: string, content: Blob) => Promise<amtErrorCode>` - Write file
 * `mkdir`: `(path: string) => Promise<amtErrorCode>` - Make directory;
 * `remove`: `(path: string) => Promise<amtErrorCode>` - Delete file
 * `getFSType`: `(path: string) => Promise<amtFilesystemType>` - Get FS node type
 * `createWindow`: `(title: string, width: number, height: number, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null, style: amtWindowStyle | null) => __handle<__window> /* number */` - Create window (inspired by Win32 API)
 * `setWindowPos`: `(hWnd: __handle<__window>, width: number | null, height: number | null, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null) => boolean` - Set window position, size, etc (inspired by Win32 API)
 * `setWindowState`: `(hWnd: __handle<__window>, state: amtWindowState) => boolean` - Set window state, to close a window use `ctx.setWindowState(hWnd, 'closed');`
 * `setWindowContent`: `(hWnd: __handle<__window>, content: HTMLElement) => boolean` - Use a HTML element as the window content (too lazy to write proper html rendering)
 * `setWindowProc`: `(hWnd: __handle<__window>, proc: (evt: amtWindowEvent) => Promise<void>) => boolean` - (not new) Set window proc, similar to Win32
 * `driveTypes` - All avaliable drive types (typically only these types are available:)
   * `localStorage`: `(mount: string) => DriveBinding` - Use localStorage
   * `ram`: `(mount: string) => DriveBinding` - Typical RAM drive
 * `config`: `Record<string, any>` - Config derived from boot arguments, not important for most apps
 * `buildConfig`: `Record<string, any>` - Build configuration, also not important for most apps
 * `amtErrorDictionary`: `Record<amtErrorCode, string>` - [Error code dictionary](#error-codes), translates error codes to human-readable strings
 * `amtErrorCode` - Error code (number)
 * `createProcess`: `(name: string | null, keProcessFunction: ((context: amtContext) => void) /* proc function */ | string /* proc function */ | Uint8Array /* binary */) => number | null` - Create process
 * `terminateProcess`: `(pid: number) => amtErrorCode` - Terminate process
 * `hProcess`: `number` - Your PID (in a library: the process you're attached to)
 * `getBinarySection`: `(name: string) => null | Uint8Array` - Get a section from your binary
 * `exportFunc`: `(name: string, func: Function) => boolean` - Export function (will only succeed if you're a library)
 * `loadLibrary`: `(keProcessFunction: ((context: amtContext) => void) /* proc function */ | string /* proc function */ | Uint8Array /* binary */) => Promise<null>` - Load a library into your context
 * `sku`: `AmtSKU` - The current kernel SKU, may be used to gate features

`amtWindowStyle`:
 * `closeBtn`: `boolean` - Display close button?
 * `maxBtn`: `boolean` - Display maximize button?
 * `caption`: `boolean` - Show titlebar?
 * `resizable`: `boolean` - Is window resizable?

`amtFilesystemType`: `"none" | "dir" | "file"` - What the filesystem node is (known bug: if you make a file named .dir "inside" of a file, the file will now be a directory and will be unopenable)

`amtWindowEvent`:
 * `hWnd`: `__handle<__window>` - Window handle
 * `w`: `number` - Window width
 * `h`: `number` - Window height
 * `state`: `amtWindowState` - Window state (can be "maximized", "closed", "hidden" or "normal")
 * `x`: `number` - Window X position
 * `y`: `number` - Window Y position
 * `event`: `amtWindowEventType` - Event type (can be "close" or "move")

`AmtSKU`:
 * `name`: `string` - The SKU's name (like Standard or EmbeddableCore)
 * `features`: `Array<string>` - The features that the SKU has (e.g. `["gui", "embeddable"]` will produce an embeddable kernel with GUI support)

## Error codes
 * `-0x10000000`: SUCCESS - Used by some functions to indicate success, almost never fatal
 * `-0x21000000`: GENERAL_SYSTEM_FAULT - Reason unclear
 * `-0x21030000`: INTERNAL_FAILURE - System or program collapsed from the inside
 * `-0x21400000`: ACCESS_DENIED - Access denied
 * `-0x21460000`: KERNEL_SECURITY_EXCEPTION - Kernel security checks failed, usually results in a crash
 * `-0x21500000`: SYSTEM_INITIALIZATION_FAILED - System initialization failed, most likely due to bad initramfs
 * `-0x21600000`: INVALID_PROCESS - Invalid process, usually not fatal
 * `-0x21700000`: NOT_FOUND - Resource not found