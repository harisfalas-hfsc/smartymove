import { createFileRoute } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy | SmartyMove" },
      { name: "description", content: "How SmartyMove collects, uses, and protects your personal data — GDPR-compliant privacy policy for our movement diagnostic and corrective program." },
      { property: "og:title", content: "Privacy Policy — SmartyMove" },
      { property: "og:description", content: "How SmartyMove protects your personal data and movement-screening results." },
      { property: "og:url", content: "https://smartymove.com/privacy" },
    ],
    links: [
      { rel: "canonical", href: "https://smartymove.com/privacy" },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <LegalLayout title="Privacy Policy" icon={<Shield className="h-5 w-5" />} lastUpdated="January 2025">
      <p>
        At <strong>SmartyMove</strong> (smartymove.com) we value your privacy and are committed to
        protecting your personal data. This Privacy Policy explains how SmartyMove collects, uses, stores,
        and protects your information when you use our movement screening and corrective program. Our
        practices comply with the General Data Protection Regulation (GDPR) (EU) 2016/679, the ePrivacy
        Directive 2002/58/EC, and applicable data protection laws worldwide.
      </p>

      <h2>1. Data We Collect</h2>
      <h3>Account &amp; Profile Data</h3>
      <ul>
        <li>Name, email address, age, and password (stored hashed) when you create an account.</li>
        <li>Optional profile information: display name, avatar, timezone, and notification preferences.</li>
        <li>Self-reported information from your readiness questionnaire (e.g. current pain level, recent injuries, ability to walk/run/jump without pain, red-flag symptoms) and the joint/area issues you select.</li>
        <li>Your selected goal (e.g. recover from knee pain, start running, improve general mobility).</li>
        <li>Your acceptance of the liability waiver, with timestamp.</li>
      </ul>

      <h3>Movement Screening Data</h3>
      <ul>
        <li><strong>On-device processing only:</strong> Pose detection runs locally in your browser using MediaPipe. Raw camera frames are <strong>not</strong> uploaded to our servers and are not stored.</li>
        <li>We do store the <strong>derived metrics</strong> from each screen: joint angles, sub-scores (mobility, control, symmetry), Movement Score, Movement Age estimate, and the timestamp of each screen.</li>
        <li>Your corrective program selections, completions, streaks, and re-screen history.</li>
      </ul>

      <h3>Usage &amp; Technical Data</h3>
      <ul>
        <li>Technical data such as IP address, browser type, device type, and operating system.</li>
        <li>Aggregated usage analytics (which screens you start, which corrective routines you complete).</li>
        <li>Push notification tokens, if you enable notifications.</li>
      </ul>

      <h2>2. How We Use Your Data</h2>
      <ul>
        <li>Provide and personalize the movement screens, scoring, and corrective program.</li>
        <li>Filter out tests that are unsafe based on your readiness questionnaire and selected joint issues.</li>
        <li>Calculate your Movement Score, Movement Age, and progress over time.</li>
        <li>Process payments and subscriptions via Stripe.</li>
        <li>Send transactional emails (account, security, billing) and, with consent, product updates.</li>
        <li>Send in-app reminders for daily routines and re-screens.</li>
        <li>Improve SmartyMove through anonymized, aggregated analytics.</li>
        <li>Ensure legal compliance and platform security.</li>
      </ul>
      <p><strong>We will never sell or rent your personal data to third parties.</strong></p>

      <h2>3. Legal Basis for Processing (GDPR Article 6)</h2>
      <ul>
        <li><strong>Consent (Art. 6(1)(a)):</strong> Push notifications, marketing emails, optional analytics.</li>
        <li><strong>Contractual necessity (Art. 6(1)(b)):</strong> Running the app, screens, scoring, and your subscription.</li>
        <li><strong>Legal obligation (Art. 6(1)(c)):</strong> Tax and accounting records, fraud prevention.</li>
        <li><strong>Legitimate interests (Art. 6(1)(f)):</strong> Service security, fraud prevention, product improvement.</li>
        <li><strong>Health-related self-reports</strong> from the readiness questionnaire and joint-issue selection are processed only with your explicit consent and used solely to make the in-app experience safer for you. We do not share them for any other purpose.</li>
      </ul>

      <h2>4. Data Sharing &amp; Sub-Processors</h2>
      <ul>
        <li><strong>Stripe</strong> — payment processing (PCI DSS compliant).{" "}
          <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">Stripe Privacy Policy</a></li>
        <li><strong>Lovable Cloud (Supabase infrastructure)</strong> — database hosting and authentication (EU region).</li>
        <li><strong>MediaPipe (Google)</strong> — pose detection model that runs locally in your browser. No video data is transmitted to MediaPipe servers.</li>
        <li><strong>Email delivery provider</strong> — for transactional and (with consent) marketing emails.</li>
      </ul>
      <p>All processors are required to comply with GDPR standards and maintain appropriate technical and organizational security measures.</p>

      <h2>5. Data Retention</h2>
      <ul>
        <li><strong>Account data:</strong> retained while your account is active and for up to 30 days after a deletion request.</li>
        <li><strong>Screening &amp; corrective program data:</strong> retained while your account is active.</li>
        <li><strong>Transaction records:</strong> retained for 7 years as required by tax law.</li>
        <li><strong>Marketing preferences:</strong> retained until you withdraw consent.</li>
        <li><strong>Anonymized analytics:</strong> may be retained beyond account deletion in fully anonymized form.</li>
      </ul>

      <h2>6. Your Rights Under GDPR</h2>
      <ul>
        <li><strong>Right of Access (Art. 15):</strong> Request a copy of the personal data we hold about you.</li>
        <li><strong>Right to Rectification (Art. 16):</strong> Request correction of inaccurate data.</li>
        <li><strong>Right to Erasure (Art. 17):</strong> Request deletion of your personal data via your profile settings.</li>
        <li><strong>Right to Restrict Processing (Art. 18):</strong> Request limitation of how we process your data.</li>
        <li><strong>Right to Data Portability (Art. 20):</strong> Receive your data in a structured, machine-readable format.</li>
        <li><strong>Right to Object (Art. 21):</strong> Object to processing based on legitimate interests or direct marketing.</li>
        <li><strong>Right to Withdraw Consent (Art. 7):</strong> Withdraw consent at any time for consent-based processing.</li>
        <li><strong>Right to Lodge a Complaint:</strong> You may lodge a complaint with your local data protection authority.</li>
      </ul>
      <div className="note">
        To exercise these rights, use the controls in your profile settings or email{" "}
        <a href="mailto:hello@smartymove.com">hello@smartymove.com</a>. We respond within 30 days.
      </div>

      <h2>7. Security Measures</h2>
      <ul>
        <li>Encryption in transit (TLS 1.2+) and at rest (AES-256).</li>
        <li>Hashed passwords and secure session management.</li>
        <li>Row Level Security (RLS) ensuring each user can only access their own data.</li>
        <li>Camera processing performed locally on your device — raw video is never uploaded.</li>
        <li>Strict access controls and least-privilege principles for any operator access.</li>
        <li>Regular dependency, infrastructure, and security reviews.</li>
      </ul>

      <h2>8. Cookies &amp; Local Storage</h2>
      <p>SmartyMove uses cookies and local storage for the following purposes:</p>
      <ul>
        <li><strong>Essential:</strong> authentication tokens, session security, fraud prevention.</li>
        <li><strong>Functional:</strong> UI preferences, onboarding state, last-viewed screens.</li>
        <li><strong>Third-party (Stripe):</strong> payment fraud prevention at checkout.</li>
      </ul>
      <p>You can manage cookies via your browser settings; disabling essential cookies will break core functionality.</p>

      <h2>9. Children</h2>
      <p>
        SmartyMove is intended for users aged 18 and over. Users between 13 and 18 may only use SmartyMove
        with parental or guardian supervision and consent. We do not knowingly collect data from children
        under 13. If you believe we have, contact us at{" "}
        <a href="mailto:hello@smartymove.com">hello@smartymove.com</a> and we will delete it.
      </p>

      <h2>10. International Transfers</h2>
      <p>
        Your data is primarily processed within the EU. Where transfers outside the EU are necessary, we
        rely on Standard Contractual Clauses or other lawful transfer mechanisms approved under GDPR.
      </p>

      <h2>11. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify users of material changes via
        the app or email. The &quot;Last updated&quot; date at the top reflects the latest revision.
      </p>

      <h2>12. Contact</h2>
      <p>
        Data Controller: <strong>SmartyMove</strong> (smartymove.com). For privacy questions or to exercise
        your rights, contact <a href="mailto:hello@smartymove.com">hello@smartymove.com</a>.
      </p>
    </LegalLayout>
  );
}
