import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  const { key } = req.query;
  const serverKey = process.env.ACCESS_KEY;

  if (!serverKey) {
    return res.status(200).json({ authorized: true });
  }

  if (key === serverKey) {
    return res.status(200).json({ authorized: true });
  }

  return res.status(403).json({ authorized: false });
}