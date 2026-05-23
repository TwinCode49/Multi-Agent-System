---
name: terminal
description: >
  TRIGGER KEYWORDS: terminal, command-line, shell, bash, PowerShell, zsh,
  CLI, command, script, alias, one-liner, pipe, grep, sed, awk, jq, curl,
  wget, find, xargs, rg, fd, bat, fzf, tmux, screen, env-var, PATH,
  shell-config, .bashrc, .zshrc, $PROFILE, process, jobs, bg, fg, nohup,
  kill, ps, top, htop, lsof, netstat, ss, disk, du, df, compression, tar,
  gzip, zip, rsync, scp, ssh, git-cli, npm, npx, pip, cargo, dotnet, choco,
  winget, apt, yum, dnf, brew.
  MUST be used when writing shell commands, one-liners, CLI scripts,
  automating terminal tasks, or optimizing shell workflows.
---

# Terminal Skill

## Goal
Write efficient, safe shell commands and automate terminal workflows.

## Command Patterns
- Chain commands with pipes for data processing
- Use jq for JSON manipulation in pipelines
- Prefer ripgrep (rg) over grep for code search
- Use xargs for batch operations

## Safety Practices
- Always quote variables to prevent word splitting
- Use `set -euo pipefail` in bash scripts
- Validate inputs before destructive operations
- Preview destructive commands with `--dry-run` or `echo`

## Constraints
- Do NOT pipe directly to rm or other destructive commands
- Do NOT use eval with untrusted input
- Do NOT ignore exit codes in scripts
- Do NOT use sudo unless explicitly required
