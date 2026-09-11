const { randomBytes } = require("node:crypto");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient, TABLE, json } = require("../lib/shared");

const MAX_PEOPLE = 20;

exports.handler = async (event) => {
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { message: "Request body must be valid JSON." });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 60) {
    return json(400, { message: "Group name is required and must be 60 characters or fewer." });
  }

  const people = Array.isArray(body.people)
    ? body.people.map((p) => String(p).trim()).filter(Boolean)
    : [];
  if (people.length < 2) {
    return json(400, { message: "A group needs at least 2 people." });
  }
  if (people.length > MAX_PEOPLE) {
    return json(400, { message: `A group can have at most ${MAX_PEOPLE} people.` });
  }
  if (people.some((p) => p.length > 40)) {
    return json(400, { message: "Each name must be 40 characters or fewer." });
  }
  if (new Set(people).size !== people.length) {
    return json(400, { message: "Every person needs a unique name." });
  }

  // 72 bits of entropy — the unguessable groupId is what gates access to the group.
  const groupId = randomBytes(9).toString("base64url");

  await docClient.send(
    new PutCommand({
      TableName: TABLE,
      Item: {
        pk: `GROUP#${groupId}`,
        sk: "METADATA",
        groupId,
        name,
        people,
        createdAt: new Date().toISOString(),
      },
    })
  );

  return json(201, { groupId, name, people });
};
