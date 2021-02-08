import {renderSummary} from './action';
import {RunMeta} from './meta';

describe('CheckAction', () => {
    test('renderSummary', async () => {
        const result = await renderSummary({title: 'Test'} as RunMeta);
        expect(result).toBe('Hello, Test!');
    });
});
