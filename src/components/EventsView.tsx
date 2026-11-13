import React, { useState, useEffect } from 'react';
import { Plus, ArrowLeft } from 'lucide-react';
import { EventRecord, Battalion, formatDisplayDate } from '../types';
import { ConfirmModal } from './Modal';

interface EventsViewProps {
  events: EventRecord[];
  battalion: Battalion;
  initialAddMode?: boolean;
  onResetInitialMode?: () => void;
  onSaveEvent: (event: Omit<EventRecord, 'id'>, editId?: number) => Promise<string | null>;
  onDeleteEvent: (id: number) => Promise<void>;
}

const emptyEventForm = (battalion: Battalion): Omit<EventRecord, 'id'> => ({
  title: '',
  event_type: 'Camp',
  event_date: new Date().toISOString().slice(0, 10),
  location: '',
  organizer: battalion === '10 Raj' ? '10 Raj Bn NCC' : '2 Raj Bn NCC',
  wing: battalion,
  description: '',
  status: 'Upcoming',
});

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  battalion,
  initialAddMode = false,
  onResetInitialMode,
  onSaveEvent,
  onDeleteEvent,
}) => {
  const [mode, setMode] = useState<'list' | 'form'>(initialAddMode ? 'form' : 'list');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [form, setForm] = useState<Omit<EventRecord, 'id'>>(emptyEventForm(battalion));
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<EventRecord | null>(null);

  useEffect(() => {
    if (initialAddMode) {
      setEditingId(undefined);
      setForm(emptyEventForm(battalion));
      setFormError('');
      setMode('form');
      onResetInitialMode?.();
    }
  }, [initialAddMode, battalion, onResetInitialMode]);

  const filteredEvents = events
    .filter((ev) => !statusFilter || ev.status === statusFilter)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  const openEdit = (ev: EventRecord) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      event_type: ev.event_type,
      event_date: ev.event_date,
      location: ev.location,
      organizer: ev.organizer,
      wing: ev.wing || battalion,
      description: ev.description,
      status: ev.status,
    });
    setFormError('');
    setMode('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.title.trim() || !form.location.trim() || !form.description.trim()) {
      setFormError('Title, location, and description are required.');
      return;
    }
    setSaving(true);
    const err = await onSaveEvent(form, editingId);
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
              {editingId ? 'Edit Camp or Event' : 'Schedule New Camp or Event'}
            </h2>
            <p className="text-xs text-[#5c6352]">
              Provide details for the NCC training camp, parade, or activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMode('list')}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-3.5 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Events
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
              Event / Camp Title *
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Combined Annual Training Camp (CATC)"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">Event Type *</label>
            <select
              value={form.event_type}
              onChange={(e) =>
                setForm({ ...form, event_type: e.target.value as EventRecord['event_type'] })
              }
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              {['Camp', 'Parade', 'Workshop', 'Social Drive', 'Competition'].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">Event Date *</label>
            <input
              type="date"
              value={form.event_date}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Location / Venue *
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. College Parade Ground"
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Organizing Unit *
            </label>
            <input
              type="text"
              value={form.organizer}
              onChange={(e) => setForm({ ...form, organizer: e.target.value })}
              className="w-full rounded-md border border-[#cbd2c2] px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">Status *</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as EventRecord['status'] })
              }
              className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-2 text-sm focus:border-[#4b5320] focus:outline-none"
            >
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-[#1f2419] mb-1.5">
              Description &amp; Instructions *
            </label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief summary of training objectives, reporting time, and dress code..."
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
              {saving ? 'Saving...' : editingId ? 'Save Event' : 'Create Event'}
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
            NCC Camps &amp; Events ({filteredEvents.length})
          </h2>
          <p className="text-xs text-[#5c6352]">
            Schedule annual training camps, parades, workshops, and social drives.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingId(undefined);
            setForm(emptyEventForm(battalion));
            setFormError('');
            setMode('form');
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add Event
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {[
          ['', 'All Events'],
          ['Upcoming', 'Upcoming'],
          ['Ongoing', 'Ongoing'],
          ['Completed', 'Completed'],
        ].map(([val, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setStatusFilter(val)}
            className={`rounded-md border px-3.5 py-1.5 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              statusFilter === val
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
              <th className="px-3 py-2.5">Event Title</th>
              <th className="px-3 py-2.5">Type</th>
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">Location &amp; Organizer</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                  No camps or events found.
                </td>
              </tr>
            ) : (
              filteredEvents.map((ev) => (
                <tr key={ev.id} className="border-b border-[#eef0ea] last:border-b-0 hover:bg-[#fafbf8]">
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[#1f2419]">{ev.title}</div>
                    <div className="text-xs text-[#5c6352] max-w-md">{ev.description}</div>
                  </td>
                  <td className="px-3 py-2.5 text-xs whitespace-nowrap">{ev.event_type}</td>
                  <td className="px-3 py-2.5 text-xs tabular-nums whitespace-nowrap">
                    {formatDisplayDate(ev.event_date)}
                  </td>
                  <td className="px-3 py-2.5 text-xs">
                    <div className="text-[#1f2419]">{ev.location}</div>
                    <div className="text-[#5c6352]">{ev.organizer}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                        ev.status === 'Upcoming'
                          ? 'bg-emerald-50 text-emerald-800'
                          : ev.status === 'Ongoing'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-[#eef2e6] text-[#2f3613]'
                      }`}
                    >
                      {ev.status}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(ev)}
                        className="rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(ev)}
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
        title="Delete Event"
        message={`Are you sure you want to delete "${deleteTarget?.title}"?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await onDeleteEvent(deleteTarget.id);
            setDeleteTarget(null);
          }
        }}
      />
    </section>
  );
};
