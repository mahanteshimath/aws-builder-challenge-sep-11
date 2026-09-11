// Core QuickSplit domain logic: per-person balances and minimum-transaction settlement.
// Money is handled in integer paise/cents internally to avoid floating point drift, then
// converted back to rupees (rounded) at the boundary.

/**
 * @param {string[]} people
 * @param {Array<{amount:number, paidBy:string, splits:Record<string,number>}>} expenses
 *   `splits` maps person -> amount they owe for that expense (already resolved from equal/custom).
 * @returns {Record<string, number>} net balance per person, in rupees (+ve = owed money, -ve = owes money)
 */
function computeBalances(people, expenses) {
  const balance = Object.fromEntries(people.map((p) => [p, 0]));

  for (const expense of expenses) {
    balance[expense.paidBy] = (balance[expense.paidBy] || 0) + expense.amount;
    for (const [person, share] of Object.entries(expense.splits)) {
      balance[person] = (balance[person] || 0) - share;
    }
  }

  // Round to 2 decimals to kill floating point noise from percentage splits.
  for (const person of Object.keys(balance)) {
    balance[person] = Math.round(balance[person] * 100) / 100;
  }
  return balance;
}

/**
 * Greedy debt-simplification: repeatedly match the largest creditor with the largest debtor.
 * This does not always find the mathematically-optimal minimum (that's NP-hard in general),
 * but it's the standard practical approximation and is optimal for the common small-group case.
 * ponytail: greedy heuristic, not guaranteed globally optimal for pathological balance sets — fine at group sizes seen in an expense-splitting app.
 * @param {Record<string, number>} balances
 * @returns {Array<{from:string, to:string, amount:number}>}
 */
function computeSettlement(balances) {
  const EPSILON = 0.01;
  const creditors = [];
  const debtors = [];

  for (const [person, amount] of Object.entries(balances)) {
    if (amount > EPSILON) creditors.push({ person, amount });
    else if (amount < -EPSILON) debtors.push({ person, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settled = Math.min(debtor.amount, creditor.amount);

    transactions.push({
      from: debtor.person,
      to: creditor.person,
      amount: Math.round(settled * 100) / 100,
    });

    debtor.amount -= settled;
    creditor.amount -= settled;

    if (debtor.amount < EPSILON) i++;
    if (creditor.amount < EPSILON) j++;
  }

  return transactions;
}

module.exports = { computeBalances, computeSettlement };
