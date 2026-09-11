import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getGroup, summarizeGroup } from '../lib/api';

export default function Settlement() {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [error, setError] = useState('');
  const [settled, setSettled] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    getGroup(groupId)
      .then(setGroup)
      .catch((err) => setError(err.message));
  }, [groupId]);

  const handleGenerateSummary = async () => {
    setSummaryLoading(true);
    try {
      const result = await summarizeGroup(groupId);
      setSummary(result.summary || "Couldn't generate a summary right now.");
    } catch {
      setSummary("Couldn't generate a summary right now.");
    } finally {
      setSummaryLoading(false);
    }
  };

  if (error) return <p className="p-6 text-red-600">{error}</p>;
  if (!group) return <p className="p-6 text-slate-500">Loading…</p>;

  return (
    <div className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-sm">
        <Link to={`/group/${groupId}`} className="text-sm text-slate-500">
          ← Back
        </Link>
        <h1 className="mt-2 text-xl font-bold uppercase tracking-wide text-slate-900">
          Settle Up
        </h1>

        <ul className="mt-6 space-y-3">
          {group.settlement.map((t, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <span className="font-medium text-slate-800">
                {t.from} → {t.to}
              </span>
              <span className="font-semibold text-slate-900">
                ₹{t.amount.toLocaleString('en-IN')}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center text-sm text-slate-600">
          {group.settlement.length === 0
            ? 'Everyone is already settled up ✅'
            : `${group.settlement.length} payment${group.settlement.length > 1 ? 's' : ''} to settle everyone ✅`}
        </p>

        <button
          onClick={() => setSettled(true)}
          disabled={settled}
          className="mt-6 w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {settled ? 'Settled ✅' : 'Mark as Settled'}
        </button>

        <button
          onClick={handleGenerateSummary}
          disabled={summaryLoading}
          className="mt-3 w-full rounded-lg border border-slate-300 bg-white py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          {summaryLoading ? 'Thinking…' : '✨ Generate Fun Summary (AI)'}
        </button>
        {summary && (
          <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm italic text-amber-900">
            {summary}
          </p>
        )}
      </div>
    </div>
  );
}
