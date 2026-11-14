import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const zipPath = fs.existsSync(path.join(process.cwd(), 'public', 'ncc_portal.zip'))
    ? path.join(process.cwd(), 'public', 'ncc_portal.zip')
    : path.join(__dirname, '..', 'public', 'ncc_portal.zip');

  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: 'ZIP file not found.' });
  }

  const fileBuffer = fs.readFileSync(zipPath);
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="ncc_portal.zip"');
  return res.status(200).send(fileBuffer);
}
