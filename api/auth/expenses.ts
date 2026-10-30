// All access goes through the Express API, which verifies identity and permissions.
export default function handler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => unknown } }) {
  return res.status(410).json({ error: 'Use the configured Express API.' });
}
