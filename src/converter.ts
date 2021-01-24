import * as core from '@actions/core';
import {Annotation, Meta} from './meta';
import {TestCase, TestRun, TestSuite} from './report.model';

export function convertReport(report: {'test-run': TestRun}): Meta {
    core.debug('Start analyzing report:');
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    const meta = new Meta();

    meta.total = Number(run._attributes.total);
    meta.failed = Number(run._attributes.failed);
    meta.skipped = Number(run._attributes.skipped);
    meta.passed = Number(run._attributes.passed);

    meta.annotations = convertSuite(run['test-suite']);

    return meta;
}

export function convertSuite(suites: TestSuite | TestSuite[]): Annotation[] {
    if (Array.isArray(suites)) {
        return suites.reduce(
            (acc, suite) => acc.concat(convertSuite(suite)),
            [] as Annotation[]
        );
    }

    core.debug(
        `Analyze suite ${suites._attributes.type} / ${suites._attributes.fullname}`
    );
    if (Number(suites._attributes.failed) === 0) {
        core.debug('No failed tests, skipping');
        return [];
    }

    const annotations = [];
    const innerSuite = suites['test-suite'];
    if (innerSuite) {
        annotations.push(...convertSuite(innerSuite));
    }

    const tests = suites['test-case'];
    if (tests) {
        annotations.push(...convertTests(tests));
    }
    return annotations;
}

export function convertTests(tests: TestCase | TestCase[]): Annotation[] {
    if (Array.isArray(tests)) {
        return tests.reduce(
            (acc, test) => acc.concat(convertTests(test)),
            [] as Annotation[]
        );
    }

    const result = convertTestCase(tests);
    return result !== undefined ? [result] : [];
}

export function convertTestCase(testCase: TestCase): Annotation | undefined {
    const failure = testCase.failure;
    if (!failure) {
        core.debug(
            `Skip test ${testCase._attributes.fullname} without failure data`
        );
        return undefined;
    }

    core.debug(`Convert data for test ${testCase._attributes.fullname}`);
    if (failure['stack-trace'] === undefined) {
        core.warning(
            `Not stack trace for test case: ${testCase._attributes.fullname}`
        );
        return undefined;
    }

    const trace = failure['stack-trace']._cdata;
    const point = findAnnotationPoint(trace);
    if (point === undefined) {
        core.warning(
            'Not able to find entry point for failed test! Test trace:'
        );
        core.warning(trace);
        return undefined;
    }

    const annotation = {
        path: point.path,
        start_line: point.line,
        end_line: point.line,
        annotation_level: 'failure',
        title: testCase._attributes.fullname,
        message: failure.message._cdata,
        raw_details: trace,
    } as Annotation;
    core.info(
        `- ${annotation.path}:${annotation.start_line} - ${annotation.title}`
    );
    return annotation;
}

export function findAnnotationPoint(
    trace: string
): {path: string; line: number} | undefined {
    const match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
    if (match === null || match.groups === undefined) {
        return undefined;
    }

    return {
        path: match.groups.path,
        line: Number(match.groups.line),
    };
}
