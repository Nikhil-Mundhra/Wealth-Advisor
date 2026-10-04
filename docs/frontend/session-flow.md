# Session flow

Status: `loading` until the first refresh settles, then `authenticated` (access token in memory) or `anonymous`. Route guards show a spinner while `loading`.

1. load: `SessionProvider` registers the session with the API client, then calls `POST /api/auth/refresh`; the browser sends the refresh cookie → access token in memory, or `anonymous`.
2. API call: authenticated calls send `Authorization: Bearer <access token>`; a 401 triggers one refresh, then one retry.
3. refresh: concurrent callers share the single in-flight `POST /api/auth/refresh`; success stores the new access token, failure clears the session.
4. logout: `POST /api/auth/logout`; the server revokes the session and clears the cookie; the in-memory token and the query cache are cleared even if the call fails.

Token model and cookie: `docs/backend/auth-token.md`.
