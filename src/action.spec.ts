import {renderSummary, renderText} from './action';
import {Annotation, RunMeta, TestMeta} from './meta';

const summaryModel = `### ❌️ Test - 3/6, skipped: 1, failed: 2 - Failed in 3.140s
* ❌️ **Test A** - Failed in 1.230s
        /test/file:3

* ❌️ **Test B** - Failed in 2.340s
        /test/file/b:54

`;
const textModel = `### Test

<details><summary>❌️ Suite A - 0/2, skipped: 1, failed: 1 - Failed in 3.570s</summary>

* ❌️ **Test A** - Failed in 1.230s
        
        Error message
        
        Raw details
        Test
        
* ⚠️ **Test B** - Skipped

</details>

<details><summary>✔️ Suite B - 2/2 - Passed in 5.560s</summary>

* ✔️ **Test C** - Passed in 1.000s
* ✔️ **Test D** - Passed in 4.560s

</details>

`;

describe('CheckAction', () => {
    test('renderText', async () => {
        const testA = new TestMeta('Suite A', 'Test A');
        testA.result = 'Failed';
        testA.duration = 1.23;
        testA.annotation = {
            message: 'Error message',
            raw_details: 'Raw details\nTest',
        } as Annotation;

        const testB = new TestMeta('Suite A', 'Test B');
        testB.result = 'Skipped';
        testB.duration = 2.34;

        const testC = new TestMeta('Suite B', 'Test C');
        testC.result = 'Passed';
        testC.duration = 1;

        const testD = new TestMeta('Suite B', 'Test D');
        testD.result = 'Passed';
        testD.duration = 4.56;

        const run = new RunMeta('Test');
        run.title = 'Test';
        run.total = 6;
        run.passed = 3;
        run.failed = 2;
        run.skipped = 1;
        run.duration = 3.14;
        run.addTests([testA, testB, testC, testD]);
        const result = await renderText([run]);
        expect(result).toBe(textModel);
    });

    test('renderSummary', async () => {
        const testA = new TestMeta('Suite A', 'Test A');
        testA.result = 'Failed';
        testA.duration = 1.23;
        testA.annotation = {
            path: '/test/file',
            start_line: 3,
        } as Annotation;
        const testB = new TestMeta('Suite B', 'Test B');
        testB.result = 'Failed';
        testB.duration = 2.34;
        testB.annotation = {
            path: '/test/file/b',
            start_line: 54,
        } as Annotation;
        const testC = new TestMeta('Suite B', 'Test C');

        const run = new RunMeta('Test');
        run.title = 'Test';
        run.total = 6;
        run.passed = 3;
        run.failed = 2;
        run.skipped = 1;
        run.duration = 3.14;
        run.addTests([testA, testB, testC]);
        const result = await renderSummary([run]);
        expect(result).toBe(summaryModel);
    });
});
