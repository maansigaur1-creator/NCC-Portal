export type Battalion = '2 Raj' | '10 Raj';

export interface AdminSession {
  username: string;
  full_name: string;
  battalion: Battalion;
}

export interface Cadet {
  id: number;
  regimental_no: string;
  full_name: string;
  rank_title: string;
  wing: Battalion;
  unit_name: string;
  college_branch: string;
  year_of_study: '1st Year' | '2nd Year' | '3rd Year' | '4th Year';
  phone: string;
  email: string;
  blood_group: string;
  enrollment_date: string;
  status: 'Active' | 'Alumni';
}

export const BATTALION_ANOS: Record<Battalion, string> = {
  '2 Raj': 'Lt. Praveen Singh Jhala',
  '10 Raj': 'Lt. DS Chouhan',
};

export interface AttendanceRecord {
  id: number;
  cadet_id: number;
  attendance_date: string;
  parade_topic: string;
  status: 'Present' | 'Absent';
  remarks: string;
}

export interface EventRecord {
  id: number;
  title: string;
  event_type: 'Camp' | 'Parade' | 'Workshop' | 'Social Drive' | 'Competition';
  event_date: string;
  location: string;
  organizer: string;
  wing: Battalion;
  description: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

export interface AchievementRecord {
  id: number;
  cadet_id: number;
  title: string;
  category: 'Certificate' | 'Award' | 'Activity';
  level: 'Unit' | 'Group' | 'Directorate' | 'National';
  achieved_date: string;
  remarks: string;
}

export interface PortalData {
  cadets: Cadet[];
  attendance: AttendanceRecord[];
  events: EventRecord[];
  achievements: AchievementRecord[];
}

export type PageRoute =
  | 'dashboard'
  | 'cadets'
  | 'attendance'
  | 'events'
  | 'achievements'
  | 'xampp';

export function formatDisplayDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const parsed = new Date(dateStr + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
