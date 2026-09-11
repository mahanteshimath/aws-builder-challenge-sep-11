import { Link } from 'react-router-dom';

export default function Home() {
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
    </div>
  );
}
