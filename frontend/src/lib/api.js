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
