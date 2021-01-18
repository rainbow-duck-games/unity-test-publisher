const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        const githubToken = core.getInput('githubToken', {required: true});
        const editModeReport = core.getInput('editModeReport');
        const playModeReport = core.getInput('playModeReport');
        const workdirPrefix = core.getInput('workdirPrefix');
        const failOnFailedTests = core.getInput('failOnTestFailures') === 'true';
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';
        core.info(`Starting analyze ${editModeReport} and ${playModeReport}...`);
        await action(editModeReport, playModeReport, workdirPrefix, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
