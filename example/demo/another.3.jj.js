module.exports.later_load = ['later load menu item description', ff.menu.do((res) => {
    setTimeout(() => {
        res({
            echo_test: ss("echo simple echo test"),
            test_eval: ff.do(async () => { console.log('simple beval'); await jj.cl.do(`sh -c`, [`sleep 3 && echo hello world`]); }),
            test_later_load: ['another later load desc.', ff.menu.do((res) => {
                setTimeout(() => {
                    res({
                        test_echo: ss("echo lazy test"),
                        eval_test: ff.do(async () => { console.log('simple eval'); await jj.cl.do(`sh -c`, [`sleep 3 && echo hello world`]); }),
                    })
                }, 3000);
            })]
        })
    }, 3000);
})]
