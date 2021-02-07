import {components} from '@octokit/openapi-types/generated/types';

export abstract class Meta {
    title: string;
    duration = 0;

    constructor(title: string) {
        this.title = title;
    }
}

export class SuiteMeta extends Meta {
    total = 0;
    passed = 0;
    skipped = 0;
    failed = 0;

    children: Meta[] = [];

    addChild(...children: Meta[]): void {
        this.children.push(...children);
    }

    getSummary(): string {
        return `Results: ${this.passed}/${this.total}, skipped: ${this.skipped}, failed: ${this.failed}`;
    }
}

export class TestMeta extends Meta {
    result: string | undefined;
    annotation: Annotation | undefined;
}

export type Annotation = components['schemas']['check-annotation'];
