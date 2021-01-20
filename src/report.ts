import * as core from '@actions/core';
import * as fs from 'fs';
import * as xmljs from 'xml-js';
import * as converter from './converter';

export async function getReportDataModel(path: string): Promise<any> {
    core.debug(`Try to open ${path}`);
    const file = await fs.promises.readFile(path, 'utf8');
    const report = xmljs.xml2js(file, {compact: true});

    // Process results
    core.debug(`File ${path} parsed...`);
    const meta = report['test-run']._attributes;
    if (!meta) {
        core.error('No metadata found in the file - path');
        return getDataModel();
    }

    return getDataModel(meta.total, meta.passed, meta.skipped, meta.failed, converter.convertReport(report));
}

export function getDataModel(total = 0, passed = 0, skipped = 0, failed = 0, annotations = []): any {
    return {
        meta: {
            total: Number(total),
            passed: Number(passed),
            skipped: Number(skipped),
            failed: Number(failed)
        },
        annotations
    };
}

export function getDataSummary(data): string {
    return `Results: ${data.meta.passed}/${data.meta.total}, skipped: ${data.meta.skipped}, failed: ${data.meta.failed}`;
}