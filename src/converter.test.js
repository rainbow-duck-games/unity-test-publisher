const core = require('@actions/core');
const converter = require('./converter');

beforeAll(() => {
    // Disable @actions/core logging for run
    jest.spyOn(core, 'error').mockImplementation(jest.fn());
    jest.spyOn(core, 'warning').mockImplementation(jest.fn());
    jest.spyOn(core, 'info').mockImplementation(jest.fn());
    jest.spyOn(core, 'debug').mockImplementation(jest.fn());
});

describe('convertTests', () => {
    test('convert array', () => {
        const subj = Object.assign({}, converter, {
            convertTestCase: jest.fn().mockImplementation(test => ({ title: `Test case ${test}` }))
        });
        const testResult = ['testA', 'testB'];
        const result = subj.convertTests(testResult);

        expect(result).toMatchObject([
            { title: 'Test case testA' },
            { title: 'Test case testB' }
        ]);
        expect(subj.convertTestCase.mock.calls.length).toBe(2);
        expect(subj.convertTestCase.mock.calls[0][0]).toBe('testA');
        expect(subj.convertTestCase.mock.calls[1][0]).toBe('testB');
    });

    test('convert single', () => {
        const subj = Object.assign({}, converter, {
            convertTestCase: jest.fn().mockReturnValueOnce({ title: 'Test case result' })
        });
        const testResult = {};
        const result = subj.convertTests(testResult);

        expect(result).toMatchObject([{ title: 'Test case result' }]);
        expect(subj.convertTestCase.mock.calls.length).toBe(1);
        expect(subj.convertTestCase.mock.calls[0][0]).toBe(testResult);
    });

    test('convert single - no result', () => {
        const subj = Object.assign({}, converter, {
            convertTestCase: jest.fn().mockReturnValueOnce(undefined)
        });
        const testResult = {};
        const result = subj.convertTests(testResult);

        expect(result).toMatchObject([]);
        expect(subj.convertTestCase.mock.calls.length).toBe(1);
        expect(subj.convertTestCase.mock.calls[0][0]).toBe(testResult);
    });
});

describe('convertTestCase', () => {
    test('not failed', () => {
        const result = converter.convertTestCase({
            _attributes: { fullname: 'Test Case' }
        });

        expect(result).toBeUndefined();
    });

    test('no annotation path', () => {
        const subj = Object.assign({}, converter, {
            findAnnotationPoint: jest.fn().mockReturnValueOnce({})
        });
        const result = subj.convertTestCase({
            _attributes: { fullname: 'Test Case' },
            failure: {
                'stack-trace': { _cdata: 'Test CDATA' }
            }
        });

        expect(result).toBeUndefined();
        expect(subj.findAnnotationPoint.mock.calls.length).toBe(1);
        expect(subj.findAnnotationPoint.mock.calls[0][0]).toBe('Test CDATA');
    });

    test('prepare annotation', () => {
        const subj = Object.assign({}, converter, {
            findAnnotationPoint: jest.fn().mockReturnValueOnce({ path: 'test/path', line: 42 })
        });
        const result = subj.convertTestCase({
            _attributes: { fullname: 'Test Case' },
            failure: {
                message: { _cdata: 'Message CDATA' },
                'stack-trace': { _cdata: 'Test CDATA' }
            }
        });

        expect(result).toMatchObject({
            annotation_level: 'failure',
            end_line: 42,
            message: 'Message CDATA',
            path: 'test/path',
            raw_details: 'Test CDATA',
            start_line: 42,
            title: 'Test Case'
        });
        expect(subj.findAnnotationPoint.mock.calls.length).toBe(1);
        expect(subj.findAnnotationPoint.mock.calls[0][0]).toBe('Test CDATA');
    });
});

describe('findAnnotationPoint', () => {
    test('keep working if not matching', () => {
        const { path, line } = converter.findAnnotationPoint('');
        expect(path).toBeUndefined();
        expect(line).toBeUndefined();
    });

    test('simple annotation point', () => {
        const { path, line } = converter.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs');
        expect(line).toBe(39);
    });

    test('setup annotation point', () => {
        const { path, line } = converter.findAnnotationPoint(`SetUp
  at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs');
        expect(line).toBe(10);
    });
});
