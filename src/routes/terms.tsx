import { createFileRoute } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions | SmartyMove" },
      { name: "description", content: "Terms and conditions for using SmartyMove — a mobile-first movement screening and corrective program app, part of the Smarty family." },
      { property: "og:title", content: "Terms & Conditions — SmartyMove" },
      { property: "og:description", content: "Legal terms for using the SmartyMove movement diagnostic and corrective program app." },
      { property: "og:url", content: "https://smartymove.com/terms" },
    ],
    links: [
      { rel: "canonical", href: "https://smartymove.com/terms" },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <LegalLayout title="Terms & Conditions" icon={<FileText className="h-5 w-5" />} lastUpdated="January 2025">
      <p>
        Welcome to <strong>SmartyMove</strong> (smartymove.com). By accessing or using our mobile-first
        movement diagnostic and corrective program, you agree to comply with and be bound by the following
        Terms &amp; Conditions. Please read them carefully before using SmartyMove.
      </p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using SmartyMove, you confirm that you have read, understood, and agree to these
        Terms &amp; Conditions. If you do not agree, please do not use our website or app.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be at least 18 years old to use SmartyMove. By creating an account, you confirm that you are
        legally capable of entering into binding contracts under applicable international and EU law. If you
        are between 13 and 18, you may only use SmartyMove with the supervision and explicit consent of a
        parent or legal guardian.
      </p>

      <h2>3. What SmartyMove Is</h2>
      <p>
        SmartyMove is a mobile-first app that screens how well your body moves, estimates a Movement Score
        and Movement Age, and gives you a personalized 5-minute daily corrective program that evolves over
        time. Specifically, SmartyMove provides:
      </p>
      <ul>
        <li>A camera-based movement screening using on-device pose detection.</li>
        <li>A Movement Score, sub-scores, and a Movement Age estimate, all derived from your screening.</li>
        <li>Short daily corrective routines tailored to your screening results, restrictions, and goals.</li>
        <li>Progress tracking, re-screens, and a future-projection view of how your Movement Age can evolve.</li>
        <li>A readiness questionnaire (PAR-Q-style), joint/area issue selection, and a liability waiver.</li>
      </ul>
      <p>
        SmartyMove is a <strong>movement-quality diagnostic and corrective specialist</strong>. It is not a
        general fitness platform, gym, training program library, or weight-loss product. For broader fitness
        content, see our sister product SmartyGym (smartygym.com) — the two are separate apps with separate
        accounts.
      </p>
      <p>
        SmartyMove is intended for <strong>personal educational and wellness purposes only</strong> and is
        not a substitute for medical advice, diagnosis, treatment, physiotherapy, or any other regulated
        healthcare service.
      </p>

      <h2>4. Account Registration</h2>
      <ul>
        <li>You must provide accurate, complete, and up-to-date information when creating your account.</li>
        <li>You are responsible for maintaining the confidentiality of your login credentials.</li>
        <li>You agree not to share your account with others.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
        <li>Any unauthorized use of your account must be reported to us immediately at smartymove@outlook.com.</li>
      </ul>

      <h2>5. Subscription &amp; Payments</h2>
      <ul>
        <li>SmartyMove offers a free tier and one or more <strong>Premium</strong> subscription tiers that unlock advanced features such as re-screens, expanded joint-specific tests, deeper analytics, and longer corrective programs.</li>
        <li>Payments are processed securely via Stripe, a PCI DSS compliant payment processor. We do not store full payment card details on our servers.</li>
        <li>All fees are stated in Euros (€) and, where applicable, include VAT.</li>
        <li>Subscription pricing, renewal terms, and trial details are presented at the point of purchase and form part of these Terms.</li>
      </ul>

      <h2>6. Refunds &amp; Withdrawal (EU Consumer Rights)</h2>
      <ul>
        <li>Under EU Directive 2011/83/EU, EU consumers ordinarily have a <strong>14-day right of withdrawal</strong> for digital services that have not yet started.</li>
        <li>By starting to use premium SmartyMove content immediately after purchase, you expressly request immediate performance and acknowledge that you waive your right of withdrawal once the service has begun.</li>
        <li>No refunds will be provided once premium content has been accessed, except where required by applicable law.</li>
        <li>Your statutory consumer rights under EU and national law remain unaffected.</li>
      </ul>

      <h2>7. Health &amp; Safety Requirements</h2>
      <ul>
        <li>
          <strong>Mandatory readiness check:</strong> Before performing any movement screen or corrective
          routine, you MUST complete the in-app <strong>PAR-Q-style readiness questionnaire</strong> and
          accept the liability waiver on our Disclaimer page.
        </li>
        <li>
          <strong>Medical consultation:</strong> Always consult a qualified medical professional before
          beginning any new movement, exercise, or rehabilitation program, especially if you have
          pre-existing health conditions, recent injuries, surgery, pregnancy, cardiovascular issues, or any
          concerns about your ability to exercise safely.
        </li>
        <li>
          <strong>Red-flag symptoms:</strong> If you experience numbness, unexplained pain, pain at night,
          loss of bowel or bladder control, or any other red-flag symptoms, you must stop using SmartyMove
          and seek medical care immediately.
        </li>
        <li>
          All movement screens, scores, and corrective routines are designed for general wellness and
          movement-quality purposes and are not a medical diagnosis or treatment.
        </li>
        <li>
          SmartyMove is not responsible for injuries, health issues, or adverse effects resulting from
          participation in the screens or programs.
        </li>
        <li>
          <strong>Assumption of risk:</strong> Participation is entirely at your own risk. See our Disclaimer
          page for the complete release of liability.
        </li>
      </ul>

      <h2>8. Camera Use &amp; On-Device Processing</h2>
      <ul>
        <li>SmartyMove uses your device camera only while you are actively running a movement screen and only with your explicit permission.</li>
        <li>Pose detection runs <strong>on-device</strong>. Raw video frames are not uploaded or stored on our servers — only the derived metrics (joint angles, sub-scores, Movement Score, Movement Age, timestamps) are saved.</li>
        <li>You can revoke camera access at any time through your browser or device settings; the screening features will then no longer work.</li>
      </ul>

      <h2>9. Content &amp; Methodology</h2>
      <ul>
        <li>The movement screens, scoring methodology, corrective routines, and educational content in SmartyMove are designed by qualified movement and exercise professionals.</li>
        <li>Limited automation may be used to personalize which existing tests or corrective exercises are surfaced to you based on your screening results and goals. It does not replace clinical judgment.</li>
        <li>All content is for general movement-quality and wellness purposes only and does not constitute medical, physiotherapy, nutritional, or therapeutic advice.</li>
        <li>You are responsible for evaluating whether a given screen or routine is appropriate for your current physical condition.</li>
      </ul>

      <h2>10. Third-Party Services</h2>
      <ul>
        <li><strong>Stripe:</strong> Processes all payments. Stripe&apos;s terms and privacy policy apply.</li>
        <li><strong>Lovable Cloud (Supabase infrastructure):</strong> Hosts the database and authentication.</li>
        <li><strong>MediaPipe (on-device pose detection):</strong> Runs locally in your browser. No frames are sent to MediaPipe servers.</li>
      </ul>
      <p>
        We are not responsible for the actions, policies, or services of third-party providers. You should
        review their terms before using their services through SmartyMove.
      </p>

      <h2>11. Acceptable Use</h2>
      <p>You agree NOT to:</p>
      <ul>
        <li>Reverse engineer, decompile, or attempt to extract the source code of SmartyMove.</li>
        <li>Use SmartyMove for any unlawful, harmful, or fraudulent purpose.</li>
        <li>Upload or transmit any malicious code or attempt to interfere with the service.</li>
        <li>Resell, sublicense, or share access to your account or premium content.</li>
        <li>Use SmartyMove to provide medical advice, diagnosis, or treatment to other people.</li>
      </ul>

      <h2>12. Intellectual Property</h2>
      <p>
        All content, branding, screening methodology, scoring system, corrective routines, source code, and
        copy in SmartyMove are the intellectual property of SmartyMove and its operator and are protected by
        copyright, trademark, and other intellectual property laws. You receive a limited, personal,
        non-transferable, non-exclusive license to use SmartyMove for personal, non-commercial purposes only.
      </p>

      <h2>13. Account Deletion</h2>
      <ul>
        <li>You can delete your account at any time from your profile settings.</li>
        <li>Account deletion permanently removes your profile, screening history, scores, and corrective program data after a short retention window.</li>
        <li>Some records (e.g. transaction history) may be retained where required by tax or legal obligations.</li>
      </ul>

      <h2>14. Limitation of Liability</h2>
      <p>
        To the fullest extent permitted by law, SmartyMove and its operator shall not be liable for any
        indirect, incidental, consequential, special, punitive, or exemplary damages arising from your use
        of SmartyMove, including but not limited to personal injury, loss of data, lost profits, or business
        interruption. Nothing in these Terms excludes liability that cannot be excluded under applicable
        consumer protection law.
      </p>

      <h2>15. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify users of material changes via the app or
        email. Continued use of SmartyMove after changes take effect constitutes acceptance of the updated
        Terms.
      </p>

      <h2>16. Governing Law &amp; Jurisdiction</h2>
      <p>
        These Terms are governed by applicable law and EU regulations. Any disputes shall be subject to the
        jurisdiction of the competent courts, while preserving any mandatory consumer protection rights you
        have in your country of residence.
      </p>

      <h2>17. Contact</h2>
      <p>
        For questions about these Terms, contact us at{" "}
        <a href="mailto:smartymove@outlook.com">smartymove@outlook.com</a>.
      </p>
    </LegalLayout>
  );
}
