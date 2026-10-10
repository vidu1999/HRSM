> **New:** the modern, database-backed HRMS (Next.js, TypeScript, PostgreSQL, Docker, CI) lives in [`hrms/`](hrms/README.md). The static prototype below is kept for reference.

# HRMS workspace prototype

A responsive Human Resource Management System inspired by the supplied HRMS reference: dark navy module navigation, a compact global header, blue active states, lightweight KPI cards, charts, and operational tables.

## Run locally

```bash
python3 -m http.server 4173 --bind 0.0.0.0
```

Open `http://localhost:4173` (Arena also exposes the running server as a live preview). There is no build step or external backend.

## Modules

- **Dashboard:** employee and leave KPIs, attendance trend chart, leave distribution, recent leave requests, and upcoming birthdays.
- **Employees:** search/filter, add/edit/remove records, pagination, and CSV export.
- **Organization:** department headcount and team navigation.
- **Attendance:** daily check-in summary, attendance table, clock-in/out demo, filters, and export.
- **Leave:** request creation, request tabs/filters, approve/decline actions, and export.
- **Payroll:** overview, salary structure, payslips, deductions/benefits, and a safe simulated payroll run.
- **Recruitment (ATS):** job posts, applicants, interviews, offers, and hiring stage progression.
- **Performance:** goals, reviews, KPIs, feedback, and progress updates.
- **Documents:** document library, metadata upload, categories, preview, and download.
- **Reports & Analytics:** downloadable HR reports, employee distribution, and department headcount.
- **Audit Logs:** searchable module activity history and CSV export.
- **Settings:** general, security, roles/permissions, and system preferences.

## Demo data and safety

- Sample records use Sri Lankan names, departments, and LKR amounts to align with the supplied reference.
- Changes are stored in browser `localStorage` only. No employee data is sent to a server.
- Uploaded document metadata is stored locally; this prototype does not upload file contents.
- Payroll is a visual preview and simulated run only; it does not transfer money or file taxes.
- Small page, chart, hover, and success animations are included. The UI honors `prefers-reduced-motion`.
