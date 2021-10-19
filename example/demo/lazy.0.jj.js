module.exports.lazy_test = $$((res) => {
    setTimeout(() => {
        res({
            simple_echo: "echo lazy test",
            simple_eval_a_function: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
            async_load: $((res) => {
                setTimeout(() => {
                    res({
                        echo_test: "echo lazy test",
                        eval_test: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                    })
                }, 3000);
            }, 'load async menu item')
        })
    }, 1400);
}, 'load lazy menu item')
