# Command Reference

## File Operations

```bash
# Recursive find + rename
fd -e js -x mv {} {.}.ts

# Bulk replace in files
rg -l 'deprecatedApi' --type ts | xargs sed -i 's/deprecatedApi/newApi/g'

# Copy dir structure without files
rsync -a -f"+ */" -f"- *" src/ dest/

# Show largest files
fd -t f -S +10MB --exec du -sh {} \; | sort -rh | head -20

# Compare two directories
diff -rq dir1/ dir2/
```

## Process Management

```bash
# Find and kill by name
pkill -f "node.*server.js"

# Memory/cpu top processes
ps aux --sort=-%mem | head -10
# Windows
Get-Process | Sort-Object WorkingSet64 -Descending | Select -First 10

# Watch and restart on file change
find . -name '*.ts' | entr -r node dist/main.js

# Background with log
nohup node server.js > server.log 2>&1 &
```

## Git CLI

```bash
# Squash last N commits
git rebase -i HEAD~3

# Find commit that introduced a bug
git bisect start
git bisect bad
git bisect good <known-good-sha>

# Interactive add hunks
git add -p

# Log with graph
git log --oneline --graph --all --decorate

# Delete merged branches
git branch --merged main | grep -v "\* main" | xargs git branch -d

# Stash with name
git stash push -m "wip: refactoring auth"
git stash list
git stash apply stash^{/wip:}
```

## Network

```bash
# Listen on port
lsof -i :3000
netstat -ano | findstr :3000  # Windows

# DNS lookup
dig example.com +short
nslookup example.com  # Windows

# HTTP request with timing
curl -w "\nStatus: %{http_code}, Time: %{time_total}s\n" -o /dev/null -s https://api.example.com

# Test port connectivity
nc -zv example.com 443
Test-NetConnection example.com -Port 443  # Windows

# Generate self-signed cert
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

## Compression

```bash
# Tar with progress
tar -czf archive.tar.gz --checkpoint=.100 large_dir/

# Extract specific files
tar -xzf archive.tar.gz "path/to/file.txt"

# Zip directory excluding node_modules
zip -r archive.zip . -x "node_modules/*" ".git/*"

# Split large files
split -b 100M large_file.tar.gz part_
cat part_* > large_file.tar.gz  # Reassemble
```

## Docker CLI

```bash
# Cleanup unused
docker system prune -a --volumes

# Inspect container resources
docker stats --no-stream

# Run with host network (dev)
docker run --net=host -it myimage

# Copy files from/to container
docker cp container_id:/app/logs ./
docker cp ./config.yaml container_id:/app/config.yaml

# View logs with timestamps
docker logs -f --timestamps container_id | rg ERROR
```

## npm / Node

```bash
# Why is this package installed?
npm explain <package>

# List outdated
npm outdated
npm update  # Safe updates only
npx npm-check-updates -u  # Major updates

# Audit only high/critical
npm audit --audit-level=high

# Run script with node options
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Run package without installing
npx serve dist/
```
