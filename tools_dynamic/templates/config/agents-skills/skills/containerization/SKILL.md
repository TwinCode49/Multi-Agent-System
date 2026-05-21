---
name: containerization
description: >
  TRIGGER KEYWORDS: docker, Dockerfile, docker-compose, container,
  containerization, image, build, multi-stage, dockerignore, Kubernetes, k8s,
  pod, deployment, service, ingress, configmap, secret, helm, docker-swarm,
  container-registry, image-scanning, distroless, alpine, slim, layer-caching,
  healthcheck, resource-limits, docker-network, volumes, bind-mount,
  container-security, docker-compose, compose-file, orchestration,
  CI-CD-container, container-deploy.
  MUST be used when writing Dockerfiles, compose files, Kubernetes manifests,
  or planning container-based deployment strategies.
---

# Containerization Skill

## Goal
Build secure, efficient container images and manage containerized deployments.

## Docker Best Practices
- Use multi-stage builds to minimize image size
- Prefer distroless or Alpine base images
- Layer caching: order layers from least to most frequently changing
- Use .dockerignore to exclude unnecessary files

## Kubernetes Patterns
- Define resource requests and limits for all containers
- Use ConfigMaps and Secrets for configuration
- Implement health checks (liveness, readiness, startup)
- Use Deployments with rolling update strategy

## Constraints
- Do NOT use latest tags in production
- Do NOT run containers as root
- Do NOT skip resource limits
- Do NOT store secrets in environment variables
