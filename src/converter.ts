import * as core from '@actions/core';
import {Annotation, SuiteMeta, TestMeta} from './meta';
import {TestCase, TestRun, TestSuite} from './report.model';

export function convertReport(
    path: string,
    report: {'test-run': TestRun}
): SuiteMeta {
    core.debug('Start analyzing report:');
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    const meta = new SuiteMeta(path);

    meta.total = Number(run._attributes.total);
    meta.failed = Number(run._attributes.failed);
    meta.skipped = Number(run._attributes.skipped);
    meta.passed = Number(run._attributes.passed);

    meta.addChild(...convertSuite(run['test-suite']));

    return meta;
}

export function convertSuite(
    suites: TestSuite | TestSuite[],
    convertTestsFn = convertTests
): SuiteMeta[] {
    if (Array.isArray(suites)) {
        return suites.reduce(
            (acc, suite) => acc.concat(convertSuite(suite, convertTestsFn)),
            [] as SuiteMeta[]
        );
    }

    core.debug(
        `Analyze suite ${suites._attributes.type} / ${suites._attributes.fullname}`
    );
    const meta = new SuiteMeta(suites._attributes.fullname);
    meta.total = Number(suites._attributes.total);
    meta.failed = Number(suites._attributes.failed);
    meta.skipped = Number(suites._attributes.skipped);
    meta.passed = Number(suites._attributes.passed);
    meta.duration = Number(suites._attributes.duration);

    const innerSuite = suites['test-suite'];
    if (innerSuite) {
        meta.addChild(...convertSuite(innerSuite, convertTestsFn));
    }

    const tests = suites['test-case'];
    if (tests) {
        meta.addChild(...convertTestsFn(tests));
    }

    return [meta];
}

export function convertTests(
    tests: TestCase | TestCase[],
    convertTestCaseFn = convertTestCase
): TestMeta[] {
    if (Array.isArray(tests)) {
        return tests.reduce(
            (acc, test) => acc.concat(convertTests(test, convertTestCaseFn)),
            [] as TestMeta[]
        );
    }

    return [convertTestCaseFn(tests)];
}

export function convertTestCase(
    testCase: TestCase,
    findAnnotationPointFn = findAnnotationPoint
): TestMeta {
    const meta = new TestMeta(testCase._attributes.name);
    meta.result = testCase._attributes.result;
    meta.duration = Number(testCase._attributes.duration);

    const failure = testCase.failure;
    if (!failure) {
        core.debug(
            `Skip test ${testCase._attributes.fullname} without failure data`
        );
        return meta;
    }

    core.debug(`Convert data for test ${testCase._attributes.fullname}`);
    if (failure['stack-trace'] === undefined) {
        core.warning(
            `Not stack trace for test case: ${testCase._attributes.fullname}`
        );
        return meta;
    }

    const trace = failure['stack-trace']._cdata;
    const point = findAnnotationPointFn(trace);
    if (point === undefined) {
        core.warning(
            'Not able to find entry point for failed test! Test trace:'
        );
        core.warning(trace);
        return meta;
    }

    meta.annotation = {
        path: point.path,
        start_line: point.line,
        end_line: point.line,
        annotation_level: 'failure',
        title: testCase._attributes.fullname,
        message: failure.message._cdata,
        raw_details: trace,
    } as Annotation;
    core.info(
        `- ${meta.annotation.path}:${meta.annotation.start_line} - ${meta.annotation.title}`
    );
    return meta;
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
