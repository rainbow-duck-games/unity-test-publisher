import {renderSummaryBody} from './action';
import {RunMeta, TestMeta} from './meta';

const model = `### Test

<details><summary>:x: Failed: 3/6, skipped: 1, failed: 2 in 3.140s</summary>

#### suite A

* :x: **Test A** - 1.230s
        
        Error message
        
        Raw details
        Test
        
* :warning: **Test B** - 2.340s


#### suite B

* :heavy_check_mark: **Test C** - 1.000s
* :heavy_check_mark: **Test D** - 4.560s

</details>

`;

describe('CheckAction', () => {
    test('renderSummary', async () => {
        const run = new RunMeta('Test');
        run.title = 'Test';
        run.total = 6;
        run.passed = 3;
        run.failed = 2;
        run.skipped = 1;
        run.duration = 3.14;
        run.addTests([
            {
                suite: 'suite A',
                title: 'Test A',
                result: 'Failed',
                duration: 1.23,
                annotation: {
                    message: 'Error message',
                    raw_details: 'Raw details\nTest',
                },
            } as TestMeta,
            {
                suite: 'suite A',
                title: 'Test B',
                result: 'Skipped',
                duration: 2.34,
            } as TestMeta,
            {
                suite: 'suite B',
                title: 'Test C',
                result: 'Passed',
                duration: 1,
            } as TestMeta,
            {
                suite: 'suite B',
                title: 'Test D',
                result: 'Passed',
                duration: 4.56,
            } as TestMeta,
        ]);
        const result = await renderSummaryBody([run]);
        expect(result).toBe(model);
    });
});
