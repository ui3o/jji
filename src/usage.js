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

const _printTitles = (title, info = []) => {
    if (info.length && _get(info[0].name)) {
        Term.formatBold().printf(USAGE.header + title);
        let longestDescLength = 0;
        info.forEach(i => {
            if (i.name && i.name.length && longestDescLength < i.name.length && i.name.length < USAGE.maxSwitchLength) {
                longestDescLength = i.name.length;
            }
        });
        longestDescLength += USAGE.optionIndent;
        info.forEach(i => {
            Term.formatFormatReset().printf(`${USAGE.indent + i.name}`);
            const desc = _get(i.desc);
            if (desc) {
                Term.formatFormatReset().printf('\n');
                Term.startLine().formatBrightBlack().putStr(`${desc}`).flushJustifyToRight(2 * USAGE.optionIndent);
            }
            Term.formatFormatReset().printf(`\n`);
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
                if (!optionTitlePrinted) { optionTitlePrinted = true; Term.formatBold().printf(USAGE.header + USAGE.options).formatFormatReset(); }
                Term.formatBrightWhite().formatBold().printf(`${USAGE.indent + o.switch}\n`);
                Term.startLine().formatBrightBlack().putStr(`${o.desc}`);
                if (o.type) Term.cyan().putStr(` [${o.type}]`);
                Term.flushJustifyToRight(2 * USAGE.optionIndent).printf('\n');
            }
        });
    }
    Term.printf(USAGE.header);
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.printf('== ');
    if (u.version && u.version.length) Term.printf(`v${u.version}`);
    if (u.copyright && u.copyright.length) {
        if (u.version && u.version.length) Term.printf(` - `);
        Term.printf(u.copyright);
    };
    if ((u.version && u.version.length) || (u.copyright && u.copyright.length)) Term.printf(' ==\n\n');
}