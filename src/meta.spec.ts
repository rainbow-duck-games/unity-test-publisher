import {Annotation, SuiteMeta, TestMeta} from '../src/meta';

describe('SuiteMeta', () => {
    test('getSummary', () => {
        const suite = new SuiteMeta('Test Suite');
        suite.total = 6;
        suite.passed = 1;
        suite.failed = 2;
        suite.skipped = 3;
        suite.duration = 2.2;
        expect(suite.getSummary()).toBe(
            'Results: 1/6, skipped: 3, failed: 2 in 2.2'
        );
    });

    test('addChild', () => {
        const suite = new SuiteMeta('Test Suite');
        const innerSuite = new SuiteMeta('Inner Suite');
        const test = new TestMeta('Test');
        suite.addChild(innerSuite, test);
        expect(suite.children).toContain(innerSuite);
        expect(suite.children).toContain(test);
    });

    test('extractAnnotations', () => {
        const suite = new SuiteMeta('Test Suite');
        const testA = new TestMeta('Test A');
        testA.annotation = {title: 'Test A Annotation'} as Annotation;
        const testB = new TestMeta('Test B');
        testB.annotation = {title: 'Test B Annotation'} as Annotation;
        const innerSuite = new SuiteMeta('Inner Suite');
        innerSuite.addChild(testB);

        suite.addChild(innerSuite, testA);
        const results = suite.extractAnnotations();
        expect(results).toContain(testA.annotation);
        expect(results).toContain(testB.annotation);
    });
});
