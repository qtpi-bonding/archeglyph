# Worktree commit step races with sibling worktree cleanup

**Date:** 2026-05-11
**Source:** archeglyph dogfood — resolver pillar second build attempt
**Status:** Bug report. Caused 1 of 20 nodes to fail in our build; would likely surface again on any retry of the same DAG.
**Build:** archeglyph commit `f8ce3a8` · archegraph vendored `ccc64f1` · build_id `2323062c-4749-4149-bd38-55e17c81aae2`

---

## Symptom

In a DAG with parallel sibling nodes that get merged into the integration
branch in quick succession, the commit step on one node fails because
its working directory ends up pointing at a sibling worktree's `.git/`
metadata path AFTER that sibling has been merged and its worktree removed.

```
WARN archegraph_build_core::implementer:
  VCS reset failed
  error=git2 error: failed to resolve path
        '.git/worktrees/archebuild-2323062c-packages-core-src-resolver-filter-request-impl-ts-/':
        No such file or directory; class=Os (2); code=NotFound (-3)

[failed node was VisibilityFilterImpl, but the path it references is the FilterRequest worktree's]
```

sqlite results row:

```sql
sqlite> SELECT symbol, success, error_message, failure_kind FROM results
   WHERE symbol = 'packages/core/src/resolver/visibility_filter/impl.ts/VisibilityFilterImpl#';

VisibilityFilterImpl# | 0 |
  "git2 error: failed to create locked file
   '.git/worktrees/archebuild-2323062c-packages-core-src-resolver-filter-request-impl-ts-/index.lock':
   No such file or directory; class=Os (2); code=NotFound (-3)" |
  commit
```

Final DAG status: `failed=1 blocked=0` (the 19 sibling nodes completed
fine — only this one tripped on the cleanup race).

---

## Sequence of events (from server log)

The log records this exact ordering within ~250 ms:

```
T+460ms  scheduler: per-node strategy   symbol=…/filter_request/impl.ts/FilterRequest#  strategy=CodeGen
T+460ms  scheduler: per-node strategy   symbol=…/visibility_filter/impl.ts/VisibilityFilterImpl#  strategy=CodeGen
T+607ms  Merged branches  source=…filter-request-impl-ts-  target=…cascade-request-impl-ts
T+611ms  Convergence merge succeeded  source=…filter-request-impl-ts-  target=…cascade-request-impl-ts
T+614ms  WARN VCS reset failed  error=git2 error: failed to resolve path '.git/worktrees/archebuild-…-filter-request-impl-ts-/'
T+638ms  Removed worktree  path=…filter-request-impl-ts-
```

The VCS reset for `VisibilityFilterImpl` is referencing the FilterRequest
worktree's `.git/worktrees/<name>/` directory at T+614ms. The worktree
itself isn't removed until T+638ms — but the .git internal path appears
already to be gone by T+614ms (the actual `.archebuild/worktrees/…/`
directory is removed slightly later, but the `.git/worktrees/<name>/`
admin path that git2 looks for is removed earlier as part of the merge?).

This is a cross-worktree cwd / lookup race in the commit step.
Specifically:
- VisibilityFilterImpl#'s commit step is running, with some path it
  inherited from a sibling worktree context.
- A sibling worktree (filter_request) is being merged and its `.git/`
  admin entry is being torn down concurrently.
- VisibilityFilterImpl#'s commit tries to create `index.lock` inside
  that admin entry, which no longer exists.

---

## Suggested investigations

1. **Where does VisibilityFilterImpl's commit step get its cwd / git
   admin path from?** The fact that it references `filter-request-impl-ts-`
   suggests something is leaking the FilterRequest worktree's git context
   into the VisibilityFilterImpl run. Maybe both nodes were assigned to
   the same worker thread / executor instance and the cwd wasn't reset
   between them.

2. **Is the worktree teardown ordering correct?** Removing the
   `.git/worktrees/<name>/` admin dir BEFORE the `.archebuild/worktrees/<name>/`
   filesystem worktree may be backwards — if a sibling holds a git2
   handle into that admin dir, it'll error like we saw.

3. **Per-node mutex or git context isolation.** If multiple per-node
   commit steps can run concurrently on shared state, this race is
   structural.

The bug is non-deterministic — would not surface in single-node DAGs
or in DAGs where sibling nodes complete with enough temporal spread.
Our resolver pillar has 20 nodes mostly running in parallel with
`max_parallelism: 2`; race window is small but real.

---

## Mitigation suggestion (until fixed)

- `max_parallelism: 1` should serialize the cleanup race away.
- Alternately, the `retries.commit: N` in archebuild.yaml could
  rescue this — but the failure was logged on a single attempt for our
  build (`retries.commit: 1`), so either retry isn't kicking in for
  this failure_kind or it's being consumed before any record is kept.
  Worth confirming `retries.commit > 1` retries this case.

---

## Repro

Same as the classifier bug repro — submit our committed resolver DAG
against an active archebuild-server. The git2 race is non-deterministic
but the build is small enough (~15 s, 20 nodes) that re-running
several times should hit it. Cleanest repro path is probably to
add a deliberate sleep in the worktree teardown to widen the race
window.
