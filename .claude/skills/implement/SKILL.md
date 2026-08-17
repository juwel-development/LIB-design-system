---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

You get a github ticket to work on.

Implement the work described by the user in the spec or tickets. Check out main before starting, and create a new
feature branch for your work.

Use /tdd where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, use /code-review to review the work.

Commit your work and create a PR with a description of what you did, and any relevant context.

Use conventional commit messages, and include the ticket number in the commit message.
