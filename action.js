const core = require('@actions/core');
const fs = require('fs');
const xmljs = require('xml-js');

let action = async function (path, githubToken, failOnFailedTests = false, failIfNoTests = true) {
    const file = await fs.promises.readFile(path);
    const report = xmljs.xml2js(file, {compact: true});

    // Process results
    core.info(`File ${path} parsed...`);
    const meta = report['test-run'];
    if (!meta) {
        core.error('No metadata found in the file');
        if (failIfNoTests) {
            core.setFailed(`Not tests found in the report!`);
        }
        return;
    }

    let results = `${meta.result}: tests: ${meta.total}, skipped: ${meta.skipped}, failed: ${meta.failed}`;
    core.info(results);

    if (failOnFailedTests && meta.result !== 'Passed') {
        core.setFailed(`There were ${meta.failed} failed tests`);
    }
};

module.exports = action;