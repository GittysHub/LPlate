// src/lib/baseUrl.ts
export const getBaseUrl = () => {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/$/, '');
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // preview/prod on Vercel
  return 'http://localhost:3000'; // local dev fallback
};

export const absUrl = (path: string) => {
  const b = getBaseUrl();
  return new URL(path.startsWith('/') ? path : `/${path}`, b).toString();
};
