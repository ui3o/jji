
module.exports.less = ["less file from directory", $(async (res) => {
    const ls = await __`find . -maxdepth 1 -type f`;
    const menu = {};
    ls.forEach(line => {
        line.forEach(item => {
            menu[item] = async () => { await _`less ${item}`; jj.stay(); }
        })
    });
    res(menu);
})];

module.exports.fileViewer = ["ls dir and less file from directory", $$(async (res) => {
    const lsc = await __`ls -al`;
    const ls = lsc.filter((_, index) => { return index > 1 });
    const menu = {};
    ls.forEach(line => {
        const file = line[line.length - 1];
        if (line[0].startsWith('-'))
            menu[file] = [`less ${file}`, async () => { await _`less ${file}`; jj.stay(); }]
        else
            menu[`${file}/`] = () => {
                process.chdir(file);
                jj.stay();
            }
    })
    res(menu);
})];