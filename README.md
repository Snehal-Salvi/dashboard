# GRAP SOP Management – Axis Bank (POC)

Proof of concept for the Axis Bank GRAP (Grievance Resolution Automation Program) SOP workflow.
Makers upload Word/PDF SOPs and send them for review. Reviewers approve, reject or request changes.
Approved SOPs are published to the knowledge base. Includes simulated SSO sign-in, the SOP dashboard,
Add/Edit with file preview, Review, and a full Activity history.

## Tech stack

React 19 · TypeScript · Vite · MUI · React Router · docx-preview · Vitest

## Run

```bash
npm install
npm run dev      # http://localhost:5173
```

Sign in with **Axis SSO** and pick the **Maker** or **Reviewer** demo persona.
SSO and the backend are simulated (data is kept in the browser).
