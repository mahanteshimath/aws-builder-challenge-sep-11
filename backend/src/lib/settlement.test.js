const test = require("node:test");
const assert = require("node:assert");
const { computeBalances, computeSettlement } = require("./settlement");

const equalSplit = (amount, people) =>
  Object.fromEntries(people.map((p) => [p, amount / people.length]));

test("Goa Trip: equal split across 4 friends settles in 3 payments", () => {
  const people = ["Rahul", "Monty", "Amit", "Priya"];
  const expenses = [
    { amount: 8000, paidBy: "Rahul", splits: equalSplit(8000, people) },
    { amount: 3200, paidBy: "Monty", splits: equalSplit(3200, people) },
    { amount: 4550, paidBy: "Amit", splits: equalSplit(4550, people) },
    { amount: 3000, paidBy: "Priya", splits: equalSplit(3000, people) },
  ];

  const balances = computeBalances(people, expenses);
  // Total 18750 / 4 = 4687.50 fair share each.
  assert.deepStrictEqual(balances, {
    Rahul: 3312.5,
    Monty: -1487.5,
    Amit: -137.5,
    Priya: -1687.5,
  });

  const settlement = computeSettlement(balances);
  assert.strictEqual(settlement.length, 3, "everyone settles with Rahul directly");
  assert.deepStrictEqual(settlement, [
    { from: "Priya", to: "Rahul", amount: 1687.5 },
    { from: "Monty", to: "Rahul", amount: 1487.5 },
    { from: "Amit", to: "Rahul", amount: 137.5 },
  ]);
});

test("custom percentage split produces correct balances", () => {
  const people = ["Rahul", "Monty", "Amit", "Priya"];
  const expenses = [
    {
      amount: 2400,
      paidBy: "Rahul",
      splits: { Rahul: 1200, Monty: 480, Amit: 480, Priya: 240 }, // 50/20/20/10
    },
  ];

  const balances = computeBalances(people, expenses);
  assert.deepStrictEqual(balances, { Rahul: 1200, Monty: -480, Amit: -480, Priya: -240 });

  const settlement = computeSettlement(balances);
  assert.strictEqual(settlement.length, 3);
  assert.strictEqual(
    settlement.reduce((sum, t) => sum + t.amount, 0),
    1200
  );
});

test("smart settlement beats naive pairwise: 4 debts collapse to 2 payments", () => {
  // A owes B 500, B owes C 500, C owes D 500 -> naive is 3 payments, net is A -> D 500.
  const balances = { A: -500, B: 0, C: 0, D: 500 };
  assert.deepStrictEqual(computeSettlement(balances), [
    { from: "A", to: "D", amount: 500 },
  ]);
});

test("already-settled group needs zero payments", () => {
  const people = ["Rahul", "Monty"];
  const expenses = [
    { amount: 1000, paidBy: "Rahul", splits: { Rahul: 500, Monty: 500 } },
    { amount: 1000, paidBy: "Monty", splits: { Rahul: 500, Monty: 500 } },
  ];

  const balances = computeBalances(people, expenses);
  assert.deepStrictEqual(computeSettlement(balances), []);
});
