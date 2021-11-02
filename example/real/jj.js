
module.exports.less = ["less file from directory", ff.menu.noHeader.do(async (res) => {
    const ls = await jj.cli.splitByLine.do(`find . -maxdepth 1 -type f`);
    const menu = {};
    ls.forEach(line => {
        menu[line] = ff.stay.do(async () => { await jj.cl.do`less ${line}`; })
    });
    res(menu);
})];

module.exports.fileViewer = ["ls dir and less file from directory", ff.lazy.noHeader.showLoadingAfter(150).do(async (res) => {
    const lsc = await jj.cli.splitAll.do(`ls -al`);
    const ls = lsc.filter((_, index) => { return index > 1 });
    const menu = {};
    ls.forEach(line => {
        const file = line[line.length - 1];
        if (line[0].startsWith('-'))
            menu[file] = [`less ${file}`,
            ff.stay.noHeader.do(async () => { await jj.cl.do`less ${file}`; })]
        else {
            menu[`${file}/`] = ff.stay
                .header(() => `changing directory from ${jj.term.colorCodeYellow + process.cwd() + jj.term.colorCodeDefaultColor}\n`)
                .footer(() => `to ${jj.term.colorCodeGreen + process.cwd() + jj.term.colorCodeDefaultColor}\n`)
                .do(() => {
                    process.chdir(file);
                });
        }
    })
    res(menu);
})];

module.exports.fileViewer2 = ["ls dir and less file from directory", ff.lazy.noHeader.showLoadingAfter(150).do(async (res) => {
    const lsc = await jj.cli.splitAll.do(`ls -al`);
    const ls = lsc.filter((_, index) => { return index > 1 });
    const menu = {};
    ls.forEach(line => {
        const file = line[line.length - 1];
        if (line[0].startsWith('-'))
            menu[file] = [`less ${file}`,
            ff.noHeader.stay.do(async () => { await jj.cl.do`bat ${file}`; })]
        else {
            menu[`${file}/`] = ff.stay.noHeader.do(() => {
                process.chdir(file);
            });
        }
    })
    res(menu);
})];