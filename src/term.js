const Term = {
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
    cursorHide: function () { this.printf(`\x1b[?25l`); return this; },
    cursorShow: function () { this.printf(`\x1b[?25h`); return this; },

    /**
     * print format
     */
    printf: function (str = "") { this.stdout.write(str); return this; },
    /**
     * start new line build
     */
    startLine: function () { const that = this._(); that.formatFormatReset(); that.charCount = 0, that.charList = []; return this; },
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
    flush: function () {
        const that = this._();
        const columns = that.stdout.columns;
        const extra = columns - that.charCount % columns;
        const lines = (extra + that.charCount) / columns;
        const out = [...that.charList, ...' '.repeat(extra)];
        that.printf(out.join(''));
        that.formatFormatReset();
        return lines;
    },

    formatReset: function () { this.styleReset().defaultColor().bgDefaultColor(); return this; },
    styleReset: function () { this.charList.push('\x1b[0m'); return this; },
    bold: function () { this.charList.push('\x1b[1m'); return this; },
    italic: function () { this.charList.push('\x1b[3m'); return this; },
    underline: function () { this.charList.push('\x1b[4m'); return this; },
    strike: function () { this.charList.push('\x1b[9m'); return this; },

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

    // standalone style print
    formatFormatReset: function () { this.formatStyleReset().formatDefaultColor().formatBgDefaultColor(); return this; },
    formatStyleReset: function () { this.printf('\x1b[0m'); return this; },
    formatBold: function () { this.printf('\x1b[1m'); return this; },
    formatItalic: function () { this.printf('\x1b[3m'); return this; },
    formatUnderline: function () { this.printf('\x1b[4m'); return this; },
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

    // Foreground color
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

    progressBar: [
        "loading   ",
        "loading.  ",
        "loading.. ",
        "loading...",

    ]
};

module.exports.Term = Term;
