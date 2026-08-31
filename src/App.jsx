import { useState, useEffect, useMemo, useRef } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

/* ------------------------------------------------------------------ */
/*  Data & schema                                                      */
/* ------------------------------------------------------------------ */

const START = new Date(2026, 7, 31); // ma 31 aug 2026
const DAY_NAMES = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
const WEEK_TARGET = 6; // sessies per week

const WEEK_TEMPLATES = [
  [
    // Week 1: pull + hardlopen al gedaan op zo 30 aug
    { kracht: "Push", cardio: null },
    { kracht: "Pull", cardio: "Duurloop 25–30 min rustig" },
    { kracht: "Arms & schouders", cardio: null },
    { kracht: null, cardio: null },
    { kracht: null, cardio: "VOETBAL — wedstrijd/training" },
    { kracht: "Legs", cardio: "Korte intervallen 10 × 30 sec (15–17 km/u), 60–90 sec rust" },
    { kracht: "Upper", cardio: "Herstelduurloop 20–25 min" },
  ],
  [
    { kracht: "Push", cardio: "Interval 8 × 2 min hard, 75 sec rust, helling 1%" },
    { kracht: "Pull", cardio: null },
    { kracht: "Arms & schouders", cardio: "Duurloop 30–35 min" },
    { kracht: null, cardio: null },
    { kracht: null, cardio: "VOETBAL — wedstrijd/training" },
    { kracht: "Legs", cardio: "Helling-intervallen 8 × 45 sec op 8–10%, 90 sec rust" },
    { kracht: "Upper", cardio: "Herstelduurloop 25 min" },
  ],
  [
    { kracht: "Push", cardio: "Interval 6 × 3 min hard, 90 sec rust, helling 1%" },
    { kracht: "Pull", cardio: null },
    { kracht: "Arms & schouders", cardio: "Helling-intervallen 8 × 45 sec, 90 sec rust" },
    { kracht: null, cardio: null },
    { kracht: null, cardio: "VOETBAL — wedstrijd/training" },
    { kracht: "Legs", cardio: "Korte intervallen 8 × 30 sec, fris en snel" },
    { kracht: "Upper", cardio: "Rustige duurloop 20 min" },
  ],
];

const DEFAULT_EXERCISES = {
  Push: [
    "Bench press", "Incline dumbbell press", "Shoulder press",
    "Lateral raises", "Triceps pushdown", "Overhead extension",
  ],
  Pull: [
    "Underhand lat pulldown", "Lat pulldown", "Barbell row", "Kabelrow (nauw)",
    "Face pulls", "Incline dumbbell curls", "Hammer curls",
  ],
  Arms: [
    "Shoulder press (dumbbell)", "Lateral raises", "Rear delt fly",
    "EZ-bar curl", "Hammer curls", "Triceps pushdown", "Overhead extension",
  ],
  Legs: [
    "Squat", "Leg press", "Romanian deadlift", "Leg curl",
    "Leg extension", "Calf raises", "Hanging leg raises (core)",
  ],
  Upper: [
    "Machine chest press", "Chest-supported row", "Lat pulldown",
    "Lateral raises", "Rear delt fly", "Biceps curl",
  ],
  Cardio: [],
};
const TYPES = ["Push", "Pull", "Arms", "Legs", "Upper", "Cardio"];

// Per oefening: doelspier, waarom, en een alternatief (wisselbaar)
const EXERCISE_INFO = {
  // Push
  "Bench press": { m: "Borst + triceps", why: "Je zwaarste drukoefening — bouwt de meeste massa en kracht in je borst.", alt: "Dumbbell bench press" },
  "Dumbbell bench press": { m: "Borst + triceps", why: "Grotere bewegingsuitslag en meer stabilisatiewerk dan de stang.", alt: "Bench press" },
  "Incline dumbbell press": { m: "Bovenkant borst + voorste schouder", why: "De schuine hoek pakt de bovenborst, die bij vlak drukken achterblijft.", alt: "Incline machine press" },
  "Incline machine press": { m: "Bovenkant borst", why: "Zelfde hoek als incline dumbbells, maar stabieler — fijn om veilig zwaar te gaan.", alt: "Incline dumbbell press" },
  "Shoulder press": { m: "Voorste + zijkant schouder", why: "Basisoefening voor schoudermassa en drukkracht boven je hoofd.", alt: "Dumbbell shoulder press" },
  "Dumbbell shoulder press": { m: "Voorste + zijkant schouder", why: "Dumbbells dwingen beide schouders apart te werken — geen sterke kant die compenseert.", alt: "Shoulder press" },
  "Lateral raises": { m: "Zijkant schouder", why: "De enige beweging die de zijkant echt isoleert — dit maakt je schouders breder.", alt: "Cable lateral raises" },
  "Cable lateral raises": { m: "Zijkant schouder", why: "Kabel geeft ook onderin spanning, waar dumbbells niets doen.", alt: "Lateral raises" },
  "Triceps pushdown": { m: "Triceps (laterale kop)", why: "Veilig zwaar te maken en makkelijk strak uit te voeren.", alt: "Skull crushers" },
  "Skull crushers": { m: "Triceps (lange kop)", why: "Gestrekte armpositie belast de lange kop zwaarder dan pushdowns.", alt: "Triceps pushdown" },
  "Overhead extension": { m: "Triceps (lange kop)", why: "Boven je hoofd staat de lange kop op stretch — die mist bij pushdowns.", alt: "Cable overhead extension" },
  "Cable overhead extension": { m: "Triceps (lange kop)", why: "Zelfde stretch als met dumbbell, maar constante kabelspanning.", alt: "Overhead extension" },
  // Pull
  "Underhand lat pulldown": { m: "Onderste lats + biceps", why: "Onderhandse grip laat je ellebogen langs je lichaam trekken → onderste latvezels + extra biceps.", alt: "Chin-ups" },
  "Chin-ups": { m: "Onderste lats + biceps", why: "Zelfde beweging met je lichaamsgewicht — zwaarder en functioneler.", alt: "Underhand lat pulldown" },
  "Lat pulldown": { m: "Buitenste lats (breedte)", why: "Brede bovenhandse grip trekt je ellebogen zijwaarts → V-vorm.", alt: "Pull-ups" },
  "Pull-ups": { m: "Buitenste lats (breedte)", why: "De koning van verticaal trekken — als je deze netjes kunt, groeit alles mee.", alt: "Lat pulldown" },
  "Barbell row": { m: "Hele bovenrug + lats", why: "Je zwaarste horizontale trek — dit bouwt rugdikte.", alt: "Chest-supported row" },
  "Kabelrow (nauw)": { m: "Midrug (rhomboids + traps)", why: "Constante kabelspanning en maximale squeeze tussen je schouderbladen.", alt: "Machine row" },
  "Machine row": { m: "Midrug", why: "Vast bewegingspad — ideaal om zonder techniek-zorgen dicht bij falen te trainen.", alt: "Kabelrow (nauw)" },
  "Face pulls": { m: "Achterste schouder + rotator cuff", why: "Beschermt je houding en schouders tegen al het druk- en trekwerk.", alt: "Rear delt fly" },
  "Incline dumbbell curls": { m: "Biceps (lange kop)", why: "Maximale stretch onderin — de sterkste groeiprikkel van alle curls.", alt: "Barbell curl" },
  "Barbell curl": { m: "Biceps (beide koppen)", why: "Zwaarste curl-variant — pure laadbaarheid.", alt: "Incline dumbbell curls" },
  "Hammer curls": { m: "Brachialis + onderarm", why: "Neutrale grip pakt de spier ónder je biceps — dat geeft armdikte.", alt: "Cable hammer curls" },
  "Cable hammer curls": { m: "Brachialis + onderarm", why: "Met het touw houd je constante spanning over de hele beweging.", alt: "Hammer curls" },
  // Arms
  "Shoulder press (dumbbell)": { m: "Voorste + zijkant schouder", why: "Tweede schoudermoment van de week, dumbbells voor gelijke belasting links/rechts.", alt: "Machine shoulder press" },
  "Machine shoulder press": { m: "Voorste + zijkant schouder", why: "Stabiel en veilig — fijn op een lichtere dag.", alt: "Shoulder press (dumbbell)" },
  "Rear delt fly": { m: "Achterste schouder", why: "Isoleert de achterkant die bij drukwerk niets doet — nodig voor ronde schouders.", alt: "Face pulls" },
  "EZ-bar curl": { m: "Biceps (beide koppen)", why: "EZ-stang spaart je polsen en is zwaar te laden.", alt: "Barbell curl" },
  // Legs
  "Squat": { m: "Quads + bilspieren + core", why: "De basis van beenkracht — direct terug te zien in je sprint en sprong op het veld.", alt: "Hack squat" },
  "Hack squat": { m: "Quads + bilspieren", why: "Zelfde beweging met rugsteun — zwaar beenwerk zonder balans-gedoe.", alt: "Squat" },
  "Leg press": { m: "Quads + bilspieren", why: "Veel beenvolume stapelen zonder je onderrug te belasten.", alt: "Hack squat" },
  "Romanian deadlift": { m: "Hamstrings + bilspieren", why: "Hamstrings op stretch — dé oefening voor sprintkracht en tegen hamstringblessures.", alt: "Leg curl" },
  "Leg curl": { m: "Hamstrings (kniefunctie)", why: "Pakt de hamstring vanuit de knie — de helft die RDL's niet dekken.", alt: "Nordic curls" },
  "Nordic curls": { m: "Hamstrings", why: "Bewezen de beste oefening tegen hamstringblessures bij voetballers.", alt: "Leg curl" },
  "Leg extension": { m: "Quads (isolatie)", why: "Isolatie zonder systeemvermoeidheid — quads afmaken na het zware werk.", alt: "Bulgarian split squat" },
  "Bulgarian split squat": { m: "Quads + bilspieren (per been)", why: "Traint elk been apart — verschillen tussen links en rechts werk je hiermee weg.", alt: "Leg extension" },
  "Calf raises": { m: "Kuiten", why: "Sterke kuiten = betere afzet en minder enkelblessures.", alt: "Seated calf raises" },
  "Seated calf raises": { m: "Kuiten (soleus)", why: "Zittend pak je de diepe kuitspier die staand deels buiten schot blijft.", alt: "Calf raises" },
  "Hanging leg raises (core)": { m: "Onderste buikspieren", why: "Zware core-oefening — stabiliteit voor squats én duels op het veld.", alt: "Cable crunch" },
  "Cable crunch": { m: "Buikspieren", why: "Buikspieren tegen weerstand trainen, net als elke andere spier.", alt: "Hanging leg raises (core)" },
  // Upper
  "Machine chest press": { m: "Borst", why: "Licht tweede borstmoment — machine houdt het veilig zonder tot falen te gaan.", alt: "Push-ups" },
  "Push-ups": { m: "Borst + triceps", why: "Perfecte lichte afsluiter — belast je zenuwstelsel nauwelijks.", alt: "Machine chest press" },
  "Chest-supported row": { m: "Bovenrug", why: "Rugwerk met borststeun — geen onderrugbelasting op je lichte dag.", alt: "Kabelrow (nauw)" },
  "Biceps curl": { m: "Biceps", why: "Derde armmoment van de week — licht, voor extra frequentie.", alt: "Cable curl" },
  "Cable curl": { m: "Biceps", why: "Constante spanning, ook onderin de beweging.", alt: "Biceps curl" },
};

const STORAGE_KEY = "dht-training-v2";
// Sessie van gisteren (zo 30 aug): pull + hardgelopen
const SEED_LOGS = [
  {
    id: 1,
    date: "2026-08-30",
    type: "Pull",
    entries: [],
    cardioDesc: "Hardgelopen",
    cardioMin: "",
    cardioSpeed: "",
    notes: "Gisteren gedaan — gewichten niet gelogd",
  },
];

// Rep-range en rust (sec) per oefening — op basis van hypertrofie-onderzoek:
// compounds 6–10 reps / 3 min, middenwerk 8–12 / 2 min, machines 10–15 / 90 sec, isolatie 12–20 / 60 sec
const PRESCRIPTION = {
  "Bench press": { reps: "6–10", rest: 180 },
  "Dumbbell bench press": { reps: "8–12", rest: 120 },
  "Incline dumbbell press": { reps: "8–12", rest: 120 },
  "Incline machine press": { reps: "10–12", rest: 90 },
  "Shoulder press": { reps: "8–12", rest: 120 },
  "Dumbbell shoulder press": { reps: "8–12", rest: 120 },
  "Shoulder press (dumbbell)": { reps: "8–12", rest: 120 },
  "Machine shoulder press": { reps: "10–15", rest: 90 },
  "Lateral raises": { reps: "12–20", rest: 60 },
  "Cable lateral raises": { reps: "12–20", rest: 60 },
  "Triceps pushdown": { reps: "10–15", rest: 60 },
  "Skull crushers": { reps: "8–12", rest: 90 },
  "Overhead extension": { reps: "10–15", rest: 60 },
  "Cable overhead extension": { reps: "10–15", rest: 60 },
  "Underhand lat pulldown": { reps: "8–12", rest: 120 },
  "Chin-ups": { reps: "6–10", rest: 120 },
  "Lat pulldown": { reps: "8–12", rest: 120 },
  "Pull-ups": { reps: "6–10", rest: 120 },
  "Barbell row": { reps: "6–10", rest: 180 },
  "Chest-supported row": { reps: "8–12", rest: 120 },
  "Kabelrow (nauw)": { reps: "10–12", rest: 90 },
  "Machine row": { reps: "10–12", rest: 90 },
  "Face pulls": { reps: "12–20", rest: 60 },
  "Rear delt fly": { reps: "12–20", rest: 60 },
  "Incline dumbbell curls": { reps: "10–12", rest: 60 },
  "Barbell curl": { reps: "8–12", rest: 90 },
  "EZ-bar curl": { reps: "8–12", rest: 90 },
  "Hammer curls": { reps: "10–12", rest: 60 },
  "Cable hammer curls": { reps: "12–15", rest: 60 },
  "Biceps curl": { reps: "12–15", rest: 60 },
  "Cable curl": { reps: "12–15", rest: 60 },
  "Squat": { reps: "5–8", rest: 180 },
  "Hack squat": { reps: "8–12", rest: 180 },
  "Leg press": { reps: "8–12", rest: 180 },
  "Romanian deadlift": { reps: "8–10", rest: 180 },
  "Leg curl": { reps: "10–15", rest: 90 },
  "Nordic curls": { reps: "5–8", rest: 120 },
  "Leg extension": { reps: "12–15", rest: 60 },
  "Bulgarian split squat": { reps: "8–12 p/been", rest: 120 },
  "Calf raises": { reps: "10–15", rest: 60 },
  "Seated calf raises": { reps: "12–20", rest: 60 },
  "Hanging leg raises (core)": { reps: "10–15", rest: 60 },
  "Cable crunch": { reps: "10–15", rest: 60 },
  "Machine chest press": { reps: "10–15", rest: 90 },
  "Push-ups": { reps: "12–20", rest: 60 },
};

const restLabel = (sec) => (sec >= 120 ? sec / 60 + " min" : sec + " sec");

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const iso = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const fmt = (isoStr) => {
  const d = new Date(isoStr + "T12:00:00");
  return `${DAY_NAMES[d.getDay()]} ${d.getDate()}/${d.getMonth() + 1}`;
};
const planForDate = (date) => {
  const i = Math.floor((date - START) / 86400000);
  if (i < 0) return null;
  const week = Math.floor(i / 7);
  const tpl = WEEK_TEMPLATES[Math.min(week, 2)][i % 7];
  return { ...tpl, week: week + 1, repeated: week > 2 };
};
// standaard rusttijd per oefening (sec)
const restFor = (exercise) => {
  if (PRESCRIPTION[exercise]) return PRESCRIPTION[exercise].rest;
  const n = exercise.toLowerCase();
  if (/(curl|face pull|raise|pushdown|extension|calf)/.test(n)) return 60;
  if (/(kabelrow|cable)/.test(n)) return 90;
  return 120;
};

/* ------------------------------------------------------------------ */
/*  App                                                                */
/* ------------------------------------------------------------------ */

export default function App() {
  const [tab, setTab] = useState("vandaag");
  const [logs, setLogs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState("");
  const [draft, setDraft] = useState(null);
  const [progressEx, setProgressEx] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [infoIdx, setInfoIdx] = useState(null);
  const [autoTimer, setAutoTimer] = useState(true);
  const [timer, setTimer] = useState(null); // {end, total}
  const [now, setNow] = useState(Date.now());
  const timerDone = useRef(false);

  const today = new Date();

  /* ---------- storage ---------- */
  useEffect(() => {
    (async () => {
      let found = false;
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          if (Array.isArray(data.logs)) {
            setLogs(data.logs);
            found = true;
          }
        }
      } catch (e) { /* nog geen data */ }
      if (!found) {
        // eerste keer: sessie van gisteren (pull + hardlopen) alvast in het logboek
        setLogs(SEED_LOGS);
        try {
          await window.storage.set(STORAGE_KEY, JSON.stringify({ logs: SEED_LOGS }));
        } catch (e2) { /* prima, dan alleen lokaal */ }
      }
      setLoaded(true);
    })();
  }, []);

  const persist = async (nextLogs, msg) => {
    setLogs(nextLogs);
    try {
      await window.storage.set(STORAGE_KEY, JSON.stringify({ logs: nextLogs }));
      setSaveState(msg || "Opgeslagen");
      setTimeout(() => setSaveState(""), 3500);
    } catch (e) {
      setSaveState("Opslaan mislukt — probeer opnieuw");
    }
  };

  /* ---------- rusttimer ---------- */
  useEffect(() => {
    if (!timer) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [timer]);

  const remaining = timer ? Math.max(0, Math.ceil((timer.end - now) / 1000)) : 0;

  useEffect(() => {
    if (timer && remaining === 0 && !timerDone.current) {
      timerDone.current = true;
      try { if (navigator.vibrate) navigator.vibrate([200, 100, 200]); } catch (e) {}
      setSaveState("⏱ Rust voorbij — volgende set!");
      setTimeout(() => { setSaveState(""); setTimer(null); }, 3000);
    }
  }, [remaining, timer]);

  const startTimer = (sec) => {
    timerDone.current = false;
    setTimer({ end: Date.now() + sec * 1000, total: sec });
    setNow(Date.now());
  };

  /* ---------- vorige sessies & PR's ---------- */
  const lastFor = (exercise, beforeDate) => {
    const prior = logs
      .filter((l) => l.date < beforeDate && l.entries.some((e) => e.exercise === exercise))
      .sort((a, b) => (a.date > b.date ? -1 : 1));
    if (prior.length === 0) return null;
    const en = prior[0].entries.find((e) => e.exercise === exercise);
    return { date: prior[0].date, sets: en.sets };
  };

  const prMap = useMemo(() => {
    const m = {};
    logs.forEach((l) =>
      l.entries.forEach((e) => {
        const top = Math.max(0, ...e.sets.map((s) => Number(s.w) || 0));
        if (top > 0 && (!m[e.exercise] || top > m[e.exercise].w)) {
          m[e.exercise] = { w: top, date: l.date };
        }
      })
    );
    return m;
  }, [logs]);

  /* ---------- draft ---------- */
  const newDraft = (type, dateIso, cardioPrefill) => ({
    date: dateIso || iso(today),
    type,
    entries:
      type === "Cardio"
        ? []
        : DEFAULT_EXERCISES[type].map((name) => ({
            exercise: name,
            sets: [{ w: "", r: "" }, { w: "", r: "" }, { w: "", r: "" }],
          })),
    cardioDesc: cardioPrefill || "",
    cardioMin: "",
    cardioSpeed: "",
    notes: "",
  });

  const startLog = (type, dateIso, cardioPrefill) => {
    setDraft(newDraft(type, dateIso, cardioPrefill));
    setTab("log");
  };

  const copyPrevSession = () => {
    const prior = logs
      .filter((l) => l.type === draft.type && l.date < draft.date)
      .sort((a, b) => (a.date > b.date ? -1 : 1));
    if (prior.length === 0) {
      setSaveState("Geen eerdere " + draft.type + "-sessie gevonden");
      setTimeout(() => setSaveState(""), 2500);
      return;
    }
    setDraft({
      ...draft,
      entries: prior[0].entries.map((e) => ({
        exercise: e.exercise,
        sets: e.sets.map((s) => ({ w: String(s.w), r: String(s.r) })),
      })),
    });
    setSaveState("Vorige sessie gekopieerd (" + fmt(prior[0].date) + ")");
    setTimeout(() => setSaveState(""), 2500);
  };

  const copyPrevExercise = (ei) => {
    const en = draft.entries[ei];
    const prev = lastFor(en.exercise, draft.date);
    if (!prev) return;
    const entries = [...draft.entries];
    entries[ei] = {
      ...en,
      sets: prev.sets.map((s) => ({ w: String(s.w), r: String(s.r) })),
    };
    setDraft({ ...draft, entries });
  };

  const saveDraft = async () => {
    const entries = draft.entries
      .map((en) => ({
        exercise: en.exercise.trim(),
        sets: en.sets.filter((s) => s.w !== "" || s.r !== ""),
      }))
      .filter((en) => en.exercise && en.sets.length > 0);
    const hasCardio = draft.cardioDesc.trim() !== "" || draft.cardioMin !== "";
    if (entries.length === 0 && !hasCardio) {
      setSaveState("Vul minstens één set of cardio in");
      setTimeout(() => setSaveState(""), 2500);
      return;
    }
    // PR-detectie vóór opslaan
    const prs = [];
    entries.forEach((en) => {
      const top = Math.max(0, ...en.sets.map((s) => Number(s.w) || 0));
      const old = prMap[en.exercise];
      if (top > 0 && (!old || top > old.w)) prs.push(`${en.exercise} ${top} kg`);
    });
    const log = {
      id: Date.now(),
      date: draft.date,
      type: draft.type,
      entries,
      cardioDesc: draft.cardioDesc.trim(),
      cardioMin: draft.cardioMin,
      cardioSpeed: draft.cardioSpeed,
      notes: draft.notes.trim(),
    };
    await persist(
      [...logs, log].sort((a, b) => (a.date < b.date ? -1 : 1)),
      prs.length > 0 ? "🏆 Nieuw PR: " + prs.join(" · ") : "Opgeslagen"
    );
    setDraft(null);
    setTimer(null);
    setTab("logboek");
  };

  const deleteLog = async (id) => persist(logs.filter((l) => l.id !== id));

  /* ---------- afgeleiden ---------- */
  const allExercises = useMemo(() => {
    const s = new Set();
    logs.forEach((l) => l.entries.forEach((e) => s.add(e.exercise)));
    return [...s].sort();
  }, [logs]);

  const progressData = useMemo(() => {
    if (!progressEx) return [];
    return logs
      .filter((l) => l.entries.some((e) => e.exercise === progressEx))
      .map((l) => {
        const en = l.entries.find((e) => e.exercise === progressEx);
        const top = Math.max(0, ...en.sets.map((s) => Number(s.w) || 0));
        const vol = en.sets.reduce((t, s) => t + (Number(s.w) || 0) * (Number(s.r) || 0), 0);
        return { date: fmt(l.date), top, vol };
      });
  }, [logs, progressEx]);

  /* ---------- week & streak ---------- */
  const monday = useMemo(() => {
    const m = new Date(today);
    m.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    return m;
  }, []);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { date: d, plan: planForDate(d), isToday: iso(d) === iso(today) };
      }),
    [monday]
  );

  const weekCount = useMemo(() => {
    const start = iso(monday);
    const days = new Set(logs.filter((l) => l.date >= start && l.date <= iso(today)).map((l) => l.date));
    return days.size;
  }, [logs, monday]);

  const streak = useMemo(() => {
    const days = new Set(logs.map((l) => l.date));
    let s = 0;
    const d = new Date(today);
    if (!days.has(iso(d))) d.setDate(d.getDate() - 1); // vandaag nog niet getraind telt niet tegen
    while (days.has(iso(d))) {
      s++;
      d.setDate(d.getDate() - 1);
    }
    return s;
  }, [logs]);

  const todayPlan = planForDate(today);
  const cardioDoneToday = logs.some((l) => l.date === iso(today) && (l.type === "Cardio" || l.cardioDesc));

  if (!loaded) {
    return (
      <div className="app"><Style /><div className="loading">Dashboard laden…</div></div>
    );
  }

  return (
    <div className="app">
      <Style />

      <header className="hdr">
        <div>
          <div className="hdr-eyebrow">DHT TRAINING</div>
          <h1 className="hdr-title">Pull · Push · Pitch</h1>
        </div>
        <div className="hdr-count">
          <span className="hdr-num">{streak > 0 ? `🔥 ${streak}` : logs.length}</span>
          <span className="hdr-lbl">{streak > 0 ? "dagen streak" : "sessies gelogd"}</span>
        </div>
      </header>

      {/* week-strip */}
      <div className="strip">
        {weekDays.map((d, i) => {
          const isMatch = d.date.getDay() === 5;
          const trained = logs.some((l) => l.date === iso(d.date));
          return (
            <div key={i} className={"strip-day" + (d.isToday ? " strip-today" : "") + (isMatch ? " strip-match" : "")}>
              <div className="strip-name">{DAY_NAMES[d.date.getDay()]}</div>
              <div className="strip-date">{trained ? "✓" : d.date.getDate()}</div>
              <div className="strip-dots">
                {d.plan && d.plan.kracht && <span className="dot dot-k" title="Kracht" />}
                {d.plan && d.plan.cardio && <span className="dot dot-c" title="Cardio" />}
              </div>
              {isMatch && <div className="strip-matchlbl">MATCH</div>}
            </div>
          );
        })}
      </div>

      {/* weekvoortgang */}
      <div className="weekprog">
        <div className="weekprog-bar">
          <div className="weekprog-fill" style={{ width: Math.min(100, (weekCount / WEEK_TARGET) * 100) + "%" }} />
        </div>
        <span className="weekprog-lbl">{weekCount}/{WEEK_TARGET} trainingsdagen deze week</span>
      </div>

      <nav className="tabs">
        {[
          ["vandaag", "Vandaag"],
          ["schema", "Schema"],
          ["log", "Log training"],
          ["logboek", "Logboek"],
          ["progressie", "Progressie"],
        ].map(([key, label]) => (
          <button key={key} className={"tab" + (tab === key ? " tab-on" : "")} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>

      {saveState && <div className={"toast" + (saveState.startsWith("🏆") ? " toast-pr" : "")}>{saveState}</div>}

      {/* ---------------- VANDAAG ---------------- */}
      {tab === "vandaag" && (
        <section>
          <h2 className="sec-title">
            {fmt(iso(today))} — week {todayPlan ? todayPlan.week : "—"}
            {todayPlan && todayPlan.repeated ? " (herhaling wk 3)" : ""}
          </h2>
          {todayPlan ? (
            <div className="cards">
              {todayPlan.kracht && (
                <div className="card">
                  <div className="card-eyebrow">Kracht</div>
                  <div className="card-main">{todayPlan.kracht}</div>
                  {TYPES.includes(todayPlan.kracht.split(" ")[0]) && (
                    <button className="btn" onClick={() => startLog(todayPlan.kracht.split(" ")[0])}>
                      Log deze training
                    </button>
                  )}
                </div>
              )}
              {todayPlan.cardio && (
                <div className={"card" + (todayPlan.cardio.startsWith("VOETBAL") ? " card-match" : "")}>
                  <div className="card-eyebrow">
                    {todayPlan.cardio.startsWith("VOETBAL") ? "Matchday" : "Cardio (loopband)"}
                  </div>
                  <div className="card-main">{todayPlan.cardio}</div>
                  {cardioDoneToday ? (
                    <span className="done-lbl">✓ Gedaan</span>
                  ) : (
                    <button className="btn btn-ghost" onClick={() => startLog("Cardio", iso(today), todayPlan.cardio)}>
                      ✓ Gedaan — log details
                    </button>
                  )}
                </div>
              )}
              {!todayPlan.kracht && !todayPlan.cardio && (
                <div className="card"><div className="card-main">Rustdag — herstel is ook training.</div></div>
              )}
            </div>
          ) : (
            <div className="card"><div className="card-main">Het schema start op ma 31 aug. Vrij loggen kan altijd via "Log training".</div></div>
          )}
        </section>
      )}

      {/* ---------------- SCHEMA ---------------- */}
      {tab === "schema" && (
        <section>
          {WEEK_TEMPLATES.map((week, wi) => (
            <div key={wi} className="week-block">
              <h2 className="sec-title">Week {wi + 1}</h2>
              <table className="tbl">
                <thead><tr><th>Dag</th><th>Kracht</th><th>Cardio (loopband)</th></tr></thead>
                <tbody>
                  {week.map((d, di) => {
                    const date = new Date(START);
                    date.setDate(START.getDate() + wi * 7 + di);
                    const isToday = iso(date) === iso(today);
                    return (
                      <tr key={di} className={isToday ? "row-today" : ""}>
                        <td className="td-day">{DAY_NAMES[date.getDay()]} {date.getDate()}/{date.getMonth() + 1}</td>
                        <td>{d.kracht || "—"}</td>
                        <td className={d.cardio && d.cardio.startsWith("VOETBAL") ? "td-match" : ""}>{d.cardio || "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}

          <h2 className="sec-title">Oefeningen per dag</h2>
          {TYPES.filter((t) => t !== "Cardio").map((t) => (
            <div key={t} className="card split-card">
              <div className="card-eyebrow">{t}</div>
              {DEFAULT_EXERCISES[t].map((ex) => (
                <div key={ex} className="split-row">
                  <span className="split-ex">{ex}</span>
                  <span className="split-muscle">
                    {EXERCISE_INFO[ex] ? EXERCISE_INFO[ex].m : ""}
                    {PRESCRIPTION[ex] ? ` — ${PRESCRIPTION[ex].reps} reps · ${restLabel(PRESCRIPTION[ex].rest)}` : ""}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </section>
      )}

      {/* ---------------- LOG ---------------- */}
      {tab === "log" && (
        <section>
          {!draft ? (
            <>
              <h2 className="sec-title">Nieuwe training loggen</h2>
              <div className="type-grid">
                {TYPES.map((t) => (
                  <button key={t} className="type-btn" onClick={() => startLog(t)}>{t}</button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="log-head">
                <h2 className="sec-title">{draft.type} loggen</h2>
                <input
                  type="date" className="inp inp-date" value={draft.date}
                  onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                />
              </div>

              {draft.type !== "Cardio" && (
                <div className="log-tools">
                  <button className="mini mini-add" onClick={copyPrevSession}>⟳ Kopieer vorige {draft.type}-sessie</button>
                  <label className="auto-lbl">
                    <input type="checkbox" checked={autoTimer} onChange={(e) => setAutoTimer(e.target.checked)} />
                    Auto-rusttimer
                  </label>
                </div>
              )}

              {draft.type === "Cardio" ? (
                <div className="card">
                  <label className="lbl">Wat heb je gedaan?</label>
                  <input
                    className="inp" placeholder="Bijv. interval 6 × 2 min op 13 km/u"
                    value={draft.cardioDesc}
                    onChange={(e) => setDraft({ ...draft, cardioDesc: e.target.value })}
                  />
                  <div className="cardio-grid">
                    <div>
                      <label className="lbl">Duur (min)</label>
                      <input className="inp inp-num" type="number" placeholder="30" value={draft.cardioMin}
                        onChange={(e) => setDraft({ ...draft, cardioMin: e.target.value })} />
                    </div>
                    <div>
                      <label className="lbl">Snelheid (km/u)</label>
                      <input className="inp inp-num" type="number" step="0.1" placeholder="13" value={draft.cardioSpeed}
                        onChange={(e) => setDraft({ ...draft, cardioSpeed: e.target.value })} />
                    </div>
                  </div>
                </div>
              ) : (
                draft.entries.map((en, ei) => {
                  const prev = en.exercise ? lastFor(en.exercise, draft.date) : null;
                  const pr = prMap[en.exercise];
                  const info = EXERCISE_INFO[en.exercise];
                  return (
                    <div key={ei} className="ex-card">
                      <div className="ex-head">
                        <input
                          className="ex-name" value={en.exercise} placeholder="Naam oefening"
                          onChange={(e) => {
                            const entries = [...draft.entries];
                            entries[ei] = { ...en, exercise: e.target.value };
                            setDraft({ ...draft, entries });
                          }}
                        />
                        {pr && <span className="pr-tag" title={"PR gezet op " + fmt(pr.date)}>PR {pr.w} kg</span>}
                      </div>
                      {info && (
                        <div className="muscle-row">
                          <span className="muscle-chip">{info.m}</span>
                          {PRESCRIPTION[en.exercise] && (
                            <span className="rx-chip">
                              {PRESCRIPTION[en.exercise].reps} reps · {restLabel(PRESCRIPTION[en.exercise].rest)} rust
                            </span>
                          )}
                          <button className="mini mini-info" onClick={() => setInfoIdx(infoIdx === ei ? null : ei)}>
                            {infoIdx === ei ? "sluit" : "waarom?"}
                          </button>
                        </div>
                      )}
                      {info && infoIdx === ei && (
                        <div className="info-panel">
                          <p className="info-why">{info.why}</p>
                          {EXERCISE_INFO[info.alt] && (
                            <button
                              className="mini mini-swap"
                              onClick={() => {
                                const entries = [...draft.entries];
                                entries[ei] = { ...en, exercise: info.alt };
                                setDraft({ ...draft, entries });
                              }}
                            >
                              ↔ Wissel naar {info.alt} <span className="swap-muscle">({EXERCISE_INFO[info.alt].m})</span>
                            </button>
                          )}
                        </div>
                      )}
                      {prev ? (
                        <div className="prev">
                          Vorige ({fmt(prev.date)}): {prev.sets.map((s) => `${s.w || 0}×${s.r || 0}`).join(" · ")}
                          <button className="mini mini-copy" onClick={() => copyPrevExercise(ei)}>kopieer</button>
                        </div>
                      ) : (
                        en.exercise && <div className="prev prev-none">Eerste keer — zet een startgewicht neer 💪</div>
                      )}
                      <div className="sets">
                        <div className="set-row set-hdr"><span>Set</span><span>kg</span><span>reps</span><span /></div>
                        {en.sets.map((s, si) => (
                          <div key={si} className="set-row">
                            <span className="set-n">{si + 1}</span>
                            <input
                              className="inp inp-num" type="number" inputMode="decimal" placeholder={prev && prev.sets[si] ? String(prev.sets[si].w) : "0"}
                              value={s.w}
                              onChange={(e) => {
                                const entries = [...draft.entries];
                                const sets = [...en.sets];
                                sets[si] = { ...s, w: e.target.value };
                                entries[ei] = { ...en, sets };
                                setDraft({ ...draft, entries });
                              }}
                            />
                            <input
                              className="inp inp-num" type="number" inputMode="numeric" placeholder={prev && prev.sets[si] ? String(prev.sets[si].r) : "0"}
                              value={s.r}
                              onChange={(e) => {
                                const entries = [...draft.entries];
                                const sets = [...en.sets];
                                sets[si] = { ...s, r: e.target.value };
                                entries[ei] = { ...en, sets };
                                setDraft({ ...draft, entries });
                              }}
                              onBlur={(e) => {
                                if (autoTimer && e.target.value !== "") startTimer(restFor(en.exercise));
                              }}
                            />
                            <button
                              className="mini" title="Set verwijderen"
                              onClick={() => {
                                const entries = [...draft.entries];
                                entries[ei] = { ...en, sets: en.sets.filter((_, x) => x !== si) };
                                setDraft({ ...draft, entries });
                              }}
                            >×</button>
                          </div>
                        ))}
                        <button
                          className="mini mini-add"
                          onClick={() => {
                            const entries = [...draft.entries];
                            entries[ei] = { ...en, sets: [...en.sets, { w: "", r: "" }] };
                            setDraft({ ...draft, entries });
                          }}
                        >+ set</button>
                      </div>
                    </div>
                  );
                })
              )}

              {draft.type !== "Cardio" && (
                <button
                  className="btn btn-ghost"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      entries: [...draft.entries, { exercise: "", sets: [{ w: "", r: "" }, { w: "", r: "" }, { w: "", r: "" }] }],
                    })
                  }
                >+ Oefening toevoegen</button>
              )}

              <label className="lbl">Notities</label>
              <input
                className="inp" placeholder="Bijv. schouder voelde stroef bij face pulls"
                value={draft.notes}
                onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              />

              <div className="log-actions">
                <button className="btn" onClick={saveDraft}>Training opslaan</button>
                <button className="btn btn-ghost" onClick={() => { setDraft(null); setTimer(null); }}>Annuleren</button>
              </div>
              <p className="muted">Lege sets worden automatisch overgeslagen. Grijze getallen = je vorige sessie.</p>
            </>
          )}
        </section>
      )}

      {/* ---------------- LOGBOEK ---------------- */}
      {tab === "logboek" && (
        <section>
          <h2 className="sec-title">Logboek</h2>
          {logs.length === 0 ? (
            <div className="card"><div className="card-main">Nog niets gelogd. Je eerste sessie staat hier zodra je hem opslaat.</div></div>
          ) : (
            [...logs].reverse().map((l) => (
              <div key={l.id} className="log-item">
                <button className="log-row" onClick={() => setExpanded(expanded === l.id ? null : l.id)}>
                  <span className="log-date">{fmt(l.date)}</span>
                  <span className={"badge badge-" + l.type.toLowerCase()}>{l.type}</span>
                  <span className="log-sum">
                    {l.type === "Cardio"
                      ? (l.cardioDesc || "Cardio") + (l.cardioMin ? ` · ${l.cardioMin} min` : "") + (l.cardioSpeed ? ` · ${l.cardioSpeed} km/u` : "")
                      : l.entries.length > 0
                        ? `${l.entries.length} oefeningen · ${l.entries.reduce((t, e) => t + e.sets.length, 0)} sets`
                        : (l.cardioDesc || "Gelogd zonder details")}
                  </span>
                  <span className="log-chevron">{expanded === l.id ? "▴" : "▾"}</span>
                </button>
                {expanded === l.id && (
                  <div className="log-detail">
                    {l.entries.map((e, i) => {
                      const isPr = prMap[e.exercise] && prMap[e.exercise].date === l.date &&
                        Math.max(0, ...e.sets.map((s) => Number(s.w) || 0)) === prMap[e.exercise].w;
                      return (
                        <div key={i} className="log-ex">
                          <span className="log-ex-name">{e.exercise}{isPr ? " 🏆" : ""}</span>
                          <span className="log-ex-sets">{e.sets.map((s) => `${s.w || 0}kg×${s.r || 0}`).join("  ·  ")}</span>
                        </div>
                      );
                    })}
                    {l.cardioDesc && (
                      <div className="log-ex">
                        <span className="log-ex-name">Cardio</span>
                        <span className="log-ex-sets">{l.cardioDesc}{l.cardioMin ? ` — ${l.cardioMin} min` : ""}{l.cardioSpeed ? ` — ${l.cardioSpeed} km/u` : ""}</span>
                      </div>
                    )}
                    {l.notes && <div className="log-notes">„{l.notes}"</div>}
                    <button className="mini mini-del" onClick={() => deleteLog(l.id)}>Verwijderen</button>
                  </div>
                )}
              </div>
            ))
          )}
        </section>
      )}

      {/* ---------------- PROGRESSIE ---------------- */}
      {tab === "progressie" && (
        <section>
          <h2 className="sec-title">Progressie per oefening</h2>
          {allExercises.length === 0 ? (
            <div className="card"><div className="card-main">Log eerst een paar krachttrainingen — daarna zie je hier je gewichten stijgen.</div></div>
          ) : (
            <>
              <select className="inp" value={progressEx} onChange={(e) => setProgressEx(e.target.value)}>
                <option value="">Kies een oefening…</option>
                {allExercises.map((ex) => <option key={ex} value={ex}>{ex}</option>)}
              </select>

              {progressEx && progressData.length > 0 && (
                <>
                  <div className="chart-wrap">
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart data={progressData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                        <CartesianGrid stroke="#dfe6df" strokeDasharray="2 4" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#5a6b5f" }} />
                        <YAxis tick={{ fontSize: 11, fill: "#5a6b5f" }} unit="kg" />
                        <Tooltip
                          formatter={(v, n) => [n === "top" ? `${v} kg` : `${v} kg volume`, n === "top" ? "Topset" : "Volume"]}
                          contentStyle={{ borderRadius: 8, border: "1px solid #cfd8cf", fontFamily: "inherit" }}
                        />
                        <Line type="monotone" dataKey="top" stroke="#1e8a4c" strokeWidth={2.5} dot={{ r: 4, fill: "#1e8a4c" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <table className="tbl">
                    <thead><tr><th>Sessie</th><th>Topset</th><th>Volume</th></tr></thead>
                    <tbody>
                      {[...progressData].reverse().slice(0, 8).map((d, i) => (
                        <tr key={i}><td>{d.date}</td><td>{d.top} kg</td><td>{d.vol} kg</td></tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
              {progressEx && progressData.length === 0 && <p className="muted">Nog geen data voor deze oefening.</p>}

              {Object.keys(prMap).length > 0 && (
                <>
                  <h2 className="sec-title">🏆 Personal records</h2>
                  <table className="tbl">
                    <thead><tr><th>Oefening</th><th>PR</th><th>Gezet op</th></tr></thead>
                    <tbody>
                      {Object.entries(prMap)
                        .sort((a, b) => b[1].w - a[1].w)
                        .map(([ex, pr]) => (
                          <tr key={ex}><td>{ex}</td><td className="td-pr">{pr.w} kg</td><td>{fmt(pr.date)}</td></tr>
                        ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}
        </section>
      )}

      {/* ---------------- RUSTTIMER (sticky) ---------------- */}
      {tab === "log" && draft && draft.type !== "Cardio" && (
        <div className="timerbar">
          {timer && remaining > 0 ? (
            <>
              <div className="timer-progress">
                <div className="timer-fill" style={{ width: (remaining / timer.total) * 100 + "%" }} />
              </div>
              <span className="timer-time">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
              <button className="mini" onClick={() => setTimer(null)}>Stop</button>
            </>
          ) : (
            <>
              <span className="timer-lbl">Rust:</span>
              {[60, 90, 120, 180].map((s) => (
                <button key={s} className="mini timer-btn" onClick={() => startTimer(s)}>
                  {s < 120 ? s + "s" : s / 60 + "m"}
                </button>
              ))}
            </>
          )}
        </div>
      )}

      <footer className="ftr">Data wordt alleen voor jou opgeslagen en blijft bewaard tussen sessies.</footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

function Style() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600&display=swap');

      * { box-sizing: border-box; }
      body { margin: 0; }
      .app {
        min-height: 100vh; background: #f1f4f0; color: #16211a;
        font-family: 'Barlow', system-ui, sans-serif; font-size: 15px;
        max-width: 760px; margin: 0 auto; padding: 20px 16px 96px;
      }
      .loading { padding: 48px 0; text-align: center; color: #5a6b5f; }

      .hdr { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 16px; }
      .hdr-eyebrow { font-family: 'Barlow Condensed'; font-weight: 700; letter-spacing: .18em; font-size: 12px; color: #1e8a4c; }
      .hdr-title { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 34px; line-height: 1; margin: 2px 0 0; text-transform: uppercase; }
      .hdr-count { text-align: right; }
      .hdr-num { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 30px; display: block; line-height: 1; }
      .hdr-lbl { font-size: 11px; color: #5a6b5f; text-transform: uppercase; letter-spacing: .08em; }

      .strip { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; margin-bottom: 10px; }
      .strip-day { background: #fff; border: 1px solid #dfe6df; border-radius: 10px; padding: 8px 4px 6px; text-align: center; }
      .strip-today { border: 2px solid #16211a; }
      .strip-match { background: #16211a; color: #fff; border-color: #16211a; }
      .strip-name { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 12px; letter-spacing: .08em; text-transform: uppercase; }
      .strip-date { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 20px; line-height: 1.1; }
      .strip-dots { display: flex; gap: 3px; justify-content: center; margin-top: 3px; min-height: 7px; }
      .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
      .dot-k { background: #16211a; } .strip-match .dot-k { background: #fff; }
      .dot-c { background: #1e8a4c; } .strip-match .dot-c { background: #7ee2a8; }
      .strip-matchlbl { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 9px; letter-spacing: .14em; color: #7ee2a8; }

      .weekprog { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
      .weekprog-bar { flex: 1; height: 8px; background: #dfe6df; border-radius: 999px; overflow: hidden; }
      .weekprog-fill { height: 100%; background: #1e8a4c; border-radius: 999px; transition: width .4s ease; }
      .weekprog-lbl { font-size: 12px; color: #5a6b5f; white-space: nowrap; font-weight: 600; }

      .tabs { display: flex; gap: 6px; overflow-x: auto; margin-bottom: 18px; padding-bottom: 2px; }
      .tab { border: 1px solid #cfd8cf; background: #fff; color: #16211a; border-radius: 999px;
             padding: 7px 14px; font: inherit; font-weight: 600; font-size: 13px; cursor: pointer; white-space: nowrap; }
      .tab-on { background: #16211a; color: #fff; border-color: #16211a; }
      .tab:focus-visible, .btn:focus-visible, .mini:focus-visible, .type-btn:focus-visible, .log-row:focus-visible { outline: 2px solid #1e8a4c; outline-offset: 2px; }

      .toast { background: #16211a; color: #fff; border-radius: 8px; padding: 8px 14px; font-size: 13px; margin-bottom: 12px; display: inline-block; }
      .toast-pr { background: #1e8a4c; font-weight: 600; }

      .sec-title { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 20px; text-transform: uppercase; letter-spacing: .04em; margin: 14px 0 10px; }
      .cards { display: grid; gap: 10px; }
      .card { background: #fff; border: 1px solid #dfe6df; border-radius: 12px; padding: 14px; }
      .card-match { background: #16211a; color: #fff; border-color: #16211a; }
      .card-eyebrow { font-size: 11px; text-transform: uppercase; letter-spacing: .12em; color: #1e8a4c; font-weight: 600; margin-bottom: 4px; }
      .card-match .card-eyebrow { color: #7ee2a8; }
      .card-main { font-size: 16px; font-weight: 500; margin-bottom: 10px; }
      .muted { color: #5a6b5f; font-size: 13px; }
      .done-lbl { color: #1e8a4c; font-weight: 700; }
      .card-match .done-lbl { color: #7ee2a8; }

      .btn { background: #1e8a4c; color: #fff; border: none; border-radius: 8px; padding: 9px 16px;
             font: inherit; font-weight: 600; font-size: 14px; cursor: pointer; }
      .btn-ghost { background: transparent; color: #16211a; border: 1px solid #cfd8cf; }
      .card-match .btn-ghost { color: #fff; border-color: #445048; }

      .tbl { width: 100%; border-collapse: collapse; background: #fff; border: 1px solid #dfe6df; border-radius: 12px; overflow: hidden; margin-bottom: 18px; font-size: 13.5px; }
      .tbl th { font-family: 'Barlow Condensed'; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; font-size: 12px; text-align: left; padding: 9px 10px; background: #e8ede7; }
      .tbl td { padding: 8px 10px; border-top: 1px solid #eef2ed; vertical-align: top; }
      .td-day { font-weight: 600; white-space: nowrap; }
      .td-match { font-weight: 700; color: #1e8a4c; }
      .td-pr { font-weight: 700; }
      .row-today td { background: #eaf6ee; }
      .week-block { margin-bottom: 6px; }

      .type-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 8px; }
      .type-btn { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 20px; text-transform: uppercase;
                  background: #fff; border: 1px solid #cfd8cf; border-radius: 12px; padding: 22px 8px; cursor: pointer; color: #16211a; }
      .type-btn:hover { border-color: #1e8a4c; color: #1e8a4c; }

      .log-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
      .log-tools { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; flex-wrap: wrap; }
      .auto-lbl { display: flex; align-items: center; gap: 6px; font-size: 13px; color: #5a6b5f; font-weight: 600; }
      .inp { width: 100%; border: 1px solid #cfd8cf; border-radius: 8px; padding: 8px 10px; font: inherit; background: #fff; margin-bottom: 10px; }
      .inp-date { width: auto; margin-bottom: 10px; }
      .inp-num { width: 100%; text-align: center; margin-bottom: 0; }
      .lbl { display: block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #5a6b5f; margin: 4px 0 4px; }
      .cardio-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

      .ex-card { background: #fff; border: 1px solid #dfe6df; border-radius: 12px; padding: 12px; margin-bottom: 10px; }
      .ex-head { display: flex; align-items: center; gap: 8px; }
      .ex-name { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 17px; border: none; border-bottom: 1px dashed #cfd8cf; flex: 1; padding: 2px 0 6px; margin-bottom: 4px; background: transparent; }
      .ex-name:focus { outline: none; border-bottom-color: #1e8a4c; }
      .pr-tag { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 12px; letter-spacing: .06em;
                background: #eaf6ee; color: #1e8a4c; border: 1px solid #bcd9c6; border-radius: 6px; padding: 2px 7px; white-space: nowrap; }
      .prev { font-size: 12.5px; color: #5a6b5f; margin: 2px 0 8px; font-variant-numeric: tabular-nums; }
      .muscle-row { display: flex; align-items: center; gap: 8px; margin: 2px 0 6px; }
      .muscle-chip { font-size: 11.5px; font-weight: 600; color: #1e5a8a; background: #e8f0f7; border: 1px solid #c6d9ea; border-radius: 999px; padding: 2px 9px; }
      .rx-chip { font-size: 11.5px; font-weight: 600; color: #1e8a4c; background: #eaf6ee; border: 1px solid #bcd9c6; border-radius: 999px; padding: 2px 9px; white-space: nowrap; }
      .mini-info { padding: 1px 8px; font-size: 12px; }
      .info-panel { background: #f6f8f5; border: 1px solid #e2e8e1; border-radius: 8px; padding: 9px 10px; margin-bottom: 8px; }
      .info-why { margin: 0 0 8px; font-size: 13px; color: #33413a; }
      .mini-swap { color: #1e5a8a; border-color: #c6d9ea; }
      .swap-muscle { color: #5a6b5f; font-weight: 400; }
      .split-card { margin-bottom: 10px; }
      .split-row { display: flex; justify-content: space-between; gap: 12px; padding: 5px 0; border-top: 1px solid #eef2ed; font-size: 13.5px; flex-wrap: wrap; }
      .split-row:first-of-type { border-top: none; }
      .split-ex { font-weight: 600; }
      .split-muscle { color: #5a6b5f; }
      .prev-none { font-style: italic; }
      .mini-copy { margin-left: 8px; padding: 1px 8px; font-size: 12px; color: #1e8a4c; border-color: #bcd9c6; }
      .sets { display: grid; gap: 6px; }
      .set-row { display: grid; grid-template-columns: 34px 1fr 1fr 30px; gap: 6px; align-items: center; }
      .set-hdr { font-size: 11px; text-transform: uppercase; letter-spacing: .06em; color: #5a6b5f; font-weight: 600; }
      .set-hdr span:nth-child(2), .set-hdr span:nth-child(3) { text-align: center; }
      .set-n { font-family: 'Barlow Condensed'; font-weight: 800; text-align: center; }
      .mini { border: 1px solid #cfd8cf; background: #fff; border-radius: 6px; cursor: pointer; font: inherit; font-size: 13px; padding: 4px 6px; color: #5a6b5f; }
      .mini-add { justify-self: start; padding: 4px 10px; color: #1e8a4c; border-color: #bcd9c6; }
      .mini-del { color: #a13d2d; border-color: #e4c3bb; margin-top: 8px; }
      .log-actions { display: flex; gap: 8px; margin: 6px 0 8px; }

      .log-item { background: #fff; border: 1px solid #dfe6df; border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
      .log-row { display: grid; grid-template-columns: 74px 64px 1fr 20px; gap: 8px; align-items: center;
                 width: 100%; border: none; background: transparent; font: inherit; text-align: left; padding: 11px 12px; cursor: pointer; }
      .log-date { font-weight: 600; font-size: 13px; }
      .badge { font-family: 'Barlow Condensed'; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: .06em;
               border-radius: 6px; padding: 2px 6px; text-align: center; background: #e8ede7; }
      .badge-pull { background: #16211a; color: #fff; }
      .badge-cardio { background: #1e8a4c; color: #fff; }
      .log-sum { font-size: 13px; color: #5a6b5f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .log-chevron { color: #5a6b5f; }
      .log-detail { border-top: 1px solid #eef2ed; padding: 10px 12px; }
      .log-ex { display: flex; justify-content: space-between; gap: 12px; padding: 4px 0; font-size: 13.5px; flex-wrap: wrap; }
      .log-ex-name { font-weight: 600; }
      .log-ex-sets { color: #5a6b5f; font-variant-numeric: tabular-nums; }
      .log-notes { font-style: italic; color: #5a6b5f; font-size: 13px; padding-top: 6px; }

      .chart-wrap { background: #fff; border: 1px solid #dfe6df; border-radius: 12px; padding: 12px 8px 4px; margin-bottom: 14px; }

      .timerbar { position: fixed; bottom: 0; left: 0; right: 0; max-width: 760px; margin: 0 auto;
                  background: #16211a; color: #fff; display: flex; align-items: center; gap: 10px;
                  padding: 12px 16px; border-radius: 14px 14px 0 0; z-index: 50; }
      .timer-lbl { font-family: 'Barlow Condensed'; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; font-size: 13px; }
      .timer-btn { background: transparent; color: #fff; border-color: #445048; }
      .timer-progress { flex: 1; height: 8px; background: #33413a; border-radius: 999px; overflow: hidden; }
      .timer-fill { height: 100%; background: #7ee2a8; border-radius: 999px; transition: width .5s linear; }
      .timer-time { font-family: 'Barlow Condensed'; font-weight: 800; font-size: 24px; font-variant-numeric: tabular-nums; min-width: 58px; text-align: right; }
      .timerbar .mini { background: transparent; color: #fff; border-color: #445048; }

      .ftr { margin-top: 28px; font-size: 12px; color: #8a988e; text-align: center; }

      @media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
      @media (max-width: 480px) {
        .hdr-title { font-size: 26px; }
        .strip-date { font-size: 16px; }
      }
    `}</style>
  );
}
