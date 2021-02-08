import {renderSummaryBody} from './action';
import {RunMeta, TestMeta} from './meta';

const model = `## Test

<details><summary>:warning: 3/6, failed 2, skipped 1 - duration 3.14s</summary>

#### suiteA
* :x: **Test A** - 1.23s
        Error message

        Raw details
* :warning: **Test B** - 2.34s

#### suiteB
* :heavy_check_mark: **Test C** - 3.45s

</details>
`;

describe('CheckAction', () => {
    test('renderSummary', async () => {
        const run = {
            title: 'Test',
            total: 6,
            passed: 3,
            failed: 2,
            skipped: 1,
            duration: 3.14,
            suites: {
                suiteA: [
                    {
                        suite: 'suite A',
                        title: 'Test A',
                        result: 'Failed',
                        duration: 1.23,
                        annotation: {
                            message: 'Error message',
                            raw_details: 'Raw details',
                        },
                    } as TestMeta,
                    {
                        suite: 'suite A',
                        title: 'Test B',
                        result: 'Skipped',
                        duration: 2.34,
                    } as TestMeta,
                ],
                suiteB: [
                    {
                        suite: 'suite B',
                        title: 'Test C',
                        result: 'Passed',
                        duration: 3.45,
                    } as TestMeta,
                ],
            } as {[key: string]: TestMeta[]},
        } as RunMeta;
        const result = await renderSummaryBody([run]);
        expect(result).toBe(model);
    });
});
