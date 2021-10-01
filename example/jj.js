const { a } = require('./simple.module');

process.env.HELLO = 'hello';
process.env.WORLD = 'world';

module.exports.call = a
module.exports.test = [`test description`, {
    run: ['run comment', 'echo command', {
        a: 'run test for A option',
        b: 'run test for B option'
    }],
    eval: ['eval description', () => { console.log('simple eval') }],
    find: [`find desc`, `find . -type f -exec echo file from jj.js: {} \\;`],
    roo: "echo ... jj.js: run test for test:roo ...",
    ruu: ["echo ... jj.js: run test for test:ruu ...", () => { console.log('simple eval'); }]
}]
module.exports.multiline = {
    var: {
        create: [`create env var`, () => {
            console.log('create env var');
            process.env.HELLO = 'hello';
            process.env.WORLD = 'world';
            _`echo $HELLO && echo $WORLD`;
        }],
        echo: [`echo var:echo`, `
                echo $HELLO;
                echo $WORLD`]
    },
    // possible to create multi line command which will compiled to single line
    command: [`multiline description`, `for i in \`seq 1 10\`; 
                do 
                    echo s$i;
                done`]
}
module.exports.test_run0 = ["jj test.r*", () => { console.log('simple1 eval') }]
module.exports.test_run1 = ["jj test.r*", () => {
    const a = __`sleep 3 && echo done && echo other done other`; console.log(a[0][0]);
}]
module.exports.test_run = "echo test.r*"
module.exports.test_all_run = "echo test.run.*"
module.exports.test_all = "echo test**"
