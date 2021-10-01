const Term = {
    width: process.stdout.columns,
    saveCursor: () => { Term.printEsc(`\x1b7`); },	// also `\x1b[s`
    restoreCursor: () => { Term.printEsc(`\x1b8`); },	// also `\x1b[u`
    previousLine: (line) => { Term.printEsc(`\x1b[${line}F`); },
    eraseLine: () => { Term.printEsc(`\x1b[2K`); },
    eraseDisplayBelow: () => { Term.printEsc(`\x1b[0J`); },
    backDelete: () => { Term.printEsc(`\x1b[1D\x1b[1P`); return Term; },
    clear: () => { Term.printEsc(`\x1b[${process.stdout.rows}F`); Term.eraseDisplayBelow(); },
    up: (count) => { Term.printEsc(`\x1b[${count}A`); },
    down: (count) => { Term.printEsc(`\x1b[${count}B`); },
    left: (count) => { Term.printEsc(`\x1b[${count}D`); },
    print: (str = []) => {
        const splittedStr = [];
        for (let count = 0, visibleCharCount = 0; count < str.length; count++) {
            if (visibleCharCount && !(visibleCharCount % Term.width) && str[count] !== '\n') splittedStr.push('\n');
            splittedStr.push(str[count]);
            if (!str[count].startsWith('\x1b[')) visibleCharCount++;
        }
        process.stdout.write(splittedStr.join(''));
        Term.defaultColor();
        Term.styleReset();
        return Term;
    },
    printEsc: (str = "") => { process.stdout.write(str); return Term; },
    requestCursorLocation: () => { Term.printEsc(`\x1b[6n`); },
    cursorHide: () => { Term.printEsc(`\x1b[?25l`); },
    cursorShow: () => { Term.printEsc(`\x1b[?25h`); },
    getCursorLocation: () => {
        return new Promise(res => {
            process.stdin.once("data", (key) => {
                const pos = key.split(';');
                res({ x: parseInt(pos[1].split('R')[0]), y: parseInt(pos[0].split('[')[1]) });
            });
            Term.requestCursorLocation();
        });
    },
    // style
    formatReset: () => { Term.styleReset().defaultColor(); return Term; },
    styleReset: () => { Term.printEsc('\x1b[0m'); return Term; },
    bold: () => { Term.printEsc('\x1b[1m'); return Term; },
    italic: () => { Term.printEsc('\x1b[3m'); return Term; },
    underline: () => { Term.printEsc('\x1b[4m'); return Term; },
    strike: () => { Term.printEsc('\x1b[9m'); return Term; },
    // colors
    defaultColor: () => { Term.printEsc(Term.colorDefaultColor); return Term; },
    black: () => { Term.printEsc(Term.colorBlack); return Term; },
    red: () => { Term.printEsc(Term.colorRed); return Term; },
    green: () => { Term.printEsc(Term.colorGreen); return Term; },
    yellow: () => { Term.printEsc(Term.colorYellow); return Term; },
    blue: () => { Term.printEsc(Term.colorBlue); return Term; },
    magenta: () => { Term.printEsc(Term.colorMagenta); return Term; },
    cyan: () => { Term.printEsc(Term.colorCyan); return Term; },
    white: () => { Term.printEsc(Term.colorWhite); return Term; },
    brightBlack: () => { Term.printEsc(Term.colorBrightBlack); return Term; },
    brightRed: () => { Term.printEsc(Term.colorBrightRed); return Term; },
    brightGreen: () => { Term.printEsc(Term.colorBrightGreen); return Term; },
    brightYellow: () => { Term.printEsc(Term.colorBrightYellow); return Term; },
    brightBlue: () => { Term.printEsc(Term.colorBrightBlue); return Term; },
    brightMagenta: () => { Term.printEsc(Term.colorBrightMagenta); return Term; },
    brightCyan: () => { Term.printEsc(Term.colorBrightCyan); return Term; },
    brightWhite: () => { Term.printEsc(Term.colorBrightWhite); return Term; },


    colorDefaultColor: '\x1b[39m',
    colorBlack: '\x1b[30m',
    colorRed: '\x1b[31m',
    colorGreen: '\x1b[32m',
    colorYellow: '\x1b[33m',
    colorBlue: '\x1b[34m',
    colorMagenta: '\x1b[35m',
    colorCyan: '\x1b[36m',
    colorWhite: '\x1b[37m',
    colorBrightBlack: '\x1b[90m',
    colorBrightRed: '\x1b[91m',
    colorBrightGreen: '\x1b[92m',
    colorBrightYellow: '\x1b[93m',
    colorBrightBlue: '\x1b[94m',
    colorBrightMagenta: '\x1b[95m',
    colorBrightCyan: '\x1b[96m',
    colorBrightWhite: '\x1b[97m',
};

module.exports.Term = Term;