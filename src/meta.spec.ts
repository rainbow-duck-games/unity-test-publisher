import {Annotation, RunMeta, TestMeta} from './meta';

describe('SuiteMeta', () => {
    test('getTitle', () => {
        const suite = new RunMeta('Test Suite');
        suite.total = 6;
        suite.passed = 1;
        suite.failed = 2;
        suite.skipped = 3;
        suite.duration = 2.2;
        expect(suite.getTitle()).toBe(
            'Results: 1/6, skipped: 3, failed: 2 in 2.2'
        );
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
