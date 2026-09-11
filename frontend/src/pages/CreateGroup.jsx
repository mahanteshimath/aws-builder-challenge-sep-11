import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    <div className="min-h-screen bg-slate-50 px-6 py-10">
      <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-slate-900">Create Group</h1>

        <div>
          <label className="block text-sm font-medium text-slate-700">Group Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Goa Trip"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">People</label>
          <div className="mt-1 space-y-2">
            {people.map((person, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={person}
                  onChange={(e) => updatePerson(i, e.target.value)}
                  placeholder={`Person ${i + 1}`}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
                {people.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePerson(i)}
                    className="px-2 text-slate-400 hover:text-red-500"
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
            className="mt-2 text-sm font-medium text-emerald-700"
          >
            + Add person
          </button>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Creating…' : 'Create Group'}
        </button>
      </form>
    </div>
  );
}
