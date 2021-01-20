using NUnit.Framework;
using UnityEngine;

namespace Tests {
    public class SetupFailedTest {
        private GameObject nullObject;

        [SetUp]
        public void SetUp() {
            nullObject.name = "NPE";
        }

        [Test]
        public void PassedTest() {
            Assert.True(true);
        }
    }
}