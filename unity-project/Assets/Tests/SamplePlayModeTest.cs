using System.Collections;
using System.Collections.Generic;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

namespace Tests {
  public class SamplePlayModeTest {
    [Test]
    public void PassedTest() {
      Assert.True(true);
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
    public IEnumerator FailedUnityTest() {
      yield return null;
      Assert.True(false);
    }
  }
}
