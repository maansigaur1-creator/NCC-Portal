import React, { useState, useEffect } from 'react';
import { Plus, Search, ArrowLeft } from 'lucide-react';
import {
  Cadet,
  Battalion,
  AttendanceRecord,
  AchievementRecord,
  BATTALION_ANOS,
  formatDisplayDate,
} from '../types';
import { ConfirmModal } from './Modal';

interface CadetsViewProps {
  cadets: Cadet[];
  attendance: AttendanceRecord[];
  achievements: AchievementRecord[];
  battalion: Battalion;
  initialAddMode?: boolean;
  onResetInitialMode?: () => void;
  onSaveCadet: (cadet: Omit<Cadet, 'id'>, editId?: number) => Promise<string | null>;
  onDeleteCadet: (id: number) => Promise<void>;
}

const emptyCadetForm = (battalion: Battalion): Omit<Cadet, 'id'> => ({
  regimental_no: '',
  full_name: '',
  rank_title: 'Cadet',
  wing: battalion,
  unit_name: battalion === '10 Raj' ? '10 Raj Bn NCC' : '2 Raj Bn NCC',
  college_branch: 'Batch 2025-26',
  year_of_study: '2nd Year',
  phone: '',
  email: '',
  blood_group: '',
  enrollment_date: new Date().toISOString().slice(0, 10),
  status: 'Active',
});

export const CadetsView: React.FC<CadetsViewProps> = ({
  cadets,
  attendance,
  achievements,
  battalion,
  initialAddMode = false,
  onResetInitialMode,
  onSaveCadet,
  onDeleteCadet,
}) => {
  const [mode, setMode] = useState<'list' | 'form' | 'view'>(initialAddMode ? 'form' : 'list');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [viewingCadet, setViewingCadet] = useState<Cadet | null>(null);
  const [form, setForm] = useState<Omit<Cadet, 'id'>>(emptyCadetForm(battalion));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<Cadet | null>(null);

  useEffect(() => {
    if (initialAddMode) {
      setEditingId(undefined);
      setForm(emptyCadetForm(battalion));
      setFormError('');
      setMode('form');
      onResetInitialMode?.();
    }
  }, [initialAddMode, battalion, onResetInitialMode]);

  const filteredCadets = cadets.filter((c) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      c.regimental_no.toLowerCase().includes(q) ||
      c.full_name.toLowerCase().includes(q) ||
      c.college_branch.toLowerCase().includes(q);
    const matchesYear = !yearFilter || c.year_of_study === yearFilter;
    return matchesSearch && matchesYear;
  });

  const openAdd = () => {
    setEditingId(undefined);
    setForm(emptyCadetForm(battalion));
    setFormError('');
    setMode('form');
  };

  const openEdit = (cadet: Cadet) => {
    setEditingId(cadet.id);
    setForm({
      regimental_no: cadet.regimental_no,
      full_name: cadet.full_name,
      rank_title: cadet.rank_title,
      wing: battalion,
      unit_name: cadet.unit_name,
      college_branch: cadet.college_branch,
      year_of_study: cadet.year_of_study,
      phone: cadet.phone,
      email: cadet.email,
      blood_group: cadet.blood_group,
      enrollment_date: cadet.enrollment_date,
      status: cadet.status,
    });
    setFormError('');
    setMode('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.regimental_no.trim() || !form.full_name.trim() || !form.unit_name.trim()) {
      setFormError('Regimental number, full name, and unit name are required.');
      return;
    }
    if (form.phone.trim() !== '' && !/^[0-9]{10}$/.test(form.phone.trim())) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (form.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSaving(true);
    const err = await onSaveCadet({ ...form, wing: battalion }, editingId);
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
              {editingId ? 'Edit Cadet Profile' : `Enroll New ${battalion} Cadet`}
            </h2>
            <p className="text-xs text-[#5c6352]">
              {battalion} Bn NCC &middot; ANO: {BATTALION_ANOS[battalion]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode('list')}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Cadets
          </button>
        </div>

        {formError && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Regimental Number *
            </label>
            <input
              type="text"
              value={form.regimental_no}
              onChange={(e) => setForm({ ...form, regimental_no: e.target.value.toUpperCase() })}
              placeholder="e.g. RJ2026SDRV6520001"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Full Name *
            </label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              placeholder="Enter cadet full name"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">NCC Rank *</label>
            <select
              value={form.rank_title}
              onChange={(e) => setForm({ ...form, rank_title: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              {['Cadet', 'L/Cpl', 'Cpl', 'Sgt', 'CQMS', 'CSM', 'JUO', 'SUO'].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">NCC Battalion</label>
            <input
              type="text"
              value={`${battalion} (${BATTALION_ANOS[battalion]})`}
              readOnly
              className="w-full rounded-md border border-[#cbd2c2] bg-[#f7f9f3] px-3 py-2 text-sm text-[#5c6352]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              NCC Unit / Battalion *
            </label>
            <input
              type="text"
              value={form.unit_name}
              onChange={(e) => setForm({ ...form, unit_name: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Batch / Branch *
            </label>
            <input
              type="text"
              value={form.college_branch}
              onChange={(e) => setForm({ ...form, college_branch: e.target.value })}
              placeholder="e.g. Batch 2025-26"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Year of Study *
            </label>
            <select
              value={form.year_of_study}
              onChange={(e) =>
                setForm({ ...form, year_of_study: e.target.value as Cadet['year_of_study'] })
              }
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              {['2nd Year', '3rd Year', '4th Year'].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">Blood Group</label>
            <select
              value={form.blood_group}
              onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              <option value="">Not Specified</option>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bg) => (
                <option key={bg} value={bg}>
                  {bg}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Phone Number (10 digits)
            </label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Optional 10-digit mobile number"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Optional email address"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Enrollment Date *
            </label>
            <input
              type="date"
              value={form.enrollment_date}
              onChange={(e) => setForm({ ...form, enrollment_date: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
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
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Enroll Cadet'}
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (mode === 'view' && viewingCadet) {
    const cadetAtt = attendance
      .filter((a) => a.cadet_id === viewingCadet.id)
      .sort((a, b) => b.attendance_date.localeCompare(a.attendance_date));
    const presentParades = cadetAtt.filter((a) => a.status === 'Present').length;
    const cadetAch = achievements
      .filter((a) => a.cadet_id === viewingCadet.id)
      .sort((a, b) => b.achieved_date.localeCompare(a.achieved_date));

    return (
      <div className="space-y-5">
        <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
            <div>
              <h2 className="text-lg font-bold text-[#2f3613]">
                {viewingCadet.rank_title} {viewingCadet.full_name}
              </h2>
              <p className="text-xs text-[#5c6352] font-mono-code">
                Regimental No: {viewingCadet.regimental_no} · {viewingCadet.wing} Battalion
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openEdit(viewingCadet)}
                className="rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer whitespace-nowrap"
              >
                Edit Cadet
              </button>
              <button
                type="button"
                onClick={() => setMode('list')}
                className="rounded-md border border-[#dce1d5] bg-white px-4 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
              >
                Back to Directory
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Unit / Battalion', `${viewingCadet.unit_name} (${BATTALION_ANOS[viewingCadet.wing]})`],
              ['Batch & Year', `${viewingCadet.college_branch} (${viewingCadet.year_of_study})`],
              ['Phone Number', viewingCadet.phone || '—'],
              ['Email Address', viewingCadet.email || '—'],
              ['Blood Group', viewingCadet.blood_group || '—'],
              ['Enrollment Date', formatDisplayDate(viewingCadet.enrollment_date)],
              ['Parade Attendance', `${presentParades} / ${cadetAtt.length} parades present`],
            ].map(([label, val]) => (
              <div key={label} className="rounded-md border border-[#dce1d5] bg-[#f7f9f3] p-3">
                <div className="text-xs text-[#5c6352]">{label}</div>
                <div className="mt-1 text-sm font-semibold text-[#2f3613] tabular-nums break-words">
                  {val}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
            <h3 className="mb-3 border-b border-[#dce1d5] pb-2.5 text-sm font-bold text-[#2f3613]">
              Attendance History
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-[#2f3613]">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Parade Topic</th>
                    <th className="px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cadetAtt.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-3 py-6 text-center text-[#5c6352]">
                        No attendance records found.
                      </td>
                    </tr>
                  ) : (
                    cadetAtt.map((a) => (
                      <tr key={a.id} className="border-b border-[#eef0ea] last:border-b-0">
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                          {formatDisplayDate(a.attendance_date)}
                        </td>
                        <td className="px-3 py-2">{a.parade_topic}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-semibold ${
                              a.status === 'Present'
                                ? 'bg-emerald-50 text-emerald-800'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
            <h3 className="mb-3 border-b border-[#dce1d5] pb-2.5 text-sm font-bold text-[#2f3613]">
              Achievements &amp; Certificates
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-[#2f3613]">
                    <th className="px-3 py-2">Title</th>
                    <th className="px-3 py-2">Category</th>
                    <th className="px-3 py-2">Level</th>
                    <th className="px-3 py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {cadetAch.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-[#5c6352]">
                        No achievements recorded yet.
                      </td>
                    </tr>
                  ) : (
                    cadetAch.map((ach) => (
                      <tr key={ach.id} className="border-b border-[#eef0ea] last:border-b-0">
                        <td className="px-3 py-2 font-semibold">{ach.title}</td>
                        <td className="px-3 py-2">{ach.category}</td>
                        <td className="px-3 py-2">{ach.level}</td>
                        <td className="px-3 py-2 tabular-nums whitespace-nowrap">
                          {formatDisplayDate(ach.achieved_date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
        <div>
          <h2 className="text-base font-bold text-[#2f3613]">
            {battalion} Bn NCC Cadets ({filteredCadets.length})
          </h2>
          <p className="text-xs text-[#5c6352]">
            Manage regimental profiles, batches, and year-wise cadet records.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Cadet
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#5c6352]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Regimental No, Cadet Name, or Batch..."
            className="w-full rounded-md border border-[#cbd2c2] py-2 pl-9 pr-3 text-sm focus:border-[#4b5320] focus:outline-none"
          />
        </div>
        <select
          aria-label="Filter by Year"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
        >
          <option value="">All Years</option>
          <option value="2nd Year">2nd Year (Batch 2025-26)</option>
          <option value="3rd Year">3rd Year (Batch 2024-25)</option>
          <option value="4th Year">4th Year</option>
        </select>
        {(search || yearFilter) && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setYearFilter('');
            }}
            className="rounded-md border border-[#dce1d5] bg-white px-3 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
          >
            Reset
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
              <th className="px-3 py-2.5">Regimental No.</th>
              <th className="px-3 py-2.5">Cadet Name</th>
              <th className="px-3 py-2.5">Rank &amp; Battalion</th>
              <th className="px-3 py-2.5">Batch &amp; Year</th>
              <th className="px-3 py-2.5">Phone</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCadets.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                  No cadet records found for {battalion} Bn NCC.
                </td>
              </tr>
            ) : (
              filteredCadets.map((cadet) => (
                <tr key={cadet.id} className="border-b border-[#eef0ea] last:border-b-0 hover:bg-[#fafbf8]">
                  <td className="px-3 py-2.5 font-mono-code text-xs whitespace-nowrap">
                    {cadet.regimental_no}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[#1f2419]">{cadet.full_name}</div>
                    <div className="text-xs text-[#5c6352]">{cadet.unit_name}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                    <div>
                      <span>{cadet.rank_title}</span>
                      <span className="mx-1.5 text-[#9ca3af]">&middot;</span>
                      <span className="font-semibold text-[#2f3613]">{cadet.wing}</span>
                    </div>
                    <div className="text-[11px] text-[#5c6352]">{BATTALION_ANOS[cadet.wing]}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    {cadet.college_branch} ({cadet.year_of_study})
                  </td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap">
                    {cadet.phone || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setViewingCadet(cadet);
                          setMode('view');
                        }}
                        className="rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(cadet)}
                        className="rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(cadet)}
                        className="rounded bg-red-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-700 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Cadet Record"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? Their attendance and achievement records will also be removed.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteCadet(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
};
