const { test_from_simple } = require('./simple.module');

const env = process.env;
process.env.HELLO = 'hello';
process.env.WORLD = 'world';

module.exports.log = ff.stay.do(async () => {
    await jj.clf.handler((c, t, d) => {
        if (t === 0 && d === '\r') return false;
    }).do`docker logs -f --tail 5000 redis`;
});

module.exports.messenger = ff.menu.do(async (res) => {
    jj.message(`Update ${jj.term.fc.red}need!`);
    setTimeout(() => {
        jj.message(`Update ${jj.term.fc.red}need again!`);
    }, 1500);
    res({ submenu: undefined })
});

module.exports.prom = ff.lazy.printSelect.do(async (res) => {
    await jj.cl.do`sleep 1`
    const menu = {
        a: ['a menu', ff.useIn.stay.do(async () => {
            const rl = await jj.rl('Type name: ');
            process.stdout.write(`Hello ${rl}!\n`);
        })]
    }

    setTimeout(() => {
        res(menu)
    }, 1000);
});
module.exports.lazy_in_lazy = ff.lazy.printSelect.do(async (res) => {
    await jj.cl.do`sleep 1`
    const menu = {
        a: ['a menu', ff.lazy.stay.do(async (r) => {
            setTimeout(() => {
                r({
                    c: ff.lazy.do(async (re) => {
                        setTimeout(() => {
                            re({ nothing: null });
                        }, 1000);
                    })
                })
            }, 1000);
        })],
        b: ['b menu', ff.lazy.stay.do(async (r) => {
            setTimeout(() => {
                r({ nothing: null })
            }, 1000);
        })]
    }
    setTimeout(() => {
        res(menu)
    }, 1000);
})
module.exports.USE_require_in_jj_js = test_from_simple
module.exports.sub_menu_test = [`sub menu test description`, {
    run: ['run comment', 'echo', {
        a: 'if only one string param exist that will be the command',
        b: 'if string is specified the program join them and run',
        c: ['if the command is null that means not selectable, just an information', null],
        lazy_test: ['load lazy menu item', ff.lazy.do((res) => {
            setTimeout(() => {
                res({
                    simple_echo: "echo lazy test",
                    simple_eval_a_function: ff.do(async () => { console.log('simple eval'); await jj.cl.do`sleep 3`; await jj.cl.do`echo hello world`; }),
                    async_load: ['load async menu item', ff.menu.do((res) => {
                        setTimeout(() => {
                            res({
                                echo_test: "echo lazy test",
                                eval_test: ff.do(async () => { console.log('simple eval'); await jj.cl.do`sleep 3`; await jj.cl.do`echo hello world`; }),
                            })
                        }, 3000);
                    })]
                })
            }, 1411);
        })]
    }],
    eval: ['description: eval a javascript code', ff.do(() => { console.log('simple eval') })],
    find: [`find files desc`, `find . -type f -exec echo file from jj.js: {} ;`],
    roo: "echo simple run an echo",
}]

module.exports.multiline = {
    var: {
        echo_process_env: [`echo process env var`, ff.do(async () => {
            console.log('console log env var and run echo');
            await jj.cl.do`echo ${env.HELLO} ${env.WORLD}`;
        })],
        echo_with_echo_command: [`echo process env var`, ff.do(async () => {
            await jj.cl.do(`sh -c`, [`echo $HELLO $WORLD`])
        })]
    },
    // possible to create multi line command which will compiled to single line
    command: [`multiline description`, ff.do(async () => {
        await jj.cl.do(`sh -c`, [` for i in \`seq 1 10\`; 
                            do 
                                echo s$i;
                            done`]);
    })]
}
module.exports.run = ["run simple javascript code", ff.do(() => { console.log('simple1 eval') })]
module.exports.run_eval_and_stay = ["run simple javascript code and stay in the same level in the menu", ff.stay.do(() => { console.log('simple eval and reopen the menu'); })]
module.exports.run_eval_and_home = ["run simple javascript code and jump to root level in the menu", ff.home.do(() => { console.log('simple eval and jump to root in the menu'); })]
module.exports.run_eval_and_readline = ["run simple javascript code and read line inside", ff.useIn.stay.do(async () => {
    const name = await jj.rl('Please type your name: ');
    console.log(`Hi ${name}!`);
})]

module.exports.run_and_parse = ["run and echo and parse output", ff.do(async () => {
    const l = await jj.cli.splitByLine.do(`docker run alpine sh -c`, [`ls -al`]);
    console.log(l);
})]

module.exports.parse_tester = ["run and echo and parse output", ff.lazy.do(async (res) => {
    setTimeout(async () => {
        res({
            all_split: ff.stay.do(async () => {
                const a = await jj.cli.splitAll.do(`echo ${false} hi && echo other done other`);
                console.log(a[0][0]);
            }),
            line_split: ff.stay.do(async () => {
                const a = await jj.cli.splitByLine.do(`sh -c`, [`echo ${false} hi && echo other done other`]);
                console.log(a[0]);
            }),
            no_split: ff.home.do(async () => {
                const a = await jj.cli.do(`sh -c`, [`echo ${false} hi && echo other done other`]);
                console.log(a);
            })
        })
    }, 1000);
})]
module.exports.simple_null = null;
module.exports.null_with_desc = ["not selectable menu item", null];
module.exports.lazy_clear = {
    show_with_clear: ['when the menu clear back the last menu size ', ff.lazy.do(async (res) => {
        console.log('You have to see number 10 on screen. If you can not the menu clear back last menu size');
        for (let index = 0; index < 10; index++) {
            console.log(index + 1);
        }
        res({ do_nothing: null });
    })],
    show_without_clear: ['when the menu NOT clear back the last menu size ', ff.lazy.resetMenu.do(async (res) => {
        console.log('You have to see number 10 on screen');
        for (let index = 0; index < 10; index++) {
            console.log(index + 1);
        }
        res({ do_nothing: null });
    })]
};

