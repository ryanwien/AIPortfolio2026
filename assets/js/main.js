/* ============================================================
   Wien Field Station — boot, rain, reveals, station terminal
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- boot sequence ---------------- */

  var boot = document.getElementById('boot');
  var bootText = document.getElementById('boot-text');

  function endBoot() {
    if (!boot || boot.classList.contains('is-done')) return;
    boot.classList.add('is-done');
    try { sessionStorage.setItem('wfs-booted', '1'); } catch (e) {}
    setTimeout(function () { if (boot.parentNode) boot.parentNode.removeChild(boot); }, 600);
  }

  var alreadyBooted = false;
  try { alreadyBooted = sessionStorage.getItem('wfs-booted') === '1'; } catch (e) {}

  if (!boot) {
    /* nothing to do */
  } else if (reduced || alreadyBooted) {
    boot.classList.add('is-done');
    if (boot.parentNode) boot.parentNode.removeChild(boot);
  } else {
    var bootLines = [
      'wien field station — perimeter control',
      'checking enclosure power ......... <b>OK</b>',
      'eval harness .................... <b>ARMED</b>',
      'five specimens .................. <b>CONTAINED</b>',
      '',
      'welcome, visitor.'
    ];
    var bi = 0;
    var bootTimer = setInterval(function () {
      bootText.innerHTML += bootLines[bi] + '\n';
      bi++;
      if (bi >= bootLines.length) {
        clearInterval(bootTimer);
        setTimeout(endBoot, 420);
      }
    }, 190);
    ['click', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, function once() {
        clearInterval(bootTimer);
        endBoot();
        window.removeEventListener(ev, once);
      }, { once: true, passive: true });
    });
    setTimeout(function () { clearInterval(bootTimer); endBoot(); }, 3000);
  }

  /* ---------------- rain canvas ---------------- */

  var canvas = document.getElementById('rain');
  if (canvas && !reduced) {
    var ctx = canvas.getContext('2d');
    var drops = [];
    var w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true, raf = null;

    function size() {
      var r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var count = Math.min(320, Math.round(w * h / 5200));
      drops = [];
      for (var i = 0; i < count; i++) {
        drops.push({
          x: Math.random() * w,
          y: Math.random() * h,
          len: 12 + Math.random() * 26,
          vy: 7 + Math.random() * 11,
          a: 0.12 + Math.random() * 0.4
        });
      }
    }

    var SLANT = 0.22; /* matches the floodlight angle in the plate */

    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      for (var i = 0; i < drops.length; i++) {
        var d = drops[i];
        ctx.strokeStyle = 'rgba(206,224,212,' + d.a + ')';
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.len * SLANT, d.y + d.len);
        ctx.stroke();
        d.y += d.vy;
        d.x += d.vy * SLANT;
        if (d.y > h) { d.y = -d.len; d.x = Math.random() * w; }
      }
      raf = requestAnimationFrame(frame);
    }

    size();
    frame();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(size, 180);
    });

    /* stop drawing once the hero has scrolled away */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting && !running) { running = true; frame(); }
          else if (!e.isIntersecting && running) { running = false; if (raf) cancelAnimationFrame(raf); }
        });
      }, { threshold: 0 }).observe(canvas);
    }
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; if (raf) cancelAnimationFrame(raf); }
      else if (!running) { running = true; frame(); }
    });
  }

  /* ---------------- scroll reveals ---------------- */

  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    Array.prototype.forEach.call(reveals, function (el) { io.observe(el); });
  } else {
    Array.prototype.forEach.call(reveals, function (el) { el.classList.add('is-in'); });
  }

  /* ---------------- station terminal ---------------- */

  var screen = document.getElementById('term-screen');
  var form = document.getElementById('term-form');
  var input = document.getElementById('term-input');
  if (!screen || !form || !input) return;

  var GH = 'https://github.com/ryanwien/Portfolio/tree/main/';
  var DOSSIER = 'specimens/';

  var SPECIMENS = [
    {
      n: '01', slug: 'eval-first-agent', cls: 'apex', status: 'HARNESS ARMED',
      proves: 'The eval harness is the product; the agent is what gets measured.',
      metric: 'pass@1 / pass@3, cost per solved task, p50 & p95 latency',
      limit: 'Ships with placeholder cases — swap in real domain tasks.',
      stack: 'Python, tool-calling, custom eval harness'
    },
    {
      n: '02', slug: 'transformer-from-scratch', cls: 'structural', status: 'TRAINED END TO END',
      proves: 'A GPT-style decoder by hand — attention, masking, training loop.',
      metric: 'loss 3.38 -> 1.93, ~0.5M params, converged on CPU',
      limit: 'No KV-cache, so generation is O(n^2) per step.',
      stack: 'PyTorch, no nn.Transformer'
    },
    {
      n: '03', slug: 'text-classification', cls: 'docile', status: 'PIPELINE VERIFIED',
      proves: 'Three baselines with real error analysis, not just an accuracy number.',
      metric: 'macro-F1 beside accuracy, per-class precision & recall, confusion matrix',
      limit: 'Bag-of-words ignores order — "not good" and "good" look alike.',
      stack: 'scikit-learn, TF-IDF'
    },
    {
      n: '04', slug: 'extraction-benchmark', cls: 'methodology', status: 'RUNNER SCORING',
      proves: 'A benchmark whose credibility comes from method, not from a high score.',
      metric: 'regex baseline 0.80 field F1 — the floor every model must beat',
      limit: 'Three illustrative examples; needs 50+ hand-labelled cases.',
      stack: 'Python, multi-model scoring'
    },
    {
      n: '05', slug: 'stock-forecasting', cls: 'volatile', status: 'VERIFIED ON SYNTHETIC',
      proves: 'Time-series ML without lookahead, leakage, or a flattering metric.',
      metric: 'directional accuracy + long/flat backtest vs. buy-and-hold',
      limit: 'Expect ~0.5 directional accuracy. Anything near 0.7 has a leak.',
      stack: 'PyTorch LSTM, yfinance'
    }
  ];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function print(html, cls) {
    var p = document.createElement('p');
    p.className = 'term__line' + (cls ? ' ' + cls : '');
    p.innerHTML = html;
    screen.appendChild(p);
    screen.scrollTop = screen.scrollHeight;
  }

  function blank() { print('&nbsp;'); }

  function findSpecimen(arg) {
    if (!arg) return null;
    var a = arg.toLowerCase().replace(/^sp-?/, '').replace(/\/$/, '');
    for (var i = 0; i < SPECIMENS.length; i++) {
      var s = SPECIMENS[i];
      if (s.slug === a || s.n === a || String(parseInt(s.n, 10)) === a) return s;
    }
    return null;
  }

  var COMMANDS = {
    help: function () {
      print('<span class="t-amber">Available commands</span>');
      blank();
      print('  <span class="t-bone">ls</span>          list the five specimens');
      print('  <span class="t-bone">status</span>      containment log — what has actually been run');
      print('  <span class="t-bone">cat</span> &lt;id&gt;    full record for one specimen (e.g. <span class="t-dim">cat 02</span>)');
      print('  <span class="t-bone">open</span> &lt;id&gt;   open that specimen&rsquo;s full dossier page');
      print('  <span class="t-bone">code</span> &lt;id&gt;   open that repo on GitHub');
      print('  <span class="t-bone">limits</span>      every documented limitation, in one place');
      print('  <span class="t-bone">protocols</span>   the five station protocols');
      print('  <span class="t-bone">whoami</span>      who runs this station');
      print('  <span class="t-bone">contact</span>     email and profiles');
      print('  <span class="t-bone">clear</span>       wipe the screen');
    },

    ls: function () {
      print('<span class="t-dim">ID     CLASS         SPECIMEN                     STATUS</span>');
      SPECIMENS.forEach(function (s) {
        print(
          'SP-' + s.n + '  <span class="t-dim">' + pad(s.cls, 12) + '</span>  ' +
          '<span class="t-bone">' + pad(s.slug, 26) + '</span>  ' +
          '<span class="t-amber">' + s.status + '</span>'
        );
      });
      blank();
      print('<span class="t-dim">5 specimens. `cat &lt;id&gt;` for a full record.</span>');
    },

    status: function () {
      print('<span class="t-amber">CONTAINMENT LOG</span>');
      blank();
      print('  [<span class="t-bone">OK</span>]   transformer-from-scratch .. trained, loss 3.38 -&gt; 1.93');
      print('  [<span class="t-bone">OK</span>]   text-classification ....... pipeline + confusion matrix + errors');
      print('  [<span class="t-bone">OK</span>]   extraction-benchmark ...... runner + scoring, regex 0.80 F1');
      print('  [<span class="t-amber">--</span>]   stock-forecasting ......... verified on synthetic; live via yfinance');
      print('  [<span class="t-amber">--</span>]   eval-first-agent .......... harness wired; awaiting a provider');
      blank();
      print('<span class="t-dim">Green is verified end to end. Amber is wired but waiting on something external.</span>');
    },

    cat: function (arg) {
      var s = findSpecimen(arg);
      if (!s) {
        print('<span class="t-red">No specimen matches "' + esc(arg || '') + '".</span> Try <span class="t-bone">ls</span>.');
        return;
      }
      print('<span class="t-amber">SP-' + s.n + ' — ' + s.slug + '</span>');
      print('<span class="t-dim">containment class: ' + s.cls + ' | status: ' + s.status + '</span>');
      blank();
      print('  <span class="t-dim">proves  </span> ' + esc(s.proves));
      print('  <span class="t-dim">measured</span> ' + esc(s.metric));
      print('  <span class="t-dim">stack   </span> ' + esc(s.stack));
      print('  <span class="t-dim">limit   </span> <span class="t-red">' + esc(s.limit) + '</span>');
      blank();
      print('  <a href="' + DOSSIER + s.slug + '/index.html">full dossier &rarr;</a>   <a href="' + GH + s.slug + '">code on github &rarr;</a>');
    },

    open: function (arg) {
      var s = findSpecimen(arg);
      if (!s) {
        print('<span class="t-red">Usage:</span> open &lt;id&gt; — e.g. <span class="t-bone">open 02</span> or <span class="t-bone">open stock-forecasting</span>');
        return;
      }
      print('Opening the <span class="t-bone">' + s.slug + '</span> dossier …');
      window.location.href = DOSSIER + s.slug + '/index.html';
    },

    code: function (arg) {
      var s = findSpecimen(arg);
      if (!s) {
        print('<span class="t-red">Usage:</span> code &lt;id&gt; — e.g. <span class="t-bone">code 04</span>');
        return;
      }
      print('Opening <span class="t-bone">' + s.slug + '</span> on GitHub …');
      window.open(GH + s.slug, '_blank', 'noopener');
    },

    limits: function () {
      print('<span class="t-amber">DOCUMENTED LIMITATIONS</span> <span class="t-dim">— printed at the same size as the results</span>');
      blank();
      SPECIMENS.forEach(function (s) {
        print('  <span class="t-bone">' + s.slug + '</span>');
        print('  <span class="t-red">' + esc(s.limit) + '</span>');
        blank();
      });
    },

    protocols: function () {
      print('<span class="t-amber">STATION PROTOCOLS</span>');
      blank();
      print('  01  Reproducible — pinned deps, deterministic seeds, one command.');
      print('  02  Results are versioned artifacts, never a screenshot.');
      print('  03  Every README ends with limitations, then what I would do next.');
      print('  04  No secrets in any repo; keys read from the environment.');
      print('  05  Measurement over demos. If it cannot be measured, it does not ship.');
    },

    whoami: function () {
      print('<span class="t-bone">Ryan Wien</span> — builds AI systems and, more to the point, measures them.');
      blank();
      print('Focused on the unglamorous half of the field: knowing when a model is');
      print('actually working. Demos are easy; trustworthy systems are not.');
      blank();
      print('<span class="t-dim">Try `ls`, `status`, or `limits`.</span>');
    },

    contact: function () {
      print('  <span class="t-dim">email   </span> <a href="mailto:ryanwien3d@gmail.com">ryanwien3d@gmail.com</a>');
      print('  <span class="t-dim">linkedin</span> <a href="https://www.linkedin.com/in/ryanwien3d/">linkedin.com/in/ryanwien3d</a>');
      print('  <span class="t-dim">github  </span> <a href="https://github.com/ryanwien">github.com/ryanwien</a>');
    },

    clear: function () { screen.innerHTML = ''; }
  };

  function pad(s, n) {
    s = String(s);
    while (s.length < n) s += ' ';
    return s;
  }

  function run(raw) {
    var line = raw.trim();
    print('<span class="t-dim">station@wien:~$</span> ' + esc(line));
    if (!line) return;

    var parts = line.split(/\s+/);
    var cmd = parts[0].toLowerCase();
    var arg = parts.slice(1).join(' ');

    if (COMMANDS.hasOwnProperty(cmd)) {
      COMMANDS[cmd](arg);
    } else if (cmd === 'sudo') {
      print('<span class="t-red">Visitor credentials.</span> Nothing here is behind a password anyway — that is rather the point.');
    } else if (cmd === 'rm' || cmd === 'del') {
      print('<span class="t-red">Denied.</span> Results are versioned artifacts (protocol 02).');
    } else {
      print('<span class="t-red">Unknown command:</span> ' + esc(cmd) + '. Type <span class="t-bone">help</span>.');
    }
    blank();
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    run(input.value);
    input.value = '';
  });

  /* command history */
  var history = [], hIndex = -1;
  input.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      hIndex = hIndex < 0 ? history.length - 1 : Math.max(0, hIndex - 1);
      input.value = history[hIndex];
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIndex < 0) return;
      hIndex++;
      if (hIndex >= history.length) { hIndex = -1; input.value = ''; }
      else input.value = history[hIndex];
    }
  });
  form.addEventListener('submit', function () {
    var v = input.value;
    if (v && v.trim()) { history.push(v.trim()); hIndex = -1; }
  }, true);

  document.getElementById('term').addEventListener('click', function (e) {
    if (e.target.tagName !== 'A' && window.getSelection().toString() === '') input.focus();
  });

  /* opening screen */
  print('<span class="t-amber">wien field station — perimeter shell</span>');
  print('<span class="t-dim">authorised as: visitor · read-only</span>');
  blank();
  print('Five specimens are contained and documented on this station.');
  print('Type <span class="t-bone">help</span> for commands, or <span class="t-bone">ls</span> to see what is here.');
  blank();
})();
