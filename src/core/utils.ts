export function Uint8(data: string) {
    return Uint8Array.from(data.split(';').map(e => parseInt(e, 16)));
}

export function Uint8Str(uint8: Uint8Array) {
    return Array.from(uint8).map(e => e.toString(16)).join(';');
}

export function int16(x: number, y: number) {
    return (255 * x) + y;
}

export function int8(x: number) {
    return [
        Math.floor(x / 255),
        x % 255
    ];
}

export function stringify(uint8: Uint8Array) {
    var str = '';
    for(var i = 0; i < uint8.length; i++) {
        str += String.fromCharCode(uint8[i]);
    }
    return str;
}

export async function blobToUint8(blob: Blob) {
    return new Uint8Array(await blob.arrayBuffer())
}