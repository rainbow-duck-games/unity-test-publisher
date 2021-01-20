const core = require(`@actions/core`);
const github = require(`@actions/github`);
const fs = require(`fs`);
const xmljs = require(`xml-js`);
const converter = require(`./coverter`);

let action = async function (name, path, workdirPrefix, githubToken, failOnFailedTests = `false`, failIfNoTests = true) {
    const {meta, report} = await getReport(path, failIfNoTests);

    let results = `${meta.result}: tests: ${meta.total}, skipped: ${meta.skipped}, failed: ${meta.failed}`;
    const conclusion = meta.failed === 0 && (meta.total > 0 || !failIfNoTests) ? `success` : `failure`;
    core.info(results);

    let annotations = converter.convertReport(report);
    cleanPaths(annotations, workdirPrefix);
    await createCheck(githubToken, name, results, failIfNoTests, conclusion, annotations);

    if (failOnFailedTests && conclusion !== `success`) {
        core.setFailed(`There were ${meta.failed} failed tests`);
    }
};

let getReport = async function (path, failIfNoTests) {
    core.info(`Try to open ${path}`);
    const file = await fs.promises.readFile(path);
    const report = xmljs.xml2js(file, {compact: true});

    // Process results
    core.info(`File ${path} parsed...`);
    const meta = report[`test-run`]._attributes;
    if (!meta) {
        core.error(`No metadata found in the file`);
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
        status: `completed`,
        conclusion,
        output: {
            title: title,
            summary: ``,
            annotations: annotations.slice(0, 50)
        }
    };

    core.debug(JSON.stringify(createCheckRequest, null, 2));

    // make conclusion consumable by downstream actions
    core.setOutput(`conclusion`, conclusion);

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
}

let cleanPaths = function (annotations, pathToClean) {
    for (const annotation of annotations) {
        annotation.path = annotation.path.replace(pathToClean, ``)
    }
}

module.exports = action;