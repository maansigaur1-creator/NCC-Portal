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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {}
  }

  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const idParam = url.searchParams.get('id') || req.query?.id;
  const idFromPath = req.url.split('?')[0].split('/').filter(Boolean).pop();
  const id = Number(idParam || (!isNaN(Number(idFromPath)) ? idFromPath : null));

  const db = readDb();

  if (req.method === 'POST') {
    const payload = body as Partial<Cadet>;
    const regNo = (payload.regimental_no ?? '').trim().toUpperCase();
    if (!regNo || !payload.full_name?.trim()) {
      return res.status(400).json({ error: 'Regimental number and full name are required.' });
    }
    if (db.cadets.some((c: any) => c.regimental_no === regNo)) {
      return res.status(409).json({ error: 'A cadet with this Regimental Number already exists.' });
    }
    const wing: Battalion = payload.wing === '10 Raj' ? '10 Raj' : '2 Raj';
    const created: Cadet = {
      id: nextId(db.cadets),
      regimental_no: regNo,
      full_name: payload.full_name.trim(),
      rank_title: payload.rank_title || 'Cadet',
      wing,
      unit_name: (payload.unit_name || (wing === '10 Raj' ? '10 Raj Bn NCC' : '2 Raj Bn NCC')).trim(),
      college_branch: (payload.college_branch || 'Batch 2025-26').trim(),
      year_of_study: (payload.year_of_study as Cadet['year_of_study']) || '2nd Year',
      phone: (payload.phone || '').trim(),
      email: (payload.email || '').trim(),
      blood_group: payload.blood_group ?? '',
      enrollment_date: payload.enrollment_date || new Date().toISOString().slice(0, 10),
      status: (payload.status as Cadet['status']) || 'Active',
    };
    db.cadets.unshift(created);
    writeDb(db);
    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Cadet ID required.' });
    const idx = db.cadets.findIndex((c: any) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Cadet not found.' });
    }
    const payload = body as Partial<Cadet>;
    const regNo = (payload.regimental_no ?? db.cadets[idx].regimental_no).trim().toUpperCase();
    if (db.cadets.some((c: any) => c.regimental_no === regNo && c.id !== id)) {
      return res.status(409).json({ error: 'Regimental number already belongs to another cadet.' });
    }
    db.cadets[idx] = {
      ...db.cadets[idx],
      ...payload,
      id,
      regimental_no: regNo,
    };
    writeDb(db);
    return res.status(200).json(db.cadets[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Cadet ID required.' });
    db.cadets = db.cadets.filter((c: any) => c.id !== id);
    db.attendance = db.attendance.filter((a: any) => a.cadet_id !== id);
    db.achievements = db.achievements.filter((a: any) => a.cadet_id !== id);
    writeDb(db);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
