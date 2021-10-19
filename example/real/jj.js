
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