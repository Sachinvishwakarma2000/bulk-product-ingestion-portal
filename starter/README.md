# Part B — Build the bulk product import

Read the brief in the assignment (root `assignment/index.html`, Part B), then build
it here. **Pick one backend** — Node or Python — and delete or ignore the other.

```
starter/
  backend-node/      Express skeleton (npm install && npm run dev)
  backend-python/    FastAPI skeleton (pip install -r requirements.txt && uvicorn main:app --reload)
  frontend/          Vite + React skeleton (npm install && npm run dev)
  fixtures/          sample CSV uploads
```

Persistence can be SQLite, an in-memory array, or a JSON file — we are **not** marking
schema migrations.

**Record every assumption you make** in the root `ANSWERS.md` under
**"Part B — assumptions"**. An assumption you wrote down is a decision; one you didn't
is a bug.

These skeletons are intentionally bare — a single placeholder route and a single
upload component. Build outward from them however you see fit.
