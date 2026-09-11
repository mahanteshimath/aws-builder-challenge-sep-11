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

  if (error) return <p className="p-6 text-[#b64735]">{error}</p>;
  if (!group) return <p className="p-6 text-[#668078]">Loading your settlement…</p>;

  const paymentCount = group.settlement.length;

  return (
    <main className="min-h-[100dvh] px-5 py-8 text-[#17352f] sm:px-8">
      <div className="mx-auto max-w-xl">
        <Link to={`/group/${groupId}`} className="text-sm font-semibold text-[#668078] hover:text-[#dd783a]">
          ← Back to {group.name}
        </Link>

        <div className="mt-10 flex items-end justify-between gap-4 border-b border-[#dbe5d7] pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#dd783a]">Final tab</p>
            <h1 className="mt-2 text-4xl font-bold tracking-[-0.07em]">Settle up</h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#789088]">Payments</p>
            <p className="mt-1 text-3xl font-bold tracking-[-0.06em] text-[#dd783a]">{paymentCount}</p>
          </div>
        </div>

        {paymentCount === 0 ? (
          <section className="mt-8 rounded-2xl border border-[#d9e4d2] bg-[#e7f2c7] p-6">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#4b6b2f]">All clear</p>
            <h2 className="mt-3 text-2xl font-bold tracking-[-0.05em] text-[#31564d]">Everyone is settled.</h2>
            <p className="mt-2 text-sm leading-6 text-[#5c746c]">No transfers are needed for this group.</p>
          </section>
        ) : (
          <>
            <p className="mt-7 max-w-md text-base leading-7 text-[#5c746c]">
              The cleanest route home: {paymentCount} {paymentCount === 1 ? 'payment' : 'payments'} gets everyone square.
            </p>
            <ol className="mt-6 space-y-3">
              {group.settlement.map((payment, index) => (
                <li
                  key={`${payment.from}-${payment.to}-${index}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-[#d9e4d2] bg-[#f8f8ef]/85 px-4 py-4 shadow-[0_10px_28px_rgba(57,91,65,0.06)] transition hover:-translate-y-0.5 hover:border-[#dd783a]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf2e6] text-sm font-bold text-[#dd783a]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="truncate font-semibold text-[#31564d]">
                      {payment.from} {'->'} {payment.to}
                    </span>
                  </div>
                  <span className="shrink-0 text-lg font-bold tracking-[-0.04em] text-[#17352f]">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => setSettled(true)}
            disabled={settled || paymentCount === 0}
            className="rounded-xl bg-[#17352f] py-3.5 font-semibold text-[#f8f8ef] shadow-[0_12px_24px_rgba(23,53,47,0.14)] hover:bg-[#214d43] disabled:cursor-not-allowed disabled:opacity-45"
          >
            {settled ? 'Marked as settled' : 'Mark as settled'}
          </button>
          <button
            onClick={handleGenerateSummary}
            disabled={summaryLoading}
            className="rounded-xl border border-[#cbd8c9] bg-[#f8f8ef] py-3.5 font-semibold text-[#31564d] hover:-translate-y-0.5 hover:border-[#dd783a] hover:text-[#dd783a] disabled:opacity-50"
          >
            {summaryLoading ? 'Writing the recap…' : 'Generate a fun recap'}
          </button>
        </div>

        {summary && (
          <aside className="mt-5 rounded-2xl border border-[#f1d9b7] bg-[#fff5e5] px-5 py-4 text-sm leading-6 text-[#8a5a32] shadow-[0_12px_28px_rgba(122,84,41,0.08)]">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#dd783a]">From QuickSplit AI</p>
            <p className="mt-2 font-medium">{summary}</p>
          </aside>
        )}
      </div>
    </main>
  );
}
