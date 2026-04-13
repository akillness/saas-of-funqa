# ClawTeam Runbook

## Role Split

- Codex: master plan, system integration, convergence owner
- Claude: code structure and implementation planning owner
- Gemini: design writing and UI review owner

## Configured Team

- Team: `funqa-build`
- Leader: `codex-lead`

## Planned Task Map

1. `Master plan and integration`
   Owner: `codex-lead`
2. `Code structure and implementation plan`
   Owner: `claude-structure`
3. `Design writing and review`
   Owner: `gemini-design`

## Profile Commands

```bash
clawteam profile set saas-plan-codex --agent codex --description "saas-of-funqa master plan and integration owner"
clawteam profile set saas-structure-claude --agent claude --description "saas-of-funqa code structure and implementation planning owner"
clawteam profile set saas-design-gemini --agent gemini --description "saas-of-funqa design writing and review owner"
```

## Team Commands

```bash
clawteam team status funqa-build
clawteam task list funqa-build
clawteam board --team funqa-build
```

## Note

During this run, `clawteam profile set` showed a config write issue for some profiles. If that happens again, patch `~/.clawteam/config.json` directly and keep the same profile names.

