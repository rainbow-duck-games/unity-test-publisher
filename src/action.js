const core = require('@actions/core');
const github = require('@actions/github');
const { getDataSummary } = require('./report');

const createCheck = async function (githubToken, checkName, meta, conclusion) {
    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    core.info(`Posting status 'completed' with conclusion '${conclusion}' to ${link} (sha: ${headSha})`);

    const createCheckRequest = {
        ...github.context.repo,
        name: checkName,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output: {
            title: getDataSummary(meta),
            summary: '',
            annotations: meta.annotations.slice(0, 50)
        }
    };

    core.debug(JSON.stringify(createCheckRequest, null, 2));

    // make conclusion consumable by downstream actions
    core.setOutput('conclusion', conclusion);

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
};

const cleanPaths = function (annotations, pathToClean) {
    for (const annotation of annotations) {
        annotation.path = annotation.path.replace(pathToClean, '');
    }
};

module.exports = { cleanPaths, createCheck };
