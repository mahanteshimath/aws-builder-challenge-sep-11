import { useState } from 'react';
import { addExpense } from '../lib/api';

export default function AddExpenseForm({ group, onAdded, onClose }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState(group.people[0]);
  const [splitType, setSplitType] = useState('equal');
  const [participants, setParticipants] = useState(new Set(group.people));
  const [percentages, setPercentages] = useState(
    Object.fromEntries(group.people.map((p) => [p, '']))
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleParticipant = (person) =>
    setParticipants((prev) => {
      const next = new Set(prev);
      next.has(person) ? next.delete(person) : next.add(person);
      return next;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        description: description.trim(),
        amount: Number(amount),
        paidBy,
        splitType,
        ...(splitType === 'equal'
          ? { participants: [...participants] }
          : {
              percentages: Object.fromEntries(
                Object.entries(percentages).map(([p, v]) => [p, Number(v) || 0])
              ),
            }),
      };
      await addExpense(group.groupId, payload);
      onAdded();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-10 flex items-end justify-center bg-black/40 sm:items-center">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-t-2xl bg-white p-6 sm:rounded-2xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add Expense</h2>
          <button type="button" onClick={onClose} className="text-slate-400">
            ✕
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Expense</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Dinner"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Amount</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="2400"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Paid by</label>
          <select
            value={paidBy}
            onChange={(e) => setPaidBy(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {group.people.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSplitType('equal')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              splitType === 'equal' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Equal
          </button>
          <button
            type="button"
            onClick={() => setSplitType('custom')}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              splitType === 'custom' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Custom
          </button>
        </div>

        {splitType === 'equal' ? (
          <div>
            <label className="block text-sm font-medium text-slate-700">Split between</label>
            <div className="mt-1 space-y-1">
              {group.people.map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={participants.has(p)}
                    onChange={() => toggleParticipant(p)}
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Percentage per person
            </label>
            <div className="mt-1 space-y-1">
              {group.people.map((p) => (
                <div key={p} className="flex items-center gap-2">
                  <span className="w-20 text-sm text-slate-700">{p}</span>
                  <input
                    type="number"
                    value={percentages[p]}
                    onChange={(e) =>
                      setPercentages((prev) => ({ ...prev, [p]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full rounded-lg border border-slate-300 px-2 py-1"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}
