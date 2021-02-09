import {Annotation, RunMeta, TestMeta} from './meta';

describe('SuiteMeta', () => {
    test('getSummary - Full', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 1;
        suite.failed = 2;
        suite.skipped = 3;
        suite.duration = 1;
        expect(suite.summary).toBe(
            'Failed: 1/6, skipped: 3, failed: 2 in 1.000s'
        );
    });

    test('getSummary - Passed', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 6;
        suite.duration = 1.1234567;
        expect(suite.summary).toBe('Passed: 6/6 in 1.123s');
    });

    test('getSummary - Skipped', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 4;
        suite.skipped = 2;
        suite.duration = 2.2;
        expect(suite.summary).toBe('Passed: 4/6, skipped: 2 in 2.200s');
    });

    test('getSummary - Failed', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 2;
        suite.failed = 4;
        suite.duration = 0.123456789;
        expect(suite.summary).toBe('Failed: 2/6, failed: 4 in 0.123s');
    });

    test('addTests', () => {
        const suite = new RunMeta('Test Suite');
        const testA = new TestMeta('suiteA', 'testA');
        const testB = new TestMeta('suiteB', 'testB');
        const testC = new TestMeta('suiteB', 'testC');
        suite.addTests([testA, testB, testC]);
        expect(suite.suites).toMatchObject({
            suiteA: [testA],
            suiteB: [testB, testC],
        });
    });

    test('extractAnnotations', () => {
        const suite = new RunMeta('Test Suite');
        const testA = new TestMeta('suiteA', 'testA');
        testA.annotation = {title: 'Test A Annotation'} as Annotation;
        const testB = new TestMeta('suiteB', 'testB');
        testB.annotation = {title: 'Test B Annotation'} as Annotation;
        suite.addTests([testA, testB]);

        const results = suite.extractAnnotations();
        expect(results).toContain(testA.annotation);
        expect(results).toContain(testB.annotation);
    });
});
