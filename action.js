const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const xmljs = require('xml-js');

let action = async function (path, githubToken, failOnFailedTests = false, failIfNoTests = true) {
    core.info(`Try to open ${path}`);
    const file = await fs.promises.readFile(path);
    const report = xmljs.xml2js(file, {compact: true});

    // Process results
    core.info(`File ${path} parsed...`);
    const meta = report['test-run']._attributes;
    if (!meta) {
        core.error('No metadata found in the file');
        if (failIfNoTests) {
            core.setFailed(`Not tests found in the report!`);
        }
        return;
    }

    // TODo
    const annotations = [];
    annotations.push({
        path: 'unity-project/Assets/Tests/SamplePlayModeTest.cs',
        start_line: 7,
        end_line: 9,
        annotation_level: 'failure',
        title: 'Test failed stuff',
        message: 'Test failed message',
        raw_details: 'RAW ME PLS'
    });

    let results = `${meta.result}: tests: ${meta.total}, skipped: ${meta.skipped}, failed: ${meta.failed}`;
    core.info(results);

    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const conclusion = meta.total > 0 || !failIfNoTests ? 'success' : 'failure';
    const status = 'completed';
    const head_sha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    core.info(
        `Posting status '${status}' with conclusion '${conclusion}' to ${link} (sha: ${head_sha})`
    );

    const createCheckRequest = {
        ...github.context.repo,
        name,
        head_sha,
        status,
        conclusion,
        output: {
            results,
            summary: '',
            annotations: annotations.slice(0, 50)
        }
    };

    core.debug(JSON.stringify(createCheckRequest, null, 2));

    // make conclusion consumable by downstream actions
    core.setOutput('conclusion', conclusion);

    const octokit = new github.GitHub(githubToken);
    await octokit.checks.create(createCheckRequest);

    if (failOnFailedTests && meta.result !== 'Passed') {
        core.setFailed(`There were ${meta.failed} failed tests`);
    }
};

module.exports = action;