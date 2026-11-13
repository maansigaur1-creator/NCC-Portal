import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { Cadet, AchievementRecord, formatDisplayDate } from '../types';
import { ConfirmModal } from './Modal';

interface AchievementsViewProps {
  cadets: Cadet[];
  achievements: AchievementRecord[];
  initialAddMode?: boolean;
  onResetInitialMode?: () => void;
  onSaveAchievement: (ach: Omit<AchievementRecord, 'id'>, editId?: number) => Promise<string | null>;
  onDeleteAchievement: (id: number) => Promise<void>;
}

const emptyAchForm = (defaultCadetId: number): Omit<AchievementRecord, 'id'> => ({
  cadet_id: defaultCadetId,
  title: '',
  category: 'Certificate',
  level: 'Unit',
  achieved_date: new Date().toISOString().slice(0, 10),
  remarks: '',
});

export const AchievementsView: React.FC<AchievementsViewProps> = ({
  cadets,
  achievements,
  initialAddMode = false,
  onResetInitialMode,
  onSaveAchievement,
  onDeleteAchievement,
}) => {
  const [mode, setMode] = useState<'list' | 'form'>(initialAddMode ? 'form' : 'list');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<Omit<AchievementRecord, 'id'>>(
    emptyAchForm(cadets[0]?.id || 0)
  );
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AchievementRecord | null>(null);

  useEffect(() => {
    if (initialAddMode) {
      setEditingId(undefined);
      setForm(emptyAchForm(cadets[0]?.id || 0));
      setFormError('');
      setMode('form');
      onResetInitialMode?.();
    }
  }, [initialAddMode, cadets, onResetInitialMode]);

  const cadetMap = new Map(cadets.map((c) => [c.id, c]));

  const filtered = achievements
    .filter((a) => !categoryFilter || a.category === categoryFilter)
    .sort((a, b) => b.achieved_date.localeCompare(a.achieved_date));

  const openEdit = (ach: AchievementRecord) => {
    setEditingId(ach.id);
    setForm({
      cadet_id: ach.cadet_id,
      title: ach.title,
      category: ach.category,
      level: ach.level,
      achieved_date: ach.achieved_date,
      remarks: ach.remarks,
    });
    setFormError('');
    setMode('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.cadet_id || !form.title.trim()) {
      setFormError('Please select a cadet and enter the achievement title.');
      return;
    }
    setSaving(true);
    const err = await onSaveAchievement(form, editingId);
    setSaving(false);
    if (err) {
      setFormError(err);
    } else {
      setMode('list');
    }
  };

  if (mode === 'form') {
    return (
      <section className="max-w-3xl rounded-lg border border-[#dce1d5] bg-white p-6">
        <div className="mb-5 flex items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#2f3613]">
              {editingId ? 'Edit Cadet Achievement' : 'Record New Achievement'}
            </h2>
            <p className="text-xs text-[#5c6352]">
              Log NCC certificates, camp awards, or co-curricular activities.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode('list')}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Achievements
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Select Cadet *
            </label>
            <select
              value={form.cadet_id}
              onChange={(e) => setForm({ ...form, cadet_id: Number(e.target.value) })}
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            >
              <option value={0}>-- Choose Cadet --</option>
              {cadets.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.regimental_no} - {c.rank_title} {c.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Certificate / Award / Activity Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. NCC 'C' Certificate - Grade A"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">Category *</label>
            <select
              value={form.category}
              onChange={(e) =>
                setForm({
                  ...form,
                  category: e.target.value as AchievementRecord['category'],
                })
              }
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              <option value="Certificate">Certificate</option>
              <option value="Award">Award</option>
              <option value="Activity">Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Recognition Level *
            </label>
            <select
              value={form.level}
              onChange={(e) =>
                setForm({ ...form, level: e.target.value as AchievementRecord['level'] })
              }
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              <option value="Unit">Unit</option>
              <option value="Group">Group</option>
              <option value="Directorate">Directorate</option>
              <option value="National">National</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Date Achieved *
            </label>
            <input
              type="date"
              value={form.achieved_date}
              onChange={(e) => setForm({ ...form, achieved_date: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Remarks / Details
            </label>
            <textarea
              rows={3}
              value={form.remarks}
              onChange={(e) => setForm({ ...form, remarks: e.target.value })}
              placeholder="Optional grade, medal position, or camp details..."
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setMode('list')}
              className="rounded-md border border-[#dce1d5] bg-white px-4 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer disabled:opacity-60 whitespace-nowrap"
            >
              {saving ? 'Saving...' : editingId ? 'Save Achievement' : 'Record Achievement'}
            </button>
          </div>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#2f3613]">
            Achievements, Certificates &amp; Awards ({filtered.length})
          </h2>
          <p className="text-xs text-[#5c6352]">
            Track NCC B/C certificates, camp medals, and community activities.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(undefined);
            setForm(emptyAchForm(cadets[0]?.id || 0));
            setFormError('');
            setMode('form');
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Record Achievement
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          ['', 'All'],
          ['Certificate', 'Certificates'],
          ['Award', 'Awards'],
          ['Activity', 'Activities'],
        ].map(([val, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setCategoryFilter(val)}
            className={`rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              categoryFilter === val
                ? 'border-[#4b5320] bg-[#4b5320] text-white'
                : 'border-[#dce1d5] bg-[#f7f9f3] text-[#5c6352] hover:text-[#2f3613]'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
              <th className="px-3 py-2.5">Cadet</th>
              <th className="px-3 py-2.5">Achievement Title</th>
              <th className="px-3 py-2.5">Category</th>
              <th className="px-3 py-2.5">Level</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                  No achievements recorded yet.
                </td>
              </tr>
            ) : (
              filtered.map((ach) => {
                const cadet = cadetMap.get(ach.cadet_id);
                return (
                  <tr key={ach.id} className="border-b border-[#eef0ea] last:border-b-0 hover:bg-[#fafbf8]">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[#1f2419]">
                        {cadet ? `${cadet.rank_title} ${cadet.full_name}` : 'Unknown Cadet'}
                      </div>
                      <div className="text-xs text-[#5c6352] font-mono-code">
                        {cadet?.regimental_no}
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-[#1f2419]">{ach.title}</div>
                      {ach.remarks && <div className="text-xs text-[#5c6352]">{ach.remarks}</div>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="inline-block rounded bg-[#eef2e6] px-2 py-0.5 text-xs font-semibold text-[#2f3613] whitespace-nowrap">
                        {ach.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{ach.level}</td>
                    <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap">
                      {formatDisplayDate(ach.achieved_date)}
                    </td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(ach)}
                          className="rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ach)}
                          className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Achievement"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteAchievement(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
};
