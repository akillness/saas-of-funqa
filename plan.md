# Goal: Configure and install `ai-research-skills`

Configure the global AI research skills library by executing the official non-interactive installation package.

## User Review Required
- We will execute `npx -y @orchestra-research/ai-research-skills install --all` to install all 86 AI/ML research skills non-interactively.
- After installation, the agent session may need to be refreshed/re-read to pick up the newly loaded skills.

## Open Questions
None.

## Proposed Changes
No repository code changes. The active skills registry and global configuration will be expanded with the 86 research skills.

### Global Agent Configuration

#### [MODIFY] Global Skills Registry (via CLI)
- Run installation: `npx -y @orchestra-research/ai-research-skills install --all`

## Verification Plan

### Automated Tests
- Run `skills list -g` or check local folders to verify that research-specific skills (like `axolotl`, `grpo`, `vllm`, `autoresearch`) are now populated and recognized.
