module.exports.mas_all = $('ten sec later load desc', (res) => {
    setTimeout(() => {
        res({
            ten_sec_test_run: "echo lazy test",
            ten_sec_test_all_run: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
        })
    }, 10000);
})
