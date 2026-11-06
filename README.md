# MediPulse

Medication reminders for care teams and patients (Flask + SQLite).

## Run it
```
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python app.py
```
Open http://127.0.0.1:5000

## Demo logins
- Doctor: doctor@medipulse.app / demo1234
- Patient: jordan@medipulse.app / demo1234

## Files
- app.py: routes and app set-up
- auth.py: sign-in, register, access control
- database.py, schema.sql: SQLite connection, tables, demo data
- models.py: queries and adherence/streak rules
- reports.py: weekly report data and PDF (saved in reports/)
- reminders.py, scheduler.py: checks every minute and emails patients whose dose is due
- templates/, static/: pages, styles, small front-end script
- .env: SECRET_KEY, database name, optional SMTP settings

## Notes
- Reminders are only logged to the console until SMTP_HOST is set in .env.
- Delete medication.db to rebuild it with fresh demo data (the sample dose history is dated from the day it was created).
- Change SECRET_KEY in .env before using this for anything real.


## Browser medication reminders (added)

1. Start the Flask app with `python app.py`.
2. Sign in as a patient and open the dashboard.
3. Click **Turn on reminders** and allow notifications in the browser.
4. Use **Send test notification** to verify browser permission and delivery.
5. Keep the patient dashboard open for scheduled browser alerts.

The browser reminder schedule uses the device's current local clock, so it follows the phone/computer time zone after travel. Supported schedules are Once daily, Twice daily (12 hours apart), Three times daily (8 hours apart), Every 8 hours, Every other day, and Weekly. As-needed prescriptions do not generate automatic alerts.

**Important limitation:** browser notifications run only while the patient dashboard is open in a supported browser. For alerts when the browser is closed, deploy a service worker/push-notification service or configure the existing SMTP email reminder service. The existing server scheduler is separate from these browser notifications.
