import { kernel_init } from "./core/index";

Object.defineProperty(window, 'kernel', {
    value: kernel_init,
    configurable: false
});