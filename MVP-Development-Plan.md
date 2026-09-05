# School Management SaaS — MVP Development Plan
### Development-Ready Product Specification & Roadmap
Prepared as a CTO-level blueprint from idea → architecture → database → UI → build → test → deploy → demo.

---

## 0. CTO Notes — Assumptions I'm Challenging Before We Lock This In

Before the detailed plan, six things in the brief need a decision now, because retrofitting any of them later is expensive.

1. **"1 hour after marking absent" cannot be a literal timer.** If a teacher marks attendance at 7:55 AM, "1 hour later" is 8:55 AM — fine. But if a teacher marks attendance late (say 11:30 AM, common in real schools), a literal timer fires at 12:30 PM, which is fine too — but if someone corrects a marking error at 8:40 AM (10 minutes before the timer), you must cancel the job, not just suppress the message. And you must never let a job fire at 9 PM because someone marked attendance late in the evening while catching up on data entry. **Decision needed:** the delay is per-school configurable (default 60 min), but capped by a school-defined "communication window" (e.g. never send before 7 AM or after 6 PM) and always re-checked against current attendance state at send time. This is designed into Section 12.

2. **WhatsApp cannot be "one integration for the whole platform" in the way the brief implies.** Meta requires a verified WhatsApp Business Account (WABA) and approved message templates per sending identity. In practice this means **each school effectively needs its own WhatsApp sender identity** (own display name, own number showing to parents), even though your backend is shared. The practical fix — used by every serious vertical SaaS — is a **Business Solution Provider (BSP) with "Embedded Signup"** (Meta's official flow for ISVs to onboard sub-clients under one Tech Provider account) rather than talking to Meta's Cloud API directly per school. This changes nothing about your app architecture (Section 10 already isolates this behind a provider interface) but it changes your onboarding flow and your commercial model (a small WhatsApp pass-through cost per school, on top of your subscription).

3. **"Paid / Unpaid" is not a boolean — it must be a ledger.** Partial payments, annual charges billed once but shown for 12 months, and "any selected month's status" all require an invoice-per-period model, not a flag on the student. Designed into Sections 7 and 11.

4. **Broadcast audiences must be saved as *definitions*, not snapshots.** "Absent students' parents" and "fee defaulters" change every day. The broadcast composer must resolve the audience at send time from live filters (class, section, absent-today, defaulter-this-month), not from a list picked once.

5. **Multi-tenancy: shared database with a `school_id` on every table, enforced by middleware (and Postgres Row-Level Security as a second line of defense), not separate databases per school.** Separate DBs per tenant only pay off past ~50-100 schools with heavy customization needs, which is a good problem to have later — not now. Every table gets `school_id` from day one because adding it retroactively is the single most expensive migration you could face.

6. **Your actual wedge against DeltaSoft isn't "we'll eventually build a Parent Portal" — it's that WhatsApp notifications already deliver 80% of what a Parent Portal promises (absence alerts, fee reminders, broadcasts) with zero login, zero app install, and zero training.** Keep saying this in the School 2 demo. It reframes "we don't have a Parent Portal yet" from a weakness into "we solved the problem the portal was meant to solve, without needing you to get parents to download anything."

Everything below assumes these six decisions are accepted. Nothing else in the brief needs pushback — the 7-module MVP scope is right-sized and the exclusion list (Parent Portal, LMS, Payroll, Library, Transport, Inventory, Accounting, advanced Exams, Website CMS) is correct for a first sellable demo.

---

## 1. Product Overview

**Problem.** Pakistani private schools run on two broken patterns: (a) legacy desktop/local-server ERPs like DeltaSoft — functionally complete but outdated, hard to use, not cloud-based, and painful to retrain staff on — or (b) no system at all, meaning attendance, fees, and parent communication are manual, error-prone, and invisible to the principal until something goes wrong. Both groups share one specific pain that nobody has solved well: **parents don't know what's happening with their child in real time**, and **principals don't have a single screen that tells them the state of the school**.

**Users.** Five roles interact with the system in MVP: a platform Super Admin (you, running the SaaS), a School Admin (the school's system owner), a Principal (oversight, not data entry), an Accountant (fees), and Teachers (attendance, and viewing their own class). Parents are a *message recipient*, not a logged-in user, in MVP — this is what keeps scope sane.

**What the MVP is.** Seven modules that let a school digitize attendance and fees, see one real-time dashboard, and communicate with parents automatically over WhatsApp — with a built-in Training Center so staff resistance (the #1 reason School 1's staff won't migrate off DeltaSoft) is designed away from day one.

**What's excluded.** Parent Portal/LMS login, staff Payroll, Library, Transport, Inventory, Accounting/Finance ERP, advanced Examination/Results, and Website CMS. All are real modules a mature ERP needs — none are needed to prove value to School 2 or to beat DeltaSoft on the dimensions that matter (usability, automation, cloud).

**Why this beats a traditional ERP.** DeltaSoft-style systems are feature-complete but experience-poor: on-prem data, dated UI, no dashboard, high training cost. This product wins not by having more modules, but by making the same jobs-to-be-done — mark attendance, collect fees, tell parents what's going on — take a fraction of the clicks, look like a 2026 SaaS product, and run itself once configured (WhatsApp automation instead of a staff member manually calling absent students' parents).

---

## 2. User Roles & Permissions (MVP)

| Role | Scope | Can Access | Cannot Access |
|---|---|---|---|
| **Super Admin** (you) | Cross-tenant (platform owner) | Create/suspend schools, view platform-wide usage & billing status, impersonate a School Admin for support, manage global Training Center content library, view system health/logs | Cannot see one school's student/fee data unless impersonating for support (with an audit-logged action) |
| **School Admin** | Single school (full tenant admin) | Everything within their school: user management (create Accountant/Teacher/Principal accounts), class/section setup, fee structure configuration, all student records, all attendance, all fee data, WhatsApp template & broadcast config, Training Center (view + mark-as-viewed), school settings (absence delay, communication window, branding) | Other schools' data; platform billing/plan changes (Super Admin only) |
| **Principal** | Single school (oversight) | Dashboard (full), student records (read + read-only drill-down), attendance (read, all classes), fee reports (read, all classes), broadcast messaging (send), Training Center | Cannot edit fee structures, cannot delete students, cannot manage user accounts (view-only on staff list) |
| **Accountant** | Single school (fee module) | Fee structure setup (if delegated by School Admin), record payments, view defaulters, generate fee reports, view student list (read-only, needed to record payments), Training Center | Attendance module, WhatsApp broadcast composer (can view fee-reminder delivery logs only), user management |
| **Teacher** | Single school, own class/section(s) | Mark attendance for assigned class/section only, view own students' basic profile (name, parent contact, attendance history), Training Center | Fee data, other classes' attendance, broadcast composer, student CRUD (add/edit/delete), settings |

Permission model is **role-based (RBAC)** for MVP — no custom per-user permission editor. A `TeacherClassAssignment` join table scopes which class/section(s) a teacher can mark attendance for (a teacher can be assigned to more than one section, common for subject teachers who also act as class incharge — but MVP only needs the *class-incharge* assignment for attendance-marking rights).

Every write action is scoped server-side to `req.user.schoolId` — role checks alone are not sufficient; tenant isolation is enforced independently of role (see Section 21).

---

## 3. Complete MVP Feature Breakdown

### 3.1 Principal Dashboard
- **Purpose:** One screen that answers "how is my school doing today, this month" without navigating anywhere else.
- **Features:** Live KPI cards, class-wise attendance table, fee collection summary, defaulter counts (current + previous month), month/class filters, alerts feed.
- **User flow:** Principal logs in → lands on Dashboard (default home route for this role) → filters by month/class as needed → drills into a class or an alert to jump to the relevant module.
- **Screens:** Dashboard (single screen, densely composed — see Section 6).
- **Actions:** Change month, change class filter, click a KPI/alert to deep-link into Students/Fees/Attendance filtered to that context.
- **Data required:** Aggregated attendance counts per day/class, aggregated fee status per month/class, defaulter lists, new admissions count, alert conditions (see 6).
- **Permissions:** Principal (full), School Admin (full), Accountant (fee widgets only, optional), Super Admin (platform-level dashboard, separate screen).
- **Dependencies:** Requires Attendance and Fee modules to have data; built last in the roadmap but designed first (its API contract shapes the other modules' data model).

### 3.2 Student Management
- **Purpose:** System of record for every enrolled student and their guardian(s).
- **Features:** Add/edit/deactivate student, assign class & section, capture guardian(s) with WhatsApp-enabled phone number, bulk import (CSV), student search/filter, academic year rollover (promote class), student profile page (attendance + fee summary in one place).
- **User flows:**
  - *Add student:* Admin → Students → "Add Student" → fill form (personal info, class/section, guardian info) → save → student appears in class roster and fee structure is auto-assigned based on class.
  - *Bulk import:* Admin → Students → Import → upload CSV using provided template → system validates rows (duplicate roll numbers, invalid phone formats) → shows preview with errors highlighted → confirm import.
  - *Promote/rollover:* Admin → Students → "Promote to Next Year" (bulk action, end of academic year) → select source class → target class → confirm.
- **Required screens:** Student List, Add/Edit Student (modal or full page — recommend full page given guardian sub-form complexity), Student Profile (view), Bulk Import wizard, Class & Section Setup.
- **Actions:** Create, edit, deactivate (soft delete — never hard delete, fee/attendance history must survive), search by name/roll no., filter by class/section/status.
- **Data required:** Name, roll number (unique per school+class), DOB, gender, class, section, admission date, status (active/inactive/graduated), 1+ guardian records (name, relationship, phone in E.164 format, WhatsApp opt-in flag, is-primary flag).
- **Permissions:** School Admin (full CRUD), Principal (read-only), Teacher (read-only, own class only), Accountant (read-only, needed for payment recording).
- **Dependencies:** Class/Section setup must exist first (Settings). Feeds Attendance, Fees, and Broadcast (guardian phone numbers).

### 3.3 Fee Management
- **Purpose:** Configure what students owe, record what they've paid, and always know who hasn't.
- **Features:** Fee category setup (Monthly Tuition, Annual Charges, Admission Fee, Other/custom), fee structure per class (amounts can vary by class), auto-generation of monthly fee invoices, payment recording (full/partial), outstanding balance calculation, defaulter list (current month, previous month, any selected month), fee history per student, class-wise collection report, receipt generation.
- **User flows:**
  - *Setup:* School Admin → Fees → Fee Structure → define categories & amounts per class → system generates invoices monthly (scheduled job, 1st of month) plus one-time invoices for admission/annual charges at enrollment/year start.
  - *Record payment:* Accountant → Fees → search student → select unpaid/partial invoice(s) → enter amount received → system marks invoice Paid or Partial, updates balance, timestamps payment, generates receipt.
  - *View defaulters:* Accountant/Principal → Fees → Defaulters → filter by month + class → see list with days-overdue and outstanding amount → optional: trigger a fee-reminder broadcast directly from this list.
- **Required screens:** Fee Structure Setup, Fee Dashboard (collection summary + filters), Student Fee Ledger (per-student, all invoices/payments), Record Payment modal, Defaulters List, Payment History/Receipts.
- **Actions:** Create fee category, assign structure to class, generate invoice (auto + manual override), record payment, mark partial, view/print receipt, export defaulter list.
- **Data required:** Fee categories (name, type: monthly/annual/admission/other, default amount), per-class fee structure, per-student invoice per billing period (amount due, amount paid, status, due date), payment records (amount, method, date, recorded-by).
- **Permissions:** School Admin (full), Accountant (full within fee module), Principal (read + reports), Teacher (none).
- **Dependencies:** Student Management (needs enrolled students + class), Class Setup. Feeds Dashboard and WhatsApp (fee reminder trigger) and Broadcast (defaulter audience).

### 3.4 Attendance Management
- **Purpose:** Fast daily attendance capture that triggers automated parent notification for absentees.
- **Features:** Mark daily attendance per class/section (bulk grid: tap to toggle Present/Absent/Late/Leave, default-all-present pattern), attendance register (historical view), edit/correct same-day attendance, school calendar (holidays/weekends excluded from attendance requirement), per-school communication window setting, automatic absence-notification job.
- **User flows:**
  - *Mark attendance:* Teacher logs in → Attendance → sees today's roster for their assigned class/section, defaulted to Present → taps students who are Absent/Late/Leave → Submit → system timestamps submission and, for each newly-marked-Absent student, schedules a notification job for `submission_time + school.absence_delay_minutes` (clamped to the communication window).
  - *Correct attendance:* Teacher/Admin → Attendance → today → edit a student's status before the notification fires → if changed away from Absent, the pending job is cancelled; if changed after the notification already sent, no re-notification (log a correction note instead).
- **Required screens:** Mark Attendance (grid), Attendance Register (historical, filter by class/date range), Attendance Summary (per class, per day — feeds dashboard), School Calendar/Holiday setup (Settings).
- **Actions:** Mark/bulk-mark, edit same-day, filter by class/section/date, export register.
- **Data required:** Per-student per-day status (Present/Absent/Late/Leave), marked-by, marked-at timestamp, school calendar (holiday dates, weekly off-days), per-school notification delay + communication window.
- **Permissions:** Teacher (mark for own assigned class/section only), School Admin/Principal (view all, edit any — override capability for corrections), Accountant (none).
- **Dependencies:** Student Management, Class/Section setup, School Calendar. Triggers WhatsApp Automation.

### 3.5 WhatsApp Automation
- **Purpose:** Turn defined events (absence, fee due, fee overdue) into personalized WhatsApp messages without staff intervention.
- **Features:** Event-triggered jobs (absence, fee reminder, fee overdue), message template library with variables, delivery status tracking, retry on failure, provider abstraction (swap BSP without app changes), audit log of every message sent.
- **User flows:** Fully automated for MVP triggers — Admin's only "flow" is configuring/approving templates once and monitoring the delivery log. (Manual/broadcast sending is Section 3.6.)
- **Required screens:** Message Templates (list + edit, shows Meta approval status), Notification Log (searchable: student, type, status, timestamp), WhatsApp Connection Settings (BSP credentials/sender number per school).
- **Actions:** Configure/edit template text (subject to BSP re-approval), view delivery log, manually retry a failed message, pause automation (kill switch) per school.
- **Data required:** Message templates (name, category, approved text with `{{variables}}`, BSP template ID, approval status), outbox/job queue records, delivery status per message.
- **Permissions:** School Admin (configure), Principal (view log only), Super Admin (manage BSP-level settings, view cross-tenant delivery health).
- **Dependencies:** Attendance (absence trigger), Fee Management (reminder/overdue triggers), a BSP account per school (Section 10).

### 3.6 Broadcast Messaging
- **Purpose:** Let staff manually reach a chosen audience with a custom or templated message.
- **Features:** Audience selector (whole school / class / section / selected students / absent-today / defaulters / staff), message composer with variable insertion and live preview, send-now, delivery status per recipient, message history.
- **User flows:** Admin/Principal → Broadcast → New Message → pick audience type + filters → pick or write template → preview shows resolved text for a sample recipient → Send → system enqueues one personalized message per resolved recipient → history shows sent/delivered/failed counts.
- **Required screens:** Broadcast Composer (audience + message + preview in one flow, likely a 3-step wizard), Broadcast History (list, each row expandable to per-recipient status).
- **Actions:** Select audience, insert variable, preview, send, view history, resend to failed recipients only.
- **Data required:** Campaign record (audience definition, message body/template, sent-by, sent-at), per-recipient delivery record.
- **Permissions:** School Admin (full), Principal (full), Accountant (fee-related audiences only — optional restriction), Teacher (none).
- **Dependencies:** Student/Guardian data, Fee Management (defaulter audience), Attendance (absent-today audience), same WhatsApp provider layer as 3.5.

### 3.7 Training Center
- **Purpose:** Reduce staff resistance to adoption by making "how do I do X" self-serve.
- **Features:** Modules organized by feature area, each with short video + step-by-step text + FAQ, search, "mark as viewed" tracking (lightweight — no certification/quizzes in MVP).
- **User flows:** Any user → Training (always in nav) → browse by module or search → watch video/read steps → optionally marked viewed automatically on open.
- **Required screens:** Training Home (module grid), Module Detail (video + steps + FAQ), Admin: Training Content Manager (Super Admin only — this is platform-wide content, not per-school).
- **Actions:** Browse, search, watch/read, (Super Admin) create/edit/reorder content.
- **Data required:** Training modules (title, module/feature area, order), training items (video URL, text steps, FAQ entries), optional per-user "viewed" flag.
- **Permissions:** All school-side roles (read-only), Super Admin (content management).
- **Dependencies:** None functionally — can be built any time, but should launch with content covering every other module before the School 2 demo.

---

## 4. Information Architecture (Sidebar Navigation)

```
Dashboard
Students
  ├─ All Students
  ├─ Add Student
  ├─ Bulk Import
  └─ Classes & Sections
Attendance
  ├─ Mark Attendance
  ├─ Attendance Register
  └─ School Calendar
Fees
  ├─ Fee Structure
  ├─ Record Payment
  ├─ Student Ledger
  └─ Defaulters
Communication
  ├─ Broadcast Message
  ├─ Message History
  ├─ WhatsApp Templates
  └─ Notification Log
Training Center
Settings
  ├─ School Profile
  ├─ Users & Roles
  ├─ Notification Rules (absence delay, comms window)
  └─ WhatsApp Connection
```

Role-based visibility: Teachers see only *Dashboard (their class widget), Attendance → Mark Attendance, Training Center*. Accountants see *Dashboard, Fees (full), Students (read-only), Training Center*. Super Admin has a **separate top-level shell** (not nested in a school's sidebar): `Platform Dashboard | Schools | Billing | Training Content | System Health`.

---

## 5. Screen-by-Screen Plan

For every screen: purpose, key components, and the three states that are easy to forget (empty, loading, error).

| # | Screen | Purpose | Key Components | Empty State | Loading | Error |
|---|---|---|---|---|---|---|
| 1 | Login | Authenticate | Email/phone + password form, "forgot password" link, school selection if email maps to >1 school (rare, edge case) | — | Skeleton on submit | Inline error under form ("invalid credentials") |
| 2 | Principal Dashboard | Daily overview | KPI cards, class-wise table, fee summary chart, defaulter widget, alerts feed, month/class filter bar | "No data yet — mark today's attendance to populate this dashboard" (new school) | Skeleton cards + chart placeholders | Per-widget error (one failed query doesn't blank the whole page) |
| 3 | Student List | Browse/manage students | Search bar, class/section/status filter, table (name, roll no, class, guardian phone, status), row actions (view/edit/deactivate), "Add Student" + "Bulk Import" buttons | "No students yet — add your first student or import a CSV" with CTA | Table skeleton | Toast + retry button |
| 4 | Add/Edit Student | Create/update student | Multi-section form (Personal, Class/Section, Guardian(s) — repeatable sub-form), phone number validator (E.164 + WhatsApp checkbox) | N/A (form) | Disabled submit + spinner | Field-level validation errors, top-of-form summary |
| 5 | Bulk Import | CSV import | File upload dropzone, downloadable template link, preview table with per-row validation flags, confirm/cancel | "Upload a CSV to begin" | Progress bar during parse | Row-level error table (which rows failed and why), partial-import summary |
| 6 | Student Profile | 360° view of one student | Header (name/class/photo placeholder), tabs: Overview / Attendance / Fees, guardian contact card, quick actions (mark absent today, record payment) | N/A | Skeleton tabs | Tab-level error |
| 7 | Classes & Sections | Configure structure | Table of classes, expandable to sections, add/edit/archive | "No classes yet — add your first class" | Table skeleton | Inline toast |
| 8 | Mark Attendance | Daily marking | Class/section picker, date (defaults today, locked to today+editable-same-day only for teachers), roster grid defaulted Present, status toggle per row, bulk "mark all present," Submit | "No students in this class" (misconfiguration guard) | Grid skeleton | Submission error banner, retry |
| 9 | Attendance Register | Historical view | Date range + class/section filter, table (student × date matrix or per-day list), export | "No attendance recorded for this range" | Table skeleton | Toast + retry |
| 10 | School Calendar | Holiday config | Calendar widget, list of holidays (add/remove), weekly-off-day selector | "No holidays configured" | Calendar skeleton | Inline toast |
| 11 | Fee Structure | Configure fee categories | Category list (Monthly/Annual/Admission/Other), per-class amount grid, add category modal | "No fee structure configured — set up your first fee category" | Table skeleton | Inline toast |
| 12 | Fee Dashboard | Collection overview | KPI cards (collected, outstanding, defaulter count), class-wise table, month picker | "No invoices generated yet" | Skeleton | Per-widget error |
| 13 | Student Ledger | Per-student fee history | Invoice list (period, amount, paid, balance, status badge), "Record Payment" button, payment history sub-table | "No invoices for this student yet" | Skeleton | Toast |
| 14 | Record Payment | Log a payment | Student search, outstanding invoice list (checkbox select), amount field (defaults to full, editable for partial), method, confirm | N/A (modal) | Button spinner | Validation error (amount exceeds balance, etc.) |
| 15 | Defaulters | Who hasn't paid | Month + class filter, table (student, class, amount due, days overdue), bulk-select → "Send Reminder" action | "No defaulters this month 🎉" | Table skeleton | Toast |
| 16 | Broadcast Composer | Send a message | Step 1 audience picker (type + filters, live recipient count), Step 2 message (template picker or free text + variable chips), Step 3 preview + send | N/A (wizard) | Recipient-count spinner, send-progress bar | Per-recipient failure summary post-send |
| 17 | Message/Broadcast History | Past sends | Table (date, audience, type, sent/delivered/failed counts), expandable per-recipient detail | "No messages sent yet" | Table skeleton | Toast |
| 18 | WhatsApp Templates | Manage templates | List (name, category, approval status badge), edit modal, "request approval" action | "No templates yet — add your first template" | List skeleton | Inline toast (approval-pending state is not an error) |
| 19 | Notification Log | Automated message audit | Filter (type, status, date), table (student, trigger, status, timestamp), manual retry action | "No notifications sent yet" | Table skeleton | Toast |
| 20 | Training Home | Browse help content | Module grid/cards, search bar | Not applicable — always seeded with content | Card skeleton | Toast |
| 21 | Training Module Detail | Learn a feature | Video embed, numbered steps, FAQ accordion | N/A | Video/content skeleton | "Video unavailable" fallback to text steps |
| 22 | Settings — School Profile | Branding/basics | Logo upload, school name/address, academic year config | N/A | Form skeleton | Field errors |
| 23 | Settings — Users & Roles | Staff accounts | Table of users, invite modal (email + role + class assignment for teachers), deactivate action | "No staff added yet besides you" | Table skeleton | Toast |
| 24 | Settings — Notification Rules | Automation config | Absence delay (minutes) input, communication window (start/end time) pickers, per-trigger enable/disable toggles | N/A | Form skeleton | Field errors |
| 25 | Settings — WhatsApp Connection | BSP setup | Connection status card, embedded-signup CTA, sender number display, test-message button | "Not connected — connect WhatsApp to enable automation" | Status spinner | Connection error with support link |
| 26 | Super Admin — Schools | Platform tenant list | Table of schools (name, plan, status, created date), add school, suspend/activate | "No schools yet" | Table skeleton | Toast |
| 27 | Super Admin — Platform Dashboard | Cross-tenant health | Active schools, messages sent (platform-wide), signups this month, system alerts | N/A | Skeleton | Per-widget error |

---

## 6. Dashboard UX (Principal Dashboard, in detail)

**What the principal must understand within 10 seconds:** *Is today normal? Is money coming in? Is anything broken?* Everything above the fold answers one of those three.

**Above the fold (no scrolling on a laptop screen):**
1. **KPI row (5 cards):** Total Students · Present Today (%) · Absent Today · Fee Collected This Month · Fee Outstanding This Month. Each card shows the number large, a small trend arrow vs. yesterday/last month, and is clickable to drill in.
2. **Alerts strip** (only renders if non-empty, sits directly under KPIs so it's never missed): e.g. "12 students absent 3+ days this month with no payment on file," "Class 8-B attendance below 70% today," "WhatsApp delivery failures: 4 messages today." Each alert links to the relevant filtered screen.
3. **Class-wise attendance table** (compact, all classes visible without scrolling — this is the "50 total / 45 present / 5 absent" example from the brief, one row per class): Class | Total | Present | Absent | Late | Fee Paid (this month) | Fee Unpaid.

**Below the fold (scroll for detail/trend):**
4. **Fee collection trend chart** — simple bar or line, last 6 months collected vs. outstanding.
5. **Defaulters snapshot table** — top N by amount overdue, current + previous month toggle, "View all" link to full Defaulters screen.
6. **New admissions this month** — small counter + mini-list.
7. **Class-wise student strength chart** — horizontal bar, one bar per class.

**Filters (persistent top bar, not buried):** Month selector (defaults to current month), Class selector (defaults to "All Classes"). Changing either re-queries every widget on the page — this is the "select different months and classes" requirement, applied globally rather than per-widget so the principal doesn't have to set it five times.

**Visual tone:** card-based, generous white space, one accent color for positive/negative deltas (green/red), neutral grays otherwise — explicitly *not* the dense multi-color-per-cell grid style of legacy ERPs. See Section 15 for the full design system.

---

## 7. Database Architecture (PostgreSQL, multi-tenant via shared schema + `school_id`)

**Tenancy strategy:** every tenant-scoped table carries a `school_id` foreign key to `schools`. A Prisma middleware (or a thin repository layer) auto-injects `WHERE school_id = :currentSchoolId` on every query, and Postgres Row-Level Security policies enforce the same rule at the database layer as defense-in-depth (protects against a missed middleware call, not just app bugs). `Users` with role `SUPER_ADMIN` bypass tenant scoping by design (their queries run outside RLS via a privileged role or explicit cross-tenant service).

### Core Entities

| Entity | Key Fields | Relationships | Notes |
|---|---|---|---|
| `School` | id (PK), name, address, logo_url, academic_year_start, status (active/suspended), plan, created_at | has many Users, Classes, Students | The tenant root. |
| `User` | id (PK), school_id (FK, null for Super Admin), name, email (unique), phone, password_hash, role (enum), status, created_at | belongs to School; has many TeacherClassAssignment | Single `role` enum column is enough for MVP — no need for a separate roles/permissions table yet. |
| `TeacherClassAssignment` | id, user_id (FK), class_id (FK), section_id (FK) | join table | Scopes a Teacher's attendance-marking rights. |
| `AcademicYear` | id, school_id, label (e.g. "2026-27"), start_date, end_date, is_current | belongs to School | Needed for promotion/rollover and historical reporting. |
| `Class` | id, school_id, name (e.g. "Class 5"), order_index | has many Sections, Students | |
| `Section` | id, class_id, name (e.g. "A") | belongs to Class | |
| `Student` | id, school_id, class_id, section_id, roll_number, full_name, dob, gender, admission_date, status (active/inactive/graduated), created_at | belongs to Class/Section; has many Guardians (via StudentGuardian), Invoices, AttendanceRecords | Unique constraint on (school_id, class_id, roll_number). |
| `Guardian` | id, school_id, full_name, relationship (father/mother/other), phone_e164, whatsapp_opt_in (bool) | many-to-many with Student via `StudentGuardian` | A guardian can have multiple children at the same school (siblings) — model as M:N, not 1:1. |
| `StudentGuardian` | student_id, guardian_id, is_primary (bool) | join table | `is_primary` decides who gets the default WhatsApp notification if multiple guardians are linked. |
| `FeeCategory` | id, school_id, name, type (enum: MONTHLY, ANNUAL, ADMISSION, OTHER), is_recurring | belongs to School | |
| `FeeStructureItem` | id, school_id, class_id, fee_category_id, academic_year_id, amount | defines the amount owed per class per category per year | |
| `Invoice` | id, school_id, student_id, fee_category_id, period_label (e.g. "2026-09" or "Annual 2026-27"), amount_due, amount_paid, status (enum: UNPAID, PARTIAL, PAID), due_date, created_at | belongs to Student | **This is the ledger — one row per student per billing period per category.** Never a boolean on the student. |
| `Payment` | id, school_id, invoice_id, amount, method (cash/bank/other), received_by (user_id), paid_at | belongs to Invoice | An invoice can have multiple partial payments summing toward `amount_paid`. |
| `AttendanceRecord` | id, school_id, student_id, class_id, section_id, date, status (enum: PRESENT, ABSENT, LATE, LEAVE), marked_by (user_id), marked_at, corrected_at (nullable) | belongs to Student | Unique constraint on (student_id, date). |
| `SchoolCalendarDay` | id, school_id, date, type (enum: HOLIDAY, WEEKEND), label | belongs to School | Attendance and notification jobs both check this before acting. |
| `NotificationRule` | id, school_id, trigger_type (enum: ABSENCE, FEE_REMINDER, FEE_OVERDUE), delay_minutes, is_enabled, comms_window_start, comms_window_end | belongs to School | Per-school configurability from CTO Note #1. |
| `MessageTemplate` | id, school_id, name, category (enum: ABSENCE, FEE_REMINDER, FEE_OVERDUE, ANNOUNCEMENT, CUSTOM), body_text (with `{{variables}}`), bsp_template_id, approval_status | belongs to School | |
| `NotificationJob` | id, school_id, student_id (nullable for broadcasts), trigger_type, template_id, scheduled_for, status (enum: PENDING, CANCELLED, SENT, FAILED), attempts, last_error | the queue's durable record | Cancelled if underlying condition resolves before `scheduled_for` (e.g., attendance corrected). |
| `BroadcastCampaign` | id, school_id, created_by, audience_type (enum: ALL, CLASS, SECTION, STUDENTS, ABSENT_TODAY, DEFAULTERS, STAFF), audience_filter (JSON), template_id or raw_body, sent_at | belongs to School | `audience_filter` stores the *definition*, resolved at send time (CTO Note #4). |
| `MessageDelivery` | id, campaign_id (nullable), notification_job_id (nullable), recipient_phone, status (enum: QUEUED, SENT, DELIVERED, READ, FAILED), provider_message_id, error, updated_at | one row per actual message sent, whether from automation or broadcast | Single delivery-tracking table shared by both flows (3.5 and 3.6). |
| `TrainingModule` | id, feature_area, title, order_index | platform-wide (no school_id) | |
| `TrainingItem` | id, module_id, type (video/steps/faq), content | belongs to TrainingModule | |
| `AuditLog` | id, school_id, user_id, action, entity_type, entity_id, metadata (JSON), created_at | cross-cutting | Every fee edit, student delete, role change, and Super Admin impersonation is logged here (Section 21). |

**Indexes worth calling out explicitly:** `(school_id, class_id, section_id, date)` on `AttendanceRecord` (dashboard's hottest query), `(school_id, status, period_label)` on `Invoice` (defaulter queries), `(school_id, created_at)` on `AuditLog`, and a partial index on `NotificationJob (status) WHERE status = 'PENDING'` for the scheduler's polling query.

---

## 8. Backend Architecture (Node.js + TypeScript + Express + PostgreSQL + Prisma)

**Layered structure**, one folder per concern, feature-grouped inside each layer so a module (e.g. "fees") stays cohesive:

```
src/
  api/v1/
    auth/            (routes, controller, validation schema)
    students/
    fees/
    attendance/
    dashboard/
    broadcasts/
    notifications/
    training/
    settings/
  services/          (business logic — one service per domain, framework-agnostic)
  repositories/       (Prisma queries only — no business logic here)
  jobs/               (BullMQ workers: absence-check, fee-reminder, message-send, retry)
  middleware/
    auth.middleware.ts        (JWT verification)
    tenant.middleware.ts      (injects school_id from token into request context)
    rbac.middleware.ts        (role gate per route)
    validate.middleware.ts    (zod schema validation)
    error.middleware.ts       (central error handler)
    audit.middleware.ts       (writes AuditLog for mutating routes)
  providers/
    whatsapp/          (interface + BSP-specific adapter — see Section 10)
  lib/                (prisma client singleton, logger, config)
  prisma/
    schema.prisma
    migrations/
  app.ts
  server.ts
```

**Controllers** parse/validate the request and call a service — no business logic in controllers. **Services** hold business rules (e.g. "an invoice can't be marked PAID if amount_paid < amount_due") and orchestrate repositories + jobs. **Repositories** are the only layer that imports Prisma directly, which keeps a future swap or a read-replica strategy contained.

**Validation:** zod schemas per route, shared between request-body validation and (optionally) generating TypeScript types, so the API contract and runtime validation never drift.

**Error handling:** a single `AppError` class (statusCode, code, message) thrown from services; the central error middleware maps it to a consistent JSON error shape (`{ error: { code, message, details? } }`) and logs 5xx errors with full context while 4xx errors log at info level.

**Authentication:** JWT (short-lived access token ~15 min + refresh token ~7 days, refresh token stored httpOnly cookie). Password hashing with bcrypt (cost factor 12).

**Authorization:** `rbac.middleware.ts` declares allowed roles per route (`requireRole(['SCHOOL_ADMIN', 'PRINCIPAL'])`); `tenant.middleware.ts` runs on every authenticated route before any service call, so no controller can accidentally skip tenant scoping.

**Logging:** structured JSON logs (pino), request-id correlation, separate audit trail (AuditLog table) from operational logs.

**API versioning:** all routes under `/api/v1`; a new major version gets its own route tree (`/api/v2`) rather than breaking v1, standard practice for a product with a mobile/future-integration surface.

---

## 9. API Design (MVP — representative endpoints)

All endpoints require `Authorization: Bearer <token>` unless marked Public. All responses: `{ data, meta? }` on success, `{ error }` on failure.

**Auth**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/api/v1/auth/login` | Public | Email+password → access+refresh tokens |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Issue new access token |
| POST | `/api/v1/auth/logout` | Bearer | Invalidate refresh token |
| POST | `/api/v1/auth/forgot-password` | Public | Send reset link |

**Students**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/students?classId=&sectionId=&status=&q=` | Bearer (all roles, scoped) | List/search students |
| POST | `/api/v1/students` | SchoolAdmin | Create student + guardian(s) |
| GET | `/api/v1/students/:id` | Bearer | Student profile |
| PATCH | `/api/v1/students/:id` | SchoolAdmin | Update student/guardian |
| DELETE | `/api/v1/students/:id` | SchoolAdmin | Soft-deactivate |
| POST | `/api/v1/students/import` | SchoolAdmin | Bulk CSV import (multipart) |

**Classes/Sections**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/classes` | Bearer | List classes+sections |
| POST | `/api/v1/classes` | SchoolAdmin | Create class |
| POST | `/api/v1/classes/:id/sections` | SchoolAdmin | Add section |

**Attendance**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/attendance?classId=&sectionId=&date=` | Bearer | Get roster + today's status |
| POST | `/api/v1/attendance` | Teacher/Admin | Submit bulk attendance `{ date, classId, sectionId, records: [{studentId, status}] }` — triggers notification job scheduling for new ABSENT entries |
| PATCH | `/api/v1/attendance/:id` | Teacher/Admin | Correct a single record (cancels pending job if applicable) |
| GET | `/api/v1/attendance/register?classId=&from=&to=` | Bearer | Historical register |

**Fees**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/fees/structure` | Bearer | View fee categories + class amounts |
| POST | `/api/v1/fees/structure` | SchoolAdmin | Create/update category or class amount |
| GET | `/api/v1/fees/invoices?studentId=&period=&status=` | Bearer | Query invoices |
| POST | `/api/v1/fees/invoices/generate` | SchoolAdmin (or system job) | Generate monthly invoices |
| POST | `/api/v1/fees/payments` | Accountant | Record payment `{ invoiceId, amount, method }` |
| GET | `/api/v1/fees/defaulters?period=&classId=` | Bearer | Defaulter list |

**Dashboard**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/dashboard/summary?month=&classId=` | Bearer | All KPI cards in one call |
| GET | `/api/v1/dashboard/attendance-by-class?month=&classId=` | Bearer | Class-wise table data |
| GET | `/api/v1/dashboard/fee-trend?months=6` | Bearer | Chart data |
| GET | `/api/v1/dashboard/alerts` | Bearer | Computed alert list |

**Notifications & Broadcasts**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/notifications/log?type=&status=&from=&to=` | Bearer | Automated message audit |
| POST | `/api/v1/notifications/:id/retry` | SchoolAdmin | Manual retry |
| GET | `/api/v1/broadcasts/audience-preview` | SchoolAdmin/Principal | `{ audienceType, filters }` → resolved recipient count |
| POST | `/api/v1/broadcasts` | SchoolAdmin/Principal | Create + send campaign |
| GET | `/api/v1/broadcasts` | Bearer | History |
| GET | `/api/v1/broadcasts/:id` | Bearer | Per-recipient delivery detail |
| GET | `/api/v1/templates` | SchoolAdmin | List templates |
| POST | `/api/v1/templates` | SchoolAdmin | Create + submit for BSP approval |

**Training**
| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/v1/training/modules` | Bearer | List modules |
| GET | `/api/v1/training/modules/:id` | Bearer | Module detail |
| POST | `/api/v1/training/modules` | SuperAdmin | Create (platform content) |

---

## 10. WhatsApp Architecture

**Event flow (the exact chain from the brief, made concrete):**

```
Teacher submits attendance (POST /attendance)
        ↓
Service layer diffs new ABSENT records
        ↓
For each new-absent student → create NotificationJob
    (status = PENDING, scheduled_for = now + school.absence_delay_minutes,
     clamped into [comms_window_start, comms_window_end] of the SAME day,
     or rolled to next school day if outside window and school is closed by then)
        ↓
BullMQ delayed job enqueued with the same scheduled_for
        ↓
[If attendance is corrected before scheduled_for] → job.status = CANCELLED, BullMQ job removed
        ↓
Worker fires at scheduled_for → re-checks current AttendanceRecord.status in DB
        ↓
If still ABSENT → resolve template + variables → call WhatsApp provider.send()
        ↓
NotificationJob.status = SENT (or FAILED) → MessageDelivery row created/updated
        ↓
BSP delivery webhook later updates MessageDelivery.status (SENT→DELIVERED→READ, or FAILED)
```

**Why re-check at send time, not just at schedule time:** this is the fix for "attendance corrected before notification" and "duplicate notifications" from the brief — the job is a *plan*, not a commitment; the worker is the single source of truth at execution time.

**Queue & scheduling technology (practical, not over-engineered):** **BullMQ on Redis.** It's the standard Node.js job queue, supports delayed jobs natively (exactly what "wait 1 hour" needs), has built-in retry with exponential backoff, and a dashboard (Bull Board) for ops visibility — no need for Kafka, SQS, or a custom scheduler at this scale. One Redis instance (managed, e.g. Upstash or Railway Redis) is enough for MVP and scales to tens of thousands of daily jobs comfortably.

**Retry mechanism:** 3 attempts with exponential backoff (e.g. 1 min, 5 min, 20 min) on transient provider errors (timeout, rate limit); permanent failures (invalid number, template rejected) go straight to FAILED with the error recorded, surfaced in the Notification Log for manual follow-up — never silently dropped.

**Provider abstraction:** a `WhatsAppProvider` interface (`sendTemplateMessage()`, `getDeliveryStatus()`, `registerTemplate()`) with one concrete adapter for MVP. **Recommendation: a BSP with Embedded Signup support** (e.g. Wati, Gupshup, or 360dialog — evaluate current pricing/Pakistan support at commercial-decision time; the interface makes switching a one-adapter change, not a rewrite) rather than raw Meta Cloud API. Reasoning: Meta shifted to **per-message billing in mid-2025** across four categories — Marketing, Utility, Authentication, and free-form Service messages (free and unlimited when a parent messages first) — and *Utility* is the category your absence/fee notifications fall under, which is inexpensive at Pakistani/South-Asian rates; but the bigger practical cost for MVP speed is Meta's own WABA verification and per-template approval process, which a BSP's Embedded Signup flow streamlines for onboarding *many schools* under one Tech Provider relationship. Direct Cloud API becomes worth revisiting once you're past ~30-50 schools and the BSP markup outweighs its convenience.

**Templates & variables:** every automated message is a pre-approved WhatsApp template (Meta requires this outside the 24-hour free-form service window). Variable resolution happens server-side before send (`{{parent_name}}`, `{{student_name}}`, `{{class}}`, `{{section}}`, `{{amount}}`, `{{due_date}}`) — never client-side, so a template can't be sent with unresolved placeholders.

**Logging:** every send attempt (success or failure) is a `MessageDelivery` row; combined with `NotificationJob` this gives a full audit trail from "attendance marked" to "parent read the message" for every student, every day — which is itself a sellable feature in the School 2 demo ("here's proof every absent parent was notified").

---

## 11. Fee System Logic

```
Student enrolled → assigned to Class
        ↓
FeeStructureItem defines amount per category per class per academic year
        ↓
Scheduled job (1st of month, or on enrollment for admission fee) generates
an Invoice per student per recurring FeeCategory for that period
        ↓
Accountant records a Payment against an Invoice (full or partial)
        ↓
Invoice.amount_paid updated → status recalculated:
    amount_paid = 0            → UNPAID
    0 < amount_paid < amount_due → PARTIAL
    amount_paid >= amount_due    → PAID
        ↓
Dashboard & Defaulter queries read directly from Invoice (no separate cache needed at MVP scale;
introduce a materialized view only if the school count grows large enough to matter)
        ↓
If UNPAID or PARTIAL past due_date → student appears in Defaulters for that period
        ↓
NotificationRule (FEE_REMINDER before due date, FEE_OVERDUE after) schedules the same
job pipeline as attendance, keyed to Invoice due dates instead of attendance events
```

**Monthly vs. annual handling:** Monthly Tuition is `is_recurring = true` → the generation job creates one Invoice per student per month automatically. Annual Charges and Admission Fee are `is_recurring = false` → generated once (at year start / at enrollment) and simply *displayed* against all 12 months in the UI as "already settled" rather than re-billed — this satisfies "annual charges paid/unpaid" without re-invoicing monthly.

**Historical months:** because every period is its own `Invoice` row, "any selected month's fee status" is just a filtered query (`period_label = '2026-06'`) — no recomputation, no drift, and a student who joined mid-year simply has no Invoice rows before their admission date (correctly excluded from earlier defaulter lists).

---

## 12. Attendance Logic

**States:** Present, Absent, Late, Leave — Late and Leave do **not** trigger the absence-notification job (only Absent does; a school can extend this later without a schema change since the trigger check is `status === 'ABSENT'`).

**The 1-hour rule, precisely:**
1. Teacher submits attendance for a class/section at time `T`.
2. For every student newly marked ABSENT, create a `NotificationJob` with `scheduled_for = T + delay_minutes` (default 60, per-school configurable).
3. Clamp `scheduled_for` into the school's `comms_window` (e.g. 07:00–18:00). If `T + delay` falls after the window closes, reschedule to `comms_window_start` the *next school day* (skipping weekends/holidays via `SchoolCalendarDay`) — never send a "your child was absent" message at 9 PM or on a day the parent wouldn't expect one.
4. If a teacher/admin edits that student's record away from ABSENT before `scheduled_for`, the job is cancelled (`status = CANCELLED`) and removed from the queue.
5. At `scheduled_for`, the worker re-reads the current `AttendanceRecord` — if it's still ABSENT, send; if it changed, mark the job `CANCELLED` and do nothing (covers a correction that happened in the last few seconds/minutes before firing, a race the naive "cancel on edit" step alone wouldn't catch if the edit and the fire happen concurrently).
6. **Duplicate-notification guard:** a unique constraint on `(student_id, date, trigger_type)` in `NotificationJob` — a second attendance submission for the same student/day (e.g. accidental re-submit) upserts the existing job rather than creating a second one.
7. **Weekends/holidays:** the "Mark Attendance" screen doesn't even render a roster for a date in `SchoolCalendarDay`, so no attendance — and therefore no notification — can be created for a non-school day.
8. **Different school timings:** `comms_window` and `delay_minutes` are per-school Settings, not hardcoded, so a school with an 8 AM start and one with a 7 AM start both get sensible behavior without a code change.

---

## 13. WhatsApp Broadcast System

- **Audience selection:** a typed `audience_type` (ALL, CLASS, SECTION, STUDENTS, ABSENT_TODAY, DEFAULTERS, STAFF) plus a `filters` JSON (e.g. `{classId, sectionId}` or `{studentIds: [...]}` or `{period: '2026-09'}` for defaulters). The composer calls `/broadcasts/audience-preview` live as filters change, showing "This will reach 42 parents" before send — resolved fresh, never from a stale cached list (CTO Note #4).
- **Message composer:** pick an existing approved template (fast path, required for anything outside an active 24h service window) or compose free text (only usable for recipients inside an active service-window conversation — the UI should make this distinction visible, not silently fail).
- **Personalization variables:** the same variable set as automated messages (`parent_name`, `student_name`, `class`, `section`, `fee_amount`, `due_date`) — one shared resolver function used by both the automation engine (Section 10) and the broadcast composer, so variable behavior never diverges between the two.
- **Preview:** renders the resolved message for one sample recipient before send is enabled.
- **Sending/queue:** identical BullMQ pipeline as automated notifications — a broadcast is simply N `MessageDelivery` rows enqueued at once under one `BroadcastCampaign` id, rather than one row under a `NotificationJob`.
- **Delivery status & failed messages:** campaign detail view aggregates per-recipient status (queued/sent/delivered/read/failed) with a "resend to failed only" action.
- **Message history:** `BroadcastCampaign` list, most recent first, with sent-by and audience summary for accountability (useful when a principal asks "who sent that message to all of Class 6's parents").

---

## 14. Training Center Architecture

Kept deliberately simple — this is a lightweight content system, not a full LMS (that's explicitly Phase 2+ territory, and conflating it with the actual Parent-facing LMS would violate the MVP scope rule).

- **Content model:** `TrainingModule` (one per feature area — Students, Attendance, Fees, Communication) containing ordered `TrainingItem`s, each either a video (hosted URL — start with a simple CDN/S3-hosted MP4 or an unlisted YouTube embed, no need for a video platform at MVP), a step-by-step text block, or an FAQ entry.
- **Admin authoring:** Super Admin only, since content is platform-wide (all schools see the same Training Center — a school never needs its own custom tutorials for a shared product). A simple admin form: title, feature area, order, upload video or paste URL, markdown text for steps, repeatable FAQ Q&A pairs.
- **Tracking:** MVP only needs "has this user opened this module" (a simple `TrainingView(user_id, item_id, viewed_at)` row) — enough to let a School Admin see "my staff haven't opened the Fees tutorial yet" without building quizzes or completion certificates.
- **Organization:** module grid on the home screen mirrors the sidebar's module names exactly, so the mental model is "stuck on X? Training Center has an X section" — zero ambiguity.

---

## 15. UI/UX Design System

**Direction:** clean SaaS admin aesthetic in the spirit of Linear/Stripe/modern dashboards — generous whitespace, restrained color, information density achieved through layout discipline rather than visual noise. This is the single biggest lever against "looks like an old ERP."

- **Color:** one primary brand color (a confident blue or teal reads as trustworthy/institutional for a school product) used sparingly for primary actions and active states; a neutral gray scale (8-10 steps) for all structure/text/borders; semantic colors reserved *only* for status — green (paid/present/success), amber (partial/late/warning), red (unpaid/absent/error) — and never used decoratively elsewhere, so when the principal sees red, it means something.
- **Typography:** one type family (Inter or similar geometric sans), a tight scale (5-6 sizes), numbers in a tabular-figure variant for tables/KPI cards so digits align.
- **Spacing:** 4px base unit, consistent 8/16/24/32 rhythm; cards get generous internal padding (16-24px) — this alone is what makes a dashboard feel "premium" vs. "cramped ERP."
- **Cards:** subtle border or shadow (not both), rounded corners (8-10px), KPI cards lead with the number (large, bold) and a small label beneath — not the reverse.
- **Tables:** zebra-striping avoided (reads as dated); instead rely on row hover states, sticky headers on scroll, right-aligned numeric columns, and status badges (pill-shaped, colored per semantic palette) rather than colored row backgrounds.
- **Buttons:** one filled primary style per screen (never two competing primary actions), ghost/outline for secondary, destructive actions get a red outline + confirmation step, never a filled red button fired on first click.
- **Forms:** labels above fields (not placeholder-as-label — placeholders disappear and hurt usability, a real problem for less tech-savvy school staff), inline validation on blur, clear required-field marking.
- **Modals:** used for quick single-object actions (record payment, add section); anything multi-step (broadcast composer, bulk import) is a full-page wizard instead — modals that scroll internally are a common ERP-era anti-pattern to avoid.
- **Charts:** minimal gridlines, direct labeling over legends where possible, the same semantic color palette as everywhere else (a "present" bar and a "paid" bar are both green — reinforces the mental model).
- **Status badges:** consistent pill component used everywhere a status appears (Paid/Partial/Unpaid, Present/Absent/Late/Leave, Delivered/Failed) — one component, reused, never a bespoke badge per screen.
- **Responsive behavior:** MVP is desktop-first (this is how school office staff work) but the Dashboard and Attendance screens specifically must be usable on a tablet/large phone, since teachers marking attendance and a principal checking the dashboard on the go are the two most likely mobile-context uses.

---

## 16. MVP Development Roadmap

| Phase | Features | Backend | Frontend | Database | Dependencies | Definition of Done |
|---|---|---|---|---|---|---|
| **0 — Architecture & Setup** | Repo, CI/CD skeleton, design tokens | Express app skeleton, Prisma init, env config, logging | Next.js app skeleton, design system tokens/components (buttons, cards, badges), auth pages shell | Base schema: School, User, roles enum | None | A deployed "hello world" behind login, CI runs lint+typecheck+test on every PR |
| **1 — Auth & School Setup** | Login, RBAC, School Admin can create staff | JWT auth, tenant middleware, RBAC middleware, user CRUD API | Login screen, Users & Roles settings screen, protected route shell per role | User, TeacherClassAssignment, AcademicYear | Phase 0 | A School Admin can log in, invite a Teacher/Accountant/Principal, each sees the correctly-scoped nav |
| **2 — Student Management** | Classes/Sections, Student CRUD, bulk import | Student/Class/Section services+APIs, CSV parser+validator | Student List, Add/Edit, Bulk Import, Classes & Sections screens | Class, Section, Student, Guardian, StudentGuardian | Phase 1 | 100 students importable via CSV in under a minute, search/filter works, guardian phone validated to E.164 |
| **3 — Fee Management** | Fee structure, invoice generation, payment recording, defaulters | Fee services, invoice generation job, payment API, defaulter query | Fee Structure, Student Ledger, Record Payment, Defaulters screens | FeeCategory, FeeStructureItem, Invoice, Payment | Phase 2 | A payment recorded updates ledger + defaulter list correctly, including partial payments |
| **4 — Attendance** | Daily marking, register, calendar | Attendance API, School Calendar API | Mark Attendance grid, Register, Calendar setup | AttendanceRecord, SchoolCalendarDay | Phase 2 | Teacher can mark a full class in under 30 seconds, corrections work same-day |
| **5 — WhatsApp Automation** | Absence + fee reminder triggers, provider integration | BullMQ setup, WhatsApp provider adapter, NotificationJob/Rule services, delivery webhook handler | Notification Log, Notification Rules settings, WhatsApp Connection settings | NotificationRule, MessageTemplate, NotificationJob, MessageDelivery | Phase 4 (attendance) + Phase 3 (fees) + BSP account provisioned | An absent student's parent receives a real WhatsApp message within the configured delay, in a sandbox/test number first |
| **6 — Broadcast Messaging** | Manual audience-based messaging | Audience resolver, broadcast send API (reuses Phase 5's queue) | Broadcast Composer wizard, History screen | BroadcastCampaign (reuses MessageDelivery) | Phase 5 | A message to "all Class 6 parents" reaches every resolved recipient, history shows accurate counts |
| **7 — Training Center** | Help content system | Training CRUD API (Super Admin) | Training Home, Module Detail, Admin content manager | TrainingModule, TrainingItem, TrainingView | None (parallelizable anytime) | Every other module has at least one populated training article before Phase 10 demo |
| **8 — Dashboard & Analytics** | Principal Dashboard | Aggregation endpoints (summary, by-class, trend, alerts) | Full Dashboard screen per Section 6 | (reads existing tables; add indexes) | Phases 2-6 must have real data to aggregate | Dashboard loads in under 2s with realistic seed data, all filters work |
| **9 — Testing & Security** | Hardening | Test suites (Section 20), rate limiting, audit logging, RLS policies | Accessibility/responsive pass on Dashboard+Attendance | AuditLog | All prior phases | All P0 test cases in Section 20 pass, tenant-isolation test suite passes |
| **10 — Deployment & Demo** | Go-live prep | Production deploy, backups, monitoring | Final polish pass | Seed data script (Section 19) | All prior phases | School 2 demo runs end-to-end from the seeded data without a hiccup |

Phases 5 and 6 share infrastructure deliberately — building the queue/provider layer once and reusing it for broadcasts is why they're sequenced back-to-back.

---

## 17. MVP Priority (P0 / P1 / P2)

| Feature | Priority | Rationale |
|---|---|---|
| Login, RBAC, tenant isolation | P0 | Nothing works without it |
| Student CRUD + guardian phone capture | P0 | Every other module depends on it |
| Class/Section setup | P0 | Structural prerequisite |
| Bulk CSV import | P0 | Required to seed a real school's data without weeks of manual entry — a School 2 blocker if missing |
| Mark attendance (daily grid) | P0 | Core demo feature |
| Attendance register (history) | P1 | Needed for credibility but not for the live demo moment |
| Fee structure setup | P0 | Prerequisite for invoices |
| Invoice generation (monthly) | P0 | Core demo feature |
| Payment recording (full/partial) | P0 | Core demo feature |
| Defaulters list | P0 | Explicitly requested by School 2 |
| Student fee ledger/history | P1 | Valuable but not the headline demo moment |
| Absence → WhatsApp automation (1hr delayed) | P0 | THE signature feature — this is what makes School 2 say yes |
| Fee reminder/overdue WhatsApp | P1 | Same pipeline as absence; nice to show but not the make-or-break moment |
| Broadcast messaging (all audiences) | P0 | Explicitly requested, second signature feature |
| WhatsApp delivery status tracking | P1 | Important for trust, not essential for the demo's first impression |
| Message/notification history & logs | P1 | Important for support/ops, not demo-critical |
| Principal Dashboard (full, per Section 6) | P0 | The "wow" screen — do not ship the MVP without this looking premium |
| Training Center | P0 | Explicitly requested to solve the adoption/training objection School 1 raised |
| School Calendar (holidays) | P1 | Needed for correct notification logic, but a hardcoded weekend rule can ship first and calendar UI can follow |
| Notification rule configurability (delay/window) | P1 | Sensible defaults work for the demo; configurability matters for real onboarding, right after |
| Super Admin platform console | P1 | You need it before onboarding School 2 for real, but not for the demo itself (seed data can be inserted directly) |
| Receipt PDF generation | P2 | Nice-to-have, easy to add post-MVP |
| Academic year rollover/promotion | P2 | Only matters at year-end, months after launch |
| Audit log UI (viewing, not the logging itself) | P2 | Logging happens from day one (security requirement); a UI to browse it can wait |

---

## 18. Demo Strategy for School 2 (10-15 minutes)

**Goal:** the principal should leave the room believing two things — "this is dramatically easier to use than what I have now" and "this already solves my two biggest headaches (absence calls, chasing fees) without me lifting a finger."

**Flow:**
1. **(1 min) Dashboard first, cold open.** Log in as Principal directly onto the Dashboard. Don't explain it yet — let the visual contrast with DeltaSoft-style screens land first, *then* narrate: "This is everything you need to know about your school this morning, in one screen."
2. **(2 min) Add a student.** Show how fast it is — this is the "yes, this replaces manual registers" moment. Mention bulk import exists for onboarding all 300+ existing students in one afternoon, not one-by-one.
3. **(2 min) Fee structure + record a payment.** Show a class's fee structure, then record a partial payment for a seeded student, and immediately show their ledger update.
4. **(1 min) Show a fee defaulter list.** "Here's every parent who hasn't paid this month, in one click" — contrast with them checking a register manually.
5. **(3 min) Mark a student absent — then show the automation, live or via a fast-forwarded log.** This is the centerpiece. Mark "Ahmed Khan, 5-A" absent. Explain the 1-hour delay logic in one sentence. Then jump to the Notification Log pre-seeded with a message that already "sent" a moment ago (or, if a live WhatsApp sandbox number is set up, actually receive the message on a phone in the room — far more persuasive if feasible).
6. **(2 min) Broadcast a message.** Send an announcement to "all of Class 5's parents" live, show the recipient count resolve in real time, send it, show the delivery status update.
7. **(1 min) Training Center.** Open the Attendance tutorial. One line: "Any staff member who's unsure how to do something has a 2-minute video right inside the system — no separate training day needed." This directly answers School 1's stated objection and preempts School 2 raising the same one.
8. **(2 min) Close on positioning.** One slide/sentence: cloud-based, no server to maintain, works on any device, and — critically — you don't need a Parent Portal app for parents to feel informed, because WhatsApp already reaches them where they already are.

**Seed data needed for this flow specifically:** at least one class (5-A) with the demo student "Ahmed Khan" pre-existing but *not yet* marked absent (so the live marking is real), a handful of other students in 5-A already marked present, a fee structure for Class 5 already configured, 2-3 students in Class 5 already showing as fee defaulters (for the defaulter-list moment), and a Notification Log with a handful of prior entries so it doesn't look empty.

---

## 19. Seed / Demo Data

To make the Dashboard and reports look like a real, living school rather than an empty shell:

- **Classes:** 8 (Nursery/KG through Class 8, or per the actual target school's structure), each with 2 sections (A/B).
- **Students:** 120-150 total, unevenly distributed (30-35 per lower class down to 10-15 per upper class, matching real enrollment taper).
- **Guardians:** one primary guardian per student minimum, ~15% of students with two linked guardians (siblings sharing a guardian, and dual-parent contacts) to exercise the M:N model.
- **Teachers:** 8-10, each assigned as class-incharge to one section.
- **Fee structure:** Monthly Tuition (varying by class, e.g. Rs. 3,000-8,000), one Annual Charges line, one Admission Fee line (only populated for students admitted "this year").
- **Fee records:** 3 months of historical invoices per student with a realistic distribution — roughly 80% paid on time, 12% partial, 8% unpaid/defaulting, so the Dashboard's collection percentage and the Defaulters screen both look plausible rather than either 100% or 0%.
- **Attendance:** 20-30 school days of history per student with a realistic ~92-95% presence rate and a few students with a deliberately poor attendance pattern (for the "3+ absences" alert to have something to show).
- **WhatsApp/notification history:** 40-60 historical `MessageDelivery` rows mixing absence notifications, fee reminders, and one past broadcast campaign, with a small number (2-3) intentionally marked FAILED — a dashboard/log with zero failures ever looks fake to a technical evaluator, and showing you handle failure gracefully builds more trust than pretending it never happens.
- **New admissions:** 4-5 students with an admission date inside the current month, to populate that KPI meaningfully.

A single idempotent seed script (`prisma/seed.ts`) should generate all of this so the demo environment can be reset instantly before every showing.

---

## 20. Testing Strategy

| Layer | Focus | Key cases |
|---|---|---|
| **Unit** | Services (business logic in isolation, DB mocked) | Invoice status transitions (unpaid→partial→paid), notification delay/clamp math across comms-window edges, defaulter query logic, variable-resolution for templates |
| **API/Integration** | Route → service → real test DB | Full CRUD per resource, validation error shapes, RBAC rejection (403) per role/route matrix, tenant isolation (a token from School A can never read/write School B's rows, tested exhaustively, not spot-checked) |
| **Authentication** | Token lifecycle | Expired token rejected, refresh flow works, password hash never returned in any response, brute-force login attempts rate-limited |
| **Authorization (RBAC)** | Per-role matrix | Every endpoint × every role, asserting exactly the allowed roles succeed and every other role gets 403 — generate this as a table-driven test so adding a new role/endpoint can't silently skip coverage |
| **Fee calculations** | Money logic | Partial payment sums correctly across multiple Payments, over-payment is rejected (or explicitly allowed as credit — decide and test the decision), status recalculation on payment edit/void |
| **Attendance & notification automation** | The signature feature | Absence correctly schedules a job; correction before firing cancels it; correction at the exact firing instant doesn't double-send (race test); no job is ever created/fired outside the comms window; no job is created for a holiday/weekend date; duplicate submission doesn't create duplicate jobs (unique constraint test) |
| **WhatsApp send/retry** | Provider integration | Provider adapter mocked in tests (never hit the real BSP in CI); retry backoff triggers correctly on simulated transient failure; permanent failure (invalid number) doesn't retry and surfaces in the log |
| **Broadcasts** | Audience resolution | Each audience type resolves the exact expected recipient set against seeded data; empty-audience send is blocked with a clear message rather than silently no-op'ing |
| **Multi-tenancy** | Isolation | Automated suite that, for every tenant-scoped table, attempts a cross-tenant read/write and asserts rejection — this is the single highest-value test suite in the whole product given the RLS/middleware dual-enforcement design |
| **E2E (smoke)** | Critical path | Login → add student → mark absent → (fast-forwarded) notification sent → record payment → dashboard reflects both — one Playwright script covering the literal demo flow, run before every demo and every deploy |

---

## 21. Security

- **Authentication:** JWT access + refresh tokens; refresh token httpOnly+secure+sameSite cookie; bcrypt (cost 12) for password hashing; account lockout/backoff after repeated failed logins.
- **Authorization:** RBAC middleware on every route (Section 8); never trust a role claim without re-verifying against the current DB record (a deactivated user's existing token must stop working — check `status` on every request, not just at login).
- **Tenant isolation:** `school_id` scoping in the app layer (Section 7) plus Postgres Row-Level Security as a second independent layer — a defense-in-depth choice specifically because this product's entire commercial value depends on School A never seeing School B's data.
- **Input validation:** zod schemas on every mutating endpoint; file upload (CSV, logos) validated for type/size and scanned before processing; never trust client-supplied `school_id` in a request body — always derive it from the authenticated token.
- **Rate limiting:** per-IP and per-account limits on `/auth/login` and `/auth/forgot-password` specifically (brute-force/enumeration targets); a general API rate limit as a backstop.
- **CORS:** locked to the known frontend origin(s) per environment — no wildcard in production.
- **Helmet:** standard secure-header defaults enabled on the Express app.
- **SQL injection prevention:** Prisma's parameterized queries by default; a hard rule against any raw SQL string built from user input (if raw SQL is ever needed for a complex report, use Prisma's tagged-template `$queryRaw` which parameterizes automatically, never string concatenation).
- **Audit logs:** every mutation to Student, Invoice, Payment, User/role, and every Super Admin cross-tenant action (impersonation) is written to `AuditLog` with actor, action, entity, and a diff/metadata snapshot — this is both a security control and a trust-building feature you can show a school ("we can tell you exactly who changed what, when").
- **Backups:** automated daily PostgreSQL backups with point-in-time recovery enabled from day one in production (not "add later") — a school's fee and attendance records are the kind of data loss that ends the business relationship instantly.
- **Secrets management:** all credentials (DB URL, JWT secret, BSP API keys) in environment variables via the hosting platform's secret manager — never committed, never logged.

---

## 22. Deployment Architecture

**Recommendation for MVP:**

- **Frontend:** Next.js on **Vercel** — zero-config CI/CD from git push, excellent DX, generous free/low tier for early stage, and it's a stack Eman already works in.
- **Backend:** Node.js/Express on **Railway** (or Render as a close alternative) — simplest path to a managed Postgres + Redis + a long-running Node process together in one place, which matters because BullMQ workers need a persistent process (not a serverless function) to run scheduled/delayed jobs reliably.
- **Database:** managed **PostgreSQL** (Railway/Render/Supabase) with automated daily backups and point-in-time recovery enabled.
- **Redis:** managed instance (Railway/Upstash) for BullMQ.
- **Why not AWS from day one:** AWS gives more control but costs meaningfully more setup time (VPC, ECS/EKS, RDS, ElastiCache configuration) that doesn't buy anything a 1-2 school pilot needs — Railway/Render/Vercel get a production-grade deployment live in hours, and migrating to AWS later (once there's real multi-tenant scale and a reason to optimize infra cost) is a well-trodden path, not a rewrite.
- **Environment variables:** per-environment (`local`, `staging`, `production`) `.env` files locally, managed secrets in the hosting dashboard for staging/production — `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `WHATSAPP_PROVIDER_API_KEY`, `WHATSAPP_PROVIDER_BASE_URL`, `FRONTEND_URL` (for CORS).
- **Migrations:** Prisma Migrate, run as an explicit deploy step (`prisma migrate deploy`) in CI before the new backend version goes live — never `migrate dev` against production.
- **Backups:** daily automated DB snapshots (provider-native) plus a weekly off-provider export as a second line of defense.
- **Logs:** structured logs shipped to the hosting platform's built-in log viewer for MVP; add a dedicated log aggregator (e.g. Better Stack/Axiom) once there's more than one school in production and cross-tenant debugging needs search.
- **Monitoring:** uptime check (e.g. Better Stack/UptimeRobot) on the API health endpoint, and error tracking (Sentry) wired into both frontend and backend from day one — catching a WhatsApp send failure or a dashboard query error before the school notices is the difference between "reliable SaaS" and "the thing that broke on us."

---

## 23. Estimated Development Effort

Assumption: **one experienced full-stack developer**, focused, using the recommended stack (which has strong scaffolding/boilerplate available — auth, RBAC, and CRUD patterns are well-trodden, so the estimate isn't padded for "figuring out the stack").

| Phase | Low (hrs) | High (hrs) |
|---|---|---|
| 0 — Architecture & Setup | 24 | 32 |
| 1 — Auth & School Setup | 32 | 40 |
| 2 — Student Management | 40 | 48 |
| 3 — Fee Management | 56 | 72 |
| 4 — Attendance | 32 | 40 |
| 5 — WhatsApp Automation | 48 | 64 |
| 6 — Broadcast Messaging | 32 | 40 |
| 7 — Training Center | 20 | 28 |
| 8 — Dashboard & Analytics | 32 | 40 |
| 9 — Testing & Security | 32 | 40 |
| 10 — Deployment & Demo prep | 16 | 24 |
| **Total** | **364 hrs** | **468 hrs** |

- **At 40 focused hours/week: roughly 9-12 weeks (~2.5-3 months) for a production-ready MVP.**
- **A demo-only prototype** (hardcode single-tenant, skip retry/error-hardening, minimal automated tests, rely entirely on seed data rather than a live BSP integration) can cut this to roughly **180-220 hours (4.5-5.5 weeks)** — enough to run the Section 18 demo convincingly, *not* enough to actually onboard School 2's real data and staff.
- **Important calendar-time caveat, independent of coding hours:** Meta/BSP business verification and WhatsApp template approval can take anywhere from a few days to 2-3 weeks elapsed time and is largely outside your control — start that process in parallel with Phase 0-1, not after Phase 5 is otherwise ready, or it becomes the critical path.

---

## 24. Recommended Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js + React + TypeScript + Tailwind CSS | Matches existing skillset; App Router gives clean data-fetching patterns for dashboard-heavy screens |
| Backend | Node.js + Express + TypeScript | Matches existing skillset; simple, well-understood, no framework magic to fight |
| Database | PostgreSQL + Prisma | Relational integrity matters a lot here (fee ledgers, tenant isolation); Prisma's migration workflow and type-safety fit a solo/small-team pace |
| Authentication | Custom JWT (access+refresh) with bcrypt, or **Lucia/Auth.js if it accelerates without fighting the RBAC+multi-tenant model** | Roll-your-own is genuinely reasonable here since RBAC+tenant scoping is custom either way — don't force a generic auth library to bend to a multi-tenant shape it wasn't built for |
| Validation | zod | Shared client/server schema definitions, first-class TypeScript inference |
| State management (frontend) | TanStack Query (server state) + minimal local state (React state/Zustand only where truly needed) | A dashboard/CRUD-heavy app is 90% server-state; reaching for Redux-style global client state here would be over-engineering |
| Charts | Recharts (or the visualization approach in this session's dataviz guidance if building custom) | Simple, composable, good enough for KPI/trend charts without a heavy charting suite |
| File storage | S3-compatible object storage (AWS S3, or Cloudflare R2 for lower cost) | Student photos (future), training videos, CSV import files, logos |
| Queue/jobs | BullMQ + Redis | Purpose-built for delayed/retryable jobs, exactly what the notification pipeline needs, without adopting a heavier message-broker |
| WhatsApp integration | A BSP with Embedded Signup (Wati/Gupshup/360dialog — confirm current Pakistan support and pricing before committing) behind your own provider interface | Practical onboarding for many school sub-accounts; swappable later without an app rewrite |
| Email (transactional, minimal MVP use) | Resend or Postmark | Only needed for password-reset emails at MVP; don't build a full email system yet |
| Monitoring/errors | Sentry (app errors) + a simple uptime checker | Cheap, fast to wire in, catches production issues before schools report them |

---

## 25. Final MVP Blueprint (One-Page Summary)

**Modules (7):** Principal Dashboard · Student Management · Fee Management · Attendance Management · WhatsApp Automation · Broadcast Messaging · Training Center.

**Screens (27):** enumerated in full in Section 5 — spanning auth, all 7 modules, and Settings/Super Admin.

**Core database entities (24):** School, User, TeacherClassAssignment, AcademicYear, Class, Section, Student, Guardian, StudentGuardian, FeeCategory, FeeStructureItem, Invoice, Payment, AttendanceRecord, SchoolCalendarDay, NotificationRule, MessageTemplate, NotificationJob, BroadcastCampaign, MessageDelivery, TrainingModule, TrainingItem, TrainingView, AuditLog.

**APIs:** versioned under `/api/v1`, grouped by Auth, Students, Classes, Fees, Attendance, Dashboard, Notifications, Broadcasts, Training — full list in Section 9.

**Tech stack:** Next.js/React/TypeScript/Tailwind (frontend) · Node.js/Express/TypeScript (backend) · PostgreSQL/Prisma (data) · BullMQ/Redis (jobs) · a BSP with Embedded Signup (WhatsApp) · Vercel + Railway/Render (hosting).

**Development phases:** 11 phases (0-10), roadmap in Section 16.

**Estimated timeline:** 9-12 weeks production-ready MVP; 4.5-5.5 weeks demo-only prototype (Section 23) — plus a parallel-tracked 1-3 week WhatsApp business-verification process that should start immediately, not after development.

**P0 features (must exist for the School 2 demo to succeed):** Auth/RBAC/tenant isolation, Student CRUD + bulk import, Class/Section setup, daily attendance marking, fee structure + invoice generation + payment recording, defaulters list, absence-triggered WhatsApp automation, broadcast messaging, the full Principal Dashboard, and the Training Center. Everything else in Section 17 is P1/P2 — real, needed for a durable product, but not what wins the room on demo day.

**Phase 2+ (explicitly out of this MVP):** Parent Portal/LMS login, staff Payroll, Library, Transport, Inventory, Accounting/Finance ERP, advanced Examination/Results, Website CMS.
