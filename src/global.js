const { Term } = require("./term");
const { existsSync, mkdir, rm } = require('fs');
const { spawn } = require('child_process');
const menu = require('./menu');
global.JJ.jji = require('../index');

const exitError = msg => { console.log(`\n[ERROR] ${msg}${Term.mc.cursorShow}`) };

global.ff = {
    __prop__: { __ff_instance__: true },
    get lazy() { this.__prop__.lazy_menu = true; return this; },
    get menu() { this.__prop__.menu = true; return this; },
    get longLoading() { this.__prop__.showLoadingAfter = 180000; return this; },
    get noLoading() { this.__prop__.showLoadingAfter = -1; return this; },
    get noHeader() { this.__prop__.noPrintOnSelect = true; return this; },
    get useIn() { this.__prop__.needInput = true; return this; },
    showLoadingAfter(ms = 100) {
        this.__prop__.showLoadingAfter = ms; return this;
    },
    get resetMenu() {
        this.__prop__.resetMenuPos = true; return this;
    },
    get printSelect() {
        this.__prop__.printSelect = true; return this;
    },
    header(fn = () => { }) { this.__prop__.header = fn; return this; },
    footer(fn = () => { }) { this.__prop__.footer = fn; return this; },
    do(fn = () => { }) {
        this.__prop__.fn = fn;
        const _this = { __prop__: { ...this.__prop__ } }; this.__prop__ = { __ff_instance__: true }; return _this;
    },
    get stay() {
        this.__prop__.stay = true; return this;

    },
    get home() {
        this.__prop__.home = true; return this;
    }
}

global.jj = {
    __prop__: {},
    rl: (question = '', disableMenuClearBack = false) => {
        return new Promise(res => {
            menu.readLine((_event, line) => {
                res(line);
            }, question, disableMenuClearBack);
        })
    },
    err: (msg = "") => {
        if (msg.length) exitError(msg);
        process.exit(2);
    },
    mkdir: (path = '') => {
        return new Promise(res => {
            if (!existsSync(path)) {
                mkdir(path, { recursive: true }, (code) => res(code));
            }
            else
                res();
        });
    },
    rm: (path = '') => {
        return new Promise(res => {
            rm(path, { recursive: true, force: true }, (code) => res(code));
        });
    },
    message: (msg = '') => {
        global.jj.messageHandler(msg);
    },
    resetMenu() {
        menu.resetMenuPos();
    },
    messageHandler: () => { },
    term: Term,
    cmd: Term,
    cmdOpts: {},
    cl: {},
    cle: {},
    cli: {}
}

global.jj.cli = {
    get printStd() { global.jj.__prop__.printStd = true; return global.jj.cli; },
    get hideErr() { global.jj.__prop__.hideErr = true; return global.jj.cli; },
    get noErr() { global.jj.__prop__.noErr = true; return global.jj.cli; },
    get splitByLine() { global.jj.__prop__.splitByLine = true; return global.jj.cli; },
    get splitAll() { global.jj.__prop__.splitAll = true; return global.jj.cli; },
    wd: (wd = '') => { global.jj.__prop__.cwd = wd; return global.jj.cli; },
    eol: (eol = '') => { global.jj.__prop__.eol = eol; return global.jj.cli; },
}
global.jj.cl = {
    wd: (wd = '') => { global.jj.__prop__.cwd = wd; return global.jj.cl; },
}
global.jj.cle = {
    handler: (handler = () => { }) => { global.jj.__prop__.handler = handler; return global.jj.cle; },
    wd: (wd = '') => { global.jj.__prop__.cwd = wd; return global.jj.cle; },
}
global.jj.cl.do = async (...args) => { return await spawnCommand(...args); }
global.jj.cle.do = async (...args) => { global.jj.__prop__.cle = true; return await spawnCommand(...args); }
global.jj.cli.do = async (...args) => { global.jj.__prop__.cli = true; return await spawnCommand(...args); }

function scriptCollector(...args) {
    let script = [];
    let options = { ...global.jj.__prop__ };
    global.jj.__prop__ = {};
    if (Array.isArray(args[0])) {
        const out = [];
        args[0].forEach((element, index) => {
            if (index > 0) out.push(args[index]);
            out.push(element);
        });
        script = out.join('').split(' ');
    } else {
        args.forEach(e => {
            if (Array.isArray(e)) script = [...script, ...e];
            else if (typeof e === 'string') script = [...script, ...e.split(' ')];
            else script = [...script, e];
        });
    }
    let _firstFound = false;
    script = script.filter(p => { if (p || _firstFound) { _firstFound = true; return true; } return false; });
    return { script, options };
}

function spawnCommand(...args) {
    if (!global.jj.__prop__.cli && !global.jj.__prop__.cle) {
        const { script, options } = scriptCollector(...args);
        const shell = process.env.__shell === 'true' ? true : process.env.__shell;
        global.jj.cmdOpts = { cl: true };
        global.jj.cmd = spawn(script.shift(), [...script], { stdio: 'inherit', cwd: options.cwd, env: process.env, shell });
        return new Promise((resolve) => {
            global.jj.cmd.on('close', (code) => {
                global.jj.cmd = undefined;
                resolve(code)
            });
        });
    } else if (!global.jj.__prop__.cli && global.jj.__prop__.cle) {
        const { script, options } = scriptCollector(...args);
        const isPaused = process.stdin.isPaused();
        process.stdin.resume();
        const shell = process.env.__shell === 'true' ? true : process.env.__shell;
        global.jj.cmdOpts = { cle: true, handler: options.handler };
        global.jj.cmdOpts.handler = global.jj.cmdOpts.handler === undefined ? () => { } : global.jj.cmdOpts.handler;
        global.jj.cmd = spawn(script.shift(), [...script], { encoding: 'utf-8', cwd: options.cwd, shell });
        global.jj.cmdOpts.handler(global.jj.cmd);
        return new Promise(res => {
            global.jj.cmd.stdout.on('data', data => {
                if (!global.jj.cmdOpts.handler(global.jj.cmd, 1, data)) process.stdout.write(data);
            });
            global.jj.cmd.stderr.on('data', data => {
                if (!global.jj.cmdOpts.handler(global.jj.cmd, 2, data)) process.stdout.write(data);
            });
            global.jj.cmd.on('close', (c) => {
                global.jj.cmd = undefined;
                if (isPaused) process.stdin.pause();
                res({ o: undefined, c });
            });
        });
    } else {
        const { script, options } = scriptCollector(...args);
        const lines = [];
        const shell = process.env.__shell === 'true' ? true : process.env.__shell;
        global.jj.cmdOpts = { cli: true };
        global.jj.cmd = spawn(script.shift(), [...script], { encoding: 'utf-8', cwd: options.cwd, shell });
        return new Promise(res => {
            let _out = '';
            global.jj.cmd.stdout.on('data', data => {
                _out += data;
            });
            global.jj.cmd.stderr.on('data', data => {
                if (!options.noErr) _out += data;
                else if (!options.hideErr) process.stdout.write(data.toString())
            });
            global.jj.cmd.on('close', (c) => {
                global.jj.cmd = undefined;
                if (options.printStd) console.log(_out);
                if (options.splitAll || options.splitByLine) {
                    const _lines = _out.split(options.eol ? options.eol : '\n').filter(l => l);
                    if (options.splitByLine) res({ o: _lines, c });
                    else {
                        _lines.forEach(l => lines.push(l.split(/[ \t]/)));
                        res({ o: lines, c });
                    }
                }
                else
                    res({ o: _out, c });
            });
        });
    }
}
