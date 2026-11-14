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
    const payload = body as Partial<EventRecord>;
    if (!payload.title?.trim() || !payload.event_date) {
      return res.status(400).json({ error: 'Event title and date are required.' });
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
    return res.status(201).json(created);
  }

  if (req.method === 'PUT') {
    if (!id) return res.status(400).json({ error: 'Event ID required.' });
    const idx = db.events.findIndex((e: any) => e.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    db.events[idx] = { ...db.events[idx], ...body, id };
    writeDb(db);
    return res.status(200).json(db.events[idx]);
  }

  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'Event ID required.' });
    db.events = db.events.filter((e: any) => e.id !== id);
    writeDb(db);
    return res.status(200).json({ deleted: true });
  }

  return res.status(405).json({ error: 'Method not allowed.' });
}
