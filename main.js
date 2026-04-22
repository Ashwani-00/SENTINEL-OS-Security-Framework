/* ── MODULE LOADER ── */
async function loadModules() {
  const modules = [
    { id: 'hero-placeholder', file: 'hero.html' },
    { id: 'threats-placeholder', file: 'threats.html' },
    { id: 'simulator-placeholder', file: 'simulator.html' },
    { id: 'mitigations-placeholder', file: 'mitigations.html' },
    { id: 'monitor-placeholder', file: 'monitor.html' }
  ];

  // Load all HTML fragments in parallel
  await Promise.all(modules.map(async (module) => {
    try {
      const response = await fetch(module.file);
      const html = await response.text();
      const el = document.getElementById(module.id);
      if (el) el.innerHTML = html;
    } catch (err) {
      console.error(`Failed to load ${module.file}:`, err);
    }
  }));

  // CRITICAL: Initialize logic ONLY after fragments are in the DOM
  initTicker(); 
  initObservers();
  initFeed();
  
  // Set default simulator state
  const firstOption = document.querySelector('.sim-option');
  if (firstOption) selectVuln(firstOption);
}

window.addEventListener('DOMContentLoaded', loadModules);

/* ── MATRIX BACKGROUND ── */
(function() {
  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, cols, drops;
  const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF0123456789<>{}[]';
  
  function init() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
    cols = Math.floor(W/16);
    drops = Array(cols).fill(1);
  }
  
  function draw() {
    ctx.fillStyle = 'rgba(2,6,8,0.05)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#00e5ff';
    ctx.font = '14px Share Tech Mono';
    drops.forEach((y, i) => {
      const ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * 16, y * 16);
      if(y * 16 > H && Math.random() > .97) drops[i] = 0;
      drops[i]++;
    });
  }
  init();
  window.addEventListener('resize', init);
  setInterval(draw, 60);
})();

/* ── SCROLL & COUNT OBSERVERS ── */
function initObservers() {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.1 });

  document.querySelectorAll('.reveal, .reveal-left').forEach(el => revealObserver.observe(el));

  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if(e.isIntersecting && !e.target.dataset.done){
        e.target.dataset.done = 1;
        animateCount(e.target);
      }
    });
  }, { threshold: 0.5 });

  document.querySelectorAll('.count-up').forEach(el => countObserver.observe(el));
}

function animateCount(el) {
  const target = +el.dataset.target;
  const dur = 1600;
  const start = performance.now();
  function frame(now){
    const p = Math.min((now - start) / dur, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target);
    if(p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ── TICKER ── */
const tickerMsgs = [
  'BUFFER OVERFLOW DETECTED — MITIGATED',
  'STACK CANARY VIOLATION — PROCESS TERMINATED',
  'DNS CACHE POISONING ATTEMPT BLOCKED',
  'ROP GADGET CHAIN DETECTED — CFI VIOLATION',
  'BINARY INTEGRITY CHECK FAILED — ROLLBACK INITIATED',
  'TOCTOU RACE CONDITION — INOTIFY ALERT'
];

function initTicker() {
  const tickerEl = document.getElementById('ticker-inner');
  if (!tickerEl) return;
  const full = [...tickerMsgs, ...tickerMsgs].map(m => `<span class="ticker-item">${m}</span>`).join('');
  tickerEl.innerHTML = full + full;
}

/* ── SIMULATOR DATA ── */
const simData = {
  buffer:{
    steps:[
      {t:'cmd', m:'$ sentinel --simulate buffer-overflow --target heap_alloc'},
      {t:'muted', m:'[*] Initialising fuzzing engine with cyclic De Bruijn sequence...'},
      {t:'muted', m:'[*] Probing input boundary at offset 0x00–0xFF...'},
      {t:'warn', m:'[!] Boundary exceeded at offset 0x48 — EIP overwrite at 0x7ffe8b2c'},
      {t:'muted', m:'[*] Constructing payload: NOP sled (128b) + shellcode + ret addr'},
      {t:'err',  m:'[ATTACK] Injecting crafted buffer — targeting saved return address...'},
      {t:'ok',   m:'[DETECT] Stack canary mismatch — SIGSEGV raised before ret executes'},
      {t:'ok',   m:'[MITIGATE] Process terminated; core dump saved; ASLR re-randomised'},
      {t:'ok',   m:'[STATUS] Threat neutralised. Severity: CRITICAL | Response: 8ms'},
    ]
  },
  trapdoor:{
    steps:[
      {t:'cmd', m:'$ sentinel --simulate trapdoor --target /usr/lib/auth.so'},
      {t:'muted', m:'[*] Running entropy analysis on binary section .data...'},
      {t:'muted', m:'[*] Disassembling authentication routine at 0x401080...'},
      {t:'warn', m:'[!] Hardcoded credential string found at offset 0x12f4: "s3cr3t_b4ckd00r"'},
      {t:'err',  m:'[ATTACK] Triggering bypass branch with magic sequence...'},
      {t:'ok',   m:'[DETECT] Code signature mismatch — hash divergence in .text section'},
      {t:'ok',   m:'[DETECT] IDS flagged anomalous auth success without valid credential'},
      {t:'ok',   m:'[MITIGATE] Binary replaced from verified snapshot; session invalidated'},
      {t:'ok',   m:'[STATUS] Threat neutralised. Severity: CRITICAL | Response: 5ms'},
    ]
  },
  cache:{
    steps:[
      {t:'cmd', m:'$ sentinel --simulate cache-poisoning --target dns-resolver'},
      {t:'muted', m:'[*] Monitoring DNS resolver traffic on UDP/53...'},
      {t:'muted', m:'[*] Analysing source port entropy — low entropy detected (range: 40000-40100)'},
      {t:'warn', m:'[!] Forged response flood initiated — transaction ID prediction attack'},
      {t:'err',  m:'[ATTACK] Injecting malicious A-record for target.example.com...'},
      {t:'ok',   m:'[DETECT] DNSSEC validation failed — signature mismatch on injected record'},
      {t:'ok',   m:'[DETECT] TTL anomaly: 60s vs expected 3600s — cache alert triggered'},
      {t:'ok',   m:'[MITIGATE] Cache flushed; DNSSEC enforced; source port randomised'},
      {t:'ok',   m:'[STATUS] Threat neutralised. Severity: HIGH | Response: 11ms'},
    ]
  },
  rop:{
    steps:[
      {t:'cmd', m:'$ sentinel --simulate rop-chain --target libc-2.35'},
      {t:'muted', m:'[*] Scanning binary and libc-2.35 for ROP gadgets...'},
      {t:'muted', m:'[*] Found 1,842 gadgets — building pivot → pop rdi → system chain'},
      {t:'warn', m:'[!] Stack pivot gadget at 0x401250; system@libc at 0x7f8c3b2a1d50'},
      {t:'err',  m:'[ATTACK] Overwriting return address with gadget chain start...'},
      {t:'ok',   m:'[DETECT] Shadow stack (CET) mismatch — return address divergence'},
      {t:'ok',   m:'[DETECT] CFI violation raised — indirect call target not in allowlist'},
      {t:'ok',   m:'[MITIGATE] Process killed; CFI policy logged; overflow source patched'},
      {t:'ok',   m:'[STATUS] Threat neutralised. Severity: CRITICAL | Response: 3ms'},
    ]
  },
  race:{
    steps:[
      {t:'cmd', m:'$ sentinel --simulate toctou --target /usr/bin/setuid-helper'},
      {t:'muted', m:'[*] Identifying privileged check-then-use operations...'},
      {t:'muted', m:'[*] Spawning race thread: symlink swap loop at 1000 iter/sec'},
      {t:'warn', m:'[!] os.access() passes on benign /tmp/legit — swap window open'},
      {t:'err',  m:'[ATTACK] Symlink swapped to /etc/shadow before open() call...'},
      {t:'ok',   m:'[DETECT] inotify watcher: unexpected symlink change during operation'},
      {t:'ok',   m:'[DETECT] Audit log: open() target diverges from access() target'},
      {t:'ok',   m:'[MITIGATE] Operation rolled back; mutex lock retrofitted on check-use'},
      {t:'ok',   m:'[STATUS] Threat neutralised. Severity: HIGH | Response: 14ms'},
    ]
  }
};

/* ── SIMULATOR ACTIONS ── */
let currentVuln = 'buffer';
let simRunning = false;

// Expose to window so HTML onclick can find it
window.selectVuln = function(el) {
  if (simRunning) return;
  document.querySelectorAll('.sim-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  currentVuln = el.dataset.vuln;
  document.getElementById('terminal-output').innerHTML = '';
  const btn = document.getElementById('run-btn');
  btn.classList.remove('running');
  btn.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg> RUN SIMULATION';
};

window.runAttack = async function() {
  if (simRunning) return;
  simRunning = true;
  const btn = document.getElementById('run-btn');
  btn.classList.add('running');
  btn.textContent = 'RUNNING…';
  
  const out = document.getElementById('terminal-output');
  out.innerHTML = '';
  
  const steps = simData[currentVuln].steps;
  for (let i = 0; i < steps.length; i++) {
    await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
    const div = document.createElement('div');
    div.className = 't-line ' + steps[i].t;
    div.textContent = steps[i].m;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;

    if (steps[i].t === 'ok' && steps[i].m.includes('STATUS')) {
      pushFeedEvent(steps[i].m, currentVuln);
    }
  }
  
  btn.classList.remove('running');
  btn.innerHTML = '<svg viewBox="0 0 16 16" fill="currentColor"><polygon points="3,1 14,8 3,15"/></svg> RUN AGAIN';
  simRunning = false;
};

/* ── LIVE FEED ── */
let feedCount = 0;
const feedList = document.getElementById('feed-list');
const feedItems = [];

const initEvents = [
  {sev:'info', msg:'SENTINEL framework initialised — all detection modules online', status:'NOMINAL'},
  {sev:'info', msg:'ASLR enabled on all 847 monitored processes', status:'NOMINAL'},
  {sev:'high', msg:'Unusual syscall pattern from PID 3812 — sched_setscheduler abuse', status:'BLOCKED'},
  {sev:'info', msg:'Scheduled kernel integrity scan completed — no anomalies found', status:'CLEAN'},
];

function pushFeedEvent(msg, vuln){
  const sevMap = {buffer:'crit',trapdoor:'crit',cache:'high',rop:'crit',race:'high'};
  addFeedRow(sevMap[vuln]||'high', msg.replace('[STATUS] ','').replace('Threat neutralised. ',''), 'MITIGATED');
}

function addFeedRow(sev, msg, status){
  feedCount++;
  document.getElementById('feed-count').textContent = feedCount;
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
  const row = document.createElement('div');
  row.className = 'feed-item';
  row.innerHTML = `
    <span class="feed-time">${time}</span>
    <span class="feed-sev ${sev}">${sev.toUpperCase()}</span>
    <span class="feed-msg">${msg}</span>
    <span class="feed-status">${status}</span>
  `;
  feedList.insertBefore(row, feedList.firstChild);
  feedItems.unshift({sev,msg,status,time});
  if(feedItems.length > 20){
    feedList.removeChild(feedList.lastChild);
  }
}

// init feed
initEvents.forEach((e,i)=>{
  setTimeout(()=>addFeedRow(e.sev, e.msg, e.status), 800 + i*600);
});

// auto-inject events
const autoEvents = [
  {sev:'info', msg:'ASLR re-randomisation cycle completed', status:'NOMINAL'},
  {sev:'high', msg:'Heap spray pattern detected in sandboxed process', status:'BLOCKED'},
  {sev:'info', msg:'Binary integrity scan: 2,841 modules verified', status:'CLEAN'},
  {sev:'crit', msg:'Privilege escalation via setuid binary — blocked by MAC policy', status:'BLOCKED'},
  {sev:'high', msg:'Format string vulnerability probe in syslogd — quarantined', status:'BLOCKED'},
  {sev:'info', msg:'Network egress anomaly resolved — false positive confirmed', status:'NOMINAL'},
];
let autoIdx = 0;
setInterval(()=>{
  const e = autoEvents[autoIdx % autoEvents.length];
  addFeedRow(e.sev, e.msg, e.status);
  autoIdx++;
}, 7000);

