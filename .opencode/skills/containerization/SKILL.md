---
name: containerization
description: >
  TRIGGER KEYWORDS: docker, Dockerfile, docker-compose, container,
  containerization, image, build, multi-stage, dockerignore, Kubernetes,
  k8s, pod, deployment, service, ingress, configmap, secret, helm,
  docker-swarm, container-registry, image-scanning, distroless,
  alpine, slim, layer-caching, healthcheck, resource-limits,
  docker-network, volumes, bind-mount, container-security,
  docker-compose, compose-file, orchestration, CI-CD-container,
  container-deploy.
  MUST be used when writing Dockerfiles, compose files, Kubernetes
  manifests, or planning container-based deployment strategies.
---

# Containerization Skill

## Goal
Build secure, minimal, and efficient container images with clear deployment topology. Every image must be reproducible, cache-optimized, and hardened for production.

## Dockerfile Best Practices

### Multi-Stage Build (Mandatory for compiled languages)

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1
CMD ["node", "dist/main.js"]
```

### Layer Caching Optimization

```
Order by change frequency (least → most changed):
1. System packages     ← almost never
2. Package manifests   ← rarely
3. Dependency install  ← rarely
4. Source code         ← always
5. Build step          ← always
```

### Image Size Reduction

| Practice | Size Impact |
|---|---|
| Use Alpine/slim base | ~150 MB saved vs full |
| Multi-stage builds | ~200 MB+ (drop build tools) |
| `npm ci --only=production` | No devDependencies |
| Clean apt cache in same layer | ~30 MB |
| Distroless images | Minimal attack surface |
| `docker-slim` post-processing | Up to 90% reduction |

## Docker Compose (Development)

```yaml
version: "3.9"
services:
  api:
    build:
      context: .
      target: development
    ports:
      - "3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - DATABASE_URL=postgres://user:pass@db:5432/app
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: app
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
```

## Kubernetes Patterns

### Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  labels:
    app: api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
        - name: api
          image: myregistry.azurecr.io/api:v1.2.3
          ports:
            - containerPort: 3000
          envFrom:
            - configMapRef:
                name: api-config
            - secretRef:
                name: api-secrets
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 30
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
      terminationGracePeriodSeconds: 30
```

### Service + Ingress

```yaml
---
apiVersion: v1
kind: Service
metadata:
  name: api
spec:
  type: ClusterIP
  ports:
    - port: 80
      targetPort: 3000
  selector:
    app: api
---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api
  annotations:
    nginx.ingress.kubernetes.io/rate-limit: "100r/m"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
spec:
  tls:
    - hosts:
        - api.example.com
      secretName: api-tls
  rules:
    - host: api.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api
                port:
                  number: 80
```

## Security Hardening

| Practice | Implementation |
|---|---|
| Non-root user | `USER appuser` in Dockerfile |
| Read-only root FS | `securityContext.readOnlyRootFilesystem: true` |
| Drop capabilities | `securityContext.capabilities.drop: ["ALL"]` |
| Image scanning | Trivy / Grype in CI |
| Distroless | `gcr.io/distroless/nodejs` |
| No secrets in build args | Use build-time `--secret` or k8s secrets |
| Sigstore signing | `cosign sign` on release tags |

## CI/CD Integration

```yaml
# GitHub Actions example
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and cache
        uses: docker/build-push-action@v5
        with:
          push: true
          tags: ${{ vars.REGISTRY }}/api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      - name: Scan image
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ vars.REGISTRY }}/api:${{ github.sha }}
          format: sarif
```

## Production Checklist
- [ ] Multi-stage build (no build tools in final image)
- [ ] Non-root user
- [ ] Health check configured
- [ ] Resource limits set
- [ ] Read-only filesystem
- [ ] Drop all capabilities
- [ ] Image scanned for CVEs
- [ ] Layer cache optimized
- [ ] `.dockerignore` excludes node_modules, .git, etc.
- [ ] Liveness + readiness probes
- [ ] Pod disruption budget (PDB) for zero-downtime
- [ ] Rolling update strategy
- [ ] Graceful shutdown (SIGTERM handler, terminationGracePeriod)
- [ ] Network policies defined
- [ ] Secrets via k8s secrets (not env vars in manifests)

## Constraints
- Do NOT use `latest` tag — always pin exact versions
- Do NOT run as root in containers
- Do NOT store secrets in Dockerfiles or compose files
- Do NOT skip `.dockerignore` (bloated context → slow builds)
- Do NOT leave default ports exposed unnecessarily
- Do NOT use `:latest` base images — pin digest or minor version

## References
- `references/KUBERNETES_EXAMPLES.md` — Common k8s resource templates
