# FoodExpress backend

## Run locally

Configure the backend variables in `.env` using `.env.example`, then run:

```powershell
npm install
npm run dev
```

MongoDB must be available at the configured `MONGO_URI`.

## Admin user management API

The `/api/users` endpoints require a valid JWT and the `admin` role:

- `GET /api/users` — paginated user list; supports `search`, `role`, `status`, `page`, and `limit`.
- `GET /api/users/:id` — safe user details.
- `PUT /api/users/:id` — update `nom`, `prenom`, `email`, `telephone`, or `role`.
- `PATCH /api/users/:id/password` — set a user's password with `newPassword` and `confirmPassword`.
- `PATCH /api/users/:id/status` — set `{ "isActive": true }` or `{ "isActive": false }`.
- `DELETE /api/users/:id` — delete a user.

List filters accept roles `client`, `restaurateur`, or `admin`, and statuses `active` or `inactive`. The page size defaults to 10 and is capped at 100. Responses exclude passwords and other security fields.
