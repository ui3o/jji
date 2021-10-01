const path = require('path');
const fs = require('fs');

/**
 * Find files from directory
 * 
 * ex. fromDir('.html'); or fromDir('.html', '../LiteScript');
 * 
 * @param {string} endWith : end of file;
 * @param {*} startPath : which folder or by default current folder 
 * @returns `array` with file path `or` `undefined`
 */
module.exports.fromDir = (endWith, startPath = process.cwd()) => {
    const foundFiles = [];
    if (!fs.existsSync(startPath)) {
        console.error("no dir ", startPath);
        return;
    }

    const files = fs.readdirSync(startPath);
    for (let i = 0; i < files.length; i++) {
        const filename = path.join(startPath, files[i]);
        var stat = fs.lstatSync(filename);
        if (!stat.isDirectory() && filename.endsWith(endWith)) {
            foundFiles.push(path.resolve(filename));
        }
    }
    return !foundFiles.length ? undefined : foundFiles;
};
