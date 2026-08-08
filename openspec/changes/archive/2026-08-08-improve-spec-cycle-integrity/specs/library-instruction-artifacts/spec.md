## MODIFIED Requirements

### Requirement: Canonical Universal Development Loop source

The repository SHALL have exactly one file that defines the Universal Development Loop step list and its supporting sections. The canonical file SHALL be `instructions/universal-development-loop.md`. Every other artifact in the repository that previously restated the step list SHALL contain only a reference or role-specific delta and SHALL NOT claim canonical sections or step counts that the canonical file does not contain.

The current canonical loop SHALL contain 12 steps through `Process Improvement`, followed by `Quality Defaults` and `Output Shape`. Token and time policy SHALL remain owned by the always-loaded operating priorities and `docs/token-economy.md`; documentation SHALL NOT claim a nonexistent canonical `Token/Time Rules` section.

#### Scenario: kit docs pointer

- **WHEN** a reader opens `docs/universal-development-loop.md`
- **THEN** the file SHALL contain a `## Universal Development Loop` heading
- **AND** the body SHALL point to `instructions/universal-development-loop.md` without restating the step list or inventing canonical sections.

#### Scenario: project template avoids a broken target-relative dependency

- **WHEN** `tools/init-project.ts` writes `AGENTS.md` into a target project
- **THEN** the written file SHALL describe the active global runtime authority
- **AND** it SHALL NOT require the target project to contain `instructions/universal-development-loop.md`.

#### Scenario: reusable project instructions use runtime authority

- **WHEN** `instructions/reusable-project-agent-instructions.md` is rendered
- **THEN** the file SHALL NOT inline the 12-step Universal Development Loop list
- **AND** it SHALL identify the loop as conceptual guidance subordinate to the loaded global authority.

#### Scenario: validator rejects current step duplication

- **WHEN** `npm run validate` scans the repository
- **THEN** the orchestrator SHALL fail with a clear error if any artifact other than `instructions/universal-development-loop.md` contains the current full 12-step loop body
- **AND** the detector SHALL derive or maintain the current step names rather than retired lifecycle names.

## ADDED Requirements

### Requirement: Compaction analyzes improvement across three directions and two targets
Every compaction summary SHALL evaluate quality, cycle speed, and token economy for both the active working repository and `opencode-kit`. Each of the six cells SHALL record observed session evidence, the smallest cheap improvement, expected benefit, cost/risk, or `none` when the session supplies no supporting evidence.

An improvement candidate SHALL be admitted only when it is local, reversible, low-cost, and causally linked to an observed loss or opportunity. The summary SHALL NOT invent timing, recurrence, savings, or root cause.

At next-session start, the agent SHALL verify the candidates against `Original User Goal` and MAY execute at most one highest-ROI working-repository improvement when it directly accelerates that goal and does not expand scope. An `opencode-kit` candidate SHALL remain visible but SHALL NOT become the next action while an unrelated project goal is incomplete unless the kit defect directly blocks that goal or the owner explicitly included kit work.

#### Scenario: Session provides evidence in every direction
- **WHEN** a session observes a quality rework cause, a repeated slow loop, and duplicated context or noisy output
- **THEN** compaction records evidence-backed candidate improvements for all applicable working-repository and kit cells
- **AND** the next session selects no more than one admissible action.

#### Scenario: Session provides no evidence for a cell
- **WHEN** the session contains no observation supporting an improvement in one target and direction
- **THEN** that cell reports `none`
- **AND** it does not manufacture a generic best practice.

#### Scenario: Kit improvement would distract from incomplete project work
- **WHEN** the original project goal remains incomplete and a non-blocking kit improvement is available
- **THEN** the next action remains the highest-value project-goal action
- **AND** the kit candidate stays recorded without mutation.

### Requirement: Structural validation and behavior evaluation have separate authority
The kit SHALL permit deterministic TypeScript validators, schemas, fixtures, inventories, and tests for explicit structural facts, official config shape, exact safety invariants, mirror drift, and stable machine-readable output. Such helpers SHALL NOT score, rank, infer, or optimize instruction or process effectiveness.

Instruction and process behavior changes SHALL use disposable same-model baseline/candidate workflows with the same input and environment, observable quality oracles, and recorded time/rework. A durable behavior instruction change SHALL be retained only when that workflow preserves required quality and demonstrates the accepted benefit or fixes a reproduced defect.

#### Scenario: Exact structural invariant needs enforcement
- **WHEN** a required OpenSpec field or protected-boundary marker can be checked deterministically
- **THEN** a focused validator and fixture MAY enforce its presence and failure output
- **AND** the validator does not claim that the model will behave correctly.

#### Scenario: Prompt effectiveness is under review
- **WHEN** an instruction change claims better spec quality, speed, or token economy
- **THEN** the claim is evaluated through a disposable baseline/candidate workflow
- **AND** no fuzzy TypeScript scoring harness is added.

### Requirement: Portable authority excludes personal runtime facts
Committed reusable global instructions SHALL contain portable behavior and safety authority only. Personal language preferences, availability assumptions, authenticated model inventories, and other machine-local facts SHALL live in a gitignored instruction source loaded through an official schema-supported mechanism.

#### Scenario: Another user installs the kit
- **WHEN** a user other than the current maintainer points OpenCode at the kit global directory
- **THEN** committed instructions do not force the maintainer's name, language, availability, or local model inventory
- **AND** portable routing remains complete.

### Requirement: Always-loaded reductions require workflow evidence
The kit SHALL prefer removing personal facts and exact duplicated detail before relocating safety authority. A reduction to the always-loaded lifecycle, delegation, owner-handoff, or compaction contract SHALL be retained only when its relevant disposable workflow passes every required quality oracle and its instruction or output surface is smaller.

#### Scenario: Faster compact candidate misses one safety oracle
- **WHEN** a compact instruction candidate is faster or shorter but misses any required safety or residual-risk oracle
- **THEN** the broad reduction is rejected
- **AND** only independently proved narrower reductions may proceed.
