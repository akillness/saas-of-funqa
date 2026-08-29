<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%)
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category         | Commands                       | Typical Savings |
| ---------------- | ------------------------------ | --------------- |
| Tests            | vitest, playwright, cargo test | 90-99%          |
| Build            | next, tsc, lint, prettier      | 70-87%          |
| Git              | status, log, diff, add, commit | 59-80%          |
| GitHub           | gh pr, gh run, gh issue        | 26-87%          |
| Package Managers | pnpm, npm, npx                 | 70-90%          |
| Files            | ls, read, grep, find           | 60-75%          |
| Infrastructure   | docker, kubectl                | 85%             |
| Network          | curl, wget                     | 65-70%          |

Overall average: **60-90% token reduction** on common development operations.

<!-- /rtk-instructions -->

## Prompt Knowledge Loop (Core Workflow Rule)

**매 프롬프트(Prompt) 유입 시 항상 다음 4가지 핵심 원칙을 최우선 규칙으로 삼아 엄격하게 실행한다.**

1. **RTK 기반 토큰 압축 (Token Compression)**
   - 입력으로 들어오는 매 프롬프트 및 명령에 대해 RTK(Rust Token Killer) 지침을 적극 준수하여 불필요한 토큰 낭비를 최소화하고 메시지를 간결하게 압축하여 효율적인 토큰 관리를 유지합니다.

2. **Graphify 기반 지식 DB 정제 (Knowledge Graph Extraction)**
   - 매 프롬프트 처리 전후로 발생한 지식을 엔티티, 관계성, 결정사항, 제약조건 단위로 구조화하여 `graphify-out/`의 지식 그래프 DB로 정제하고, 변경 시 자동으로 업데이트합니다.

3. **Obsidian Vault 표준 기반 파일/폴더 관리 (Obsidian Vault Management)**
   - 지식 데이터베이스 경로인 `knowledge/` 폴더를 공식 **Obsidian Vault**로 지정하여 모든 마크다운 문서가 Obsidian 호환 디렉토리 및 링크 표준(`[[page-name]]`)에 맞추어 계통적으로 저장되고 유기적으로 관리되도록 설계합니다.

4. **LLM-Wiki Root Directory 참조 및 점진적 자가 발전 (Self-Evolving Wiki Reference)**
   - `knowledge/`를 **llm-wiki의 루트 디렉토리(Root Directory)**로 상정하고, 매 단계마다 최우선으로 `knowledge/index.md`와 `wiki/**` 내의 문서들을 적극적으로 참조 및 의미론적/키워드 검색하여 기존 맥락을 정확히 수용하고 지식을 점진적으로 확장해 나갑니다.

---

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:

- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code, run `graphify update .` and read the refreshed `graphify-out/GRAPH_REPORT.md` before reporting architecture changes.

## llm-wiki

This project has a persistent LLM-maintained wiki at `knowledge/` which serves as the **Obsidian Vault Root**.

Rules:

- Read `knowledge/index.md` before any broad search or architecture question — it is the fastest path to relevant context
- File durable answers, decisions, and reusable findings into `knowledge/wiki/` (queries → `queries/`, memos → `reports/`, entities → `entities/`, concepts → `concepts/`)
- On every meaningful ingest: update the source summary under `knowledge/wiki/sources/`, touch affected synthesis pages, append to `knowledge/log.md`, and refresh `knowledge/index.md`
- Keep `knowledge/raw/sources/` immutable — corrections go into wiki pages, not rewrites of raw captures
- Cross-reference pages with `[[page-name]]` wiki-link syntax
- Do not record secrets, credentials, `.env` values, or Firebase service account material in the wiki

## Game Studio Harness repository contract

This repository runs the FunQA video-QA and paired-scene retrieval product. `_workspace/current/` contains immutable evidence from the retired 2026-08 game-log experiment; it is historical input, not the active product contract. Do not edit or cite those records as proof of the current release.

### Workspace and ownership

- Current release evidence lives in executable tests, `data/evals/`, `.ouroboros/seeds/`, and deployment receipts. Historical `_workspace/current/` records remain untouched until they are archived as a dedicated migration.
- Every measured statement is labeled `[OBSERVED]`, `[INFERENCE]`, or `[TARGET]` and cites the repository-relative command or evidence path behind it.
- `.runtime/**`, local model caches, generated concept output, live scenario reports, `.env*`, uploaded media, and `saas-of-funqa-firebase-adminsdk-*.json` are machine-local or secret material. Never commit them or cite them as shared gate evidence.

### Engine boundary

FunQA is a video-QA search product: Next.js/React renders the App Hosting surface, Express/Firebase Functions owns the HTTP trust boundary, Firestore stores tenant-scoped scene documents, and private Firebase Storage objects hold extracted frames. Genkit provides captioning and grounded answer generation; Gemini Embedding 2 provides the single fused image-caption-analysis vector. Work from `skill://api-design`, `skill://design-system`, `skill://system-environment-setup`, `skill://genkit`, and `skill://firebase-cli`.

- Keep the API path router → service → repository. Route handlers validate and translate; they do not own retrieval logic.
- Presentation reads typed search responses but never mutates index state outside authenticated API calls.
- Every indexed document must pair a video with its matching FunQA analysis. Original video files stay in the browser; only selected frame images, exact timecodes, and analysis evidence cross the API boundary.
- Keep one reviewed multimodal embedding space: `gemini-embedding-2` at 1536 dimensions. Do not mix legacy text vectors into scene retrieval or silently fall back after a live provider failure.
- Generated answers are optional and fail closed behind raw-score and competing-document gates. Search hits, provenance, and label-only limitations remain visible even when an answer is withheld.
- The bundled legacy corpus is read-only reference data. Its 78 OpenAI text-vector documents may compare only with each other; 24 source-derived documents are lexical-only and must never be presented as vector-searchable.
- The former Ralph page and game-log/CocoIndex/pgvector/Ollama product were retired on 2026-08-29. Historical specifications and `_workspace/current/` receipts document those releases but do not define current routes or dependencies.
- Do not apply Unity or Unreal editor/asset guidance here; neither engine exists in this repository.

### Asset generation

Editorial game-search imagery is generated only with `god-tibo-imagen` (`gti --dry-run` before `gti --output ...`). Prove one asset before a set. Every generated file receives an adjacent `.provenance.json` with prompt, inputs, tool/model, response ID when available, checksum, rights notes, and `runtimeEligible`.

### Concurrent Git safety

- Use an isolated worktree and branch for commits. If a shared worktree is unavoidable, atomically create `$(git rev-parse --git-common-dir)/funqa-studio.lock`; record the owner and hold it through stage, commit, and push.
- Stage explicit pathspecs only. Never use `git add .`, `git add -A`, cleanup resets, force-pushes, or restoration of changes owned by another session.
- Before push, fetch the explicit upstream and inspect every commit in `@{upstream}..HEAD`. Unknown commits block the push.

### Verification

- Core regression command: `npm run typecheck && npm test && npm run build:web && npm run build:functions && npm run smoke:rag && npm run smoke:functions`.
- Scenario-source gate: `FUNQA_ARCHIVE_ROOT='<local paired archive>' npm run verify:scene-scenario-suite` must prove all 10 scenarios against the 9 video-analysis pairs. A manifest-only pass is not live retrieval proof.
- Gate claims require a measured value, method, and evidence path. Missing evidence or any open S1 defect blocks PASS.
- Keep `README.md`, `data/evals/`, `.ouroboros/seeds/`, and executable verification scripts aligned with the deployed API.

<!-- OMA:START — managed by oh-my-agent. Do not edit this block manually. -->

# oh-my-agent

## Architecture

- **SSOT**: `.agents/` directory (do not modify directly)
- **Response language**: Follows `language` in `.agents/oma-config.yaml`
- **Skills**: `.agents/skills/` (domain specialists)
- **Workflows**: `.agents/workflows/` (multi-step orchestration)
- **Subagents**: Same-vendor native dispatch via Claude Code Agent tool with `.claude/agents/{name}.md`; cross-vendor fallback via `oma agent:spawn`

## Per-Agent Dispatch

1. Resolve `target_vendor_for_agent` from `.agents/oma-config.yaml`.
2. If `target_vendor_for_agent === current_runtime_vendor`, use the runtime's native subagent path.
3. If vendors differ, or native subagents are unavailable, use `oma agent:spawn` for that agent only.

## Code Search

Prefer **serena MCP** tools over native find/grep when locating code — they are symbol-aware and faster on large repos. Fall back to native Read / Glob / Grep only when serena is unavailable or for plain file content reads.

| Task                                                     | Preferred tool             |
| -------------------------------------------------------- | -------------------------- |
| Locate a symbol definition (class / function / variable) | `find_symbol`              |
| Find references / callers of a symbol                    | `find_referencing_symbols` |
| Outline a file's top-level symbols                       | `get_symbols_overview`     |
| Pattern or regex search across the codebase              | `search_for_pattern`       |
| Find a file by name                                      | `find_file`                |
| List directory contents                                  | `list_dir`                 |

## Workflows

Execute by naming the workflow in your prompt. Keywords are auto-detected via hooks.

| Workflow    | File             | Description                                                                   |
| ----------- | ---------------- | ----------------------------------------------------------------------------- |
| orchestrate | `orchestrate.md` | Parallel subagents + Review Loop                                              |
| work        | `work.md`        | Step-by-step with remediation loop                                            |
| ultrawork   | `ultrawork.md`   | 5-Phase Gate Loop (11 reviews)                                                |
| plan        | `plan.md`        | PM task breakdown                                                             |
| brainstorm  | `brainstorm.md`  | Design-first ideation                                                         |
| review      | `review.md`      | QA audit                                                                      |
| debug       | `debug.md`       | Root cause + minimal fix                                                      |
| deepsec     | `deepsec.md`     | Drive `oma-deepsec` end-to-end (setup / scan / pr-review / matchers / triage) |
| scm         | `scm.md`         | SCM + Git operations + Conventional Commits                                   |
| docs        | `docs.md`        | Documentation drift verify + sync                                             |
| recap       | `recap.md`       | Daily / period AI conversation recap                                          |

To execute: read and follow `.agents/workflows/{name}.md` step by step.

## Auto-Detection

Hooks: `UserPromptSubmit` (keyword detection), `PreToolUse`, `Stop` (persistent mode)
Keywords defined in `.agents/hooks/core/triggers.json` (multi-language).
Persistent workflows (orchestrate, ultrawork, work) block termination until complete.
Deactivate: say "workflow done".

## Rules

1. **Do not modify `.agents/` files** (SSOT protection).
2. Workflows execute via keyword detection or explicit naming, never self-initiated.
3. Response language follows `.agents/oma-config.yaml`

## Project Rules

Read the relevant file from `.agents/rules/` when working on matching code.

| Rule           | File                              | Scope                    |
| -------------- | --------------------------------- | ------------------------ |
| backend        | `.agents/rules/backend.md`        | on request               |
| commit         | `.agents/rules/commit.md`         | on request               |
| database       | `.agents/rules/database.md`       | \*_/_.{sql,prisma}       |
| debug          | `.agents/rules/debug.md`          | on request               |
| design         | `.agents/rules/design.md`         | on request               |
| dev-workflow   | `.agents/rules/dev-workflow.md`   | on request               |
| frontend       | `.agents/rules/frontend.md`       | \*_/_.{tsx,jsx,css,scss} |
| i18n-guide     | `.agents/rules/i18n-guide.md`     | always                   |
| infrastructure | `.agents/rules/infrastructure.md` | \*_/_.{tf,tfvars,hcl}    |
| market         | `.agents/rules/market.md`         | on request               |
| mobile         | `.agents/rules/mobile.md`         | \*_/_.{dart,swift,kt}    |
| quality        | `.agents/rules/quality.md`        | on request               |

<!-- OMA:END -->
