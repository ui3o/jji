const { existsSync } = require('fs');
const { keymap } = require("./src/keymap");
const path = require('path');

require('./src/global');
const menu = require('./src/menu');
const { Term } = require('./src/term');
const { fromDir } = require('./src/file.finder');

const exitError = msg => { console.log(`\n[ERROR] ${msg}`) };

module.exports.jji = async (argv = {}, rawMenu = {}) => {

    const MENU_SEPARATOR = ' > ';
    const error = msg => { if (argv.x) console.error(`[ERROR] ${msg}`) };
    if (argv.x) console.log = console.error;

    let jjFiles = argv._ && argv._.length ? argv._ : [];
    let transformedMenu = {};
    let flyMenu = {};
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

    let menuInputString = '';
    let flyMode = false;
    let menuPath = [];
    let currentMenuRef = {};
    let currentMenuList = {};

    function menuWalker(update) {
        clearTimeout(showLoadingTimer);
        currentMenuRef = flyMode ? flyMenu : getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        currentMenuList = Object.keys(currentMenuRef).filter(e => e !== '__prop__')
            .sort((a, b) => {
                if (currentMenuRef[a].__prop__.index > currentMenuRef[b].__prop__.index) return 1;
                if (currentMenuRef[a].__prop__.index < currentMenuRef[b].__prop__.index) return -1;
                return 0;
            }).map(
                e => {
                    const _n = flyMode ? e : currentMenuRef[e].__prop__.name;
                    const _name = currentMenuRef[e].__prop__.group ? `+ ${_n}` : `- ${_n}`;
                    return [_name, currentMenuRef[e].__prop__.desc,
                        currentMenuRef[e].__prop__.menu_entry ? 1 : currentMenuRef[e].__prop__.lazy_menu ? 2 : currentMenuRef[e].__prop__.cmd === null ? 3 : 0]
                });
        let mp = flyMode ? [Term.fc.brightWhite, '>', '>', '>', Term.fc.defaultColor] : [];
        if (!flyMode) menuPath.forEach(p => { mp = [...mp, Term.mc.bold, Term.fc.brightWhite, ...p.split(''), Term.mc.styleReset, Term.fc.brightBlack, ' ', '>', ' '] })
        if (update) menu.updateMenu(currentMenuList, mp, !flyMode ? undefined : '');
        else {
            menuInputString = '';
            menu.setMenu(currentMenuList, mp);
        }
    }

    function showLoading(timeout = 100) {
        menu.showLoading(true);
        showLoadingTimer = setTimeout(() => {
            menu.showLoading();
        }, timeout);
    }

    menu.configure.disableProcessExitOnSelect().disableSelectedPrint().disableProcessExitOnExit();
    await menu.open(async (event, arg) => {
        switch (event) {
            case menu.event.SELECT:
                const pos = arg;
                const _name = currentMenuList[pos][0].replace('+ ', '').replace('- ', '');
                if (flyMode) {
                    flyMode = false;
                    _oldMenuPath = [...menuPath];
                    menuPath = [];
                    _name.split(MENU_SEPARATOR).forEach(n => {
                        menuPath.push(n);
                    });
                    // if absolute diff remove all lazy up to the root 
                    if (_oldMenuPath[0] !== menuPath[0]) freeLazyItemsFromPath(_oldMenuPath);
                    else {
                        // find diff remove all lazy up to same level 
                        const diff = [];
                        const dl = _oldMenuPath.length;
                        for (let index = 0; index < dl; index++) {
                            if (menuPath[index] === _oldMenuPath[index]) diff.push(menuPath[index]);
                            else diff.push(undefined);
                        }
                        const backLen = diff.filter(v => v === undefined).length;
                        freeLazyItemsFromPath(_oldMenuPath, backLen);
                    }
                    currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                } else {
                    menuPath.push(_name);
                }
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__prop__.cmd === null) {
                    menuPath.pop();
                } else if (hasSubMenu()) {
                    menuWalker();
                } else if (_currentMenuRef.__prop__.menu_entry !== undefined) {
                    menu.showLoading();
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    _currentMenuRef.__prop__.menu_entry.then((_menu) => {
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else if (_currentMenuRef.__prop__.lazy_menu !== undefined) {
                    const __showLoadingTimeout = _currentMenuRef.__prop__.showLoadingAfter ? _currentMenuRef.__prop__.showLoadingAfter : 100;
                    if (_currentMenuRef.__prop__.printSelect) printSelection();
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__prop__.lazy_menu).then((_menu) => {
                        if (_currentMenuRef.__prop__.resetMenuPos) menu.resetMenuPos();
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__prop__.index, _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    printSelection();
                    const __needInput = _currentMenuRef.__prop__ && _currentMenuRef.__prop__.needInput ? _currentMenuRef.__prop__.needInput : false;
                    menu.mute(__needInput);
                    const menuCmd = _currentMenuRef.__prop__.cmdList;
                    if (typeof menuCmd[menuCmd.length - 1] === 'function') await menuCmd[menuCmd.length - 1]();
                    else await jj.cl.do(menuCmd.join(' '));
                    if (typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && _currentMenuRef.__prop__.footer)
                        Term.printf(_currentMenuRef.__prop__.footer());
                    menu.unmute();
                    exit(0);
                }
                break;
            case menu.event.EXITED:
                if (flyMode) { flyMode = false; menuWalker(); break; }
                if (!menuPath.length) {
                    menu.jumpHome(); Term.eraseDisplayBelow();
                    exit(1);
                }
                const __currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                // remove menu item from __prop__.lazy_menu
                if (__currentMenuRef.__prop__.lazy_menu !== undefined) {
                    const _currentMenuList = Object.keys(__currentMenuRef).filter(e => e !== '__prop__');
                    _currentMenuList.forEach(m => {
                        delete flyMenu[__currentMenuRef[m].__prop__.fullPath]
                        delete __currentMenuRef[m];
                    });
                }
                menuPath.pop();
                menuWalker();
                break;
            case menu.event.INPUT_STR:
                const str = arg;
                if (str.charAt(0) === ' ' && !flyMode) {
                    flyMode = true;
                } else if (str.length === 0 && flyMode) {
                    flyMode = false;
                }
                menuInputString = str;
                menuWalker(true);
                break;
            case menu.event.INPUT_DROP:
                menuInputString = '';
                const _ins = arg;
                const len = _ins.length;
                const onlyFlyModeActive = flyMode && len === 1 && _ins[0] === ' ' ? true : false;
                for (let index = 0; index < len; index++) {
                    _ins.pop();
                }
                if (onlyFlyModeActive) {
                    flyMode = false;
                    menuWalker(true);
                } else if (flyMode) _ins.push(' ');
                break;
            case menu.event.KEY:
                const keyEvent = arg;
                switch (keyEvent) {
                    case keymap.NUL: // same as keymap.CTRL_SPACE
                    case keymap.CTRL_F:
                        const inString = flyMode ? menuInputString.slice(1) : ' ' + menuInputString;
                        flyMode = !flyMode;
                        menu.setInputString(inString);
                        menuWalker(true);
                        break;
                }
                break;
            default:
                break;
        }
    });
    transform(rawMenu, transformedMenu);
    menuWalker();

    const freeLazyItemsFromPath = (mPath = menuPath, times) => {
        times = times === undefined ? mPath.length : times;
        if (!times) return;
        const _currentMenuRef = getPath(transformedMenu, mPath.join(MENU_SEPARATOR));
        if (_currentMenuRef.__prop__.lazy_menu !== undefined) {
            const _items = Object.keys(_currentMenuRef).filter(e => e !== '__prop__');
            _items.forEach(k => {
                delete flyMenu[_currentMenuRef[k].__prop__.fullPath]
                delete _currentMenuRef[k];
            })
        }
        mPath.pop(); times--;
        freeLazyItemsFromPath(mPath, times);
    }

    function exit(code) {
        if (code === 0) {
            const _currMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
            if (_currMenuRef.__prop__.stay) {
                if (menuPath.length) menuPath.pop();
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__prop__ && _currentMenuRef.__prop__.lazy_menu !== undefined) {
                    const _items = Object.keys(_currentMenuRef).filter(e => e !== '__prop__');
                    _items.forEach(k => {
                        delete flyMenu[_currentMenuRef[k].__prop__.fullPath]
                        delete _currentMenuRef[k];
                    });
                    const __showLoadingTimeout = _currentMenuRef.__prop__.showLoadingAfter ? _currentMenuRef.__prop__.showLoadingAfter : 100;
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__prop__.lazy_menu).then((_menu) => {
                        if (_currentMenuRef.__prop__.resetMenuPos) menu.resetMenuPos();
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__prop__.index, _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    if (hasSubMenu()) menuWalker();
                }
                return;
            } else if (_currMenuRef.__prop__.home) {
                freeLazyItemsFromPath();
                menuPath = [];
                menuWalker();
                return;
            }
        }
        menu.close();
        process.exit(code);
    }

    function hasSubMenu() {
        const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        currentMenuList = Object.keys(_currentMenuRef).filter(e => e !== '__prop__');
        return currentMenuList.length ? true : false;
    }

    function typeTransform(entry, path) {
        if (typeof entry === 'string') {
            return entry;
        }
        if (typeof entry === 'object' && entry.__prop__ && entry.__prop__.__ff_instance__) {
            return entry.__prop__.fn;
        } else {
            exitError(`Wrong format on ".${path}"! use ff or string in declaration!`);
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

    function transform(src, dest, path = '', index = '', cmdList = []) {
        // calculate max prefix
        const numberFillLength = !index ? Object.keys(src).length.toString().length : undefined;
        Object.keys(src).forEach((key, indx) => {
            const _path = path.length ? `${path + MENU_SEPARATOR + key}` : key;
            const _fullPath = dest.__prop__ ? `${dest.__prop__.fullPath + MENU_SEPARATOR + key}` : _path;
            const _index = numberFillLength ? '0'.repeat(numberFillLength - (index + indx).length) + index + indx : index + indx;
            const transformedObj = getPath(dest, path);
            let _cmdList = [...cmdList];
            transformedObj[key] = { __prop__: {} };
            transformedObj[key].__prop__.name = key;
            transformedObj[key].__prop__.group = false;
            transformedObj[key].__prop__.fullPath = _fullPath;
            transformedObj[key].__prop__.index = _index;
            if (typeof src[key] === 'object' && Array.isArray(src[key])) {
                const _entry = src[key];
                if (_entry.length === 1) {
                    exitError(`Wrong format on ".${_path}"! Use equals and not use one array with one element!`);
                    exit(2);
                } else if (_entry.length === 2) {
                    transformedObj[key].__prop__.desc = _entry[0];
                    if (!delayedTransform(_entry[1], transformedObj[key], _cmdList)) {
                        if (typeof _entry[1] === 'object' && _entry[1] !== null && !_entry[1].__prop__) { transformedObj[key].__prop__.group = true; transform(_entry[1], dest, _path, _index, _cmdList); }
                        else {
                            if (_entry[1] === null) transformedObj[key].__prop__.cmd = null;
                            else {
                                transformedObj[key].__prop__.cmd = typeTransform(_entry[1], _path);
                                if (_entry[1].__prop__) transformedObj[key].__prop__ = { ...transformedObj[key].__prop__, ..._entry[1].__prop__ };
                            }
                            _cmdList = [..._cmdList, transformedObj[key].__prop__.cmd];
                        }
                    }
                } else if (_entry.length === 3) {
                    transformedObj[key].__prop__.desc = _entry[0];
                    transformedObj[key].__prop__.cmd = typeTransform(_entry[1], _path);
                    if (_entry[1].__prop__) transformedObj[key].__prop__ = { ...transformedObj[key].__prop__, ..._entry[1].__prop__ };
                    _cmdList = [..._cmdList, transformedObj[key].__prop__.cmd];
                    if (!delayedTransform(_entry[2], transformedObj[key], _cmdList)) { transformedObj[key].__prop__.group = true; transform(_entry[2], dest, _path, _index, _cmdList); }
                    else {
                        exitError(`Wrong format on ".${_path}"! The third (3) item has to be an object!`);
                        exit(2);
                    }
                } else if (_entry.length > 3) {
                    exitError(`Wrong format on ".${_path}"! Too big array maximum 3 item is allowed!`);
                    exit(2);
                }
            } else if (typeof src[key] === 'object' && src[key] === null) {
                transformedObj[key].__prop__.cmd = null;
                _cmdList = [..._cmdList, transformedObj[key].__prop__.cmd];
            } else if (typeof src[key] === 'string') {
                transformedObj[key].__prop__.cmd = src[key];
                _cmdList = [..._cmdList, transformedObj[key].__prop__.cmd];
            } else if (typeof src[key] === 'function') {
                exitError(`Wrong format on ".${_path}"! use ff. simple function is not allowed!`);
                exit(2);
            } else if (typeof src[key] === 'object' && !delayedTransform(src[key], transformedObj[key], _cmdList)) {
                if (typeof src[key] === 'object' && src[key] !== null && src[key].__prop__ && src[key].__prop__.__ff_instance__) {
                    transformedObj[key].__prop__ = { ...transformedObj[key].__prop__, ...src[key].__prop__ };
                    transformedObj[key].__prop__.cmd = typeTransform(src[key], _path);
                    _cmdList = [..._cmdList, transformedObj[key].__prop__.cmd];
                } else {
                    transformedObj[key].__prop__.group = true;
                    transform(src[key], dest, _path, _index, [..._cmdList]);
                }
            }
            transformedObj[key].__prop__.cmdList = [..._cmdList];
            flyMenu[_fullPath] = { ...transformedObj[key] };
            // check cmd equals
            const allCmd = _cmdList.map(c => { return typeof c !== 'string' });
            if (!allCmd.every(c => c === false) && !allCmd.every(c => c === true) && _cmdList[_cmdList.length - 1] !== null) {
                exitError(`Wrong format on ".${_path}"! On the path not all cmd is same type! Use just string or just function!`);
                exit(2);
            }
        });
    }

    function delayedTransform(src, transformedObj, _cmdList = []) {
        if (typeof src === 'object' && src && src.__prop__ && src.__prop__.menu) {
            transformedObj.__prop__.group = true;
            transformedObj.__prop__.desc = src.__prop__.desc ? src.__prop__.desc : transformedObj.__prop__.desc ? transformedObj.__prop__.desc : '';
            if (src.__prop__) transformedObj.__prop__ = { ...transformedObj.__prop__, ...src.__prop__ };
            transformedObj.__prop__.menu_entry = new Promise(src.__prop__.fn);
            transformedObj.__prop__.cmd = src.__prop__.cmd ? src.__prop__.cmd : '';
            _cmdList.push(transformedObj.__prop__.cmd);
            const _currentMenuRef = transformedObj;
            _currentMenuRef.__prop__.menu_entry.then((_menu) => {
                delete _currentMenuRef.__prop__.menu_entry;
                transform(_menu, _currentMenuRef, '', transformedObj.__prop__.index, _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                if (hasSubMenu()) menuWalker(true);
            });
            return true;
        } else if (typeof src === 'object' && src && src.__prop__ && src.__prop__.lazy_menu !== undefined) {
            transformedObj.__prop__.group = true;
            transformedObj.__prop__.desc = src.__prop__.desc ? src.__prop__.desc : transformedObj.__prop__.desc ? transformedObj.__prop__.desc : '';
            if (src.__prop__) transformedObj.__prop__ = { ...transformedObj.__prop__, ...src.__prop__ };
            transformedObj.__prop__.lazy_menu = src.__prop__.fn;
            transformedObj.__prop__.cmd = src.__prop__.cmd ? src.__prop__.cmd : '';
            _cmdList.push(transformedObj.__prop__.cmd);
            return true;
        }
        return false;
    }

    function printSelection() {
        menu.jumpHome(); Term.eraseDisplayBelow();
        const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        const menuCmd = _currentMenuRef.__prop__.cmdList;
        if (typeof menuCmd[menuCmd.length - 1] !== 'function' || (typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && !_currentMenuRef.__prop__.noPrintOnSelect)) {
            if ((typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && !_currentMenuRef.__prop__.header) || typeof menuCmd[menuCmd.length - 1] !== 'function') {
                Term.printf(`..::`).formatBold().formatBrightWhite().printf(` ${menuPath.join(`${Term.mc.styleReset + Term.fc.brightBlack} > ${Term.mc.bold + Term.fc.brightWhite}`)}`).formatFormatReset();
                Term.printf(` ::..\n`);
            } else {
                Term.printf(_currentMenuRef.__prop__.header());
            }
        }
        menu.resetMenuPos();
    }

}
