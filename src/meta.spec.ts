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
            '❌️ Test Suite - 1/6, skipped: 3, failed: 2 - Failed in 1.000s'
        );
    });

    test('getSummary - Passed', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 6;
        suite.duration = 1.1234567;
        expect(suite.summary).toBe('✔️ Test Suite - 6/6 - Passed in 1.123s');
    });

    test('getSummary - Skipped', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 4;
        suite.skipped = 2;
        suite.duration = 2.2;
        expect(suite.summary).toBe(
            '⚠️ Test Suite - 4/6, skipped: 2 - Passed in 2.200s'
        );
    });

    test('getSummary - Failed', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 2;
        suite.failed = 4;
        suite.duration = 0.123456789;
        expect(suite.summary).toBe(
            '❌️ Test Suite - 2/6, failed: 4 - Failed in 0.123s'
        );
    });

    test('addTests', () => {
        const suite = new RunMeta('Test Suite');
        const testA = new TestMeta('suiteA', 'testA');
        testA.duration = 1.23;

        const testB = new TestMeta('suiteB', 'testB');
        testB.duration = 2.34;
        testB.result = 'Passed';

        const testC = new TestMeta('suiteB', 'testC');
        testC.duration = 3.45;
        testC.result = 'Failed';

        suite.addTests([testA, testB, testC]);
        expect(suite.suites).toHaveLength(2);
        expect(suite.suites.find(s => s.title === 'suiteA')).toMatchObject({
            title: 'suiteA',
            total: 1,
            passed: 0,
            skipped: 1,
            failed: 0,
            duration: 1.23,
            tests: [testA],
        } as RunMeta);
        expect(suite.suites.find(s => s.title === 'suiteB')).toMatchObject({
            title: 'suiteB',
            total: 2,
            passed: 1,
            skipped: 0,
            failed: 1,
            duration: 5.79,
            tests: [testB, testC],
        } as RunMeta);
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
