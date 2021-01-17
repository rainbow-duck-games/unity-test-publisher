const core = require('@actions/core');
const github = require('@actions/github');
const fs = require('fs');
const xmljs = require('xml-js');

let action = async function (name, path, workdirPrefix, githubToken, failOnFailedTests = false, failIfNoTests = true) {
    const {meta, report} = await getReport(path, failIfNoTests);

    let results = `${meta.result}: tests: ${meta.total}, skipped: ${meta.skipped}, failed: ${meta.failed}`;
    const conclusion = meta.failed === 0 && (meta.total > 0 || !failIfNoTests) ? 'success' : 'failure';
    core.info(results);

    let annotations = convertReport(report);
    cleanPaths(annotations, workdirPrefix);
    await createCheck(githubToken, name, results, failIfNoTests, conclusion, annotations);

    if (failOnFailedTests && conclusion !== 'success') {
        core.setFailed(`There were ${meta.failed} failed tests`);
    }
};

let getReport = async function (path, failIfNoTests) {
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
    }

    return {meta, report};
}

let createCheck = async function (githubToken, checkName, title, failIfNoTests, conclusion, annotations) {
    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const head_sha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    core.info(`Posting status 'completed' with conclusion '${conclusion}' to ${link} (sha: ${head_sha})`);

    const createCheckRequest = {
        ...github.context.repo,
        name: checkName,
        head_sha,
        status: 'completed',
        conclusion,
        output: {
            title: title,
            summary: '',
            annotations: annotations.slice(0, 50)
        }
    };

    core.debug(JSON.stringify(createCheckRequest, null, 2));

    // make conclusion consumable by downstream actions
    core.setOutput('conclusion', conclusion);

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
}

let convertReport = function (report) {
    core.debug('Start analyzing report:');
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    return convertSuite(run['test-suite']);
}

let convertSuite = function (suite) {
    const annotations = [];
    if (Array.isArray(suite)) {
        for (const candidate of suite) {
            annotations.push(...convertSuite(candidate));
        }
        return annotations;
    }

    core.debug(`Analyze suite ${suite._attributes.type} / ${suite._attributes.fullname}`);
    if (suite._attributes.failed === 0) {
        core.debug(`No failed tests, skipping`);
        return annotations;
    }

    let innerSuite = suite['test-suite'];
    if (innerSuite) {
        annotations.push(...convertSuite(innerSuite));
    }

    let tests = suite['test-case'];
    if (tests) {
        annotations.push(...convertTests(tests));
    }
    return annotations;
}

let convertTests = function (tests) {
    if (Array.isArray(tests)) {
        const annotations = [];
        for (const test of tests) {
            if (test.failure) {
                annotations.push(convertTestCase(test));
            }
        }
        return annotations;
    }

    if (tests.failure) {
        return [convertTestCase(tests)];
    }

    return [];
}

let convertTestCase = function (testCase) {
    core.debug(`Convert data for test ${testCase._attributes.fullname}`);
    let failure = testCase.failure;
    let message = failure.message._cdata;
    let trace = failure['stack-trace']._cdata;
    let firstLine = trace.split('\n')[0];
    let failPoint = firstLine.split(' in ')[1];
    let [path, line] = failPoint.split(':');
    
    let annotation = {
        path: path.replace('/github/workspace/', ''),
        start_line: Number(line),
        end_line: Number(line),
        annotation_level: 'failure',
        title: testCase._attributes.fullname,
        message,
        raw_details: trace
    };
    core.info(`- ${annotation.path}:${annotation.start_line} - ${annotation.title}`);
    return annotation;
}

let cleanPaths = function(annotations, pathToClean) {
    for (const annotation of annotations) {
        annotation.path = annotation.path.replace(pathToClean, '')
    }
}

module.exports = action;