const converter = require('./coverter');

describe('converter', () => {
    test('convert test case - not failed', () => {
        const result = converter.convertTestCase({
            _attributes: { fullname: 'Test Case' }
        });

        expect(result).toBeUndefined();
    });

    test('convert test case - no annotation path', () => {
        const mock = jest.fn();
        const subj = Object.assign({}, converter, {
            findAnnotationPoint: mock
        });
        mock.mockReturnValueOnce({});

        const result = subj.convertTestCase({
            _attributes: { fullname: 'Test Case' },
            failure: {
                'stack-trace': { _cdata: 'Test CDATA' }
            }
        });

        expect(result).toBeUndefined();
        expect(mock.mock.calls.length).toBe(1);
        expect(mock.mock.calls[0][0]).toBe('Test CDATA');
    });

    test('convert test case - good flow', () => {
        const mock = jest.fn();
        const subj = Object.assign({}, converter, {
            findAnnotationPoint: mock
        });
        mock.mockReturnValueOnce({ path: 'test/path', line: 42 });

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
        expect(mock.mock.calls.length).toBe(1);
        expect(mock.mock.calls[0][0]).toBe('Test CDATA');
    });

    test('findAnnotationPoint - keep working if not matching', () => {
        const { path, line } = converter.findAnnotationPoint('');
        expect(path).toBeUndefined();
        expect(line).toBeUndefined();
    });

    test('findAnnotationPoint - simple annotation point', () => {
        const { path, line } = converter.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs');
        expect(line).toBe(39);
    });

    test('findAnnotationPoint - setup annotation point', () => {
        const { path, line } = converter.findAnnotationPoint(`SetUp
  at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs');
        expect(line).toBe(10);
    });
});
