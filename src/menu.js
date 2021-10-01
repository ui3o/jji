const os = require('os');
const { keymap, detectKey, getVisibleCharacters } = require("./keymap");
const { Term } = require('./term');

const loading = {
    active: false,
    linePos: 0,
    iconPoi: 0,
    icon: os.platform() === 'win32' ? [
        "┤",
        "┘",
        "┴",
        "└",
        "├",
        "┌",
        "┬",
        "┐"
    ] : [
        "⣾",
        "⣽",
        "⣻",
        "⢿",
        "⡿",
        "⣟",
        "⣯",
        "⣷"
    ]
};

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
    // const variables
    maxVisibleCount: 3,
    prefix: (index, hideCursor) => menu.visible.poi === index && !hideCursor ? [Term.colorGreen, prompt.cursor.sel] : [' '],
    separator: ' - ',
    title: 'Please select:\n\n',
    footerHeight: 1 // space between last prompt and last menu
};

const prompt = {
    inputString: [],
    promptPrefix: '',
    // const variables
    _: () => `${loading.active ? loading.icon[loading.iconPoi] : ' '} ${menu.filtered.menu.length ? menu.filtered.poi + 1 : menu.filtered.poi}|${menu.filtered.menu.length}|${menu.full.menu.length} ${prompt.cursor.in + prompt.promptPrefix}`,
    cursor: { sel: os.platform() === 'win32' ? '>' : '➜', in: "/", promptChar: '_' }
};

const config = {
    disableProcessExitOnSelect: false,
    disableSelectedOutputPrint: false,
    disableProcessExitOnExit: false,
    disableProcessExitOnAbort: false,
};

let printedText = [];

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
    // clear cursor
    Term.saveCursor();
    Term.previousLine(menu.visible.menu[menu.visible.poi].linePos);
    Term.printEsc(' ');
    Term.restoreCursor();
    // set new cursor position
    if (down)
        menu.visible.poi = menu.visible.poi === menu.visible.menu.length - 1 ? 0 : menu.visible.poi + 1;
    else
        menu.visible.poi = menu.visible.poi === 0 ? menu.visible.menu.length - 1 : menu.visible.poi - 1;
    Term.saveCursor();
    Term.previousLine(menu.visible.menu[menu.visible.poi].linePos);
    Term.green().print([prompt.cursor.sel]);
    Term.restoreCursor();
    _printPrompt();
}

const _initCursor = (end) => {
    menu.visible.poi = end ? menu.visible.menu.length - 1 : 0;
    if (!menu.visible.menu.length) return;
    Term.saveCursor();
    Term.previousLine(menu.visible.menu[menu.visible.poi].linePos);
    Term.green().print([prompt.cursor.sel]);
    Term.restoreCursor();
}

const _linesCalc = (_allSize = 0) => {
    const _reversePrintedText = [...printedText].reverse();
    menu.visible.menu.reverse();
    // calculate prompt at 0 pos
    const prompt = _reversePrintedText.shift();
    _allSize = prompt.length % Term.width === 0 ? _allSize + (prompt.length / Term.width) : 1 + (prompt.length / Term.width);
    _allSize = _allSize - (_allSize % 1);
    loading.linePos = _allSize;
    // calculate menu
    _reversePrintedText.forEach((text, index) => {
        _allSize += (text.length / Term.width);
        _allSize += (text.length / Term.width) % 1 === 0 ? 0 : 1;
        _allSize = _allSize - (_allSize % 1);
        menu.visible.menu[index].linePos = _allSize - 1 + menu.footerHeight;
    })
    menu.visible.menu.reverse();
    return _allSize;
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
const setMenu = (_menu = [], promptPrefix = '', title = 'Please select:\n\n') => {
    prompt.inputString = [];
    const formattedMenu = [];
    prompt.promptPrefix = promptPrefix;
    menu.title = title;
    _menu.forEach((m, index) => {
        const fm = {
            title: m[0] !== undefined ? m[0] : '',
            desc: m[1] !== undefined ? m[1] : '',
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
    menu.visible.menu = _menu;
    _menuPrint({ hideCursor: true });
    _initCursor(end);
    _printPrompt();
}

const _removeColorCodes = (str = []) => {
    const splittedStr = [];
    for (let count = 0; count < str.length; count++) {
        if (!str[count].startsWith('\x1b[')) splittedStr.push(str[count]);
    }
    return splittedStr.join('');
}

const _findHighlights = (str = "", searchFor = "", splitted = [], offset = 0) => {
    const index = str.indexOf(searchFor);
    if (index < 0) return;
    // mark highlights
    for (let pos = 0; pos < searchFor.length; pos++)splitted[index + pos + offset].h = true;
    if (index + searchFor.length < str.length)
        _findHighlights(str.substring(index + searchFor.length, str.length), searchFor, splitted, offset + index + searchFor.length);
}

const _highlightFiltered = (str = "", defaultColor = Term.colorDefaultColor) => {
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
        if (char.h && !started) { highlighted.push(Term.colorYellow); started = true; }
        if (!char.h && started) { highlighted.push(defaultColor); started = false; }
        highlighted.push(char.c);
    });
    return highlighted;
}

const _menuPrint = ({ inputChar, add, hideCursor } = {}) => {
    if (add === undefined) {
        Term.clear();
    }
    if (add === undefined) { Term.eraseDisplayBelow(); Term.brightBlue().print(menu.title.split('')); }
    if (add === false) { _removePrompt(); }
    printedText = [];
    menu.visible.menu.forEach((item, index) => {
        const menuLine = item.desc.length ? [...menu.prefix(index, hideCursor), ' ', Term.colorDefaultColor,
        ..._highlightFiltered(item.title),
        Term.colorBrightBlack, ...menu.separator.split(''),
        ..._highlightFiltered(item.desc, Term.colorBrightBlack),
        ] : [...menu.prefix(index, hideCursor), ' ', Term.colorDefaultColor,
        ..._highlightFiltered(item.title),
        ];
        printedText.push(`${_removeColorCodes(menuLine)}`);
        if (add === undefined) Term.print([...menuLine, '\n']);
    });
    if (add === undefined) Term.printEsc('\n'.repeat(menu.footerHeight));
    if (add === true) { prompt.inputString.push(inputChar); Term.backDelete().printEsc(inputChar).printEsc(prompt.cursor.promptChar); }
    if (add === false) prompt.inputString.pop();
    const _in = `${prompt._() + prompt.inputString.join('') + prompt.cursor.promptChar}`;
    printedText.push(_in);
    if (add !== true) Term.print(_in.split(''));
    // recalculation for menu items position 
    if (_in.length % Term.width === 0) { Term.printEsc('\n'); }
    _linesCalc(_in.length % Term.width === 0 ? 1 : 0);
    if (add !== undefined) _setFilteredMenu();
}

const _refreshLoading = (active = true) => {
    loading.active = active;
    loading.iconPoi = 0;
    _printPrompt();
}

const startLoading = () => {
    _refreshLoading();
}

const stopLoading = () => {
    _refreshLoading(false);
}

const _removePrompt = () => {
    Term.previousLine(loading.linePos);
    Term.down(1);
    Term.eraseDisplayBelow();
    Term.eraseLine();
}

const _printPrompt = () => {
    Term.saveCursor();
    Term.previousLine(loading.linePos);
    Term.down(1);
    Term.print(prompt._().split(''));
    Term.restoreCursor();
}

const _reportExit = (eventType = event.EXITED) => {
    if (eventType === event.EXITED) {
        if (!config.disableSelectedOutputPrint) Term.clear();
        if (!config.disableSelectedOutputPrint) Term.print(`[selected] = [none]\n`.split(''));
        _eventListener(eventType);
    } else {
        Term.clear();
        if (!config.disableSelectedOutputPrint) Term.print(`[selected] = [none]\n`.split(''));
    }
}

const _keyHandler = (key) => {
    const keyEvent = detectKey(key);
    switch (keyEvent) {
        case keymap.ENTER:
            if (!config.disableSelectedOutputPrint) Term.clear();
            if (menu.filtered.menu.length) {
                if (!config.disableSelectedOutputPrint) Term.print(`[selected] = ${menu.filtered.menu[menu.filtered.poi].title}\n`.split(''));
                if (!config.disableProcessExitOnSelect) { Term.cursorShow(); process.exit(); }
                _eventListener(event.SELECT, menu.filtered.menu[menu.filtered.poi].index);
            }
            break;
        case keymap.ESCAPE:
            _reportExit(event.EXITED);
            if (!config.disableProcessExitOnExit) { Term.cursorShow(); process.exit(1); }
            break;
        case keymap.CTRL_A:
            startLoading()
            break;
        case keymap.CTRL_S:
            stopLoading()
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
    // Term.width = process.stdout.rows;
    Term.clear();
    Term.width = process.stdout.columns - 1;
    _menuPrint();
}

const _loadingHandler = () => {
    if (loading.active) {
        _printPrompt();
        loading.iconPoi = loading.iconPoi === loading.icon.length - 1 ? 0 : loading.iconPoi + 1;
    }
}

let _eventListener = undefined;

const open = (eventListener = (event, key) => { }) => {
    _eventListener = eventListener;
    Term.width = process.stdout.columns - 1;
    // const { _, y } = await Term.getCursorLocation();
    Term.cursorHide();
    Term.printEsc('\n'.repeat(process.stdout.rows - 1));
    Term.clear();
    process.stdin.on('data', _keyHandler);
    process.stdout.on('resize', _windowResizeHandler);
    setInterval(_loadingHandler, 150);
}

const close = () => {
    Term.cursorShow();
    process.stdin.removeListener('data', _keyHandler);
    process.stdout.removeListener('resize', _windowResizeHandler);
    clearInterval(_loadingHandler, 150);
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
    open, close, startLoading, stopLoading, setMenu, event, configure
}