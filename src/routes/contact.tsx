import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Mail, Send, Paperclip, CheckCircle2, Clock, MessageSquare, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />

      {/* MOBILE — untouched */}
      <main className="mx-auto w-full max-w-[760px] flex-1 px-4 pb-6 pt-4 space-y-6 lg:hidden">
        {/* Hero card */}
        <Card className="border-2 border-primary">
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Mail className="w-12 h-12 text-primary mx-auto" />
              <h1 className="text-2xl font-bold text-foreground">
                Get in <span className="text-primary">Touch</span>
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Questions, feedback, partnerships, or a bug? Drop us a message — we reply within{" "}
                <strong className="text-primary">24 to 48 hours</strong>.
              </p>
              <div className="grid grid-cols-3 gap-3 pt-2">
                <MiniInfo Icon={Clock} color="text-blue-500" label="24–48h reply" />
                <MiniInfo Icon={MessageSquare} color="text-emerald-500" label="Real humans" />
                <MiniInfo Icon={ShieldCheck} color="text-purple-500" label="Private" />
              </div>
            </div>
          </CardContent>
        </Card>

        {sent ? (
          <Card className="border-2 border-primary">
            <CardContent className="p-6 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h2 className="text-xl font-bold text-foreground">Message sent</h2>
              <p className="text-sm text-muted-foreground">
                Thanks — we've received your message and will reply within 24–48 hours.
              </p>
              <Button onClick={() => setSent(false)} className="w-full">Send another</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-primary">
            <CardContent className="p-6">
              <div className="text-center space-y-1 mb-4">
                <Send className="w-10 h-10 text-primary mx-auto" />
                <h2 className="text-xl font-bold text-foreground">Send us a Message</h2>
                <p className="text-xs text-muted-foreground">Fill the form below — we'll get back to you soon.</p>
              </div>
              <ContactForm onSubmit={onSubmit} sending={sending} error={error} files={files} setFiles={setFiles} />
            </CardContent>
          </Card>
        )}

      </main>

      {/* DESKTOP — SmartyDiet-inspired layout */}
      <main className="hidden lg:block flex-1 w-full">
        <div className="mx-auto w-full max-w-[1080px] px-6 pt-16 pb-20 space-y-12">
          {/* Hero */}
          <div className="rounded-[32px] border-2 border-primary bg-white p-14 text-center">
            <div className="mx-auto grid place-items-center h-20 w-20 rounded-2xl text-primary">
              <Mail className="h-16 w-16" strokeWidth={1.8} />
            </div>
            <div className="mt-6 text-[46px] leading-[1.05] font-extrabold tracking-tight text-[#0f172a]">
              Get in <span className="text-primary">Touch</span>
            </div>
            <p className="mt-5 text-lg text-slate-500 max-w-2xl mx-auto">
              Questions, feedback, partnerships, or a bug? Drop us a message — we reply within{" "}
              <strong className="text-primary">24 to 48 hours</strong>.
            </p>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-2xl mx-auto">
              <DesktopBadge Icon={Clock} label="24–48h reply" />
              <DesktopBadge Icon={MessageSquare} label="Real humans" />
              <DesktopBadge Icon={ShieldCheck} label="Private" />
            </div>
          </div>

          {sent ? (
            <div className="rounded-[32px] border-2 border-primary bg-white p-14 text-center">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h2 className="mt-4 text-3xl font-extrabold text-[#0f172a]">Message sent</h2>
              <p className="mt-3 text-slate-500">Thanks — we've received your message and will reply within 24–48 hours.</p>
              <Button onClick={() => setSent(false)} size="lg" className="mt-6">Send another</Button>
            </div>
          ) : (
            <div className="rounded-[32px] border-2 border-primary bg-white p-14">
              <div className="text-center">
                <Send className="w-14 h-14 text-primary mx-auto" />
                <h2 className="mt-4 text-3xl font-extrabold text-[#0f172a]">Send us a Message</h2>
                <p className="mt-2 text-slate-500">Fill the form below — we'll get back to you soon.</p>
              </div>
              <div className="mt-10 max-w-2xl mx-auto">
                <ContactForm onSubmit={onSubmit} sending={sending} error={error} files={files} setFiles={setFiles} />
              </div>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

function ContactForm({
  onSubmit,
  sending,
  error,
  files,
  setFiles,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  sending: boolean;
  error: string | null;
  files: File[];
  setFiles: (f: File[]) => void;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="name">Name *</Label>
                    <Input id="name" name="name" required placeholder="Your full name" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" name="email" type="email" required placeholder="you@example.com" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="subject">Subject *</Label>
                  <Input id="subject" name="subject" required placeholder="How can we help?" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea id="message" name="message" required rows={6} placeholder="Tell us what's on your mind…" className="resize-none" />
                </div>

                <div className="space-y-1.5">
                  <Label>Attachments (Optional)</Label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-sm font-semibold text-primary hover:bg-primary/10">
                    <Paperclip className="h-4 w-4" />
                    {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} attached` : "Attach screenshots or PDFs"}
                    <input
                      type="file"
                      name="attachment"
                      multiple
                      onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                      className="hidden"
                    />
                  </label>
                  {files.length > 0 && (
                    <ul className="mt-1 space-y-0.5">
                      {files.map((f, i) => (
                        <li key={i} className="text-xs text-muted-foreground">• {f.name} ({Math.round(f.size / 1024)} KB)</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Honeypot */}
                <input type="text" name="_honey" style={{ display: "none" }} tabIndex={-1} autoComplete="off" />

                {error && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="w-full" disabled={sending}>
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Sending…" : "Send Message"}
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  Or email us directly at{" "}
                  <a href="mailto:smartymove@outlook.com" className="font-semibold text-primary hover:underline">smartymove@outlook.com</a>
                </p>
    </form>
  );
}

function DesktopBadge({ Icon, label }: { Icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 py-5">
      <Icon className="h-6 w-6 text-primary" />
      <span className="text-sm font-bold text-[#0f172a]">{label}</span>
    </div>
  );
}

function MiniInfo({ Icon, color, label }: { Icon: any; color: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Icon className={`w-5 h-5 ${color}`} />
      <span className="text-[11px] font-semibold text-foreground text-center leading-tight">{label}</span>
    </div>
  );
}