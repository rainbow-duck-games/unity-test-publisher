const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        const githubToken = core.getInput('githubToken');
        const report = core.getInput('report');
        const workdirPrefix = core.getInput('workdirPrefix'); // TODo
        const name = core.getInput('checkName');
        const failOnFailedTests = core.getInput('failOnTestFailures');
        const failIfNoTests = core.getInput('failIfNoTests');
        core.info(`Starting analyze ${report}...`);
        await action(name, report, workdirPrefix, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
