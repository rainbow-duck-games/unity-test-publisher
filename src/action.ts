import * as core from '@actions/core';
import * as github from '@actions/github';
import {Endpoints} from '@octokit/types';
import {Annotation, RunMeta} from './meta';
import * as fs from 'fs';
import Handlebars from 'handlebars';

Handlebars.registerHelper('indent', indentHelper);
Handlebars.registerHelper('time', timeHelper);

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

    const summary = await renderSummary(runs);
    const text = await renderText(runs);
    const createCheckRequest = {
        ...github.context.repo,
        name: checkName,
        head_sha: headSha,
        status: 'completed',
        conclusion,
        output: {
            title,
            summary,
            text,
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

export async function renderSummary(runMetas: RunMeta[]): Promise<string> {
    return render(`${__dirname}/../views/summary.hbs`, runMetas);
}

export async function renderText(runMetas: RunMeta[]): Promise<string> {
    return render(`${__dirname}/../views/text.hbs`, runMetas);
}

async function render(viewPath: string, runMetas: RunMeta[]): Promise<string> {
    const source = await fs.promises.readFile(viewPath, 'utf8');
    const template = Handlebars.compile(source);
    return template(
        {runs: runMetas},
        {
            allowProtoMethodsByDefault: true,
            allowProtoPropertiesByDefault: true,
        }
    );
}

function indentHelper(arg: string): string {
    return arg
        .split('\n')
        .map(s => `        ${s}`)
        .join('\n');
}

export function timeHelper(seconds: number): string {
    return `${seconds.toFixed(3)}s`;
}
