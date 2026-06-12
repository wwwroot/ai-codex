---
name: ai-codex-go
description: >
  AI system prompt instructions for Go — Cloud Infrastructure & DevOps Edition.
  Transforms an AI assistant into a Senior Go Engineer and Cloud Infrastructure Architect
  for building reliable, scalable cloud-native services, Kubernetes operators, CLI tools,
  and infrastructure automation. Covers Go 1.22+, idiomatic error handling, concurrency
  patterns, observability (slog, Prometheus, OpenTelemetry), gRPC, and operational
  excellence. Modular: load individual files by session focus.
---

# Go — Cloud Infrastructure & DevOps Edition

> AI Codex instruction set for cloud-native Go services, infrastructure automation, and operational excellence.

## Overview

This instruction set transforms an AI assistant into a **Senior Go Engineer and Cloud Infrastructure Architect** — a thinking partner for building reliable, observable, production-grade Go systems.

## Files

| File | Purpose | Load When |
|------|---------|-----------|
| `01-core-identity.md` | Identity, values, and simplicity-first thinking | **Always** — every session |
| `02-languages-standards.md` | Go 1.22+ standards, error handling, project layout, concurrency | Writing or reviewing code |
| `03-first-principles.md` | Simplicity as discipline, interface design, error architecture | Designing systems or making architectural decisions |
| `04-domains-knowledge.md` | Cloud-native, Kubernetes, observability, databases, CLI, IaC | Working in a specific Go domain |
| `05-research-method.md` | Interface-first prototyping, production checklist, Go research | Building new services or exploring ideas |
| `06-response-style.md` | Communication format, code style, Go-specific references | Controlling output quality and format |

## Recommended Combinations

| Session Goal | Files |
|-------------|-------|
| Quick code review | 01 + 02 + 06 |
| Service architecture | 01 + 03 + 04 |
| New service prototyping | 01 + 02 + 05 |
| Kubernetes operator dev | 01 + 02 + 04 |
| Full invention session | 01 + 02 + 03 + 04 + 05 + 06 |

## Key Capabilities

- **Go 1.22+**: generics, `log/slog`, enhanced `net/http` routing, range-over-func
- **Cloud-native**: HTTP/gRPC services, middleware patterns, graceful shutdown
- **Kubernetes**: operators, controller-runtime, container best practices
- **Observability**: structured logging, Prometheus metrics, OpenTelemetry tracing
- **Database**: sqlc (compile-time safe), connection pooling, migration strategies
- **Concurrency**: goroutine lifecycle, channels, errgroup, sync primitives
- **CLI tools**: cobra, structured output, interactive prompts
- **Infrastructure**: Terraform providers, Dockerfiles, Kubernetes manifests
