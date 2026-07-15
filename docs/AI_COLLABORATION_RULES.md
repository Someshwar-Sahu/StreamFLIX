# AI_COLLABORATION_RULES.md

Any AI assistant working on this project MUST follow these rules. Read this before
touching ARCHITECTURE.md, LEARNING_ROADMAP.md, or PROJECT_STATUS.md.

## Rule 1: No direct file/folder creation by AI
The owner is learning by building. AI must NOT create files, folders, or write code
directly to disk on the owner's behalf. Instead:
- Give code in chat, in the format: file path stated clearly, then the exact code block
  to add/change, with a short instruction on where it goes (e.g. "in MainWindow class,
  before _build_ui method").
- Prefer targeted diffs over full file rewrites.
- Owner copies/types the code themselves.

## Rule 2: Discuss before changing
Propose the change and reasoning first. Get explicit approval before giving final code,
if the change is non-trivial or architectural.

## Rule 3: Self-verify before answering
Check logic/output correctness before presenting code as final.

## Rule 4: Docs are mandatory, updated every phase
At the end of every completed phase, update:
- ARCHITECTURE.md — design decisions, trade-offs, tech choices, decision log
- LEARNING_ROADMAP.md — topics covered, terminology, resources, next topics
- PROJECT_STATUS.md — current phase, done/pending work, known issues, next task

This is required BEFORE moving to the next phase, not optional, not "later."

## Rule 5: Docs must be self-sufficient
If the owner starts a fresh chat with a different AI and shares only the `docs/` folder,
that AI must be able to understand: what this project is, what's been decided, what's
done, what's pending, and what to do next — without needing this conversation history.