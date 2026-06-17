const listeners: Array<(key: string) => void> = [];
document.addEventListener('keypress', evt => {
    listeners.forEach(e => {
        e(String.fromCharCode(evt.charCode));
    })
});
export function pushkeyev(listener: (key: string) => void) {
    listeners.push(listener);
}