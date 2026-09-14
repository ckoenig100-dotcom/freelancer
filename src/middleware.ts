import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const adminPath = `${import.meta.env.BASE_URL}admin`;
  if (!context.url.pathname.startsWith(adminPath)) {
    return next();
  }

  const auth = context.request.headers.get('authorization');
  const expectedUser = import.meta.env.ADMIN_USERNAME;
  const expectedPass = import.meta.env.ADMIN_PASSWORD;

  if (auth?.startsWith('Basic ')) {
    const decoded = atob(auth.slice('Basic '.length));
    const separatorIndex = decoded.indexOf(':');
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (user === expectedUser && pass === expectedPass) {
      return next();
    }
  }

  return new Response('Zugang verweigert', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin-Bereich"' },
  });
});
