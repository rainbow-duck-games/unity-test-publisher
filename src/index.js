const core = require('@actions/core');
const glob = require('@actions/glob');
const { cleanPaths, createCheck } = require('./action');
const { getReport } = require('./report');

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
        const meta = {
            total: 0,
            passed: 0,
            skipped: 0,
            failed: 0
        };
        const annotations = [];
        for await (const file of globber.globGenerator()) {
            core.info(`Processing file ${file}...`);
            const { fileMeta, fileAnnotations } = await getReport(file, failIfNoTests);
            core.info(`Result: ${fileMeta.passed} / ${fileMeta.total}, skipped ${fileMeta.skipped}, failed ${fileMeta.failed}`);

            meta.total += fileMeta.total;
            meta.passed += fileMeta.passed;
            meta.skipped += fileMeta.skipped;
            meta.failed += fileMeta.failed;

            annotations.push(...fileAnnotations);
        }

        // Convert meta
        const results = `${meta.result}: tests: ${meta.total}, skipped: ${meta.skipped}, failed: ${meta.failed}`;
        const conclusion = meta.failed === 0 && (meta.total > 0 || !failIfNoTests) ? 'success' : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(results);

        if (failIfNoTests && meta.total === 0) {
            core.setFailed('Not tests found in the report!');
            return;
        }

        cleanPaths(annotations, workdirPrefix);
        await createCheck(githubToken, checkName, results, failIfNoTests, conclusion, annotations);

        if (failOnFailedTests && meta.failed > 0) {
            core.setFailed(`There were ${meta.failed} failed tests`);
        }
    } catch (e) {
        core.setFailed(e.message);
    }
})();
