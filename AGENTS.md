# 🤖 AI Agent Engineering Guidelines

1. **Safety First:** Never simulate keystrokes or click actions without verifying target coordinates are within visible screen bounds.
2. **Deterministic Selectors:** For browser automation, prefer `data-testid` or ARIA semantic selectors before falling back to XPath.
3. **Graceful Degradation:** When vision coordinates are ambiguous, trigger human intervention or request clarification.
4. **Clean Git Hygiene:** Use conventional commit messages (`feat:`, `fix:`, `docs:`, `test:`).
