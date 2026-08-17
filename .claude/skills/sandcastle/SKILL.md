---
name: sandcastle
description: Start the Sandcastle backlog loop, held awake for the whole run. Use when the user wants to run Sandcastle, set the agents on the issue backlog, or asks whether a run is still going.
argument-hint: "optional: how many iterations"
---

A run is hours of unattended wall clock across up to `MAX_ITERATIONS` plan→execute→publish cycles. Everything here serves one goal: it starts correctly, and nothing on the host interrupts it.

**The pipeline never merges.** One `feature/issue-<id>` branch per issue, pushed and opened as a pull request against `main`; a human reviews and merges, and the `Closes #<id>` line in the PR body closes the issue then. So `main` is untouched by a run, and the deliverable to look at afterwards is the open PR list.

The branch name is not the planner's to choose — `BRANCH_PREFIX` in `.sandcastle/main.ts` decides it and overwrites whatever the plan said. Change the prefix there, and change `plan-prompt.md` to match so the logged plan doesn't read as though it disagrees.

## Preflight

Each of these kills a run late and expensively, so clear all six and name the result of each before starting.

| Check | Command | If it fails |
|---|---|---|
| Docker is up | `docker info` | ask the user to start Docker Desktop |
| The image exists | `docker image ls --filter reference='sandcastle:*'` | `npm run sandcastle:image` |
| Both tokens are set | read `.sandcastle/.env` | `CLAUDE_CODE_OAUTH_TOKEN` and `GH_TOKEN` must be non-blank |
| The Claude token is durable | the comment at the top of `.sandcastle/.env` | a Keychain-derived token expires mid-run; `claude setup-token` mints a durable one |
| There is work to pick up | `gh issue list --state open --label ready-for-agent` | with no eligible issue the planner runs once and exits; `wayfinder:*` issues and issues that already have an open `feature/issue-*` PR are filtered out, so they don't count |
| The tree is clean | `git status --short` and the current branch | sandboxes branch from here |
| The host can push | `git push --dry-run origin main` | phase 3 pushes each branch from the host over SSH — `GH_TOKEN` does not cover this, the user's SSH key does |

`SLACK_WEBHOOK_URL` in the same file is what tells the user the run opened a PR or died while they were away. Mention it if it's blank — the run works without it, they just won't hear anything.

The image tag is derived from the project directory by `sandcastle docker build-image`, which is why the check above matches on the `sandcastle:` prefix rather than naming a tag. This repository has never had a run, so the **first** preflight here will legitimately find no image — build it rather than reading its absence as something being wrong.

The board this pipeline drives is an **organisation** project (`juwel-development`, #1), not a user one. A `GH_TOKEN` that can read and write issues but has no org Projects permission passes every other check here and then fails on the first `set-status.sh` call, several minutes into the run — so if the token was minted for another repository in this workspace, re-check its scope before starting.

## Iterations

`MAX_ITERATIONS` in `.sandcastle/main.ts` is a source constant, not a flag — to change the cycle count, edit it before starting. Set it from the request: a number the user named, `1` for a smoke test, otherwise leave it alone.

Because nothing merges, a run converges sooner than the constant suggests: an issue awaiting review is skipped by the next plan, and an issue that needs its unmerged code is blocked. Expect the loop to exit early with "No unblocked issues to work on" once the backlog's independent work is all in review — that is the run finishing, not failing. Clearing the open PRs is what unblocks the rest.

## Start it awake

```
caffeinate -i npm run sandcastle
```

The run is its own leash: the hold is released the moment the loop exits, whether it finished or crashed. Use `-di` instead when the user wants the screen to stay on and watch it.

Two things about the host, worth saying before they walk away:

- **Plugged in, lid open.** Closing the lid sleeps the Mac regardless of `caffeinate`, which ends the run.
- **The run dies with this session** if you background it here. For one that survives, have the user type `! caffeinate -i npm run sandcastle` themselves.

`/keep-awake` covers holds that aren't tied to a command.

## Telling a run from a finished run

Output goes quiet between iterations — that gap is not the end. A run is over when no orchestrator process remains:

```
pgrep -f '.sandcastle/main.ts'
```

Wait for that to come back empty before touching shared branches. Per-agent logs are in `.sandcastle/logs/`, one file per agent per branch.

What a finished run leaves behind is `gh pr list --state open` — one PR per completed issue, each linked to its issue and sitting on the board as **In Review**. A branch with commits but no PR means phase 3 failed to push it (the console and Slack both say so); the work is intact on the host branch and can be pushed by hand.
