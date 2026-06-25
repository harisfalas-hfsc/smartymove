type ExportPayload = {
  exportedAt?: string;
  account?: { email?: string | null; id?: string | null };
  profile?: {
    name?: string | null;
    email?: string | null;
    age?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
    app_user?: {
      goal?: string;
      premium?: boolean;
      streak?: number;
      sessions?: Array<{
        date?: string;
        overall?: number;
        movementAge?: number;
        sub?: Record<string, number>;
        tests?: Array<{ name?: string; score?: number; notes?: string; compensations?: string[] }>;
      }>;
      questionnaire?: { pain?: string; joints?: string[]; recentInjury?: boolean; redFlags?: boolean };
      programCompletedDays?: number[];
      programStartDate?: string;
      nextRetestDate?: string;
    };
  };
  subscriptions?: Array<{
    status?: string;
    price_id?: string;
    cancel_at_period_end?: boolean;
    current_period_start?: string | null;
    current_period_end?: string | null;
    environment?: string;
  }>;
  notes?: string[];
};

function asPayload(data: unknown): ExportPayload {
  return data && typeof data === "object" ? (data as ExportPayload) : {};
}

function escapeHtml(value: unknown) {
  return String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function formatLabel(value?: string | null) {
  if (!value) return "—";
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function row(label: string, value: unknown) {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
}

function section(title: string, body: string) {
  return `<section><h2>${escapeHtml(title)}</h2>${body}</section>`;
}

export function createAccountDataReportHtml(data: unknown) {
  const payload = asPayload(data);
  const appUser = payload.profile?.app_user ?? {};
  const sessions = appUser.sessions ?? [];
  const latest = sessions[sessions.length - 1];
  const subscriptions = payload.subscriptions ?? [];
  const questionnaire = appUser.questionnaire;

  const account = section(
    "Account",
    `<table>${[
      row("Name", payload.profile?.name),
      row("Email", payload.account?.email ?? payload.profile?.email),
      row("Age", payload.profile?.age),
      row("Goal", formatLabel(appUser.goal)),
      row("Plan", appUser.premium ? "Premium" : "Free"),
      row("Current streak", appUser.streak ?? 0),
      row("Profile created", formatDate(payload.profile?.created_at)),
      row("Profile updated", formatDate(payload.profile?.updated_at)),
    ].join("")}</table>`,
  );

  const movement = section(
    "Movement summary",
    sessions.length
      ? `<table>${[
          row("Movement screens completed", sessions.length),
          row("Latest screen", formatDate(latest?.date)),
          row("Latest score", latest?.overall),
          row("Movement Age", latest?.movementAge),
          row("Completed program days", (appUser.programCompletedDays ?? []).join(", ") || "—"),
          row("Program start", formatDate(appUser.programStartDate)),
          row("Next re-test", formatDate(appUser.nextRetestDate)),
        ].join("")}</table>`
      : `<p>No Movement Screen results are stored on this account yet.</p>`,
  );

  const questionnaireSection = section(
    "Questionnaire",
    questionnaire
      ? `<table>${[
          row("Pain level", formatLabel(questionnaire.pain)),
          row("Joint focus", questionnaire.joints?.map(formatLabel).join(", ") || "—"),
          row("Recent injury", questionnaire.recentInjury ? "Yes" : "No"),
          row("Safety flags", questionnaire.redFlags ? "Yes" : "No"),
        ].join("")}</table>`
      : `<p>No questionnaire answers are stored on this account yet.</p>`,
  );

  const scoreRows = latest?.sub
    ? Object.entries(latest.sub)
        .map(([name, value]) => row(formatLabel(name), value))
        .join("")
    : "";
  const scores = section(
    "Latest score breakdown",
    scoreRows ? `<table>${scoreRows}</table>` : `<p>No score breakdown is stored yet.</p>`,
  );

  const testRows = latest?.tests?.length
    ? latest.tests
        .map(
          (test) =>
            `<tr><td>${escapeHtml(test.name)}</td><td>${escapeHtml(test.score)}</td><td>${escapeHtml(
              test.compensations?.join(", ") || test.notes || "—",
            )}</td></tr>`,
        )
        .join("")
    : "";
  const tests = section(
    "Latest movement tests",
    testRows
      ? `<table><thead><tr><th>Test</th><th>Score</th><th>Notes</th></tr></thead><tbody>${testRows}</tbody></table>`
      : `<p>No individual test results are stored yet.</p>`,
  );

  const billingRows = subscriptions.length
    ? subscriptions
        .map(
          (subscription) =>
            `<tr><td>${escapeHtml(formatLabel(subscription.status))}</td><td>${escapeHtml(
              formatLabel(subscription.price_id),
            )}</td><td>${escapeHtml(subscription.cancel_at_period_end ? "Stops at period end" : "Renews automatically")}</td><td>${escapeHtml(
              formatDate(subscription.current_period_end),
            )}</td><td>${escapeHtml(subscription.environment === "live" ? "Live" : "Test")}</td></tr>`,
        )
        .join("")
    : "";
  const billing = section(
    "Billing",
    billingRows
      ? `<table><thead><tr><th>Status</th><th>Plan</th><th>Renewal</th><th>Period end</th><th>Mode</th></tr></thead><tbody>${billingRows}</tbody></table>`
      : `<p>No billing records are stored for this account.</p>`,
  );

  const notes = section(
    "Notes",
    `<ul>${(payload.notes ?? [])
      .map((note) => `<li>${escapeHtml(note)}</li>`)
      .join("")}</ul>`,
  );

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>SmartyMove data report</title>
  <style>
    body { margin: 0; background: #f8fbfd; color: #172033; font-family: Helvetica Neue, Arial, sans-serif; line-height: 1.45; }
    main { max-width: 920px; margin: 0 auto; padding: 40px 20px; }
    header { border-radius: 24px; padding: 28px; background: linear-gradient(135deg, #0ea5e9, #22c55e); color: white; }
    h1 { margin: 0; font-size: 34px; }
    header p { margin: 8px 0 0; opacity: .9; }
    section { margin-top: 18px; border: 1px solid #dbe7ef; border-radius: 20px; background: white; padding: 22px; box-shadow: 0 12px 30px rgba(15, 23, 42, .06); }
    h2 { margin: 0 0 14px; font-size: 18px; }
    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 14px; }
    th, td { padding: 12px; border-bottom: 1px solid #e8f0f5; text-align: left; vertical-align: top; }
    th { width: 34%; color: #506173; font-size: 13px; }
    td { font-weight: 650; }
    ul { margin: 0; padding-left: 20px; }
    .small { font-size: 13px; opacity: .82; }
  </style>
</head>
<body>
  <main>
    <header>
      <h1>SmartyMove data report</h1>
      <p>Created ${escapeHtml(formatDate(payload.exportedAt))}</p>
      <p class="small">This is a readable copy of the personal data stored in your SmartyMove account.</p>
    </header>
    ${account}
    ${movement}
    ${questionnaireSection}
    ${scores}
    ${tests}
    ${billing}
    ${notes}
  </main>
</body>
</html>`;
}

export function downloadAccountDataReport(data: unknown) {
  const html = createAccountDataReportHtml(data);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `smartymove-data-report-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}