const core = require('@actions/core');

const converter = {
    convertReport: function (report) {
        core.debug('Start analyzing report:');
        core.debug(JSON.stringify(report));
        const run = report['test-run'];
        return this.convertSuite(run['test-suite']);
    },

    convertSuite: function (suite) {
        if (Array.isArray(suite)) {
            return suite.flatMap(suite => this.convertSuite(suite));
        }

        core.debug(`Analyze suite ${suite._attributes.type} / ${suite._attributes.fullname}`);
        if (suite._attributes.failed === 0) {
            core.debug('No failed tests, skipping');
            return [];
        }

        const annotations = [];
        const innerSuite = suite['test-suite'];
        if (innerSuite) {
            annotations.push(...this.convertSuite(innerSuite));
        }

        const tests = suite['test-case'];
        if (tests) {
            annotations.push(...this.convertTests(tests));
        }
        return annotations;
    },

    convertTests: function (tests) {
        if (Array.isArray(tests)) {
            return tests.flatMap(test => this.convertTests(test));
        }

        const result = this.convertTestCase(tests);
        return result ? [result] : [];
    },

    convertTestCase: function (testCase) {
        const failure = testCase.failure;
        if (!failure) {
            core.debug(`Skip test ${testCase._attributes.fullname} without failure data`);
            return undefined;
        }

        core.debug(`Convert data for test ${testCase._attributes.fullname}`);
        const trace = failure['stack-trace']._cdata;
        const { path, line } = this.findAnnotationPoint(trace);
        if (!path) {
            core.warning('Not able to find entry point for failed test! Test trace:');
            core.warning(trace);
            return undefined;
        }

        const annotation = {
            path: path,
            start_line: line,
            end_line: line,
            annotation_level: 'failure',
            title: testCase._attributes.fullname,
            message: failure.message._cdata,
            raw_details: trace
        };
        core.info(`- ${annotation.path}:${annotation.start_line} - ${annotation.title}`);
        return annotation;
    },

    findAnnotationPoint: function (trace) {
        const match = trace.match(/at .* in ((?<path>[^:]+):(?<line>\d+))/);
        if (match) {
            return {
                path: match.groups.path,
                line: Number(match.groups.line)
            };
        }

        return {};
    }
};

module.exports = converter;
