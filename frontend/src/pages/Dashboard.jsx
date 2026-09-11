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
    <main className="min-h-[100dvh] px-6 py-8 text-[#17352f]">
      <div className="mx-auto max-w-sm">
        <Link to="/" className="text-sm font-semibold text-[#668078] hover:text-[#dd783a]">← QuickSplit</Link>
        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.18em] text-[#dd783a]">
          {group.name}
        </p>
        <p className="mt-2 text-4xl font-bold tracking-[-0.06em]">₹{group.total.toLocaleString('en-IN')} <span className="text-xl font-semibold text-[#668078]">total</span></p>

        <div className="mt-2 flex gap-6 text-sm text-slate-600">
          <span>{group.expenses.length} expenses</span>
          <span>{group.people.length} people</span>
        </div>

        <ul className="mt-7 divide-y divide-[#dbe5d7] rounded-2xl border border-[#dbe5d7] bg-[#f8f8ef]/80 shadow-[0_16px_40px_rgba(57,91,65,0.08)]">
          {group.people.map((person) => {
            const balance = group.balances[person] ?? 0;
            return (
              <li key={person} className="flex items-center justify-between px-4 py-3">
                <span className="font-semibold text-[#31564d]">{person}</span>
                <span className={balance >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  {balance >= 0 ? '+' : '-'}₹{Math.abs(balance).toLocaleString('en-IN')}
                </span>
              </li>
            );
          })}
        </ul>

        <button
          onClick={() => setShowForm(true)}
          className="mt-4 w-full rounded-xl bg-[#17352f] py-3.5 font-semibold text-[#f8f8ef] shadow-[0_12px_24px_rgba(23,53,47,0.14)] hover:bg-[#214d43]"
        >
          + Add Expense
        </button>

        <Link
          to={`/group/${groupId}/settlement`}
          className="mt-3 block w-full rounded-xl border border-[#cbd8c9] bg-[#f8f8ef] py-3.5 text-center font-semibold text-[#31564d] hover:border-[#dd783a] hover:text-[#dd783a]"
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
    </main>
  );
}
