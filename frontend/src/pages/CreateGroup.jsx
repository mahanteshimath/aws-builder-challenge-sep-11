import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createGroup } from '../lib/api';

export default function CreateGroup() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [people, setPeople] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const updatePerson = (index, value) =>
    setPeople((prev) => prev.map((p, i) => (i === index ? value : p)));

  const addPerson = () => setPeople((prev) => [...prev, '']);
  const removePerson = (index) => setPeople((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const cleanedPeople = people.map((p) => p.trim()).filter(Boolean);
    setSubmitting(true);
    try {
      const group = await createGroup(name.trim(), cleanedPeople);
      navigate(`/group/${group.groupId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-[100dvh] px-6 py-10 text-[#17352f]">
      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-6">
        <Link to="/" className="text-sm font-semibold text-[#668078] hover:text-[#dd783a]">← QuickSplit</Link>
        <h1 className="pt-4 text-3xl font-bold tracking-[-0.06em]">Create a split</h1>
        <p className="-mt-3 text-sm leading-6 text-[#668078]">Give the group a name, add everyone, and let the math take it from there.</p>

        <div>
          <label className="block text-sm font-semibold text-[#31564d]">Group name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goa Trip"
            className="mt-2 w-full rounded-xl border border-[#cbd8c9] bg-[#f8f8ef] px-3 py-3 text-[#17352f] placeholder:text-[#9aaa9e] focus:border-[#dd783a] focus:ring-2 focus:ring-[#dd783a]/20"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-[#31564d]">People</label>
          <div className="mt-1 space-y-2">
            {people.map((person, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={person}
                  onChange={(e) => updatePerson(i, e.target.value)}
                  placeholder={`Person ${i + 1}`}
                  className="w-full rounded-xl border border-[#cbd8c9] bg-[#f8f8ef] px-3 py-3 text-[#17352f] placeholder:text-[#9aaa9e] focus:border-[#dd783a] focus:ring-2 focus:ring-[#dd783a]/20"
                />
                {people.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePerson(i)}
                    className="rounded-lg px-2 text-[#9aaa9e] hover:bg-[#fff0e5] hover:text-[#b64735]"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addPerson}
            className="mt-2 text-sm font-semibold text-[#dd783a] hover:text-[#b85e2c]"
          >
            + Add person
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-[#17352f] py-3.5 font-semibold text-[#f8f8ef] shadow-[0_12px_24px_rgba(23,53,47,0.14)] hover:bg-[#214d43] disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Group'}
        </button>
      </form>
    </main>
  );
}
