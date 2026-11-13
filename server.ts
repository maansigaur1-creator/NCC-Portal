import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, '.data');
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

function isoOffsetDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

const SEED_1ST_YEAR_DATES = [
  '2026-10-14',
  '2026-10-16',
  '2026-10-21',
  '2026-10-23',
  '2026-10-28',
  '2026-10-30',
  '2026-11-01',
] as const;

const SEED_1ST_YEAR: Array<[string, string, string]> = [
  ['2RAJ26-01', 'Rohit Hada', 'PAAAPPP'],
  ['2RAJ26-02', 'Divyansh Suthar', 'PAAAPAA'],
  ['2RAJ26-03', 'Lokendra Singh', 'PPPAPPP'],
  ['2RAJ26-04', 'P. Randeep', 'AAAAAAA'],
  ['2RAJ26-05', 'Aditya Singh Shekhawat', 'PAPPPAP'],
  ['2RAJ26-06', 'Vinayak Gujar', 'PPPPPAA'],
  ['2RAJ26-07', 'Prakhar Sharma', 'PAPAPAA'],
  ['2RAJ26-08', 'Keshav Pratap Singh Rathore', 'AAAAPAA'],
  ['2RAJ26-09', 'Surya Pratap Singh', 'PAPAPPP'],
  ['2RAJ26-10', 'LAKSHYARAJ SINGH SISODIYA', 'AAAAAAA'],
  ['2RAJ26-11', 'KRITIK', 'PAAAAAA'],
  ['2RAJ26-12', 'SIDDHARTH SAHU', 'APAPAAA'],
  ['2RAJ26-13', 'ADITYA RAJ SINGH RATHORE', 'AAPPAAA'],
  ['2RAJ26-14', 'LAKHAN SUTHAR', 'PAPAAAA'],
  ['2RAJ26-15', 'DEV NARAYAN JAT', 'PAAAPAA'],
  ['2RAJ26-16', 'SHUBHAM DHAKER', 'AAPPAAA'],
  ['2RAJ26-17', 'LUCKY SEN', 'PAAAPAA'],
  ['2RAJ26-18', 'TANMAY SINGH JHALA', 'PAAAPAA'],
  ['2RAJ26-19', 'KARAN MENARIYA', 'PAAAPAA'],
  ['2RAJ26-20', 'G. CHARAN TEJA SPHOORTHI', 'PAAAPAA'],
  ['2RAJ26-21', 'AFZEL AHMAD ANSARI', 'PAPAPAA'],
  ['2RAJ26-22', 'NIKHIL SHEKHAWAT', 'PAPAPPA'],
  ['2RAJ26-23', 'DAKSHRAJ SINGH SHAKTAWAT', 'AAAAAAA'],
  ['2RAJ26-24', 'PAWAN SARGARA', 'AAAAAAA'],
  ['2RAJ26-25', 'ANKUR CHAUHAN', 'PAPAAAA'],
  ['2RAJ26-26', 'SWAYAM CHHIPA', 'AAPAAPA'],
  ['2RAJ26-27', 'Ashok Kumawat', 'PAAAAAA'],
  ['2RAJ26-28', 'Manvendra Shrimali', 'PAAAAAP'],
  ['2RAJ26-29', 'Lakshya Prajapat', 'AAAAPPA'],
  ['2RAJ26-30', 'Bhanu Pratap Singh Chouhan', 'AAAAAAA'],
  ['2RAJ26-31', 'Prakash Kumar', 'AAAAAAA'],
  ['2RAJ26-32', 'Charu Kunwar Rao', 'AAAPAAA'],
  ['2RAJ26-33', 'PURTI JAIN', 'PAAPAPP'],
  ['2RAJ26-34', 'ARUSHI AMETA', 'AAAAAAP'],
  ['2RAJ26-35', 'SONAKSHI AHEER', 'AAAAAPA'],
  ['2RAJ26-36', 'SHIVRANJANI PIPLANI', 'AAAPAAP'],
  ['2RAJ26-37', 'JIYA BHAVSAR', 'AAAAAAA'],
  ['2RAJ26-38', 'ANGEL SONI', 'PAPPAPP'],
  ['2RAJ26-39', 'JIGYASA PALIWAL', 'AAAAAAA'],
  ['2RAJ26-40', 'REETIKA MEHTA', 'AAAPAAP'],
  ['2RAJ26-41', 'SNEHA JAISWAL', 'PAAAAPA'],
  ['2RAJ26-42', 'MINAL JOSHI', 'AAAAAPP'],
  ['2RAJ26-43', 'UTKANSHA PALIWAL', 'AAAAAPA'],
  ['2RAJ26-44', 'ASHLESHA SONI', 'PAPPAPP'],
];

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
  ['RJ2024SWRV6520857', 'Thanda Ishwarya', 'AAAAPPPPAPPA' + 'AAPAPA'],
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

  // 1st Year (Batch 2026-27)
  for (const [regimental_no, full_name, pattern] of SEED_1ST_YEAR) {
    const cid = cadetId++;
    cadets.push({
      id: cid,
      regimental_no,
      full_name,
      rank_title: 'Cadet',
      wing: '2 Raj',
      unit_name: '2 Raj Bn NCC',
      college_branch: 'Batch 2026-27',
      year_of_study: '1st Year',
      phone: '',
      email: '',
      blood_group: '',
      enrollment_date: '2026-07-01',
      status: 'Active',
    });
    for (let i = 0; i < SEED_1ST_YEAR_DATES.length; i++) {
      attendance.push({
        id: attId++,
        cadet_id: cid,
        attendance_date: SEED_1ST_YEAR_DATES[i],
        parade_topic: '2 Raj 1st Year Parade / Class',
        status: pattern[i] === 'P' ? 'Present' : 'Absent',
        remarks: '',
      });
    }
  }

  // 2nd Year (Batch 2025-26)
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

  // 3rd Year (Batch 2024-25)
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

  return {
    cadets,
    attendance,
    events: [],
    achievements: [],
  };
}

function readDb(): PortalDatabase {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createInitialData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as PortalDatabase;
}

function writeDb(db: PortalDatabase): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
}

function nextId(items: Array<{ id: number }>): number {
  return items.length === 0 ? 1 : Math.max(...items.map((x) => x.id)) + 1;
}

const ANO_ACCOUNTS: Record<string, { full_name: string; battalion: Battalion; password: string }> = {
  '2raj': {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  ano2raj: {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  admin: {
    full_name: 'Lt. Praveen Singh Jhala',
    battalion: '2 Raj',
    password: 'admin123',
  },
  '10raj': {
    full_name: 'Lt. DS Chouhan',
    battalion: '10 Raj',
    password: 'admin123',
  },
  ano10raj: {
    full_name: 'Lt. DS Chouhan',
    battalion: '10 Raj',
    password: 'admin123',
  },
};

async function startServer() {
  const app = express();
  app.use(express.json());

  // Separate ANO Login Endpoint (2 Raj and 10 Raj)
  app.post('/api/login', (req, res) => {
    const rawUser = String(req.body?.username ?? '').trim().toLowerCase();
    const password = String(req.body?.password ?? '');
    const selectedBattalion = req.body?.battalion as Battalion | undefined;

    const account = ANO_ACCOUNTS[rawUser];
    if (!account || account.password !== password) {
      res.status(401).json({ error: 'Invalid username or password.' });
      return;
    }

    if (
      selectedBattalion &&
      (selectedBattalion === '2 Raj' || selectedBattalion === '10 Raj') &&
      account.battalion !== selectedBattalion
    ) {
      res.status(403).json({
        error: `This ANO login belongs to ${account.battalion} Bn NCC. Please select ${account.battalion} to sign in.`,
      });
      return;
    }

    res.json({
      authenticated: true,
      admin: {
        username: rawUser,
        full_name: account.full_name,
        battalion: account.battalion,
      },
    });
  });

  // Portal State (filtered by logged-in ANO battalion when supplied)
  app.get('/api/portal', (req, res) => {
    const db = readDb();
    const battalion = req.query.battalion as string | undefined;
    if (battalion === '2 Raj' || battalion === '10 Raj') {
      const cadets = db.cadets.filter((c) => c.wing === battalion);
      const cadetIds = new Set(cadets.map((c) => c.id));
      const attendance = db.attendance.filter((a) => cadetIds.has(a.cadet_id));
      const events = db.events.filter((e) => (e.wing || '2 Raj') === battalion);
      const achievements = db.achievements.filter((a) => cadetIds.has(a.cadet_id));
      res.json({ cadets, attendance, events, achievements });
      return;
    }
    res.json(db);
  });

  // Cadets CRUD
  app.post('/api/cadets', (req, res) => {
    const db = readDb();
    const payload = req.body as Partial<Cadet>;
    const regNo = (payload.regimental_no ?? '').trim().toUpperCase();
    if (!regNo || !payload.full_name?.trim()) {
      res.status(400).json({ error: 'Regimental number and full name are required.' });
      return;
    }
    if (db.cadets.some((c) => c.regimental_no === regNo)) {
      res.status(409).json({ error: 'A cadet with this Regimental Number already exists.' });
      return;
    }
    const wing: Battalion = payload.wing === '10 Raj' ? '10 Raj' : '2 Raj';
    const created: Cadet = {
      id: nextId(db.cadets),
      regimental_no: regNo,
      full_name: payload.full_name.trim(),
      rank_title: payload.rank_title || 'Cadet',
      wing,
      unit_name: (payload.unit_name || (wing === '10 Raj' ? '10 Raj Bn NCC' : '2 Raj Bn NCC')).trim(),
      college_branch: (payload.college_branch || 'Batch 2026-27').trim(),
      year_of_study: (payload.year_of_study as Cadet['year_of_study']) || '1st Year',
      phone: (payload.phone || '').trim(),
      email: (payload.email || '').trim(),
      blood_group: payload.blood_group ?? '',
      enrollment_date: payload.enrollment_date || isoOffsetDays(0),
      status: (payload.status as Cadet['status']) || 'Active',
    };
    db.cadets.unshift(created);
    writeDb(db);
    res.status(201).json(created);
  });

  app.put('/api/cadets/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    const idx = db.cadets.findIndex((c) => c.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Cadet not found.' });
      return;
    }
    const payload = req.body as Partial<Cadet>;
    const regNo = (payload.regimental_no ?? db.cadets[idx].regimental_no).trim().toUpperCase();
    if (db.cadets.some((c) => c.regimental_no === regNo && c.id !== id)) {
      res.status(409).json({ error: 'Regimental number already belongs to another cadet.' });
      return;
    }
    db.cadets[idx] = {
      ...db.cadets[idx],
      ...payload,
      id,
      regimental_no: regNo,
    };
    writeDb(db);
    res.json(db.cadets[idx]);
  });

  app.delete('/api/cadets/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    db.cadets = db.cadets.filter((c) => c.id !== id);
    db.attendance = db.attendance.filter((a) => a.cadet_id !== id);
    db.achievements = db.achievements.filter((a) => a.cadet_id !== id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Bulk Save Attendance for a Date
  app.post('/api/attendance', (req, res) => {
    const { attendance_date, parade_topic, entries } = req.body as {
      attendance_date: string;
      parade_topic: string;
      entries: Array<{ cadet_id: number; status: 'Present' | 'Absent'; remarks: string }>;
    };
    if (!attendance_date || !Array.isArray(entries)) {
      res.status(400).json({ error: 'Attendance date and entries are required.' });
      return;
    }
    const db = readDb();
    const topic = (parade_topic || 'Morning Drill & Guard Inspection').trim();

    for (const entry of entries) {
      const existingIdx = db.attendance.findIndex(
        (a) => a.cadet_id === entry.cadet_id && a.attendance_date === attendance_date
      );
      if (existingIdx >= 0) {
        db.attendance[existingIdx] = {
          ...db.attendance[existingIdx],
          parade_topic: topic,
          status: entry.status === 'Absent' ? 'Absent' : 'Present',
          remarks: (entry.remarks || '').trim(),
        };
      } else {
        db.attendance.push({
          id: nextId(db.attendance),
          cadet_id: entry.cadet_id,
          attendance_date,
          parade_topic: topic,
          status: entry.status === 'Absent' ? 'Absent' : 'Present',
          remarks: (entry.remarks || '').trim(),
        });
      }
    }
    writeDb(db);
    res.json({ saved: true, attendance: db.attendance });
  });

  // Events CRUD
  app.post('/api/events', (req, res) => {
    const db = readDb();
    const payload = req.body as Partial<EventRecord>;
    if (!payload.title?.trim() || !payload.event_date) {
      res.status(400).json({ error: 'Event title and date are required.' });
      return;
    }
    const wing: Battalion = payload.wing === '10 Raj' ? '10 Raj' : '2 Raj';
    const created: EventRecord = {
      id: nextId(db.events),
      title: payload.title.trim(),
      event_type: (payload.event_type as EventRecord['event_type']) || 'Camp',
      event_date: payload.event_date,
      location: (payload.location || '').trim(),
      organizer: (payload.organizer || (wing === '10 Raj' ? '10 Raj Bn NCC' : '2 Raj Bn NCC')).trim(),
      wing,
      description: (payload.description || '').trim(),
      status: (payload.status as EventRecord['status']) || 'Upcoming',
    };
    db.events.unshift(created);
    writeDb(db);
    res.status(201).json(created);
  });

  app.put('/api/events/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    const idx = db.events.findIndex((e) => e.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    db.events[idx] = { ...db.events[idx], ...req.body, id };
    writeDb(db);
    res.json(db.events[idx]);
  });

  app.delete('/api/events/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    db.events = db.events.filter((e) => e.id !== id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Achievements CRUD
  app.post('/api/achievements', (req, res) => {
    const db = readDb();
    const payload = req.body as Partial<AchievementRecord>;
    if (!payload.cadet_id || !payload.title?.trim()) {
      res.status(400).json({ error: 'Cadet and achievement title are required.' });
      return;
    }
    const created: AchievementRecord = {
      id: nextId(db.achievements),
      cadet_id: Number(payload.cadet_id),
      title: payload.title.trim(),
      category: (payload.category as AchievementRecord['category']) || 'Certificate',
      level: (payload.level as AchievementRecord['level']) || 'Unit',
      achieved_date: payload.achieved_date || isoOffsetDays(0),
      remarks: (payload.remarks || '').trim(),
    };
    db.achievements.unshift(created);
    writeDb(db);
    res.status(201).json(created);
  });

  app.put('/api/achievements/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    const idx = db.achievements.findIndex((a) => a.id === id);
    if (idx === -1) {
      res.status(404).json({ error: 'Achievement not found.' });
      return;
    }
    db.achievements[idx] = {
      ...db.achievements[idx],
      ...req.body,
      id,
      cadet_id: Number(req.body.cadet_id ?? db.achievements[idx].cadet_id),
    };
    writeDb(db);
    res.json(db.achievements[idx]);
  });

  app.delete('/api/achievements/:id', (req, res) => {
    const id = Number(req.params.id);
    const db = readDb();
    db.achievements = db.achievements.filter((a) => a.id !== id);
    writeDb(db);
    res.json({ deleted: true });
  });

  // Download Complete PHP + MySQL ZIP Archive
  app.get('/api/download-zip', (_req, res) => {
    const zipPath = path.join(__dirname, 'public', 'ncc_portal.zip');
    if (!fs.existsSync(zipPath)) {
      res.status(404).json({ error: 'ZIP file not found.' });
      return;
    }
    res.download(zipPath, 'ncc_portal.zip');
  });

  // Serve Vite in development or static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NCC Cadet Management Portal running on http://localhost:${PORT}`);
  });
}

startServer();
