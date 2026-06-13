// js/core/rng.js — 全局命名空间 G 的创建 + 统一随机数入口（mulberry32，可种子化）。
// 契约 §1.3：一切随机走 G.rng / G.rng.int / G.rng.pick / G.rng.chance / G.rng.weighted，禁止 Math.random。
// 存档会保存 rng 内部状态（G.rng.getState/setState），读档后随机序列可延续。
(function () {
  'use strict';
  window.G = window.G || {};

  // 初始种子：时间扰动（不依赖 Math.random）。
  var state = (Date.now() % 0xffffffff) >>> 0;
  if (state === 0) state = 0x9e3779b9;

  function next() { // mulberry32
    state = (state + 0x6D2B79F5) >>> 0;
    var t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t = (t + Math.imul(t ^ (t >>> 7), t | 61)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  var rng = function () { return next(); };

  rng.seed = function (s) { state = (s >>> 0) || 0x9e3779b9; };
  rng.getState = function () { return state; };
  rng.setState = function (s) { state = (s >>> 0) || 0x9e3779b9; };

  // 含两端的整数
  rng.int = function (a, b) {
    if (b < a) { var t = a; a = b; b = t; }
    return a + Math.floor(next() * (b - a + 1));
  };
  rng.pick = function (arr) {
    if (!arr || !arr.length) return null;
    return arr[Math.floor(next() * arr.length)];
  };
  rng.chance = function (p) { return next() < p; };
  // 按权重抽一个；wfn(item) 返回权重（<=0 视为不可抽）。
  rng.weighted = function (arr, wfn) {
    if (!arr || !arr.length) return null;
    var total = 0, ws = [], i, w;
    for (i = 0; i < arr.length; i++) {
      w = Math.max(0, wfn ? (wfn(arr[i]) || 0) : 1);
      ws.push(w); total += w;
    }
    if (total <= 0) return null;
    var r = next() * total;
    for (i = 0; i < arr.length; i++) {
      r -= ws[i];
      if (r < 0) return arr[i];
    }
    return arr[arr.length - 1];
  };

  G.rng = rng;
})();
