import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGroup } from '../lib/api';
import AddExpenseForm from './AddExpenseForm';

export default function Dashboard() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    getGroup(groupId)
      .then(setGroup)
      .catch((err) => setError(err.message));
  }, [groupId]);

  useEffect(load, [load]);

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!group) return <p className="p-6 text-slate-500">Loading…</p>;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {group.name}
        </p>
        <p className="text-3xl font-bold text-slate-900">₹{group.total.toLocaleString('en-IN')} Total</p>

        <div className="mt-2 flex gap-6 text-sm text-slate-600">
          <span>Expenses {group.expenses.length}</span>
          <span>People {group.people.length}</span>
        </div>

        <ul className="mt-6 divide-y divide-slate-200 rounded-xl bg-white shadow-sm">
          {group.people.map((person) => {
            const balance = group.balances[person] ?? 0;
            return (
              <li key={person} className="flex items-center justify-between px-4 py-3">
                <span className="font-medium text-slate-800">{person}</span>
                <span className={balance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toLocaleString('en-IN')}
                </span>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => setShowForm(true)}
          className="mt-4 w-full rounded-lg bg-slate-900 py-3 font-semibold text-white"
        >
          + Add Expense
        </button>

        <Link
          to={`/group/${groupId}/settlement`}
          className="mt-3 block w-full rounded-lg bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
        >
          View Settlement
        </Link>
      </div>

      {showForm && (
        <AddExpenseForm
          group={group}
          onClose={() => setShowForm(false)}
          onAdded={() => {
            setShowForm(false);
            load();
          }}
        />
      )}
    </div>
  );
}
