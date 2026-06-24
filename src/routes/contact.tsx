import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, Paperclip, CheckCircle2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact SmartyMove — We answer in 24–48 hours" },
      { name: "description", content: "Get in touch with the SmartyMove team. Questions, feedback, partnership, support — we reply within 24–48 hours." },
      { property: "og:title", content: "Contact SmartyMove" },
      { property: "og:description", content: "Questions, feedback, or support? We reply within 24–48 hours." },
      { property: "og:url", content: "https://smartymove.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://smartymove.com/contact" }],
  }),
  component: Contact,
});

function Contact() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSending(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    // Honeypot anti-spam (FormSubmit convention)
    fd.append("_captcha", "false");
    fd.append("_template", "table");
    fd.append("_subject", `[SmartyMove] ${String(fd.get("subject") || "New contact message")}`);
    try {
      const res = await fetch("https://formsubmit.co/ajax/smartymove@outlook.com", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("send_failed");
      setSent(true);
      form.reset();
      setFiles([]);
    } catch {
      setError("We couldn't send your message. Please email smartymove@outlook.com directly.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] w-full flex-col" style={{ background: "#E7ECEC", color: "#14213A" }}>
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] px-5 pb-8 pt-5">
        <div
          className="relative overflow-hidden"
          style={{ background: "linear-gradient(160deg,#0E7C86 0%, #1f6fa8 100%)", borderRadius: 22, padding: "26px 22px 28px", color: "#fff" }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".14em", textTransform: "uppercase", fontWeight: 700, opacity: 0.85 }}>Contact</div>
          <h1 style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.15, letterSpacing: "-0.02em", margin: "10px 0 10px" }}>
            We'd love to hear from you
          </h1>
          <p style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.95, margin: 0 }}>
            Questions, ideas, feedback, partnerships, or a bug? Send us a note — we usually reply within{" "}
            <strong style={{ color: "#7CFFB8" }}>24 to 48 hours</strong>.
          </p>
        </div>

        {sent ? (
          <section className="mt-4 rounded-3xl bg-white p-7 text-center shadow" style={{ border: "1px solid #E5EAEC" }}>
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ background: "#E6F4F1", color: "#0E7C86" }}>
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-xl font-extrabold" style={{ color: "#14213A" }}>Message sent</h2>
            <p className="mt-1 text-sm" style={{ color: "#3B4A63" }}>
              Thanks — we've received your message and will reply within 24–48 hours.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 inline-flex h-11 items-center justify-center rounded-2xl px-5 text-sm font-semibold" style={{ background: "#0E7C86", color: "#fff" }}>
              Send another
            </button>
          </section>
        ) : (
          <section className="mt-4 rounded-3xl bg-white p-6 shadow" style={{ border: "1px solid #E5EAEC" }}>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Your name" name="name" required placeholder="Jane Doe" />
                <Field label="Email" name="email" type="email" required placeholder="you@example.com" />
              </div>
              <Field label="Subject" name="subject" required placeholder="What's this about?" />
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#6B7A90" }}>
                  Message
                </label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us what's on your mind…"
                  className="w-full rounded-2xl border bg-white p-3 text-sm outline-none focus:border-[#0E7C86]"
                  style={{ borderColor: "#D9E0E2", color: "#14213A" }}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#6B7A90" }}>
                  Attachments (optional)
                </label>
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed p-4"
                  style={{ borderColor: "#0E7C86", background: "#F1F5F4" }}
                >
                  <Paperclip className="h-5 w-5" style={{ color: "#0E7C86" }} />
                  <span className="text-sm font-semibold" style={{ color: "#0E7C86" }}>
                    {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} attached` : "Add screenshots, photos, or PDFs"}
                  </span>
                  <input
                    type="file"
                    name="attachment"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    className="hidden"
                  />
                </label>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f, i) => (
                      <li key={i} className="text-[11px]" style={{ color: "#3B4A63" }}>• {f.name} ({Math.round(f.size / 1024)} KB)</li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Honeypot */}
              <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

              {error && <div className="rounded-2xl p-3 text-sm" style={{ background: "#FFF4F0", color: "#B23A1A", border: "1px solid #FFD7CB" }}>{error}</div>}

              <button
                type="submit"
                disabled={sending}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl font-bold text-white shadow disabled:opacity-60"
                style={{ background: "linear-gradient(160deg,#0E7C86,#1f6fa8)" }}
              >
                <Send className="h-4 w-4" /> {sending ? "Sending…" : "Send message"}
              </button>
              <p className="text-center text-[11px]" style={{ color: "#6B7A90" }}>
                Or email us directly at{" "}
                <a href="mailto:smartymove@outlook.com" style={{ color: "#0E7C86", fontWeight: 600 }}>smartymove@outlook.com</a>
              </p>
            </form>
          </section>
        )}

        <div className="mt-4 flex items-center justify-center gap-2 text-sm" style={{ color: "#3B4A63" }}>
          <Mail className="h-4 w-4" style={{ color: "#0E7C86" }} />
          We reply within 24–48 hours.
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest" style={{ color: "#6B7A90" }}>{label}</label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="h-11 w-full rounded-2xl border bg-white px-3 text-sm outline-none focus:border-[#0E7C86]"
        style={{ borderColor: "#D9E0E2", color: "#14213A" }}
      />
    </div>
  );
}