Read and strictly follow the unit test conventions defined in `.ai/UnitTestGeneration.md`. Reference `.ai/UnitTestExamples.md` for working examples of these conventions.

Before writing any tests, complete the mandatory pre-writing checklist from the style guide:

1. **Branch analysis** — Read the source file, enumerate every branch point, map each to a test scenario.
2. **Superfluous test check** — Verify each planned scenario covers a distinct branch.
3. **Execution location check** — Methods under test execute in `beforeEach()`, never in `it()`.
4. **Mock configuration check** — Mock behavior configured in `beforeEach`, not at module level.
5. **Callback invocation check** — Use `mockImplementation` for callbacks, not `mock.calls`.

Generate unit tests for: $ARGUMENTS
