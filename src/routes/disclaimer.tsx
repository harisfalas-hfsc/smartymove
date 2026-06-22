import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { LegalLayout } from "@/components/LegalLayout";

export const Route = createFileRoute("/disclaimer")({
  head: () => ({
    meta: [
      { title: "Disclaimer & Release of Liability | SmartyMove" },
      { name: "description", content: "SmartyMove disclaimer, PAR-Q-style readiness statement, and release of liability for our movement screening and corrective program." },
      { property: "og:title", content: "Disclaimer — SmartyMove" },
      { property: "og:description", content: "Important safety, readiness, and liability information for SmartyMove users." },
      { property: "og:url", content: "https://smartymove.com/disclaimer" },
    ],
    links: [
      { rel: "canonical", href: "https://smartymove.com/disclaimer" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap" },
    ],
  }),
  component: Disclaimer,
});

function Disclaimer() {
  return (
    <LegalLayout title="Disclaimer & Release of Liability" icon={<AlertTriangle className="h-5 w-5" />} lastUpdated="January 2025">
      <div className="callout">
        <strong>⚠️ Mandatory readiness check.</strong> Before performing any movement screen or corrective
        routine in SmartyMove, you must complete the in-app PAR-Q-style readiness questionnaire, select any
        joint or area issues you currently have, and accept this Disclaimer &amp; Release of Liability. By
        using SmartyMove you confirm that you have read this disclaimer in full and accept full
        responsibility for your participation.
      </div>

      <p>
        The information provided by <strong>SmartyMove</strong> (smartymove.com) is intended solely for
        <strong> general educational and wellness purposes</strong>. SmartyMove is a movement-quality
        diagnostic and corrective specialist; it is not a physiotherapist, doctor, or any other healthcare
        provider, and it does not provide medical advice, diagnosis, or treatment.
      </p>

      <h2>1. Not Medical Advice</h2>
      <ul>
        <li>The Movement Score, Movement Age estimate, joint sub-scores, corrective routines, and educational content provided by SmartyMove are <strong>for general wellness purposes only</strong>.</li>
        <li>Always <strong>consult a qualified medical professional</strong> (e.g. doctor, physiotherapist) before starting any new movement, exercise, or rehabilitation program — especially if you have a history of medical conditions, injuries, recent surgery, pregnancy, cardiovascular issues, or other health concerns.</li>
        <li>Do not disregard or delay professional medical advice because of information provided by SmartyMove.</li>
        <li>If you experience pain, dizziness, faintness, shortness of breath, numbness, or any other red-flag symptom while using SmartyMove, <strong>stop immediately and seek medical attention</strong>.</li>
      </ul>

      <h2>2. PAR-Q-Style Readiness Questionnaire</h2>
      <ul>
        <li><strong>Required:</strong> You must complete the in-app readiness questionnaire (modeled on the Physical Activity Readiness Questionnaire, PAR-Q) before performing any screen or corrective routine.</li>
        <li>If your answers indicate potential health risks (e.g. recent injury, cardiovascular symptoms, severe pain, red-flag symptoms), SmartyMove will display a warning. You should obtain written clearance from a qualified physician before proceeding.</li>
        <li><strong>Truthful disclosure:</strong> You are responsible for providing accurate and truthful answers in the readiness questionnaire and joint-issue selection. Inaccurate answers may increase your risk of injury.</li>
        <li><strong>Ongoing responsibility:</strong> You must retake the readiness questionnaire if your health status changes, you develop new symptoms, or you have a new injury or surgery.</li>
      </ul>

      <h2>3. Assumption of Risk</h2>
      <ul>
        <li>By using SmartyMove, you <strong>voluntarily assume all risks</strong> associated with physical activity, including any movement screen, corrective routine, mobility drill, balance test, or other movement performed in response to SmartyMove&apos;s prompts.</li>
        <li>Physical activity carries inherent risks, including but not limited to: muscle strain, joint pain, falls, fainting, cardiovascular events, aggravation of pre-existing conditions, and other injuries or health-related issues.</li>
        <li>SmartyMove, its operator, affiliates, and contributors <strong>accept no responsibility</strong> for any injury, illness, accident, or health-related issue that may occur during or after your use of SmartyMove.</li>
      </ul>

      <h2>4. Individual Responsibility</h2>
      <ul>
        <li>You are responsible for exercising within your <strong>personal limits and capabilities</strong> and for adjusting or skipping any movement that does not feel safe.</li>
        <li>Stop any test or corrective routine immediately if you feel pain, dizziness, faintness, shortness of breath, sharp joint discomfort, or any unusual symptom.</li>
        <li>You must use SmartyMove in a safe environment — clear floor space, stable surface, supportive footwear if appropriate, and within view of a stable wall or sturdy support where needed for balance tests.</li>
        <li>Minors (under 18) must use SmartyMove only with supervision and prior medical clearance from a qualified healthcare professional.</li>
      </ul>

      <h2>5. No Guarantee of Results</h2>
      <ul>
        <li>Results vary by individual based on age, health status, genetics, lifestyle, consistency, and adherence to the recommended corrective routines.</li>
        <li>SmartyMove <strong>does not guarantee</strong> any specific improvement in Movement Score, Movement Age, pain reduction, mobility, performance, or any other outcome.</li>
        <li>The Movement Age estimate is a motivational metric derived from your screening results and is not a medical or clinical diagnosis.</li>
      </ul>

      <h2>6. Release of Liability &amp; Waiver of Claims</h2>
      <p>To the fullest extent permitted by law in the European Union and internationally:</p>
      <ul>
        <li>
          <strong>Complete release:</strong> By using SmartyMove, you voluntarily and knowingly assume all
          risks associated with physical activity and hereby <strong>RELEASE, WAIVE, DISCHARGE, AND COVENANT
          NOT TO SUE</strong> SmartyMove, its operator, owners, contributors, employees, contractors,
          affiliates, and agents from any and all liability arising from your use of SmartyMove.
        </li>
        <li>
          <strong>No liability:</strong> SmartyMove and its representatives <strong>shall not be held
          liable</strong> for any direct, indirect, incidental, consequential, special, punitive, or
          exemplary damages arising from participation in any movement screen, corrective routine, or
          activity offered by SmartyMove, including but not limited to:
          <ul>
            <li>Personal injury, disability, or death</li>
            <li>Aggravation of pre-existing medical conditions</li>
            <li>Property damage or loss</li>
            <li>Medical expenses or costs</li>
            <li>Lost wages or income</li>
            <li>Pain and suffering</li>
            <li>Emotional distress</li>
          </ul>
        </li>
        <li>
          <strong>Waiver of right to sue:</strong> You expressly waive any right to bring legal action
          against SmartyMove for injuries or damages sustained during or after participation in any screen
          or corrective routine.
        </li>
        <li>
          <strong>Indemnification:</strong> You agree to indemnify and hold harmless SmartyMove from any
          claims, damages, or expenses (including legal fees) arising from your use of SmartyMove or breach
          of this Disclaimer.
        </li>
      </ul>
      <p>
        Nothing in this Disclaimer excludes or limits liability that cannot be excluded or limited under
        applicable law, including your statutory rights as a consumer under EU consumer-protection
        directives.
      </p>

      <h2>7. Camera &amp; On-Device Processing</h2>
      <ul>
        <li>SmartyMove uses your device camera only while you are actively running a movement screen and only with your explicit permission.</li>
        <li>Pose detection runs <strong>on-device</strong>; no raw video is uploaded to our servers.</li>
        <li>You are responsible for the privacy of your physical environment while the camera is active (e.g. ensuring no one else is in frame).</li>
      </ul>

      <h2>8. Jurisdiction &amp; Governing Law</h2>
      <p>
        This Disclaimer is governed by applicable law and EU regulations. Any disputes shall be subject to
        the jurisdiction of the competent courts, while preserving any mandatory consumer protection rights
        you have in your country of residence.
      </p>

      <div className="callout">
        <strong>⚠️ Acceptance and acknowledgment.</strong> By accessing and using SmartyMove, you
        acknowledge and confirm that you have:
        <ul>
          <li><strong>Read and understood</strong> this entire Disclaimer and Release of Liability.</li>
          <li><strong>Completed the in-app PAR-Q-style readiness questionnaire</strong> and joint-issue selection truthfully.</li>
          <li><strong>Obtained medical clearance</strong> if your responses indicated potential health risks.</li>
          <li><strong>Voluntarily assumed all risks</strong> associated with physical activity.</li>
          <li><strong>Released SmartyMove from all liability</strong> for any injuries or damages arising from your use of the app.</li>
          <li><strong>Agreed to use SmartyMove at your own risk.</strong></li>
        </ul>
        <p style={{ marginTop: 8, fontWeight: 700 }}>
          If you do not agree with any part of this Disclaimer, do not use SmartyMove.
        </p>
      </div>
    </LegalLayout>
  );
}
