---
name: git-commit
description: Draft a Linux-kernel-style Git commit message from a supplied diff or an explicitly selected Git change set.
disable-model-invocation: true
---

# Git Commit

Generate commit messages only. Leave the index, worktree, and repository history
unchanged.

## Steps

### 1. Establish the commit boundary

Use a diff supplied by the user when present. Otherwise:

1. Confirm the current directory is inside a Git worktree.
2. Read `git status --short`, `git diff --staged --name-status`,
   `git diff --staged --stat`, and `git diff --staged`.
3. If the staged diff is empty, report that there is no staged change. Draft from
   the working tree only when the user explicitly selects that boundary; then use
   the equivalent unstaged commands.
4. For a large diff, inspect it file by file with path-limited diffs. Account for
   binary files, renames, mode changes, and submodules from the summary output.

This step is complete when every file inside the selected boundary has been
inspected and no file outside it informs the message.

### 2. Find the atomic change

Map every changed file to its purpose. Treat the patch as atomic when all changes
serve one reviewable purpose; directory count alone is not evidence that it
should be split.

When the patch contains independent purposes, propose separate commit groups and
assign every changed file to exactly one group. Generate one message per group
only when its diff can be determined from the available patch; otherwise identify
the files to stage together before drafting their message.

This step is complete when the selected patch has one coherent purpose, or every
file has been assigned exactly once across coherent proposed commits.

### 3. Derive the message

Infer the subsystem prefix from the narrowest meaningful component shared by the
change. Prefer established local vocabulary from nearby paths and recent commit
subjects over a mechanical top-level directory name. Use nested prefixes such as
`net: tcp:` only when the repository's convention supports them.

Write each message as plain text:

```text
<subsystem>: <imperative summary>

<why the previous behavior was a problem>
<what the change does and any important consequence>

<optional trailers>
Signed-off-by: <name> <email>
```

Apply these rules:

- Write the subject in English, begin the summary with an imperative verb, omit
  the final period, target 50 characters, and never exceed 72 characters.
- Write the body primarily in Chinese unless the user requests another language.
  Explain motivation and behavior rather than narrating the diff. Omit the body
  for a genuinely self-explanatory change.
- Wrap prose at 72 display columns. Keep an indivisible URL and a correctly
  formatted trailer intact when wrapping would corrupt it.
- Add `Signed-off-by` unless the user requests `--no-signoff`. Read the identity
  from `git config user.name` and `git config user.email`; report a missing value
  instead of inventing one.
- Add `Fixes: <12-char SHA> ("<original subject>")` only when the user identifies
  a causal commit and the SHA and subject can be verified. Preserve issue
  references separately rather than encoding them as a kernel `Fixes:` trailer.
- Place trailers after one blank line, with `Fixes:` before `Signed-off-by`.

This step is complete when the message accurately covers the whole atomic patch
and every subject and prose line satisfies its length and format rule.

### 4. Verify and present

Re-read the selected diff against the draft. Check the subject character count,
prose display width, blank lines, trailer values, imperative mood, subsystem, and
claims about behavior. Correct every mismatch.

Return each final message in a `text` code fence. When recommending a split, label
each message with its file group outside the fence. Mention only unresolved facts
or staging actions needed to make the proposed boundary real.

This step is complete when the output is ready for the user to review and no Git
state has changed.
