import { amtCreateKernel } from "./core/index";

declare const cfg: Record<string, any>;

if(cfg.embeddable) {
    Object.defineProperty(window, 'amethyst', {
        value: {
            createKernel: amtCreateKernel
        },
        configurable: false
    });
} else {
    var kmain = amtCreateKernel();
    Object.defineProperty(window, 'kernel', {
        value: kmain.init,
        configurable: false
    });
}