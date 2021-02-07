import * as core from '@actions/core';
import * as glob from '@actions/glob';
import {cleanPaths, createCheck} from './action';
import {parseReport} from './report';
import {Annotation, SuiteMeta, TestMeta} from './meta.model';

async function run(): Promise<void> {
    try {
        // Get all report files
        const reportPaths = core.getInput('reportPaths', {required: true});
        core.info(`Lookup for files matching: ${reportPaths}...`);
        const globber = await glob.create(reportPaths, {
            followSymbolicLinks: false,
        });
        const data = [];
        for await (const file of globber.globGenerator()) {
            core.info(`Processing file ${file}...`);
            const fileData = await parseReport(file);
            core.info(fileData.getSummary());
            data.push(fileData);
        }

        // Prepare report settings
        const checkName = core.getInput('checkName');
        const checkFailedStatus = core.getInput('checkFailedStatus');
        const failIfNoTests = core.getInput('failIfNoTests') === 'true';

        const summary = data.reduce((acc, suite) => {
            acc.total += suite.total;
            acc.passed += suite.passed;
            acc.skipped += suite.skipped;
            acc.failed += suite.failed;
            acc.duration += suite.duration;
            acc.addChild(suite);
            return acc;
        }, new SuiteMeta('run'));

        // Convert meta
        const conclusion =
            summary.failed === 0 && (summary.total > 0 || !failIfNoTests)
                ? 'success'
                : checkFailedStatus;
        core.info('=================');
        core.info('Analyze result:');
        core.info(summary.getSummary());

        if (failIfNoTests && summary.total === 0) {
            core.setFailed('Not tests found in the report!');
            return;
        }

        // Create check
        const githubToken = core.getInput('githubToken', {required: true});
        const workdirPrefix = core.getInput('workdirPrefix');
        const annotations = extractAnnotations(summary);
        cleanPaths(annotations, workdirPrefix);
        await createCheck(
            githubToken,
            checkName,
            summary,
            annotations,
            conclusion
        );

        const failOnFailed = core.getInput('failOnTestFailures') === 'true';
        if (failOnFailed && summary.failed > 0) {
            core.setFailed(`There were ${summary.failed} failed tests`);
        }
    } catch (e) {
        core.setFailed(e);
    }
}

function extractAnnotations(suite: SuiteMeta): Annotation[] {
    const result = [] as Annotation[];
    for (const child of suite.children) {
        if (child instanceof TestMeta && child.annotation !== undefined) {
            result.push(child.annotation);
        } else if (child instanceof SuiteMeta) {
            result.push(...extractAnnotations(child));
        }
    }
    return [];
}

run();
