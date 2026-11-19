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

- Use `--bg`, `--name`, `--cwd`; put an agent's first task in `run`. Codex needs `--no-daemon`.
- On `spawn_failed`, retry with `"$(command -v <program>)"`; the core's PATH may lack `~/.local/bin`.
- For agents you launched, accept folder trust (`hc keys <t> enter`) and skip update prompts. Other `blocked` prompts: ask the user, never `send --force`.

## Attach to herdr-app

Needs only hc, so it works on remote servers too: the connected app adopts terminals labeled `herdr.space`; unlabeled ones stay hidden.

1. Copy `herdr.space` and `herdr.tab` from `hc get $HC_TERMINAL_ID --json` (for `--on box`, from a `box/t…` terminal; IDs are machine-local). If none, use `sp` plus a hyphenless UUID.
2. Set both labels at launch, so it joins your tab. Omit `herdr.tab` or change space only if the user asks. Relabeling an adopted terminal doesn't move it.
3. Verify: `hc get <t>` shows `where: "<space> / <tab>"`. If missing, report display unverified; never install, connect or restart anything.

```sh
hc run --bg --name codex --cwd /path/to/repo --label herdr.space=<space> --label herdr.tab=<tab> \
  "$(command -v codex)" --no-daemon
hc get codex                           # where: "dotagent / 1"
```

On a GUI host with `herdr-app`: `herdr-app ls` / `status` to inspect (never bare `herdr-app`); for a new visible space/tab/split the user asks for, use `herdr-app do ...` (check `herdr-app commands`), e.g. `herdr-app do tab.new --name "fix login" --argv '["claude"]' --task "..." --focus false`.

## Cleanup

`hc kill <t>; hc rm <t>` for terminals you started, unless the user wants them kept. Never stop, restart or update their core or app unless asked.
