// src/middleware/sessionMiddleware.ts
import session from 'express-session';
import FileStore from 'session-file-store';

const sessionMiddleware = session({
    store: new (FileStore(session))(),
  secret: process.env.SESSION_SECRET || 'dev-secret', // 🔐 Use env var in production
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 1000 * 60 * 5, // 5 minutes
    httpOnly: true,         // Important for security, prevents JS access to cookie
    secure: process.env.NODE_ENV === 'production',  // Only set 'true' in production (HTTPS)
    sameSite: 'lax',
  },
});

export default sessionMiddleware;
