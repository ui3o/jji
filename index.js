const { existsSync } = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os')
const readline = require('readline');

const menu = require('./src/menu');
const { Term } = require('./src/term');
const { fromDir } = require('./src/file.finder');

const isWin = process.platform === "win32";
const exitError = msg => { console.error(`\n[ERROR] ${msg}`) };

/**
 * spawn a command
 * 
 * @param {*} script script to execute
 * @returns 
 */
function _(...args) {
    const out = Array.isArray(args[0]) ? [] : args;
    if (Array.isArray(args[0])) {
        args[0].forEach((element, index) => {
            if (index > 0)
                out.push(args[index]);
            out.push(element);
        });
    }
    const script = out.join('');
    const cmd = isWin ? spawn('cmd.exe', ['/c', 'bash', '-c', script], { stdio: 'inherit' }) :
        spawn('bash', ['-c', script], { stdio: 'inherit' });
    return new Promise((resolve) => {
        cmd.on('close', (code) => resolve(code));
    });
}
/**
 * spawn a command, but get all data with line separated
 * 
 * @param {*} script script to execute
 * @returns 
 */
function __(...args) {
    let options = {};
    const out = Array.isArray(args[0]) ? [] : args.filter(o => {
        if (o && typeof o === 'object' && (o.__splitAll || o.__splitByLine)) { options = { ...options, ...o }; return false; }
        else return true;
    });
    if (Array.isArray(args[0])) {
        args[0].forEach((element, index) => {
            if (index > 0)
                out.push(args[index]);
            out.push(element);
        });
    }
    const script = out.join('');
    const lines = [];
    const cmd = isWin ? spawn('cmd.exe', ['/c', 'bash', '-c', script], { encoding: 'utf-8' }) :
        spawn('bash', ['-c', script], { encoding: 'utf-8' });
    return new Promise(res => {
        let _out = '';
        cmd.stdout.on('data', data => {
            _out += data;
        });
        cmd.on('close', (code) => {
            if (options.__splitAll || options.__splitByLine) {
                const _lines = _out.split(os.EOL).filter(l => l);
                if (options.__splitByLine) res(_lines);
                else {
                    _lines.forEach(l => lines.push(l.split(/[ \t]/)));
                    res(lines);
                }
            }
            else
                res(_out);
        });
    });
}

/**
 * spawn a command, but get all data with line separated, and possible to send to stdin (like password)
 * TODO: Fix and test
 * @param {*} script script to execute
 * @returns 
 */
async function ___(script, onData = (data) => { }) {
    const lines = [];
    const cmd = isWin ? spawn('cmd.exe', ['/c', 'bash', '-c', script]) : spawn('bash', ['-c', script]);
    const rl = readline.createInterface({ input: cmd.stdout });
    rl.on('line', line => { lines.push(line.split(/[ \t]/)); });
    return new Promise((resolve) => {
        cmd.on('close', (code) => { resolve(lines) });
    });
}

// init globals
global._ = _;
global.__ = __;

global.$ = function (prom = (res, rej) => { }, options = {}) {
    Object.keys(options).forEach(k => {
        prom[k] = options[k];
        if (k === '__showLoadingAfter') {
            exitError(`__showLoadingAfter only works with $$ (lazy load) menu item !`); menu.close(); process.exit(2);
        }
    });
    return { __menu_entry__: new Promise(prom) };
}

global.$$ = function (prom = (res, rej) => { }, options = {}) {
    Object.keys(options).forEach(k => { prom[k] = options[k] })
    return { __onload_menu__: prom };
}
/**
 * Add options to a single function
 * @param {*} func 
 * @param {*} options 
 * @returns 
 */
global.$$$ = function (func = () => { }, options = {}) {
    Object.keys(options).forEach(k => {
        func[k] = options[k];
        if (k === '__showLoadingAfter') {
            exitError(`__showLoadingAfter only works with $$ (lazy load) menu item !`); menu.close(); process.exit(2);
        }
    });
    return func;
}

global.jj = { term: Term, prop: { stayInMenu: false, jumpHome: false } };
global.jj.stay = function () {
    global.jj.prop.stayInMenu = true;
}

global.jj.home = function () {
    global.jj.prop.jumpHome = true;
}

global.jj.rl = function (question = '') {
    return new Promise(res => {
        menu.readLine((_event, line) => {
            res(line);
        }, question);
    });
}

module.exports.jji = async (argv = {}, rawMenu = {}) => {

    const MENU_SEPARATOR = '<<>>';
    const error = msg => { if (argv.x) console.error(`[ERROR] ${msg}`) };
    if (argv.x) console.log = console.error;

    let jjFiles = argv._ && argv._.length ? argv._ : [];
    let transformedMenu = {};
    let showLoadingTimer = 0;

    if (!jjFiles.length) {
        const lookupPath = argv.d ? argv.d : process.cwd();
        const _jjFile = `${lookupPath}/jj.js`;
        if (existsSync(_jjFile)) jjFiles.push(path.resolve(_jjFile));

        const _jjFilesWithEnd = fromDir('.jj.js', lookupPath);
        if (_jjFilesWithEnd) jjFiles = [...jjFiles, ..._jjFilesWithEnd.sort((a, b) => {
            const _a = parseInt(a.replace('.jj.js', '').split('.').slice(-1).pop());
            const _b = parseInt(b.replace('.jj.js', '').split('.').slice(-1).pop());
            if (_a > _b) return 1;
            if (_a < _b) return -1;
            return 0;
        })];
    }
    jjFiles.forEach(f => {
        rawMenu = { ...rawMenu, ...require(f) };
    });

    let menuPath = [];
    let menuCmd = [];
    let currentMenuRef = {};
    let currentMenuList = {};

    function menuWalker(update) {
        clearTimeout(showLoadingTimer);
        currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        currentMenuList = Object.keys(currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__')
            .sort((a, b) => {
                if (currentMenuRef[a].__index__ > currentMenuRef[b].__index__) return 1;
                if (currentMenuRef[a].__index__ < currentMenuRef[b].__index__) return -1;
                return 0;
            }).map(
                e => { return [currentMenuRef[e].__name__, currentMenuRef[e].__desc__, currentMenuRef[e].__menu_entry__ ? 1 : currentMenuRef[e].__onload_menu__ ? 2 : currentMenuRef[e].__cmd__ === null ? 3 : 0] });
        let mp = []; menuPath.forEach(p => { mp = [...mp, Term.colorCodeBold, Term.colorCodeBrightWhite, ...p.split(''), Term.colorCodeStyleReset, Term.colorCodeBrightBlack, ' ', '>', ' '] })
        if (update) menu.updateMenu(currentMenuList);
        else menu.setMenu(currentMenuList, mp);
    }

    function showLoading(timeout = 100) {
        showLoadingTimer = setTimeout(() => {
            menu.showLoading();
        }, timeout);
    }

    menu.configure.disableProcessExitOnSelect().disableSelectedPrint().disableProcessExitOnExit();
    await menu.open(async (event, arg) => {
        switch (event) {
            case menu.event.SELECT:
                const pos = arg;
                const _name = currentMenuList[pos][0];
                menuPath.push(_name);
                menuCmd.push(currentMenuRef[_name].__cmd__);
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__cmd__ === null) {
                    menuPath.pop();
                    menuCmd.pop();
                } else if (hasSubMenu()) {
                    menuWalker();
                } else if (_currentMenuRef.__menu_entry__ !== undefined) {
                    menu.showLoading();
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    _currentMenuRef.__menu_entry__.then((_menu) => {
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else if (_currentMenuRef.__onload_menu__ !== undefined) {
                    const __showLoadingTimeout = _currentMenuRef.__onload_menu__.__showLoadingAfter ? _currentMenuRef.__onload_menu__.__showLoadingAfter : 100;
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__onload_menu__).then((_menu) => {
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__cmd__ ? [_currentMenuRef.__cmd__] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    menu.jumpHome(); Term.eraseDisplayBelow();
                    if (typeof menuCmd[menuCmd.length - 1] !== 'function' || (typeof menuCmd[menuCmd.length - 1] === 'function' && !menuCmd[menuCmd.length - 1].__noPrintOnSelect)) {
                        if (typeof menuCmd[menuCmd.length - 1] === 'function' && !menuCmd[menuCmd.length - 1].__header) {
                            Term.printf(`..::`).formatBold().formatBrightWhite().printf(` ${menuPath.join(`${Term.colorCodeStyleReset + Term.colorCodeBrightBlack} > ${Term.colorCodeBold + Term.colorCodeBrightWhite}`)}`).formatFormatReset();
                            Term.printf(` ::..\n`);
                        } else {
                            Term.printf(menuCmd[menuCmd.length - 1].__header());
                        }
                    }
                    const __needInput = typeof menuCmd[menuCmd.length - 1] === 'function' && menuCmd[menuCmd.length - 1].__needInput ? menuCmd[menuCmd.length - 1].__needInput : false;
                    menu.mute(__needInput);
                    if (typeof menuCmd[menuCmd.length - 1] === 'function') await menuCmd[menuCmd.length - 1]();
                    else await _(menuCmd.join(' '));
                    if (typeof menuCmd[menuCmd.length - 1] === 'function' && menuCmd[menuCmd.length - 1].__footer)
                        Term.printf(menuCmd[menuCmd.length - 1].__footer());
                    menu.unmute();
                    exit(0);
                }
                break;
            case menu.event.EXITED:
                if (!menuPath.length) {
                    menu.jumpHome(); Term.eraseDisplayBelow();
                    exit(1);
                }
                const __currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                // remove menu item from __onload_menu__
                if (__currentMenuRef.__onload_menu__ !== undefined) {
                    const _currentMenuList = Object.keys(__currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__');
                    _currentMenuList.forEach(m => {
                        delete __currentMenuRef[m];
                    });
                }
                menuPath.pop();
                menuCmd.pop();
                menuWalker();
                break;
            default:
                break;
        }
    });
    transform(rawMenu, transformedMenu);
    menuWalker();

    function exit(code) {
        if (code === 0) {
            if (global.jj.prop.stayInMenu) {
                global.jj.prop.stayInMenu = false;
                if (menuPath.length) { menuPath.pop(); menuCmd.pop(); }
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__onload_menu__ !== undefined) {
                    const _items = Object.keys(currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__');
                    _items.forEach(k => delete _currentMenuRef[k]);
                    const __showLoadingTimeout = _currentMenuRef.__onload_menu__.__showLoadingAfter ? _currentMenuRef.__onload_menu__.__showLoadingAfter : 100;
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__onload_menu__).then((_menu) => {
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__cmd__ ? [_currentMenuRef.__cmd__] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    if (hasSubMenu()) menuWalker(true);
                }
                return;
            } else if (global.jj.prop.jumpHome) {
                global.jj.prop.jumpHome = false;
                menuPath = []; menuCmd = [];
                menuWalker();
                return;
            }
        }
        menu.close();
        process.exit(code);
    }

    function hasSubMenu() {
        const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        currentMenuList = Object.keys(_currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__');
        return currentMenuList.length ? true : false;
    }

    function typeTransform(entry, path) {
        if (typeof entry === 'function' && entry.length) {
            exitError(`Wrong format on ".${path}"! Use function without parameters !`);
            exit(2);
        }
        if (typeof entry === 'function' || typeof entry === 'string') {
            return entry;
        } else if (typeof entry === 'object' && entry.then !== undefined) {
            exitError(`Wrong format on ".${path}"! Do not use Promise! Use async function!`);
            exit(2);
        }
        return undefined;
    }

    function getPath(obj, path = '') {
        if (path.length) {
            path = path.split(MENU_SEPARATOR);
            for (var i = 0; i < path.length; i++) {
                obj = obj[path[i]];
            }
        }
        return obj;
    };

    function transform(src, dest, path = '', cmdList = []) {
        Object.keys(src).forEach((key, index) => {
            const _path = path.length ? `${path + MENU_SEPARATOR + key}` : key;
            const transformedObj = getPath(dest, path);
            let _cmdList = [...cmdList];
            transformedObj[key] = {};
            transformedObj[key].__name__ = key;
            transformedObj[key].__index__ = index;
            if (typeof src[key] === 'object' && Array.isArray(src[key])) {
                const _entry = src[key];
                if (_entry.length === 1) {
                    exitError(`Wrong format on ".${_path}"! Use equals and not use one array with one element!`);
                    exit(2);
                } else if (_entry.length === 2) {
                    transformedObj[key].__desc__ = _entry[0];
                    if (!delayedTransform(_entry[1], transformedObj[key], _cmdList)) {
                        if (typeof _entry[1] === 'object' && _entry[1] !== null) transform(_entry[1], dest, _path, _cmdList);
                        else {
                            if (_entry[1] === null) transformedObj[key].__cmd__ = null;
                            else transformedObj[key].__cmd__ = typeTransform(_entry[1], _path);
                            _cmdList = [..._cmdList, transformedObj[key].__cmd__];
                        }
                    }
                } else if (_entry.length === 3) {
                    transformedObj[key].__desc__ = _entry[0];
                    transformedObj[key].__cmd__ = typeTransform(_entry[1], _path);
                    _cmdList = [..._cmdList, transformedObj[key].__cmd__];
                    if (!delayedTransform(_entry[2], transformedObj[key], _cmdList)) transform(_entry[2], dest, _path, _cmdList);
                    else {
                        exitError(`Wrong format on ".${_path}"! The third (3) item has to be an object!`);
                        exit(2);
                    }
                } else if (_entry.length > 3) {
                    exitError(`Wrong format on ".${_path}"! Too big array maximum 3 item is allowed!`);
                    exit(2);
                }
            } else if (typeof src[key] === 'object' && src[key] === null) {
                transformedObj[key].__cmd__ = null;
                _cmdList = [..._cmdList, transformedObj[key].__cmd__];
            } else if (typeof src[key] === 'string' || typeof src[key] === 'function') {
                transformedObj[key].__cmd__ = src[key];
                _cmdList = [..._cmdList, transformedObj[key].__cmd__];
            } else if (typeof src[key] === 'object' && !delayedTransform(src[key], transformedObj[key], _cmdList)) {
                transform(src[key], dest, _path, [..._cmdList]);
            }
            // check cmd equals
            const allCmd = _cmdList.map(c => { return typeof c !== 'string' });
            if (!allCmd.every(c => c === false) && !allCmd.every(c => c === true) && _cmdList[_cmdList.length - 1] !== null) {
                exitError(`Wrong format on ".${_path}"! On the path not all cmd is same type! Use just string or just function!`);
                exit(2);
            }
        });
    }

    function delayedTransform(src, transformedObj, _cmdList = []) {
        if (typeof src === 'object' && src && src.__menu_entry__ !== undefined) {
            transformedObj.__desc__ = src.__desc__ ? src.__desc__ : transformedObj.__desc__ ? transformedObj.__desc__ : '';
            transformedObj.__menu_entry__ = src.__menu_entry__;
            transformedObj.__cmd__ = src.__cmd__ ? src.__cmd__ : '';
            _cmdList.push(transformedObj.__cmd__);
            const _currentMenuRef = transformedObj;
            _currentMenuRef.__menu_entry__.then((_menu) => {
                delete _currentMenuRef.__menu_entry__;
                transform(_menu, _currentMenuRef, '', _currentMenuRef.__cmd__ ? [_currentMenuRef.__cmd__] : []);
                if (hasSubMenu()) menuWalker(true);
            });
            return true;
        } else if (typeof src === 'object' && src && src.__onload_menu__ !== undefined) {
            transformedObj.__desc__ = src.__desc__ ? src.__desc__ : transformedObj.__desc__ ? transformedObj.__desc__ : '';
            transformedObj.__onload_menu__ = src.__onload_menu__;
            transformedObj.__cmd__ = src.__cmd__ ? src.__cmd__ : '';
            _cmdList.push(transformedObj.__cmd__);
            return true;
        }
        return false;
    }

}
