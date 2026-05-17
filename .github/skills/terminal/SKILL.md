---
name: terminal
description: >
  TRIGGER KEYWORDS: terminal, shell, bash, PowerShell, CLI, command, script,
  alias, one-liner, pipe, grep, sed, awk, jq, curl, rg, fd, fzf, process,
  automation, shell-config, .bashrc, .zshrc, $PROFILE, git-cli.
  MUST be used when writing shell commands, CLI scripts, or automating
  terminal tasks.
context: fork
---

# Terminal / Command-Line Skill

## Goal
Precise, safe, composable terminal commands. Every command must handle spaces, special chars, and errors.

## Core Rules
- **Quote everything** with spaces: `"$DIR"`
- **Use `--`** to separate options from args
- **Fail fast**: `set -euo pipefail` (Bash), `$ErrorActionPreference = "Stop"` (PowerShell)

## Quick Reference

| Concern | Bash | PowerShell |
|---|---|---|
| Strict | `set -euo pipefail` | `$ErrorActionPreference="Stop"` |
| Variable | `"$VAR"` | `"$env:VAR"` |
| File exists | `[[ -f "$f" ]]` | `Test-Path "$f"` |
| Loop | `for f in *; do; done` | `foreach ($f in Get-ChildItem) { }` |

## Modern Replacements
| Legacy | Modern |
|---|---|
| `find` | `fd` |
| `grep` | `rg` |
| `cat` | `bat` |
| `ls` | `eza` |
| `top` | `btm` |

## One-Liners
```bash
# Find + replace
rg -l "old" | xargs sed -i 's/old/new/g'

# Kill port process
kill -9 $(lsof -t -i:3000)

# JSON filter
curl -s https://api.github.com/repos/user/repo | jq '{name, stars}'

# Disk usage top 10
du -sh */ | sort -rh | head -10
```

## Safety
- No `curl | sh` without inspection
- No `eval`, backticks, or dynamic code
- No parsing `ls` output
- No `rm -rf` without `${VAR:?}` guard
- No secrets in command history — use `read -s` or env prompts

## References
- `references/COMMAND_REFERENCE.md`
