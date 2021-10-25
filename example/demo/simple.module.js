const use_boolean = true;
const use_string = 'other';
const use_env_var = () => { return `${use_string} else` }

module.exports.test_from_simple = async () => {
    process.env.use_env_var = use_string;
    await _('echo extra ', false);
    await _`echo hii ${use_boolean} space ${use_env_var()}`;
}
