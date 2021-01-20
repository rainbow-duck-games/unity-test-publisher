const core = require('@actions/core');
const fs = require('fs');
const xmljs = require('xml-js');
const converter = require('./converter');

const getReport = async function (path) {
    core.debug(`Try to open ${path}`);
    const file = await fs.promises.readFile(path);
    const report = xmljs.xml2js(file, { compact: true });

    // Process results
    core.debug(`File ${path} parsed...`);
    const meta = report['test-run']._attributes;
    if (!meta) {
        core.error('No metadata found in the file - path');
        return { meta: { total: 0, passed: 0, skipped: 0, failed: 0 }, annotations: [] };
    }

    return {
        meta,
        annotations: converter.convertReport(report)
    };
};

module.exports = { getReport };
