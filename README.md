# QuickSplit

QuickSplit is a no-sign-up expense splitter for trips, dinners, and one-off group events. Add what each person paid, choose equal or percentage-based splits, and get the settlement plan with the fewest practical payments.

## Try It

- **Live app:** https://main.d37erbsbc5jqv7.amplifyapp.com
- **Live API:** https://qyhaed6nmb.execute-api.us-east-1.amazonaws.com
- **Challenge submission:** [submission.md](submission.md)

The landing page includes a **Try the demo** action that creates a populated Goa Trip example immediately. Every group receives its own randomly generated, unguessable URL, so no account or shared group directory is needed for this MVP.

## Product Flow

1. Create a group and add the participants.
2. Add expenses with a description, amount, payer, and split type.
3. Use equal splits for common costs or percentage splits for uneven participation.
4. Review balances and the minimum-payment settlement plan.
5. Optionally generate a short, witty trip recap with Amazon Nova through Amazon Bedrock.

The core differentiator is the settlement algorithm. QuickSplit nets each participant's paid and owed amounts, then matches debtors to creditors so the group can settle with far fewer transfers than a naive pairwise approach.

## Architecture

```text
React + Vite + Tailwind CSS
            │
            ▼
      Amplify Hosting
            │
            ▼
  API Gateway HTTP API
            │
            ▼
       AWS Lambda
            │
            ├── DynamoDB single table
            └── Bedrock Converse API
                Amazon Nova Lite
```

- **Frontend:** React, Vite, and Tailwind CSS, hosted on AWS Amplify Hosting.
- **API:** Amazon API Gateway HTTP API with routes for group creation, group reads, expense creation, and AI summaries.
- **Compute:** Four Node.js 20.x Lambda functions: create group, get group, add expense, and summarize group.
- **Data:** DynamoDB on-demand capacity with a single-table layout. Group metadata and expenses share `GROUP#<groupId>` as the partition key.
- **AI:** Amazon Bedrock Converse API with Amazon Nova Lite for the optional settlement recap. The core math works independently of the model.
- **Infrastructure:** AWS SAM in [backend/template.yaml](backend/template.yaml). Deployment uses the standard AWS CLI and CloudFormation packaging commands.

## Repository Layout

```text
backend/
  src/handlers/       Lambda handlers
  src/lib/            Settlement logic and shared DynamoDB client
  template.yaml       SAM/CloudFormation infrastructure
frontend/
  src/pages/          React screens and workflows
  src/lib/api.js      API client and demo data seed
submission.md         Weekend Deployment Challenge article
```

## Local Development

### Frontend

The frontend expects `VITE_API_URL` in `.env.development`.

```bash
cd frontend
npm install
npm run dev
```

Production validation:

```bash
npm run build
npm run lint
```

### Backend Tests

The settlement algorithm is framework-independent and tested with Node's built-in test runner:

```bash
cd backend
node --test src/lib/settlement.test.js
```

### Deploy the Backend

The commands below require AWS CLI credentials and an S3 deployment bucket. Replace the placeholder bucket name with one available in your account.

```bash
cd backend
aws cloudformation package \
  --template-file template.yaml \
  --s3-bucket <your-deploy-bucket> \
  --output-template-file packaged.yaml \
  --region us-east-1

aws cloudformation deploy \
  --template-file packaged.yaml \
  --stack-name quicksplit \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## Privacy Model

QuickSplit intentionally has no sign-up flow. A group is retrieved only through its random group ID, and the API exposes no route for listing or discovering groups. This is appropriate for a lightweight, one-off sharing experience, but it is not a replacement for authenticated access control for sensitive financial records or long-lived accounts.

## License

No license has been declared yet.
