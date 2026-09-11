# QuickSplit

Split expenses with friends and settle up in the fewest possible payments — no account required.

- **Live app:** https://main.d37erbsbc5jqv7.amplifyapp.com
- **Live API:** https://qyhaed6nmb.execute-api.us-east-1.amazonaws.com
- **Challenge article:** [submission.md](submission.md)

## Stack

- `frontend/` — React + Vite + Tailwind CSS, deployed to AWS Amplify Hosting.
- `backend/` — AWS SAM (API Gateway HTTP API + Lambda + DynamoDB).

## Local development

Backend tests:

```bash
cd backend
node --test src/lib/settlement.test.js
```

Backend deploy (requires an AWS profile with credentials):

```bash
cd backend
aws s3 mb s3://<your-deploy-bucket> --region us-east-1
aws cloudformation package --template-file template.yaml --s3-bucket <your-deploy-bucket> --output-template-file packaged.yaml --region us-east-1
aws cloudformation deploy --template-file packaged.yaml --stack-name quicksplit --capabilities CAPABILITY_IAM --region us-east-1
```

Frontend dev server (point `.env.development` at your deployed API URL first):

```bash
cd frontend
npm install
npm run dev
```
