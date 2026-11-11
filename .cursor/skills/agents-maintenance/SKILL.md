---
name: agents-maintenance
description: >-
  Synchronizes relevant AGENTS.md files after completing a development task
  using conversation context and lightweight Git checks.
---

# AGENTS Maintenance

Keep `AGENTS.md` files synchronized with the codebase after completing a development task. Focus strictly on architectural, contract, or behavioral changes while avoiding token-heavy diffs.

## Core Principles
1. **Context-First**: Use conversation context as the primary source of what changed.
2. **Lightweight Git Verification**: Inspect both unstaged and staged changes compactly:
   ```bash
   git status --short
   git diff --stat
   git diff --cached --stat
   ```
   *Inspect a full diff (`git diff <file>`) only when conversation context is insufficient to verify exact signatures, endpoints, or schemas.*
3. **High Signal Only**: Document only architectural, API, schema, or behavioral changes. Skip styling, internal refactors, and helper functions.
4. **Current State**: Reflect current reality—never add historical changelogs. Write in English, keep entries concise.
5. **Handle Deletions & Moves**: When endpoints, modules, tables, or integrations are removed (`D`) or renamed (`R`), actively purge obsolete entries or update paths to eliminate stale references.

---

## Target Map & Cross-Layer Ripple Effects

*Treat this map as a directional guide, not a rigid boundary. Changes in one layer often cascade to others.*

| Primary Area | Primary Target | What to Update / Purge | Ripple Effects to Check |
| ------------ | -------------- | ---------------------- | ----------------------- |
| `backend/` | `backend/AGENTS.md` | API routes, owned tables, contracts, core services, domain notes (remove deleted endpoints/tables). | If inter-layer communication, auth, or flows change → check `AGENTS.md` (root) and `frontend/AGENTS.md`. If test fixtures/contracts change → check `tests/AGENTS.md`. |
| `frontend/` | `frontend/AGENTS.md` | Routes, module/slice structure, Web3/auth state, API integration (remove dead routes/slices). | If cross-layer flows, wallet interactions, or global navigation change → check `AGENTS.md` (root). |
| `blockchain/` | `blockchain/AGENTS.md` | Smart contract methods, events, ABI sync, deployments (clean deprecated methods). | If ABI, methods, or events change → check `backend/AGENTS.md` (Nethereum adapters) and `AGENTS.md` (root). |
| `tests/` | `tests/AGENTS.md` | Test structure, new module test suites, fakes/fixtures, runner filters. | If test suite fixtures reflect backend contracts → check `backend/AGENTS.md`. |
| System / Tooling | `AGENTS.md` (root) | Architecture, cross-layer communication, ports, entry points (update renamed/moved entry files). | Update whenever system-wide orchestration, external services, or cross-cutting flows change. |

---

## Workflow

1. **Assess Changes from Context**: Determine architectural changes (additions, modifications, deletions) from the conversation history.
2. **Run Lightweight Checks**: Execute `git status --short`, `git diff --stat`, and `git diff --cached --stat`. Watch for deleted (`D`) or renamed (`R`) files.
3. **Update Affected AGENTS.md**: Apply targeted edits (updating definitions, removing obsolete endpoints/tables, correcting moved paths) to primary and ripple-affected documentation (`backend/`, `frontend/`, `blockchain/`, `tests/`, and root `AGENTS.md`). Do not touch unaffected files.
