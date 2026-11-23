---
name: herdr-core
description: "Manual-only: agent-to-agent messaging and discovery via herdr-core (hc); launches only on explicit request, always attached into herdr-app (herdr.space/herdr.tab labels in the same hc run), then cleaned up."
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
- **Attach in the same command, every time**: add both display labels (next section). A terminal started without them is invisible in herdr-app, and relabeling an adopted one does not move it. "Launch now, attach later" is a bug, not a shortcut.
- On `spawn_failed`, retry with `"$(command -v <program>)"`; the core's PATH may lack `~/.local/bin`.
- For agents you launched, accept folder trust (`hc keys <t> enter`) and skip update prompts. Other `blocked` prompts: ask the user, never `send --force`.

```sh
# preferred: `hcv` wraps `hc run` and always adds the labels (~/.local/bin/hcv)
hcv --bg --name fix --cwd /path/to/repo claude "Fix the failing test; no subagents; report with hc send $HC_TERMINAL_ID when done or stuck."

# without hcv: the same labels on a plain hc run (jq)
hc run --bg $(hc get "$HC_TERMINAL_ID" --json | jq -r '.labels|. as $l|["herdr.space","herdr.tab"][]|"--label \(.)=\($l[.])"') \
  --name fix --cwd /path/to/repo claude "Fix the failing test; no subagents; report with hc send $HC_TERMINAL_ID when done or stuck."
```

If that lookup fails, your own terminal has no labels: follow step 1 below, never drop the labels. With `--on <machine>`, take the labels from a terminal on that machine (`hc get machine/t7`); `hcv` only knows this one.

## Attach to herdr-app (required, not optional)

Every launch is visible: the connected app adopts terminals labeled `herdr.space`; unlabeled ones stay hidden. Needs only hc, so it works on remote servers too. Skipping this is the most common launch defect — the launch rules above include it, treat this section as the detail.

1. Take `herdr.space` and `herdr.tab` from `hc get $HC_TERMINAL_ID --json` (for `--on box`, from a `box/t…` terminal; IDs are machine-local). If none, use `sp` plus a hyphenless UUID.
2. Pass both as `--label` in the `hc run` command, so it joins your tab. Drop `herdr.tab` or change space only if the user asks.
3. Verify the labels, not `where`: `hc get <t> --json` must show `labels.herdr.space` (and `herdr.tab`). A `where` label can appear even on a hidden terminal, so it proves nothing. If the app shows it as `<space> / <tab>`, fine; if you cannot see the app, report display unverified — never install, connect or restart anything.
4. Repair: a terminal not yet adopted can be fixed with `hc label <t> herdr.space=… herdr.tab=…`; once adopted, labels no longer move it — `hc kill <t>`, then relaunch with the labels.

```sh
hc run --bg --name codex --cwd /path/to/repo --label herdr.space=<space> --label herdr.tab=<tab> \
  "$(command -v codex)" --no-daemon
hc get codex                           # where: "dotagent / 1"
```

On a GUI host with `herdr-app`: `herdr-app ls` / `status` to inspect (never bare `herdr-app`); for a new visible space/tab/split the user asks for, use `herdr-app do ...` (check `herdr-app commands`), e.g. `herdr-app do tab.new --name "fix login" --argv '["claude"]' --task "..." --focus false`.

## Cleanup

`hc kill <t>; hc rm <t>` for terminals you started, unless the user wants them kept. Never stop, restart or update their core or app unless asked.
