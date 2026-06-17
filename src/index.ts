import { kernel_init } from "./core";

Object.defineProperty(window, 'kernel', {
    value: kernel_init,
    configurable: false
});