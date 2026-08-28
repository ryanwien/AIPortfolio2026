/* ============================================================
   Builds specimens/<slug>/index.html from the data below.
   The five pages share one template, so they cannot drift.

     node tools/build-specimens.mjs

   Edit the content here, not in the generated HTML.
   ============================================================ */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const GH = 'https://github.com/ryanwien/Portfolio/tree/main/';

const SPECIMENS = [
  {
    n: '01',
    slug: 'eval-first-agent',
    cls: 'apex',
    status: { label: 'Harness armed', tone: 'warn' },
    plate: 'fence.webp',
    proves:
      'The evaluation harness <em>is</em> the product; the agent is the thing being measured. ' +
      'The deliverable a reviewer should care about is the eval suite, not the demo.',
    vitals: [
      ['Reports', 'pass@1 &amp; pass@3'],
      ['Cost metric', 'spend / solved task'],
      ['Latency', 'p50 &amp; p95'],
      ['Failure categories', '6']
    ],
    why: [
      'An agent is easy to demo and hard to trust. This project inverts the usual emphasis: the evaluation harness is the product, and the agent is the thing being measured.',
      'Most agent repos show a happy-path screen recording. This one ships a held-out eval set of real tasks, a harness that runs the agent over every case and scores it, pass@k and cost/latency metrics, and a failure taxonomy — failures are categorised, not merely counted. The claim being demonstrated is narrow and honest: <b>I know how agents fail in this domain, and I can quantify it.</b>',
      'The scaffold is deliberately domain-agnostic. Credibility comes from the eval set reflecting real tasks, so the cases are written by hand rather than generated — generating them with a model would defeat the entire point.'
    ],
    measured: [
      ['pass@k', 'Fraction of cases solved within k attempts. Reported at k=1 and k=3 so the gap between &ldquo;can do&rdquo; and &ldquo;reliably does&rdquo; is visible.'],
      ['Cost per solved task', 'Total spend divided by passes. The number that actually matters in production.'],
      ['p50 / p95 latency', 'Tail latency is where agents disappoint.'],
      ['Failure breakdown', 'Share of failures by category, so the write-up can say <i>how</i> it fails rather than only <i>that</i> it fails.']
    ],
    cards: {
      title: 'Failure taxonomy',
      intro: 'Failed traces are bucketed rather than tallied. The starter categories:',
      items: [
        ['wrong_tool', 'Selected an inappropriate tool.'],
        ['tool_error', 'Tool called with malformed arguments.'],
        ['hallucinated_result', 'Fabricated an answer instead of using tools.'],
        ['gave_up', 'Terminated without an answer.'],
        ['loop', 'Repeated the same failing action.'],
        ['correct_path_wrong_answer', 'Right approach, wrong final output.']
      ]
    },
    tree:
      '<b>eval-first-agent/</b>\n' +
      '├── src/\n' +
      '│   ├── agent/\n' +
      '│   │   ├── agent.py             <i># the agent loop (tool-calling)</i>\n' +
      '│   │   └── tools.py             <i># tool definitions</i>\n' +
      '│   └── evals/\n' +
      '│       ├── harness.py           <i># runs every case, collects traces</i>\n' +
      '│       ├── metrics.py           <i># pass@k, cost, latency</i>\n' +
      '│       └── failure_taxonomy.py  <i># classifies failed traces</i>\n' +
      '├── evals/\n' +
      '│   └── cases.jsonl              <i># the eval set (~50-100 real cases)</i>\n' +
      '└── results/                     <i># versioned run outputs</i>',
    run:
      'pip install -r requirements.txt\n' +
      'export ANTHROPIC_API_KEY=...        <span class="c-dim"># or your provider of choice</span>\n' +
      'python -m src.evals.harness --cases evals/cases.jsonl --k 3 --out results/',
    limits: [
      'Ships with placeholder cases; the eval set must be replaced with real domain tasks to be meaningful.',
      'Scoring uses exact or semantic match on final answers. Some domains need rubric-based or LLM-as-judge scoring, which carries its own validation burden.',
      'Single-provider by default. Cross-provider comparison is left as an extension.'
    ],
    next: [
      'Add LLM-as-judge scoring with a calibration set to validate the judge against human labels.',
      'Track per-category failure rates across model versions to detect regressions.',
      'Add a cost/quality Pareto plot across model tiers.'
    ]
  },

  {
    n: '02',
    slug: 'transformer-from-scratch',
    cls: 'structural',
    status: { label: 'Trained end to end', tone: 'ok' },
    plate: 'amber.webp',
    proves:
      'A decoder-only transformer implemented from first principles in PyTorch — no <code>nn.Transformer</code>, ' +
      'no high-level wrappers. The point is to show the mechanics are understood, not assembled.',
    vitals: [
      ['Loss', '3.38 &rarr; 1.93'],
      ['Parameters', '~0.5M (tiny config)'],
      ['Tokenisation', 'character-level'],
      ['Trains on', 'CPU, a few minutes']
    ],
    why: [
      'Wrapping a high-level API proves nothing about understanding. This is attention, masking, and the training loop written out by hand, so every design choice has to be made explicitly rather than inherited from a library default.',
      'Every non-obvious decision is commented in <code>model.py</code>: why scaled dot-product attention divides by &radic;d, why the mask is what makes it a decoder, why pre-norm rather than post-norm, and why the input embedding is tied to the output projection.',
      'It is trained end to end and verified to converge — <b>loss 3.38 down to 1.93</b> — producing coherent character-level samples. Enough to prove the loop works; deliberately not a scale demonstration.'
    ],
    measured: [
      ['Convergence', 'Loss falls from 3.38 to 1.93 on the default tiny config, on CPU.'],
      ['Multi-head causal attention', 'Written by hand, including the mask logic that makes it a decoder.'],
      ['A correct training loop', 'Batching, loss, gradient clipping, AdamW, evaluation and sampling.'],
      ['Documented choices', '&radic;d scaling, pre-norm placement and weight tying, explained inline rather than copied.']
    ],
    tree:
      '<b>transformer-from-scratch/</b>\n' +
      '├── src/\n' +
      '│   ├── model.py     <i># attention, MLP, blocks, GPT</i>\n' +
      '│   ├── data.py      <i># char-level dataset + batching</i>\n' +
      '│   └── train.py     <i># training loop, eval, sampling</i>\n' +
      '└── notebooks/\n' +
      '    └── walkthrough.md   <i># annotated tour of each component</i>',
    run:
      'pip install -r requirements.txt\n' +
      '<span class="c-dim"># any plain-text file works; a few hundred KB is plenty</span>\n' +
      'python -m src.train --data data/corpus.txt --steps 2000',
    limits: [
      'Character-level tokenisation, chosen for simplicity — no BPE.',
      'No KV-cache, so generation is O(n&sup2;) per step. Fine at this scale, not for serving.',
      'Trained on a toy corpus to keep the repo reproducible on a laptop.'
    ],
    next: [
      'Add a BPE tokeniser and compare convergence against char-level.',
      'Implement a KV-cache and benchmark the generation speedup.',
      'Ablate pre-norm vs. post-norm and weight tying on/off, with loss curves.'
    ]
  },

  {
    n: '03',
    slug: 'text-classification',
    cls: 'docile',
    status: { label: 'Pipeline verified', tone: 'ok' },
    plate: 'ferns.webp',
    proves:
      'An end-to-end pipeline on classic ML — no deep learning, no API, no GPU. The value is not a fancy model; ' +
      'it is a clean pipeline with real error analysis.',
    vitals: [
      ['Task', '4-way topic classification'],
      ['Dataset', '20 Newsgroups'],
      ['Baselines', '3, reported together'],
      ['Headline metric', 'macro-F1 + accuracy']
    ],
    why: [
      'Often a well-tuned TF-IDF and linear model is the right answer, and knowing that is itself a signal of judgement. This project reports three baselines side by side to show how much each modelling choice actually buys — usually less than people expect, which is the point.',
      'Headers, footers and quotes are stripped from the newsgroup data so the model learns content rather than metadata leakage, a common way newsgroup classifiers silently cheat. Vectorisers are fit on train only.',
      'The part that matters most is <b>error analysis</b>: a confusion matrix and concrete misclassified examples, so the write-up can explain <i>which</i> classes get confused and why — medicine and politics overlapping on shared vocabulary, for instance — rather than reporting a single accuracy number and stopping.'
    ],
    cards: {
      title: 'Models compared',
      intro: 'All three are trained and reported together, on identical features where applicable:',
      items: [
        ['nb-count', 'Multinomial Naive Bayes on counts. The fast, dumb baseline — the floor.'],
        ['logreg-tfidf', 'Logistic regression on TF-IDF bigrams. The reliable workhorse.'],
        ['linsvc-tfidf', 'Linear SVM on the same features. Often the strongest linear option.']
      ]
    },
    measured: [
      ['Macro-F1 and accuracy', 'Reported together, because accuracy alone hides per-class collapse.'],
      ['Per-class precision / recall', 'Which classes the model is actually good at.'],
      ['Confusion matrix', 'Where the errors concentrate.'],
      ['Concrete misclassifications', 'Real examples pulled out and inspected, not just counted.']
    ],
    tree:
      '<b>text-classification/</b>\n' +
      '└── src/\n' +
      '    ├── dataset.py         <i># loading (+ offline synthetic fallback)</i>\n' +
      '    ├── models.py          <i># three sklearn baselines</i>\n' +
      '    ├── train.py           <i># train all, report the metrics</i>\n' +
      '    └── error_analysis.py  <i># confusion matrix + example errors</i>',
    run:
      'pip install -r requirements.txt\n' +
      'python -m src.train           <span class="c-dim"># trains + evaluates all three</span>\n' +
      'python -m src.error_analysis  <span class="c-dim"># confusion matrix + errors</span>',
    limits: [
      'Bag-of-words ignores word order and context; &ldquo;not good&rdquo; and &ldquo;good&rdquo; look similar.',
      '20 Newsgroups is a clean benchmark; real-world text is messier — typos, mixed languages, class imbalance.',
      'No hyperparameter search beyond sensible defaults.'
    ],
    next: [
      'Add a fine-tuned DistilBERT as a fourth model and report the accuracy gain <i>versus</i> the added cost and latency — the tradeoff that actually matters.',
      'Calibrate confidence scores and add an abstain option for low-confidence cases.',
      'Cross-validation with confidence intervals instead of a single split.'
    ]
  },

  {
    n: '04',
    slug: 'extraction-benchmark',
    cls: 'methodology',
    status: { label: 'Runner scoring', tone: 'ok' },
    plate: 'poster.webp',
    proves:
      'A small, rigorous benchmark for structured extraction. Benchmarks get shared and cited, so the credibility ' +
      'has to come from a defensible methodology rather than a leaderboard-topping score.',
    vitals: [
      ['Headline metric', 'field-level F1'],
      ['Regex baseline', '0.80 F1'],
      ['Reported beside it', 'strict exact match'],
      ['Normalisation', 'explicit, documented']
    ],
    why: [
      'A benchmark is only as good as its method. This one is built so a sceptical reader can audit every choice: what counts as correct, what gets normalised before comparison, and what floor a model has to clear before its score means anything.',
      'Out of the box it runs a <b>regex baseline</b>, so the harness produces real numbers immediately rather than waiting on model access — currently <b>0.80 field F1</b>. A model that cannot beat regex on this task is itself a result worth reporting.',
      'The example task is invoice field extraction. The scaffold is meant to be repointed at a domain you actually know, because the value of a benchmark lives in the quality and realism of its eval set.'
    ],
    measured: [
      ['Field-level F1', 'The headline metric — partial credit per field, computed from precision and recall over correctly extracted fields.'],
      ['Exact match', 'A stricter view reported alongside: did the <i>entire</i> record match? The gap between the two is informative on its own.'],
      ['Explicit normalisation', 'Case, whitespace, currency symbols and thousands separators are normalised so &ldquo;$1,250.00&rdquo; equals &ldquo;1250.00&rdquo;. Documented, because silent normalisation choices are how benchmarks mislead.'],
      ['A non-trivial baseline', 'Regex gives every model a floor to beat.']
    ],
    tree:
      '<b>extraction-benchmark/</b>\n' +
      '├── src/\n' +
      '│   ├── run_benchmark.py   <i># runs all models, scores, writes the table</i>\n' +
      '│   ├── models.py          <i># adapters (regex baseline + LLM slots)</i>\n' +
      '│   └── scoring.py         <i># field-level F1, exact match, normalisation</i>\n' +
      '├── data/\n' +
      '│   └── eval_set.jsonl     <i># gold-labelled examples, hand-written</i>\n' +
      '└── results/               <i># versioned result artifacts</i>',
    run:
      'pip install -r requirements.txt\n' +
      'python -m src.run_benchmark --data data/eval_set.jsonl --models all --out results/',
    output:
      'model                     field_F1     exact     p50_s\n' +
      '------------------------------------------------------\n' +
      'regex-baseline               0.800     0.000     0.000',
    limits: [
      'The shipped eval set is 3 illustrative examples. A credible benchmark needs 50+ hand-labelled, realistic cases — generating them with a model defeats the point.',
      'Single annotator. For a public benchmark, a second annotator and an inter-annotator agreement number would strengthen it considerably.',
      'Exact and normalised matching can be too strict for free-text fields such as vendor names.'
    ],
    next: [
      'Expand to 50–100 hand-labelled real documents and report a confidence interval.',
      'Add fuzzy matching for name-like fields and report both strict and fuzzy F1.',
      'Add cost-per-document so the quality/cost tradeoff across models is visible.'
    ]
  },

  {
    n: '05',
    slug: 'stock-forecasting',
    cls: 'volatile',
    status: { label: 'Verified on synthetic', tone: 'warn' },
    plate: 'track.webp',
    proves:
      'Next-day return forecasting on real market data with a PyTorch LSTM. The point is not to get rich — it is to do ' +
      'time-series ML correctly, where the easy mistakes silently produce results that look great and mean nothing.',
    vitals: [
      ['Features', '8, all causal'],
      ['Split', 'strictly chronological'],
      ['Judged by', 'Sharpe &amp; max drawdown'],
      ['Benchmark', 'buy-and-hold']
    ],
    why: [
      'Lookahead bias, leaky scaling and evaluating on the wrong metric are the three ways a forecasting project quietly lies to you. All three produce beautiful numbers. This repo is built to demonstrate the pipeline can be constructed without any of them.',
      '<b>No lookahead:</b> every feature at time <i>t</i> uses only data available at or before <i>t</i>; the only forward-looking column is the label. <b>Chronological split:</b> the test set is strictly the most recent data, never a random shuffle. <b>Train-only scaling:</b> standardisation statistics are fit on train and applied to test, so test statistics cannot leak backward.',
      '<b>Honest evaluation:</b> low MSE is not the goal. The repo reports directional accuracy and a long/flat backtest — annualised Sharpe and maximum drawdown — measured against buy-and-hold, because a strategy that cannot beat buy-and-hold is not a strategy.'
    ],
    measured: [
      ['Directional accuracy', 'Expect numbers near 0.5. Daily equity returns are close to unpredictable from price history alone, and saying so is the honest result.'],
      ['Annualised Sharpe', 'From a long/flat backtest of the model’s signal.'],
      ['Maximum drawdown', 'The loss an investor would actually have had to sit through.'],
      ['Buy-and-hold benchmark', 'Every number above is reported against it. Without the benchmark the numbers are decoration.']
    ],
    cards: {
      title: 'The eight features',
      intro: 'All causal by construction — past-only, computed per timestep:',
      items: [
        ['returns', '1-day and 5-day returns.'],
        ['log_volume', 'Log-transformed traded volume.'],
        ['price_to_ma', 'Price-to-moving-average ratios at 5, 10 and 20 days.'],
        ['realized_vol', '10-day realised volatility.'],
        ['rsi_14', 'Relative strength index over 14 days.']
      ]
    },
    tree:
      '<b>stock-forecasting/</b>\n' +
      '├── src/\n' +
      '│   ├── data.py     <i># fetch, features, sequencing, split</i>\n' +
      '│   ├── model.py    <i># the LSTM forecaster</i>\n' +
      '│   └── train.py    <i># training loop + financial evaluation</i>\n' +
      '├── data/           <i># cache (gitignored)</i>\n' +
      '└── results/        <i># metrics artifacts</i>',
    run:
      'pip install -r requirements.txt\n' +
      'python -m src.train --ticker AAPL --start 2015-01-01 --end 2024-01-01',
    limits: [
      'Price and volume features only — no fundamentals, news, or cross-asset signals.',
      'Single ticker at a time; no portfolio construction and no transaction costs.',
      'The backtest is intentionally naive — long/flat, no costs or slippage. It is a sanity check, not a tradeable strategy.',
      'Expect directional accuracy near 0.5. A portfolio claiming 70% next-day accuracy almost always has a leak.'
    ],
    next: [
      'Add transaction costs and slippage to make the backtest realistic.',
      'Walk-forward validation (rolling retrain) instead of a single split.',
      'Compare against simpler baselines — predict-zero, AR(1) — to prove the LSTM earns its complexity. Often it does not, which is itself worth reporting.'
    ]
  }
];

/* ---------------- template ---------------- */

const li = (items) => items.map((t) => '<li>' + t + '</li>').join('\n          ');

function block(title, inner) {
  return (
    '      <section class="block">\n' +
    '        <h2 class="block__title">' + title + '</h2>\n' +
    inner +
    '\n      </section>'
  );
}

function page(s, prev, next) {
  const vitals = s.vitals
    .map(([k, v]) => '        <div><dt>' + k + '</dt><dd>' + v + '</dd></div>')
    .join('\n');

  const why = s.why.map((p) => '        <p>' + p + '</p>').join('\n');

  const measured = s.measured
    .map(([k, v]) => '          <div><dt>' + k + '</dt><dd>' + v + '</dd></div>')
    .join('\n');

  const cards = s.cards
    ? block(
        s.cards.title,
        '        <p>' + s.cards.intro + '</p>\n' +
          '        <div class="grid-cards">\n' +
          s.cards.items
            .map(([c, d]) => '          <div><code>' + c + '</code><p>' + d + '</p></div>')
            .join('\n') +
          '\n        </div>'
      )
    : '';

  const output = s.output
    ? '\n        <p style="margin-top:24px">Sample output:</p>\n        <pre class="tree">' + s.output + '</pre>'
    : '';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>SP-${s.n} ${s.slug} — Wien Field Station</title>
<meta name="description" content="${s.slug}: what it proves, what was measured, and what it cannot do.">
<meta property="og:title" content="SP-${s.n} ${s.slug} — Wien Field Station">
<meta property="og:description" content="What it proves, what was measured, and what it cannot do.">
<meta property="og:image" content="../../assets/img/poster.webp">
<meta name="theme-color" content="#060a08">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../../assets/css/style.css">
<link rel="stylesheet" href="../../assets/css/specimen.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><circle cx='16' cy='16' r='13' fill='%23f0a92c'/><circle cx='16' cy='16' r='5' fill='%23231402'/></svg>">
</head>
<body>
<a class="skip" href="#dossier">Skip to the dossier</a>

<header class="topbar">
  <div class="hazard" aria-hidden="true"></div>
  <nav class="topbar__inner" aria-label="Primary">
    <a class="brand" href="../../index.html">
      <span class="brand__mark" aria-hidden="true"></span>
      <span class="brand__name"><b>WIEN</b> FIELD STATION</span>
    </a>
    <ul class="topbar__links">
      <li><a href="../../index.html#paddocks">Paddocks</a></li>
      <li><a href="../../index.html#log">Log</a></li>
      <li><a href="../../index.html#protocols">Protocols</a></li>
      <li><a href="../../index.html#terminal">Terminal</a></li>
    </ul>
  </nav>
</header>

<main class="spec">

  <div class="spec-hero">
    <div class="spec-hero__plate" style="background-image:url('../../assets/img/${s.plate}')" aria-hidden="true"></div>
    <div class="wrap">
      <a class="crumb" href="../../index.html#paddocks"><span aria-hidden="true">&larr;</span> All paddocks</a>
      <div class="spec-head">
        <span class="spec-id">SP-${s.n}</span>
        <span class="chip chip--${s.status.tone}"><span class="led led--${s.status.tone === 'ok' ? 'on' : 'warn'}" aria-hidden="true"></span>${s.status.label}</span>
      </div>
      <h1 class="spec-name">${s.slug}</h1>
      <p class="spec-class">Containment class &mdash; <b>${s.cls}</b></p>
      <p class="spec-proves">${s.proves}</p>
      <dl class="vitals">
${vitals}
      </dl>
    </div>
  </div>

  <div class="wrap">
    <div class="spec-body" id="dossier">

${block('Why this exists', why)}

${block('What is measured', '        <dl class="kv">\n' + measured + '\n        </dl>')}
${cards ? '\n' + cards + '\n' : ''}
${block('Layout', '        <pre class="tree">' + s.tree + '</pre>')}

${block(
  'Run it',
  '        <div class="cmd-wrap">\n' +
    '          <button class="copy" type="button">Copy</button>\n' +
    '          <pre class="cmd">' + s.run + '</pre>\n' +
    '        </div>' + output
)}

      <section class="block limits">
        <h2 class="block__title">Limitations</h2>
        <ul>
          ${li(s.limits)}
        </ul>
      </section>

${block('What I would do next', '        <ul class="bullets">\n          ' + li(s.next) + '\n        </ul>')}

    </div>

    <div class="spec-cta">
      <a class="btn btn--primary" href="${GH}${s.slug}">View the code on GitHub <span aria-hidden="true">&rarr;</span></a>
      <a class="btn btn--ghost" href="../../index.html#paddocks">Back to the paddocks</a>
    </div>

    <nav class="specnav" aria-label="Other specimens">
      <a href="../${prev.slug}/index.html">
        <span>&larr; SP-${prev.n} &middot; previous</span>
        <b>${prev.slug}</b>
      </a>
      <a href="../${next.slug}/index.html">
        <span>SP-${next.n} &middot; next &rarr;</span>
        <b>${next.slug}</b>
      </a>
    </nav>
  </div>

</main>

<footer class="foot">
  <div class="hazard" aria-hidden="true"></div>
  <div class="wrap foot__inner">
    <p><b>Wien Field Station</b> &mdash; specimen containment &amp; evaluation</p>
    <p class="foot__note">Built by Ryan Wien. Original theme; not affiliated with, or endorsed by, any film or franchise.</p>
  </div>
</footer>

<script src="../../assets/js/specimen.js" defer></script>
</body>
</html>
`;
}

/* ---------------- write ---------------- */

let written = 0;
SPECIMENS.forEach((s, i) => {
  const prev = SPECIMENS[(i - 1 + SPECIMENS.length) % SPECIMENS.length];
  const next = SPECIMENS[(i + 1) % SPECIMENS.length];
  const dir = join(ROOT, 'specimens', s.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), page(s, prev, next), 'utf8');
  console.log('  specimens/' + s.slug + '/index.html');
  written++;
});
console.log('\n' + written + ' specimen pages written.');
