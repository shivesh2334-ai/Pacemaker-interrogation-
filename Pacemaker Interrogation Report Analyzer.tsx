import { useState, useMemo, useRef } from "react";
import { Upload, FileText, Search, BookOpen, Activity, AlertTriangle, CheckCircle2, Info, Printer, Sparkles, Globe, ChevronDown, ChevronRight, Loader2 } from "lucide-react";

/* ============ SOURCES ============ */
const SRC = {
  S1: { t: "HRS/EHRA Expert Consensus on Monitoring of CIEDs (2008)", u: "https://escardio.org/The-ESC/Press-Office/Press-releases/HRS-EHRA-Consensus-on-Cardiovascular-Implantable-Electronic-Devices", v: true },
  S2: { t: "HRS Consensus on Remote Interrogation & Monitoring of CIEDs (2015)", u: "https://www.dicardiology.com/article/remote-monitoring-recommended-hrs-become-standard-care", v: true },
  S3: { t: "ISHNE/EHRA Consensus on Remote Monitoring of CIEDs (2012)", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC6932107", v: true },
  S4: { t: "2017 HRS Consensus: CIED Lead Management and Extraction", u: "https://lahrs.org/guias_lahrs/2017-hrs-expert-consensus-statement-on-cardiovascular-implantable-electronic-device-lead-management-and-extraction.pdf", v: true },
  S5: { t: "Review: pacing threshold, intracardiac signals, impedance in CIED follow-up (PMC)", u: "https://pmc.ncbi.nlm.nih.gov/articles/PMC11640493", v: true },
  S6: { t: "Vitatron G70 DR product brochure (output management, diagnostics)", u: "https://storage.mtender.gov.md/get/12367600-f313-4510-a075-b0c43ee9bb73-1710253711865", v: true },
  S7: { t: "Vitatron G70 DR MRI SureScan G70A2 Pacemaker Manual", u: "https://storage.mtender.gov.md/get/149b1605-235b-478c-af6a-74ee19c3bccb-1783003667379", v: true },
  S8: { t: "RV pacing threshold increase & battery life (J Interv Card Electrophysiol, 2018)", u: "https://dx.doi.org/10.1007/s10840-018-0481-5", v: true },
  S9: { t: "Vitatron G70 DR overview (HealthManagement.org)", u: "https://healthmanagement.org/products/view/implantable-cardiac-stimulator-vitatron-g70-dr-vitatron", v: true },
  S10: { t: "Medtronic/Vitatron Manual Library (search model G70A2 reference manual)", u: "https://manuals.medtronic.com", v: false },
  S11: { t: "2018 ACC/AHA/HRS Guideline on Bradycardia & Cardiac Conduction Delay", u: "https://www.ahajournals.org/doi/10.1161/CIR.0000000000000628", v: false },
  S12: { t: "2021 ESC Guidelines on Cardiac Pacing and CRT", u: "https://doi.org/10.1093/eurheartj/ehab364", v: false },
};

/* ============ KNOWLEDGE BASE (RAG corpus) ============ */
const KB = [
  { id: "K01", title: "Pacing threshold: definition and causes of rise", tags: ["threshold", "capture", "lead", "fibrosis", "electrolyte"], src: ["S5", "S8"],
    text: "The capture threshold is the lowest stimulus energy that consistently depolarizes the myocardium. A rapid rise or loss of capture can indicate lead dislodgement, conductor fracture or insulation failure. A gradual rise can reflect fibrosis around the lead tip. Non-cardiac causes such as electrolyte imbalance can also raise thresholds. Steroid-eluting electrodes lower chronic thresholds. A published series defined a permanent RV threshold rise as an increase of 1.5 V or more from stored device trends." },
  { id: "K02", title: "Strength-duration relationship; comparing thresholds at different pulse widths", tags: ["threshold", "pulse width", "chronaxie", "rheobase", "strength-duration"], src: ["S5"],
    text: "Threshold voltage depends on pulse width. Values measured at different pulse widths are not directly comparable. A threshold of 1.75 V at 1.4 ms is higher in 0.4 ms terms. This app estimates the 0.4 ms equivalent with the Lapicque model, assuming chronaxie 0.4 ms. Actual chronaxie varies by lead and patient (typically 0.2-0.6 ms), so treat the estimate as approximate and confirm with a strength-duration test on the programmer." },
  { id: "K03", title: "Pacing safety margin", tags: ["safety margin", "output", "capture", "threshold", "dependent"], src: ["S6", "S10"],
    text: "A programmed output is commonly kept at least twice the voltage threshold (2:1 margin) at the same pulse width. Pacemaker-dependent patients usually justify a wider margin. Automatic capture algorithms maintain the margin by testing threshold periodically. The Vitatron amplitude margin is programmable (1.5x, 2x, 2.5x, 3x, 4x)." },
  { id: "K04", title: "Vitatron Atrial/Ventricular Output Management (Off, Monitor Only, Adaptive)", tags: ["vitatron", "output management", "adaptive", "monitor only", "capture", "output"], src: ["S6", "S7", "S9"],
    text: "Vitatron Atrial and Ventricular Output Management can be set to Off, Monitor Only or Adaptive. Adaptive automatically adjusts amplitude and pulse width to threshold plus margin. Monitor Only measures thresholds and trends them without changing the programmed output, so the clinician must ensure the fixed output keeps an adequate margin. Programmable settings include amplitude margin, minimum adapted amplitude (nominal 1.5 V atrial, 2.0 V ventricular) and capture test frequency. Output management is enabled and becomes adaptive after implant detection, and an acute phase period applies early after implant." },
  { id: "K05", title: "High ventricular threshold alert behaviour", tags: ["high threshold", "alert", "ventricular", "threshold", "output", "battery"], src: ["S8", "S10"],
    text: "In a published series using Medtronic/Vitatron capture management platforms, a high-threshold warning was issued when the ventricular amplitude threshold exceeded 2.5 V, and the device responded by increasing output to 5.0 V at 1.0 ms. Rising RV thresholds shorten battery life through higher output. Confirm exact alert and response behaviour for model G70A2 in the reference manual." },
  { id: "K06", title: "Lead impedance interpretation", tags: ["impedance", "lead", "insulation", "fracture", "set screw"], src: ["S4", "S5", "S6"],
    text: "Pacing lead impedance is commonly 300-1000 ohm, and a wider range of about 200-2000 ohm is often accepted. Abruptly low impedance suggests insulation breach. Abruptly high impedance suggests conductor fracture, loose set screw or dislodgement. The trend and accompanying sensing or threshold changes matter more than one value. Vitatron programmable notification limits include below 200 ohm and above 1000, 2000, 3000 or 4000 ohm." },
  { id: "K07", title: "Lead failure diagnosis and remote detection", tags: ["lead failure", "noise", "oversensing", "impedance", "remote monitoring"], src: ["S4"],
    text: "Lead failure is diagnosed by combining impedance trends, sensing changes, noise or oversensing on electrograms, and threshold changes. Remote monitoring alerts help detect lead failure earlier. Caveats apply to isolated or transient impedance changes." },
  { id: "K08", title: "P-wave sensing and atrial undersensing", tags: ["p wave", "sensing", "atrial", "undersensing", "sensing assurance", "af"], src: ["S6", "S10"],
    text: "Adequate P-wave amplitude (commonly 1.5 mV or more, 2 mV or more preferred) allows reliable atrial sensing and tracking. Small P waves risk undersensing, loss of tracking and under-detection of atrial arrhythmias. Vitatron Sensing Assurance can adapt sensitivity automatically." },
  { id: "K09", title: "R-wave sensing and pacemaker dependency", tags: ["r wave", "sensing", "ventricular", "underlying rhythm", "dependent", "escape"], src: ["S5"],
    text: "R-wave amplitude of about 5 mV or more is desirable; values under about 2.5 mV raise undersensing risk. In a patient who is 100% ventricular paced, the R wave may be unmeasurable and the underlying rhythm unknown. An underlying rhythm test (lower backup rate) reveals the escape rhythm but must be done cautiously with ECG monitoring and a ready ability to restore pacing." },
  { id: "K10", title: "Pacemaker dependency and safety", tags: ["dependent", "pacemaker dependency", "mri", "emi", "safety"], src: ["S7", "S10"],
    text: "Pacemaker-dependent patients have no adequate escape rhythm, so loss of capture or oversensing is high-risk. This favours conservative output margins and prompt review of rising thresholds. The G70A2 belongs to the MRI SureScan family; MRI use requires the separate MRI technical manual conditions and a compliant system." },
  { id: "K11", title: "High right ventricular pacing burden and pacing-induced cardiomyopathy", tags: ["ventricular pacing", "vp", "cardiomyopathy", "lvef", "physiologic pacing", "crt", "burden"], src: ["S11", "S12"],
    text: "Right ventricular pacing burden above roughly 20-40% is associated with pacing-induced cardiomyopathy and heart failure in a subset of patients. Guidelines support monitoring LVEF in patients with high expected pacing burden and considering CRT or conduction-system (physiologic) pacing when LVEF is reduced or falling. Specific recommendations depend on LVEF and should be checked in the current guideline. Reduced VP algorithms only help when AV conduction is intact." },
  { id: "K12", title: "AV delay: paced vs sensed", tags: ["av delay", "paced", "sensed", "synchrony", "pacemaker syndrome"], src: ["S5", "S10"],
    text: "Dual-chamber devices program a paced AV delay and a shorter sensed AV delay because a paced atrial event takes longer to depolarize the atrium. Typical values lie around 120-200 ms. A very short AV delay may limit ventricular filling and a very long one may cause atrial contraction against closed AV valves. Rate-adaptive AV delay shortens with heart rate. Optimization is individualized." },
  { id: "K13", title: "DDDR mode, tracking and the upper rate", tags: ["dddr", "mode", "tracking", "upper rate", "base rate", "asvp", "pmt"], src: ["S7"],
    text: "DDDR paces and senses both chambers with rate response from an activity sensor. AS-VP means an atrial sensed event followed by ventricular pacing, i.e. the device tracks the patient's own sinus rate. The upper rate limits tracked ventricular rate. Rapid atrial rhythms are managed by mode switch, and pacemaker-mediated tachycardia is a possible cause of high ventricular rates." },
  { id: "K14", title: "Battery longevity, ERI and replacement planning", tags: ["battery", "longevity", "eri", "eos", "replacement"], src: ["S6", "S8"],
    text: "Estimated longevity depends on programmed output, pulse width, pacing percentage and lead impedance. High ventricular output with 100% pacing shortens battery life. The device reports elective replacement indicator (ERI) status and projected longevity. Plan generator replacement as ERI approaches, following the manufacturer's ERI definition in the reference manual." },
  { id: "K15", title: "High rate episodes: ventricular and atrial", tags: ["high rate episode", "hre", "ventricular", "atrial", "egm", "oversensing", "tachycardia", "noise"], src: ["S6"],
    text: "Stored high rate episodes should be reviewed on the stored electrogram. Differentials include atrial tachyarrhythmia with rapid tracking, pacemaker-mediated tachycardia, true ventricular tachycardia, and oversensing from noise, lead problems or far-field signals. Vitatron stores atrial and ventricular high rate episodes and multiple EGM episodes." },
  { id: "K16", title: "Device-detected atrial arrhythmias and stroke risk", tags: ["af", "atrial fibrillation", "ahre", "burden", "anticoagulation", "stroke", "mode switch"], src: ["S11", "S12"],
    text: "Device-detected atrial high rate episodes should be verified on electrogram to exclude oversensing or far-field R waves. Confirmed atrial fibrillation warrants stroke risk assessment (for example CHA2DS2-VASc) and an individualized anticoagulation decision per current guidelines. The threshold of burden for treatment is debated for brief episodes." },
  { id: "K17", title: "Follow-up frequency and remote monitoring", tags: ["follow-up", "remote monitoring", "frequency", "annual", "schedule"], src: ["S1", "S2", "S3"],
    text: "HRS 2015 recommends that all CIED patients be offered remote monitoring as part of standard follow-up and that remote monitoring be combined with at least an annual in-person evaluation. The 2008 HRS/EHRA consensus defines the content and frequency of in-person and remote follow-up. Follow-up should be intensified when abnormal parameters are found." },
  { id: "K18", title: "Content of a pacemaker follow-up interrogation", tags: ["interrogation", "follow-up", "content", "report", "parameters"], src: ["S1", "S5"],
    text: "A follow-up reviews battery status, lead sensing, impedance and threshold with trends, programmed parameters, pacing percentages, stored arrhythmia episodes with electrograms, and patient symptoms. Parameters should be compared with previous values because trends reveal lead problems early." },
  { id: "K19", title: "Sensor-driven rate response (Vitatron)", tags: ["rate response", "sensor", "adl", "exertion", "rate profile", "chronotropic"], src: ["S7"],
    text: "Vitatron rate response uses an activity-based sensor with programmable ADL rate, ADL response, exertion response and Rate Profile Optimization. Rate histograms and sensor indicated rate profile assist tuning when symptoms suggest chronotropic problems." },
  { id: "K20", title: "Atrial pacing percentage interpretation", tags: ["atrial pacing", "ap", "sinus node", "chronotropic", "burden"], src: ["S5"],
    text: "A low atrial pacing percentage means the sinus node mostly drives the atria and the device tracks it. A very high atrial pacing percentage suggests sinus node dysfunction or a high base rate and should be interpreted alongside rate histograms and symptoms." },
];

/* ============ RETRIEVAL ============ */
const STOP = new Set("the a an of and or to in for is are with on at by as be this that it from was were has have".split(" "));
const tok = (s) => s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((w) => w && !STOP.has(w));
const DOCS = KB.map((c) => tok(c.title + " " + c.tags.join(" ") + " " + c.text));
const DF = {};
DOCS.forEach((ws) => new Set(ws).forEach((w) => (DF[w] = (DF[w] || 0) + 1)));
function searchKB(q, n = 6) {
  const qt = tok(q);
  return KB.map((c, i) => {
    const tf = {};
    DOCS[i].forEach((w) => (tf[w] = (tf[w] || 0) + 1));
    let s = 0;
    qt.forEach((w) => {
      if (tf[w]) s += (1 + Math.log(tf[w])) * Math.log(1 + KB.length / DF[w]);
      if (c.tags.some((t) => t.split(" ").includes(w))) s += 2;
    });
    return { c, s };
  }).filter((x) => x.s > 0).sort((a, b) => b.s - a.s).slice(0, n);
}
const kbById = (id) => KB.find((c) => c.id === id);

/* ============ RULE ENGINE ============ */
const N = (v) => { if (v === undefined || v === null || v === "") return null; const x = parseFloat(v); return isNaN(x) ? null : x; };
const CHR = 0.4;
const rheo = (v, pw) => v / (1 + CHR / pw);
const est04 = (v, pw) => rheo(v, pw) * 2;
const ORD = { ok: 0, info: 1, warn: 2, alert: 3 };

function analyze(d) {
  const F = [];
  const S = {};
  const add = (sev, area, title, detail, action, kb) => F.push({ sev, area, title, detail, action, kb: kb || [] });
  const vp = N(d.vp), ap = N(d.ap), lvef = N(d.lvef);
  const dep = vp !== null && vp >= 90;

  // Battery
  const bl = N(d.battLongevity);
  if (d.eri) add("alert", "Battery", "ERI / replacement indicator reached", "The device reports elective replacement status.", "Plan generator replacement per manufacturer guidance; pacemaker-dependent patients need timely scheduling.", ["K14"]);
  else if (bl !== null) {
    S.batt = bl < 1 ? "alert" : bl < 2 ? "warn" : bl < 3 ? "info" : "ok";
    if (bl < 1) add("alert", "Battery", "Battery longevity under 1 year", `Estimated longevity ${bl} yr.`, "Arrange generator replacement planning now.", ["K14"]);
    else if (bl < 2) add("warn", "Battery", "Battery longevity under 2 years", `Estimated longevity ${bl} yr.`, "Start replacement planning and shorten follow-up interval.", ["K14"]);
    else if (bl < 3) add("info", "Battery", "Battery longevity 2-3 years", `Estimated longevity ${bl} yr.`, "Monitor trend at each follow-up.", ["K14"]);
    else add("ok", "Battery", "Battery longevity adequate", `Estimated longevity ${bl} yr.`, "", ["K14"]);
  }

  // Leads
  [["ra", "Atrial (RA)"], ["rv", "Ventricular (RV)"]].forEach(([k, nm]) => {
    const c = d[k];
    // impedance
    const imp = N(c.imp), pimp = N(c.pImp);
    if (imp !== null) {
      let sev = "ok", t = `${nm} lead impedance normal`;
      if (imp < 200) { sev = "alert"; t = `${nm} impedance very low`; }
      else if (imp < 300) { sev = "warn"; t = `${nm} impedance low`; }
      else if (imp > 2000) { sev = "alert"; t = `${nm} impedance very high`; }
      else if (imp > 1000) { sev = "info"; t = `${nm} impedance high-normal`; }
      S[k + "imp"] = sev;
      let det = `${imp} ohm.`;
      let act = sev === "ok" ? "" : sev === "info" ? "Trend at next visit." : "Check for insulation breach (low) or conductor fracture / loose set screw (high); review EGM noise and chest X-ray.";
      add(sev, nm, t, det, act, ["K06", "K07"]);
      if (pimp !== null && pimp > 0) {
        const ch = Math.abs(imp - pimp) / pimp * 100;
        if (ch >= 50) { S[k + "imp"] = "alert"; add("alert", nm, `${nm} impedance changed ${ch.toFixed(0)}% from previous`, `${pimp} to ${imp} ohm.`, "Abrupt change suggests lead problem; correlate with sensing, threshold and EGM noise.", ["K06", "K07"]); }
        else if (ch >= 30) { if (ORD[S[k + "imp"]] < 2) S[k + "imp"] = "warn"; add("warn", nm, `${nm} impedance changed ${ch.toFixed(0)}% from previous`, `${pimp} to ${imp} ohm.`, "Repeat and trend; review sensing and threshold.", ["K06", "K07"]); }
      }
    }
    // sensing
    const sens = N(c.sens);
    if (k === "ra") {
      if (sens !== null) {
        let sev = sens < 1 ? "alert" : sens < 1.5 ? "warn" : "ok";
        S.rasens = sev;
        add(sev, nm, sev === "ok" ? "P-wave sensing adequate" : "P-wave amplitude low", `${sens} mV${sens >= 2 ? " (good)" : ""}.`, sev === "ok" ? "" : "Risk of atrial undersensing and loss of tracking; check sensitivity and Sensing Assurance, review mode-switch behaviour.", ["K08"]);
      }
    } else {
      if (c.paced || sens === null) {
        if (dep) { S.rvsens = "info"; add("info", nm, "R wave not measurable (ventricular paced)", `VP ${vp}% - likely pacemaker dependent or no intrinsic ventricular activity at test.`, "Consider an underlying rhythm test with ECG monitoring and caution to document the escape rhythm.", ["K09", "K10"]); }
      } else {
        let sev = sens < 2.5 ? "alert" : sens < 5 ? "warn" : "ok";
        S.rvsens = sev;
        add(sev, nm, sev === "ok" ? "R-wave sensing adequate" : "R-wave amplitude low", `${sens} mV.`, sev === "ok" ? "" : "Check sensitivity for undersensing risk, especially if pacing-dependent.", ["K09"]);
      }
    }
    // threshold
    const thr = N(c.thr), tpw = N(c.thrPw) || 0.4;
    if (thr !== null) {
      const e = est04(thr, tpw);
      const sev = e <= 1.5 ? "ok" : e <= 2.5 ? "info" : "warn";
      S[k + "thr"] = sev;
      const approx = tpw !== 0.4 ? ` Estimated ${e.toFixed(1)} V at 0.4 ms (assumes chronaxie 0.4 ms).` : "";
      const title = sev === "ok" ? `${nm} threshold low` : sev === "info" ? `${nm} threshold mildly elevated` : `${nm} threshold high`;
      const act = sev === "ok" ? "" : sev === "info" ? "Trend; ensure adequate margin." : "Verify with strength-duration test; check margin and output setting, battery impact and lead integrity; consider electrolytes and drugs.";
      add(sev, nm, title, `Measured ${thr} V at ${tpw} ms.${approx}`, act, ["K01", "K02", ...(sev === "warn" ? ["K05"] : [])]);
      const pthr = N(c.pThr);
      if (pthr !== null) {
        const dv = thr - pthr;
        if (dv >= 1.5) { S[k + "thr"] = "alert"; add("alert", nm, `${nm} threshold rose ${dv.toFixed(2)} V`, `${pthr} V to ${thr} V (compare at same pulse width).`, "Significant rise: evaluate for dislodgement, exit block, fibrosis or metabolic causes; reconsider output.", ["K01"]); }
        else if (dv >= 1.0) { if (ORD[S[k + "thr"]] < 2) S[k + "thr"] = "warn"; add("warn", nm, `${nm} threshold rose ${dv.toFixed(2)} V`, `${pthr} V to ${thr} V.`, "Repeat test and trend.", ["K01"]); }
      }
      // margin
      const out = N(c.out);
      if (out !== null) {
        const opw = N(c.outPw) || tpw;
        const margin = rheo(out, opw) / rheo(thr, tpw);
        const assumed = N(c.outPw) ? "" : " (output pulse width assumed equal to threshold pulse width)";
        const mode = c.outMode;
        let sev2 = margin < 1.5 ? "alert" : margin < 2 ? "warn" : "ok";
        if (k === "rv" && dep && mode !== "adaptive" && margin < 3 && sev2 === "ok") sev2 = "info";
        S[k + "margin"] = sev2;
        const t2 = sev2 === "ok" ? `${nm} safety margin adequate` : sev2 === "info" ? `${nm} margin acceptable but manual output` : `${nm} safety margin inadequate`;
        add(sev2, nm, t2, `Margin about ${margin.toFixed(1)}x (output ${out} V${opw ? ` at ${opw} ms` : ""} vs threshold ${thr} V at ${tpw} ms)${assumed}. Output mode: ${mode}.`, sev2 === "ok" ? "" : "Increase output / pulse width or rely on adaptive output; wider margin advised if pacemaker dependent.", ["K03", "K04", "K10"]);
        if (mode !== "adaptive" && k === "rv" && sev === "warn") add("warn", nm, "RV output not auto-adapting while threshold is high", `Output mode is ${mode}; high threshold with high ventricular pacing percentage.`, "Confirm on the programmer whether ventricular output management is Adaptive or Monitor Only; check threshold trend and consider enabling adaptive output.", ["K04", "K05", "K10"]);
        if (out >= 3.5 && opw >= 1.0) add("info", nm, `${nm} output is high energy`, `${out} V at ${opw} ms.`, "Check projected longevity; reassess margin against measured threshold to avoid unnecessary battery drain.", ["K14", "K05"]);
      }
    }
  });

  // Pacing percentages
  if (vp !== null) {
    if (vp >= 40) {
      const sev = lvef !== null && lvef <= 50 ? "alert" : "warn";
      S.vp = sev;
      add(sev, "Pacing", `High ventricular pacing burden (${vp}%)`, lvef !== null ? `LVEF ${lvef}%.` : "LVEF not provided.", "Monitor LVEF periodically (echo); consider physiologic pacing / CRT upgrade if LVEF declines or heart failure develops, per current guidelines.", ["K11"]);
    } else if (vp > 20) { S.vp = "info"; add("info", "Pacing", `Moderate ventricular pacing (${vp}%)`, "", "Review AV delay / conduction settings and LVEF trend.", ["K11"]); }
    else { S.vp = "ok"; add("ok", "Pacing", `Ventricular pacing low (${vp}%)`, "", "", ["K11"]); }
  }
  if (ap !== null) {
    S.ap = ap > 80 ? "info" : "ok";
    add(ap > 80 ? "info" : "ok", "Pacing", ap > 80 ? `High atrial pacing (${ap}%)` : `Atrial pacing ${ap}%`, ap > 80 ? "Suggests sinus node dysfunction or high base rate." : "Sinus rhythm mostly intrinsic and tracked.", ap > 80 ? "Review rate histogram, rate response and symptoms." : "", ["K20", "K13"]);
  }
  if (vp !== null && vp >= 90 && ap !== null && ap < 50 && /as/i.test(d.rhythm || "")) add("info", "Rhythm", "AS-VP pattern with near-100% VP", "Sinus tracking with ventricular pacing suggests advanced AV conduction disease (confirm with ECG and underlying rhythm test).", "Document underlying conduction; AV delay shortening only helps if intrinsic conduction exists.", ["K13", "K09"]);

  // Programming
  const pav = N(d.pav), sav = N(d.sav), br = N(d.baseRate), ur = N(d.upperRate), age = N(d.age);
  if (pav !== null && sav !== null) {
    let sev = "ok", t = "AV delays within typical range", det = `Paced ${pav} ms / sensed ${sav} ms.`;
    if (pav < 100 || sav < 80 || pav > 250 || sav > 250) { sev = "info"; t = "AV delay outside typical range"; }
    else if (sav > pav) { sev = "info"; t = "Sensed AV delay longer than paced AV delay"; }
    add(sev, "Programming", t, det, sev === "ok" ? "" : "Review AV delay programming against conduction and hemodynamics.", ["K12"]);
  }
  if (br !== null && ur !== null && age !== null && ur > 0.85 * (220 - age)) add("info", "Programming", "Upper rate high for age", `Upper rate ${ur} vs 85% of age-predicted max ${(0.85 * (220 - age)).toFixed(0)}.`, "Consider whether upper rate suits the patient's exercise tolerance and symptoms.", ["K13"]);

  // Episodes
  const vh = N(d.vHRE), ab = N(d.aBurden);
  if (vh !== null && vh > 0) add("warn", "Episodes", `${vh} ventricular high-rate episode(s) recorded`, "", "Review stored EGM: AF/AT with rapid tracking, PMT, VT, or noise/oversensing.", ["K15"]);
  if (ab !== null && ab > 0) add("warn", "Episodes", `Atrial arrhythmia burden ${ab}%`, "", "Verify on EGM; assess stroke risk and anticoagulation need.", ["K16"]);

  // Overall + follow-up
  const worst = F.reduce((m, f) => Math.max(m, ORD[f.sev]), 0);
  const overall = ["ok", "info", "warn", "alert"][worst];
  const follow = overall === "alert"
    ? "Prompt clinical review (days to 2 weeks) with repeat interrogation and targeted evaluation of the flagged items."
    : overall === "warn"
    ? "Re-check in about 1-3 months in clinic, with remote monitoring if available, and review flagged items."
    : "Routine follow-up: remote monitoring with at least annual in-person evaluation.";
  F.sort((a, b) => ORD[b.sev] - ORD[a.sev]);
  return { F, S, overall, follow, dep };
}

/* ============ CLAUDE API ============ */
async function callClaude({ system, content, web = false }) {
  const body = { model: "claude-sonnet-4-6", max_tokens: 1000, system, messages: [{ role: "user", content }] };
  if (web) body.tools = [{ type: "web_search_20250305", name: "web_search" }];
  const r = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "API error");
  return (j.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}
const toB64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(",")[1]); r.onerror = () => rej(new Error("Could not read file")); r.readAsDataURL(file); });
const stripFence = (s) => s.replace(/```json|```/g, "").trim();

/* ============ INITIAL DATA (from the handwritten sample) ============ */
const BLANK_CH = { sens: "", paced: false, imp: "", pImp: "", thr: "", pThr: "", thrPw: "", outMode: "adaptive", out: "", outPw: "" };
const SAMPLE = {
  name: "", pid: "", age: "", lvef: "", implantDate: "2023-06-28", reportDate: "",
  manufacturer: "Vitatron", model: "G70 A2 DR", mode: "DDDR", baseRate: "60", upperRate: "130", pav: "150", sav: "120",
  hr: "88", rhythm: "AS-VP", ap: "18", vp: "100", battLongevity: "8", eri: false, vHRE: "1", aBurden: "",
  notes: "Handwritten notes: high ventricular threshold noted 30 Apr 2025; 1 ventricular high-rate episode 29/07/24; RV adaptive threshold on monitor only.",
  ra: { ...BLANK_CH, sens: "2.8", imp: "553", thr: "0.5", thrPw: "1.4", outMode: "adaptive", out: "1.5", outPw: "" },
  rv: { ...BLANK_CH, paced: true, imp: "580", thr: "1.75", thrPw: "1.4", outMode: "monitor", out: "3.75", outPw: "1.4" },
};

/* ============ UI HELPERS ============ */
const SEV = {
  ok: { cls: "bg-green-50 border-green-300 text-green-800", chip: "bg-green-100 text-green-800", label: "Normal", Icon: CheckCircle2 },
  info: { cls: "bg-blue-50 border-blue-300 text-blue-800", chip: "bg-blue-100 text-blue-800", label: "Note", Icon: Info },
  warn: { cls: "bg-amber-50 border-amber-300 text-amber-900", chip: "bg-amber-100 text-amber-900", label: "Attention", Icon: AlertTriangle },
  alert: { cls: "bg-red-50 border-red-300 text-red-800", chip: "bg-red-100 text-red-800", label: "Urgent", Icon: AlertTriangle },
};
const Chip = ({ s }) => (s ? <span className={"ml-2 px-2 py-0.5 rounded text-xs font-medium " + SEV[s].chip}>{SEV[s].label}</span> : null);

function Inp({ label, value, onChange, unit, type = "text", w = "" }) {
  return (
    <label className={"block text-xs text-gray-600 " + w}>
      {label}
      <div className="flex items-center mt-1">
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-gray-900 bg-white" />
        {unit ? <span className="ml-1 text-xs text-gray-500 whitespace-nowrap">{unit}</span> : null}
      </div>
    </label>
  );
}

function Rich({ text }) {
  const bold = (s) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <b key={i}>{p.slice(2, -2)}</b> : <span key={i}>{p}</span>));
  return (
    <div className="text-sm text-gray-800 space-y-1">
      {text.split("\n").map((l, i) => {
        if (!l.trim()) return <div key={i} className="h-1" />;
        if (/^#+\s/.test(l)) return <div key={i} className="font-semibold mt-2">{bold(l.replace(/^#+\s/, ""))}</div>;
        if (/^\s*[-*]\s/.test(l)) return <div key={i} className="pl-4">{"\u2022 "}{bold(l.replace(/^\s*[-*]\s/, ""))}</div>;
        return <div key={i}>{bold(l)}</div>;
      })}
    </div>
  );
}

function SrcLinks({ ids }) {
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-1">
      {ids.map((id) => (
        <a key={id} href={SRC[id].u} target="_blank" rel="noreferrer" className="text-xs text-blue-700 underline">
          {SRC[id].t}{SRC[id].v ? "" : " (link not verified)"}
        </a>
      ))}
    </div>
  );
}

function KBCard({ c, score }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded bg-white">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center text-left px-3 py-2">
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="ml-2 text-xs text-gray-500">{c.id}</span>
        <span className="ml-2 text-sm font-medium text-gray-900 flex-1">{c.title}</span>
        {score ? <span className="text-xs text-gray-400">{score.toFixed(1)}</span> : null}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2">
          <div className="text-sm text-gray-700">{c.text}</div>
          <SrcLinks ids={c.src} />
        </div>
      )}
    </div>
  );
}

/* ============ MAIN APP ============ */
export default function App() {
  const [tab, setTab] = useState("input");
  const [d, setD] = useState(SAMPLE);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [fileName, setFileName] = useState("");
  const [extractNote, setExtractNote] = useState("");
  const [ai, setAi] = useState("");
  const [aiWeb, setAiWeb] = useState(false);
  const [refs, setRefs] = useState(null);
  const [refRaw, setRefRaw] = useState("");
  const [q, setQ] = useState("");
  const fileRef = useRef(null);

  const set = (k, v) => setD((p) => ({ ...p, [k]: v }));
  const setC = (ch, k, v) => setD((p) => ({ ...p, [ch]: { ...p[ch], [k]: v } }));
  const R = useMemo(() => analyze(d), [d]);
  const hits = useMemo(() => (q.trim() ? searchKB(q, 8) : []), [q]);

  /* ---- AI extraction from uploaded report ---- */
  async function onFile(e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    setErr(""); setExtractNote(""); setFileName(f.name); setBusy("extract");
    try {
      const b64 = await toB64(f);
      const isPdf = f.type === "application/pdf";
      const block = isPdf
        ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: b64 } }
        : { type: "image", source: { type: "base64", media_type: f.type || "image/jpeg", data: b64 } };
      const prompt = `Extract pacemaker interrogation values from this report (may be handwritten). Respond ONLY with JSON, no prose, using this shape. Use strings of numbers without units, null if not present or unreadable. Dates as YYYY-MM-DD. For outMode use one of: adaptive, monitor, fixed, off. rv.paced is true if the R wave is written as paced/not measurable.
{"name":null,"pid":null,"age":null,"implantDate":null,"reportDate":null,"manufacturer":null,"model":null,"mode":null,"baseRate":null,"upperRate":null,"pav":null,"sav":null,"hr":null,"rhythm":null,"ap":null,"vp":null,"battLongevity":null,"eri":false,"vHRE":null,"aBurden":null,"notes":null,
"ra":{"sens":null,"imp":null,"thr":null,"thrPw":null,"outMode":null,"out":null,"outPw":null},
"rv":{"sens":null,"paced":false,"imp":null,"thr":null,"thrPw":null,"outMode":null,"out":null,"outPw":null}}`;
      const txt = await callClaude({ system: "You are a careful medical data extraction assistant. Output valid JSON only.", content: [block, { type: "text", text: prompt }] });
      const j = JSON.parse(stripFence(txt));
      setD((p) => {
        const n = { ...p, ra: { ...p.ra }, rv: { ...p.rv } };
        Object.keys(j).forEach((k) => {
          if (k === "ra" || k === "rv") Object.keys(j[k] || {}).forEach((kk) => { if (j[k][kk] !== null && j[k][kk] !== undefined) n[k][kk] = String(j[k][kk]) === "true" ? true : String(j[k][kk]) === "false" ? false : j[k][kk]; });
          else if (j[k] !== null && j[k] !== undefined) n[k] = typeof j[k] === "boolean" ? j[k] : String(j[k]);
        });
        return n;
      });
      setExtractNote("Values were extracted by AI from your file. Please verify every field against the original before relying on the report, especially handwritten numbers.");
    } catch (x) {
      setErr("Extraction failed: " + x.message + ". You can still enter values manually.");
    }
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
  }

  /* ---- context for AI ---- */
  function context() {
    const ids = new Set();
    R.F.forEach((f) => f.kb.forEach((i) => ids.add(i)));
    searchKB(R.F.slice(0, 5).map((f) => f.title).join(" "), 3).forEach((h) => ids.add(h.c.id));
    return [...ids].map((i) => kbById(i)).filter(Boolean);
  }

  async function runAI() {
    setErr(""); setBusy("ai"); setAi("");
    try {
      const ctx = context();
      const payload = {
        patient: { age: d.age, lvef: d.lvef, implantDate: d.implantDate, reportDate: d.reportDate },
        device: { manufacturer: d.manufacturer, model: d.model, mode: d.mode, baseRate: d.baseRate, upperRate: d.upperRate, pacedAV: d.pav, sensedAV: d.sav },
        status: { hr: d.hr, rhythm: d.rhythm, apPct: d.ap, vpPct: d.vp, battLongevityYears: d.battLongevity, eri: d.eri, ventricularHRE: d.vHRE, atrialBurdenPct: d.aBurden },
        RA: d.ra, RV: d.rv, notes: d.notes,
        ruleFindings: R.F.map((f) => ({ sev: f.sev, title: f.title, detail: f.detail, action: f.action })),
      };
      const sys = "You are a cardiac device clinic assistant supporting a cardiologist. Ground your analysis in the provided knowledge base excerpts and cite them as [K##]. Do not invent values. State uncertainty and anything that needs confirmation on the programmer. Be concise (under 350 words) with sections: Summary, Key concerns, Suggested actions, Follow-up. You provide decision support only; the clinician decides.";
      const txt = await callClaude({ system: sys, web: aiWeb, content: "REPORT DATA (JSON):\n" + JSON.stringify(payload) + "\n\nKNOWLEDGE BASE EXCERPTS:\n" + ctx.map((c) => `[${c.id}] ${c.title}: ${c.text}`).join("\n") + (aiWeb ? "\n\nYou may use web search to check current guidelines or manufacturer documentation and mention the source." : "") });
      setAi(txt);
    } catch (x) { setErr("AI analysis failed: " + x.message); }
    setBusy("");
  }

  async function findRefs() {
    setErr(""); setBusy("refs"); setRefs(null); setRefRaw("");
    try {
      const topics = R.F.filter((f) => ORD[f.sev] >= 2).map((f) => f.title).slice(0, 4).join("; ");
      const txt = await callClaude({
        web: true,
        system: "You find authoritative references. Use web search. Return ONLY a JSON array (max 6) of objects {\"title\",\"url\",\"publisher\",\"relevance\"} pointing to current guidelines, consensus statements or manufacturer documentation. Prefer society guidelines (HRS, ACC/AHA, ESC/EHRA) and Medtronic/Vitatron manuals. Only include URLs you actually found.",
        content: `Find guidelines and manufacturer documentation relevant to a ${d.manufacturer} ${d.model} ${d.mode} pacemaker follow-up. Issues to cover: ${topics || "routine follow-up, lead parameters, remote monitoring"}. Include the device reference manual if available.`,
      });
      try { setRefs(JSON.parse(stripFence(txt.slice(txt.indexOf("["), txt.lastIndexOf("]") + 1)))); } catch (e) { setRefRaw(txt); }
    } catch (x) { setErr("Web search failed: " + x.message); }
    setBusy("");
  }

  function copyText() {
    const t = [`PACEMAKER INTERROGATION SUMMARY`, `${d.manufacturer} ${d.model} ${d.mode} | Implant ${d.implantDate || "?"} | Report ${d.reportDate || "?"}`, `Overall: ${SEV[R.overall].label}`, "", ...R.F.map((f) => `[${SEV[f.sev].label}] ${f.title}. ${f.detail} ${f.action}`), "", "Suggested follow-up: " + R.follow, ai ? "\nAI analysis:\n" + ai : ""].join("\n");
    try { navigator.clipboard.writeText(t); } catch (e) { setErr("Copy not available in this view; use Print instead."); }
  }

  const tabs = [["input", "Input", Upload], ["report", "Report", FileText], ["kb", "Knowledge Base", BookOpen], ["refs", "References", Globe]];
  const ChForm = ({ k, nm }) => {
    const c = d[k];
    return (
      <div className="border border-gray-200 rounded p-3 bg-white">
        <div className="text-sm font-semibold text-gray-900 mb-2">{nm}</div>
        <div className="grid grid-cols-2 gap-2">
          {k === "rv" ? (
            <label className="col-span-2 flex items-center text-xs text-gray-600">
              <input type="checkbox" checked={c.paced} onChange={(e) => setC(k, "paced", e.target.checked)} className="mr-2" />R wave not measurable (paced)
            </label>
          ) : null}
          {!(k === "rv" && c.paced) && <Inp label={k === "ra" ? "P wave" : "R wave"} unit="mV" value={c.sens} onChange={(v) => setC(k, "sens", v)} />}
          <Inp label="Impedance" unit="ohm" value={c.imp} onChange={(v) => setC(k, "imp", v)} />
          <Inp label="Threshold" unit="V" value={c.thr} onChange={(v) => setC(k, "thr", v)} />
          <Inp label="Threshold pulse width" unit="ms" value={c.thrPw} onChange={(v) => setC(k, "thrPw", v)} />
          <Inp label="Output amplitude" unit="V" value={c.out} onChange={(v) => setC(k, "out", v)} />
          <Inp label="Output pulse width" unit="ms" value={c.outPw} onChange={(v) => setC(k, "outPw", v)} />
          <label className="block text-xs text-gray-600 col-span-2">
            Output management
            <select value={c.outMode} onChange={(e) => setC(k, "outMode", e.target.value)} className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900">
              <option value="adaptive">Adaptive</option><option value="monitor">Monitor only</option><option value="fixed">Fixed</option><option value="off">Off</option>
            </select>
          </label>
          <Inp label="Previous impedance (optional)" unit="ohm" value={c.pImp} onChange={(v) => setC(k, "pImp", v)} />
          <Inp label="Previous threshold (optional)" unit="V" value={c.pThr} onChange={(v) => setC(k, "pThr", v)} />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <style>{"@media print { .noprint { display: none !important; } }"}</style>
      <div className="bg-slate-800 text-white px-4 py-3 noprint">
        <div className="flex items-center"><Activity size={20} /><div className="ml-2 font-semibold">Pacemaker Interrogation Analyzer</div></div>
        <div className="text-xs text-slate-300 mt-1">Rule-based analysis grounded in a reference knowledge base, with optional AI analysis. Decision support only; verify against the programmer printout.</div>
      </div>
      <div className="flex border-b border-gray-200 bg-white noprint overflow-x-auto">
        {tabs.map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)} className={"flex items-center px-4 py-2 text-sm whitespace-nowrap " + (tab === id ? "border-b-2 border-slate-800 font-semibold text-slate-900" : "text-gray-500")}>
            <Icon size={14} /><span className="ml-1">{label}</span>
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {err ? <div className="border border-red-300 bg-red-50 text-red-800 text-sm rounded p-3">{err}</div> : null}

        {/* ---------------- INPUT ---------------- */}
        {tab === "input" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded bg-white p-4 text-center">
              <Upload className="mx-auto text-gray-400" size={24} />
              <div className="text-sm mt-1">Upload an interrogation report (photo, screenshot or PDF) to auto-fill the form</div>
              <input ref={fileRef} type="file" accept="image/*,application/pdf" onChange={onFile} className="mt-2 text-sm" />
              {busy === "extract" ? <div className="flex items-center justify-center text-sm text-gray-600 mt-2"><Loader2 size={14} className="animate-spin mr-2" />Reading {fileName}...</div> : null}
              {extractNote ? <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded p-2 mt-2">{extractNote}</div> : null}
              <div className="text-xs text-gray-500 mt-2">Or enter values manually below. The form is pre-filled with the handwritten sample report (Vitatron G70 A2 DR). Handwritten values should be re-checked, for example the RA P wave and the RV output mode.</div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div className="border border-gray-200 rounded p-3 bg-white space-y-2">
                <div className="text-sm font-semibold">Patient (optional)</div>
                <Inp label="Name / ID" value={d.name} onChange={(v) => set("name", v)} />
                <div className="grid grid-cols-2 gap-2">
                  <Inp label="Age" unit="yr" value={d.age} onChange={(v) => set("age", v)} />
                  <Inp label="LVEF" unit="%" value={d.lvef} onChange={(v) => set("lvef", v)} />
                  <Inp label="Implant date" type="date" value={d.implantDate} onChange={(v) => set("implantDate", v)} />
                  <Inp label="Report date" type="date" value={d.reportDate} onChange={(v) => set("reportDate", v)} />
                </div>
              </div>
              <div className="border border-gray-200 rounded p-3 bg-white space-y-2">
                <div className="text-sm font-semibold">Device and programming</div>
                <div className="grid grid-cols-2 gap-2">
                  <Inp label="Manufacturer" value={d.manufacturer} onChange={(v) => set("manufacturer", v)} />
                  <Inp label="Model" value={d.model} onChange={(v) => set("model", v)} />
                  <Inp label="Mode" value={d.mode} onChange={(v) => set("mode", v)} />
                  <Inp label="Base / upper rate" value={d.baseRate} onChange={(v) => set("baseRate", v)} unit="bpm" />
                  <Inp label="Upper rate" value={d.upperRate} onChange={(v) => set("upperRate", v)} unit="bpm" />
                  <Inp label="Paced AV delay" unit="ms" value={d.pav} onChange={(v) => set("pav", v)} />
                  <Inp label="Sensed AV delay" unit="ms" value={d.sav} onChange={(v) => set("sav", v)} />
                </div>
              </div>
              <div className="border border-gray-200 rounded p-3 bg-white space-y-2">
                <div className="text-sm font-semibold">Status, counters, battery</div>
                <div className="grid grid-cols-2 gap-2">
                  <Inp label="Heart rate" unit="bpm" value={d.hr} onChange={(v) => set("hr", v)} />
                  <Inp label="Rhythm (e.g. AS-VP)" value={d.rhythm} onChange={(v) => set("rhythm", v)} />
                  <Inp label="Atrial pacing" unit="%" value={d.ap} onChange={(v) => set("ap", v)} />
                  <Inp label="Ventricular pacing" unit="%" value={d.vp} onChange={(v) => set("vp", v)} />
                  <Inp label="Battery longevity" unit="yr" value={d.battLongevity} onChange={(v) => set("battLongevity", v)} />
                  <Inp label="Vent. high-rate episodes" value={d.vHRE} onChange={(v) => set("vHRE", v)} />
                  <Inp label="Atrial arrhythmia burden" unit="%" value={d.aBurden} onChange={(v) => set("aBurden", v)} />
                  <label className="flex items-center text-xs text-gray-600 mt-5"><input type="checkbox" checked={d.eri} onChange={(e) => set("eri", e.target.checked)} className="mr-2" />ERI reached</label>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <ChForm k="ra" nm="Right atrial lead (RA)" />
              <ChForm k="rv" nm="Right ventricular lead (RV)" />
            </div>

            <label className="block text-xs text-gray-600">Clinician notes
              <textarea value={d.notes} onChange={(e) => set("notes", e.target.value)} rows={3} className="w-full mt-1 border border-gray-300 rounded px-2 py-1 text-sm bg-white text-gray-900" />
            </label>

            <div className="flex gap-2">
              <button onClick={() => setTab("report")} className="px-4 py-2 rounded bg-slate-800 text-white text-sm">Generate report</button>
              <button onClick={() => { setD(SAMPLE); setAi(""); }} className="px-4 py-2 rounded border border-gray-300 text-sm bg-white">Reset to sample</button>
            </div>
          </div>
        )}

        {/* ---------------- REPORT ---------------- */}
        {tab === "report" && (
          <div className="space-y-4">
            <div className="flex gap-2 noprint">
              <button onClick={() => window.print()} className="flex items-center px-3 py-1.5 rounded border border-gray-300 text-sm bg-white"><Printer size={14} className="mr-1" />Print / PDF</button>
              <button onClick={copyText} className="px-3 py-1.5 rounded border border-gray-300 text-sm bg-white">Copy summary</button>
            </div>

            <div className={"border rounded p-4 " + SEV[R.overall].cls}>
              <div className="text-xs uppercase tracking-wide">Rule-based overall status</div>
              <div className="text-xl font-semibold">{SEV[R.overall].label}</div>
              <div className="text-sm mt-1">{d.manufacturer} {d.model} | {d.mode} | Implant {d.implantDate || "?"}{d.reportDate ? " | Report " + d.reportDate : ""}{d.name ? " | " + d.name : ""}</div>
              <div className="text-sm mt-2"><b>Suggested follow-up:</b> {R.follow} <span className="text-xs">(a suggestion, clinician decides)</span></div>
            </div>

            <div className="bg-white border border-gray-200 rounded p-3 overflow-x-auto">
              <div className="text-sm font-semibold mb-2">Parameter summary</div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-500"><th className="py-1">Parameter</th><th>RA</th><th>RV</th></tr></thead>
                <tbody>
                  <tr className="border-t"><td className="py-1">Sensing</td><td>{d.ra.sens ? d.ra.sens + " mV" : "-"}<Chip s={R.S.rasens} /></td><td>{d.rv.paced || !d.rv.sens ? "Paced" : d.rv.sens + " mV"}<Chip s={R.S.rvsens} /></td></tr>
                  <tr className="border-t"><td className="py-1">Impedance</td><td>{d.ra.imp ? d.ra.imp + " ohm" : "-"}<Chip s={R.S.raimp} /></td><td>{d.rv.imp ? d.rv.imp + " ohm" : "-"}<Chip s={R.S.rvimp} /></td></tr>
                  <tr className="border-t"><td className="py-1">Threshold</td><td>{d.ra.thr ? `${d.ra.thr} V @ ${d.ra.thrPw || "?"} ms` : "-"}<Chip s={R.S.rathr} /></td><td>{d.rv.thr ? `${d.rv.thr} V @ ${d.rv.thrPw || "?"} ms` : "-"}<Chip s={R.S.rvthr} /></td></tr>
                  <tr className="border-t"><td className="py-1">Output ({"mode"})</td><td>{d.ra.out ? `${d.ra.out} V (${d.ra.outMode})` : "-"}<Chip s={R.S.ramargin} /></td><td>{d.rv.out ? `${d.rv.out} V @ ${d.rv.outPw || "?"} ms (${d.rv.outMode})` : "-"}<Chip s={R.S.rvmargin} /></td></tr>
                  <tr className="border-t"><td className="py-1">Pacing</td><td>AP {d.ap || "-"}%<Chip s={R.S.ap} /></td><td>VP {d.vp || "-"}%<Chip s={R.S.vp} /></td></tr>
                  <tr className="border-t"><td className="py-1">Battery</td><td colSpan={2}>{d.eri ? "ERI reached" : d.battLongevity ? d.battLongevity + " yr estimated" : "-"}<Chip s={d.eri ? "alert" : R.S.batt} /></td></tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold">Findings (each linked to knowledge-base references)</div>
              {R.F.map((f, i) => {
                const X = SEV[f.sev];
                return (
                  <FindingCard key={i} f={f} X={X} />
                );
              })}
            </div>

            {d.notes ? <div className="bg-white border border-gray-200 rounded p-3 text-sm"><b>Clinician notes:</b> {d.notes}</div> : null}

            <div className="bg-white border border-gray-200 rounded p-3 noprint">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center text-sm font-semibold"><Sparkles size={14} className="mr-1" />AI analysis (optional)</div>
                <label className="flex items-center text-xs text-gray-600"><input type="checkbox" checked={aiWeb} onChange={(e) => setAiWeb(e.target.checked)} className="mr-2" />Also search the web for current guidelines / manufacturer docs</label>
              </div>
              <div className="text-xs text-gray-500 mt-1">Sends the values, rule findings and the retrieved knowledge-base passages to Claude. Do not include patient identifiers.</div>
              <button onClick={runAI} disabled={busy === "ai"} className="mt-2 px-3 py-1.5 rounded bg-indigo-700 text-white text-sm disabled:opacity-50">
                {busy === "ai" ? "Analyzing..." : "Run AI analysis"}
              </button>
              {busy === "ai" ? <Loader2 size={14} className="animate-spin inline ml-2" /> : null}
            </div>
            {ai ? <div className="bg-indigo-50 border border-indigo-200 rounded p-3"><div className="text-xs font-semibold text-indigo-800 mb-1">AI analysis (verify before use)</div><Rich text={ai} /></div> : null}

            <div className="text-xs text-gray-500 border-t pt-2">Decision-support tool. Cutoffs are common practice values from the cited consensus documents and device literature and are not a substitute for the manufacturer reference manual or clinical judgment.</div>
          </div>
        )}

        {/* ---------------- KB ---------------- */}
        {tab === "kb" && (
          <div className="space-y-3">
            <div className="flex items-center border border-gray-300 rounded bg-white px-2">
              <Search size={14} className="text-gray-400" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the knowledge base (e.g. high ventricular threshold, safety margin, impedance)" className="w-full px-2 py-2 text-sm bg-white text-gray-900 outline-none" />
            </div>
            {q.trim() ? (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">{hits.length} ranked result(s)</div>
                {hits.map((h) => <KBCard key={h.c.id} c={h.c} score={h.s} />)}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-gray-500">{KB.length} curated passages. Each one cites the source it is drawn from.</div>
                {KB.map((c) => <KBCard key={c.id} c={c} />)}
              </div>
            )}
          </div>
        )}

        {/* ---------------- REFERENCES ---------------- */}
        {tab === "refs" && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="text-sm font-semibold mb-2">Sources used by the knowledge base</div>
              <div className="space-y-1">
                {Object.keys(SRC).map((k) => (
                  <div key={k} className="text-sm"><span className="text-xs text-gray-400 mr-2">{k}</span><a href={SRC[k].u} target="_blank" rel="noreferrer" className="text-blue-700 underline">{SRC[k].t}</a>{SRC[k].v ? "" : <span className="text-xs text-gray-500"> (link not verified in this session)</span>}</div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded p-3">
              <div className="flex items-center text-sm font-semibold"><Globe size={14} className="mr-1" />Live web search for guidelines and manufacturer documentation</div>
              <div className="text-xs text-gray-500 mt-1">Searches for references relevant to this device and to the current findings.</div>
              <button onClick={findRefs} disabled={busy === "refs"} className="mt-2 px-3 py-1.5 rounded bg-slate-800 text-white text-sm disabled:opacity-50">{busy === "refs" ? "Searching..." : "Search web"}</button>
              {busy === "refs" ? <Loader2 size={14} className="animate-spin inline ml-2" /> : null}
              {refs ? (
                <div className="mt-3 space-y-2">
                  {refs.map((r, i) => (
                    <div key={i} className="border border-gray-200 rounded p-2">
                      <a href={r.url} target="_blank" rel="noreferrer" className="text-sm text-blue-700 underline">{r.title}</a>
                      <div className="text-xs text-gray-500">{r.publisher}</div>
                      <div className="text-xs text-gray-700">{r.relevance}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              {refRaw ? <div className="mt-3"><Rich text={refRaw} /></div> : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FindingCard({ f, X }) {
  const [open, setOpen] = useState(f.sev === "alert" || f.sev === "warn");
  const Icon = X.Icon;
  const refs = f.kb.map((i) => kbById(i)).filter(Boolean);
  return (
    <div className={"border rounded p-3 " + X.cls}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-start text-left">
        <Icon size={16} className="mt-0.5 shrink-0" />
        <div className="ml-2 flex-1">
          <div className="text-sm font-semibold">{f.title}<span className={"ml-2 px-2 py-0.5 rounded text-xs font-medium " + X.chip}>{X.label}</span></div>
          {f.detail ? <div className="text-sm">{f.detail}</div> : null}
          {f.action ? <div className="text-sm mt-1"><b>Suggested:</b> {f.action}</div> : null}
        </div>
        {refs.length ? (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />) : null}
      </button>
      {open && refs.length ? (
        <div className="mt-2 ml-6 space-y-2 bg-white/70 rounded p-2 text-gray-800">
          <div className="text-xs font-semibold">Retrieved references</div>
          {refs.map((c) => (
            <div key={c.id}>
              <div className="text-xs font-medium">{c.id} - {c.title}</div>
              <div className="text-xs text-gray-700">{c.text}</div>
              <SrcLinks ids={c.src} />
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}