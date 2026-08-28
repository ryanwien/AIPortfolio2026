/* Copy buttons on the "Run it" blocks. */
(function () {
  'use strict';

  document.querySelectorAll('.cmd-wrap').forEach(function (wrap) {
    var btn = wrap.querySelector('.copy');
    var pre = wrap.querySelector('.cmd');
    if (!btn || !pre) return;

    btn.addEventListener('click', function () {
      /* strip the dimmed inline comments so the paste is runnable */
      var clone = pre.cloneNode(true);
      clone.querySelectorAll('.c-dim').forEach(function (c) { c.remove(); });
      var text = clone.textContent.split('\n').map(function (l) { return l.trimEnd(); }).join('\n').trim();

      function done(ok) {
        btn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        btn.classList.toggle('is-done', ok);
        setTimeout(function () {
          btn.textContent = 'Copy';
          btn.classList.remove('is-done');
        }, 2000);
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { select(); });
      } else {
        select();
      }

      function select() {
        var r = document.createRange();
        r.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        done(false);
      }
    });
  });
})();
