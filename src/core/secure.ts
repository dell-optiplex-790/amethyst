let _restricted: Record<string, any> = {document};

function restrict<name extends string>(obj: Record<name, any>, name: name) {
    _restricted[name] = obj[name]; // redirect refrence
    return Object.defineProperty(obj, name, {
        value: 0,
        writable: false
    });
}

['eval', 'Function', 'localStorage'].map(e => restrict(window, e));

export const restricted = _restricted;