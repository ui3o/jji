const { Term } = require('./term');

const USAGE = {
    name: 'NAME\n',
    usage: 'USAGE\n',
    options: 'OPTIONS\n',
    indent: '       ',
    typeIndent: '   ',
    optionIndent: 4,
    maxSwitchLength: 25,
    header: '\n',
}

const _get = (prop = '') => {
    return prop !== undefined && prop.length ? prop : undefined;
}

const _printTitles = (title, info = []) => {
    if (info.length && _get(info[0].name)) {
        Term.bold().printEsc(USAGE.header + title);
        let longestDescLength = 0;
        info.forEach(i => {
            if (i.name && i.name.length && longestDescLength < i.name.length && i.name.length < USAGE.maxSwitchLength) {
                longestDescLength = i.name.length;
            }
        });
        longestDescLength += USAGE.optionIndent;
        info.forEach(i => {
            Term.formatReset().printEsc(`${USAGE.indent + i.name}`);
            const desc = _get(i.desc);
            if(desc) {
                if (i.name.length < USAGE.maxSwitchLength) Term.printEsc(' '.repeat(longestDescLength - i.name.length));
                else Term.printEsc(`\n${USAGE.indent}${' '.repeat(longestDescLength)}`);
                Term.formatReset().brightBlack().printEsc(`${desc}`);
            }
            Term.formatReset().printEsc(`\n`);
        });
    }
}

// type: [boolean|string|number]
module.exports.printUsage = (u = {
    name: '', usage: [{ name: '', desc: '' }], options: [{ switch: '', desc: '', type: '' }],
    copyright: 'copyright@2020', version: '0.0.1'
}) => {
    _printTitles(USAGE.name, [{ name: u.name }]);
    _printTitles(USAGE.usage, u.usage);
    if (u.options && u.options.length) {
        let optionTitlePrinted = false;
        let longestSwitchLength = 0;
        u.options.forEach(o => {
            if (o.switch.length && longestSwitchLength < o.switch.length && o.switch.length < USAGE.maxSwitchLength) {
                longestSwitchLength = o.switch.length;
            }
        });
        longestSwitchLength += USAGE.optionIndent;
        u.options.forEach(o => {
            if (o.switch.length) {
                if (!optionTitlePrinted) { optionTitlePrinted = true; Term.bold().printEsc(USAGE.header + USAGE.options).formatReset(); }
                Term.yellow().printEsc(`${USAGE.indent + o.switch}`);
                if (o.switch.length < USAGE.maxSwitchLength) Term.printEsc(' '.repeat(longestSwitchLength - o.switch.length));
                else Term.printEsc(`\n${USAGE.indent}${' '.repeat(longestSwitchLength)}`);
                Term.formatReset().printEsc(`${o.desc}`);
                if (o.type) Term.cyan().printEsc(`${USAGE.typeIndent}[${o.type}]`);
                Term.printEsc(USAGE.header);
            }
        });
    }
    Term.printEsc(USAGE.header);
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.printEsc('== ');
    if (u.version && u.version.length) Term.printEsc(`v${u.version}`);
    if (u.copyright && u.copyright.length) {
        if (u.version && u.version.length) Term.printEsc(` - `);
        Term.printEsc(u.copyright);
    };
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.printEsc(' ==\n\n');
}