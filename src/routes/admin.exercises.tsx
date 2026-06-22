import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Upload, Image as ImageIcon, Database, Search } from "lucide-react";

export const Route = createFileRoute("/admin/exercises")({ component: AdminExercises });

type Row = {
  id: string;
  name: string;
  body_part: string | null;
  equipment: string | null;
  target: string | null;
  gif_url: string | null;
};

const PASS_KEY = "smartymove.adminPass";
const ADMIN_PASS = "smarty-admin";

function AdminExercises() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem(PASS_KEY) === ADMIN_PASS) {
      setAuthed(true);
    }
  }, []);

  if (!authed) {
    return (
      <Shell>
        <div className="mx-auto mt-10 max-w-sm rounded-3xl bg-card p-6 shadow-card">
          <h1 className="text-xl font-extrabold">Admin access</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the admin passphrase to manage the exercise library.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pass === ADMIN_PASS) {
                localStorage.setItem(PASS_KEY, ADMIN_PASS);
                setAuthed(true);
              } else alert("Wrong passphrase");
            }}
            className="mt-4 flex flex-col gap-3"
          >
            <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Passphrase" className="h-11 rounded-xl" />
            <Button type="submit" className="h-11 rounded-2xl brand-gradient text-sm font-semibold">Unlock</Button>
          </form>
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

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [jsonBusy, setJsonBusy] = useState(false);
  const [jsonProgress, setJsonProgress] = useState(0);
  const [jsonStatus, setJsonStatus] = useState("");

  const [gifBusy, setGifBusy] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [gifStatus, setGifStatus] = useState("");

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

  async function handleGIFs(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setGifBusy(true); setGifProgress(0); setGifStatus(`Uploading ${files.length} files…`);
    let uploaded = 0, matched = 0;
    try {
      for (let i = 0; i < files.length; i++) {
        const f = files[i];
        const id = f.name.replace(/\.gif$/i, "").trim();
        const path = `${id}.gif`;
        const { error: upErr } = await supabase.storage
          .from("exercise-gifs")
          .upload(path, f, { upsert: true, contentType: "image/gif" });
        if (upErr) { console.error(upErr); continue; }
        uploaded++;
        const { error: updErr } = await supabase
          .from("exercises")
          .update({ gif_url: path })
          .eq("id", id);
        if (!updErr) matched++;
        setGifProgress(Math.round(((i + 1) / files.length) * 100));
        setGifStatus(`Uploaded ${uploaded}, matched ${matched} / ${files.length}`);
      }
      setGifStatus(`Done. ${uploaded} uploaded, ${matched} matched.`);
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
    return !q || r.name.toLowerCase().includes(q) || (r.target ?? "").toLowerCase().includes(q) || (r.body_part ?? "").toLowerCase().includes(q);
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
          <p className="mt-2 text-xs text-muted-foreground">Pick all your <code>.gif</code> files at once. Filenames are matched to the exercise id.</p>
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