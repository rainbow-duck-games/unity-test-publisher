﻿const core = require('@actions/core');

let converter = {
    convertReport: function (report) {
        core.debug('Start analyzing report:');
        core.debug(JSON.stringify(report));
        const run = report['test-run'];
        return this.convertSuite(run['test-suite']);
    },

    convertSuite: function (suite) {
        const annotations = [];
        if (Array.isArray(suite)) {
            for (const candidate of suite) {
                annotations.push(...this.convertSuite(candidate));
            }
            return annotations;
        }

        core.debug(`Analyze suite ${suite._attributes.type} / ${suite._attributes.fullname}`);
        if (suite._attributes.failed === 0) {
            core.debug(`No failed tests, skipping`);
            return annotations;
        }

        let innerSuite = suite['test-suite'];
        if (innerSuite) {
            annotations.push(...this.convertSuite(innerSuite));
        }

        let tests = suite['test-case'];
        if (tests) {
            annotations.push(...this.convertTests(tests));
        }
        return annotations;
    },

    convertTests: function (tests) {
        if (Array.isArray(tests)) {
            return tests.forEach(test => this.convertTests(test));
        }

        if (tests.failure) {
            const ann = this.convertTestCase(test);
            if (ann.path) {
                return [ann];
            }
        }

        return [];
    },

    convertTestCase: function (testCase) {
        core.debug(`Convert data for test ${testCase._attributes.fullname}`);
        let failure = testCase.failure;
        let message = failure.message._cdata;
        let trace = failure['stack-trace']._cdata;
        let {path, line} = this.findAnnotationPoint(trace);
        if (!path) {
            core.warning(`Not able to find entry point for failed test! Test trace:`);
            core.warning(trace);
            return {};
        }

        let annotation = {
            path: path,
            start_line: line,
            end_line: line,
            annotation_level: 'failure',
            title: testCase._attributes.fullname,
            message,
            raw_details: trace
        };
        core.info(`- ${annotation.path}:${annotation.start_line} - ${annotation.title}`);
        return annotation;
    },

    findAnnotationPoint: function (trace) {
        let match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
        if (match) {
            return {
                path: match.groups.path,
                line: Number(match.groups.line)
            };
        }

        return {};
    }
}

module.exports = converter;