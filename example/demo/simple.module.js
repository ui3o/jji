const use_boolean = true;
const use_string = 'other';
const use_env_var = () => { return `${use_string} else` }

module.exports.test_from_simple = ff.do(async () => {
    process.env.use_env_var = use_string;
    await jj.cl.do('echo extra ', false);
    await jj.cl.do(`echo hii ${use_boolean} space ${use_env_var()}`);
})
