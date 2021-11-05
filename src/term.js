const Term = {
    screen: { chars: [], count: 0 },
    charList: [],
    charCount: 0,
    stdout: process.stdout,
    _: function () { return this; },
    saveCursor: function () { this.printf(`\x1b7`); return this; },
    restoreCursor: function () { this.printf(`\x1b8`); return this; },
    newScreen: function () { this.printf('\n'.repeat(this.stdout.rows - 1)); return this; },
    newLine: function () { this.printf(' '.repeat(this.stdout.columns)); return this; },
    clear: function () { this.printf(`\x1b[${this.stdout.rows}F\x1b[0J`); return this; },
    home: function () { this.printf(`\x1b[${this.stdout.rows}F`); return this; },
    left: function (lines) { this.printf(`\x1b[${lines}D`); return this; },
    previousLine: function (lines) { this.printf(`\x1b[${lines}F`); return this; },
    eraseDisplayBelow: function () { this.printf(`\x1b[0J`); return this; },
    cursorHide: function () { this.printf(`\x1b[?25l`); return this; },
    cursorShow: function () { this.printf(`\x1b[?25h`); return this; },
    requestCursorLocation: function () {
        return new Promise((res) => {
            process.stdin.once("data", data => {
                const raw = data.split('[')[1].replace('R', '').split(';');
                res({ x: parseInt(raw[1]), y: parseInt(raw[0]) });
            })
            this.printf(`\x1b[6n`);
        });
    },
    /**
     * print format
     */
    printf: function (str = "") { this.stdout.write(str); return this; },
    /**
     * start new screen build
     */
    newScreen: function () {
        const that = this._();
        that.screen.count = 0; that.screen.chars = [];
        that.charCount = 0; that.charList = [];
        that.formatReset();
        return this;
    },
    /**
    * start new line build
    */
    newLine: function () { const that = this._(); that.charCount = 0; that.charList = []; that.formatReset(); return this; },
    /**
     * add characters to temporary new line buffer
     */
    putStr: function (str = "") { const that = this._(); that.charCount += str.length; that.charList = [...that.charList, ...str.split('')]; return that; },
    /**
     * add array characters to temporary new line buffer
     */
    putArr: function (arr = []) {
        const that = this._();
        if (arr && arr.length) {
            that.charCount += arr.filter(c => !c.startsWith('\x1b[')).length;
            that.charList = [...that.charList, ...arr];
        }
        return that;
    },
    /**
    * flush the temporary new line buffer
    */
    flush: function (useEOL = false) {
        const that = this._();
        that.formatReset();
        const columns = that.stdout.columns;
        const extra = columns - that.charCount % columns;
        const chars = extra + that.charCount;
        const out = useEOL ? [...that.charList, '\n'] : [...that.charList, ...' '.repeat(extra)];
        that.screen.count += chars;
        that.screen.chars = [...that.screen.chars, ...out];
        return that;
    },
    /**
    * flush the temporary new screen buffer
    */
    refresh: function () {
        const that = this._();
        that.printf(that.screen.chars.join(''));
        return that;
    },
    /**
     * flush the temporary new line buffer and justify words to right
     */
    flushJustifyToRight: function (indent = 0) {
        const that = this._();
        const width = that.stdout.columns - indent;
        let lastSpace = 0, charCount = 1, out = '';
        for (let index = 0; index < that.charList.length; index++) {
            const c = that.charList[index];
            if (!c.startsWith('\x1b[')) {
                if (c === ' ') lastSpace = index;
                if (charCount && !(charCount % width)) {
                    if (c === ' ') {
                        that.charList[index] = '\n';
                        const line = that.charList.splice(0, index + 1).join('');
                        index = 0; charCount = 0; lastSpace = 0;
                        out = out + ' '.repeat(indent) + line;
                    }
                    else {
                        if (index !== that.charList.length - 1) {
                            that.charList[lastSpace] = '\n';
                            index = 0;
                            charCount = 0;
                            // join and space replace
                            const line = that.charList.splice(0, lastSpace + 1).join('').split(' ');
                            lastSpace = 0;
                            let linePoi = 0, visibleCharCount = 0;
                            line.join('').split('').forEach(c => { if (!c.startsWith('\x1b[') && !c.startsWith('\n')) visibleCharCount++ });
                            const needSpace = width - visibleCharCount - line.length - 1;
                            for (let sPoi = 0; sPoi < needSpace; sPoi++) {
                                line[linePoi] = `${line[linePoi]} `;
                                linePoi = line.length === 1 ? 0 : linePoi === line.length - 2 ? 0 : linePoi + 1;
                            }
                            out = out + ' '.repeat(indent) + line.join(' ');
                        } else {
                            index = 0; charCount = 0;
                            const line = that.charList.splice(0, lastSpace + 1).join('');
                            lastSpace = 0;
                            out = out + ' '.repeat(indent) + line;
                        }
                    }
                } else if (index === that.charList.length - 1) {
                    index = 0; charCount = 0;
                    const line = that.charList.length <= width ? that.charList.splice(0).join('') : lastSpace ? that.charList.splice(0, lastSpace + 1).join('') : that.charList.splice(0).join('');
                    lastSpace = 0;
                    out = out + ' '.repeat(indent) + line;
                }
                charCount++;
            } else if (index === that.charList.length - 1) {
                out = out + ' '.repeat(indent) + that.charList.join('');
            }
        }
        that.printf(out);
        that.formatFormatReset();
        return that;
    },

    formatReset: function () { this.styleReset().defaultColor().bgDefaultColor(); return this; },
    styleReset: function () { this.charList.push(this.mc.styleReset); return this; },
    bold: function () { this.charList.push(this.mc.bold); return this; },
    italic: function () { this.charList.push(this.mc.italic); return this; },
    underline: function () { this.charList.push(this.mc.underline); return this; },
    inverse: function () { this.charList.push(this.mc.inverse); return this; },
    strike: function () { this.charList.push(this.mc.strike); return this; },
    clearLine: function () { this.charList.push(this.mc.clearLine); return this; },

    // colors
    defaultColor: function () { this.charList.push(this.fc.defaultColor); return this; },
    black: function () { this.charList.push(this.fc.black); return this; },
    red: function () { this.charList.push(this.fc.red); return this; },
    green: function () { this.charList.push(this.fc.green); return this; },
    yellow: function () { this.charList.push(this.fc.yellow); return this; },
    blue: function () { this.charList.push(this.fc.blue); return this; },
    magenta: function () { this.charList.push(this.fc.magenta); return this; },
    cyan: function () { this.charList.push(this.fc.cyan); return this; },
    white: function () { this.charList.push(this.fc.white); return this; },
    brightBlack: function () { this.charList.push(this.fc.brightBlack); return this; },
    brightRed: function () { this.charList.push(this.fc.brightRed); return this; },
    brightGreen: function () { this.charList.push(this.fc.brightGreen); return this; },
    brightYellow: function () { this.charList.push(this.fc.brightYellow); return this; },
    brightBlue: function () { this.charList.push(this.fc.brightBlue); return this; },
    brightMagenta: function () { this.charList.push(this.fc.brightMagenta); return this; },
    brightCyan: function () { this.charList.push(this.fc.brightCyan); return this; },
    brightWhite: function () { this.charList.push(this.fc.brightWhite); return this; },
    customColor: function (code) { this.charList.push(`\x1b[38;5;${code}m`); return this; },

    bgDefaultColor: function () { this.charList.push(this.bc.defaultColor); return this; },
    bgBlack: function () { this.charList.push(this.bc.black); return this; },
    bgRed: function () { this.charList.push(this.bc.red); return this; },
    bgGreen: function () { this.charList.push(this.bc.green); return this; },
    bgYellow: function () { this.charList.push(this.bc.yellow); return this; },
    bgBlue: function () { this.charList.push(this.bc.blue); return this; },
    bgMagenta: function () { this.charList.push(this.bc.magenta); return this; },
    bgCyan: function () { this.charList.push(this.bc.cyan); return this; },
    bgWhite: function () { this.charList.push(this.bc.white); return this; },
    bgBrightBlack: function () { this.charList.push(this.bc.brightBlack); return this; },
    bgBrightRed: function () { this.charList.push(this.bc.brightRed); return this; },
    bgBrightGreen: function () { this.charList.push(this.bc.brightGreen); return this; },
    bgBrightYellow: function () { this.charList.push(this.bc.brightYellow); return this; },
    bgBrightBlue: function () { this.charList.push(this.bc.brightBlue); return this; },
    bgBrightMagenta: function () { this.charList.push(this.bc.brightMagenta); return this; },
    bgBrightCyan: function () { this.charList.push(this.bc.brightCyan); return this; },
    bgBrightWhite: function () { this.charList.push(this.bc.brightWhite); return this; },
    customBgColor: function (code) { this.charList.push(`\x1b[48;5;${code}m`); return this; },

    // standalone style print
    formatFormatReset: function () { this.formatStyleReset().formatDefaultColor().formatBgDefaultColor(); return this; },
    formatStyleReset: function () { this.printf('\x1b[0m'); return this; },
    formatBold: function () { this.printf('\x1b[1m'); return this; },
    formatItalic: function () { this.printf('\x1b[3m'); return this; },
    formatUnderline: function () { this.printf('\x1b[4m'); return this; },
    formatInverse: function () { this.printf('\x1b[7m'); return this; },
    formatStrike: function () { this.printf('\x1b[9m'); return this; },

    // Foreground color print
    formatDefaultColor: function () { this.printf(this.fc.defaultColor); return this; },
    formatBlack: function () { this.printf(this.fc.black); return this; },
    formatRed: function () { this.printf(this.fc.red); return this; },
    formatGreen: function () { this.printf(this.fc.green); return this; },
    formatYellow: function () { this.printf(this.fc.yellow); return this; },
    formatBlue: function () { this.printf(this.fc.blue); return this; },
    formatMagenta: function () { this.printf(this.fc.magenta); return this; },
    formatCyan: function () { this.printf(this.fc.cyan); return this; },
    formatWhite: function () { this.printf(this.fc.white); return this; },
    formatBrightBlack: function () { this.printf(this.fc.brightBlack); return this; },
    formatBrightRed: function () { this.printf(this.fc.brightRed); return this; },
    formatBrightGreen: function () { this.printf(this.fc.brightGreen); return this; },
    formatBrightYellow: function () { this.printf(this.fc.brightYellow); return this; },
    formatBrightBlue: function () { this.printf(this.fc.brightBlue); return this; },
    formatBrightMagenta: function () { this.printf(this.fc.brightMagenta); return this; },
    formatBrightCyan: function () { this.printf(this.fc.brightCyan); return this; },
    formatBrightWhite: function () { this.printf(this.fc.brightWhite); return this; },
    formatCustomColor: function (code) { this.printf(`\x1b[38;5;${code}m`); return this; },

    // Background color print
    formatBgDefaultColor: function () { this.printf(this.bc.defaultColor); return this; },
    formatBgBlack: function () { this.printf(this.bc.black); return this; },
    formatBgRed: function () { this.printf(this.bc.red); return this; },
    formatBgGreen: function () { this.printf(this.bc.green); return this; },
    formatBgYellow: function () { this.printf(this.bc.yellow); return this; },
    formatBgBlue: function () { this.printf(this.bc.blue); return this; },
    formatBgMagenta: function () { this.printf(this.bc.magenta); return this; },
    formatBgCyan: function () { this.printf(this.bc.cyan); return this; },
    formatBgWhite: function () { this.printf(this.bc.white); return this; },
    formatBgBrightBlack: function () { this.printf(this.bc.brightBlack); return this; },
    formatBgBrightRed: function () { this.printf(this.bc.brightRed); return this; },
    formatBgBrightGreen: function () { this.printf(this.bc.brightGreen); return this; },
    formatBgBrightYellow: function () { this.printf(this.bc.brightYellow); return this; },
    formatBgBrightBlue: function () { this.printf(this.bc.brightBlue); return this; },
    formatBgBrightMagenta: function () { this.printf(this.bc.brightMagenta); return this; },
    formatBgBrightCyan: function () { this.printf(this.bc.brightCyan); return this; },
    formatBgBrightWhite: function () { this.printf(this.bc.brightWhite); return this; },
    formatCustomBgColor: function (code) { this.printf(`\x1b[48;5;${code}m`); return this; },

    // modifier codes
    mc: {
        clearLine: `\x1b[2K`,
        styleReset: '\x1b[0m',
        bold: '\x1b[1m',
        italic: '\x1b[3m',
        underline: '\x1b[4m',
        inverse: '\x1b[7m',
        strike: '\x1b[9m',
    },

    // Foreground color
    cc: {
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
    ]
};

module.exports.Term = Term;
