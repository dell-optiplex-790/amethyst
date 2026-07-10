import { _amtTerminateSystem } from "./index";

var allowedElements: Array<Element> = [];
export const Sentinel = {
    register: function(el: Element) {
        if(typeof window == 'undefined' && typeof document == 'undefined') {
            return;
        }
        allowedElements.push(el);
    },
    dispose: function(el: Element) {
        if(typeof window == 'undefined' && typeof document == 'undefined') {
            return;
        }
        var idx = allowedElements.indexOf(el);
        if(idx == -1) {
            return false;
        } else {
            allowedElements.splice(idx, 1);
            return true;
        }
    },
    init: async function(kernel: amtKernel) {
        if(typeof window == 'undefined' && typeof document == 'undefined') {
            return;
        }
        var interval = setInterval(async function() {
            var incident = false;
            var elements = document.body.children;
            for(var i = 0; i < elements.length; i++) {
                if(allowedElements.indexOf(elements[i]) == -1) {
                    elements[i].remove();
                    incident = true;
                }
            }
            if(!incident) {
                return;
            }
            clearInterval(interval);
            _amtTerminateSystem(kernel, 0, 0)(-0x21460000);
        }, 500);
    }
}