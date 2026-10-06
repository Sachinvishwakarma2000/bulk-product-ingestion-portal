# Part A — Review this pull request

A teammate raised this PR against your order-management service. **It runs, and the
happy path works.** Your job is to review it, not to run or rewrite it.

> **You don't need to be a JavaScript or React specialist.** This PR is a Node/Express
> backend with a React frontend, but a good code review carries across languages. Read it and
> review it the way you would any service in your own stack.

Read `server/routes/orders.js` and `web/src/OrderList.jsx`. Leave your review comments
in the repo root `ANSWERS.md` under **"Part A — review"**.

For each comment give:

- the **file and line**,
- **what goes wrong** (the effect, not just "this is bad"),
- a **severity**: `blocker`, `should-fix`, or `nit`.

Do not rewrite the code. We want the comments and the severity calls.

> The other files here (`db.js`, `payments.js`, `Row.jsx`) are stubs, present only so
> the PR reads like a real one. You do not need to review them.
