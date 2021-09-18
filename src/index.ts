import * as core from '@actions/core';
import * as glob from '@actions/glob';
import {cleanPaths, createCheck} from './action';
import {parseReport} from './report';
import {RunMeta} from './meta';

async function run(): Promise<void> {
    try {
        // Get all report files
        const workspace =
            core.getInput('reportWorkspace') ||
            (process.env['GITHUB_WORKSPACE'] as string);
        const reportPaths = core.getInput('reportPaths', {required: true});
        const lookup = `${workspace}/${reportPaths}`;
        core.info(`Lookup for files matching: ${lookup}...`);
        const globber = await glob.create(lookup, {
            followSymbolicLinks: false,
        });

        // Parse all reports
        const runs = [];
        for await (const path of globber.globGenerator()) {
            const filename = path.replace(workspace, '');
            core.startGroup(`Processing file ${filename}...`);
            const fileData = await parseReport(path, filename);
            core.info(fileData.summary);
            runs.push(fileData);
            core.endGroup();
        }

        // Prepare report settings
        const checkName = core.getInput('checkName');
        const checkFailedStatus = core.getInput('checkFailedStatus');
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';

        const summary = runs.reduce((acc, suite) => {
            acc.total += suite.total;
            acc.passed += suite.passed;
            acc.skipped += suite.skipped;
            acc.failed += suite.failed;
            acc.duration += suite.duration;
            for (const s of suite.suites) {
                acc.addTests(s.tests);
            }
            return acc;
        }, new RunMeta(checkName));

        // Convert meta
        const conclusion =
            summary.failed === 0 && (summary.total > 0 || !failIfNoTests)
                ? 'success'
                : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(summary.summary);

        if (failIfNoTests && summary.total === 0) {
            core.setFailed('Not tests found in the report!');
            return;
        }

        // Create check
        const githubToken = core.getInput('githubToken', {required: true});
        const workdirPrefix = core.getInput('workdirPrefix');
        const annotations = summary.extractAnnotations();
        cleanPaths(annotations, workdirPrefix);
        await createCheck(
            githubToken,
            checkName,
            summary.summary,
            conclusion,
            runs,
            annotations
        );

        const failOnFailed = core.getInput('failOnTestFailures') === 'true';
        if (failOnFailed && summary.failed > 0) {
            core.setFailed(`There were ${summary.failed} failed tests`);
        }
    } catch (e) {
        core.setFailed(e as Error);
    }
}

run();
