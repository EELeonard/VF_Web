# Vienna Flight website

A modern, responsive multi-page redesign of the Vienna Flight website with an interactive booking flow for four flight simulators.

## Local preview

The development server runs at [http://localhost:3000](http://localhost:3000).

This workspace includes a project-local Node.js runtime because Node.js was not installed globally. To restart the server from this directory:

    PATH="$PWD/work/node-runtime/node-v24.21.0-darwin-arm64/bin:$PATH" npm run dev

## Included

- Complete German and English public sites with shared navigation, language switch, and footer
- Dedicated pages for simulators, experiences, company information, contact, and booking
- Airbus A320, Boeing 787, Bell 206, and Eurofighter showcase
- Animated page reveals and subtle hover motion
- Six-month booking calendar showing only appointments actively released by an administrator
- Booking flow with simulator, duration, date, time, voucher, contact data, and client remarks
- Durable booking records backed by a D1-compatible database
- Protected booking administration with search, status changes, email status, and deletion
- Request receipts, acceptance confirmations, and 24-hour appointment reminders via Resend
- Search and social sharing metadata
- Reduced motion support and accessible form controls

## Booking administration

Open [http://localhost:3000/admin](http://localhost:3000/admin).

All simulator appointments are locked by default. Select a date in the administration calendar, choose the simulator, and explicitly release each bookable start time. A released time is removed from public availability as soon as it conflicts with an active booking.

The requested local default credentials are:

- User: admin
- Password: Vienna flight

Before a public launch, set ADMIN_USER, ADMIN_PASSWORD, and ADMIN_SESSION_SECRET to private production values. The booking flow does not collect payment. A live payment launch still requires connecting Vienna Flight's preferred payment provider.

## Booking email configuration

Copy `.env.example` to `.env.local` and set `RESEND_API_KEY`, `BOOKING_EMAIL_FROM`, and `BOOKING_REPLY_TO`. The sender address must belong to a domain verified by the mail provider. Bookings are still persisted if delivery is unavailable, and the failure is shown in the admin dashboard.

The worker includes a scheduler that checks for confirmed appointments every 15 minutes. It sends each reminder once when the appointment is approximately 24 hours away. The admin dashboard also includes a manual reminder check for operational verification.

The English website starts at [http://localhost:3000/en](http://localhost:3000/en). Booking emails follow the language used when the client submitted the request.
