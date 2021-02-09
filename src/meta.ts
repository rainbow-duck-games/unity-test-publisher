﻿import {components} from '@octokit/openapi-types/generated/types';
import {timeHelper} from './action';

export abstract class Meta {
    title: string;
    duration = 0;

    constructor(title: string) {
        this.title = title;
    }

    abstract get summary(): string;

    abstract get mark(): string;
}

export class RunMeta extends Meta {
    total = 0;
    passed = 0;
    skipped = 0;
    failed = 0;

    tests: TestMeta[] = [];
    suites: RunMeta[] = [];

    extractAnnotations(): Annotation[] {
        const result = [] as Annotation[];
        for (const suite of this.suites) {
            result.push(...suite.extractAnnotations());
        }
        for (const test of this.tests) {
            if (test.annotation !== undefined) {
                result.push(test.annotation);
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
        if (test.suite === this.title) {
            this.total++;
            this.duration += test.duration;
            this.tests.push(test);
            if (test.result === 'Passed') this.passed++;
            else if (test.result === 'Failed') this.failed++;
            else this.skipped++;
            return;
        }

        let target = this.suites.find(s => s.title === test.suite);
        if (target === undefined) {
            target = new RunMeta(test.suite);
            this.suites.push(target);
        }

        target.addTest(test);
    }

    get summary(): string {
        const result = this.failed > 0 ? 'Failed' : 'Passed';
        const sPart = this.skipped > 0 ? `, skipped: ${this.skipped}` : '';
        const fPart = this.failed > 0 ? `, failed: ${this.failed}` : '';
        const dPart = ` in ${timeHelper(this.duration)}`;
        return `${this.mark} ${this.title} - ${this.passed}/${this.total}${sPart}${fPart} - ${result}${dPart}`;
    }

    get mark(): string {
        if (this.failed > 0) return '❌️';
        else if (this.skipped === 0) return '✔️';
        return '⚠️';
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

    get summary(): string {
        const dPart =
            this.result === 'Skipped' ? '' : ` in ${timeHelper(this.duration)}`;
        return `${this.mark} **${this.title}** - ${this.result}${dPart}`;
    }

    get mark(): string {
        if (this.result === 'Failed') return '❌️';
        else if (this.result === 'Passed') return '✔️';
        return '⚠️';
    }
}

export type Annotation = components['schemas']['check-annotation'];
