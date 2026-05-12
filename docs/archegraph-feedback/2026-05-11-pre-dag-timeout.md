# archebuild lifecycle hooks (pre_dag / post_dag) need timeout or heartbeat

**Date:** 2026-05-11
**Source:** archeglyph dogfood — resolver pillar first build attempt
**Status:** Bug report (separate concern from TS codegen — lives in `build-core`/archebuild executor, not `lang-typescript`)
**Routing:** Acknowledged by archegraph agent in reply to `2026-05-11-ts-codegen-imports-and-map.md`; filed standalone per their request.

---

## Context

While dogfooding the resolver pillar build (build `7713d1be-ea92-4c36-8f10-ebca8d7e2b99`),
the run hung silently at the `pre_dag` step because Docker Desktop was
not running on the host. No timeout fired, no error surfaced, no
progress line was logged — the build sat there indefinitely until
manually `kill`ed the server.

Looking at the spec: `default_timeout_seconds: 600` is set in the
project's `archebuild.yaml`, but it only applies to per-DAG-node
execution. Lifecycle hooks (`pre_dag`, `post_dag`, and probably
`pre_node_defaults` / `post_node_defaults` too) bypass that timeout
machinery — they run synchronously and block the scheduler until they
return.

---

## Repro

`archebuild.yaml` snippet (full file in archeglyph repo root):

```yaml
execution:
  max_parallelism: 2
  default_timeout_seconds: 600
  executor: shell
  # ...
  pre_dag:
    - label: regen-proto
      command: docker compose -p archeglyph run --rm -T dev bash -lc "bun install --frozen-lockfile && bun run proto:gen" < /dev/null
```

Step to repro:
1. Stop Docker Desktop / take the daemon offline.
2. `archebuild-server &`
3. `archegraph-cli submit-dag --dag <dag.pb> --context <gcontract.pb> --config archebuild.yaml --server http://localhost:50051`

Observed:
- Server log emits `pre_dag: running user step label=regen-proto command=…`
- Then nothing. For ~10+ minutes.
- `ps aux` shows the `docker compose run` child process is blocked
  waiting on the daemon (no progress, no failure).
- `default_timeout_seconds=600` does not fire.
- No periodic "still running" heartbeat in the server log.

Recovery requires manually identifying the hang (only way is "nothing
in the log") and `kill`ing the server PID.

---

## Suggested behavior — pick one or both

**Option A: honor `default_timeout_seconds` for lifecycle hooks.**
Treat `pre_dag` / `post_dag` (and analogous hooks) as bounded
operations. If they exceed the timeout, log the failure and abort the
build with a clear error (`pre_dag step "<label>" timed out after Ns`).

**Option B: periodic heartbeat log line for long-running steps.**
Every N seconds (60s? 120s?) emit `INFO pre_dag step "<label>" still
running (elapsed=Xs)`. Doesn't auto-recover, but lets the operator
notice the hang without polling.

Option A alone is sufficient for "agent doesn't have to babysit."
Option B alone is sufficient for "operator can see what's happening."
Both together is best.

Per-step timeout override would also be reasonable (`pre_dag: [{ label, command, timeout_seconds }]`) — `docker compose run` may legitimately
take 5+ min on a cold cache, while a quick `make codegen` might
reasonably want a 60s timeout. The DAG-wide default is a fine starting
point but per-step granularity scales.

---

## Why this surfaces in dogfood specifically

archeglyph's `pre_dag` runs `bun install + buf gen` inside a Docker
container. This is genuinely the right design — buf needs a hermetic
environment with `protoc-gen-es` installed, and Docker is the cheapest
way to get one on a mac. The cost is that the build now depends on
Docker Desktop being up, which is **a soft external dependency the
project intentionally accepts**. The dogfood thus surfaces what
happens when soft external deps are degraded — and right now, the
answer is "silent indefinite hang." Other projects with `pre_dag`
hooks calling network services, package managers, or other external
tools will hit the same shape.

---

## Adjacent thoughts (not asks)

- If lifecycle hooks acquire timeouts, the existing `commands[].attempts`
  retry shape for per-node steps could be a model — `pre_dag: [{ ...,
  attempts: 2 }]` retries on timeout. Probably overkill for v1; mention
  for completeness.
- The current `retries:` block (`agent: 3, timeout: 3, commit: 1`) has
  a `timeout: 3` entry that hints retry-on-timeout exists somewhere —
  not clear from skill docs what scope that applies to. Worth
  documenting alongside this fix.
