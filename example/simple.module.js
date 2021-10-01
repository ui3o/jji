const aTrue = true;
const aOther = 'other';
const wow = () => { return `${aOther} else` }

module.exports.a = () => {
    process.env.wow = aOther
    _('echo extra ', false)
    _`echo hii ${aTrue} space ${wow()}`
}
