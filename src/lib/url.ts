export const getBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ||
   process.env.APP_URL ||
   (process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
   'http://localhost:3000').replace(/\/$/, '');

export const absUrl = (p: string) =>
  new URL(p.startsWith('/') ? p : `/${p}`, getBaseUrl()).toString();
