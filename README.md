# GRAP SOP Management — Axis Bank RetailOps (POC)

An interactive proof of concept for bank **Makers** and **Reviewers**: upload SOPs, send them for review, and publish approved SOPs to the GRAP knowledge base.

**Stack:** React 19 · TypeScript · Vite · MUI v9 · React Router · docx-preview · Vitest

---

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev          # → http://localhost:5173
```

Other scripts:

```bash
npm run build        # type-check + production build (dist/)
npm run preview      # serve the production build
npm test             # unit tests for the workflow rules
npm run lint         # oxlint
```

## Demo users (simulated SSO)

Click **Sign in with Axis SSO**, then pick an account:

| User | Persona | Use it to show |
|---|---|---|
| Priya Singh | Reviewer | The mockup's main user: For My Review queue, review decisions, plus her own SOPs in every status |
| Mohith Kumar | Maker | Add / edit / submit, and "Make changes" on SOP-0029 (Requested Modification) |
| Anu Jha / Rahul Mehta | Reviewer | A reviewer's own SOP (e.g. Anu's SOP-0024) never appears in their own review queue |
| Sneha Iyer | Maker | Another maker with an SOP waiting for review |
| Vikram Rao | No persona | "Access not assigned" screen |

Seed data covers every status. Use **Account menu → Reset demo data** to start over.
A sample Word file is linked from the upload box ("Download a sample .docx").

## 3-minute demo script (full status flow)

1. **Mohith (Maker)** → **Add SOP** → upload the sample .docx (it previews) → pick Category *Cards* (the sub-category list follows) → **Save & Submit** → **Submitted**.
2. Still as Mohith, **SOP-0029** (Requested Modification) → **Make changes**. It moves to *Modification In Progress*, and Priya's remarks show at the top. Upload a new PDF (the version goes v1 → v2), which makes **"What changed in v2?"** required → **Save & Submit** → **Resubmitted**.
3. Sign out → **Priya (Reviewer)**. The greeting says how many SOPs wait for her, and the 🔔 shows the resubmission. **For My Review** → **Review** SOP-0029 → **Compare with previous version** (v1 and v2 side by side). Try **Reject** with no remarks (inline error), then use a quick remark and **Approve & publish** → confirm → **Approved**.
4. Click **Activity** in the list: a drawer with the newest-first timeline (user, email, time, status before → after, remarks, "File replaced: v1 → v2"). The status stepper on View/Review shows where the SOP is in the flow.

## What's covered (assignment checklist)

| Area | Implementation |
|---|---|
| 1. Sign-in | Simulated SSO with an account picker; Maker/Reviewer personas; "Access not assigned" state; header shows name, persona and sign-out |
| 2. Dashboard | My SOPs / For My Review tabs with counts; search by name or ID (debounced); Category, dependent Sub-category, Status and Created date-range filters; coloured status badges; only the permitted row actions |
| 3. Add / Edit | Drag-and-drop Word/PDF upload with live preview; required-field and file-type validation shown inline; system-managed version; Save (Draft) / Save & Submit / Cancel |
| 4. Review | Document preview on the left, details and remarks on the right; Approve / Request Modification / Reject; remarks required for Reject and Request Modification; confirmation before Approve and Reject |
| 5. Activity | Newest-first timeline: action, user name + email, date/time, status before → after, remarks, version, file replacement (v1 → v2) |

## From the HTML mockup → React

Everything in the mockup is implemented with real behaviour instead of placeholders:

| Mockup | This POC |
|---|---|
| Static demo persona radio | SSO account picker with real personas, plus the "Access not assigned" state |
| Header search | Live, debounced search that filters the list and works from any page |
| 🔔 Notifications (hard-coded) | Built from real activity: decisions on my SOPs, and SOPs waiting for my review; unread count |
| Greeting + KPI tiles | Separate tiles for Reviewers and Makers; clicking a tile filters the list |
| Category → Sub-category selects | Same category master with dependent sub-categories (still accepts free text) |
| Random fake upload | Real drag-and-drop upload, Word/PDF validation, real PDF and .docx preview |
| "What changed" note (suggestion) | Required automatically when a new version is uploaded; shown in Activity |
| Status stepper | Built from the SOP's real history; steps it never went through show as "skipped" |
| "Compare with previous version" (fake diff) | Previous and current files side by side |
| Quick-pick remarks (suggestion) | Chips that add standard remarks |
| `confirm()` pop-ups | Accessible confirmation dialogs for Approve, Reject and Request Modification |
| Activity drawer | Same drawer, plus a full Activity page |
| Fixed 4-column KPIs, fixed widths | Responsive from 320px to 2560px |

## Improvements over a basic mockup

- **Rules in one place:** `src/domain/workflow.ts` holds the status flow, permissions and versioning as pure functions with unit tests. The UI and the mock API both use them, so the server enforces the same rules (for example, a reviewer can't review their own SOP even through a direct URL).
- **Browser zoom 25%–500%:** the layout is fully fluid. Every screen fills the whole browser width at any zoom level, like at 100%, with no centered column or empty side gutters. When zooming in, the table becomes cards and the stepper wraps. Tested on 9 screens at 17 zoom levels.
- **Responsive at every width and zoom level:** checked from 320px to 2560px with no horizontal page scroll. The table becomes cards on mobile and filters move into a bottom sheet. The header stays pinned while scrolling.
- **Filters in the URL:** tab, search, filters, sort and page are kept in the address, so links are shareable and survive refresh and the back button.
- **Sortable columns and pagination.**
- **Every state handled:** loading skeletons and spinners, empty states (including "No SOPs to review"), error state with retry, and a success or error message after every action.
- **Accessibility:** skip-to-content link, labelled icon buttons, badges that show text (not colour alone) with AA contrast, keyboard-operable upload, focus moves to the first invalid field, visible focus ring.
- **Data safety:** "Discard changes?" prompt on Cancel, a browser warning before closing with unsaved edits, and buttons disabled while saving (no double submit).
- **Version history:** the View screen lists every version and can preview older files.
- **Performance:** secondary screens and the Word previewer are lazy-loaded.
- **Branding:** Lato font, burgundy `#97144D` and the section greys taken from axis.bank.in, plus the Axis logo and favicon.

## What is simulated

| Real system | In this POC |
|---|---|
| Bank SSO (e.g. Azure AD / SAML) | Account picker with 4 demo users; session in `sessionStorage` |
| Persona / entitlement service | Persona stored on the demo user |
| Backend API + database | `src/data/api.ts`: async functions with simulated latency; data in `localStorage` |
| File storage | Uploaded files kept in the browser's IndexedDB; seed SOPs are PDFs in `public/samples` |
| Notifications | Derived from the activity log; read state kept per user in `localStorage` |
| Version compare | Previous and current files shown side by side (no text diff) |
| Publishing to the knowledge base | "Approved" status plus an activity entry; no external call |
| Legacy `.doc` preview | Browsers can't render `.doc`, so it shows a download fallback; `.docx` and PDF preview in the browser |

All persistence goes through `src/data/api.ts`, so connecting a real backend only changes that file.

## Project structure

```
src/
  domain/      workflow.ts (rules) · workflow.test.ts · constants.ts (status colours, labels)
  data/        api.ts (mock backend) · seed.ts (demo users and SOPs)
  context/     AuthContext (SSO session) · NotifyContext (toasts)
  components/  AppLayout (sticky header) · HeaderWidgets (search, notifications) · FilePreview · DocumentPanel (compare)
               FileDropzone · StatusStepper · ActivityTimeline · ActivityDrawer · SopDetails · common
  pages/       Login · SopList · SopForm (add/edit) · SopReview · SopView · SopActivity · StatusPages
  theme.ts     MUI theme with Axis branding
```
