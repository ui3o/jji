const { a } = require('./simple.module');

process.env.HELLO = 'hello';
process.env.WORLD = 'world';

module.exports.use_require_in_jj_js = a
module.exports.sub_menu_test = [`sub menu test description`, {
    run: ['run comment', 'echo', {
        a: 'if only one string param exist that will be the command',
        b: 'if string is specified the program join them and run'
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
module.exports.run_and_parse = ["run and echo and parse output", () => {
    const a = __`sleep 3 && echo done && echo other done other`; console.log(a[0][0]);
}]
