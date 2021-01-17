const fs = require('fs');
const xmljs = require('xml-js');

let action = async function (path) {
    const file = await fs.promises.readFile(path);
    const report = xmljs.xml2js(file, {compact: true});
    console.log(`File ${path} parsed:`);
    console.log(JSON.stringify(report));
};

module.exports = action;