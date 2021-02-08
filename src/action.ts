import * as core from '@actions/core';
import * as github from '@actions/github';
import {Endpoints} from '@octokit/types';
import {Annotation, RunMeta} from './meta';
import * as fs from 'fs';
import Mustache from 'mustache';

export async function createCheck(
    githubToken: string,
    checkName: string,
    meta: RunMeta,
    annotations: Annotation[],
    conclusion: string
): Promise<void> {
    const pullRequest = github.context.payload.pull_request;
    const link = (pullRequest && pullRequest.html_url) || github.context.ref;
    const headSha = (pullRequest && pullRequest.head.sha) || github.context.sha;
    core.info(
        `Posting status 'completed' with conclusion '${conclusion}' to ${link} (sha: ${headSha})`
    );

    const summary = await renderSummary(meta);
    const createCheckRequest = {
        ...github.context.repo,
        name: checkName,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output: {
            title: meta.getTitle(),
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

export async function renderSummary(runMeta: RunMeta): Promise<string> {
    const template = await fs.promises.readFile(
        'templates/action.mustache',
        'utf8'
    );
    return Mustache.render(template, runMeta);
}
