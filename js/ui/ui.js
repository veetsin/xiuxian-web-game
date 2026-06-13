// js/ui/ui.js — UI 核心：DOM 骨架、模式机、日志渲染、刷新调度（契约 §13）。
// 模式：start(开屏) | birth(出生卡) | loc(地点+行动) | event(事件卡) | combat(战斗) | liminal(走马灯)。
// 五区：#topbar(全状态+#sysbar) / #map(左·八地点) / #center(中·三态) / #side(右·六tab) / #log(底部150条)。
(function () {
  'use strict';

  var STYLE_CLASS = {
    '平': 'ping', '异象': 'yixiang', '血': 'xue', '雷': 'lei', '丹': 'dan', '体': 'ti',
    '因果': 'yinguo', '凶': 'xiong', '吉': 'ji', '世界': 'shijie', '战': 'zhan', '突破': 'tupo'
  };

  G.logBuffer = [];

  // 全局日志入口（契约 §3）
  G.log = function (text, style) {
    style = style || '平';
    var entry = { t: text, style: style, ym: G.world ? G.ymText() : '' };
    G.logBuffer.push(entry);
    if (G.logBuffer.length > G.BAL.logCap) G.logBuffer.shift();
    // 增量渲染（异象/突破带一次性 flash）
    var box = document.getElementById('log-lines');
    if (box) {
      box.appendChild(G.ui._logLine(entry, true));
      while (box.children.length > G.BAL.logCap) box.removeChild(box.firstChild);
      var lg = document.getElementById('log');
      if (lg) lg.scrollTop = lg.scrollHeight;
    }
  };

  G.ui = {
    mode: 'start',
    tab: 'wudao',

    esc: function (s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    },

    // ---- DOM 骨架 ----
    skeleton: function () {
      var app = document.getElementById('app');
      app.innerHTML =
        '<div id="topbar"><div id="topbar-stats"></div><div id="sysbar"></div></div>' +
        '<div id="mainrow">' +
        '  <div id="map" class="panel"><div class="panel-title">舆图</div><div id="map-list"></div><div id="map-wvars"></div></div>' +
        '  <div id="center" class="panel"></div>' +
        '  <div id="side" class="panel"><div id="side-tabs"></div><div id="side-body"></div></div>' +
        '</div>' +
        '<div id="log" class="panel"><div class="panel-title">见闻录</div><div id="log-lines"></div></div>' +
        '<div id="overlay" class="hidden"></div>' +
        '<div id="toast" class="hidden"></div>';
    },

    setMode: function (m) {
      this.mode = m;
      this.refresh();
    },

    // ---- 全量重绘（契约 §3 G.ui.refresh）----
    refresh: function () {
      if (!document.getElementById('topbar')) return; // 骨架未建
      var mode = this.mode;
      var overlay = document.getElementById('overlay');

      // 覆盖屏模式
      if (mode === 'start' || mode === 'birth' || mode === 'liminal') {
        overlay.classList.remove('hidden');
        if (mode === 'start') G.ui.renderStart(overlay);
        else if (mode === 'birth') G.ui.renderBirth(overlay);
        else G.ui.renderLiminal(overlay);
        return;
      }
      overlay.classList.add('hidden');
      if (!G.player || !G.world) return;

      G.ui.renderTopbar();
      G.ui.renderSysbar();
      G.ui.renderMap();
      G.ui.renderSide();
      G.ui.renderLog();

      var center = document.getElementById('center');
      if (mode === 'combat' && G.combat) G.ui.renderCombat();
      else if (mode === 'event' && G.sys.events.pending.length) G.ui.renderEvent(center);
      else { this.mode = 'loc'; G.ui.renderLoc(center); }
    },

    // ---- 日志 ----
    _logLine: function (entry, flash) {
      var div = document.createElement('div');
      var cls = 'lg lg-' + (STYLE_CLASS[entry.style] || 'ping');
      if (flash && (entry.style === '异象' || entry.style === '突破')) cls += ' lg-flash';
      div.className = cls;
      var ym = entry.ym ? '<span class="lg-ym">[' + this.esc(entry.ym) + ']</span> ' : '';
      div.innerHTML = ym + this.esc(entry.t);
      return div;
    },
    renderLog: function () {
      var box = document.getElementById('log-lines');
      if (!box) return;
      // 全量重绘（无 flash，避免旧行反复闪）
      box.innerHTML = '';
      var self = this;
      G.logBuffer.forEach(function (e) { box.appendChild(self._logLine(e, false)); });
      var lg = document.getElementById('log');
      if (lg) lg.scrollTop = lg.scrollHeight;
    },

    // ---- 轻提示 ----
    toast: function (msg) {
      var t = document.getElementById('toast');
      if (!t) return;
      t.textContent = msg;
      t.classList.remove('hidden');
      clearTimeout(G.ui._toastTimer);
      G.ui._toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 1800);
    },

    // ---- 二次确认弹层（重开用，禁 confirm）----
    confirmBox: function (text, onYes) {
      var overlay = document.getElementById('overlay');
      overlay.classList.remove('hidden');
      overlay.innerHTML =
        '<div class="card card-confirm">' +
        '  <div class="card-title">慎之</div>' +
        '  <div class="card-text">' + this.esc(text) + '</div>' +
        '  <div class="card-btns">' +
        '    <button id="cf-yes" class="btn btn-danger">确意如此</button>' +
        '    <button id="cf-no" class="btn">再想想</button>' +
        '  </div></div>';
      document.getElementById('cf-yes').onclick = function () { onYes(); };
      document.getElementById('cf-no').onclick = function () {
        overlay.classList.add('hidden');
        G.ui.refresh();
      };
    }
  };
})();
