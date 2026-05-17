---
name: containerization
description: >
  TRIGGER KEYWORDS: docker, Dockerfile, docker-compose, container, image,
  build, multi-stage, kubernetes, k8s, pod, deployment, ingress, helm,
  container-registry, healthcheck, resource-limits, container-security,
  compose-file, orchestration, CI-CD-container.
  MUST be used when writing Dockerfiles, compose files, or Kubernetes
  manifests.
context: fork
---

# Containerization Skill

## Goal
Secure, minimal, efficient container images with clear deployment topology.

## Dockerfile
- Multi-stage builds: compile in stage 1, runtime in stage 2
- Layer order: system deps → manifests → deps → source → build
- Use Alpine or distroless base images
- Always run as non-root user
- Health check required

```dockerfile
FROM node:20-alpine AS build
COPY package*.json ./ && npm ci && COPY . . && npm run build
FROM node:20-alpine
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "main.js"]
```

## Compose (Dev)
- Bind mount app code + named volume for DB data
- Health checks on dependent services
- `restart: unless-stopped`

## Kubernetes
- **Deployment**: Replicas 3, RollingUpdate, liveness + readiness probes, resource limits
- **Service**: ClusterIP
- **Ingress**: TLS via cert-manager, rate limit annotation
- Security: readOnlyRootFS, drop ALL capabilities, non-root

## CI/CD
- Build with cache (Docker layer caching + GitHub Actions cache)
- Scan images with Trivy/Grype
- Sign with cosign
- Push with git SHA tag (no `latest`)

## Checklist
- [ ] Multi-stage, non-root, healthcheck
- [ ] Resource limits, read-only FS, dropped caps
- [ ] Image scanned, no `latest` tags
- [ ] `.dockerignore`, graceful shutdown, rolling update
- [ ] Network policies + secrets via k8s secrets

## Constraints
- No `latest` tag — pin versions
- No root in containers
- No secrets in Dockerfiles or compose files
- No missing `.dockerignore`
- No unnecessary exposed ports

## References
- `references/KUBERNETES_EXAMPLES.md`
