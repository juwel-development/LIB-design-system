#!/usr/bin/env bash
#
# Set an issue's status on the Design System board, adding it to the board first if it
# isn't on it yet — so one call is the whole job.
#
#   scripts/set-status.sh 74 "To Do"
#
# The board is pinned here by node id and never resolved by title. `gh issue edit --project`
# matches a project on its title string, and the moment a second project shares or nearly
# shares that title the choice is silent and arbitrary. Prefer this script to that flag.
#
# The board belongs to the `juwel-development` *organisation*, so a token driving it needs
# Projects (Read and write) for the organisation — repo-scoped issue permissions pass every
# other check and then fail here.

set -euo pipefail

readonly REPO='juwel-development/LIB-design-system'
readonly PROJECT_ID='PVT_kwDOCiHRXs4Bf_F1'
readonly STATUS_FIELD_ID='PVTSSF_lADOCiHRXs4Bf_F1zhaOAIM'

if [ $# -ne 2 ]; then
  echo "usage: $0 <issue-number> \"<To Do|In Progress|In Review|Done>\"" >&2
  exit 2
fi

readonly ISSUE="$1"
readonly STATUS="$2"

content_id=$(gh issue view "$ISSUE" -R "$REPO" --json id --jq .id)

# Resolve the status name against the field's own options rather than hardcoding the option
# ids, so renaming a column on the board surfaces as an error here instead of a silent no-op.
option_id=$(
  gh api graphql -f query='
    query($field: ID!) {
      node(id: $field) {
        ... on ProjectV2SingleSelectField { options { id name } }
      }
    }' -f field="$STATUS_FIELD_ID" \
    --jq '.data.node.options[] | "\(.id)\t\(.name)"' |
    awk -F'\t' -v want="$STATUS" '$2 == want { print $1 }'
)

if [ -z "$option_id" ]; then
  echo "unknown status: '$STATUS' (expected one of: To Do, In Progress, In Review, Done)" >&2
  exit 1
fi

# Adding an item already on the board returns the existing item id rather than erroring,
# which is what makes this safe to call on every transition and not just the first.
item_id=$(
  gh api graphql -f query='
    mutation($project: ID!, $content: ID!) {
      addProjectV2ItemById(input: { projectId: $project, contentId: $content }) {
        item { id }
      }
    }' -f project="$PROJECT_ID" -f content="$content_id" \
    --jq '.data.addProjectV2ItemById.item.id'
)

gh api graphql -f query='
  mutation($project: ID!, $item: ID!, $field: ID!, $option: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $project
      itemId: $item
      fieldId: $field
      value: { singleSelectOptionId: $option }
    }) { projectV2Item { id } }
  }' -f project="$PROJECT_ID" -f item="$item_id" -f field="$STATUS_FIELD_ID" -f option="$option_id" \
  >/dev/null

echo "#${ISSUE} → ${STATUS}"
