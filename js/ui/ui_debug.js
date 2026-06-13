// js/ui/ui_debug.js — 线上轻量调试面板。?debug=1 或 Ctrl+Shift+D 开关。
(function () {
  'use strict';
  var enabled = false;
  var lastDump = null;
  var rawWarn = console.warn;
  var rawError = console.error;

  function esc(s) {
    return G.ui && G.ui.esc ? G.ui.esc(s) : String(s == null ? '' : s);
  }

  function record(level, args) {
    if (!G.debug) return;
    G.debug._errors = G.debug._errors || [];
    var text = Array.prototype.map.call(args, function (x) {
      if (x && x.stack) return x.stack;
      if (typeof x === 'object') {
        try { return JSON.stringify(x); } catch (e) { return String(x); }
      }
      return String(x);
    }).join(' ');
    G.debug._errors.push({ level: level, t: text, at: new Date().toISOString() });
    while (G.debug._errors.length > 30) G.debug._errors.shift();
  }

  console.warn = function () {
    record('warn', arguments);
    rawWarn.apply(console, arguments);
  };
  console.error = function () {
    record('error', arguments);
    rawError.apply(console, arguments);
  };
  window.addEventListener('error', function (e) {
    record('error', [e.message + ' @ ' + e.filename + ':' + e.lineno]);
  });
  window.addEventListener('unhandledrejection', function (e) {
    record('error', ['unhandledrejection', e.reason]);
  });

  function wantsDebug() {
    var byQuery = /(?:\?|&)debug=1(?:&|$)/.test(location.search);
    try {
      return byQuery || localStorage.getItem('qingshi_debug') === '1';
    } catch (e) {
      return byQuery;
    }
  }

  function ensurePanel() {
    var el = document.getElementById('debug-panel');
    if (el) return el;
    el = document.createElement('div');
    el.id = 'debug-panel';
    el.className = 'hidden';
    document.body.appendChild(el);
    return el;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('clipboard unavailable'));
  }

  function render() {
    var el = ensurePanel();
    if (!enabled) {
      el.classList.add('hidden');
      return;
    }
    el.classList.remove('hidden');
    var d = G.debug && G.debug.diagnose ? G.debug.diagnose() : {};
    lastDump = d;
    var blockers = (d.blockers || []).map(function (x) { return '<span>' + esc(x) + '</span>'; }).join('');
    var actions = (d.actions || []).slice(0, 8).map(function (x) { return '<div>' + esc(x) + '</div>'; }).join('');
    if (!actions) actions = '<div>无可用行动</div>';
    var recentErrors = (d.recentErrors || []).slice(-5).map(function (x) {
      return '[' + x.level + '] ' + x.t;
    }).join('\n') || '暂无错误';
    el.innerHTML =
      '<div class="debug-head"><span>Debug</span><button class="debug-x" data-dbg="close">收起</button></div>' +
      '<div class="debug-grid">' +
      '  <div>mode</div><b>' + esc(d.mode || '-') + '</b>' +
      '  <div>loc</div><b>' + esc(d.location || '-') + '</b>' +
      '  <div>queue</div><b>' + esc(d.queue || 0) + '</b>' +
      '  <div>paused</div><b>' + esc(d.paused ? 'yes' : 'no') + '</b>' +
      '</div>' +
      '<div class="debug-blockers">' + blockers + '</div>' +
      '<div class="debug-actions">' +
      '  <button class="btn btn-xs" data-dbg="refresh">诊断</button>' +
      '  <button class="btn btn-xs btn-gold" data-dbg="unstick">解卡</button>' +
      '  <button class="btn btn-xs" data-dbg="validate">校验</button>' +
      '  <button class="btn btn-xs" data-dbg="copy">复制</button>' +
      '</div>' +
      '<div class="debug-sub">可用行动</div><div class="debug-list">' + actions + '</div>' +
      '<div class="debug-sub">最近错误</div><pre class="debug-pre">' + esc(recentErrors) + '</pre>';

    Array.prototype.forEach.call(el.querySelectorAll('[data-dbg]'), function (btn) {
      btn.onclick = function () {
        var op = btn.getAttribute('data-dbg');
        if (op === 'close') setEnabled(false);
        else if (op === 'refresh') render();
        else if (op === 'unstick') {
          var ret = G.debug.unstick();
          if (G.ui && G.ui.toast) G.ui.toast(ret.notes.join('；'));
          render();
        } else if (op === 'validate') {
          var n = G.debug.validate();
          if (G.ui && G.ui.toast) G.ui.toast('校验完成：' + n + ' 个问题。');
          render();
        } else if (op === 'copy') {
          copyText(JSON.stringify(lastDump || G.debug.diagnose(), null, 2)).then(function () {
            if (G.ui && G.ui.toast) G.ui.toast('调试状态已复制。');
          }, function () {
            window.__QINGSHI_DEBUG_DUMP__ = lastDump || G.debug.diagnose();
            if (G.ui && G.ui.toast) G.ui.toast('已写入 window.__QINGSHI_DEBUG_DUMP__。');
          });
        }
      };
    });
  }

  function setEnabled(v) {
    enabled = !!v;
    try {
      if (enabled) localStorage.setItem('qingshi_debug', '1');
      else localStorage.removeItem('qingshi_debug');
    } catch (e) { /* 忽略 */ }
    render();
  }

  var oldRefresh = G.ui.refresh;
  G.ui.refresh = function () {
    oldRefresh.apply(G.ui, arguments);
    render();
  };
  G.ui.toggleDebug = function () { setEnabled(!enabled); };
  G.ui.renderDebug = render;

  window.addEventListener('keydown', function (e) {
    if (e.ctrlKey && e.shiftKey && String(e.key).toLowerCase() === 'd') {
      e.preventDefault();
      setEnabled(!enabled);
    }
  });
  window.addEventListener('load', function () {
    if (wantsDebug()) setEnabled(true);
  });
})();
