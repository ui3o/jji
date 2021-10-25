module.exports.lazy_test = ['load lazy menu item', $$((res) => {
    process.env.__shell = true;
    setTimeout(() => {
        res({
            simple_echo: "echo lazy test",
            simple_eval_a_function: async () => { console.log('simple eval'); await _`sleep 3 && echo hello world`; },
            async_load: ['load async menu item', $((res) => {
                setTimeout(() => {
                    res({
                        echo_test: "echo lazy test",
                        eval_test: async () => { console.log('simple eval'); await _`sleep 3 && echo hello world`; },
                    })
                }, 3000);
            })]
        })
    }, 1400);
})]
