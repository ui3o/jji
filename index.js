const { existsSync } = require('fs');
const path = require('path');

require('./src/global');
const menu = require('./src/menu');
const { Term } = require('./src/term');
const { fromDir } = require('./src/file.finder');

const exitError = msg => { console.log(`\n[ERROR] ${msg}`) };

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
        currentMenuList = Object.keys(currentMenuRef).filter(e => e !== '__prop__')
            .sort((a, b) => {
                if (currentMenuRef[a].__prop__.index > currentMenuRef[b].__prop__.index) return 1;
                if (currentMenuRef[a].__prop__.index < currentMenuRef[b].__prop__.index) return -1;
                return 0;
            }).map(
                e => { return [currentMenuRef[e].__prop__.name, currentMenuRef[e].__prop__.desc, currentMenuRef[e].__prop__.menu_entry ? 1 : currentMenuRef[e].__prop__.lazy_menu ? 2 : currentMenuRef[e].__prop__.cmd === null ? 3 : 0] });
        let mp = []; menuPath.forEach(p => { mp = [...mp, Term.colorCodeBold, Term.colorCodeBrightWhite, ...p.split(''), Term.colorCodeStyleReset, Term.colorCodeBrightBlack, ' ', '>', ' '] })
        if (update) menu.updateMenu(currentMenuList);
        else menu.setMenu(currentMenuList, mp);
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
                const _name = currentMenuList[pos][0];
                menuPath.push(_name);
                menuCmd.push(currentMenuRef[_name].__prop__.cmd);
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__prop__.cmd === null) {
                    menuPath.pop();
                    menuCmd.pop();
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
                    const __showLoadingTimeout = _currentMenuRef.__prop__.lazy_menu.__showLoadingAfter ? _currentMenuRef.__prop__.lazy_menu.__showLoadingAfter : 100;
                    if (_currentMenuRef.__prop__.lazy_menu.__printSelect) printSelection();
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__prop__.lazy_menu).then((_menu) => {
                        if (_currentMenuRef.__prop__.resetMenuPos) menu.resetMenuPos();
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    printSelection();
                    const __needInput = _currentMenuRef.__prop__ && _currentMenuRef.__prop__.needInput ? _currentMenuRef.__prop__.needInput : false;
                    menu.mute(__needInput);
                    if (typeof menuCmd[menuCmd.length - 1] === 'function') await menuCmd[menuCmd.length - 1]();
                    else await jj.cl.do(menuCmd.join(' '));
                    if (typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && _currentMenuRef.__prop__.footer)
                        Term.printf(_currentMenuRef.__prop__.footer());
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
                // remove menu item from __prop__.lazy_menu
                if (__currentMenuRef.__prop__.lazy_menu !== undefined) {
                    const _currentMenuList = Object.keys(__currentMenuRef).filter(e => e !== '__prop__');
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

    const freeLazyItemsFromPath = () => {
        if (menuPath.length < 2) return;
        menuPath.pop(); menuCmd.pop();
        const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
        if (_currentMenuRef.__prop__.lazy_menu !== undefined) {
            const _items = Object.keys(_currentMenuRef).filter(e => e !== '__prop__');
            _items.forEach(k => delete _currentMenuRef[k])
        }
        freeLazyItemsFromPath();
    }

    function exit(code) {
        if (code === 0) {
            const _currMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
            if (_currMenuRef.__prop__.stay) {
                if (menuPath.length) { menuPath.pop(); menuCmd.pop(); }
                const _currentMenuRef = getPath(transformedMenu, menuPath.join(MENU_SEPARATOR));
                if (_currentMenuRef.__prop__ && _currentMenuRef.__prop__.lazy_menu !== undefined) {
                    const _items = Object.keys(currentMenuRef).filter(e => e !== '__prop__');
                    _items.forEach(k => delete _currentMenuRef[k]);
                    const __showLoadingTimeout = _currentMenuRef.__prop__.lazy_menu.__showLoadingAfter ? _currentMenuRef.__prop__.lazy_menu.__showLoadingAfter : 100;
                    showLoading(__showLoadingTimeout);
                    const __currentPath = menuPath.join(MENU_SEPARATOR);
                    new Promise(_currentMenuRef.__prop__.lazy_menu).then((_menu) => {
                        if (_currentMenuRef.__prop__.resetMenuPos) menu.resetMenuPos();
                        if (__currentPath === menuPath.join(MENU_SEPARATOR)) {
                            transform(_menu, _currentMenuRef, '', _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                            if (hasSubMenu()) menuWalker();
                        }
                    });
                } else {
                    if (hasSubMenu()) menuWalker(true);
                }
                return;
            } else if (_currMenuRef.__prop__.home) {
                freeLazyItemsFromPath();
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

    function transform(src, dest, path = '', cmdList = []) {
        Object.keys(src).forEach((key, index) => {
            const _path = path.length ? `${path + MENU_SEPARATOR + key}` : key;
            const transformedObj = getPath(dest, path);
            let _cmdList = [...cmdList];
            transformedObj[key] = { __prop__: {} };
            transformedObj[key].__prop__.name = key;
            transformedObj[key].__prop__.index = index;
            if (typeof src[key] === 'object' && Array.isArray(src[key])) {
                const _entry = src[key];
                if (_entry.length === 1) {
                    exitError(`Wrong format on ".${_path}"! Use equals and not use one array with one element!`);
                    exit(2);
                } else if (_entry.length === 2) {
                    transformedObj[key].__prop__.desc = _entry[0];
                    if (!delayedTransform(_entry[1], transformedObj[key], _cmdList)) {
                        if (typeof _entry[1] === 'object' && _entry[1] !== null && !_entry[1].__prop__) transform(_entry[1], dest, _path, _cmdList);
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
                } else transform(src[key], dest, _path, [..._cmdList]);
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
        if (typeof src === 'object' && src && src.__prop__ && src.__prop__.menu) {
            transformedObj.__prop__.desc = src.__prop__.desc ? src.__prop__.desc : transformedObj.__prop__.desc ? transformedObj.__prop__.desc : '';
            if (src.__prop__) transformedObj.__prop__ = { ...transformedObj.__prop__, ...src.__prop__ };
            transformedObj.__prop__.menu_entry = new Promise(src.__prop__.fn);
            transformedObj.__prop__.cmd = src.__prop__.cmd ? src.__prop__.cmd : '';
            _cmdList.push(transformedObj.__prop__.cmd);
            const _currentMenuRef = transformedObj;
            _currentMenuRef.__prop__.menu_entry.then((_menu) => {
                delete _currentMenuRef.__prop__.menu_entry;
                transform(_menu, _currentMenuRef, '', _currentMenuRef.__prop__.cmd ? [_currentMenuRef.__prop__.cmd] : []);
                if (hasSubMenu()) menuWalker(true);
            });
            return true;
        } else if (typeof src === 'object' && src && src.__prop__ && src.__prop__.lazy_menu !== undefined) {
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
        if (typeof menuCmd[menuCmd.length - 1] !== 'function' || (typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && !_currentMenuRef.__prop__.noPrintOnSelect)) {
            if ((typeof menuCmd[menuCmd.length - 1] === 'function' && _currentMenuRef.__prop__ && !_currentMenuRef.__prop__.header) || typeof menuCmd[menuCmd.length - 1] !== 'function') {
                Term.printf(`..::`).formatBold().formatBrightWhite().printf(` ${menuPath.join(`${Term.colorCodeStyleReset + Term.colorCodeBrightBlack} > ${Term.colorCodeBold + Term.colorCodeBrightWhite}`)}`).formatFormatReset();
                Term.printf(` ::..\n`);
            } else {
                Term.printf(_currentMenuRef.__prop__.header());
            }
        }
        menu.resetMenuPos();
    }

}
