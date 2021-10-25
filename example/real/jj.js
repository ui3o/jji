
module.exports.less = ["less file from directory", $(async (res) => {
    const ls = await __(`find . -maxdepth 1 -type f`, { __splitByLine });
    const menu = {};
    ls.forEach(line => {
        menu[line] = async () => { await _`less ${line}`; jj.stay(); }
    });
    res(menu);
}, { __noPrintOnSelect: true })];

module.exports.fileViewer = ["ls dir and less file from directory", $$(async (res) => {
    const lsc = await __(`ls -al`, { __splitAll });
    const ls = lsc.filter((_, index) => { return index > 1 });
    const menu = {};
    ls.forEach(line => {
        const file = line[line.length - 1];
        if (line[0].startsWith('-'))
            menu[file] = [`less ${file}`,
            $$$(async () => { await _`less ${file}`; jj.stay(); }, { __noPrintOnSelect: true })]
        else {
            menu[`${file}/`] = $$$(() => {
                process.chdir(file);
                jj.stay();
            }, {
                __header: () => `changing directory from ${jj.term.colorCodeYellow + process.cwd() + jj.term.colorCodeDefaultColor}\n`,
                __footer: () => `to ${jj.term.colorCodeGreen + process.cwd() + jj.term.colorCodeDefaultColor}\n`
            });
        }
    })
    res(menu);
}, { __noPrintOnSelect: true, __showLoadingAfter: 150 })];

module.exports.fileViewer2 = ["ls dir and less file from directory", $$(async (res) => {
    const lsc = await __(`ls -al`, { __splitAll });
    const ls = lsc.filter((_, index) => { return index > 1 });
    const menu = {};
    ls.forEach(line => {
        const file = line[line.length - 1];
        if (line[0].startsWith('-'))
            menu[file] = [`less ${file}`,
            $$$(async () => { await _`bat ${file}`; jj.stay(); }, { __noPrintOnSelect: true })]
        else {
            menu[`${file}/`] = $$$(() => {
                process.chdir(file);
                jj.stay();
            }, { __noPrintOnSelect: true });
        }
    })
    res(menu);
}, { __noPrintOnSelect: true, __showLoadingAfter: 150 })];