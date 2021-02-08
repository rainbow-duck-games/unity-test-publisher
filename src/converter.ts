import * as core from '@actions/core';
import {Annotation, RunMeta, TestMeta} from './meta';
import {TestCase, TestRun, TestSuite} from './report.model';

export function convertReport(
    path: string,
    report: {'test-run': TestRun}
): RunMeta {
    core.debug('Start analyzing report:');
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    const meta = new RunMeta(path);

    meta.total = Number(run._attributes.total);
    meta.failed = Number(run._attributes.failed);
    meta.skipped = Number(run._attributes.skipped);
    meta.passed = Number(run._attributes.passed);

    meta.addTests(convertSuite(run['test-suite']));

    return meta;
}

export function convertSuite(
    suites: TestSuite | TestSuite[],
    convertTestsFn = convertTests
): TestMeta[] {
    if (Array.isArray(suites)) {
        return suites.reduce(
            (acc, suite) => acc.concat(convertSuite(suite, convertTestsFn)),
            [] as TestMeta[]
        );
    }

    core.debug(
        `Analyze suite ${suites._attributes.type} / ${suites._attributes.fullname}`
    );
    const result = [];
    const innerSuite = suites['test-suite'];
    if (innerSuite) {
        result.push(...convertSuite(innerSuite, convertTestsFn));
    }

    const tests = suites['test-case'];
    if (tests) {
        result.push(...convertTestsFn(suites._attributes.fullname, tests));
    }

    return result;
}

export function convertTests(
    suite: string,
    tests: TestCase | TestCase[],
    convertTestCaseFn = convertTestCase
): TestMeta[] {
    if (Array.isArray(tests)) {
        return tests.reduce(
            (acc, test) =>
                acc.concat(convertTests(suite, test, convertTestCaseFn)),
            [] as TestMeta[]
        );
    }

    return [convertTestCaseFn(suite, tests)];
}

export function convertTestCase(
    suite: string,
    testCase: TestCase,
    findAnnotationPointFn = findAnnotationPoint
): TestMeta {
    const meta = new TestMeta(suite, testCase._attributes.name);
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
