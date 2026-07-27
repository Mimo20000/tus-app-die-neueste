# PRD — TuS Oberhausen II Handball Team App

## Original Problem Statement
German handball team app: player roster, trainings & match dates with confirm/decline, participation statistics, TuS Oberhausen club logo, and a sheet table. Extended by user with: password login, calendar to add events, Treffen type, "Ich fahre"/"Bringe Bier" buttons, chat + notifications, live league table, holidays.

## Architecture
- Backend: FastAPI + MongoDB (motor). Auto-seed. JWT (pyjwt) + bcrypt (passlib). httpx for handball.net + Expo push. Routes under /api.
- Frontend: Expo Router (SDK 54). Plus Jakarta Sans, Ionicons, expo-image, expo-linear-gradient, expo-sharing/file-system, @react-native-community/datetimepicker, expo-notifications/expo-device.
- Session: player + JWT (secure storage) via `@/src/utils/storage`.
- Tabs (6): Termine, Chat, Kader, Statistik, Anwesenheit (sheet), Tabelle (league).

## Data
- 18 players (name, position, status, email, birthdate, password_hash, push_token).
- 12 games (Spiel) Oct 2026–Apr 2027 + weekly Thursday 19:00 trainings from today through 2031 + coach-added Treffen.

## Implemented (2026-07-12)
- [x] Password login (self-chosen), name selection + JWT; "Neu"/lock badges.
- [x] Termine: filter chips (Alle/Spiele/Trainings/Treffen), Zusagen/Absagen; "Ich fahre" (Spiele), "Bringe Bier" (Trainings); Ferien/Feiertage BW inserts; ICS calendar export/share.
- [x] Kader: email (mailto button) + birthdate editable by self; coach edits status/any; PlayerEditSheet.
- [x] Statistik: attendance % per player, rankings, mode chips (Gesamt/Spiele/Trainings/Gefahren/Bier gebracht).
- [x] Kader: selbst editierbare Trikotnummer (1–99), Anzeige als Badge am Avatar + in Zeile.
- [x] Auto-Geburtstagsnachricht im Team-Chat (bei ausgefülltem Geburtsdatum, 1×/Jahr, mit Push).
- [x] Auto-Team-Chat-Nachricht mit Name beim Aktivieren/Deaktivieren von "Ich fahre" (🚗/🚗❌) bzw. "Bringe Bier" (🍺/🍺❌); nur bei Zustandswechsel, kein Spam.
- [x] Termin-Detailansicht (alle Spieler): Zusagen/Absagen/Offen + Fahrer/Bier mit Name, Trikotnummer & E-Mail; Personen-Icon auf Terminkarte.
- [x] Dauerhaft angemeldet bleiben bis manueller Logout (robuste Session-Wiederherstellung, auch offline).
- [x] Passwort vergessen: 6-stelliger Code per E-Mail (Resend) an hinterlegte Adresse, Code + neues Passwort → Auto-Login.
- [x] Anwesenheit: players×events sheet, sticky column, CSV export.
- [x] Tabelle: live league standings from handball.net (empty-state pre-season).
- [x] Chat: team chat + 1:1 direct, unread badges (tab + rows), polling; push scaffold (Expo token register + backend send).
- [x] Coach (Michael MOSER) admin: add events via calendar FAB.
- [x] Coach: Termine **bearbeiten** (Datum/Uhrzeit/Ort/Gegner) & **absagen** via Bearbeiten-Icon; abgesagte Termine mit "Abgesagt"-Badge + durchgestrichen; Push "Termin geändert"/"Termin abgesagt".

## Backlog / Next
- P1: Real push delivery needs publish + native build + google-services.json (Firebase). EMERGENT_PUSH_KEY auto-set at deploy.
- P1: Chat group channels; message delete/edit; typing indicator.
- P2: Migrate FastAPI on_event to lifespan; paginate chat/messages.
- P2: League table auto-refresh caching.

## Next Tasks
1. After user publishes + builds: verify push notifications with google-services.json.
2. Event detail with per-player RSVP/driving/beer overview.
