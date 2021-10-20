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
    styleReset: function () { this.charList.push(this.formatCodeStyleReset); return this; },
    bold: function () { this.charList.push(this.formatCodeBold); return this; },
    italic: function () { this.charList.push(this.formatCodeItalic); return this; },
    underline: function () { this.charList.push(this.formatCodeUnderline); return this; },
    inverse: function () { this.charList.push(this.formatCodeInverse); return this; },
    strike: function () { this.charList.push(this.formatCodeStrike); return this; },
    clearLine: function () { this.charList.push(this.formatCodeClearLine); return this; },

    // colors
    defaultColor: function () { this.charList.push(this.colorCodeDefaultColor); return this; },
    black: function () { this.charList.push(this.colorCodeBlack); return this; },
    red: function () { this.charList.push(this.colorCodeRed); return this; },
    green: function () { this.charList.push(this.colorCodeGreen); return this; },
    yellow: function () { this.charList.push(this.colorCodeYellow); return this; },
    blue: function () { this.charList.push(this.colorCodeBlue); return this; },
    magenta: function () { this.charList.push(this.colorCodeMagenta); return this; },
    cyan: function () { this.charList.push(this.colorCodeCyan); return this; },
    white: function () { this.charList.push(this.colorCodeWhite); return this; },
    brightBlack: function () { this.charList.push(this.colorCodeBrightBlack); return this; },
    brightRed: function () { this.charList.push(this.colorCodeBrightRed); return this; },
    brightGreen: function () { this.charList.push(this.colorCodeBrightGreen); return this; },
    brightYellow: function () { this.charList.push(this.colorCodeBrightYellow); return this; },
    brightBlue: function () { this.charList.push(this.colorCodeBrightBlue); return this; },
    brightMagenta: function () { this.charList.push(this.colorCodeBrightMagenta); return this; },
    brightCyan: function () { this.charList.push(this.colorCodeBrightCyan); return this; },
    brightWhite: function () { this.charList.push(this.colorCodeBrightWhite); return this; },
    customColor: function (code) { this.charList.push(`\x1b[38;5;${code}m`); return this; },

    bgDefaultColor: function () { this.charList.push(this.colorCodeBgDefaultColor); return this; },
    bgBlack: function () { this.charList.push(this.colorCodeBgBlack); return this; },
    bgRed: function () { this.charList.push(this.colorCodeBgRed); return this; },
    bgGreen: function () { this.charList.push(this.colorCodeBgGreen); return this; },
    bgYellow: function () { this.charList.push(this.colorCodeBgYellow); return this; },
    bgBlue: function () { this.charList.push(this.colorCodeBgBlue); return this; },
    bgMagenta: function () { this.charList.push(this.colorCodeBgMagenta); return this; },
    bgCyan: function () { this.charList.push(this.colorCodeBgCyan); return this; },
    bgWhite: function () { this.charList.push(this.colorCodeBgWhite); return this; },
    bgBrightBlack: function () { this.charList.push(this.colorCodeBgBrightBlack); return this; },
    bgBrightRed: function () { this.charList.push(this.colorCodeBgBrightRed); return this; },
    bgBrightGreen: function () { this.charList.push(this.colorCodeBgBrightGreen); return this; },
    bgBrightYellow: function () { this.charList.push(this.colorCodeBgBrightYellow); return this; },
    bgBrightBlue: function () { this.charList.push(this.colorCodeBgBrightBlue); return this; },
    bgBrightMagenta: function () { this.charList.push(this.colorCodeBgBrightMagenta); return this; },
    bgBrightCyan: function () { this.charList.push(this.colorCodeBgBrightCyan); return this; },
    bgBrightWhite: function () { this.charList.push(this.colorCodeBgBrightWhite); return this; },
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
    formatDefaultColor: function () { this.printf(this.colorCodeDefaultColor); return this; },
    formatBlack: function () { this.printf(this.colorCodeBlack); return this; },
    formatRed: function () { this.printf(this.colorCodeRed); return this; },
    formatGreen: function () { this.printf(this.colorCodeGreen); return this; },
    formatYellow: function () { this.printf(this.colorCodeYellow); return this; },
    formatBlue: function () { this.printf(this.colorCodeBlue); return this; },
    formatMagenta: function () { this.printf(this.colorCodeMagenta); return this; },
    formatCyan: function () { this.printf(this.colorCodeCyan); return this; },
    formatWhite: function () { this.printf(this.colorCodeWhite); return this; },
    formatBrightBlack: function () { this.printf(this.colorCodeBrightBlack); return this; },
    formatBrightRed: function () { this.printf(this.colorCodeBrightRed); return this; },
    formatBrightGreen: function () { this.printf(this.colorCodeBrightGreen); return this; },
    formatBrightYellow: function () { this.printf(this.colorCodeBrightYellow); return this; },
    formatBrightBlue: function () { this.printf(this.colorCodeBrightBlue); return this; },
    formatBrightMagenta: function () { this.printf(this.colorCodeBrightMagenta); return this; },
    formatBrightCyan: function () { this.printf(this.colorCodeBrightCyan); return this; },
    formatBrightWhite: function () { this.printf(this.colorCodeBrightWhite); return this; },
    formatCustomColor: function (code) { this.printf(`\x1b[38;5;${code}m`); return this; },

    // Background color print
    formatBgDefaultColor: function () { this.printf(this.colorCodeBgDefaultColor); return this; },
    formatBgBlack: function () { this.printf(this.colorCodeBgBlack); return this; },
    formatBgRed: function () { this.printf(this.colorCodeBgRed); return this; },
    formatBgGreen: function () { this.printf(this.colorCodeBgGreen); return this; },
    formatBgYellow: function () { this.printf(this.colorCodeBgYellow); return this; },
    formatBgBlue: function () { this.printf(this.colorCodeBgBlue); return this; },
    formatBgMagenta: function () { this.printf(this.colorCodeBgMagenta); return this; },
    formatBgCyan: function () { this.printf(this.colorCodeBgCyan); return this; },
    formatBgWhite: function () { this.printf(this.colorCodeBgWhite); return this; },
    formatBgBrightBlack: function () { this.printf(this.colorCodeBgBrightBlack); return this; },
    formatBgBrightRed: function () { this.printf(this.colorCodeBgBrightRed); return this; },
    formatBgBrightGreen: function () { this.printf(this.colorCodeBgBrightGreen); return this; },
    formatBgBrightYellow: function () { this.printf(this.colorCodeBgBrightYellow); return this; },
    formatBgBrightBlue: function () { this.printf(this.colorCodeBgBrightBlue); return this; },
    formatBgBrightMagenta: function () { this.printf(this.colorCodeBgBrightMagenta); return this; },
    formatBgBrightCyan: function () { this.printf(this.colorCodeBgBrightCyan); return this; },
    formatBgBrightWhite: function () { this.printf(this.colorCodeBgBrightWhite); return this; },
    formatCustomBgColor: function (code) { this.printf(`\x1b[48;5;${code}m`); return this; },

    // format codes
    formatCodeClearLine: `\x1b[2K`,
    formatCodeStyleReset: '\x1b[0m',
    formatCodeBold: '\x1b[1m',
    formatCodeItalic: '\x1b[3m',
    formatCodeUnderline: '\x1b[4m',
    formatCodeInverse: '\x1b[7m',
    formatCodeStrike: '\x1b[9m',

    // Foreground color
    colorCodeStyleReset: '\x1b[0m',
    colorCodeBold: '\x1b[1m',
    colorCodeItalic: '\x1b[3m',
    colorCodeUnderline: '\x1b[4m',
    colorCodeInverse: '\x1b[7m',
    colorCodeStrike: '\x1b[9m',

    colorCodeDefaultColor: '\x1b[39m',
    colorCodeBlack: '\x1b[30m',
    colorCodeRed: '\x1b[31m',
    colorCodeGreen: '\x1b[32m',
    colorCodeYellow: '\x1b[33m',
    colorCodeBlue: '\x1b[34m',
    colorCodeMagenta: '\x1b[35m',
    colorCodeCyan: '\x1b[36m',
    colorCodeWhite: '\x1b[37m',
    colorCodeBrightBlack: '\x1b[90m',
    colorCodeBrightRed: '\x1b[91m',
    colorCodeBrightGreen: '\x1b[92m',
    colorCodeBrightYellow: '\x1b[93m',
    colorCodeBrightBlue: '\x1b[94m',
    colorCodeBrightMagenta: '\x1b[95m',
    colorCodeBrightCyan: '\x1b[96m',
    colorCodeBrightWhite: '\x1b[97m',
    colorCodeCustomColor: function (code) { return `\x1b[38;5;${code}m`; },


    // Background color
    colorCodeBgDefaultColor: '\x1b[49m',
    colorCodeBgBlack: '\x1b[40m',
    colorCodeBgRed: '\x1b[41m',
    colorCodeBgGreen: '\x1b[42m',
    colorCodeBgYellow: '\x1b[43m',
    colorCodeBgBlue: '\x1b[44m',
    colorCodeBgMagenta: '\x1b[45m',
    colorCodeBgCyan: '\x1b[46m',
    colorCodeBgWhite: '\x1b[47m',
    colorCodeBgBrightBlack: '\x1b[100m',
    colorCodeBgBrightRed: '\x1b[101m',
    colorCodeBgBrightGreen: '\x1b[102m',
    colorCodeBgBrightYellow: '\x1b[103m',
    colorCodeBgBrightBlue: '\x1b[104m',
    colorCodeBgBrightMagenta: '\x1b[105m',
    colorCodeBgBrightCyan: '\x1b[106m',
    colorCodeBgBrightWhite: '\x1b[107m',
    colorCodeCustomBgColor: function (code) { return `\x1b[48;5;${code}m`; },

    progressBar: [
        "loading   ",
        "loading.  ",
        "loading.. ",
        "loading...",

    ]
};

module.exports.Term = Term;
