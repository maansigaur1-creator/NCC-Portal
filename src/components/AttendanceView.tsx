import React, { useState, useEffect, useMemo } from 'react';
import { Cadet, AttendanceRecord, formatDisplayDate } from '../types';

interface AttendanceViewProps {
  cadets: Cadet[];
  attendance: AttendanceRecord[];
  onSaveAttendance: (
    date: string,
    topic: string,
    entries: Array<{ cadet_id: number; status: 'Present' | 'Absent'; remarks: string }>
  ) => Promise<void>;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  cadets,
  attendance,
  onSaveAttendance,
}) => {
  const [markYearFilter, setMarkYearFilter] = useState<string>('');
  const [historyYearFilter, setHistoryYearFilter] = useState<string>('');

  const activeCadets = useMemo(
    () =>
      cadets
        .filter((c) => c.status === 'Active')
        .filter((c) => !markYearFilter || c.year_of_study === markYearFilter),
    [cadets, markYearFilter]
  );

  const today = new Date().toISOString().slice(0, 10);

  const recordedDatesSummary = useMemo(() => {
    const cadetIdsInYear = markYearFilter
      ? new Set(cadets.filter((c) => c.year_of_study === markYearFilter).map((c) => c.id))
      : null;

    const map = new Map<string, { present: number; absent: number }>();
    for (const row of attendance) {
      if (cadetIdsInYear && !cadetIdsInYear.has(row.cadet_id)) continue;
      const entry = map.get(row.attendance_date) || { present: 0, absent: 0 };
      if (row.status === 'Present') {
        entry.present += 1;
      } else {
        entry.absent += 1;
      }
      map.set(row.attendance_date, entry);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, counts]) => ({ date, ...counts }));
  }, [attendance, cadets, markYearFilter]);

  const latestRecordedDate = recordedDatesSummary[0]?.date || today;

  const [selectedDate, setSelectedDate] = useState(latestRecordedDate);
  const [hasPickedDate, setHasPickedDate] = useState(false);
  const [paradeTopic, setParadeTopic] = useState('Parade / Class');
  const [statuses, setStatuses] = useState<Record<number, 'Present' | 'Absent'>>({});
  const [remarks, setRemarks] = useState<Record<number, string>>({});
  const [historyDateFilter, setHistoryDateFilter] = useState('');
  const [historyCadetFilter, setHistoryCadetFilter] = useState('');
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!hasPickedDate && recordedDatesSummary.length > 0) {
      setSelectedDate(recordedDatesSummary[0].date);
    }
  }, [hasPickedDate, recordedDatesSummary]);

  useEffect(() => {
    const forDate = attendance.filter((a) => a.attendance_date === selectedDate);
    const nextStatuses: Record<number, 'Present' | 'Absent'> = {};
    const nextRemarks: Record<number, string> = {};
    let detectedTopic =
      selectedDate === '2026-08-15'
        ? 'Independence Day Parade'
        : markYearFilter
        ? `2 Raj ${markYearFilter} Parade / Class`
        : '2 Raj Parade / Class';

    for (const c of activeCadets) {
      const existing = forDate.find((r) => r.cadet_id === c.id);
      nextStatuses[c.id] = existing ? existing.status : 'Present';
      nextRemarks[c.id] = existing ? existing.remarks : '';
      if (existing?.parade_topic) {
        detectedTopic = existing.parade_topic;
      }
    }
    setStatuses(nextStatuses);
    setRemarks(nextRemarks);
    setParadeTopic(detectedTopic);
  }, [selectedDate, attendance, activeCadets, markYearFilter]);

  const markAll = (val: 'Present' | 'Absent') => {
    const updated: Record<number, 'Present' | 'Absent'> = {};
    for (const c of activeCadets) {
      updated[c.id] = val;
    }
    setStatuses(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCadets.length === 0) return;
    setSaving(true);
    const entries = activeCadets.map((c) => ({
      cadet_id: c.id,
      status: statuses[c.id] || 'Present',
      remarks: remarks[c.id] || '',
    }));
    await onSaveAttendance(selectedDate, paradeTopic, entries);
    setSaving(false);
  };

  const selectedPresentCount = activeCadets.filter(
    (c) => (statuses[c.id] || 'Present') === 'Present'
  ).length;
  const selectedAbsentCount = activeCadets.length - selectedPresentCount;

  const cadetMap = useMemo(() => new Map(cadets.map((c) => [c.id, c])), [cadets]);
  const sortedCadetsForFilter = useMemo(
    () =>
      [...cadets]
        .filter((c) => !historyYearFilter || c.year_of_study === historyYearFilter)
        .sort((a, b) => a.regimental_no.localeCompare(b.regimental_no)),
    [cadets, historyYearFilter]
  );

  const historyRows = useMemo(() => {
    const selectedCadetId = historyCadetFilter ? Number(historyCadetFilter) : 0;
    return attendance
      .filter((a) => !historyDateFilter || a.attendance_date === historyDateFilter)
      .filter((a) => !selectedCadetId || a.cadet_id === selectedCadetId)
      .filter((a) => {
        if (!historyYearFilter) return true;
        return cadetMap.get(a.cadet_id)?.year_of_study === historyYearFilter;
      })
      .sort((a, b) => {
        const dateCmp = b.attendance_date.localeCompare(a.attendance_date);
        if (dateCmp !== 0) return dateCmp;
        const regA = cadetMap.get(a.cadet_id)?.regimental_no || '';
        const regB = cadetMap.get(b.cadet_id)?.regimental_no || '';
        return regA.localeCompare(regB);
      });
  }, [attendance, historyDateFilter, historyCadetFilter, historyYearFilter, cadetMap]);

  const isFiltered = Boolean(historyDateFilter || historyCadetFilter || historyYearFilter);
  const displayedHistoryRows =
    isFiltered || showAllHistory ? historyRows : historyRows.slice(0, 50);

  return (
    <div className="space-y-5">
      <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#2f3613]">Mark Parade Attendance</h2>
            <p className="text-xs text-[#5c6352]">
              Select a year/batch and parade date, mark cadets Present or Absent, and save records.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter Cadets by Year"
              value={markYearFilter}
              onChange={(e) => setMarkYearFilter(e.target.value)}
              className="rounded-md border border-[#cbd2c2] bg-white px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
            >
              <option value="">All Years ({cadets.filter((c) => c.status === 'Active').length})</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            {recordedDatesSummary.length > 0 && (
              <select
                aria-label="Recorded Parade Dates"
                value={
                  recordedDatesSummary.some((d) => d.date === selectedDate)
                    ? selectedDate
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) {
                    setHasPickedDate(true);
                    setSelectedDate(e.target.value);
                  }
                }}
                className="rounded-md border border-[#cbd2c2] bg-white px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
              >
                <option value="">Jump to recorded date...</option>
                {recordedDatesSummary.map((d) => (
                  <option key={d.date} value={d.date}>
                    {formatDisplayDate(d.date)} ({d.present}P / {d.absent}A)
                  </option>
                ))}
              </select>
            )}
            <label htmlFor="att-date" className="text-xs font-semibold text-[#1f2419]">
              Parade Date:
            </label>
            <input
              id="att-date"
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setHasPickedDate(true);
                setSelectedDate(e.target.value);
              }}
              className="rounded-md border border-[#cbd2c2] px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
            />
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4 rounded-md border border-[#dce1d5] bg-[#f7f9f3] p-3.5">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-semibold text-[#1f2419] mb-1">
                Parade / Training Topic
              </label>
              <input
                type="text"
                value={paradeTopic}
                onChange={(e) => setParadeTopic(e.target.value)}
                className="w-full rounded-md border border-[#cbd2c2] bg-white px-3 py-1.5 text-sm focus:border-[#4b5320] focus:outline-none"
                required
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-white px-2.5 py-1.5 text-xs font-semibold text-[#2f3613] border border-[#dce1d5] tabular-nums">
                {selectedPresentCount} Present · {selectedAbsentCount} Absent
              </span>
              <button
                type="button"
                onClick={() => markAll('Present')}
                className="rounded-md border border-[#dce1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f3613] hover:bg-[#eef2e6] cursor-pointer whitespace-nowrap"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={() => markAll('Absent')}
                className="rounded-md border border-[#dce1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f3613] hover:bg-[#eef2e6] cursor-pointer whitespace-nowrap"
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
                  <th className="px-3 py-2.5">Regimental No.</th>
                  <th className="px-3 py-2.5">Cadet</th>
                  <th className="px-3 py-2.5">Year / Batch</th>
                  <th className="px-3 py-2.5">Attendance Status</th>
                  <th className="px-3 py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {activeCadets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                      No active cadets found for the selected filter.
                    </td>
                  </tr>
                ) : (
                  activeCadets.map((c) => {
                    const st = statuses[c.id] || 'Present';
                    return (
                      <tr key={c.id} className="border-b border-[#eef0ea] last:border-b-0">
                        <td className="px-3 py-2.5 font-mono-code text-xs whitespace-nowrap">
                          {c.regimental_no}
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-[#1f2419]">
                          {c.rank_title} {c.full_name}
                        </td>
                        <td className="px-3 py-2.5 text-xs whitespace-nowrap">
                          {c.year_of_study} · {c.college_branch}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="inline-flex gap-2">
                            <label className="inline-flex items-center gap-1.5 rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold cursor-pointer">
                              <input
                                type="radio"
                                name={`att-${c.id}`}
                                checked={st === 'Present'}
                                onChange={() => setStatuses({ ...statuses, [c.id]: 'Present' })}
                                className="accent-[#4b5320]"
                              />
                              Present
                            </label>
                            <label className="inline-flex items-center gap-1.5 rounded border border-[#dce1d5] bg-white px-2.5 py-1 text-xs font-semibold cursor-pointer">
                              <input
                                type="radio"
                                name={`att-${c.id}`}
                                checked={st === 'Absent'}
                                onChange={() => setStatuses({ ...statuses, [c.id]: 'Absent' })}
                                className="accent-red-600"
                              />
                              Absent
                            </label>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <input
                            type="text"
                            value={remarks[c.id] || ''}
                            onChange={(e) => setRemarks({ ...remarks, [c.id]: e.target.value })}
                            placeholder="Optional remark"
                            className="w-full min-w-[160px] rounded border border-[#cbd2c2] px-2.5 py-1 text-xs focus:border-[#4b5320] focus:outline-none"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {activeCadets.length > 0 && (
            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                {saving ? 'Saving...' : `Save Attendance for ${formatDisplayDate(selectedDate)}`}
              </button>
            </div>
          )}
        </form>
      </section>

      <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 border-b border-[#dce1d5] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#2f3613]">
              Attendance Records ({historyRows.length})
            </h2>
            <p className="text-xs text-[#5c6352]">
              Filter parade attendance history by year, parade/class date, or cadet.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter History by Year"
              value={historyYearFilter}
              onChange={(e) => {
                setHistoryYearFilter(e.target.value);
                setHistoryCadetFilter('');
              }}
              className="rounded-md border border-[#cbd2c2] bg-white px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
            >
              <option value="">All Years</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
            </select>
            <select
              aria-label="Filter by Parade Date"
              value={historyDateFilter}
              onChange={(e) => setHistoryDateFilter(e.target.value)}
              className="rounded-md border border-[#cbd2c2] bg-white px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
            >
              <option value="">All Parade Dates</option>
              {recordedDatesSummary.map((d) => (
                <option key={d.date} value={d.date}>
                  {formatDisplayDate(d.date)} ({d.present}P / {d.absent}A)
                </option>
              ))}
            </select>
            <select
              aria-label="Filter by Cadet"
              value={historyCadetFilter}
              onChange={(e) => setHistoryCadetFilter(e.target.value)}
              className="rounded-md border border-[#cbd2c2] bg-white px-2.5 py-1.5 text-xs focus:border-[#4b5320] focus:outline-none"
            >
              <option value="">All Cadets ({sortedCadetsForFilter.length})</option>
              {sortedCadetsForFilter.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name} ({c.regimental_no})
                </option>
              ))}
            </select>
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setHistoryYearFilter('');
                  setHistoryDateFilter('');
                  setHistoryCadetFilter('');
                }}
                className="rounded-md border border-[#dce1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
                <th className="px-3 py-2.5">Date</th>
                <th className="px-3 py-2.5">Regimental No.</th>
                <th className="px-3 py-2.5">Cadet</th>
                <th className="px-3 py-2.5">Year</th>
                <th className="px-3 py-2.5">Parade Topic</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {displayedHistoryRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                    No attendance records found.
                  </td>
                </tr>
              ) : (
                displayedHistoryRows.map((row) => {
                  const cadet = cadetMap.get(row.cadet_id);
                  return (
                    <tr key={row.id} className="border-b border-[#eef0ea] last:border-b-0 hover:bg-[#fafbf8]">
                      <td className="px-3 py-2 text-xs tabular-nums whitespace-nowrap">
                        {formatDisplayDate(row.attendance_date)}
                      </td>
                      <td className="px-3 py-2 font-mono-code text-xs whitespace-nowrap">
                        {cadet?.regimental_no || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs font-semibold text-[#1f2419]">
                        {cadet ? `${cadet.rank_title} ${cadet.full_name}` : 'Unknown'}
                      </td>
                      <td className="px-3 py-2 text-xs whitespace-nowrap">
                        {cadet?.year_of_study || '—'}
                      </td>
                      <td className="px-3 py-2 text-xs">{row.parade_topic}</td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            row.status === 'Present'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-red-50 text-red-700'
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-xs text-[#5c6352]">{row.remarks || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {!isFiltered && historyRows.length > 50 && (
          <div className="mt-3 flex items-center justify-between border-t border-[#eef0ea] pt-3 text-xs text-[#5c6352]">
            <span>
              Showing {displayedHistoryRows.length} of {historyRows.length} records
            </span>
            <button
              type="button"
              onClick={() => setShowAllHistory((prev) => !prev)}
              className="rounded-md border border-[#dce1d5] bg-white px-3 py-1.5 font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer"
            >
              {showAllHistory ? 'Show Fewer' : `Show All ${historyRows.length} Records`}
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
