module.exports.later_load = ['later load menu item description', $((res) => {
    setTimeout(() => {
        res({
            echo_test: "echo simple echo test",
            test_eval: () => { console.log('simple eval'); _(`sh -c`, [`sleep 3 && echo hello world`]); },
            test_later_load: ['another later load desc.', $((res) => {
                setTimeout(() => {
                    res({
                        test_echo: "echo lazy test",
                        eval_test: () => { console.log('simple eval'); _(`sh -c`, [`sleep 3 && echo hello world`]); },
                    })
                }, 3000);
            })]
        })
    }, 3000);
})]
