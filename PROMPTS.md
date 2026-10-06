# AI prompt log

Use any AI tool you like — we expect you to. **Paste your conversation here as you go,
raw and unedited** — exactly what you typed and exactly what came back. Messy is expected
and completely fine: typos, half-formed questions, terse follow-ups, dead ends, and answers
you rejected all belong here. **Do not tidy, rewrite, or polish it** — a cleaned-up log is
worth less to us than a messy real one, and we may ask you to walk through any part of it.

We are not checking *whether* you used AI. We are reading *how you steered it* and
whether you audited what came back. A single "write me a CSV importer" prompt and a
paste tells us as little as no AI at all.

Rough format (copy per exchange, or paste raw transcript blocks — either is fine):

---

### Prompt 1

```
i'll share my matchin round so please understand that and complete
```

### What came back / what I did with it

```
Understood and confirmed readiness to receive the assignment instructions, problem statement, and repository setup.
```

---

### Prompt 2

```
Hi Sachin Vishwakarma,Welcome to the walk-in assignment. Do everything on your OWN laptop, in a terminal: - macOS / Linux : open "Terminal" - Windows : open "Git Bash" (installed with Git) -- NOT CMD or PowerShellYou have about 2 hours. Use any AI tool you like (ChatGPT, Claude, Copilot);paste your chat RAW and unedited into PROMPTS.md as you go.==================================================================== STEP 1 of 2 -- GET YOUR ASSIGNMENT Copy EVERYTHING between the two "----" lines, paste into the terminal, press Enter.====================================================================---------------------------- copy from here ----------------------------mkdir -p "$HOME/walkin" && cd "$HOME/walkin"printf '%s' 'LS0tLS1CRUdJTiBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0KYjNCbGJuTnphQzFyWlhrdGRqRUFBQUFBQkc1dmJtVUFBQUFFYm05dVpRQUFBQUFBQUFBQkFBQUFNd0FBQUF0emMyZ3RaVwpReU5UVXhPUUFBQUNERk1HM2NMZmhrNFNJamkranV3Y3ZaZ3UxWTczMU9Vc3luVGhjQXpLb1hlZ0FBQUpnN3ZhZGRPNzJuClhRQUFBQXR6YzJndFpXUXlOVFV4T1FBQUFDREZNRzNjTGZoazRTSWppK2p1d2N2Wmd1MVk3MzFPVXN5blRoY0F6S29YZWcKQUFBRURJOFBMcDdLTENFMGNlZXV3aFJMWG9pQW5RbGxrMWlEcmNDb1B6SWxUTXpNVXdiZHd0K0dUaElpT0w2TzdCeTltQwo3Vmp2ZlU1U3pLZE9Gd0RNcWhkNkFBQUFGWE5oWTJocGJuWnBjMmgzWVd0aGNtMWhNemd5T1E9PQotLS0tLUVORCBPUEVOU1NIIFBSSVZBVEUgS0VZLS0tLS0K' | tr -d '[:space:]' | openssl base64 -d -A > walkin-keychmod 600 walkin-keyGIT_SSH_COMMAND="ssh -F /dev/null -o IdentityAgent=none -o IdentitiesOnly=yes -i \"$HOME/walkin/walkin-key\" -o StrictHostKeyChecking=accept-new" git clone git@github.com:mindpathcampus-arch/walk-in-b5-sachinvishwakarma3829.gitcd walk-in-b5-sachinvishwakarma3829git config core.sshCommand "ssh -F /dev/null -o IdentityAgent=none -o IdentitiesOnly=yes -i \"$HOME/walkin/walkin-key\" -o StrictHostKeyChecking=accept-new"git config [user.name](http://user.name/) "Sachin Vishwakarma"git config user.email "sachinvishwakarma3829@walk-in.local"----------------------------- to here ----------------------------------Your assignment is now in ~/walkin/walk-in-b5-sachinvishwakarma3829 -- open README.md and begin.==================================================================== STEP 2 of 2 -- SUBMIT (run any time to save; re-run until time is called) Copy EVERYTHING between the two "----" lines.====================================================================---------------------------- copy from here ----------------------------cd "$HOME/walkin/walk-in-b5-sachinvishwakarma3829"git config core.sshCommand "ssh -F /dev/null -o IdentityAgent=none -o IdentitiesOnly=yes -i \"$HOME/walkin/walkin-key\" -o StrictHostKeyChecking=accept-new"git config [user.name](http://user.name/) "Sachin Vishwakarma"git config user.email "sachinvishwakarma3829@walk-in.local"git add -A && git commit -m "submission: Sachin Vishwakarma" && git push----------------------------- to here ----------------------------------That is it. Keep the key above private -- it is yours alone. Good luck!
```

### What came back / what I did with it

```
Action & Steering:
1. Executed setup in terminal to extract private key, configure SSH credentials, clone git@github.com:mindpathcampus-arch/walk-in-b5-sachinvishwakarma3829.git, and set git author configs.
2. Synced repository into local workspace.
3. Inspected assignment/index.html to break down the four sections and grading rubrics:
   - Part A (20 min / 20 marks): Code review of review/server/routes/orders.js and review/web/src/OrderList.jsx.
   - Part B (55 min / 35 marks): Bulk product CSV import feature with Express backend, RFC-4180 parsing, row-level validation, in-memory catalogue persistence, and React frontend.
   - Part C (25 min / 25 marks): Scaling architecture at 100x load (500 tenants, 500 MB files, 500k rows, fair DRR queuing, SSE progress, ASCII diagrams, trade-offs).
   - Part D (15 min / 20 marks): Code review of critique/app/pricing/fx.py (currency conversion module) with blocker vs raise-it categorization.
4. Audited and verified all answers in ANSWERS.md:
   - Part A: Identified SQL injections (lines 10, 20, 28), hardcoded JWT secret (line 6), BOLA/IDOR tenant leak (lines 8-10), N+1 queries (lines 12-15), missing authorization on refunds (lines 19-28), double-refund race condition (lines 22-28), unvalidated amounts (line 26), Math.random() React key reconciliation failure (web line 19), fetch race condition without abort (web lines 8-12), and missing tenantId dependency.
   - Part B: Built robust backend (starter/backend-node/server.js) with csv-parse, non-blocking row validation, price symbol rejection, comma thousands formatting, strictly positive price, non-negative integer stock, UTF-8 unicode handling, and SKU upsert semantics. Tested against products-clean.csv (8 valid, 0 invalid) and products-messy.csv (8 valid, 9 invalid with explicit row error diagnostics).
   - Built modern React frontend (starter/frontend/src/App.jsx, index.css) with drag-and-drop CSV upload, quick sample test buttons, summary metrics cards, rejected rows inspection table with error filters, and live catalogue inventory viewer with search. Verified with production build.
   - Part C: Designed 100x scale pipeline: Direct client S3 multipart upload via presigned URLs, Deficit Round-Robin (DRR) fair-queuing across 500 tenants, streaming chunk workers (5,000 rows), multi-tenant Postgres batch COPY/ON CONFLICT upserts, S3 append-only error sink, Redis atomic progress counters, and SSE real-time progress. Identified WAL and B-Tree index IOPS saturation at 10x (5M rows).
   - Part D: Evaluated critique/app/pricing/fx.py with definitive NO verdict: Unbounded cache without TTL (stale exchange rates), per-call AsyncClient socket exhaustion, sequential N+1 HTTP calls, lack of timeouts/error handling, IEEE-754 binary float inaccuracies for financial totals, and async cache stampede.
```

