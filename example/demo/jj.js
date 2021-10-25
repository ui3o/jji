const { test_from_simple } = require('./simple.module');

process.env.HELLO = 'hello';
process.env.WORLD = 'world';

module.exports.prom = $$(async (res) => {
    const a = await __`sleep 10`
    const menu = {
        a: ['a menu', $$$(async () => {
            const rl = await jj.rl('Type name: ');
            process.stdout.write(`Hello ${rl}!\n`);
            jj.stay();
        }, { __needInput: true })]
    }

    setTimeout(() => {
        res(menu)
    }, 6000);
})
module.exports.USE_require_in_jj_js = test_from_simple
module.exports.sub_menu_test = [`sub menu test description`, {
    run: ['run comment', 'echo', {
        a: 'if only one string param exist that will be the command',
        b: 'if string is specified the program join them and run',
        c: ['if the command is null that means not selectable, just an information', null],
        lazy_test: ['load lazy menu item', $$((res) => {
            setTimeout(() => {
                res({
                    simple_echo: "echo lazy test",
                    simple_eval_a_function: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                    async_load: ['load async menu item', $((res) => {
                        setTimeout(() => {
                            res({
                                echo_test: "echo lazy test",
                                eval_test: () => { console.log('simple eval'); _`sleep 3 && echo hello world`; },
                            })
                        }, 3000);
                    })]
                })
            }, 1411);
        })]
    }],
    eval: ['description: eval a javascript code', () => { console.log('simple eval') }],
    find: [`find files desc`, `find . -type f -exec echo file from jj.js: {} \\;`],
    roo: "echo simple run an echo",
}]
module.exports.multiline = {
    var: {
        echo_process_env: [`echo process env var`, () => {
            console.log('console log env var and run echo');
            process.env.HELLO = 'hello';
            process.env.WORLD = 'world';
            _`echo $HELLO && echo $WORLD`;
        }],
        echo_with_echo_command: [`echo process env var`, `
                echo $HELLO;
                echo $WORLD`]
    },
    // possible to create multi line command which will compiled to single line
    command: [`multiline description`, `for i in \`seq 1 10\`; 
                do 
                    echo s$i;
                done`]
}
module.exports.run = ["run simple javascript code", () => { console.log('simple1 eval') }]
module.exports.run_eval_and_stay = ["run simple javascript code and stay in the same level in the menu", () => { console.log('simple eval and reopen the menu'); jj.stay() }]
module.exports.run_eval_and_home = ["run simple javascript code and jump to root level in the menu", () => { console.log('simple eval and jump to root in the menu'); jj.home() }]
module.exports.run_eval_and_readline = ["run simple javascript code and read line inside", $$$(async () => {
    const name = await jj.rl('Please type your name: ');
    console.log(`Hi ${name}!`);
}, { __needInput })]
module.exports.run_and_parse = ["run and echo and parse output", async () => {
    const l = await __(`docker exec alpine sh -c`, [`ls -al`], { __splitByLine });
    console.log(l);
}]
module.exports.parse_tester = ["run and echo and parse output", $$(async (res) => {
    setTimeout(async () => {
        res({
            all_split: async () => {
                const a = await __(`echo ${false} && echo other done other`, { __splitAll: true }); console.log(a[0][0]);
                jj.stay();
            },
            line_split: async () => {
                const a = await __(`echo ${false} && echo other done other`, { __splitByLine: true }, 'done'); console.log(a[1]);
                jj.stay();
            },
            no_split: async () => {
                const a = await __`echo ${false} && echo other done other`; console.log(a);
                jj.home();
            }
        })
    }, 1000);
})]
module.exports.simple_null = null;
module.exports.null_with_desc = ["not selectable menu item", null];
module.exports.lazy_clear = {
    show_with_clear: ['when the menu clear back the last menu size ', $$(async (res) => {
        console.log('You have to see number 10 on screen. If you can not the menu clear back last menu size');
        for (let index = 0; index < 10; index++) {
            console.log(index + 1);
        }
        res({ do_nothing: null });
    })],
    show_without_clear: ['when the menu NOT clear back the last menu size ', $$(async (res) => {
        console.log('You have to see number 10 on screen');
        for (let index = 0; index < 10; index++) {
            console.log(index + 1);
        }
        res({ do_nothing: null });
    }, { __resetMenuPos })]
};