const { Term } = require("./term");
const { existsSync, mkdir, rm } = require('fs');
const { spawn } = require('child_process');
const menu = require('./menu');

const exitError = msg => { console.log(`\n[ERROR] ${msg}`) };

global.ff = {
    __prop__: { __ff_instance__: true },
    get lazy() { this.__prop__.lazy_menu = true; return this; },
    get menu() { this.__prop__.menu = true; return this; },
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
    rl: (question = '') => {
        return new Promise(res => {
            menu.readLine((_event, line) => {
                res(line);
            }, question);
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
        });
    },
    rm: (path = '') => {
        return new Promise(res => {
            rm(path, { recursive: true, force: true }, (code) => res(code));
        });
    },
    term: Term,
    cl: {},
    cli: {}
}

global.jj.cli = {
    get noErr() { global.jj.__prop__.noErr = true; return global.jj.cli; },
    get splitByLine() { global.jj.__prop__.splitByLine = true; return global.jj.cli; },
    get splitAll() { global.jj.__prop__.splitAll = true; return global.jj.cli; },
    wd: (wd = '') => { global.jj.__prop__.cwd = wd; return global.jj.cli; },
    eol: (eol = '') => { global.jj.__prop__.eol = eol; return global.jj.cli; },
}
global.jj.cl = {
    get noErr() { global.jj.__prop__.noErr = true; return global.jj.cl; },
    get splitByLine() { global.jj.__prop__.splitByLine = true; return global.jj.cl; },
    get splitAll() { global.jj.__prop__.splitAll = true; return global.jj.cl; },
    wd: (wd = '') => { global.jj.__prop__.cwd = wd; return global.jj.cl; },
    eol: (eol = '') => { global.jj.__prop__.eol = eol; return global.jj.cl; },
}
global.jj.cl.do = async (...args) => { return await spawnCommand(...args); }
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
    if (!global.jj.__prop__.cli) {
        const { script, options } = scriptCollector(...args);
        const shell = process.env.__shell === 'true' ? true : process.env.__shell;
        const cmd = spawn(script.shift(), [...script], { stdio: 'inherit', cwd: options.cwd, env: process.env, shell });
        return new Promise((resolve) => {
            cmd.on('close', (code) => resolve(code));
        });
    } else {
        const { script, options } = scriptCollector(...args);
        const lines = [];
        const shell = process.env.__shell === 'true' ? true : process.env.__shell;
        const cmd = spawn(script.shift(), [...script], { encoding: 'utf-8', cwd: options.cwd, shell });
        return new Promise(res => {
            let _out = '';
            cmd.stdout.on('data', data => {
                _out += data;
            });
            if (!options.noErr) {
                cmd.stderr.on('data', data => {
                    _out += data;
                });
            }
            cmd.on('close', (code) => {
                if (options.splitAll || options.splitByLine) {
                    const _lines = _out.split(options.eol ? options.eol : '\n').filter(l => l);
                    if (options.splitByLine) res(_lines);
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
}
