const os = require('os');
const { keymap, detectKey, getVisibleCharacters, isCursorPos } = require("./keymap");
const { Term } = require('./term');

const menu = {
    full: {
        menu: [],
    },
    filtered: {
        menu: [],
        poi: 0,
        slice: { start: 0, end: 0 }
    },
    visible: {
        menu: [],
        poi: 0
    },
    readInputMode: { enabled: false, line: [], question: '' },
    loadingPoi: 0,
    loadingHandler: undefined,
    blinkHandler: undefined,
    // const variables
    maxVisibleCount: 5,
    prefix: (index) => menu.visible.poi === index ? ` ${prompt.cursor.sel}  ` : `    `,
    separator: ' - ',
    title: 'Please select:',
    lazyTitle: 'lazy',
    titleHeight: 0, // space between menu and title
    footerHeight: 0 // space between last prompt and last menu
};

const prompt = {
    inputString: [],
    promptPrefix: [],
    // const variables
    _: () => `[${menu.full.menu.length}|${menu.filtered.menu.length}|${menu.filtered.menu.length ? menu.filtered.poi + 1 : menu.filtered.poi}]`,
    cursor: { sel: os.platform() === 'win32' ? '>' : '➜', in: " > ", promptChar: '_' }
};

const config = {
    disableProcessExitOnSelect: false,
    disableSelectedOutputPrint: false,
    disableProcessExitOnExit: false,
    disableProcessExitOnAbort: false,
    mute: false,
};

let printedLinesCount = 0, printedCharsCount = 0;

const _setNewFilteredMenu = ({ start, end, cursorToEnd, update } = {}) => {
    if (start !== undefined) menu.filtered.slice.start = start;
    if (end !== undefined) menu.filtered.slice.end = end;
    if (menu.filtered.slice.end === 0) _setNewMenu(menu.filtered.menu.slice(menu.filtered.slice.start), cursorToEnd, update);
    else _setNewMenu(menu.filtered.menu.slice(menu.filtered.slice.start, menu.filtered.slice.end), cursorToEnd, update);
}

const _moveSelection = down => {
    if (!menu.visible.menu.length) return;
    const fullPoi = menu.filtered.poi;
    if (down) {
        menu.filtered.poi = menu.filtered.poi === menu.filtered.menu.length - 1 ? 0 : menu.filtered.poi + 1;
        if (menu.visible.poi === menu.visible.menu.length - 1) {
            const top = fullPoi - menu.maxVisibleCount + 1;
            const windowStart = top < 0 ? 0 : top + 1;
            if (fullPoi < menu.filtered.menu.length - 1) _setNewFilteredMenu({ start: windowStart, end: windowStart + menu.maxVisibleCount, cursorToEnd: true });
            if (fullPoi === menu.filtered.menu.length - 1) _setNewFilteredMenu({ start: 0, end: menu.maxVisibleCount });
            return;
        }
    }
    else {
        menu.filtered.poi = menu.filtered.poi === 0 ? menu.filtered.menu.length - 1 : menu.filtered.poi - 1;
        if (menu.visible.poi === 0) {
            const windowStart = fullPoi - 1;
            if (fullPoi !== 0) _setNewFilteredMenu({ start: windowStart, end: windowStart + menu.maxVisibleCount });
            if (fullPoi === 0) _setNewFilteredMenu({ start: 0 - menu.maxVisibleCount, end: 0, cursorToEnd: true });
            return;
        }
    }
    // set new cursor position
    if (down)
        menu.visible.poi = menu.visible.poi === menu.visible.menu.length - 1 ? 0 : menu.visible.poi + 1;
    else
        menu.visible.poi = menu.visible.poi === 0 ? menu.visible.menu.length - 1 : menu.visible.poi - 1;
    _menuPrint();
}

/**
 * Example:
 *  setMenu([
 *     ['test1', 'menu for test x item', 0 or 1 or 2],
 *     ['test2', 'menu for test x item'],
 * ]);
 * in the menu the third param means:
 *   * 0 - normal menu
 *   * 1 - loading menu, at the program start the menu start to load
 *   * 2 - lazy menu, every menu enter the menu sub menu reloading
 *   * 3 - readonly - not selectable menu item
 * @param {*} _menu 
 * @param {*} promptPrefix 
 * @param {*} title 
 */
const setMenu = (_menu = [], promptPrefix = [], title = '?') => {
    _stopMenuItemBlinking();
    _stopLoading();
    prompt.inputString = [];
    const formattedMenu = [];
    prompt.promptPrefix = promptPrefix;
    menu.title = title;
    _menu.forEach((m, index) => {
        const fm = {
            title: m[0] !== undefined ? m[0] : '',
            desc: m[1] !== undefined ? m[1] : '',
            loading: m[2] !== undefined && m[2] === 0 ? -1 : m[2] !== undefined && m[2] === 1 ? 0 : -1,
            lazy: m[2] !== undefined && m[2] === 2 ? true : false,
            readonly: m[2] !== undefined && m[2] === 3 ? true : false,
            index,
        };
        formattedMenu.push(fm);
    });
    menu.full.menu = formattedMenu;
    menu.filtered.menu = formattedMenu;
    menu.filtered.poi = 0;
    _setNewFilteredMenu({ start: menu.filtered.poi, end: menu.maxVisibleCount });
}

/**
 * update existing menu status, specially loading remove
 * 
 * Example:
 *  updateMenu ([
 *     ['test1', 'menu for test x item', 0],
 *     ['test2', 'menu for test x item'],
 * ]);
 * @param {*} _menu 
 */
const updateMenu = (_menu = []) => {
    _stopMenuItemBlinking();
    const formattedMenu = [];
    _menu.forEach((m, index) => {
        const fm = {
            title: m[0] !== undefined ? m[0] : '',
            desc: m[1] !== undefined ? m[1] : '',
            loading: m[2] !== undefined && m[2] === 0 ? -1 : m[2] !== undefined && m[2] === 1 ? 0 : -1,
            lazy: m[2] !== undefined && m[2] === 2 ? true : false,
            readonly: m[2] !== undefined && m[2] === 3 ? true : false,
            index,
        };
        formattedMenu.push(fm);
    });
    menu.full.menu = formattedMenu;
    _setFilteredMenu(true);
}

const _setFilteredMenu = (update) => {
    if (prompt.inputString.length) {
        const input = prompt.inputString.join('').toLowerCase().split(' ');
        menu.filtered.menu = [];
        menu.full.menu.forEach(m => {
            let includes = true;
            input.forEach(inp => {
                if (includes && !(m.title.toLowerCase().includes(inp) || m.desc.toLowerCase().includes(inp)))
                    includes = false;
            });
            if (includes) menu.filtered.menu.push(m);
        });
    }
    else menu.filtered.menu = menu.full.menu;
    if (update) _setNewFilteredMenu({ update });
    else {
        menu.filtered.poi = 0;
        _setNewFilteredMenu({ start: menu.filtered.poi, end: menu.maxVisibleCount, update });
    }
}


const _setNewMenu = (_menu, end, update) => {
    if (!update) menu.visible.poi = end ? menu.visible.menu.length - 1 : 0;
    menu.visible.menu = _menu;
    menu.visible.menu.forEach((item) => {
        if (item.loading > -1) item.loading = 0;
    });
    _menuPrint();
}


const _findHighlights = (str = "", searchFor = "", splitted = [], offset = 0) => {
    const index = str.indexOf(searchFor);
    if (index < 0) return;
    // mark highlights
    for (let pos = 0; pos < searchFor.length; pos++)splitted[index + pos + offset].h = true;
    if (index + searchFor.length < str.length)
        _findHighlights(str.substring(index + searchFor.length, str.length), searchFor, splitted, offset + index + searchFor.length);
}

const _highlightFiltered = (str = "", defaultColor = Term.colorCodeDefaultColor, highlightColor = Term.colorCodeYellow) => {
    str = str.toLowerCase();
    const splitted = str.split('').map(c => { return { c, h: false } });
    if (!prompt.inputString.length) return splitted.map(char => { return char.c });
    const input = prompt.inputString.join('').toLowerCase().split(' ');
    input.forEach(inp => {
        if (inp.length && str.includes(inp)) _findHighlights(str, inp, splitted);
    });
    // group highlights
    let started = false;
    const highlighted = [];
    splitted.forEach(char => {
        if (char.h && !started) { highlighted.push(highlightColor); started = true; }
        if (!char.h && started) { highlighted.push(defaultColor); started = false; }
        highlighted.push(char.c);
    });
    return highlighted;
}

const jumpHome = () => {
    if (printedCharsCount) {
        const columns = Term.stdout.columns;
        const extra = printedCharsCount % columns;
        const toAdd = extra ? columns - extra : extra;
        const lines = (toAdd + printedCharsCount) / columns;
        Term.previousLine(lines - 1);
        // if one line length move down one === beginning of the line  
        if (lines === 1) Term.printf('\x1b[1B');
    }
}

// generate new line
const _newLine = (line = 0) => {
    for (let index = 0; index < line; index++)
        Term.newLine();
    return line;
}

const _menuPrint = ({ inputChar, add } = {}) => {
    if (menu.loadingHandler) return;
    if (add !== undefined) {
        _stopMenuItemBlinking();
        if (add === true) { inputChar.split('').forEach(c => { prompt.inputString.push(c) }); };
        if (add === false) prompt.inputString.pop();
        _setFilteredMenu();
    }
    else {
        jumpHome();
        printedLinesCount = printedCharsCount = 0;
        var out = Term.startLine().cyan().putStr(menu.title).formatReset().brightBlack().putStr(prompt.cursor.in).formatReset().putArr(prompt.promptPrefix)
            .formatReset().putStr(prompt.inputString.join('') + prompt.cursor.promptChar).flush();
        printedLinesCount += out.lines; printedCharsCount += out.chars;
        printedLinesCount += _newLine(menu.titleHeight); printedCharsCount += menu.titleHeight * process.stdout.columns;
        menu.visible.menu.forEach((item, index) => {
            Term.startLine().customColor(39).putStr(menu.prefix(index));
            if (menu.visible.poi === index) Term.customColor(81);
            if (item.loading > -1 || item.readonly)
                Term.brightBlack().putArr(_highlightFiltered(item.title, Term.colorCodeBrightBlack, Term.colorCodeCustomColor(180)));
            else
                Term.putArr(_highlightFiltered(item.title, Term.colorCodeCustomColor(39), Term.colorCodeCustomColor(180)));
            Term.formatReset();
            if (item.desc.length) Term.brightBlack().putStr(menu.separator).putArr(_highlightFiltered(item.desc, Term.colorCodeBrightBlack, Term.colorCodeCustomColor(180)));
            if (item.lazy) Term.brightMagenta().putStr(` [${menu.lazyTitle}]`).formatReset();
            if (item.loading > -1) Term.brightCyan().putStr(` [${Term.progressBar[item.loading]}]`).formatReset();
            if (item.loading > -1 && !menu.blinkHandler) _startMenuItemBlinking();
            var out = Term.flush();
            printedLinesCount += out.lines; printedCharsCount += out.chars;
        });
        printedLinesCount += _newLine(menu.footerHeight); printedCharsCount += menu.footerHeight * process.stdout.columns;
        var out = Term.startLine().customColor(136).putStr(prompt._()).flush();
        printedLinesCount += out.lines; printedCharsCount += out.chars;
        // clear last printed lines
        Term.eraseDisplayBelow();
    }
}

const _startMenuItemBlinking = () => {
    menu.blinkHandler = setInterval(() => {
        menu.visible.menu.forEach((item) => {
            if (item.loading > -1) item.loading = item.loading === Term.progressBar.length - 1 ? 0 : item.loading + 1;
        });
        _menuPrint();
    }, 500);
}


const _stopMenuItemBlinking = () => {
    clearInterval(menu.blinkHandler);
    menu.blinkHandler = undefined;
}

const _stopLoading = () => {
    clearInterval(menu.loadingHandler);
    menu.loadingHandler = undefined;
}


const _refreshLoading = () => {
    jumpHome();
    printedLinesCount = printedCharsCount = 0;
    const out = Term.startLine().putStr('This menu item is ').brightCyan().putStr(Term.progressBar[menu.loadingPoi])
        .formatReset().putStr(' you can return back to prev menu[ESC] or quit[CTRL+C].').flush();
    printedLinesCount += out.lines; printedCharsCount += out.chars;
    menu.loadingPoi = menu.loadingPoi === Term.progressBar.length - 1 ? 0 : menu.loadingPoi + 1;
    Term.eraseDisplayBelow();
}

const showLoading = () => {
    _stopLoading();
    _refreshLoading();
    menu.loadingHandler = setInterval(() => {
        _refreshLoading();
    }, 500);
}

const _reportExit = (eventType = event.EXITED) => {
    if (eventType === event.EXITED) {
        if (!config.disableSelectedOutputPrint) { jumpHome(); Term.eraseDisplayBelow(); }
        if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = [none]\n`);
        _eventListener(eventType);
    } else {
        jumpHome(); Term.eraseDisplayBelow();
        if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = [none]\n`);
    }
}

const _keyHandler = (key) => {
    if (isCursorPos(key)) return;
    const keyEvent = detectKey(key);
    switch (keyEvent) {
        case keymap.ENTER:
            if (menu.loadingHandler || menu.readInputMode.enabled || config.mute) break;
            if (!config.disableSelectedOutputPrint) { jumpHome(); Term.eraseDisplayBelow(); }
            if (menu.filtered.menu.length) {
                if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = ${menu.filtered.menu[menu.filtered.poi].title}\n`);
                if (!config.disableProcessExitOnSelect) { Term.cursorShow(); process.exit(); }
                _eventListener(event.SELECT, menu.filtered.menu[menu.filtered.poi].index);
            }
            break;
        case keymap.ESCAPE:
            if (menu.readInputMode.enabled || config.mute) break;
            _reportExit(event.EXITED);
            if (!config.disableProcessExitOnExit) { Term.cursorShow(); process.exit(1); }
            break;
        case keymap.CTRL_C:
            _reportExit(event.ABORTED);
            if (!config.disableProcessExitOnAbort) { Term.cursorShow(); process.exit(1); }
            break;
        case keymap.UP:
            if (menu.loadingHandler || menu.readInputMode.enabled || config.mute) break;
            _moveSelection(false)
            break;
        case keymap.DOWN:
        case keymap.TAB:
            if (menu.loadingHandler || menu.readInputMode.enabled || config.mute) break;
            _moveSelection(true)
            break;
        case keymap.BACKSPACE:
            if (menu.loadingHandler || menu.readInputMode.enabled || config.mute) break;
            _menuPrint({ add: false });
            break;
        default:
            if (menu.loadingHandler || menu.readInputMode.enabled || config.mute) break;
            const visibleKey = getVisibleCharacters(key);
            if (visibleKey) _menuPrint({ add: true, inputChar: key });
            _eventListener(event.KEY, keyEvent);
            break;
    }
}

const _refreshInputReader = () => {
    jumpHome();
    printedLinesCount = printedCharsCount = 0;
    const out = Term.startLine().putStr(menu.readInputMode.question).putStr(menu.readInputMode.line.join('')).putStr(prompt.cursor.promptChar).flush();
    printedLinesCount += out.lines; printedCharsCount += out.chars;
    Term.eraseDisplayBelow();
}

const _inputReadHandler = (key) => {
    if (menu.readInputMode.enabled) {
        const keyEvent = detectKey(key);
        switch (keyEvent) {
            case keymap.ENTER:
                menu.readInputMode.enabled = false;
                _readLineListener(event.LINE, menu.readInputMode.line.join(''));
                break;
            case keymap.BACKSPACE:
                menu.readInputMode.line.pop();
                _refreshInputReader();
                break;
            default:
                const visibleKey = getVisibleCharacters(key);
                if (visibleKey) {
                    visibleKey.split('').forEach(k => {
                        menu.readInputMode.line.push(k);
                    })
                    _refreshInputReader();
                }
                break;
        }
    }
}

const _windowResizeHandler = () => {
    if (config.mute) return;
    Term.cursorHide();
    _menuPrint();
}

let _eventListener = undefined;
let _readLineListener = undefined;

const readLine = async (eventListener = (event, key) => { }, question = '') => {
    _readLineListener = eventListener;
    printedLinesCount = printedCharsCount = 0;
    menu.readInputMode.line = [];
    menu.readInputMode.question = question;
    menu.readInputMode.enabled = true;
    _refreshInputReader();
}

const open = async (eventListener = (event, key) => { }) => {
    // init stdin
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    _eventListener = eventListener;
    Term.cursorHide();
    process.stdin.on('data', _inputReadHandler);
    process.stdin.on('data', _keyHandler);
    process.stdout.on('resize', _windowResizeHandler);
}

const close = () => {
    Term.cursorShow();
    process.stdin.removeListener('data', _inputReadHandler);
    process.stdin.removeListener('data', _keyHandler);
    process.stdout.removeListener('resize', _windowResizeHandler);
}

const mute = () => {
    printedLinesCount = printedCharsCount = 0;
    Term.cursorShow();
    config.mute = true;
}

const unmute = () => {
    Term.cursorHide();
    config.mute = false;
    printedLinesCount = printedCharsCount = 0;
}

const configure = {
    disableProcessExitOnSelect: () => {
        config.disableProcessExitOnSelect = true;
        return configure;
    },
    disableSelectedPrint: () => {
        config.disableSelectedOutputPrint = true;
        return configure;
    },
    disableProcessExitOnAbort: () => {
        config.disableProcessExitOnAbort = true;
        return configure;
    },
    disableProcessExitOnExit: () => {
        config.disableProcessExitOnExit = true;
        return configure;
    }
};

const event = {
    LINE: 'LINE', // one string followed
    KEY: 'KEY', // one keymap event followed
    SELECT: 'SELECT', // one poi number followed 
    ABORTED: 'ABORTED', // no param - on CTRL-C  
    EXITED: 'EXITED', // no param - on ESCAPE
};

module.exports = {
    open, close, showLoading, setMenu, updateMenu, event, configure, jumpHome, mute, unmute, readLine
}