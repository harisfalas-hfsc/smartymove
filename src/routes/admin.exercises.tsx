import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon, Database, Search, FileDown, Wrench, ShieldAlert } from "lucide-react";
import { isAdminEmail } from "@/lib/admin";
import { getUser } from "@/lib/store";
import { useUnresolvedCanonicals } from "@/lib/exercises";

export const Route = createFileRoute("/admin/exercises")({ component: AdminExercises });

type Row = {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target: string | null;
  gif_url: string | null;
};

function AdminExercises() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("smartymove.adminPass");
    const local = getUser();
    if (isAdminEmail(local?.email)) {
      setAuthed(true);
      return;
    }
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(isAdminEmail(data.user?.email));
    }).catch(() => setAuthed(false));
  }, []);

  if (authed !== true) {
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-card p-6 text-center shadow-card">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl brand-gradient-soft text-primary"><ShieldAlert className="h-6 w-6" /></div>
          <h1 className="mt-4 text-xl font-extrabold">Admin access only</h1>
          <p className="mt-1 text-sm text-muted-foreground">The exercise library manager is restricted to administrator accounts.</p>
          <a href="/app/profile" className="mt-5 inline-flex h-11 items-center justify-center rounded-2xl bg-secondary px-5 text-sm font-semibold text-foreground">Back to profile</a>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Manager />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#E7ECEC", color: "#14213A" }}>
      <SiteHeader />
      <main className="mx-auto w-full max-w-[920px] px-5 pb-12 pt-6">{children}</main>
    </div>
  );
}

function Manager() {
  const jsonRef = useRef<HTMLInputElement>(null);
  const gifRef = useRef<HTMLInputElement>(null);
  const { data: unresolved = [], isLoading: unresolvedLoading } = useUnresolvedCanonicals();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [jsonBusy, setJsonBusy] = useState(false);
  const [jsonProgress, setJsonProgress] = useState(0);
  const [jsonStatus, setJsonStatus] = useState("");

  const [gifBusy, setGifBusy] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifStatus, setGifStatus] = useState("");
  const [showMissingOnly, setShowMissingOnly] = useState(false);

  async function loadAll() {
    setLoading(true);
    const all: Row[] = [];
    let from = 0;
    const page = 1000;
    while (true) {
      const { data, error } = await supabase
        .from("exercises")
        .select("id,name,body_part,equipment,target,gif_url")
        .order("name", { ascending: true })
        .range(from, from + page - 1);
      if (error) { console.error(error); break; }
      if (!data || data.length === 0) break;
      all.push(...data);
      if (data.length < page) break;
      from += page;
    }
    setRows(all);
    setLoading(false);
  }

  useEffect(() => { loadAll(); }, []);

  async function handleJSON(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setJsonBusy(true); setJsonProgress(0); setJsonStatus("Reading file…");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const arr: any[] = Array.isArray(parsed) ? parsed : (parsed.exercises ?? []);
      if (!arr.length) throw new Error("No exercises found in JSON");

      const toInsert = arr
        .map((it) => ({
          id: String(it.id ?? ""),
          name: (it.name ?? "").toString().trim(),
          body_part: (it.bodyPart ?? it.body_part ?? "").toString().trim() || null,
          equipment: (it.equipment ?? "").toString().trim() || null,
          target: (it.target ?? "").toString().trim() || null,
          secondary_muscles: Array.isArray(it.secondaryMuscles ?? it.secondary_muscles)
            ? (it.secondaryMuscles ?? it.secondary_muscles)
            : [],
          instructions: Array.isArray(it.instructions) ? it.instructions : [],
          description: (it.description ?? "")?.toString().trim() || null,
          difficulty: (it.difficulty ?? "")?.toString().trim() || null,
          category: (it.category ?? "")?.toString().trim() || null,
        }))
        .filter((x) => x.id && x.name);

      setJsonStatus(`Parsed ${toInsert.length} exercises. Upserting…`);
      setJsonProgress(10);

      const batch = 200;
      let done = 0;
      for (let i = 0; i < toInsert.length; i += batch) {
        const slice = toInsert.slice(i, i + batch);
        const { error } = await supabase.from("exercises").upsert(slice, { onConflict: "id" });
        if (error) { console.error(error); throw error; }
        done += slice.length;
        setJsonProgress(10 + Math.round((done / toInsert.length) * 90));
        setJsonStatus(`Upserted ${done} / ${toInsert.length}`);
      }
      setJsonStatus(`Done. ${done} exercises in the catalog.`);
      await loadAll();
    } catch (err: any) {
      setJsonStatus(`Failed: ${err?.message ?? err}`);
    } finally {
      setJsonBusy(false);
      if (jsonRef.current) jsonRef.current.value = "";
    }
  }

  async function listExistingGifNames() {
    const existing = new Set<string>();
    let offset = 0;
    while (true) {
      const { data, error } = await supabase.storage
        .from("exercise-gifs")
        .list("", { limit: 1000, offset, sortBy: { column: "name", order: "asc" } });
      if (error) throw error;
      if (!data || data.length === 0) break;
      for (const o of data) existing.add(o.name);
      if (data.length < 1000) break;
      offset += 1000;
    }
    return existing;
  }

  async function linkGifRows(ids: string[], onProgress?: (done: number, total: number, failed: number) => void) {
    const valid = Array.from(new Set(ids)).filter((id) => rows.some((r) => r.id === id));
    let done = 0;
    let failed = 0;
    for (let i = 0; i < valid.length; i += 25) {
      const slice = valid.slice(i, i + 25);
      await Promise.all(slice.map(async (id) => {
        const { error } = await supabase.from("exercises").update({ gif_url: `${id}.gif` }).eq("id", id);
        if (error) failed++;
      }));
      done += slice.length;
      onProgress?.(done, valid.length, failed);
    }
    return { linked: valid.length - failed, failed, total: valid.length };
  }

  async function repairExistingLinks() {
    setGifBusy(true); setGifProgress(0); setGifStatus("Scanning uploaded GIFs and repairing library links…");
    try {
      const existing = await listExistingGifNames();
      const ids = rows
        .filter((r) => existing.has(`${r.id}.gif`) && r.gif_url !== `${r.id}.gif`)
        .map((r) => r.id);
      if (ids.length === 0) {
        setGifProgress(100);
        setGifStatus("No broken links found. Every uploaded matching GIF is already connected.");
      } else {
        const result = await linkGifRows(ids, (done, total, failed) => {
          setGifProgress(Math.round((done / total) * 100));
          setGifStatus(`Repairing links ${done}/${total} · failed ${failed}`);
        });
        setGifStatus(`Repair done. Connected ${result.linked} existing GIFs to exercises${result.failed ? `, ${result.failed} failed` : ""}.`);
        await loadAll();
      }
    } catch (err: any) {
      setGifStatus(`Repair failed: ${err?.message ?? err}`);
    } finally {
      setGifBusy(false);
    }
  }

  function downloadMissingList() {
    const missing = rows.filter((r) => !r.gif_url);
    const csv = ["id,name,body_part,equipment,target", ...missing.map((r) => [r.id, r.name, r.body_part ?? "", r.equipment ?? "", r.target ?? ""].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "missing-exercise-gifs.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleGIFs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGifBusy(true); setGifProgress(0);
    setGifStatus(`Checking which of ${files.length} files are already uploaded…`);
    const errors: string[] = [];
    let uploaded = 0, matched = 0, skipped = 0, failed = 0;
    try {
      // 1) List everything already in the bucket so we can skip uploads safely
      const existing = await listExistingGifNames();

      // 2) Build the work queue, skipping files already uploaded
      const queue: File[] = [];
      const selectedIds: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const id = f.name.replace(/\.gif$/i, "").trim();
        selectedIds.push(id);
        if (existing.has(`${id}.gif`)) { skipped++; continue; }
        queue.push(f);
      }
      const total = queue.length;
      setGifStatus(`Selected ${files.length}. Skipping ${skipped} already uploaded, uploading ${total} missing files automatically…`);

      // 3) Upload with bounded concurrency + retry
      const CONCURRENCY = 10;
      const RETRIES = 4;
      let cursor = 0;
      let done = 0;

      async function uploadOne(f: File) {
        const id = f.name.replace(/\.gif$/i, "").trim();
        const path = `${id}.gif`;
        let lastErr: any = null;
        for (let attempt = 0; attempt <= RETRIES; attempt++) {
          const { error: upErr } = await supabase.storage
            .from("exercise-gifs")
            .upload(path, f, { upsert: true, contentType: "image/gif" });
          if (!upErr) {
            uploaded++;
            matched++;
            return;
          }
          lastErr = upErr;
          await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        }
        failed++;
        if (errors.length < 20) errors.push(`${f.name}: ${lastErr?.message ?? lastErr}`);
      }

      async function worker() {
        while (cursor < queue.length) {
          const idx = cursor++;
          await uploadOne(queue[idx]);
          done++;
          if (done % 5 === 0 || done === total) {
            setGifProgress(total === 0 ? 100 : Math.round((done / total) * 100));
            setGifStatus(`Uploaded ${uploaded} · skipped ${skipped} · failed ${failed} (${done}/${total})`);
          }
        }
      }
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, Math.max(1, total)) }, worker));

      setGifStatus("Connecting uploaded and already-existing GIFs to the exercise rows…");
      setGifProgress(95);
      const linkResult = await linkGifRows(selectedIds);

      setGifStatus(`Done. ${uploaded} uploaded, ${skipped} already existed, ${linkResult.linked} linked to exercises, ${failed + linkResult.failed} failed.` +
        (errors.length ? ` First errors: ${errors.slice(0, 5).join(" | ")}` : ""));
      if (failed > 0) console.warn("GIF upload errors:", errors);
      await loadAll();
    } catch (err: any) {
      setGifStatus(`Failed: ${err?.message ?? err}`);
    } finally {
      setGifBusy(false);
      if (gifRef.current) gifRef.current.value = "";
    }
  }

  const filtered = rows.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.id.toLowerCase().includes(q) || r.name.toLowerCase().includes(q) || (r.target ?? "").toLowerCase().includes(q) || (r.body_part ?? "").toLowerCase().includes(q);
    return matchesSearch && (!showMissingOnly || !r.gif_url);
  });
  const withGif = rows.filter((r) => !!r.gif_url).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Exercise library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Upload your ExerciseDB-style JSON and bulk-upload GIFs. GIF filenames must match each exercise <code>id</code> (e.g. <code>0001.gif</code>).</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Stat icon={Database} label="Exercises" value={loading ? "…" : rows.length} />
        <Stat icon={ImageIcon} label="With GIF" value={loading ? "…" : withGif} />
        <Stat icon={Upload} label="Missing GIF" value={loading ? "…" : rows.length - withGif} />
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <Card title="1 · Upload exercises (JSON)">
          <input ref={jsonRef} type="file" accept="application/json,.json" onChange={handleJSON} disabled={jsonBusy} className="text-sm" />
          <p className="mt-2 text-xs text-muted-foreground">Fields: id, name, bodyPart, equipment, target, secondaryMuscles[], instructions[], description, difficulty, category</p>
          {jsonBusy || jsonStatus ? (
            <div className="mt-3 space-y-2">
              <Progress value={jsonProgress} />
              <div className="text-xs text-muted-foreground">{jsonStatus}</div>
            </div>
          ) : null}
        </Card>

        <Card title="2 · Upload GIFs (bulk)">
          <input ref={gifRef} type="file" accept="image/gif" multiple onChange={handleGIFs} disabled={gifBusy} className="text-sm" />
          <p className="mt-2 text-xs text-muted-foreground">Pick the whole GIF folder again in one selection. Already uploaded files are skipped automatically; only missing files upload.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={repairExistingLinks} disabled={gifBusy} className="rounded-xl">
              <Wrench className="mr-2 h-4 w-4" /> Repair existing GIF links
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={downloadMissingList} disabled={loading || rows.length === 0} className="rounded-xl">
              <FileDown className="mr-2 h-4 w-4" /> Download missing list
            </Button>
          </div>
          {gifBusy || gifStatus ? (
            <div className="mt-3 space-y-2">
              <Progress value={gifProgress} />
              <div className="text-xs text-muted-foreground">{gifStatus}</div>
            </div>
          ) : null}
        </Card>
      </section>

      <section className="rounded-3xl bg-card p-4 shadow-card">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, target, body part" className="h-10 rounded-xl" />
          <Button type="button" variant={showMissingOnly ? "default" : "outline"} size="sm" onClick={() => setShowMissingOnly((v) => !v)} className="h-10 rounded-xl whitespace-nowrap">
            Missing only
          </Button>
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
        </div>
        <div className="mt-3 max-h-[420px] overflow-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Body part</th>
                <th className="px-3 py-2">Equipment</th>
                <th className="px-3 py-2">GIF</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 300).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2 font-mono text-xs">{r.id}</td>
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.body_part}</td>
                  <td className="px-3 py-2 text-muted-foreground">{r.equipment}</td>
                  <td className="px-3 py-2">{r.gif_url ? "✅" : "—"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">No exercises yet. Upload a JSON above to start.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {filtered.length > 300 && <p className="mt-2 text-xs text-muted-foreground">Showing first 300 results — refine search to see more.</p>}
      </section>

      <section className="rounded-3xl bg-card p-4 shadow-card">
        <h3 className="text-base font-bold">Curated names not resolved to a library row</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          These are SmartyMove curated exercises (per pain area + category) that don't currently match any row in <code>public.exercises</code> with a GIF. Seed them or rename library rows so the engine can pick them.
        </p>
        {unresolvedLoading ? (
          <div className="mt-3 text-sm text-muted-foreground">Checking…</div>
        ) : unresolved.length === 0 ? (
          <div className="mt-3 text-sm text-success">All curated names resolve. 🎉</div>
        ) : (
          <div className="mt-3 max-h-72 overflow-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr><th className="px-3 py-2">Area</th><th className="px-3 py-2">Category</th><th className="px-3 py-2">Canonical name</th></tr>
              </thead>
              <tbody>
                {unresolved.map((u, i) => (
                  <tr key={`${u.area}-${u.category}-${i}`} className="border-t border-border">
                    <td className="px-3 py-2 capitalize">{u.area.replace("_", " ")}</td>
                    <td className="px-3 py-2 capitalize">{u.category}</td>
                    <td className="px-3 py-2 font-medium">{u.canonical}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-card p-5 shadow-card">
      <h3 className="text-base font-bold">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-card">
      <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient-soft text-primary"><Icon className="h-5 w-5" /></span>
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="text-lg font-extrabold">{value}</div>
      </div>
    </div>
  );
}