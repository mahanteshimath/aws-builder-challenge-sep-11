# Weekend Deployment Challenge: QuickSplit

**Tag:** #deployment

## What Your App Does

Splitting a group bill is a solved problem in theory and a headache in practice. Apps like Splitwise are powerful, but they demand an account, a login, and a learning curve before you can do the one thing you actually wanted: figure out who owes whom after a trip. QuickSplit strips that away. There's no sign-up screen, no password, no profile setup. You open the app, create a group in seconds, add your expenses, and get an answer.

The philosophy is "single-event, zero-friction." QuickSplit isn't trying to be your permanent financial ledger — it's built for the one weekend trip, the one dinner group, the one event where four or five friends need to settle up once and move on. You type a group name ("Goa Trip"), add the people in it (Rahul, Monty, Amit, Priya), and you're in.

From there the flow is:

1. **Create Group** — name it, add everyone.
2. **Add Expenses** — each expense has a description, an amount, who paid, and how it's split.
3. **Split Equal or Custom** — most expenses get divided evenly across the group, but QuickSplit also supports percentage-based custom splits (say, 50/20/20/10) for the one dinner where someone ordered way more than everyone else.
4. **Get the Settlement** — instantly.

That last step is QuickSplit's actual differentiator, and it's the reason I built this instead of just cloning an existing splitter. A naive expense app shows you every individual debt: "Rahul owes Monty ₹500," "Amit owes Priya ₹700," and so on, which for a group of five people can produce ten or more redundant transactions. QuickSplit instead computes **net balances** per person and runs a debt-simplification algorithm that finds the *minimum number of payments* needed to settle the entire group. In the Goa Trip example bundled with the app, four friends with wildly uneven expenses collapse down to exactly three payments, all flowing toward whoever fronted the most money. "Settled in 3 payments ✅" is a genuinely satisfying thing to see after a chaotic trip.

On top of that, the Settlement screen has a small "✨ Generate Fun Summary (AI)" button that calls **Amazon Nova Lite** through Amazon Bedrock's Converse API to write a one-line, witty recap of who ended up as everyone's bank for the trip. It's optional and deliberately low-stakes — the actual settlement math never depends on the model — but it turns a spreadsheet-style result into something people actually want to screenshot and share in the group chat.

## How I Built It

I started from the outcome, not the stack. The one sentence I wanted to be true by the end was: "Tell me who owes whom, and how much, with the fewest payments." Everything else — the UI, the API shape, the data model — got designed backward from that.

The first thing I wrote, before any UI or infrastructure, was the settlement algorithm itself, as a pure, framework-free JavaScript module with a Node test file next to it. `computeBalances` walks every expense and nets out what each person paid versus what they owe. `computeSettlement` then takes those balances and greedily matches the largest creditor against the largest debtor, repeating until everyone is at zero. This is the classic debt-simplification approach — not always the theoretical global optimum (that's an NP-hard bin-packing problem), but it's the standard practical answer and it's exactly optimal for the common case of one clear "the one who paid for everything" trip. I wrote the tests first, using the Goa Trip numbers from my own spec, and only started standing up AWS resources once `node --test` was green.

A key decision was making the backend the single source of truth for money math. It would have been tempting to compute balances client-side for a snappier UI, but expense-splitting math with rounding is exactly the kind of logic that quietly diverges between two implementations. The Lambda that fetches a group is the only place `computeSettlement` runs; the frontend just renders what it's told.

The biggest real challenge was rounding. Percentage-based custom splits (50/20/20/10 of ₹2,400) don't always divide into clean rupee amounts, and naively rounding each person's share independently means the parts don't add back up to the whole. I fixed this by rounding every share to two decimals and then adding the leftover "drift" (a few paise) onto the first participant, so the stored splits always sum exactly to the expense amount — no money silently appears or disappears.

On the AWS side, I chose SAM over CDK for speed: a single `template.yaml` gets me a DynamoDB table, an HTTP API, and three Lambda functions with least-privilege IAM policies, and — because I didn't have the SAM CLI installed locally — I deployed it with plain `aws cloudformation package` + `deploy`, which turned out to require no extra tooling at all. That was a nice discovery: you don't need the SAM CLI to deploy a SAM template, just the standard AWS CLI.

The last snag was Git. The frontend repo I'm working in is a shared classroom repo where I don't have push access, so instead of a Git-connected Amplify deployment I built the frontend locally with Vite, zipped the `dist/` output, and pushed it straight to Amplify Hosting using `aws amplify create-app` → `create-deployment` → upload to the presigned S3 URL → `start-deployment`. It's a fully valid production deployment path for Amplify that most tutorials skip over in favor of the GitHub-connected flow.

## AWS Services Used / Architecture Overview

```
                 QuickSplit
                     │
                     ▼
              AWS Amplify Hosting
             (React + Vite frontend)
                     │
                     ▼
           Amazon API Gateway (HTTP API)
                     │
                     ▼
             AWS Lambda (Node.js 20.x)
   createGroup · addExpense · getGroup · summarizeGroup
                     │              │
                     ▼              ▼
              Amazon DynamoDB   Amazon Bedrock
        (single table: GROUP#id  (Amazon Nova Lite —
         METADATA + EXPENSE#id)   fun AI trip recap)
```

- **AWS Amplify Hosting** serves the static React build over CloudFront-backed hosting, deployed via a manual zip upload rather than a Git integration.
- **Amazon API Gateway (HTTP API)** exposes three routes — `POST /groups`, `POST /groups/{groupId}/expenses`, and `GET /groups/{groupId}` — with CORS enabled for the Amplify origin.
- **AWS Lambda** runs three small Node.js functions that validate input, write to DynamoDB, and (for `getGroup`) run the settlement algorithm on the way out.
- **Amazon DynamoDB** stores everything in one on-demand table using a single-table design: a group's metadata and all of its expenses share a partition key (`GROUP#<id>`), differentiated by sort key (`METADATA` vs `EXPENSE#<id>`), so fetching a whole group is a single `Query`.
- **Amazon Bedrock (Amazon Nova Lite)** powers the optional "Generate Fun Summary" button — a `summarizeGroup` Lambda calls the Converse API with the group's balances and settlement plan and gets back a one-line, human-friendly recap, scoped via IAM to just that one model ARN.
- No authentication service (Cognito) is used by design — the unguessable, randomly generated group ID in the URL is the access control for this MVP, matching the "no account required for the demo" philosophy.

## What I Learned

The biggest technical lesson was that expense-splitting is a rounding problem wearing a UI costume. It's easy to get the "happy path" math right and then discover that ₹2,400 split 50/20/20/10 doesn't cleanly reconstruct itself in rupees. Writing the settlement/rounding logic as a standalone, test-first module — completely decoupled from Lambda, API Gateway, or React — made that bug catchable in milliseconds locally instead of during a live demo.

I also relearned that "serverless" tooling assumptions are worth double-checking before reaching for the heaviest tool. I expected I'd need the SAM CLI for a SAM template, and didn't have it installed; it turned out `aws cloudformation package` and `aws cloudformation deploy` handle SAM's `Transform` natively, no extra CLI required. Similarly, I assumed Amplify meant "connect a GitHub repo," but the `create-app` / `create-deployment` / presigned-upload / `start-deployment` API path works perfectly well without Git in the loop at all — a good thing to know when you're working in a shared repo you don't own.

Finally, building around one differentiator — minimum-transaction settlement instead of listing every pairwise debt — was a useful product discipline. It would have been easy to scope-creep this into a Splitwise clone with recurring groups, multiple currencies, and receipt photos. Sticking to "one killer outcome" kept the whole build, from algorithm to deploy, inside a single focused session.

## Link to App

- **Live app:** https://main.d37erbsbc5jqv7.amplifyapp.com
- **Live API:** https://qyhaed6nmb.execute-api.us-east-1.amazonaws.com
