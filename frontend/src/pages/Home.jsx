import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <h1 className="text-4xl font-bold text-slate-900">QuickSplit</h1>
      <p className="mt-3 max-w-sm text-slate-600">
        Split expenses with friends, without the headache.
      </p>
      <Link
        to="/create"
        className="mt-8 rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700"
      >
        Create New Split
      </Link>
      <button
        onClick={handleTryDemo}
        disabled={loadingDemo}
        className="mt-3 rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loadingDemo ? 'Loading demo…' : '🎲 Try with Mock Data'}
      </button>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <p className="mt-8 max-w-xs text-xs text-slate-400">
        No sign-up. Every group gets its own private, unguessable link —
        nobody else can see or find it.
      </p>
    </div>
  );
}
