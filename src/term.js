// terminal definition
const t = {
    sc: { lines: [], justifyToRight: 0 },
    message: '',
    chars: [],
    stdout: process.stdout,
    clear: function () { t.print(`\x1b[${t.stdout.rows}F\x1b[0J`); return t; },
    home: function () { t.print(`\x1b[${t.stdout.rows}F`); return t; },
    left: function (lines) { t.print(`\x1b[${lines}D`); return t; },
    previousLine: function (lines) { t.print(`\x1b[${lines}F`); return t; },
    eraseDisplayBelow: function () { t.print(`\x1b[0J`); return t; },
    cursorHide: function () { t.print(`\x1b[?25l`); return t; },
    // cursorHide: function () { return t; },
    cursorShow: function () { t.print(`\x1b[?25h`); return t; },
    requestCursorLocation: function () {
        return new Promise((res) => {
            process.stdin.once("data", data => {
                const raw = data.split('[')[1].replace('R', '').split(';');
                res({ x: parseInt(raw[1]), y: parseInt(raw[0]) });
            })
            t.print(`\x1b[6n`);
        });
    },
    /**
     * print format
     */
    print: function (str = "") { t.stdout.write(str); return t; },
    /**
     * start new sc build
     */
    newScreen: function () {
        if (t.sc.lines) {
            let lines = t.sc.lines.length;
            t.sc.lines.forEach(cs => {
                const l = cs / t.stdout.columns;
                if (l > 1) lines += Math.floor(l);
            });
            if (lines === 0) t.left(t.stdout.columns);
            else t.previousLine(lines);
            t.print(t.mc.clearLineCursorRight);
        }
        if (t.message) {
            console.log();
            t.stdout.write(t.message);
            t.stdout.write(t.mc.resetAll);
            t.message = '';
            console.log();
        }
        t.sc.lines = [];
        t.chars = [];
        // insert header
        console.log();
        t.sc.lines.push(0);
        return t;
    },

    flush: async function (menuItem = false) {
        const col = t.stdout.columns - 1;
        if (t.chars.length > col) {
            const contChar = '…';
            if (t.sc.justifyToRight && menuItem) {
                const head = t.chars.slice(0, 7);
                const tail = t.chars.slice(-col + 7);
                t.chars = [...head, ...tail];
                t.chars[6] = contChar;
            }
            if (!menuItem) {
                const tail = t.chars.slice(-col);
                t.chars = [...tail];
                t.chars[0] = contChar;
            }
            if (!t.sc.justifyToRight && menuItem) t.chars[col - 1] = contChar;
            t.chars = t.chars.slice(0, col);
        }
        t.print(t.chars.join('') + t.mc.clearLineCursorRight)
            .print(t.mc.clearLineCursorRight)
        console.log();
        t.sc.lines.push(t.chars.length);
        t.chars = [];
    },
    /**
     * flush the temporary new line buffer and justify words to right
     */
    flushJustifyToRight: function (indent = 0) {

    },

    bold: function (str, code = "") { return t.formatter(t.mc.bold + code, str); },
    italic: function (str, code = "") { return t.formatter(t.mc.italic + code, str); },
    underline: function (str, code = "") { return t.formatter(t.mc.underline + code, str); },
    inverse: function (str, code = "") { return t.formatter(t.mc.inverse + code, str); },
    strike: function (str, code = "") { return t.formatter(t.mc.strike + code, str); },

    // colors
    formatter: function (code = "", str = "") {
        str.split('').forEach(c => {
            // t.chars.push(c);
            t.chars.push(code + c + t.mc.styleReset + t.bc.defaultColor + t.fc.defaultColor);
        });
        return t;
    },

    defaultColor: function (str) { return t.formatter(t.fc.defaultColor, str); },
    black: function (str) { return t.formatter(t.fc.black, str); },
    red: function (str) { return t.formatter(t.fc.red, str); },
    green: function (str) { return t.formatter(t.fc.green, str); },
    yellow: function (str) { return t.formatter(t.fc.yellow, str); },
    blue: function (str) { return t.formatter(t.fc.blue, str); },
    magenta: function (str) { return t.formatter(t.fc.magenta, str); },
    cyan: function (str) { return t.formatter(t.fc.cyan, str); },
    white: function (str) { return t.formatter(t.fc.white, str); },
    brightBlack: function (str) { return t.formatter(t.fc.brightBlack, str); },
    brightRed: function (str) { return t.formatter(t.fc.brightRed, str); },
    brightGreen: function (str) { return t.formatter(t.fc.brightGreen, str); },
    brightYellow: function (str) { return t.formatter(t.fc.brightYellow, str); },
    brightBlue: function (str) { return t.formatter(t.fc.brightBlue, str); },
    brightMagenta: function (str) { return t.formatter(t.fc.brightMagenta, str); },
    brightCyan: function (str) { return t.formatter(t.fc.brightCyan, str); },
    brightWhite: function (str) { return t.formatter(t.fc.brightWhite, str); },
    customColor: function (codeNumber, str) { const code = isNaN(codeNumber) ? codeNumber : `\x1b[38;5;${codeNumber}m`; return t.formatter(code, str); },

    bgDefaultColor: function (str, fcCode = "") { return t.formatter(t.fc.brightWhite + fcCode, str); },
    bgBlack: function (str, fcCode = "") { return t.formatter(t.bc.black + fcCode, str); },
    bgRed: function (str, fcCode = "") { return t.formatter(t.bc.red + fcCode, str); },
    bgGreen: function (str, fcCode = "") { return t.formatter(t.bc.green + fcCode, str); },
    bgYellow: function (str, fcCode = "") { return t.formatter(t.bc.yellow + fcCode, str); },
    bgBlue: function (str, fcCode = "") { return t.formatter(t.bc.blue + fcCode, str); },
    bgMagenta: function (str, fcCode = "") { return t.formatter(t.bc.magenta + fcCode, str); },
    bgCyan: function (str, fcCode = "") { return t.formatter(t.bc.cyan + fcCode, str); },
    bgWhite: function (str, fcCode = "") { return t.formatter(t.bc.white + fcCode, str); },
    bgBrightBlack: function (str, fcCode = "") { return t.formatter(t.bc.brightBlack + fcCode, str); },
    bgBrightRed: function (str, fcCode = "") { return t.formatter(t.bc.brightRed + fcCode, str); },
    bgBrightGreen: function (str, fcCode = "") { return t.formatter(t.bc.brightGreen + fcCode, str); },
    bgBrightYellow: function (str, fcCode = "") { return t.formatter(t.bc.brightYellow + fcCode, str); },
    bgBrightBlue: function (str, fcCode = "") { return t.formatter(t.bc.brightBlue + fcCode, str); },
    bgBrightMagenta: function (str, fcCode = "") { return t.formatter(t.bc.brightMagenta + fcCode, str); },
    bgBrightCyan: function (str, fcCode = "") { return t.formatter(t.bc.brightCyan + fcCode, str); },
    bgBrightWhite: function (str, fcCode = "") { return t.formatter(t.bc.brightWhite + fcCode, str); },
    customBgColor: function (codeNumber, str, fcCode = "") {
        const code = isNaN(codeNumber) ? codeNumber : `\x1b[48;5;${codeNumber}m`;
        const fCode = isNaN(codeNumber) ? codeNumber : `\x1b[38;5;${codeNumber}m`;
        return t.formatter(code + fCode, str);
    },

    // modifier codes
    mc: {
        resetAll: '\x1b[0m\x1b[39m\x1b[49m',
        clearLineCursorRight: `\x1b[K`,
        clearLine: `\x1b[2K`,
        styleReset: '\x1b[0m',
        bold: '\x1b[1m',
        italic: '\x1b[3m',
        underline: '\x1b[4m',
        inverse: '\x1b[7m',
        strike: '\x1b[9m',
    },

    // Foreground color
    fc: {
        defaultColor: '\x1b[39m',
        black: '\x1b[30m',
        red: '\x1b[31m',
        green: '\x1b[32m',
        yellow: '\x1b[33m',
        blue: '\x1b[34m',
        magenta: '\x1b[35m',
        cyan: '\x1b[36m',
        white: '\x1b[37m',
        brightBlack: '\x1b[90m',
        brightRed: '\x1b[91m',
        brightGreen: '\x1b[92m',
        brightYellow: '\x1b[93m',
        brightBlue: '\x1b[94m',
        brightMagenta: '\x1b[95m',
        brightCyan: '\x1b[96m',
        brightWhite: '\x1b[97m',
        customColor: function (code) { return `\x1b[38;5;${code}m`; },
    },

    // Background color
    bc: {
        defaultColor: '\x1b[49m',
        black: '\x1b[40m',
        red: '\x1b[41m',
        green: '\x1b[42m',
        yellow: '\x1b[43m',
        blue: '\x1b[44m',
        magenta: '\x1b[45m',
        cyan: '\x1b[46m',
        white: '\x1b[47m',
        brightBlack: '\x1b[100m',
        brightRed: '\x1b[101m',
        brightGreen: '\x1b[102m',
        brightYellow: '\x1b[103m',
        brightBlue: '\x1b[104m',
        brightMagenta: '\x1b[105m',
        brightCyan: '\x1b[106m',
        brightWhite: '\x1b[107m',
        customBgColor: function (code) { return `\x1b[48;5;${code}m`; },
    },

    progressBar: [
        "loading   ",
        "loading.  ",
        "loading.. ",
        "loading...",
    ],

    oneCharLoading: [
        `|`,
        `+`,
        `-`,
        `+`,
    ]

};

module.exports.Term = t;
