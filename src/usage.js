const { Term } = require('./term');

const USAGE = {
    name: 'NAME\n',
    usage: 'USAGE\n',
    options: 'OPTIONS\n',
    indent: '    ',
    typeIndent: '   ',
    optionIndent: 4,
    maxSwitchLength: 25,
    header: '\n',
}

const _get = (prop = '') => {
    return prop !== undefined && prop.length ? prop : undefined;
}

const _printTitles = (title, info = [], bold) => {
    if (info.length && _get(info[0].name)) {
        Term.print(Term.mc.bold + USAGE.header + title);

        info.forEach(i => {
            Term.print(Term.mc.resetAll);

            if (bold) Term.print(Term.fc.brightWhite + Term.mc.bold);
            Term.print(`${USAGE.indent + i.name}`);
            const desc = _get(i.desc);
            if (desc) {
                Term.print(Term.mc.resetAll).print(`\n`);
                Term.print(`${USAGE.indent}${USAGE.indent}${desc}`);
            }
            Term.print(Term.mc.resetAll).print(`\n`);
        });
    }
}

// type: [boolean|string|number]
module.exports.printUsage = (u = {
    name: '', usage: [{ name: '', desc: '' }], options: [{ switch: '', desc: '', type: '' }],
    copyright: 'copyright@2020', version: '0.0.1'
}) => {
    _printTitles(USAGE.name, [{ name: u.name }]);
    _printTitles(USAGE.usage, u.usage, true);
    if (u.options && u.options.length) {
        let optionTitlePrinted = false;
        u.options.forEach(o => {
            if (o.switch.length) {
                if (!optionTitlePrinted) { optionTitlePrinted = true; Term.print(Term.mc.bold + USAGE.header + USAGE.options + Term.mc.resetAll); }
                Term.print(`${Term.fc.brightWhite + Term.mc.bold}${USAGE.indent + o.switch}\n`);
                Term.print(`${Term.mc.resetAll}${USAGE.indent}${USAGE.indent}${o.desc}`);
                if (o.type) Term.print(`${Term.fc.cyan} [${o.type}]`);
                Term.print(`\n`);
            }
        });
    }
    Term.print(USAGE.header);
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.print('== ');
    if (u.version && u.version.length) Term.print(`v${u.version}`);
    if (u.copyright && u.copyright.length) {
        if (u.version && u.version.length) Term.print(` - `);
        Term.print(u.copyright);
    };
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.print(' ==\n\n');
}