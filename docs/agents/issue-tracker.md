# Issue tracker

**GitHub Issues** on [`juwel-development/LIB-design-system`](https://github.com/juwel-development/LIB-design-system)
(`$R` below). Issues use native **sub-issues** (hierarchy) and **blocked-by dependencies** (blocking),
both driveable from `gh` (2.94.0+). This page is the tracker mechanics; per-skill labels and
conventions live with each skill.

Tickets belong to the **Design System** GitHub Project — **project #1**, owner `juwel-development`
(the organisation, not the `juwel-dev` user account), node id **`PVT_kwDOCiHRXs4Bf_F1`**. Add the
**`ready-for-agent`** label in case an item is ready to be implemented by an agent.

Its status field (`PVTSSF_lADOCiHRXs4Bf_F1zhaOAIM`) runs `To Do` → `In Progress` → `In Review` →
`Done`. **New items must be created with status `To Do`.** The skills drive the later transitions:
`/implement` moves a ticket to **In Progress** when it picks it up, and `/code-review` moves it to
**In Review** when the review is done. **`Done` belongs to whoever lands the work** — the human who
merges the pull request, or `/orca-implement` when it merges a reviewed branch onto the local `main`.
Neither `/implement` nor `/code-review` ever sets it.

### Putting a new issue on the board

Use `scripts/set-status.sh` rather than `gh issue create --project`. It is pinned to the board
by node id, and it **adds the issue to the board if it isn't there yet** — so it is the
whole job, not a second step:

```bash
gh issue create -R $R --title "…" --body-file ticket.md --label enhancement --label ready-for-agent
scripts/set-status.sh <ISSUE_NUMBER> "To Do"    # adds to project #1 AND sets the status
```

The same script moves a status later — `scripts/set-status.sh <N> "In Progress"` — and is safe to
call on a ticket already on the board, so no caller has to know whether it is a first add or a
transition.

Resolving a board by name is worth avoiding on principle: `--project` matches on a title string, and
the moment a second project shares or nearly shares that title the choice is silent and arbitrary.
The script names the board by id, which cannot go wrong that way. Verify with:

```bash
gh issue view <N> -R $R --json projectItems \
  --jq '[.projectItems[] | .status.name // "NONE"] | join(" + ")'   # expect exactly: To Do
```

One entry, reading `To Do`. Two entries means the issue is on more than one board; a blank status
means it was added without one, which is **not** the same as `To Do` and still won't appear in that
column.

```bash
# Create a child issue (--parent takes the parent's number):
gh issue create -R $R --title "…" --body "…" --parent <PARENT>
gh issue edit <CHILD> -R $R --add-sub-issue <PARENT>      # attach an existing one

# Blocking — wire in a second pass, after issues have numbers:
gh issue edit <D> -R $R --add-blocked-by <A>,<B>          # D blocked by A and B
# unblocked = every blocker closed. Remove with --remove-blocked-by.

# Claim / assign:
gh issue edit <N> -R $R --add-assignee "@me"

# Read a parent with each child's state, labels, assignees, and blockers:
gh api graphql -f query='
query($owner:String!, $repo:String!, $number:Int!){
  repository(owner:$owner, name:$repo){ issue(number:$number){
    number title state
    subIssues(first:100){ nodes{
      number title state
      labels(first:20){ nodes { name } }
      assignees(first:10){ nodes { login } }
      blockedBy(first:50){ nodes { number state } }
    }}
  }}
}' -F owner=juwel-development -F repo=LIB-design-system -F number=<PARENT>
```

**Prefer the `gh issue` flags above — they take plain issue numbers.** GraphQL mutations want node IDs
(`gh issue view <N> --json id`) and REST wants the numeric db id (`gh api /repos/$R/issues/<N> --jq .id`);
only drop to those for bulk reads or the query above.

Limits: 100 sub-issues per parent (8 deep); 50 blocked-by links per issue; dependencies need ≥ triage permission.

### An organisation board, not a user one

The board lives on the **`juwel-development` organisation**, which is also what owns this repository.
That is a difference from the other repositories in this workspace, whose boards hang off the
`juwel-dev` user account — so `--owner juwel-development` is required on every `gh project` call here,
and a command copied from one of those repositories will look at the wrong owner and find nothing.
A token driving the board needs **Projects (Read and write)** for the organisation.
