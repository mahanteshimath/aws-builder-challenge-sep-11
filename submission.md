# Weekend Deployment Challenge: QuickSplit

**Tag:** #deployment

## The Product

QuickSplit is a no-sign-up expense splitter for the situations where a full finance app feels like too much: a weekend trip, a dinner with friends, or a one-off group event. The product promise is deliberately narrow: enter what people paid, and get the clearest settlement plan with the fewest practical payments.

There is no account creation, password, profile, or setup ceremony. A user opens the app, creates a group, adds the participants, and starts recording expenses. Every group receives a fresh, randomly generated URL, and the API has no group-listing route. That keeps separate sessions isolated while preserving the convenience of a shareable link.

The workflow is simple:

1. Create a group and add the participants.
2. Add expenses with a description, amount, payer, and split type.
3. Choose an equal split or enter percentage-based shares for uneven participation.
4. Review each participant's balance and the recommended settlement transfers.
5. Optionally generate a short AI-written recap of the trip.

The core differentiator is the final step. Many expense splitters expose every individual debt, which can create a long list of redundant transfers. QuickSplit first calculates each person's net balance and then matches debtors to creditors, producing a compact settlement plan. In the bundled Goa Trip example, four friends and several uneven expenses collapse into three payments. That is the product moment: not just knowing the math, but seeing the group get from chaos to “done” with minimal movement of money.

## How I Built It

I started with the outcome rather than the infrastructure: “Tell me who owes whom, how much, and with the fewest payments.” The first implementation was a pure JavaScript settlement module, independent of React, Lambda, and DynamoDB. `computeBalances` nets what each person paid against what they owe. `computeSettlement` then matches the largest creditor and debtor repeatedly until the balances are cleared. Node's built-in test runner covers equal splits, custom percentage splits, already-settled groups, and the reduction from many individual debts to a smaller payment set.

Money rounding was the most important edge case. A percentage split can produce fractional cents, and rounding each share independently can make the stored parts differ from the original expense. QuickSplit rounds shares to two decimals and assigns the remaining rounding drift to the first participant, ensuring that every stored split adds back to the exact expense amount.

The backend is the source of truth for this calculation. The group-read Lambda loads the group and its expenses from DynamoDB, computes balances and settlement, and returns the result to the frontend. The browser renders that response rather than maintaining a second copy of the financial logic. This keeps the most sensitive behavior in one tested implementation.

## AWS Architecture

```text
React + Vite + Tailwind CSS
            │
            ▼
      AWS Amplify Hosting
            │
            ▼
  Amazon API Gateway HTTP API
            │
            ▼
       AWS Lambda, Node.js 20.x
       ├── CreateGroup
       ├── AddExpense
       ├── GetGroup
       └── SummarizeGroup
            │                 │
            ▼                 ▼
      DynamoDB          Amazon Bedrock
   single-table data   Amazon Nova Lite
```

- **AWS Amplify Hosting** serves the React production build. I used Amplify's manual deployment API: create a deployment, upload the Vite artifact to the presigned S3 URL, and start the deployment job.
- **Amazon API Gateway HTTP API** exposes group, expense, and summary routes with CORS configured for the hosted frontend.
- **AWS Lambda** provides four focused Node.js 20.x handlers for validation, persistence, group reads, settlement calculation, and optional AI summaries.
- **Amazon DynamoDB** uses on-demand capacity and a single-table layout. A group uses `GROUP#<groupId>` as its partition key; `METADATA` stores the group and `EXPENSE#<expenseId>` stores each expense.
- **Amazon Bedrock** powers the optional “Generate a fun recap” action through the Converse API and Amazon Nova Lite. The model receives the group context and settlement result, but it never controls or changes the financial calculation.

The infrastructure is defined in AWS SAM. Because the SAM CLI was not installed locally, I used `aws cloudformation package` followed by `aws cloudformation deploy`. The standard AWS CLI handled the packaging and CloudFormation deployment without requiring an additional local toolchain.

## Deployment and Verification

The live deployment is split into two independently verifiable paths. The backend is packaged from the SAM template and deployed to CloudFormation. The frontend is built with Vite, uploaded to Amplify Hosting, and checked through its deployment job status.

I verified the core flow against the live API: create a group, add equal and custom expenses, retrieve the group, and confirm the expected balances and settlement count. I also exercised the Bedrock summary endpoint with a real Nova response. Separate groups were created to confirm that one group's expenses do not appear in another group's response, and a group-listing request correctly returns no route.

## What I Learned

The most useful lesson was that expense splitting is a rounding problem wearing a UI costume. The happy path is easy; the edge cases are where trust is won or lost. Keeping the math in a small, test-first module made those cases quick to reason about and easy to verify.

I also learned to question tooling assumptions. A SAM template does not necessarily require the SAM CLI when standard CloudFormation packaging is enough. Likewise, Amplify Hosting does not require a Git-connected workflow; its deployment API supports a direct artifact upload, which was a practical fit for this challenge.

Finally, choosing one clear differentiator kept the build focused. QuickSplit does not attempt to become a permanent financial ledger with recurring groups, receipt scanning, or multi-currency accounting. It solves one common social problem cleanly: getting a small group settled with fewer payments and less friction.

## Links

- **Live app:** https://main.d37erbsbc5jqv7.amplifyapp.com
- **Live API:** https://qyhaed6nmb.execute-api.us-east-1.amazonaws.com
- **Source code:** https://github.com/mahanteshimath/aws-builder-challenge-sep-11
