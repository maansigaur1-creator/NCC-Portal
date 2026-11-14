import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = fs.existsSync(path.join(process.cwd(), '.data'))
  ? path.join(process.cwd(), '.data')
  : path.join(__dirname, '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'ncc_portal.json');

function readDb(): any {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Error reading DATA_FILE:', err);
  }
  return { cadets: [], attendance: [], events: [], achievements: [] };
}

function writeDb(db: any): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('Could not persist database to disk:', err);
  }
}

function nextId(items: Array<{ id: number }>): number {
  return items.length === 0 ? 1 : Math.max(...items.map((x) => x.id)) + 1;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const { attendance_date, parade_topic, entries } = body as {
    attendance_date: string;
    parade_topic: string;
    entries: Array<{ cadet_id: number; status: 'Present' | 'Absent'; remarks: string }>;
  };

  if (!attendance_date || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'Attendance date and entries are required.' });
  }

  const db = readDb();
  const topic = (parade_topic || 'Morning Drill & Guard Inspection').trim();

  for (const entry of entries) {
    const existingIdx = db.attendance.findIndex(
      (a: any) => a.cadet_id === entry.cadet_id && a.attendance_date === attendance_date
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
  return res.status(200).json({ saved: true, attendance: db.attendance });
}
