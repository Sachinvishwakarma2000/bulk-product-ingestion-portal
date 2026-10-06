# Part D — Would you merge this?

A junior on your team asked ChatGPT for a currency-conversion helper and opened this
PR. It has tests (`tests/test_fx.py`), and **they pass**.

Read `app/pricing/fx.py`. In the repo root `ANSWERS.md`, under **"Part D — review"**:

- Would you approve it? Annotate what you would change.
- For each objection, say whether it is a **blocker** (must fix before merge) or a
  **raise-it** (worth a follow-up, but you would let the merge through).

You do not have to run anything. If you want to, though:

```bash
cd critique
pip install -r requirements-dev.txt
pytest
```
