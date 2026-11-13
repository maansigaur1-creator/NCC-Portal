import React from 'react';
import { Plus, ClipboardCheck, CalendarPlus, Award } from 'lucide-react';
import { PortalData, PageRoute, Battalion, BATTALION_ANOS, formatDisplayDate } from '../types';

interface DashboardViewProps {
  data: PortalData;
  battalion: Battalion;
  onNavigate: (route: PageRoute) => void;
  onQuickAddCadet: () => void;
  onQuickAddEvent: () => void;
  onQuickAddAchievement: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  data,
  battalion,
  onNavigate,
  onQuickAddCadet,
  onQuickAddEvent,
  onQuickAddAchievement,
}) => {
  const activeCadets = data.cadets.filter((c) => c.status === 'Active');

  const sortedDates = Array.from(new Set(data.attendance.map((a) => a.attendance_date))).sort((a, b) =>
    b.localeCompare(a)
  );
  const latestDate = sortedDates[0] || '';
  const latestRecords = latestDate
    ? data.attendance.filter((a) => a.attendance_date === latestDate)
    : [];
  const presentCount = latestRecords.filter((r) => r.status === 'Present').length;
  const absentCount = latestRecords.filter((r) => r.status === 'Absent').length;

  const upcomingEvents = data.events
    .filter((e) => e.status === 'Upcoming' || e.status === 'Ongoing')
    .sort((a, b) => a.event_date.localeCompare(b.event_date));

  const recentAchievements = [...data.achievements]
    .sort((a, b) => b.achieved_date.localeCompare(a.achieved_date))
    .slice(0, 5);

  const cadetMap = new Map(data.cadets.map((c) => [c.id, c]));

  const year1Count = activeCadets.filter((c) => c.year_of_study === '1st Year').length;
  const year2Count = activeCadets.filter((c) => c.year_of_study === '2nd Year').length;
  const year3Count = activeCadets.filter((c) => c.year_of_study === '3rd Year').length;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="text-xs font-medium text-[#5c6352]">Total Cadets</div>
          <div className="mt-1.5 text-3xl font-bold text-[#3d4619] tabular-nums">
            {activeCadets.length}
          </div>
          <div className="mt-1 text-xs text-[#5c6352] tabular-nums">
            {battalion} Bn NCC
          </div>
        </div>

        <div className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="text-xs font-medium text-[#5c6352]">Present Cadets</div>
          <div className="mt-1.5 text-3xl font-bold text-[#3d4619] tabular-nums">
            {presentCount}
          </div>
          <div className="mt-1 text-xs text-[#5c6352] tabular-nums">
            {latestDate
              ? `Parade on ${formatDisplayDate(latestDate)} · ${absentCount} absent`
              : 'No attendance marked yet'}
          </div>
        </div>

        <div className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="text-xs font-medium text-[#5c6352]">Upcoming Events</div>
          <div className="mt-1.5 text-3xl font-bold text-[#3d4619] tabular-nums">
            {upcomingEvents.length}
          </div>
          <div className="mt-1 text-xs text-[#5c6352]">Camps, parades &amp; social drives</div>
        </div>

        <div className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="text-xs font-medium text-[#5c6352]">Recorded Achievements</div>
          <div className="mt-1.5 text-3xl font-bold text-[#3d4619] tabular-nums">
            {data.achievements.length}
          </div>
          <div className="mt-1 text-xs text-[#5c6352]">Certificates, awards &amp; activities</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-[#dce1d5] bg-white px-5 py-3.5 sm:col-span-2 lg:col-span-1">
          <div className="text-xs font-medium text-[#5c6352]">{battalion} Battalion ANO</div>
          <div className="mt-0.5 text-sm font-bold text-[#2f3613]">{BATTALION_ANOS[battalion]}</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#dce1d5] bg-white px-5 py-3.5">
          <div>
            <div className="text-xs font-medium text-[#5c6352]">1st Year Cadets</div>
            <div className="mt-0.5 text-xs text-[#5c6352]">Batch 2026-27</div>
          </div>
          <div className="text-xl font-bold text-[#3d4619] tabular-nums">{year1Count}</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#dce1d5] bg-white px-5 py-3.5">
          <div>
            <div className="text-xs font-medium text-[#5c6352]">2nd Year Cadets</div>
            <div className="mt-0.5 text-xs text-[#5c6352]">Batch 2025-26</div>
          </div>
          <div className="text-xl font-bold text-[#3d4619] tabular-nums">{year2Count}</div>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#dce1d5] bg-white px-5 py-3.5">
          <div>
            <div className="text-xs font-medium text-[#5c6352]">3rd Year Cadets</div>
            <div className="mt-0.5 text-xs text-[#5c6352]">Batch 2024-25</div>
          </div>
          <div className="text-xl font-bold text-[#3d4619] tabular-nums">{year3Count}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2.5">
        <button
          type="button"
          onClick={onQuickAddCadet}
          className="inline-flex items-center gap-1.5 rounded-md bg-[#4b5320] px-4 py-2 text-xs font-semibold text-white hover:bg-[#3d4619] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Add New Cadet
        </button>
        <button
          type="button"
          onClick={() => onNavigate('attendance')}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-4 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <ClipboardCheck className="h-3.5 w-3.5" />
          Mark Parade Attendance
        </button>
        <button
          type="button"
          onClick={onQuickAddEvent}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-4 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Schedule Event
        </button>
        <button
          type="button"
          onClick={onQuickAddAchievement}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#dce1d5] bg-white px-4 py-2 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <Award className="h-3.5 w-3.5" />
          Record Achievement
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="rounded-lg border border-[#dce1d5] bg-white p-5">
          <div className="mb-4 flex items-center justify-between border-b border-[#dce1d5] pb-3">
            <h2 className="text-base font-bold text-[#2f3613]">Upcoming Camps &amp; Events</h2>
            <button
              type="button"
              onClick={() => onNavigate('events')}
              className="text-xs font-semibold text-[#4b5320] hover:underline cursor-pointer whitespace-nowrap"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
                  <th className="px-3 py-2.5">Event Title</th>
                  <th className="px-3 py-2.5">Type</th>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                      No upcoming camps or events scheduled.
                    </td>
                  </tr>
                ) : (
                  upcomingEvents.slice(0, 5).map((ev) => (
                    <tr key={ev.id} className="border-b border-[#eef0ea] last:border-b-0 hover:bg-[#fafbf8]">
                      <td className="px-3 py-2.5">
                        <div className="font-semibold text-[#1f2419]">{ev.title}</div>
                        <div className="text-xs text-[#5c6352]">{ev.location}</div>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-[#1f2419] whitespace-nowrap">{ev.event_type}</td>
                      <td className="px-3 py-2.5 text-xs text-[#1f2419] tabular-nums whitespace-nowrap">
                        {formatDisplayDate(ev.event_date)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-xs font-semibold whitespace-nowrap ${
                            ev.status === 'Upcoming'
                              ? 'bg-emerald-50 text-emerald-800'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {ev.status}
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
          <div className="mb-4 flex items-center justify-between border-b border-[#dce1d5] pb-3">
            <h2 className="text-base font-bold text-[#2f3613]">Recent Cadet Achievements</h2>
            <button
              type="button"
              onClick={() => onNavigate('achievements')}
              className="text-xs font-semibold text-[#4b5320] hover:underline cursor-pointer whitespace-nowrap"
            >
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#dce1d5] bg-[#f7f9f3] text-xs font-semibold text-[#2f3613]">
                  <th className="px-3 py-2.5">Cadet</th>
                  <th className="px-3 py-2.5">Achievement</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentAchievements.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-8 text-center text-xs text-[#5c6352]">
                      No achievements recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentAchievements.map((ach) => {
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
                          <div className="text-[#1f2419]">{ach.title}</div>
                          <div className="text-xs text-[#5c6352]">{ach.level} Level</div>
                        </td>
                        <td className="px-3 py-2.5">
                          <span className="inline-block rounded bg-[#eef2e6] px-2 py-0.5 text-xs font-semibold text-[#2f3613] whitespace-nowrap">
                            {ach.category}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-[#1f2419] tabular-nums whitespace-nowrap">
                          {formatDisplayDate(ach.achieved_date)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
