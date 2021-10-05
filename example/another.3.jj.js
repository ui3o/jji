module.exports.later_load = $((res) => {
    setTimeout(() => {
        res({
            echo_test: "echo simple echo test",
            test_eval: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
            test_later_load: $((res) => {
                setTimeout(() => {
                    res({
                        test_echo: "echo lazy test",
                        eval_test: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                    })
                }, 3000);
            }, 'another later load desc.')
        })
    }, 3000);
}, 'later load menu item description')
