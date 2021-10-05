module.exports.mas_all = $$((res) => {
    setTimeout(() => {
        res({
            ten_sec_test_run: "echo lazy test",
            ten_sec_test_all_run: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
            test_later: $((res) => {
                setTimeout(() => {
                    res({
                        test_run: "echo lazy test",
                        test_all_run: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                    })
                }, 5000);
            }, 'later load desc')
        })
    }, 6000);
}, 'ten sec later load desc')
