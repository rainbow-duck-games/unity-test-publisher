import {components} from '@octokit/openapi-types/generated/types';

export class Meta {
    title: string | undefined; // ToDo
    total = 0;
    passed = 0;
    skipped = 0;
    failed = 0;
    annotations: Annotation[] = [];
    children: Meta[] = [];

    addChild(child: Meta): void {
        this.total += child.total;
        this.passed += child.passed;
        this.skipped += child.skipped;
        this.failed += child.failed;

        this.children.push(child);
        this.annotations.push(...child.annotations);
    }

    getSummary(): string {
        return `Results: ${this.passed}/${this.total}, skipped: ${this.skipped}, failed: ${this.failed}`;
    }
}

export type Annotation = components['schemas']['check-annotation'];
