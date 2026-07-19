import { amtCreateKernel } from "./core/index";

declare const sku: AmtSKU;
declare const cfg: Record<string, any>;

if(sku.features.includes('embeddable')) {
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