# Security Notes

## Supabase Row-Level Security (RLS)
All tables have RLS enabled and policies that restrict each user to their own data only.
Run `supabase/schema.sql` on a fresh project to set up all tables and policies correctly.

## Keys
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` is safe to expose in the React Native bundle (it's designed for public use). Supabase RLS policies ensure users can only read/write their own rows.
- Never use the `service_role` key inside the app — use it only in serverless functions or admin scripts outside the app.

## Notifications
- Background notifications require `SCHEDULE_EXACT_ALARM` on Android 12+ and `POST_NOTIFICATIONS` on Android 13+. Both are declared in `app.config.js`.
- Notification content never includes sensitive user data beyond the verse reference and content the user themselves added.

## Data Storage
- Verses are stored in Supabase (cloud) and also cached in local SQLite for offline access.
- AsyncStorage is used only for lightweight preferences (onboarding state, reminder interval, display name/avatar preference). No sensitive data is stored there.

## Authentication
- Authentication is handled by Supabase Auth (email/password + optional Google OAuth).
- Session tokens are managed by the Supabase JS client and stored in AsyncStorage automatically.
- Supabase enforces HTTPS for all API calls.

## Network
- The only external network calls are to `supabase.co` (auth + database) and `bolls.life` (Bible API).
- The bolls.life API is public and requires no API key.

## No Telemetry
- The app does not include any analytics or crash reporting libraries.

## Recommendations Before Production
1. Enable Supabase Auth email confirmation.
2. Set up CORS on your Supabase project to allow only your app's scheme.
3. Review and rotate the anon key periodically.
4. Enable Supabase database backups.
