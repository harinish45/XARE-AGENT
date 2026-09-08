# ✅ Autonomous Implementation Checklist (Vibe Coding Guide)

This checklist is designed for autonomous AI agents (Cursor, Claude Code, Antigravity, Copilot). Pick the first unchecked item `[ ]`, implement, test, and mark as `[x]`.

---

## 🎯 Phase 1: Communication Bridge
- [ ] `antigravity/bridge.ts`: Implement bidirectional Native Messaging bridge between `ai-desktop-agent` and `my-ai-extension`
  - [ ] Handle JSON-RPC message serialization over standard streams
  - [ ] Implement handshake verification and reconnect logic
  - [ ] Unit test: `antigravity/tests/bridge.test.ts`

## 🎯 Phase 2: Vision Grounding & Element Detection
- [ ] `ai-desktop-agent/src/vision/grounding.ts`: Visual coordinate locator
  - [ ] Parse bounding box predictions from VLM / OCR response
  - [ ] Translate normalized coordinates (0.0–1.0) to screen pixel coordinates
  - [ ] Handle high-DPI / Retina scaling factors
  - [ ] Unit test: `ai-desktop-agent/tests/grounding.test.ts`

## 🎯 Phase 3: Extension Action Dispatcher
- [ ] `my-ai-extension/src/dispatcher.ts`: Safe DOM action executor
  - [ ] Click, type, scroll, and select elements using semantic selectors
  - [ ] Wait for element visibility with configurable timeout
  - [ ] Return execution telemetry (success, failure reason, latency)

## 🎯 Phase 4: CI/CD & Testing
- [ ] `.github/workflows/ci.yml`: Automated GitHub Actions pipeline
  - [ ] Typecheck all packages
  - [ ] Run test suites
