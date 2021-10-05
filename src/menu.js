const os = require('os');
const { keymap, detectKey, getVisibleCharacters } = require("./keymap");
const { Term } = require('./term');

const menu = {
    full: {
        menu: [],
    },
    filtered: {
        menu: [],
        poi: 0
    },
    visible: {
        menu: [],
        poi: 0
    },
    loadingPoi: 0,
    loadingHandler: undefined,
    blinkHandler: undefined,
    // const variables
    maxVisibleCount: 3,
    prefix: (index) => menu.visible.poi === index ? prompt.cursor.sel : ' ',
    separator: ' - ',
    title: 'Please select:',
    titleHeight: 0, // space between menu and title
    footerHeight: 0 // space between last prompt and last menu
};

const prompt = {
    inputString: [],
    promptPrefix: [],
    // const variables
    _: () => `${menu.full.menu.length}|${menu.filtered.menu.length}|${menu.filtered.menu.length ? menu.filtered.poi + 1 : menu.filtered.poi}`,
    cursor: { sel: os.platform() === 'win32' ? '>' : '➜', in: " > ", promptChar: '_' }
};

const config = {
    disableProcessExitOnSelect: false,
    disableSelectedOutputPrint: false,
    disableProcessExitOnExit: false,
    disableProcessExitOnAbort: false,
};

let printedLines = [];

const _moveSelection = down => {
    if (!menu.visible.menu.length) return;
    const fullPoi = menu.filtered.poi;
    if (down) {
        menu.filtered.poi = menu.filtered.poi === menu.filtered.menu.length - 1 ? 0 : menu.filtered.poi + 1;
        if (menu.visible.poi === menu.visible.menu.length - 1) {
            const top = fullPoi - menu.maxVisibleCount + 1;
            const windowStart = top < 0 ? 0 : top + 1;
            if (fullPoi < menu.filtered.menu.length - 1) _setNewMenu(menu.filtered.menu.slice(windowStart, windowStart + menu.maxVisibleCount), true);
            if (fullPoi === menu.filtered.menu.length - 1) _setNewMenu(menu.filtered.menu.slice(0, menu.maxVisibleCount));
            return;
        }
    }
    else {
        menu.filtered.poi = menu.filtered.poi === 0 ? menu.filtered.menu.length - 1 : menu.filtered.poi - 1;
        if (menu.visible.poi === 0) {
            const windowStart = fullPoi - 1;
            if (fullPoi !== 0) _setNewMenu(menu.filtered.menu.slice(windowStart, windowStart + menu.maxVisibleCount));
            if (fullPoi === 0) _setNewMenu(menu.filtered.menu.slice(0 - menu.maxVisibleCount), true);
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
 *     ['test1', 'menu for test x item'],
 *     ['test2', 'menu for test x item'],
 * ]);
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
            loading: m[2] !== undefined && m[2] === true ? 0 : -1,
            index,
        };
        formattedMenu.push(fm);
    });
    menu.full.menu = formattedMenu;
    menu.filtered.menu = formattedMenu;
    menu.filtered.poi = 0;
    _setNewMenu(menu.filtered.menu.slice(menu.filtered.poi, menu.maxVisibleCount));
}

const _setFilteredMenu = () => {
    if (prompt.inputString.length) {
        const input = prompt.inputString.join('').split(' ');
        menu.filtered.menu = [];
        menu.full.menu.forEach(m => {
            let includes = true;
            input.forEach(inp => {
                if (includes && !(m.title.includes(inp) || m.desc.includes(inp)))
                    includes = false;
            });
            if (includes) menu.filtered.menu.push(m);
        });
    }
    else menu.filtered.menu = menu.full.menu;
    menu.filtered.poi = 0;
    _setNewMenu(menu.filtered.menu.slice(menu.filtered.poi, menu.maxVisibleCount));
}


const _setNewMenu = (_menu, end) => {
    menu.visible.poi = end ? menu.visible.menu.length - 1 : 0;
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

const _highlightFiltered = (str = "", defaultColor = Term.colorCodeDefaultColor) => {
    const splitted = str.split('').map(c => { return { c, h: false } });
    if (!prompt.inputString.length) return splitted.map(char => { return char.c });
    const input = prompt.inputString.join('').split(' ');
    input.forEach(inp => {
        if (inp.length && str.includes(inp)) _findHighlights(str, inp, splitted);
    });
    // group highlights
    let started = false;
    const highlighted = [];
    splitted.forEach(char => {
        if (char.h && !started) { highlighted.push(Term.colorCodeYellow); started = true; }
        if (!char.h && started) { highlighted.push(defaultColor); started = false; }
        highlighted.push(char.c);
    });
    return highlighted;
}

// generate new line
const _newLine = (line = 0) => {
    for (let index = 0; index < line; index++)
        Term.newLine();
    return line;
}

const _clearLasts = (lastPrintedLines = 0) => {
    // clear last printed lines
    const lineDiff = lastPrintedLines - printedLines;
    if (lineDiff > 0) _newLine(lineDiff);
}

const _menuPrint = ({ inputChar, add } = {}) => {
    if (menu.loadingHandler) return;
    if (add !== undefined) {
        _stopMenuItemBlinking();
        if (add === true) prompt.inputString.push(inputChar);
        if (add === false) prompt.inputString.pop();
        _setFilteredMenu();
    }
    else {
        const lastPrintedLines = printedLines;
        printedLines = 0;
        Term.home();
        printedLines += Term.startLine().brightBlue().putStr(menu.title + prompt.cursor.in).formatReset().putArr(prompt.promptPrefix)
            .formatReset().putStr(prompt.inputString.join('') + prompt.cursor.promptChar).flush();
        printedLines += _newLine(menu.titleHeight);
        menu.visible.menu.forEach((item, index) => {
            if (item.loading > -1)
                Term.startLine().green().putStr(menu.prefix(index)).defaultColor().brightBlack().putStr(' ').putArr(_highlightFiltered(item.title, Term.colorCodeBrightBlack));
            else
                Term.startLine().green().putStr(menu.prefix(index)).defaultColor().putStr(' ').putArr(_highlightFiltered(item.title));
            if (item.desc.length) Term.brightBlack().putStr(menu.separator).putArr(_highlightFiltered(item.desc, Term.colorCodeBrightBlack));
            if (item.loading > -1) Term.formatReset().brightCyan().putStr(` [${Term.progressBar[item.loading]}]`).formatReset();
            if (item.loading > -1 && !menu.blinkHandler) _startMenuItemBlinking();
            printedLines += Term.flush();
        });
        printedLines += _newLine(menu.footerHeight);
        printedLines += Term.startLine().brightBlack().putStr(prompt._()).flush();
        // clear last printed lines
        _clearLasts(lastPrintedLines);
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
    const lastPrintedLines = printedLines;
    printedLines = 0;
    Term.home();
    printedLines += Term.startLine().putStr('This menu item is ').brightCyan().putStr(Term.progressBar[menu.loadingPoi])
        .formatReset().putStr(' you can return back to prev menu[ESC] or quit[CTRL+C].').flush();
    menu.loadingPoi = menu.loadingPoi === Term.progressBar.length - 1 ? 0 : menu.loadingPoi + 1;
    _clearLasts(lastPrintedLines)
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
        if (!config.disableSelectedOutputPrint) Term.clear();
        if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = [none]\n`);
        _eventListener(eventType);
    } else {
        Term.clear();
        if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = [none]\n`);
    }
}

const _keyHandler = (key) => {
    const keyEvent = detectKey(key);
    switch (keyEvent) {
        case keymap.ENTER:
            if (!config.disableSelectedOutputPrint) Term.clear();
            if (menu.filtered.menu.length) {
                if (!config.disableSelectedOutputPrint) Term.printf(`[selected] = ${menu.filtered.menu[menu.filtered.poi].title}\n`);
                if (!config.disableProcessExitOnSelect) { Term.cursorShow(); process.exit(); }
                _eventListener(event.SELECT, menu.filtered.menu[menu.filtered.poi].index);
            }
            break;
        case keymap.ESCAPE:
            _reportExit(event.EXITED);
            if (!config.disableProcessExitOnExit) { Term.cursorShow(); process.exit(1); }
            break;
        case keymap.CTRL_C:
            _reportExit(event.ABORTED);
            if (!config.disableProcessExitOnAbort) { Term.cursorShow(); process.exit(1); }
            break;
        case keymap.UP:
            _moveSelection(false)
            break;
        case keymap.DOWN:
        case keymap.TAB:
            _moveSelection(true)
            break;
        case keymap.BACKSPACE:
            _menuPrint({ add: false });
            break;
        default:
            const visibleKey = getVisibleCharacters(key);
            if (visibleKey) _menuPrint({ add: true, inputChar: key });
            _eventListener(event.KEY, keyEvent);
            break;
    }
}

const _windowResizeHandler = () => {
    Term.clear();
    _menuPrint();
}

let _eventListener = undefined;

const open = (eventListener = (event, key) => { }) => {
    _eventListener = eventListener;
    Term.cursorHide().newScreen().clear();
    process.stdin.on('data', _keyHandler);
    process.stdout.on('resize', _windowResizeHandler);
}

const close = () => {
    Term.cursorShow();
    process.stdin.removeListener('data', _keyHandler);
    process.stdout.removeListener('resize', _windowResizeHandler);
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
    },
};

// init stdin
process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.setEncoding('utf8');

const event = {
    KEY: 'KEY', // one keymap event followed
    SELECT: 'SELECT', // one poi number followed 
    ABORTED: 'ABORTED', // no param - on CTRL-C  
    EXITED: 'EXITED', // no param - on ESCAPE
};

module.exports = {
    open, close, showLoading, setMenu, event, configure
}