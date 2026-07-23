import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'public', 'index.html');
  const html = fs.readFileSync(filePath, 'utf-8');
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
}
