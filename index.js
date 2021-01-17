const core = require('@actions/core');
const action = require('./action');

(async () => {
    try {
        core.info("Starting analyze...");
        await action();
    } catch (e) {
        core.setFailed(e.message);
    }
})();
