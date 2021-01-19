const converter = require("./coverter");

describe('converter', () => {
    test('keep working if not matching', () => {
        const {path, line} = converter.findAnnotationPoint('');
        expect(path).toBeUndefined();
        expect(line).toBeUndefined();
    });
    
    test('simple annotation point', () => {
        const {path, line} = converter.findAnnotationPoint(`at Tests.PlayModeTest+<FailedUnityTest>d__5.MoveNext () [0x0002e] in /github/workspace/unity-project/Assets/Tests/PlayModeTest.cs:39
at UnityEngine.TestTools.TestEnumerator+<Execute>d__6.MoveNext () [0x00038] in /github/workspace/unity-project/Library/PackageCache/com.unity.test-framework@1.1.19/UnityEngine.TestRunner/NUnitExtensions/Attributes/TestEnumerator.cs:36`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/PlayModeTest.cs');
        expect(line).toBe(39);
    });

    test('setup annotation point', () => {
        const {path, line} = converter.findAnnotationPoint(`SetUp
  at Tests.SetupFailedTest.SetUp () [0x00000] in /github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs:10`);
        expect(path).toBe('/github/workspace/unity-project/Assets/Tests/SetupFailedTest.cs');
        expect(line).toBe(10);
    });
});