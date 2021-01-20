const core = require(`@actions/core`);
const action = require(`./action`);

(async () => {
    try {
        const githubToken = core.getInput(`githubToken`, {required: true});
        const report = core.getInput(`report`, {required: true});
        const workdirPrefix = core.getInput(`workdirPrefix`);
        const name = core.getInput(`checkName`);
        const failOnFailedTests = core.getInput(`failOnTestFailures`) === `true`;
        const failIfNoTests = core.getInput(`failIfNoTests`) === `true`;
        core.info(`Starting analyze ${report}...`);
        await action(name, report, workdirPrefix, githubToken, failOnFailedTests, failIfNoTests);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
