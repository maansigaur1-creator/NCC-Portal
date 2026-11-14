import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = fs.existsSync(path.join(process.cwd(), '.data'))
  ? path.join(process.cwd(), '.data')
  : path.join(__dirname, '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'ncc_portal.json');

type Battalion = '2 Raj' | '10 Raj';

interface Cadet {
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

interface AttendanceRecord {
  id: number;
  cadet_id: number;
  attendance_date: string;
  parade_topic: string;
  status: 'Present' | 'Absent';
  remarks: string;
}

interface EventRecord {
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

interface AchievementRecord {
  id: number;
  cadet_id: number;
  title: string;
  category: 'Certificate' | 'Award' | 'Activity';
  level: 'Unit' | 'Group' | 'Directorate' | 'National';
  achieved_date: string;
  remarks: string;
}

interface PortalDatabase {
  cadets: Cadet[];
  attendance: AttendanceRecord[];
  events: EventRecord[];
  achievements: AchievementRecord[];
}

const SEED_PARADE_DATES = [
  '2026-07-22',
  '2026-07-24',
  '2026-07-29',
  '2026-07-31',
  '2026-08-05',
  '2026-08-07',
  '2026-08-14',
  '2026-08-15',
  '2026-08-19',
  '2026-08-21',
  '2026-10-09',
  '2026-10-14',
  '2026-10-16',
  '2026-10-21',
  '2026-10-23',
  '2026-10-28',
  '2026-10-30',
  '2026-11-01',
] as const;

const SEED_2ND_YEAR: Array<[string, string, string]> = [
  ['RJ2025SDRV6520563', 'Ravi Shankar Bairagi', 'AAAAAAAAAAAAAAAAAA'],
  ['RJ2025SDRV6520564', 'T.Sheethal', 'AAPPPPPPPPAPPPPPAP'],
  ['RJ2025SDRV6520565', 'Vinay Jonwal', 'AAAPAAAPAAAAAAAAAA'],
  ['RJ2025SDRV6520566', 'Donthagani Sriram', 'AAAAPAPAPAPPPAAAAA'],
  ['RJ2025SDRV6520568', 'Dushyant Singh', 'PAAAAAAAAAAAAAAAAA'],
  ['RJ2025SWRV6520569', 'Divyanshi Kaneria', 'AAAAAAAAAAAAAAAAAA'],
  ['RJ2025SDRV6520570', 'Piyush Dangi', 'AAAAAAAPAAAAAAAPPA'],
  ['RJ2025SWRV6520571', 'Monal Ameta', 'AAAAAAAAAAAAAAAAAA'],
  ['RJ2025SDRV6520574', 'Gautam Teli', 'AAAAAAAAAAAAAAAAAA'],
  ['RJ2025SWRV6520576', 'Yella Samanvitha Reddy', 'AAAAAAAAAAPAAAAAAA'],
  ['RJ2025SDRV6520577', 'Yash Yogi', 'AAAAPPPPPAAPPPPPPP'],
  ['RJ2025SDRV6520578', 'Raghunandan Sharma', 'AAAAAAAAAAAAAAAAAA'],
  ['RJ2025SWRV6520579', 'Bhavyanshi Paliwal', 'AAAAAAAPAAAAAAAAAA'],
  ['RJ2025SWRV6520580', 'Maansi Gaur', 'PAPAAAPPPPAAAAAPPP'],
  ['RJ2025SWRV6520582', 'P.Durga Prasana', 'AAAAAAAPPPAPPPPPPA'],
  ['RJ2025SDRV6520583', 'Harshal Kumar Sharma', 'AAPPAAAAAAAAAAAAAP'],
  ['RJ2025SDRV6520584', 'Karthik Ahir', 'PPPPPAPPAAPPPAPAPP'],
  ['RJ2025SDRV6520586', 'Ashish Jat', 'APPPAAPPAAAAAAAAAP'],
  ['RJ2025SWRV6520587', 'Ramya Pambala', 'AAPPAPPPAAAAAAAAAP'],
  ['RJ2025SDRV6520588', 'N.Kiran Kumar', 'AAAPPPPAPAPAAAAAAA'],
  ['RJ2025SWRV6521353', 'Khushbu Solanki', 'PAPPPAPPPPAPPPAPPP'],
];

const SEED_3RD_YEAR: Array<[string, string, string]> = [
  ['RJ2024SWRV6520812', 'Garima Rathore', 'PPAPPAPPAPAPPPPAPP'],
  ['RJ2024SWRV6520826', 'Khushi soni', 'AAPAPAPPAAAPPAAAPA'],
  ['RJ2024SDRV6520846', 'Joelrex Barrey', 'AAPPPAPPAAAPAPPAPA'],
  ['RJ2024SWRV6520857', 'Thanda Ishwarya', 'AAAAPPPPAPPAAAPAPA'],
  ['RJ2024SWRV652058', 'vishali debbeta', 'PPPPPPPPAAPAAAAAPA'],
  ['RJ2024SWRV6520816', 'R FALGUNI', 'AAPPAAPPAAAAAAAAAA'],
  ['RJ2024SDRV6520859', 'SHAIK SAMEER ALI', 'PPPPPPPPAAPAAAAAPA'],
  ['RJ2024SWRV6520856', 'P.bala vyashnavi', 'AAAPAPPPAAAAAAAAAA'],
  ['RJ2024SWRV6520844', 'M.Abhinaya', 'AAAPAPPPAAAAAAAAAA'],
  ['RJ2024SDRV6520848', 'Hukumsingh Rathore', 'AAPPAAPPAAPAPAPPPA'],
  ['RJ2024SWRV6520845', 'Harshita jain', 'PPPAAAAAAAAAAAAAAA'],
  ['RJ2024SDRV6520852', 'V. Sai Teja', 'AAPPPAPPAAAPAAAAAA'],
  ['RJ2024SWRV6520819', 'Jeet Dave', 'AAAAAAAAAAAAAAAAAP'],
];

function createInitialData(): PortalDatabase {
  const cadets: Cadet[] = [];
  const attendance: AttendanceRecord[] = [];
  let cadetId = 1;
  let attId = 1;

  for (const [regimental_no, full_name, pattern] of SEED_2ND_YEAR) {
    const cid = cadetId++;
    cadets.push({
      id: cid,
      regimental_no,
      full_name,
      rank_title: 'Cadet',
      wing: '2 Raj',
      unit_name: '2 Raj Bn NCC',
      college_branch: 'Batch 2025-26',
      year_of_study: '2nd Year',
      phone: '',
      email: '',
      blood_group: '',
      enrollment_date: '2025-07-01',
      status: 'Active',
    });
    for (let i = 0; i < SEED_PARADE_DATES.length; i++) {
      const attendance_date = SEED_PARADE_DATES[i];
      attendance.push({
        id: attId++,
        cadet_id: cid,
        attendance_date,
        parade_topic:
          attendance_date === '2026-08-15'
            ? 'Independence Day Parade'
            : '2 Raj 2nd Year Parade / Class',
        status: pattern[i] === 'P' ? 'Present' : 'Absent',
        remarks: '',
      });
    }
  }

  for (const [regimental_no, full_name, pattern] of SEED_3RD_YEAR) {
    const cid = cadetId++;
    cadets.push({
      id: cid,
      regimental_no,
      full_name,
      rank_title: 'Cadet',
      wing: '2 Raj',
      unit_name: '2 Raj Bn NCC',
      college_branch: 'Batch 2024-25',
      year_of_study: '3rd Year',
      phone: '',
      email: '',
      blood_group: '',
      enrollment_date: '2024-07-01',
      status: 'Active',
    });
    for (let i = 0; i < SEED_PARADE_DATES.length; i++) {
      const attendance_date = SEED_PARADE_DATES[i];
      attendance.push({
        id: attId++,
        cadet_id: cid,
        attendance_date,
        parade_topic:
          attendance_date === '2026-08-15'
            ? 'Independence Day Parade'
            : '2 Raj 3rd Year Parade / Class',
        status: pattern[i] === 'P' ? 'Present' : 'Absent',
        remarks: '',
      });
    }
  }

  return { cadets, attendance, events: [], achievements: [] };
}

function readDb(): PortalDatabase {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as PortalDatabase;
    }
  } catch (err) {
    console.error('Error reading DATA_FILE:', err);
  }
  return createInitialData();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const battalion = url.searchParams.get('battalion') || req.query?.battalion;

  const db = readDb();
  if (battalion === '2 Raj' || battalion === '10 Raj') {
    const cadets = db.cadets.filter((c) => c.wing === battalion);
    const cadetIds = new Set(cadets.map((c) => c.id));
    const attendance = db.attendance.filter((a) => cadetIds.has(a.cadet_id));
    const events = db.events.filter((e) => (e.wing || '2 Raj') === battalion);
    const achievements = db.achievements.filter((a) => cadetIds.has(a.cadet_id));
    return res.status(200).json({ cadets, attendance, events, achievements });
  }

  return res.status(200).json(db);
}
