import * as core from '@actions/core';
import * as glob from '@actions/glob';
import {cleanPaths, createCheck} from './action';
import {getDataSummary, getReportDataModel, getDataModel} from './report';

async function run(): Promise<void> {
    try {
        const githubToken = core.getInput('githubToken', {required: true});
        const reportPaths = core.getInput('reportPaths', {required: true});
        const workdirPrefix = core.getInput('workdirPrefix');
        const checkName = core.getInput('checkName');
        const checkFailedStatus = core.getInput('checkFailedStatus');
        const failOnFailedTests =
            core.getInput('failOnTestFailures') === 'true';
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';

        core.info(`Lookup for files matching: ${reportPaths}...`);
        const globber = await glob.create(reportPaths, {
            followSymbolicLinks: false
        });
        const data = getDataModel();
        for await (const file of globber.globGenerator()) {
            core.info(`Processing file ${file}...`);
            const fileData = await getReportDataModel(file);
            core.info(getDataSummary(fileData));

            // ToDo Extract to some utility
            data.meta.total += fileData.meta.total;
            data.meta.passed += fileData.meta.passed;
            data.meta.skipped += fileData.meta.skipped;
            data.meta.failed += fileData.meta.failed;

            data.annotations.push(...fileData.annotations);
        }

        // Convert meta
        const conclusion =
            data.failed === 0 && (data.total > 0 || !failIfNoTests)
                ? 'success'
                : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(getDataSummary(data));

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
}

run();
