import { getFlags, log } from "../core/index";
import { keCreateHandle, keFreeHandle, keResolveHandle } from "../core/process";
import { TerminalHandle } from "../textmode/types";

const guiEl = document.createElement('div');

export function SetWindowPos(hWnd: __handle<__window>, width: number | null, height: number | null, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null) {
    var window: __window | null = keResolveHandle(hWnd);
    if(!window) {
        return false;
    }
    window.w = width || window.w;
    window.h = height || window.h;
    window.x = x || window.x;
    window.y = y || window.y;
    window.mxw = maxWidth || window.mxw;
    window.mxh = maxHeight || window.mxh;
    window.mnw = minWidth || window.mnw;
    window.mnh = minHeight || window.mnh;
    return UpdateWindow(window, hWnd);
}

export function SetWindowState(hWnd: __handle<__window>, state: amtWindowState) {
    var window: __window | null = keResolveHandle(hWnd);
    if(!window) {
        return false;
    }
    if(state == "closed") {
        window.el.remove();
        keFreeHandle(hWnd);
        return true;
    }
    window.state = state;
    UpdateWindow(window, hWnd);
    return true;
}

function CorrectWindowSize(window: __window) {
    if(window.mxw && window.w > window.mxw) {
        window.w = window.mxw;
    }
    if(window.mxh && window.h > window.mxh) {
        window.h = window.mxh;
    }
    if(window.mnw && window.w < window.mnw) {
        window.w = window.mnw;
    }
    if(window.mnh && window.h < window.mnh) {
        window.h = window.mnh;
    }
}

function UpdateWindow(window: __window, hWnd: __handle<__window>, updated?: boolean, redrawTitle: boolean = true) {
    CorrectWindowSize(window);
    window.el.style.display = window.state == 'hidden' ? 'none' : '';
    window.titleEl.style.cursor = window.state == 'maximized' ? '' : 'move';
    if(redrawTitle) {
        window.titleCaptionEl.innerText = window.title;
        var captionBtnContainer = document.createElement('span');
        captionBtnContainer.style.position = 'relative';
        captionBtnContainer.style.float = 'right';
        if(window.style.maxBtn) {
            var max = document.createElement('button');
            max.innerText = '☐';
            max.style.fontFamily = 'monospace';
            max.style.fontSize = '9px';
            max.style.background = '#ccc';
            max.style.borderRadius = '0'; // webkit
            max.addEventListener('click', function() {
                window.state = window.state == 'maximized' ? 'normal' : 'maximized';
                UpdateWindow(window, hWnd, false, false);
            });
            captionBtnContainer.appendChild(max);
        }
        if(window.style.closeBtn) {
            var close = document.createElement('button');
            close.innerText = 'x';
            close.style.fontSize = '11px';
            close.style.fontFamily = 'monospace';
            close.style.background = '#ccc';
            close.style.borderRadius = '0'; // webkit
            close.addEventListener('click', function() {
                SetWindowState(hWnd, 'closed');
            });
            captionBtnContainer.appendChild(close);
        }
        window.titleCaptionEl.appendChild(captionBtnContainer);
    }
    if(!window.style.caption) {
        window.titleCaptionEl.style.display = 'none';
    } else {
        window.titleCaptionEl.style.display = '';
    }
    if(!['hidden', 'normal'].includes(window.state) && !updated && window.el.style.width.indexOf('px') != -1) {
        window.w = parseInt(window.el.style.width);
        window.h = parseInt(window.el.style.height);
        CorrectWindowSize(window);
    }
    if(window.state == 'normal') {
        window.el.style.width = window.w.toString();
        window.el.style.height = window.h.toString();
        window.el.style.top = window.y.toString();
        window.el.style.left = window.x.toString();
        window.el.style.resize = window.style.resizable ? 'both' : 'none';
    } else if(window.state == 'maximized') {
        window.el.style.width = '100vw';
        window.el.style.height = '100vh';
        window.el.style.top = '0';
        window.el.style.left = '0';
        window.el.style.resize = 'none';
    }
    if(!updated) {
        UpdateWindow(window, hWnd, true, false);
    }
    return true;
}

export function CreateWindow(title: string, width: number, height: number, x: number | null, y: number | null, maxWidth: number | null, maxHeight: number | null, minWidth: number | null, minHeight: number | null, style: amtWindowStyle | null): __handle<__window> {
    var config = getFlags();
    if(style == null) {
        style = {
            caption: true,
            closeBtn: true,
            maxBtn: true,
            resizable: true
        };
    }
    if(config.kdbg) {
        console.log('[kdbg] try create window:\n title = %s\n width = %d\n height = %d\n x = %s\n y = %s\n maxWidth = %s\n maxHeight = %s\n minWidth = %s\n minHeight = %s\n style = %o',
            title,
            width,
            height,
            x,
            y,
            maxWidth,
            maxHeight,
            minWidth,
            minHeight,
            style
        );
    }
    var w = document.createElement('div');
    var moveWnd = false;
    w.style.position = 'fixed';
    w.style.background = '#d3d3d3';
    w.style.fontFamily = 'monospace, monospace';
    w.style.fontSize = '15px'; // better grip
    w.style.userSelect = 'none';
    w.style.overflow = 'scroll';
    w.style.border = '2px outset #cacaca';
    w.style.overflow = 'hidden';
    var t = document.createElement('div');
    t.style.height = '15px';
    var tc = document.createElement('span');
    if(style.caption) {
        tc.innerText = title;
    } else {
        tc.style.display = 'none';
    }
    t.appendChild(tc);
    t.style.background = '#00007f';
    t.style.color = '#fff';

    var wc = document.createElement('div');
    wc.style.width = '100%';
    wc.style.height = 'calc(100% - 15px)';
    wc.style.overflow = 'scroll';

    var wnd: __window = {
        el: w,
        title,
        x: x || 42,
        y: y || 128,
        w: width,
        h: height,
        mxw: maxWidth,
        mxh: maxHeight,
        mnw: minWidth,
        mnh: minHeight,
        state: "normal",
        titleEl: t,
        titleCaptionEl: tc,
        windowContentEl: wc,
        style
    };

    let relativeDragPos = [0, 0];

    var hWnd = keCreateHandle(wnd);

    UpdateWindow(wnd, hWnd);

    t.addEventListener('mousedown', function(evt) {
        relativeDragPos = [evt.pageX - wnd.x, evt.pageY - wnd.y];
        moveWnd = true;
    });

    w.addEventListener('mouseup', function() {
        moveWnd = false;
    });

    // UX hack: make window not "sticky"
    w.addEventListener('click', function() {
        moveWnd = false;
    });

    var clicks = 0;

    t.addEventListener('click', function() {
        clicks++
        if(clicks == 2) {
            wnd.state = wnd.state == 'maximized' ? 'normal' : 'maximized';
        }
        setTimeout(() => {
            clicks--;
            if(clicks < 0) clicks = 0;
        }, 500);
    })

    setInterval(() => {
        wnd.w = parseInt(w.style.width);
        wnd.h = parseInt(w.style.height);
        UpdateWindow(wnd, hWnd, false, false);
    }, 10);

    document.addEventListener('mousemove', function(e) {
        if(!moveWnd && wnd.state != 'maximized') {
            return;
        }
        SetWindowPos(hWnd, null, null, e.pageX - relativeDragPos[0], e.pageY - relativeDragPos[1], null, null, null, null);
    });

    w.appendChild(t);
    w.appendChild(wc);
    guiEl.appendChild(w);
    UpdateWindow(wnd, hWnd);

    return hWnd;
}

export function SetWindowContent(hWnd: __handle<__window>, content: HTMLElement) {
    var window: __window | null = keResolveHandle(hWnd);
    if(!window) {
        return false;
    }
    window.windowContentEl.innerHTML = '';
    Array.from(content.children).forEach(child => {
        if(!window) {
            return;
        }
        window.windowContentEl.appendChild(child)
    });
    return true;
}

function toggleGUI(state: boolean, tHandle: TerminalHandle) {
    if(state) {
        guiEl.style.display = '';
        tHandle.internal.handle.style.display = 'none';
    } else {
        guiEl.style.display = 'none';
        tHandle.internal.handle.style.display = '';
    }
}

export function gui_init(tHandle: TerminalHandle) {
    var config = getFlags();
    if(config.kdbg) {
        console.log('[kdbg] init gui');
        log(tHandle, 'init gui');
        console.log('[kdbg] tHandle = %o', tHandle);
    }
    guiEl.style.width = '100vw';
    guiEl.style.height = '100vh';
    guiEl.style.position = 'fixed';
    guiEl.style.zIndex = '2';
    guiEl.style.top = '0';
    guiEl.style.left = '0';
    guiEl.style.background = '#4a4a4a';
    document.body.appendChild(guiEl);
    toggleGUI(true, tHandle);
    if(config.kdbg) {
        log(tHandle, 'gui init finished');
        console.log('[kdbg] gui init finished');
    } else {
        tHandle.write('Done!');
    }
}