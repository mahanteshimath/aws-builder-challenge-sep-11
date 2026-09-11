const { randomBytes } = require("node:crypto");
const { GetCommand, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE, json } = require("../lib/shared");

const round2 = (n) => Math.round(n * 100) / 100;

// Splits must add back up to the exact expense amount, so the rounding remainder
// lands on the first participant rather than quietly vanishing.
function distribute(amount, shares) {
  const names = Object.keys(shares);
  const rounded = Object.fromEntries(names.map((n) => [n, round2(shares[n])]));
  const drift = round2(amount - names.reduce((sum, n) => sum + rounded[n], 0));
  rounded[names[0]] = round2(rounded[names[0]] + drift);
  return rounded;
}

exports.handler = async (event) => {
  const groupId = event.pathParameters?.groupId;
  if (!groupId) return json(400, { message: "Missing group id." });

  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { message: "Request body must be valid JSON." });
  }

  const { Item: group } = await docClient.send(
    new GetCommand({ TableName: TABLE, Key: { pk: `GROUP#${groupId}`, sk: "METADATA" } })
  );
  if (!group) return json(404, { message: "Group not found." });

  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (!description || description.length > 80) {
    return json(400, { message: "Description is required and must be 80 characters or fewer." });
  }

  const amount = round2(Number(body.amount));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    return json(400, { message: "Amount must be a positive number under 10,000,000." });
  }

  const paidBy = String(body.paidBy || "").trim();
  if (!group.people.includes(paidBy)) {
    return json(400, { message: "'Paid by' must be someone in this group." });
  }

  const splitType = body.splitType === "custom" ? "custom" : "equal";
  let splits;

  if (splitType === "equal") {
    const participants = Array.isArray(body.participants) && body.participants.length
      ? body.participants.map((p) => String(p).trim())
      : group.people;
    if (participants.some((p) => !group.people.includes(p))) {
      return json(400, { message: "Everyone in the split must be in this group." });
    }
    if (new Set(participants).size !== participants.length) {
      return json(400, { message: "Duplicate person in the split." });
    }
    const share = amount / participants.length;
    splits = distribute(amount, Object.fromEntries(participants.map((p) => [p, share])));
  } else {
    const percentages = body.percentages;
    if (!percentages || typeof percentages !== "object" || Array.isArray(percentages)) {
      return json(400, { message: "A custom split needs a percentages object." });
    }
    const names = Object.keys(percentages);
    if (!names.length) return json(400, { message: "A custom split needs at least one person." });
    if (names.some((p) => !group.people.includes(p))) {
      return json(400, { message: "Everyone in the split must be in this group." });
    }
    const values = names.map((p) => Number(percentages[p]));
    if (values.some((v) => !Number.isFinite(v) || v < 0)) {
      return json(400, { message: "Each percentage must be a number of 0 or more." });
    }
    const total = values.reduce((sum, v) => sum + v, 0);
    if (Math.abs(total - 100) > 0.5) {
      return json(400, { message: `Percentages must add up to 100 (currently ${round2(total)}).` });
    }
    splits = distribute(
      amount,
      Object.fromEntries(names.map((p, i) => [p, (amount * values[i]) / 100]))
    );
  }

  const expenseId = randomBytes(9).toString("base64url");
  const expense = {
    expenseId,
    description,
    amount,
    paidBy,
    splitType,
    splits,
    createdAt: new Date().toISOString(),
  };

  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: { pk: `GROUP#${groupId}`, sk: `EXPENSE#${expenseId}`, ...expense },
    })
  );

  return json(201, expense);
};
