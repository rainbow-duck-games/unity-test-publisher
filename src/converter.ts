import * as core from '@actions/core';

export function convertReport(report) {
    core.debug('Start analyzing report:');
    core.debug(JSON.stringify(report));
    const run = report['test-run'];
    return convertSuite(run['test-suite']);
}

export function convertSuite(suite) {
    if (Array.isArray(suite)) {
        return suite.flatMap(suite => convertSuite(suite));
    }

    core.debug(
        `Analyze suite ${suite._attributes.type} / ${suite._attributes.fullname}`
    );
    if (suite._attributes.failed === 0) {
        core.debug('No failed tests, skipping');
        return [];
    }

    const annotations = [];
    const innerSuite = suite['test-suite'];
    if (innerSuite) {
        annotations.push(...convertSuite(innerSuite));
    }

    const tests = suite['test-case'];
    if (tests) {
        annotations.push(...convertTests(tests));
    }
    return annotations;
}

export function convertTests(tests) {
    if (Array.isArray(tests)) {
        return tests.flatMap(test => convertTests(test));
    }

    const result = convertTestCase(tests);
    return result ? [result] : [];
}

export function convertTestCase(testCase) {
    const failure = testCase.failure;
    if (!failure) {
        core.debug(
            `Skip test ${testCase._attributes.fullname} without failure data`
        );
        return undefined;
    }

    core.debug(`Convert data for test ${testCase._attributes.fullname}`);
    const trace = failure['stack-trace']._cdata;
    const {path, line} = findAnnotationPoint(trace);
    if (!path) {
        core.warning(
            'Not able to find entry point for failed test! Test trace:'
        );
        core.warning(trace);
        return undefined;
    }

    const annotation = {
        path,
        start_line: line,
        end_line: line,
        annotation_level: 'failure',
        title: testCase._attributes.fullname,
        message: failure.message._cdata,
        raw_details: trace
    };
    core.info(
        `- ${annotation.path}:${annotation.start_line} - ${annotation.title}`
    );
    return annotation;
}

export function findAnnotationPoint(trace: string): any {
    const match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
    if (match !== null) {
        return {
            path: match.groups.path,
            line: Number(match.groups.line)
        };
    }

    return {};
}
