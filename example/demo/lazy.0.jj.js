module.exports.lazy_test = ['load lazy menu item', ff.lazy.do((res) => {
    setTimeout(() => {
        res({
            simple_echo: ss("echo lazy test"),
            simple_eval_a_function: ff.do(async () => { console.log('simple eval'); await jj.cl.do('sh -c', [`sleep 3 && echo hello world`]); }),
            async_load: ['load async menu item', ff.menu.do((res) => {
                setTimeout(() => {
                    res({
                        echo_test: ss("echo lazy test"),
                        eval_test_eval: ff.do(async () => { console.log('simple eval'); await jj.cl.do('sh -c', [`sleep 3 && echo hello world`]); }),
                    })
                }, 3000);
            })]
        })
    }, 1400);
})]
