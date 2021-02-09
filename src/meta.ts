import {components} from '@octokit/openapi-types/generated/types';
import {markHelper, timeHelper} from './action';

export abstract class Meta {
    title: string;
    duration = 0;

    constructor(title: string) {
        this.title = title;
    }
}

export class RunMeta extends Meta {
    total = 0;
    passed = 0;
    skipped = 0;
    failed = 0;

    suites: {[key: string]: TestMeta[]} = {};

    extractAnnotations(): Annotation[] {
        const result = [] as Annotation[];
        for (const suite in this.suites) {
            for (const test of this.suites[suite]) {
                if (test.annotation !== undefined) {
                    result.push(test.annotation);
                }
            }
        }
        return result;
    }

    addTests(children: TestMeta[]): void {
        for (const child of children) {
            this.addTest(child);
        }
    }

    addTest(test: TestMeta): void {
        if (test.suite === undefined) {
            return;
        }

        let target = this.suites[test.suite];
        if (target === undefined) {
            this.suites[test.suite] = target = [];
        }

        target.push(test);
    }

    get summary(): string {
        const result = this.failed > 0 ? 'Failed' : 'Passed';
        const mark = markHelper(result);
        const sPart = this.skipped > 0 ? `, skipped: ${this.skipped}` : '';
        const fPart = this.failed > 0 ? `, failed: ${this.failed}` : '';
        const dPart = timeHelper(this.duration);
        return `${mark} ${result}: ${this.passed}/${this.total}${sPart}${fPart} in ${dPart}`;
    }
}

export class TestMeta extends Meta {
    suite: string;
    result: string | undefined;
    annotation: Annotation | undefined;

    constructor(suite: string, title: string) {
        super(title);
        this.suite = suite;
    }
}

export type Annotation = components['schemas']['check-annotation'];
