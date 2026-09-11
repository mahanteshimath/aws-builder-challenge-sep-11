const BASE_URL = import.meta.env.VITE_API_URL;

async function request(path, options) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export const createGroup = (name, people) =>
  request('/groups', { method: 'POST', body: JSON.stringify({ name, people }) });

export const getGroup = (groupId) => request(`/groups/${groupId}`);

export const addExpense = (groupId, expense) =>
  request(`/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(expense) });

export const summarizeGroup = (groupId) =>
  request(`/groups/${groupId}/summary`, { method: 'POST' });

// Seeds the "Goa Trip" example from the QuickSplit pitch so a judge/demo user
// can see a populated dashboard and settlement without typing anything in.
export async function createDemoGroup() {
  const people = ['Rahul', 'Monty', 'Amit', 'Priya'];
  const group = await createGroup('Goa Trip', people);
  await addExpense(group.groupId, { description: 'Hotel', amount: 8000, paidBy: 'Rahul', splitType: 'equal' });
  await addExpense(group.groupId, { description: 'Cab', amount: 3200, paidBy: 'Monty', splitType: 'equal' });
  await addExpense(group.groupId, {
    description: 'Dinner',
    amount: 2400,
    paidBy: 'Amit',
    splitType: 'custom',
    percentages: { Rahul: 50, Monty: 20, Amit: 20, Priya: 10 },
  });
  await addExpense(group.groupId, { description: 'Sightseeing', amount: 3000, paidBy: 'Priya', splitType: 'equal' });
  return group;
}
