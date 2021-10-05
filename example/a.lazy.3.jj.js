module.exports.as_all = $('later load desc', (res) => {
    setTimeout(() => {
        res({
            test_run: "echo lazy test",
            test_all_run: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
            test_later: $('later load desc', (res) => {
                setTimeout(() => {
                    res({
                        test_run: "echo lazy test",
                        test_all_run: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                    })
                }, 5000);
            })
        })
    }, 5000);
})
