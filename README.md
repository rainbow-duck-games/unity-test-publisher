# Unity Test Publisher

This is a simple js action to parse and present Unity Test Report generated by [unity-test-runner](https://github.com/game-ci/unity-test-runner).
Keep in mind that currently the runner is not publishing report if there is some failed
tests. That's the reason why [my fork](https://github.com/rainbow-duck-games/unity-test-runner) is used instead

For usage example check [test.yml](.github/workflows/test.yml) or documentation below

Inspired by the beautiful [action-surefire-report](https://github.com/ScaCap/action-surefire-report)

## Development

Install the dependencies

```bash
npm install
```

Run the tests & build

```bash
npm test
npm run-script prepare
```

## Usage

You can now consume the action by referencing the v1 branch

```yaml
uses: rainbow-duck-games/unity-test-publisher
name: 'Publish test results'
if: ${{ always() }} # Avoid skipping on failed tests
with:
  workdirPrefix: '/github/workspace/'
  githubToken: ${{ secrets.GITHUB_TOKEN }}
  report: ${{ steps.tests.outputs.artifactsPath }}/playmode-results.xml
```

## Full list of options
- `githubToken` (required) - GITHUB_TOKEN, in most cases keep it as `${{ secrets.GITHUB_TOKEN }}`
- `report` (required) - unity test report xml file to analyze
- `workdirPrefix` - prefix on build machine to ignore in report
- `checkName` - check name for test reports
- `failOnTestFailures` - fail run if there were test failures
- `failIfNoTests` - fail run if there were no test results found
