const { test_from_simple } = require('./simple.module');

process.env.HELLO = 'hello';
process.env.WORLD = 'world';

module.exports.USE_require_in_jj_js = test_from_simple
module.exports.sub_menu_test = [`sub menu test description`, {
    run: ['run comment', 'echo', {
        a: 'if only one string param exist that will be the command',
        b: 'if string is specified the program join them and run',
        c: ['if the command is null that means not selectable, just an information', null]
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
module.exports.run_eval_and_readline = ["run simple javascript code and read line inside", async () => {
    const name = await jj.rl('Please type your name: ');
    console.log(`Hi ${name}!`); jj.stay()
}]
module.exports.run_and_parse = ["run and echo and parse output", () => {
    const a = __`sleep 3 && echo done && echo other done other`; console.log(a[0][0]);
}]
module.exports.simple_null = null;
module.exports.null_with_desc = ["not selectable menu item", null];