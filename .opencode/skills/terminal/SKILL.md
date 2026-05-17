---
name: terminal
description: >
  TRIGGER KEYWORDS: terminal, command-line, shell, bash, PowerShell, zsh,
  CLI, command, script, alias, one-liner, pipe, grep, sed, awk, jq, curl,
  wget, find, xargs, rg, fd, bat, fzf, tmux, screen, env-var, PATH,
  shell-config, .bashrc, .zshrc, $PROFILE, process, jobs, bg, fg,
  nohup, kill, ps, top, htop, lsof, netstat, ss, disk, du, df,
  compression, tar, gzip, zip, rsync, scp, ssh, git-cli, npm, npx,
  pip, cargo, dotnet, choco, winget, apt, yum, dnf, brew.
  MUST be used when writing shell commands, one-liners, CLI scripts,
  automating terminal tasks, or optimizing shell workflows.
---

# Terminal / Command-Line Skill

## Goal
Write precise, safe, and composable terminal commands. Every command should be intention-revealing, pipe-safe, and handle edge cases (spaces, special chars, missing files).

## Core Principles

### Quote Everything That Could Contain Spaces
```bash
# Bad — breaks on "My Documents"
rm -rf $DIR

# Good
rm -rf "$DIR"
```

### Prefer `--` to Separate Options from Arguments
```bash
# Bad — if filename starts with "-"
grep pattern -file

# Good
grep pattern -- -file
```

### Fail Fast — Check Exit Codes
```bash
command || { echo "Failed"; exit 1; }
set -euo pipefail  # Bash strict mode
$ErrorActionPreference = "Stop"  # PowerShell strict
```

## OS-Specific Conventions

| Concern | Bash / Linux | PowerShell (Windows) |
|---|---|---|
| Strict mode | `set -euo pipefail` | `$ErrorActionPreference = "Stop"` |
| Variable | `"$VAR"` | `"$env:VAR"` |
| Command subst | `$(cmd)` | `$(cmd)` |
| Pipe | `\|` | `\|` |
| String concat | `"$a$b"` | `"$a$b"` |
| Array | `("a" "b")` | `@("a", "b")` |
| Null check | `[[ -z "$var" ]]` | `[string]::IsNullOrEmpty($var)` |
| File exists | `[[ -f "$path" ]]` | `Test-Path -LiteralPath "$path"` |
| Loop | `for f in *; do ... done` | `foreach ($f in Get-ChildItem) { ... }` |

## Modern CLI Replacements

| Legacy | Modern | Why |
|---|---|---|
| `find` | `fd` | Faster, sensible defaults, git-aware |
| `grep` | `rg` (ripgrep) | 10-100x faster, `.gitignore`-aware |
| `cat` | `bat` | Syntax highlighting, line numbers, git |
| `ls` | `exa` / `eza` | Colors, icons, tree view |
| `top` | `htop` / `btm` | Interactive, scrollable, mouse support |
| `du -sh *` | `dua` / `dust` | Interactive treemap |
| `df -h` | `duf` | Cleaner output, colors |
| `sed/awk` | `jq` (JSON) | Structured data processing |
| `curl \| sh` | Never | Security risk — download + inspect first |

## One-Liner Patterns

### Find + Replace in Files
```bash
rg -l "old_text" --glob "*.ts" | xargs sed -i 's/old_text/new_text/g'
```

### Kill Process on Port
```bash
# Linux
kill -9 $(lsof -t -i:3000)

# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
```

### JSON Processing (jq)
```bash
curl -s https://api.github.com/repos/user/repo | jq '{name, stars: .stargazers_count, forks: .forks_count}'
```

### Log Tail + Filter
```bash
tail -f app.log | rg "ERROR|WARN" | rg -v "healthcheck"
```

### Disk Usage by Directory
```bash
du -sh */ | sort -rh | head -10

# Windows equivalent (PowerShell)
Get-ChildItem -Directory | ForEach-Object { $size = (Get-ChildItem $_.FullName -Recurse -File | Measure-Object Length -Sum).Sum; [PSCustomObject]@{Name=$_.Name; "Size(MB)"=[math]::Round($size/1MB, 2)} } | Sort-Object "Size(MB)" -Descending | Select-Object -First 10 | Format-Table
```

### Bulk Git Operations
```bash
# Update all git repos in directory
for dir in */; do
  (cd "$dir" && [ -d .git ] && echo "=== $dir ===" && git pull)
done
```

## Shell Script Safety Checklist

| Rule | Bash | PowerShell |
|---|---|---|
| Strict mode | `set -euo pipefail` | `$ErrorActionPreference = "Stop"` |
| Undefined vars | Caught by `set -u` | `Set-StrictMode -Version Latest` |
| Fail on pipe error | `set -o pipefail` | Native |
| Quote all expansions | `"$var"` | `"$var"` |
| Use `[[ ]]` not `[ ]` | `[[ -f "$f" ]]` | Use `Test-Path` |
| Trap exit | `trap cleanup EXIT` | `trap { cleanup } EXIT` |
| Avoid `eval` | ❌ | ❌ |

## Common Pitfalls

| Pitfall | Fix |
|---|---|
| Forgetting `&&` chaining | Services start before DB is ready — use health checks |
| Piping `curl` into `sudo bash` | Download and inspect first |
| `rm -rf /` in variable | Check variable is set: `rm -rf -- "${DIR:?}"` |
| Glob expansion on empty | Use `shopt -s nullglob` or check with `ls -A` |
| Space in filenames | Always quote: `for f in *; do process "$f"; done` |
| No error handling | Always check `$?` or use `ErrorActionPreference` |
| Hardcoded paths | Use `$(dirname "$0")` or `$PSScriptRoot` |

## Constraints
- Do NOT pipe `curl` to `sh` — always download and inspect
- Do NOT use `eval`, backticks, or dynamic code execution
- Do NOT parse `ls` — use globs or `find` / `Get-ChildItem`
- Do NOT hardcode secrets in terminal history — use prompt or env vars
- Do NOT run `rm -rf` without double-checking the path
- Do NOT use `sudo` unless absolutely necessary

## References
- `references/COMMAND_REFERENCE.md` — Quick reference of common command patterns
