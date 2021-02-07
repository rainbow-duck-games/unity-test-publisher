import * as core from '@actions/core';
import * as fs from 'fs';
import * as xmljs from 'xml-js';
import * as converter from './converter';
import {SuiteMeta} from './meta.model';
import {TestRun} from './report.model';

export async function parseReport(path: string): Promise<SuiteMeta> {
    core.debug(`Try to open ${path}`);
    const file = await fs.promises.readFile(path, 'utf8');
    const report = xmljs.xml2js(file, {compact: true}) as {
        'test-run': TestRun;
    };

    // Process results
    core.debug(`File ${path} parsed...`);
    if (!report['test-run']) {
        core.error('No metadata found in the file - path');
        return new SuiteMeta(path);
    }

    return converter.convertReport(path, report);
}