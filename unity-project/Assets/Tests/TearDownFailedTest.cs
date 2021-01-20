using NUnit.Framework;
using UnityEngine;

namespace Tests {
    public class TearDownFailedTest {
        private GameObject nullObject;

        [TearDown]
        public void TearDown() {
            nullObject.name = "NPE";
        }

        [Test]
        public void PassedTest() {
            Assert.True(true);
        }
    }
}