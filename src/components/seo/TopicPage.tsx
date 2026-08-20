import { Link, type LinkProps } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Play } from "lucide-react";

export interface TopicSection {
  h: string;
  p: string[];
  list?: string[];
}

export interface TopicFaq {
  q: string;
  a: string;
}

export interface TopicLink {
  to: LinkProps["to"];
  label: string;
  blurb: string;
}

export interface TopicPageProps {
  eyebrow: string;
  h1: string;
  intro: string;
  keyFacts?: string[];
  sections: TopicSection[];
  faqs: TopicFaq[];
  related: TopicLink[];
  ctaTitle: string;
  ctaBody: string;
}

export function TopicPage({
  eyebrow,
  h1,
  intro,
  keyFacts,
  sections,
  faqs,
  related,
  ctaTitle,
  ctaBody,
}: TopicPageProps) {
  return (
    <div className="flex min-h-[100dvh] w-full flex-col bg-background text-foreground">
      <SiteHeader showBack />
      <main className="mx-auto w-full max-w-[760px] lg:max-w-4xl flex-1 px-4 lg:px-8 pb-10 pt-4 lg:pt-8 space-y-6">
        <header className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
          <h1 className="text-2xl lg:text-4xl font-bold leading-tight text-foreground">{h1}</h1>
          <p className="text-base lg:text-lg leading-relaxed text-muted-foreground">{intro}</p>
        </header>

        {keyFacts && keyFacts.length > 0 && (
          <Card className="border-2 border-primary/40">
            <CardContent className="p-5">
              <h2 className="text-base lg:text-lg font-bold text-foreground">In short</h2>
              <ul className="mt-3 space-y-2">
                {keyFacts.map((f) => (
                  <li key={f} className="flex gap-2 text-sm lg:text-base leading-relaxed text-muted-foreground">
                    <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <article className="space-y-7">
          {sections.map((s) => (
            <section key={s.h} className="space-y-2">
              <h2 className="text-xl lg:text-2xl font-bold text-foreground">{s.h}</h2>
              {s.p.map((para) => (
                <p key={para} className="text-sm lg:text-base leading-relaxed text-muted-foreground">
                  {para}
                </p>
              ))}
              {s.list && (
                <ul className="mt-2 space-y-2">
                  {s.list.map((item) => (
                    <li key={item} className="flex gap-2 text-sm lg:text-base leading-relaxed text-muted-foreground">
                      <span aria-hidden="true" className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </article>

        {faqs.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-xl lg:text-2xl font-bold text-foreground">Common questions</h2>
            <div className="divide-y divide-border rounded-2xl border border-border bg-card">
              {faqs.map((f) => (
                <div key={f.q} className="p-4 lg:p-5">
                  <h3 className="text-sm lg:text-base font-bold text-foreground">{f.q}</h3>
                  <p className="mt-1 text-sm lg:text-base leading-relaxed text-muted-foreground">{f.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="space-y-3">
          <h2 className="text-xl lg:text-2xl font-bold text-foreground">Keep reading</h2>
          <ul className="grid gap-3 lg:grid-cols-2">
            {related.map((l) => (
              <li key={String(l.to)}>
                <Link
                  to={l.to}
                  className="flex h-full items-start gap-2 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
                >
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm lg:text-base font-bold text-foreground">{l.label}</span>
                    <span className="mt-1 block text-xs lg:text-sm leading-relaxed text-muted-foreground">
                      {l.blurb}
                    </span>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Card className="border-2 border-primary">
          <CardContent className="space-y-3 p-6 text-center">
            <h2 className="text-xl font-bold text-foreground">{ctaTitle}</h2>
            <p className="text-sm lg:text-base text-muted-foreground">{ctaBody}</p>
            <Link to="/app/screen" className="block">
              <Button size="lg" className="mt-1 w-full">
                <Play className="mr-2 h-4 w-4" /> Start your movement screen
              </Button>
            </Link>
            <p className="text-[11px] text-muted-foreground">
              SmartyMove is a wellness and education tool. It does not diagnose injuries or medical conditions.
            </p>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}

/** Builds the JSON-LD graph shared by every SEO topic page. */
export function topicJsonLd(opts: {
  url: string;
  name: string;
  description: string;
  breadcrumb: string;
  faqs: TopicFaq[];
}) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": opts.url,
        url: opts.url,
        name: opts.name,
        description: opts.description,
        inLanguage: "en",
        isPartOf: { "@id": "https://smartymove.com/#website" },
        about: { "@id": "https://smartymove.com/#software" },
        publisher: { "@id": "https://smartymove.com/#organization" },
        speakable: { "@type": "SpeakableSpecification", cssSelector: ["h1", "h2", "p"] },
      },
      {
        "@type": "FAQPage",
        mainEntity: opts.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: "https://smartymove.com/" },
          { "@type": "ListItem", position: 2, name: opts.breadcrumb, item: opts.url },
        ],
      },
    ],
  });
}
