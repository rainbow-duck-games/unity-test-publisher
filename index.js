const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        const githubToken = core.getInput('githubToken');
        const editModeReport = core.getInput('editModeReport');
        const playModeReport = core.getInput('playModeReport');
        const workdirPrefix = core.getInput('workdirPrefix');
        const failOnFailedTests = core.getInput('failOnTestFailures');
        const failIfNoTests = core.getInput('failIfNoTests');
        core.info(`Starting analyze ${report}...`);
        await action(editModeReport, playModeReport, workdirPrefix, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
