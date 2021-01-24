import * as core from '@actions/core';
import * as converter from '../src/converter';
import {TestCase, TestCaseAttributes} from '../src/report.model';

beforeAll(() => {
    // Disable @actions/core logging for run
    jest.spyOn(core, 'error').mockImplementation(jest.fn());
    jest.spyOn(core, 'warning').mockImplementation(jest.fn());
    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'debug').mockImplementation(jest.fn());
});

describe('convertTests', () => {
    test('convert array', () => {
        const mock = jest.fn().mockImplementation(test => {
            return {title: `Test case ${test._attributes.fullname}`};
        });
        const testA = {_attributes: {fullname: 'testA'}} as TestCase;
        const testB = {_attributes: {fullname: 'testB'}} as TestCase;
        const testResult = [testA, testB];
        const result = converter.convertTests(testResult, mock);

        expect(result).toMatchObject([
            {title: 'Test case testA'},
            {title: 'Test case testB'},
        ]);
        expect(mock).toHaveBeenCalledTimes(2);
        expect(mock).toHaveBeenNthCalledWith(1, testA);
        expect(mock).toHaveBeenNthCalledWith(2, testB);
    });

    test('convert single', () => {
        const mock = jest.fn().mockReturnValueOnce({title: 'Test case result'});
        const testResult = {} as TestCase;
        const result = converter.convertTests(testResult, mock);

        expect(result).toMatchObject([{title: 'Test case result'}]);
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(testResult);
    });

    test('convert single - no result', () => {
        const mock = jest.fn().mockReturnValueOnce(undefined);
        const testResult = {} as TestCase;
        const result = converter.convertTests(testResult, mock);

        expect(result).toMatchObject([]);
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith(testResult);
    });
});

describe('convertTestCase', () => {
    test('not failed', () => {
        const result = converter.convertTestCase({
            _attributes: {fullname: 'Test Case'} as TestCaseAttributes,
        });

        expect(result).toBeUndefined();
    });

    test('no annotation path', () => {
        const mock = jest.fn().mockReturnValueOnce(undefined);
        const result = converter.convertTestCase(
            {
                _attributes: {fullname: 'Test Case'} as TestCaseAttributes,
                failure: {
                    message: {_cdata: 'Test Message'},
                    'stack-trace': {_cdata: 'Test Trace'},
                },
            },
            mock
        );

        expect(result).toBeUndefined();
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith('Test Trace');
    });

    test('prepare annotation', () => {
        const mock = jest
            .fn()
            .mockReturnValueOnce({path: 'test/path', line: 42});
        const result = converter.convertTestCase(
            {
                _attributes: {fullname: 'Test Case'} as TestCaseAttributes,
                failure: {
                    message: {_cdata: 'Message CDATA'},
                    'stack-trace': {_cdata: 'Test CDATA'},
                },
            },
            mock
        );

        expect(result).toMatchObject({
            annotation_level: 'failure',
            end_line: 42,
            message: 'Message CDATA',
            path: 'test/path',
            raw_details: 'Test CDATA',
            start_line: 42,
            title: 'Test Case',
        });
        expect(mock).toHaveBeenCalledTimes(1);
        expect(mock).toHaveBeenCalledWith('Test CDATA');
    });
});

describe('findAnnotationPoint', () => {
    test('keep working if not matching', () => {
        const result = converter.findAnnotationPoint('');
        expect(result).toBeUndefined();
    });

    test('simple annotation point', () => {
        const result = converter.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
        expect(result?.path).toBe(
            '/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs'
        );
        expect(result?.line).toBe(39);
    });

    test('setup annotation point', () => {
        const result = converter.findAnnotationPoint(`SetUp
  at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10`);
        expect(result?.path).toBe(
            '/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs'
        );
        expect(result?.line).toBe(10);
    });
});
