const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE, json } = require("../lib/shared");
const { computeBalances, computeSettlement } = require("../lib/settlement");

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

  const expenses = Items.filter((item) => item.sk.startsWith("EXPENSE#")).sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );

  const balances = computeBalances(group.people, expenses);

  return json(200, {
    groupId: group.groupId,
    name: group.name,
    people: group.people,
    total: Math.round(expenses.reduce((sum, e) => sum + e.amount, 0) * 100) / 100,
    expenses: expenses.map(({ pk, sk, ...expense }) => expense),
    balances,
    settlement: computeSettlement(balances),
  });
};
