import { int16, stringify } from "./utils";

var header = [65, 77, 84, 0];

export function loadbin(bin: Uint8Array) {
    if(!header.every((byte, i) => bin[i] == byte)) {
        return null; // invalid binary
    }
    var realBin = bin.slice(header.length);
    var sections = [], s: Record<string, Uint8Array> = {}, section, len = 0, i = 0, j = 0;
    while(i < realBin.length) {
        len = int16(realBin[i], realBin[++i] || 0);
        if(i >= realBin.length) {
            continue;
        }
        i++;
        section = new Uint8Array(len);
        for(j = 0; j < len; j++) {
            section[j] = realBin[i + j];
        }
        sections.push(section);
        i += j;
    }
    for(var i = 0; i < sections.length; i += 2) {
        s[stringify(sections[i])] = sections[i + 1];
    }
    return s;
}