/* EXPERT KI WORKSHOP · Scroll Choreografie
   Roboter: Naders Spline Figur aus dem Agent Dashboard, gesteuert über @splinetool/runtime.
   Alles, was Nader später ändern will (Kontakt, Szene), steht in CONFIG. */

const CONFIG = {
  // Kopie der Szene aus dem Agent Dashboard (prod.spline.design/kZDDjO5HuC9GJUM2), lokal wegen Datenschutz
  scene: "assets/spline/robot.splinecode",
  // @splinetool/runtime 1.9.46 lokal (assets/spline), Wasm Pfad in runtime.js auf assets/spline umgebogen
  runtime: "./spline/runtime.js",
  instagram: "shutocrew",
  dmUrl: "https://ig.me/m/shutocrew",
};

const BUILDS = [
  ["KI Influencer", "Eine virtuelle Figur, komplett generiert. Mit Charakter Bibel und Autopilot Plan."],
  ["Kanal auf Autopilot", "News Kanal, der seine Videos selbst produziert, plant, postet und auswertet."],
  ["Video jeden Morgen", "Marktdaten rein, fertiges Video raus. Ohne Kamera, ohne Schnitt."],
  ["Agent Dashboard", "21 Agenten, 135 Skills, der Roboter in der Mitte."],
  ["Jarvis", "Sprachsteuerung fürs Dashboard. Lokal und kostenlos."],
  ["Eigenes Browser OS", "Über 70 eigene Apps mit einem Klick. Auch am Handy."],
  ["Datenkette", "Läuft jeden Morgen um 07:30 von selbst und warnt, wenn etwas fehlt."],
  ["Marke in 41 Schritten", "Gastro Konzepte mit Businessplan, Franchise Handbuch und Website."],
  ["Steuer vorbereitet", "Belege und Kontoauszüge sortiert. Fertige Mappe für die Kanzlei."],
  ["Schnitt per KI", "DaVinci Resolve vom Agenten geführt. Color Grading per Messung."],
  ["3D Welten", "Begehbare Läden und 3D Erklärvideos für Kunden."],
  ["Eigene Spiele", "Welt Simulation, Tamagotchi App, Fighter. Ohne Studium."],
];

const POSTER_MODE = new URLSearchParams(location.search).has("poster");
if (POSTER_MODE) document.documentElement.classList.add("poster-mode");

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = matchMedia("(pointer: coarse)").matches;

gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });
if (isTouch) ScrollTrigger.normalizeScroll(false);

/* ---------- Sanftes Scrollen ---------- */

let lenis = null;
if (!reduced && window.Lenis) {
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  window.lenis = lenis;
}

$$("[data-scroll]").forEach((a) =>
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    const target = id === "#top" ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { duration: 1.6 });
    else if (target === 0) window.scrollTo({ top: 0, behavior: "smooth" });
    else target.scrollIntoView({ behavior: "smooth" });
  }),
);

/* ---------- Roboter ---------- */

const wrap = $("#robotWrap");
const canvas = $("#robot");
const R = { x: 0, y: 0, s: 1, op: 1 };
let bot = null;
let app = null;
let baseRot = 0;
let spinTarget = 0;
let spin = 0;
let lastRot = null;

function fitZoom() {
  if (!app) return;
  const w = innerWidth;
  const h = innerHeight;
  // Hochformat zeigt mehr vom Körper, Querformat wie im Dashboard
  app.setZoom(w / h <= 0.8 ? 0.62 : w < 1100 ? 0.78 : 0.9);
}

function capPixelRatio() {
  const real = window.devicePixelRatio || 1;
  const cap = isTouch ? 1.5 : 2;
  if (real <= cap) return;
  try {
    Object.defineProperty(window, "devicePixelRatio", { get: () => cap, configurable: true });
  } catch {
    /* Browser erlaubt es nicht, dann eben volle Auflösung */
  }
}

async function initRobot() {
  capPixelRatio();
  try {
    const { Application } = await import(CONFIG.runtime);
    app = new Application(canvas);
    await app.load(CONFIG.scene);
    if (app.setGlobalEvents) app.setGlobalEvents(true);
    bot = app.findObjectByName("Bot");
    if (bot) baseRot = bot.rotation.y;
    fitZoom();
    // Spline zoomt die Kamera über einige Frames ein, erst danach einblenden (langsame Handys brauchen länger)
    let frames = 0;
    const settle = () => {
      if (++frames < 45) return requestAnimationFrame(settle);
      wrap.classList.add("ready");
      window.__robotReady = true;
    };
    requestAnimationFrame(settle);
  } catch (err) {
    console.warn("Roboter konnte nicht laden, zeige Standbild", err);
    wrap.classList.add("poster");
  }
}
initRobot();
addEventListener("resize", () => fitZoom());

gsap.ticker.add(() => {
  const target = lenis ? lenis.scroll : scrollY;
  robotTrack.time += (target - robotTrack.time) * (1 - Math.pow(0.88, gsap.ticker.deltaRatio()));
  if (robotTrack.tl) robotTrack.tl.time(robotTrack.time, false);
  wrap.style.transform = `translate3d(${R.x}vw, ${R.y}vh, 0) scale(${R.s})`;
  wrap.style.opacity = R.op;
  spin += (spinTarget - spin) * (1 - Math.pow(0.92, gsap.ticker.deltaRatio()));
  if (bot) {
    const r = baseRot + spin;
    if (lastRot === null || Math.abs(r - lastRot) > 0.0004) {
      bot.rotation.y = r;
      lastRot = r;
    }
  }
});

// Eine volle Drehung über die ganze Seite. Am Ende schaut er dich wieder an.
ScrollTrigger.create({
  start: 0,
  end: "max",
  onUpdate: (self) => {
    spinTarget = -self.progress * Math.PI * 2;
    document.documentElement.style.setProperty("--page", self.progress.toFixed(4));
    $(".w-stats")?.style.setProperty("--p", `${12 + self.progress * 76}%`);
  },
});

/* Stationen des Roboters je Abschnitt (x und y in vw/vh).
   Eine Zeitachse in Pixeln statt vieler Einzel Tweens: so stimmt die Position
   auch nach Sprüngen über mehrere Abschnitte (Knopf "Platz anfragen"). */
const robotTrack = { tl: null, time: 0 };
function robotPath(stops, start = { x: 0, y: 0, s: 1, op: 1 }) {
  stops = stops.filter(([trigger]) => $(trigger));
  const marks = stops.map(([trigger, s, e]) => ScrollTrigger.create({ trigger, start: s, end: e }));
  const build = () => {
    const tl = gsap.timeline({ paused: true });
    let prev = { ...start };
    stops.forEach(([, , , to], i) => {
      const a = marks[i].start;
      const b = marks[i].end;
      tl.fromTo(R, { ...prev }, { ...to, ease: "none", duration: Math.max(1, b - a), immediateRender: false }, a);
      prev = { ...prev, ...to };
    });
    robotTrack.tl?.kill();
    Object.assign(R, start);
    robotTrack.tl = tl;
    tl.time(robotTrack.time, false);
  };
  build();
  ScrollTrigger.addEventListener("refresh", build);
  return () => {
    ScrollTrigger.removeEventListener("refresh", build);
    robotTrack.tl?.kill();
    robotTrack.tl = null;
  };
}

/* ---------- Ring der Beweise aufbauen ---------- */

const ring = $("#ring");
BUILDS.forEach(([t, d], i) => {
  const el = document.createElement("article");
  el.className = "rc" + (i % 3 === 1 ? " dark" : "");
  el.innerHTML = `<span class="rc-n">${String(i + 1).padStart(2, "0")}</span><h4>${t}</h4><p>${d}</p>`;
  ring.appendChild(el);
});
const ringCards = $$(".rc", ring);
function layoutRing() {
  const small = innerWidth < 900;
  const cw = small ? 168 : 230;
  const radius = Math.round(((cw + (small ? 18 : 34)) * ringCards.length) / (2 * Math.PI));
  ringCards.forEach((c, i) => {
    c.style.transform = `rotateY(${(i * 360) / ringCards.length}deg) translateZ(${radius}px)`;
  });
}
layoutRing();

/* ---------- Welle im REC Widget ---------- */

const wave = $(".wave");
for (let i = 0; i < 34; i++) {
  const b = document.createElement("i");
  b.style.setProperty("--h", (0.25 + Math.random() * 0.75).toFixed(2));
  b.style.animationDelay = `${(-Math.random() * 1.1).toFixed(2)}s`;
  wave.appendChild(b);
}

/* ---------- Animationen je Bildschirm ---------- */

const mm = gsap.matchMedia();

mm.add({ desk: "(min-width: 900px)", mob: "(max-width: 899px)" }, (ctx) => {
  const { desk } = ctx.conditions;

  /* 1 · Hero: Widgets drehen sich weg, Riesenschrift löst sich auf */
  gsap.set([".w-next", ".w-stats"], { transformPerspective: 900 });
  gsap.from(".w-next", { opacity: 0, rotateY: 40, x: -60, duration: 1.6, ease: "expo.out", delay: 0.3 });
  gsap.from(".w-stats", { opacity: 0, rotateY: -40, x: 60, duration: 1.6, ease: "expo.out", delay: 0.45 });
  gsap.from(".hero-word span", { opacity: 0, y: 60, stagger: 0.12, duration: 1.8, ease: "expo.out" });
  gsap.from(".hero-bottom > *", { opacity: 0, y: 30, stagger: 0.1, duration: 1.2, ease: "expo.out", delay: 0.5 });

  const heroTl = gsap.timeline({ scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: 0.7 } });
  heroTl
    .to(".w-next", { x: desk ? -160 : -60, y: -120, rotateY: -55, rotateX: 18, rotateZ: -8, opacity: 0, ease: "none" }, 0)
    .to(".w-stats", { x: desk ? 160 : 60, y: -60, rotateY: 55, rotateX: -14, rotateZ: 8, opacity: 0, ease: "none" }, 0)
    .to(".hero-bottom", { y: -80, opacity: 0, ease: "none" }, 0)
    .to(".hero-word", { y: -120, scale: 1.12, opacity: 0, letterSpacing: "0.02em", ease: "none" }, 0);

  /* 2 · Ergebnis: Karten drehen sich in den Raum hinein und kippen beim Weiterscrollen */
  $$(".grid .cell").forEach((cell, i) => {
    const card = cell.firstElementChild;
    const col = desk ? i % 3 : i % 2;
    const dir = desk ? col - 1 : col === 0 ? -1 : 1;
    gsap.fromTo(
      card,
      { rotateY: dir * -48, rotateX: 34, y: 160, z: -220, opacity: 0, transformPerspective: 1200 },
      { rotateY: 0, rotateX: 0, y: 0, z: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: cell, start: "top 100%", end: "top 58%", scrub: 0.8 } },
    );
    gsap.to(cell, { rotateY: dir * 10, rotateX: -10, y: -40, ease: "none", scrollTrigger: { trigger: cell, start: "top 40%", end: "bottom top", scrub: 0.8 } });
  });
  gsap.fromTo(".bar i", { "--bar": "0%" }, { "--bar": "100%", ease: "none", scrollTrigger: { trigger: ".bar", start: "top 90%", end: "top 45%", scrub: 0.6 } });

  /* 3 · Vier Akte */
  const track = $(".acts-track");
  const acts = $$(".act");
  if (desk) {
    const pad = () => Math.max(24, (innerWidth - acts[0].offsetWidth) / 2);
    const setPad = () => { track.style.paddingLeft = track.style.paddingRight = `${pad()}px`; };
    setPad();
    ScrollTrigger.addEventListener("refreshInit", setPad);
    const dist = () => track.scrollWidth - innerWidth;
    const hTween = gsap.to(track, {
      x: () => -dist(),
      ease: "none",
      scrollTrigger: { trigger: ".acts", start: "top top", end: () => `+=${dist() * 1.15}`, pin: true, scrub: 0.8, invalidateOnRefresh: true },
    });
    gsap.set(acts, { transformPerspective: 1400 });
    acts.forEach((card) => {
      gsap.fromTo(card, { rotateY: -46, z: -160, opacity: 0.45 }, { rotateY: 0, z: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: card, containerAnimation: hTween, start: "left right", end: "center center", scrub: true } });
      gsap.fromTo(card, { rotateY: 0, z: 0, opacity: 1 }, { rotateY: 46, z: -160, opacity: 0.45, ease: "none", immediateRender: false, scrollTrigger: { trigger: card, containerAnimation: hTween, start: "center center", end: "right left", scrub: true } });
      gsap.fromTo($("img", card), { xPercent: -5 }, { xPercent: 5, ease: "none", scrollTrigger: { trigger: card, containerAnimation: hTween, start: "left right", end: "right left", scrub: true } });
    });
    ctx.add(() => ScrollTrigger.removeEventListener("refreshInit", setPad));
  } else {
    track.style.paddingLeft = track.style.paddingRight = "";
    acts.forEach((card) => {
      gsap.fromTo(card, { rotateX: 28, y: 90, opacity: 0.25, transformPerspective: 1100, transformOrigin: "50% 100%" }, { rotateX: 0, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: card, start: "top 100%", end: "top 55%", scrub: 0.7 } });
    });
  }

  /* 4 · Park: Bild öffnet sich, Timer läuft mit dem Scrollen */
  const rad = desk ? 88 : 36;
  gsap.fromTo(".park-frame", { clipPath: `inset(7% 9% 7% 9% round ${rad + 30}px)` }, { clipPath: `inset(0% 0% 0% 0% round ${rad}px)`, ease: "none", scrollTrigger: { trigger: ".park", start: "top 95%", end: "top 15%", scrub: 0.7 } });
  gsap.fromTo(".park-img", { scale: 1.32 }, { scale: 1.04, ease: "none", scrollTrigger: { trigger: ".park", start: "top bottom", end: "bottom top", scrub: 0.7 } });
  gsap.fromTo(".rec", { rotateY: -40, rotateX: 18, y: 80, opacity: 0, transformPerspective: 900 }, { rotateY: 8, rotateX: -4, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".park", start: "top 70%", end: "center 55%", scrub: 0.8 } });
  gsap.fromTo(".park-copy > *", { y: 60, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, ease: "none", scrollTrigger: { trigger: ".park", start: "top 60%", end: "center 60%", scrub: 0.8 } });
  const recTime = $("#recTime");
  ScrollTrigger.create({
    trigger: ".park",
    start: "top 70%",
    end: "bottom 30%",
    onUpdate: (s) => {
      const sec = Math.round(s.progress * 3600);
      recTime.textContent = `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
    },
  });

  /* 5 · Beweise: der Ring dreht sich um den Roboter */
  layoutRing();
  const ringRot = { y: 18 };
  const applyRing = () => {
    ring.style.transform = `rotateX(${desk ? -7 : -9}deg) rotateY(${ringRot.y}deg)`;
    ringCards.forEach((c, i) => {
      const facing = Math.cos((((i * 360) / ringCards.length + ringRot.y) * Math.PI) / 180);
      c.style.visibility = facing > 0.08 ? "visible" : "hidden";
      c.style.opacity = facing > 0.08 ? (0.3 + 0.7 * facing).toFixed(3) : "0";
    });
  };
  applyRing();
  gsap.to(ringRot, {
    y: -312,
    ease: "none",
    onUpdate: applyRing,
    scrollTrigger: { trigger: ".proof-pin", start: "top top", end: desk ? "+=170%" : "+=150%", pin: true, scrub: 1 },
  });
  gsap.from(".ring-stage", { scale: 0.6, opacity: 0, ease: "none", scrollTrigger: { trigger: ".proof", start: "top 85%", end: "top 20%", scrub: 0.8 } });
  gsap.from(".about-card", { rotateX: 24, y: 100, opacity: 0, transformPerspective: 1200, ease: "none", scrollTrigger: { trigger: ".about", start: "top 95%", end: "top 50%", scrub: 0.8 } });

  /* 5b · Referenzen: Karten stapeln sich, die Fenster drehen sich mit */
  const refs = $$(".ref");
  refs.forEach((card, i) => {
    $$(".win", card).forEach((w, k) => {
      gsap.fromTo(
        w,
        { rotateY: desk ? -18 + k * 9 : -12, rotateX: 8, z: -70 },
        { rotateY: desk ? 10 - k * 6 : 6, rotateX: -3, z: 0, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: desk ? "top 10%" : "bottom 30%", scrub: 0.8 } },
      );
    });
    if (desk && i < refs.length - 1) {
      gsap.to(card, { scale: 0.9, rotateX: 5, opacity: 0.3, transformPerspective: 1600, ease: "none", scrollTrigger: { trigger: refs[i + 1], start: "top bottom", end: "top 14%", scrub: 0.6 } });
    }
    if (!desk) {
      gsap.fromTo(card, { rotateX: 22, y: 80, opacity: 0.3, transformPerspective: 1100, transformOrigin: "50% 100%" }, { rotateX: 0, y: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: card, start: "top 100%", end: "top 55%", scrub: 0.7 } });
    }
  });

  /* 6 · Anfragen */
  gsap.fromTo(".facts", { rotateY: 30, x: -60, opacity: 0, transformPerspective: 1200 }, { rotateY: 0, x: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".apply-grid", start: "top 95%", end: "top 50%", scrub: 0.8 } });
  gsap.fromTo(".apply-form", { rotateY: -30, x: 60, opacity: 0, transformPerspective: 1200 }, { rotateY: 0, x: 0, opacity: 1, ease: "none", scrollTrigger: { trigger: ".apply-grid", start: "top 90%", end: "top 45%", scrub: 0.8 } });

  /* Abschnittsköpfe */
  $$(".sec-head").forEach((h) => {
    if (h.closest(".acts") && desk) return;
    gsap.from(h.children, { y: 50, opacity: 0, stagger: 0.08, ease: "none", scrollTrigger: { trigger: h, start: "top 92%", end: "top 60%", scrub: 0.8 } });
  });

  /* Wege des Roboters: [Auslöser, Start, Ende, Ziel] */
  return robotPath(
    desk
      ? [
          [".outcome", "top bottom", "top 15%", { x: 25, y: 4, s: 0.74, op: 1 }],
          [".acts", "top 90%", "top top", { x: 0, y: 30, s: 0.58, op: 0.55 }],
          [".park", "top 85%", "top 20%", { x: -6, y: -20, s: 0.46, op: 0 }],
          [".proof", "top 95%", "top top", { x: 0, y: 17, s: 0.8, op: 1 }],
          [".about", "top 85%", "top 25%", { x: 30, y: 4, s: 0.7, op: 0.95 }],
          [".refs", "top 85%", "top 20%", { x: 30, y: 8, s: 0.8, op: 0.5 }],
          [".apply", "top 85%", "top 10%", { x: -27, y: 8, s: 0.76, op: 1 }],
        ]
      : [
          [".outcome", "top bottom", "top 20%", { x: 0, y: 6, s: 0.86, op: 0.55 }],
          [".acts", "top 90%", "top 30%", { x: 0, y: 10, s: 0.7, op: 0.14 }],
          [".park", "top 85%", "top 25%", { x: 0, y: -10, s: 0.6, op: 0 }],
          [".proof", "top 95%", "top top", { x: 0, y: 20, s: 0.74, op: 1 }],
          [".about", "top 85%", "top 30%", { x: 0, y: 4, s: 0.8, op: 0.3 }],
          [".refs", "top 85%", "top 30%", { x: 0, y: 6, s: 0.8, op: 0.12 }],
          [".apply", "top 85%", "top 20%", { x: 0, y: 10, s: 0.8, op: 0.14 }],
        ],
    desk ? undefined : { x: 0, y: -7, s: 0.9, op: 1 },
  );
});

/* ---------- Navigation: Nebel erst nach dem Hero ---------- */

const nav = $("#nav");
ScrollTrigger.create({ start: 0, end: "max", onUpdate: (self) => nav.classList.toggle("scrolled", self.scroll() > innerHeight * 0.6) });

/* ---------- Zähler ---------- */

$$("[data-count]").forEach((el) => {
  const end = +el.dataset.count;
  const suffix = el.dataset.suffix || "";
  const o = { v: 0 };
  ScrollTrigger.create({
    trigger: ".stats",
    start: "top 92%",
    once: true,
    onEnter: () => gsap.to(o, { v: end, duration: 1.8, ease: "power3.out", onUpdate: () => { el.textContent = Math.round(o.v) + suffix; } }),
  });
});

/* ---------- Aktiver Menüpunkt ---------- */

["ergebnis", "akte", "park", "beweise", "referenzen"].forEach((id) => {
  const link = $(`.nav-links a[href="#${id}"]`);
  ScrollTrigger.create({ trigger: `#${id}`, start: "top 55%", end: "bottom 45%", toggleClass: { targets: link, className: "on" } });
});

/* ---------- Anfrage Formular ---------- */

const toast = $("#toast");
let toastTimer = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 5200);
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  fallbackCopy(text);
  return Promise.resolve();
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.cssText = "position:fixed;opacity:0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch { /* nichts */ }
  ta.remove();
}

$("#applyForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.currentTarget;
  const fields = ["name", "job", "wish"].map((n) => f.elements[n]);
  let ok = true;
  fields.forEach((el) => {
    const bad = !el.value.trim();
    el.classList.toggle("err", bad);
    if (bad) ok = false;
  });
  if (!ok) {
    showToast("Bitte alle drei Felder ausfüllen.");
    return;
  }
  const [name, job, wish] = fields.map((el) => el.value.trim());
  const msg = `Hi Nader, ich möchte einen Platz im EXPERT KI WORKSHOP anfragen.\n\nName: ${name}\nIch mache: ${job}\nMein Agent soll mir abnehmen: ${wish}`;
  copyText(msg);
  window.open(CONFIG.dmUrl, "_blank", "noopener");
  showToast("Text kopiert. Instagram öffnet sich, einfach einfügen und senden.");
});

/* Nach dem Laden der Bilder Positionen neu berechnen */
addEventListener("load", () => ScrollTrigger.refresh());
