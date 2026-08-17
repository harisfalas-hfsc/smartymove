import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ShieldAlert, Users, CreditCard, TrendingUp, Search, Loader2, Plus, Minus, Crown } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { adminListUsers, adminGrantScans, adminSetRole, adminGetStripeAnalytics, type AdminUserRow, type AdminAnalytics } from "@/lib/admin.functions";
import { adminGetFreeAccessMode, adminSetFreeAccessMode } from "@/lib/admin.functions";
import { setFreeAccessModeCache } from "@/hooks/useFreeAccessMode";
import { Switch } from "@/components/ui/switch";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/admin/")({ component: AdminPage });

function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setAuthed(isAdminEmail(data.user?.email))).catch(() => setAuthed(false));
  }, []);
  if (authed === null) {
    return <Shell><div className="mt-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div></Shell>;
  }
  if (!authed) {
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-card p-6 text-center shadow-card">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl brand-gradient-soft text-primary"><ShieldAlert className="h-6 w-6" /></div>
          <h1 className="mt-4 text-xl font-extrabold">Admin access only</h1>
          <p className="mt-1 text-sm text-muted-foreground">This area is restricted to SmartyMove administrators.</p>
        </div>
      </Shell>
    );
  }
  return <Shell><AdminInner /></Shell>;
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[1100px] px-4 pb-16 pt-4 lg:px-8">{children}</main>
    </div>
  );
}

function AdminInner() {
  const env = safeEnv();
  const listUsers = useServerFn(adminListUsers);
  const grantScans = useServerFn(adminGrantScans);
  const setRole = useServerFn(adminSetRole);
  const getAnalytics = useServerFn(adminGetStripeAnalytics);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [grantUser, setGrantUser] = useState<AdminUserRow | null>(null);
  const [grantCount, setGrantCount] = useState(1);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function reloadUsers() {
    setUsersLoading(true);
    const r = await listUsers({ data: { search: search.trim() || undefined, environment: env } });
    if ("error" in r) setMessage(r.error);
    else setUsers(r.users);
    setUsersLoading(false);
  }
  async function reloadAnalytics() {
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    try {
      const r = await getAnalytics({ data: { environment: env } });
      if ("error" in r) { setAnalyticsError(r.error); setAnalytics(null); }
      else setAnalytics(r);
    } catch (e) {
      setAnalyticsError(e instanceof Error ? e.message : "Failed");
    } finally {
      setAnalyticsLoading(false);
    }
  }
  useEffect(() => { void reloadUsers(); void reloadAnalytics(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const activeSubs = useMemo(() => users.filter((u) => u.has_active_subscription), [users]);
  const withPurchases = useMemo(() => users.filter((u) => u.scans_purchased > 0), [users]);

  async function doGrant(delta: number) {
    if (!grantUser) return;
    setBusy(true);
    const r = await grantScans({ data: { userId: grantUser.id, credits: delta } });
    setBusy(false);
    if ("error" in r) setMessage(r.error);
    else {
      setMessage(`Updated ${grantUser.email}: now ${r.credits} credits`);
      setGrantUser(null);
      void reloadUsers();
    }
  }
  async function toggleAdmin(u: AdminUserRow) {
    if (isAdminEmail(u.email)) { setMessage("This user is admin by email allowlist (edit src/lib/admin.ts to change)."); return; }
    setBusy(true);
    const r = await setRole({ data: { userId: u.id, makeAdmin: !u.is_admin } });
    setBusy(false);
    if ("error" in r) setMessage(r.error);
    else { setMessage(`${u.email} is now ${!u.is_admin ? "admin" : "regular user"}`); void reloadUsers(); }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold">Admin panel</h1>
          <p className="text-sm text-muted-foreground">Environment: <span className="font-mono">{env}</span></p>
        </div>
      </div>
      {message && (
        <div className="mb-4 rounded-2xl bg-primary/10 p-3 text-sm font-semibold text-foreground">{message} <button onClick={() => setMessage(null)} className="ml-2 text-xs underline">dismiss</button></div>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview"><TrendingUp className="mr-1 h-4 w-4" />Overview</TabsTrigger>
          <TabsTrigger value="users"><Users className="mr-1 h-4 w-4" />Users</TabsTrigger>
          <TabsTrigger value="subs"><Crown className="mr-1 h-4 w-4" />Subs</TabsTrigger>
          <TabsTrigger value="purchases"><CreditCard className="mr-1 h-4 w-4" />Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FreeAccessModeCard />
          <OverviewTab analytics={analytics} loading={analyticsLoading} error={analyticsError} users={users} onReload={reloadAnalytics} />
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
              <CardTitle>All users ({users.length})</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative"><Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="email…" className="h-9 w-48 pl-8" onKeyDown={(e) => e.key === "Enter" && reloadUsers()} /></div>
                <Button size="sm" onClick={reloadUsers} disabled={usersLoading}>{usersLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reload"}</Button>
              </div>
            </CardHeader>
            <CardContent>
              <UserTable users={users} onGrant={(u) => { setGrantUser(u); setGrantCount(1); }} onToggleAdmin={toggleAdmin} busy={busy} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subs">
          <Card>
            <CardHeader><CardTitle>Active subscribers ({activeSubs.length})</CardTitle></CardHeader>
            <CardContent><UserTable users={activeSubs} onGrant={(u) => { setGrantUser(u); setGrantCount(1); }} onToggleAdmin={toggleAdmin} busy={busy} /></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="purchases">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Users with scan purchases ({withPurchases.length})</CardTitle></CardHeader>
            <CardContent><UserTable users={withPurchases} onGrant={(u) => { setGrantUser(u); setGrantCount(1); }} onToggleAdmin={toggleAdmin} busy={busy} /></CardContent>
          </Card>
          <Card className="mt-4">
            <CardHeader><CardTitle>Recent Stripe transactions</CardTitle></CardHeader>
            <CardContent>
              {analyticsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : analytics?.recent?.length ? (
                <div className="overflow-x-auto"><Table>
                  <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Email</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                  <TableBody>{analytics.recent.map((r) => (
                    <TableRow key={r.id}><TableCell className="whitespace-nowrap text-xs">{new Date(r.created).toLocaleString()}</TableCell><TableCell className="text-xs">{r.email ?? "—"}</TableCell><TableCell className="text-xs">{r.description ?? "—"}</TableCell><TableCell><Badge variant={r.type === "subscription" ? "default" : "secondary"}>{r.type}</Badge></TableCell><TableCell className="text-right font-mono text-xs">{r.amount.toFixed(2)} {r.currency}</TableCell></TableRow>
                  ))}</TableBody>
                </Table></div>
              ) : <p className="text-sm text-muted-foreground">No transactions{analyticsError ? ` — ${analyticsError}` : ""}.</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!grantUser} onOpenChange={(o) => !o && setGrantUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Grant scan credits</DialogTitle></DialogHeader>
          {grantUser && (
            <div className="space-y-3">
              <div className="text-sm"><div className="font-semibold">{grantUser.email}</div><div className="text-muted-foreground">Currently: {grantUser.scan_credits} credits</div></div>
              <div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={() => setGrantCount((c) => Math.max(1, c - 1))}><Minus className="h-4 w-4" /></Button><Input type="number" value={grantCount} onChange={(e) => setGrantCount(Number(e.target.value) || 1)} className="text-center" /><Button variant="outline" size="sm" onClick={() => setGrantCount((c) => c + 1)}><Plus className="h-4 w-4" /></Button></div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => grantUser && doGrant(-grantCount)} disabled={busy}>Remove {grantCount}</Button>
            <Button onClick={() => doGrant(grantCount)} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : `Grant ${grantCount}`}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OverviewTab({ analytics, loading, error, users, onReload }: { analytics: AdminAnalytics | null; loading: boolean; error: string | null; users: AdminUserRow[]; onReload: () => void }) {
  const activeCount = users.filter((u) => u.has_active_subscription).length;
  const totalCredits = users.reduce((s, u) => s + u.scan_credits, 0);
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={users.length.toString()} />
        <Stat label="Active subscribers" value={String(analytics?.activeSubscriptions ?? activeCount)} />
        <Stat label="Total revenue" value={analytics ? `${analytics.totalRevenue.toFixed(2)} ${analytics.currency}` : loading ? "…" : "—"} />
        <Stat label="Scan credits outstanding" value={totalCredits.toString()} />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0"><CardTitle>Revenue by month</CardTitle><Button size="sm" variant="outline" onClick={onReload} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Refresh"}</Button></CardHeader>
        <CardContent>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {!analytics?.revenueByMonth?.length && !loading && !error && <p className="text-sm text-muted-foreground">No revenue yet.</p>}
          {analytics?.revenueByMonth?.length ? (
            <div className="space-y-2">{analytics.revenueByMonth.map((m) => {
              const max = Math.max(...analytics.revenueByMonth.map((x) => x.amount));
              const pct = max ? (m.amount / max) * 100 : 0;
              return (
                <div key={m.month} className="flex items-center gap-3 text-sm">
                  <div className="w-20 font-mono text-xs text-muted-foreground">{m.month}</div>
                  <div className="relative h-6 flex-1 overflow-hidden rounded bg-secondary"><div className="h-full brand-gradient" style={{ width: `${pct}%` }} /></div>
                  <div className="w-24 text-right font-mono text-xs">{m.amount.toFixed(2)} {analytics.currency}</div>
                </div>
              );
            })}</div>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-3 sm:grid-cols-2">
        <Stat label="Scan purchases (Stripe)" value={String(analytics?.scanPurchases ?? 0)} />
        <Stat label="Subscription payments (Stripe)" value={String(analytics?.subscriptionPurchases ?? 0)} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card><CardContent className="p-4"><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</div><div className="mt-1 text-2xl font-extrabold">{value}</div></CardContent></Card>
  );
}

function UserTable({ users, onGrant, onToggleAdmin, busy }: { users: AdminUserRow[]; onGrant: (u: AdminUserRow) => void; onToggleAdmin: (u: AdminUserRow) => void; busy: boolean }) {
  if (!users.length) return <p className="py-6 text-center text-sm text-muted-foreground">No users.</p>;
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Name</TableHead><TableHead className="text-right">Credits</TableHead><TableHead className="text-right">Bought</TableHead><TableHead>Subscription</TableHead><TableHead>Role</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="text-xs">{u.email}</TableCell>
              <TableCell className="text-xs">{u.name}</TableCell>
              <TableCell className="text-right font-mono text-xs">{u.scan_credits}</TableCell>
              <TableCell className="text-right font-mono text-xs">{u.scans_purchased}</TableCell>
              <TableCell>{u.has_active_subscription ? <Badge>{u.subscription_status ?? "active"}</Badge> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
              <TableCell>{u.is_admin ? <Badge variant="default"><Crown className="mr-1 h-3 w-3" />admin</Badge> : <span className="text-xs text-muted-foreground">user</span>}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1"><Button size="sm" variant="outline" onClick={() => onGrant(u)} disabled={busy}>+ scan</Button><Button size="sm" variant={u.is_admin ? "outline" : "secondary"} onClick={() => onToggleAdmin(u)} disabled={busy}>{u.is_admin ? "revoke" : "make admin"}</Button></div></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function safeEnv() {
  try { return getStripeEnvironment(); } catch { return "sandbox" as const; }
}