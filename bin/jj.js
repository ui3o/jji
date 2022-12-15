#!/usr/bin/env node

"use strict"
const { printUsage } = require("../src/usage");
const packageJson = require("../package.json");
const argv = require('minimist')(process.argv.slice(2));

if (argv.h || argv.help) {
    printUsage({
        name: 'jj - Just a simple Jump interface.',
        usage: [
            { name: `jj [options]`, desc: 'if you have *.jj.js in the current directory' },
            { name: `jj [options] menu sub_menu`, desc: 'if you have *.jj.js in the current directory and open on menu path after start' }
        ],
        options: [
            { desc: "read *.jj.js files from specified working directory", switch: '-d', type: 'string' },
            { desc: 'print extra log to stderr', switch: '-x', type: 'boolean' },
            { desc: 'open file, or use multiply times this switch', switch: '-f', type: 'string' },
            { desc: 'prints all available menu list', switch: '-a', type: 'boolean' },
            { desc: 'show help', switch: '-h, --help', type: 'boolean' },
        ],
        version: packageJson.version,
        copyright: 'copyright@2021'
    });
    process.exit(0);
}

require("../index").jji(argv);