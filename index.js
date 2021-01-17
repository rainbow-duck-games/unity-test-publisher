const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        const report = core.getInput('report');
        core.info(`Starting analyze ${report}...`);
        await action(report);
    } catch (e) {
        core.setFailed(e.message);
    }
})();
