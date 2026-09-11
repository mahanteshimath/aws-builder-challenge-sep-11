import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createDemoGroup } from '../lib/api';

export default function Home() {
  const navigate = useNavigate();
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [error, setError] = useState('');

  const handleTryDemo = async () => {
    setError('');
    setLoadingDemo(true);
    try {
      const group = await createDemoGroup();
      navigate(`/group/${group.groupId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingDemo(false);
    }
  };

  return (
    <main className="min-h-[100dvh] overflow-hidden px-5 py-6 text-[#17352f] sm:px-8 lg:px-12">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link to="/" className="text-lg font-bold tracking-[-0.04em]">Quick<span className="text-[#dd783a]">Split</span></Link>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#668078]">No account needed</span>
      </nav>

      <section className="relative mx-auto grid max-w-6xl items-center gap-12 pb-10 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20 lg:pb-20 lg:pt-24">
        <div className="relative z-10 animate-[fade-in_500ms_ease-out_both]">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-[#dd783a]">The group tab, sorted</p>
          <h1 className="max-w-xl text-5xl font-bold leading-[0.96] tracking-[-0.07em] text-[#17352f] sm:text-6xl lg:text-7xl">
            Split the bill.<br /><span className="text-[#dd783a]">Keep the friendship.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-[#5c746c]">
            Add what people paid, and get the fewest payments needed to settle up.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              to="/create"
              className="rounded-xl bg-[#17352f] px-6 py-3.5 text-center font-semibold text-[#f8f8ef] shadow-[0_12px_24px_rgba(23,53,47,0.16)] hover:-translate-y-0.5 hover:bg-[#214d43]"
            >
              Create a split
            </Link>
            <button
              onClick={handleTryDemo}
              disabled={loadingDemo}
              className="rounded-xl border border-[#cbd8c9] bg-[#f8f8ef]/80 px-6 py-3.5 font-semibold text-[#31564d] hover:-translate-y-0.5 hover:border-[#dd783a] hover:text-[#dd783a] disabled:opacity-50"
            >
              {loadingDemo ? 'Loading demo…' : 'Try the demo'}
            </button>
          </div>
          {error && <p className="mt-4 text-sm font-medium text-[#b64735]">{error}</p>}
          <p className="mt-6 text-xs leading-5 text-[#789088]">Private by design. Every group gets a fresh, unguessable link.</p>
        </div>

        <div className="relative mx-auto w-full max-w-md animate-[lift-in_650ms_120ms_ease-out_both] lg:mt-8">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[#e6f0c9] blur-2xl" />
          <div className="relative rotate-2 rounded-[2rem] border border-[#d9e4d2] bg-[#f8f8ef] p-5 shadow-[0_28px_70px_rgba(57,91,65,0.15)]">
            <div className="flex items-start justify-between border-b border-[#dce6d7] pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#789088]">Goa Trip</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.06em] text-[#17352f]">₹16,600</p>
              </div>
              <span className="rounded-lg bg-[#e7f2c7] px-2.5 py-1 text-xs font-bold text-[#4b6b2f]">4 people</span>
            </div>
            <div className="space-y-4 py-5">
              {[['Rahul', '+₹3,250'], ['Monty', '-₹830'], ['Amit', '-₹1,630']].map(([name, amount], index) => (
                <div key={name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#edf2e6] text-sm font-bold text-[#dd783a]">{name[0]}</span>
                    <span className="font-medium text-[#31564d]">{name}</span>
                  </div>
                  <span className={index === 0 ? 'font-semibold text-[#4b7b43]' : 'font-semibold text-[#b96645]'}>{amount}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl bg-[#17352f] px-4 py-3 text-sm text-[#edf3e7]">
              <div className="flex items-center justify-between"><span>Minimum payments</span><span className="font-bold">3</span></div>
              <div className="mt-1 text-xs text-[#a9c2b5]">Amit {'->'} Rahul · ₹1,630</div>
            </div>
          </div>
          <div className="absolute -bottom-8 -left-5 -rotate-3 rounded-xl border border-[#f1d9b7] bg-[#fff5e5] px-4 py-3 text-sm font-semibold text-[#8a5a32] shadow-[0_14px_30px_rgba(122,84,41,0.12)]">Less math. More plans.</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 border-t border-[#dbe5d7] py-8 text-sm text-[#5c746c] sm:grid-cols-3">
        <div><span className="font-bold text-[#17352f]">01</span><span className="ml-3">Create a group</span></div>
        <div><span className="font-bold text-[#17352f]">02</span><span className="ml-3">Add every expense</span></div>
        <div><span className="font-bold text-[#17352f]">03</span><span className="ml-3">Settle with fewer transfers</span></div>
      </section>
    </main>
  );
}
