import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  Award,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import {
  AdminSession,
  PortalData,
  PageRoute,
  Cadet,
  EventRecord,
  AchievementRecord,
} from './types';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { CadetsView } from './components/CadetsView';
import { AttendanceView } from './components/AttendanceView';
import { EventsView } from './components/EventsView';
import { AchievementsView } from './components/AchievementsView';
import { XamppPackageView } from './components/XamppPackageView';

export default function App() {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [route, setRoute] = useState<PageRoute>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [portalData, setPortalData] = useState<PortalData>({
    cadets: [],
    attendance: [],
    events: [],
    achievements: [],
  });
  const [loadingData, setLoadingData] = useState(false);
  const [flash, setFlash] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [quickAddCadet, setQuickAddCadet] = useState(false);
  const [quickAddEvent, setQuickAddEvent] = useState(false);
  const [quickAddAchievement, setQuickAddAchievement] = useState(false);

  const showFlash = (type: 'success' | 'error', message: string) => {
    setFlash({ type, message });
  };

  useEffect(() => {
    if (!flash) return;
    const timer = setTimeout(() => setFlash(null), 4500);
    return () => clearTimeout(timer);
  }, [flash]);

  const fetchPortalData = useCallback(async () => {
    if (!admin) return;
    setLoadingData(true);
    try {
      const res = await fetch(`/api/portal?battalion=${encodeURIComponent(admin.battalion)}`);
      if (res.ok) {
        const json = (await res.json()) as PortalData;
        setPortalData(json);
      }
    } finally {
      setLoadingData(false);
    }
  }, [admin]);

  useEffect(() => {
    if (admin) {
      fetchPortalData();
    }
  }, [admin, fetchPortalData]);

  if (!admin) {
    return (
      <LoginView
        onLoginSuccess={(session) => {
          setRoute('dashboard');
          setAdmin(session);
        }}
      />
    );
  }

  const handleLogout = () => {
    setAdmin(null);
    setPortalData({ cadets: [], attendance: [], events: [], achievements: [] });
  };

  const handleSaveCadet = async (
    cadet: Omit<Cadet, 'id'>,
    editId?: number
  ): Promise<string | null> => {
    const url = editId ? `/api/cadets/${editId}` : '/api/cadets';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...cadet,
        wing: admin.battalion,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      return body.error || 'Failed to save cadet.';
    }
    await fetchPortalData();
    showFlash('success', editId ? 'Cadet details updated.' : 'New cadet enrolled successfully.');
    return null;
  };

  const handleDeleteCadet = async (id: number) => {
    await fetch(`/api/cadets/${id}`, { method: 'DELETE' });
    await fetchPortalData();
    showFlash('success', 'Cadet record deleted.');
  };

  const handleSaveAttendance = async (
    date: string,
    topic: string,
    entries: Array<{ cadet_id: number; status: 'Present' | 'Absent'; remarks: string }>
  ) => {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendance_date: date, parade_topic: topic, entries }),
    });
    if (res.ok) {
      await fetchPortalData();
      showFlash('success', 'Parade attendance saved.');
    } else {
      showFlash('error', 'Failed to save attendance.');
    }
  };

  const handleSaveEvent = async (
    event: Omit<EventRecord, 'id'>,
    editId?: number
  ): Promise<string | null> => {
    const url = editId ? `/api/events/${editId}` : '/api/events';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...event,
        wing: admin.battalion,
      }),
    });
    const body = await res.json();
    if (!res.ok) {
      return body.error || 'Failed to save event.';
    }
    await fetchPortalData();
    showFlash('success', editId ? 'Event updated.' : 'New event scheduled.');
    return null;
  };

  const handleDeleteEvent = async (id: number) => {
    await fetch(`/api/events/${id}`, { method: 'DELETE' });
    await fetchPortalData();
    showFlash('success', 'Event deleted.');
  };

  const handleSaveAchievement = async (
    ach: Omit<AchievementRecord, 'id'>,
    editId?: number
  ): Promise<string | null> => {
    const url = editId ? `/api/achievements/${editId}` : '/api/achievements';
    const method = editId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ach),
    });
    const body = await res.json();
    if (!res.ok) {
      return body.error || 'Failed to save achievement.';
    }
    await fetchPortalData();
    showFlash('success', editId ? 'Achievement updated.' : 'Achievement recorded.');
    return null;
  };

  const handleDeleteAchievement = async (id: number) => {
    await fetch(`/api/achievements/${id}`, { method: 'DELETE' });
    await fetchPortalData();
    showFlash('success', 'Achievement deleted.');
  };

  const navItems: Array<{ id: PageRoute; label: string; icon: React.ReactNode }> = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'cadets', label: 'Cadets', icon: <Users className="h-4 w-4" /> },
    { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck className="h-4 w-4" /> },
    { id: 'events', label: 'Camps & Events', icon: <CalendarDays className="h-4 w-4" /> },
    { id: 'achievements', label: 'Achievements', icon: <Award className="h-4 w-4" /> },
  ];

  const pageTitles: Record<PageRoute, string> = {
    dashboard: 'Dashboard',
    cadets: 'Cadets Directory',
    attendance: 'Parade Attendance',
    events: 'Camps & Events',
    achievements: 'Cadet Achievements',
    xampp: 'PHP & MySQL XAMPP Package',
  };

  const navigateTo = (next: PageRoute) => {
    setRoute(next);
    setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-[#f5f6f2] text-[#1f2419]">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[250px] flex-col bg-[#3d4619] text-white transition-transform duration-150 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-white/15 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-xs font-extrabold tracking-wider text-[#3d4619]">
              NCC
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">NCC Portal</div>
              <div className="text-[11px] text-white/75">{admin.battalion} Bn NCC</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded p-1 text-white/80 hover:bg-white/10 lg:hidden cursor-pointer"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main Navigation">
          {navItems.map((item) => {
            const active = route === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-md px-3.5 py-2.5 text-left text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-white font-semibold text-[#2f3613]'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/15 p-3">
          <div className="mb-2.5 rounded-md bg-black/15 px-3 py-2.5">
            <div className="text-[11px] text-white/65">NCC Motto</div>
            <div className="text-xs font-semibold text-white">Unity and Discipline</div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-md px-3.5 py-2 text-left text-sm font-medium text-red-200 hover:bg-red-700/30 hover:text-white transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#dce1d5] bg-white px-5 py-3.5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md border border-[#dce1d5] p-1.5 text-[#2f3613] hover:bg-[#f7f9f3] lg:hidden cursor-pointer"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-[#2f3613] whitespace-nowrap">
              {pageTitles[route]}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="hidden text-xs text-[#5c6352] md:inline">
              Signed in as{' '}
              <strong className="text-[#1f2419]">
                {admin.full_name} ({admin.battalion})
              </strong>
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-md border border-[#dce1d5] bg-white px-3 py-1.5 text-xs font-semibold text-[#2f3613] hover:bg-[#f7f9f3] cursor-pointer whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1240px] flex-1 p-5 sm:p-6">
          {flash && (
            <div
              className={`mb-4 flex items-center justify-between rounded-md border px-4 py-2.5 text-xs font-semibold ${
                flash.type === 'success'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              <span>{flash.message}</span>
              <button
                type="button"
                onClick={() => setFlash(null)}
                className="ml-3 text-base leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>
          )}

          {loadingData && portalData.cadets.length === 0 ? (
            <div className="rounded-lg border border-[#dce1d5] bg-white p-10 text-center text-sm text-[#5c6352]">
              Loading NCC portal records...
            </div>
          ) : (
            <>
              {route === 'dashboard' && (
                <DashboardView
                  data={portalData}
                  battalion={admin.battalion}
                  onNavigate={navigateTo}
                  onQuickAddCadet={() => {
                    setQuickAddCadet(true);
                    navigateTo('cadets');
                  }}
                  onQuickAddEvent={() => {
                    setQuickAddEvent(true);
                    navigateTo('events');
                  }}
                  onQuickAddAchievement={() => {
                    setQuickAddAchievement(true);
                    navigateTo('achievements');
                  }}
                />
              )}

              {route === 'cadets' && (
                <CadetsView
                  cadets={portalData.cadets}
                  attendance={portalData.attendance}
                  achievements={portalData.achievements}
                  battalion={admin.battalion}
                  initialAddMode={quickAddCadet}
                  onResetInitialMode={() => setQuickAddCadet(false)}
                  onSaveCadet={handleSaveCadet}
                  onDeleteCadet={handleDeleteCadet}
                />
              )}

              {route === 'attendance' && (
                <AttendanceView
                  cadets={portalData.cadets}
                  attendance={portalData.attendance}
                  onSaveAttendance={handleSaveAttendance}
                />
              )}

              {route === 'events' && (
                <EventsView
                  events={portalData.events}
                  battalion={admin.battalion}
                  initialAddMode={quickAddEvent}
                  onResetInitialMode={() => setQuickAddEvent(false)}
                  onSaveEvent={handleSaveEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              )}

              {route === 'achievements' && (
                <AchievementsView
                  cadets={portalData.cadets}
                  achievements={portalData.achievements}
                  initialAddMode={quickAddAchievement}
                  onResetInitialMode={() => setQuickAddAchievement(false)}
                  onSaveAchievement={handleSaveAchievement}
                  onDeleteAchievement={handleDeleteAchievement}
                />
              )}

              {route === 'xampp' && <XamppPackageView />}
            </>
          )}
        </main>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-[#dce1d5] bg-white px-6 py-3 text-xs text-[#5c6352]">
          <span>NCC Cadet Management Portal &middot; {admin.battalion} Bn NCC</span>
          <span>Unity and Discipline</span>
        </footer>
      </div>
    </div>
  );
}
