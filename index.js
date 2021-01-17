const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        const report = core.getInput('report');
        const githubToken = core.getInput('github_token');
        const failOnFailedTests = core.getInput('fail_on_test_failures');
        const failIfNoTests = core.getInput('fail_if_no_tests');
        core.info(`Starting analyze ${report}...`);
        await action(report, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
