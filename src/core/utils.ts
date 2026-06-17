export function Uint8(data: string) {
    return Uint8Array.from(data.split(';').map(e => parseInt(e, 16)));
}

export function Uint8Str(uint8: Uint8Array) {
    return Array.from(uint8).map(e => e.toString(16)).join(';');
}