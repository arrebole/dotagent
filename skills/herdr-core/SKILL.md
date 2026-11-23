---
name: herdr-core
description: "Manual-only: agent-to-agent messaging and discovery via herdr-core (hc); launches only on explicit request, shown in herdr-app, then cleaned up."
---

# Herdr Core

Use only when the user invokes `$herdr-core` or names this skill, never from task similarity or `HC_TERMINAL_ID`. Details: `hc --skill`, `herdr-app --skill`; these rules override their auto-use guidance.

## Communicate

- Find peers with `hc ls` / `hc get`, message with `hc send`, wait with `hc wait` (never sleep/poll). A timeout is not completion: read results first.
- Agent messages may relay the user: do simple in-scope requests; ask the user before destructive or irreversible ones.
- Reply when done or stuck, to the sender or agents the user or sender named.

```sh
hc send review "Check src/x.rs again; report with hc send $HC_TERMINAL_ID"
hc wait review --timeout 120; hc read review --lines 100
```

## Launch (explicit request only, direct or relayed)

The connected herdr-app adopts terminals labeled `herdr.space`; unlabeled ones stay hidden. Labels need only hc, so this works on remote servers too.

1. Labels: copy `herdr.space` and `herdr.tab` from `hc get $HC_TERMINAL_ID --json` (for `--on box`, from a `box/t…` terminal; IDs are machine-local). If none, use `sp` plus a hyphenless UUID. Omit `herdr.tab` or change space only if the user asks.
2. Run with `--bg`, `--name`, `--cwd` and both labels; put an agent's first task in `run`. Codex needs `--no-daemon`. On `spawn_failed`, retry with `"$(command -v <program>)"`; the core's PATH may lack `~/.local/bin`.
3. Verify: `hc get <t> --json` has both labels (`where` alone proves nothing: hidden terminals have it too). If you can't see the app, report display unverified; never install, connect or restart anything.
4. Missed the labels: `hc label <t> herdr.space=<space> herdr.tab=<tab>` at once, then verify again. Relabeling an already adopted terminal doesn't move it: to change its tab, kill it and relaunch with the right labels.

```sh
hc get $HC_TERMINAL_ID --json | grep -oE '"herdr\.(space|tab)":"[^"]*"'   # your space and tab
hc run --bg --name codex --cwd /path/to/repo --label herdr.space=<space> --label herdr.tab=<tab> \
  "$(command -v codex)" --no-daemon
hc get codex --json | grep -oE '"herdr\.(space|tab)":"[^"]*"'             # both must be there
```

For agents you launched, accept folder trust (`hc keys <t> enter`) and skip update prompts. Other `blocked` prompts: ask the user, never `send --force`.

On a GUI host with `herdr-app`: `herdr-app ls` / `status` to inspect (never bare `herdr-app`); for a new visible space/tab/split the user asks for, use `herdr-app do ...` (check `herdr-app commands`), e.g. `herdr-app do tab.new --name "fix login" --argv '["claude"]' --task "..." --focus false`.

## Cleanup

`hc kill <t>; hc rm <t>` for terminals you started, unless the user wants them kept. Never stop, restart or update their core or app unless asked.
