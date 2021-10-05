const { existsSync } = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
var os = require('os')

const menu = require('./menu');
const { Term } = require('./term');
const { fromDir } = require('./file.finder');

const isWin = process.platform === "win32";

/**
 * spawnSync a command
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
    if (isWin) spawnSync('cmd.exe', ['/c', 'bash', '-c', script], { stdio: 'inherit' });
    else spawnSync('bash', ['-c', script], { stdio: 'inherit' });
}
/**
 * spawnSync a command, but get all data with line separated
 * 
 * @param {*} script script to execute
 * @returns 
 */
function __(...args) {
    const out = Array.isArray(args[0]) ? [] : args;
    if (Array.isArray(args[0])) {
        args[0].forEach((element, index) => {
            if (index > 0)
                out.push(args[index]);
            out.push(element);
        });
    }
    const script = out.join('');
    const lines = [];
    const cmd = isWin ? spawnSync('cmd.exe', ['/c', 'bash', '-c', script], { encoding: 'utf-8' }) :
        spawnSync('bash', ['-c', script], { encoding: 'utf-8' });
    const _lines = cmd.stdout.split(os.EOL).filter(l => l);
    _lines.forEach(l => lines.push(l.split(/[ \t]/)));
    return lines;
}

/**
 * spawnSync a command, but get all data with line separated, and possible to send to stdin (like password)
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

module.exports.jji = async (argv = {}, rawMenu = {}) => {

    console.log = console.error;
    log = (argv.d || argv.debug) ? console.log : () => { };
    error = msg => { console.error(`[ERROR] ${msg}`) };

    let jjFiles = argv._.length ? argv._ : [];
    let transformedMenu = {};
    initGlobals();
    if (!jjFiles.length) {
        const _jjFile = `${process.cwd()}/jj.js`;
        if (existsSync(_jjFile)) jjFiles.push(path.resolve(_jjFile));

        const _jjFilesWithEnd = fromDir('.jj.js');
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
    transform(rawMenu, transformedMenu);

    let menuPath = [];
    let menuCmd = [];
    let currentMenuRef = {};
    let currentMenuList = {};

    function menuWalker(update) {
        currentMenuRef = getPath(transformedMenu, menuPath.join('.'));
        currentMenuList = Object.keys(currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__')
            .sort((a, b) => {
                if (currentMenuRef[a].__index__ > currentMenuRef[b].__index__) return 1;
                if (currentMenuRef[a].__index__ < currentMenuRef[b].__index__) return -1;
                return 0;
            }).map(e => { return [currentMenuRef[e].__name__, currentMenuRef[e].__desc__, currentMenuRef[e].__menu_entry__ ? 1 : currentMenuRef[e].__onload_menu__ ? 2 : 0] });
        let mp = []; menuPath.forEach(p => { mp = [...mp, Term.colorCodeGreen, ...p.split(''), Term.colorCodeBrightBlack, ' ', '>', ' '] })
        if (update) menu.updateMenu(currentMenuList);
        else menu.setMenu(currentMenuList, mp);
    }

    menu.configure.disableProcessExitOnSelect().disableSelectedPrint().disableProcessExitOnExit();
    menu.open(async (event, arg) => {
        switch (event) {
            case menu.event.SELECT:
                const pos = arg;
                const _name = currentMenuList[pos][0];
                menuPath.push(_name);
                menuCmd.push(currentMenuRef[_name].__cmd__);
                const _currentMenuRef = getPath(transformedMenu, menuPath.join('.'));
                if (hasSubMenu()) menuWalker();
                else if (_currentMenuRef.__menu_entry__ !== undefined) {
                    menu.showLoading();
                    const __currentPath = menuPath.join('.');
                    _currentMenuRef.__menu_entry__.then((_menu) => {
                        if(__currentPath === menuPath.join('.')) {
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else if (_currentMenuRef.__onload_menu__ !== undefined) {
                    menu.showLoading();
                    const __currentPath = menuPath.join('.');
                    new Promise(_currentMenuRef.__onload_menu__).then((_menu) => {
                        if(__currentPath === menuPath.join('.')) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__cmd__ ? [_currentMenuRef.__cmd__] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });

                } else {
                    Term.clear();
                    Term.printf(`..::`).formatGreen().printf(` ${menuPath.join(`${Term.colorCodeBrightBlack} > ${Term.colorCodeGreen}`)}`).formatFormatReset();
                    Term.printf(` ::..\n`);
                    if (typeof menuCmd[menuCmd.length - 1] === 'function') await menuCmd[menuCmd.length - 1]();
                    else await _(menuCmd.join(' '));
                    exit(0);
                }
                break;
            case menu.event.EXITED:
                if (!menuPath.length) {
                    Term.clear();
                    exit(1);
                }
                const __currentMenuRef = getPath(transformedMenu, menuPath.join('.'));
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
    menuWalker();

    function exit(code) {
        menu.close();
        process.exit(code);
    }

    function hasSubMenu() {
        const _currentMenuRef = getPath(transformedMenu, menuPath.join('.'));
        currentMenuList = Object.keys(_currentMenuRef).filter(e => e !== '__name__' && e !== '__desc__' && e !== '__cmd__' && e !== '__index__' && e !== '__menu_entry__' && e !== '__onload_menu__');
        return currentMenuList.length ? true : false;
    }

    function typeTransform(entry, path) {
        if (typeof entry === 'function' && entry.length) {
            console.log(`\nWrong format on ".${path}"! Use function without parameters !`);
            exit(2);
        }
        if (typeof entry === 'function' || typeof entry === 'string') {
            return entry;
        } else if (typeof entry === 'object' && entry.then !== undefined) {
            console.log(`\nWrong format on ".${path}"! Do not use Promise! Use async function!`);
            exit(2);
        }
        return undefined;
    }

    function getPath(obj, path = '') {
        if (path.length) {
            path = path.split('.');
            for (var i = 0; i < path.length; i++) {
                obj = obj[path[i]];
            }
        }
        return obj;
    };

    function transform(src, dest, path = '', cmdList = []) {
        Object.keys(src).forEach((key, index) => {
            const _path = path.length ? `${path}.${key}` : key;
            const transformedObj = getPath(dest, path);
            let _cmdList = [...cmdList];
            transformedObj[key] = {};
            transformedObj[key].__name__ = key;
            transformedObj[key].__index__ = index;
            if (typeof src[key] === 'object' && Array.isArray(src[key])) {
                const _entry = src[key];
                if (_entry.length === 1) {
                    console.log(`\nWrong format on ".${_path}"! Use equals and not use one array with one element!`);
                    exit(2);
                } else if (_entry.length === 2) {
                    transformedObj[key].__desc__ = _entry[0];
                    if (typeof _entry[1] === 'object') transform(_entry[1], dest, _path, _cmdList);
                    else {
                        transformedObj[key].__cmd__ = typeTransform(_entry[1], _path);
                        _cmdList = [..._cmdList, transformedObj[key].__cmd__];
                    }
                } else if (_entry.length === 3) {
                    transformedObj[key].__desc__ = _entry[0];
                    transformedObj[key].__cmd__ = typeTransform(_entry[1], _path);
                    _cmdList = [..._cmdList, transformedObj[key].__cmd__];
                    if (typeof _entry[2] === 'object') transform(_entry[2], dest, _path, _cmdList);
                    else {
                        console.log(`\nWrong format on ".${_path}"! The third (3) item has to be an object!`);
                        exit(2);
                    }
                } else if (_entry.length > 3) {
                    console.log(`\nWrong format on ".${_path}"! Too big array maximum 3 item is allowed!`);
                    exit(2);
                }

            } else if (typeof src[key] === 'object' && src[key].__menu_entry__ !== undefined) {
                transformedObj[key].__desc__ = src[key].__desc__;
                transformedObj[key].__menu_entry__ = src[key].__menu_entry__;
                transformedObj[key].__cmd__ = src[key].__cmd__;
                _cmdList = [..._cmdList, transformedObj[key].__cmd__];
                const _currentMenuRef = transformedObj[key];
                _currentMenuRef.__menu_entry__.then((_menu) => {
                    delete _currentMenuRef.__menu_entry__;
                    transform(_menu, _currentMenuRef, '', _currentMenuRef.__cmd__ ? [_currentMenuRef.__cmd__] : []);
                    if (hasSubMenu()) menuWalker(true);
                });
            } else if (typeof src[key] === 'object' && src[key].__onload_menu__ !== undefined) {
                transformedObj[key].__desc__ = src[key].__desc__;
                transformedObj[key].__onload_menu__ = src[key].__onload_menu__;
                transformedObj[key].__cmd__ = src[key].__cmd__;
                _cmdList = [..._cmdList, transformedObj[key].__cmd__];
            } else if (typeof src[key] === 'string' || typeof src[key] === 'function') {
                transformedObj[key].__cmd__ = src[key];
                _cmdList = [..._cmdList, transformedObj[key].__cmd__];
            } else if (typeof src[key] === 'object') {
                transform(src[key], dest, _path, [..._cmdList]);
            }
            // check cmd equals
            const allCmd = _cmdList.map(c => { return typeof c !== 'string' });
            if (!allCmd.every(c => c === false) && !allCmd.every(c => c === true)) {
                console.log(`\nWrong format on ".${_path}"! On the path not all cmd is same type! Use just string or just function!`);
                exit(2);
            }
        });
    }

    function initGlobals() {
        global._ = _;
        global.__ = __;


        global.$ = function (prom = (res, rej) => { }, desc = '', cmd = '') {
            return { __desc__: desc, __menu_entry__: new Promise(prom), __cmd__: cmd };
        }

        global.$$ = function (prom = (res, rej) => { }, desc = '', cmd = '') {
            return { __desc__: desc, __onload_menu__: prom, __cmd__: cmd };
        }
    }
}
