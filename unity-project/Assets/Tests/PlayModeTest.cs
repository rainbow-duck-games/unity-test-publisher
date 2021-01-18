using System.Collections;
using NUnit.Framework;
using UnityEngine.TestTools;

namespace Tests {
    public class PlayModeTest {
        [Test]
        public void PassedTest() {
            Assert.True(true);
        }

        [Test]
        [Ignore("ignore")]
        public void IgnoredTest() {
            Assert.True(false);
        }

        [Test]
        public void FailedTest() {
            Assert.True(false);
        }

        [UnityTest]
        public IEnumerator PassedUnityTest() {
            yield return null;
            Assert.True(true);
        }

        [UnityTest]
        [Ignore("ignore")]
        public IEnumerator IgnoredUnityTest() {
            yield return null;
            Assert.True(false);
        }

        [UnityTest]
        public IEnumerator FailedUnityTest() {
            yield return null;
            Assert.True(false);
        }
    }
}