const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE, json } = require("../lib/shared");
const { computeBalances, computeSettlement } = require("../lib/settlement");

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const MODEL_ID = "amazon.nova-lite-v1:0";

exports.handler = async (event) => {
  const groupId = event.pathParameters?.groupId;
  if (!groupId) return json(400, { message: "Missing group id." });

  const { Items = [] } = await docClient.send(
    new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: "pk = :pk",
      ExpressionAttributeValues: { ":pk": `GROUP#${groupId}` },
    })
  );

  const group = Items.find((item) => item.sk === "METADATA");
  if (!group) return json(404, { message: "Group not found." });

  const expenses = Items.filter((item) => item.sk.startsWith("EXPENSE#"));
  const balances = computeBalances(group.people, expenses);
  const settlement = computeSettlement(balances);

  const prompt = `You are a witty trip-expense assistant. In ONE short, upbeat sentence (max 25 words, no markdown),
summarize this group's expense settlement in a fun way. Group: "${group.name}". People: ${group.people.join(", ")}.
Total spent: ₹${expenses.reduce((s, e) => s + e.amount, 0)}. Settlement needed: ${
    settlement.length === 0
      ? "everyone is already even"
      : settlement.map((t) => `${t.from} pays ${t.to} ₹${t.amount}`).join("; ")
  }.`;

  try {
    const response = await bedrock.send(
      new ConverseCommand({
        modelId: MODEL_ID,
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens: 80, temperature: 0.8 },
      })
    );
    const summary = response.output?.message?.content?.[0]?.text?.trim() || "";
    return json(200, { summary });
  } catch (err) {
    // Bedrock is a nice-to-have here — never let it break the settlement flow.
    return json(200, { summary: "", error: err.name });
  }
};
