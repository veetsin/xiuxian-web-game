// js/core/bus.js — 极简事件总线。系统间松耦合用（如战斗结束 → 传闻/称号反应）。
// 引擎已发出的信号（内容/系统可订阅）：
//   'combat:end'  {enemyId, result:'win'|'lose'|'flee'|'press', rating, boss}   // press=威压降服
//   'title:grant' {titleId}
//   'realm:up'    {realmIdx}
//   'dao:stage'   {daoId, stage}
//   'life:death'  {cause}
//   'life:new'    {lifeIndex, birthId}
(function () {
  'use strict';
  G.bus = {
    _h: {},
    on: function (evt, fn) {
      (this._h[evt] = this._h[evt] || []).push(fn);
      return fn;
    },
    off: function (evt, fn) {
      var a = this._h[evt]; if (!a) return;
      var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1);
    },
    emit: function (evt, payload) {
      var a = this._h[evt]; if (!a) return;
      a.slice().forEach(function (fn) {
        try { fn(payload); } catch (e) { console.error('[BUS] ' + evt + ' 处理器异常:', e); }
      });
    }
  };
})();
