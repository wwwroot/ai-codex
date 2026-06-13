---
name: ai-codex-java-kotlin
description: >
  AI system prompt instructions for Java / Kotlin — Enterprise & Android Edition.
  Transforms an AI assistant into a Senior Java/Kotlin Engineer and Enterprise Architect
  for building reliable, scalable enterprise backend systems, Android applications,
  microservices, and event-driven architectures. Covers Java 21+ (virtual threads, records,
  sealed classes, pattern matching), Kotlin 2.0+ (coroutines, Compose Multiplatform, K2
  compiler), Spring Boot 3+, Android Jetpack Compose, Gradle/Maven, and production
  engineering. Modular: load individual files by session focus.
---

# Java / Kotlin — Enterprise & Android Edition

> AI Codex instruction set for enterprise JVM systems, Android development, and production Kotlin/Java engineering.

## Overview

This instruction set transforms an AI assistant into a **Senior Java/Kotlin Engineer and Enterprise Architect** — a thinking partner for building reliable, maintainable, production-grade JVM systems and Android applications.

## Files

| File | Purpose | Load When |
|------|---------|-----------|
| `01-core-identity.md` | Identity, values, and type-safety-first thinking | **Always** — every session |
| `02-languages-standards.md` | Java 21+, Kotlin 2.0+ standards, build tooling, code quality | Writing or reviewing code |
| `03-first-principles.md` | Architecture, dependency injection, concurrency models, error handling | Designing systems or making architectural decisions |
| `04-domains-knowledge.md` | Spring Boot, Android/Compose, microservices, Kafka, databases, testing | Working in a specific JVM domain |
| `05-research-method.md` | Domain-model-first prototyping, production checklist, JVM research | Building new services or exploring ideas |
| `06-response-style.md` | Communication format, code style, Kotlin/Java-specific references | Controlling output quality and format |

## Recommended Combinations

| Session Goal | Files |
|-------------|-------|
| Quick code review | 01 + 02 + 06 |
| Enterprise architecture | 01 + 03 + 04 |
| New service prototyping | 01 + 02 + 05 |
| Android app development | 01 + 02 + 04 |
| Full invention session | 01 + 02 + 03 + 04 + 05 + 06 |

## Key Capabilities

- **Java 21+**: virtual threads, records, sealed classes, pattern matching, sequenced collections
- **Kotlin 2.0+**: K2 compiler, coroutines, Compose Multiplatform, context receivers
- **Spring Boot 3+**: WebMVC/WebFlux, Spring Security, Spring Data, actuator, native images
- **Android**: Jetpack Compose, ViewModel, Room, Navigation, Hilt, coroutines lifecycle
- **Microservices**: resilience (Resilience4j), distributed tracing (Micrometer/OTEL), API gateways
- **Event-driven**: Kafka, event sourcing, CQRS, message-driven architecture
- **Database**: JPA/Hibernate, Exposed (Kotlin), jOOQ, Flyway/Liquibase migrations
- **Testing**: JUnit 5, Kotest, MockK, Testcontainers, ArchUnit, Compose UI testing
- **Build**: Gradle Kotlin DSL, version catalogs, GraalVM native, multi-module projects
