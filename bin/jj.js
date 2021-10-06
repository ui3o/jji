#!/usr/bin/env node

"use strict"
const { printUsage } = require("../src/usage");
const packageJson = require("../package.json");
const argv = require('minimist')(process.argv.slice(2));

if (argv.h || argv.help) {
    printUsage({
        name: 'jj - Just a simple Jump interface.',
        usage: [
            { name: `jj [options]`, desc: 'if you have jj.js in the current directory' },
            { name: `jj [options] script.jj.js`, desc: 'run specified script.jj.js in the current directory' }
        ],
        options: [
            { desc: "read *.jj.js files from specified working directory", switch: '-d', type: 'string' },
            { desc: 'show help', switch: '-h, --help', type: 'boolean' },
        ],
        version: packageJson.version,
        copyright: 'copyright@2021'
    });
    process.exit(0);
}

require("../index").jji(argv);