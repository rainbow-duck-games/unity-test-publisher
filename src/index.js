const core = require('@actions/core');
const glob = require('@actions/glob');
const action = require('./action');

(async () => {
    try {
        const githubToken = core.getInput('githubToken', { required: true });
        const reportPaths = core.getInput('reportPaths', { required: true });
        const workdirPrefix = core.getInput('workdirPrefix');
        const checkName = core.getInput('checkName');
        const checkFailedStatus = core.getInput('checkFailedStatus');
        const failOnFailedTests = core.getInput('failOnTestFailures') === 'true';
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';

        core.info(`Lookup for files matching: ${reportPaths}...`);
        const globber = await glob.create(reportPaths, { followSymbolicLinks: false });
        const results = await globber.glob();
        core.info(`Matched files: ${results}`);

        await action(checkName, checkFailedStatus, './artifacts/playmode-results.xml', workdirPrefix, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
