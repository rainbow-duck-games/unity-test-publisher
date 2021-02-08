import * as core from '@actions/core';
import * as github from '@actions/github';
import {Endpoints} from '@octokit/types';
import {Annotation, RunMeta} from './meta';
import * as fs from 'fs';
import Handlebars from 'handlebars';

export async function createCheck(
    githubToken: string,
    checkName: string,
    title: string,
    conclusion: string,
    runs: RunMeta[],
    annotations: Annotation[]
): Promise<void> {
    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    core.info(
        `Posting status 'completed' with conclusion '${conclusion}' to ${link} (sha: ${headSha})`
    );

    const summary = await renderSummaryBody(runs);
    const createCheckRequest = {
        ...github.context.repo,
        name: checkName,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output: {
            title,
            summary,
            annotations: annotations.slice(0, 50),
        },
    } as Endpoints['POST /repos/{owner}/{repo}/check-runs']['parameters'];

    core.debug(JSON.stringify(createCheckRequest, null, 2));

    // make conclusion consumable by downstream actions
    core.setOutput('conclusion', conclusion);

    const octokit = github.getOctokit(githubToken);
    await octokit.checks.create(createCheckRequest);
}

export function cleanPaths(
    annotations: Annotation[],
    pathToClean: string
): void {
    for (const annotation of annotations) {
        annotation.path = annotation.path.replace(pathToClean, '');
    }
}

export async function renderSummaryBody(runMetas: RunMeta[]): Promise<string> {
    const source = await fs.promises.readFile(
        `${__dirname}/../src/action.hbs`,
        'utf8'
    );
    Handlebars.registerHelper('mark', markHelper);
    Handlebars.registerHelper('indent', indentHelper);
    const template = Handlebars.compile(source);
    return template({runs: runMetas});
}

function markHelper(arg: string | RunMeta): string {
    if (arg instanceof RunMeta) {
        return arg.failed > 0
            ? ':x:'
            : arg.skipped > 0
            ? ':warning:'
            : ':heavy_check_mark:';
    } else if (arg === 'Passed') {
        return ':heavy_check_mark:';
    } else if (arg === 'Failed') {
        return ':x:';
    }
    return ':warning:';
}

function indentHelper(arg: string): string {
    return arg
        .split('\n')
        .map(s => `        ${s}`)
        .join('\n');
}
