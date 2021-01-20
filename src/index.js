const core = require('@actions/core');
const glob = require('@actions/glob');
const { cleanPaths, createCheck } = require('./action');
const { getReport, getReportData } = require('./report');

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
        const data = getReportData();
        for await (const file of globber.globGenerator()) {
            core.info(`Processing file ${file}...`);
            const fileData = await getReport(file, failIfNoTests);
            core.info(data.summary());

            data.total += fileData.meta.total;
            data.passed += fileData.meta.passed;
            data.skipped += fileData.meta.skipped;
            data.failed += fileData.meta.failed;

            data.annotations.push(...fileData.annotations);
        }

        // Convert meta
        const conclusion = data.failed === 0 && (data.total > 0 || !failIfNoTests) ? 'success' : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(data.summary());

        if (failIfNoTests && data.total === 0) {
            core.setFailed('Not tests found in the report!');
            return;
        }

        cleanPaths(data.annotations, workdirPrefix);
        await createCheck(githubToken, checkName, data, conclusion);

        if (failOnFailedTests && data.failed > 0) {
            core.setFailed(`There were ${data.failed} failed tests`);
        }
    } catch (e) {
        core.setFailed(e);
    }
})();
