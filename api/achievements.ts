import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = fs.existsSync(path.join(process.cwd(), '.data'))
  ? path.join(process.cwd(), '.data')
  : path.join(__dirname, '..', '.data');
const DATA_FILE = path.join(DATA_DIR, 'ncc_portal.json');

interface AchievementRecord {
  id: number;
  cadet_id: number;
  title: string;
  category: 'Certificate' | 'Award' | 'Activity';
  level: 'Unit' | 'Group' | 'Directorate' | 'National';
  achieved_date: string;
  remarks: string;
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
    const payload = body as Partial<AchievementRecord>;
    if (!payload.cadet_id || !payload.title?.trim()) {
      return res.status(400).json({ error: 'Cadet and achievement title are required.' });
    }
    const created: AchievementRecord = {
      id: nextId(db.achievements),
      cadet_id: Number(payload.cadet_id),
      title: payload.title.trim(),
      category: (payload.category as AchievementRecord['category']) || 'Certificate',
      level: (payload.level as AchievementRecord['level']) || 'Unit',
      achieved_date: payload.achieved_date || new Date().toISOString().slice(0, 10),
      remarks: (payload.remarks || '').trim(),
    };
    db.achievements.unshift(created);
    writeDb(db);
    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Achievement ID required.' });
    const idx = db.achievements.findIndex((a: any) => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Achievement not found.' });
    }
    db.achievements[idx] = {
      ...db.achievements[idx],
      ...body,
      id,
      cadet_id: Number(body.cadet_id ?? db.achievements[idx].cadet_id),
    };
    writeDb(db);
    return res.status(200).json(db.achievements[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Achievement ID required.' });
    db.achievements = db.achievements.filter((a: any) => a.id !== id);
    writeDb(db);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
