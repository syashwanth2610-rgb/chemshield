## Auth-Gated App Testing Playbook

### JWT Test Login
```
POST /api/auth/login
{"email": "demo@chemshield.ai", "password": "Demo@1234"}
```
Returns `{token, user}`. Use `Authorization: Bearer <token>` on all `/api/*` (except auth endpoints).

### Emergent Google Auth
1. Frontend redirects to `https://auth.emergentagent.com/?redirect=<origin>/auth/callback`
2. Provider returns `#session_id=...`
3. Frontend calls `POST /api/auth/google/callback` with `{session_id}`.
4. Backend sets `session_token` cookie and returns `{user, token}`.
5. `/api/auth/me` validates cookie OR Bearer token.

### Debug
- Check `mongosh --eval "use('test_database'); db.users.find().limit(3).pretty()"`
- Sessions collection: `user_sessions`.
