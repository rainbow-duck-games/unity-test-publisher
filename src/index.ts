import * as core from '@actions/core';
import * as glob from '@actions/glob';
import {cleanPaths, createCheck} from './action';
import {parseReport} from './report';
import {Meta} from './meta';

async function run(): Promise<void> {
    try {
        // Get all report files
        const reportPaths = core.getInput('reportPaths', {required: true});
        core.info(`Lookup for files matching: ${reportPaths}...`);
        const globber = await glob.create(reportPaths, {
            followSymbolicLinks: false,
        });
        const data = new Meta();
        for await (const file of globber.globGenerator()) {
            core.info(`Processing file ${file}...`);
            const fileData = await parseReport(file);
            core.info(fileData.getSummary());
            data.addChild(fileData);
        }

        // Prepare report settings
        const checkName = core.getInput('checkName');
        const checkFailedStatus = core.getInput('checkFailedStatus');
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';

        // Convert meta
        const conclusion =
            data.failed === 0 && (data.total > 0 || !failIfNoTests)
                ? 'success'
                : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(data.getSummary());

        if (failIfNoTests && data.total === 0) {
            core.setFailed('Not tests found in the report!');
            return;
        }

        // Create check
        const githubToken = core.getInput('githubToken', {required: true});
        const workdirPrefix = core.getInput('workdirPrefix');
        cleanPaths(data.annotations, workdirPrefix);
        await createCheck(githubToken, checkName, data, conclusion);

        const failOnFailed = core.getInput('failOnTestFailures') === 'true';
        if (failOnFailed && data.failed > 0) {
            core.setFailed(`There were ${data.failed} failed tests`);
        }
    } catch (e) {
        core.setFailed(e);
    }
}

run();
