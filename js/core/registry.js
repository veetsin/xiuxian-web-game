// js/core/registry.js — 内容注册表。契约 §3：G.define(kind, def) / G.get / G.all。
// kind ∈ item | birth | memory | location | action | event | enemy | dao | npc | title
(function () {
  'use strict';
  G.KINDS = ['item', 'birth', 'memory', 'location', 'action', 'event', 'enemy', 'dao', 'npc', 'title', 'beastlore'];
  G._reg = {};

  G.define = function (kind, def) {
    if (!def || !def.id) { console.error('[REG] define 缺少 id:', kind, def); return null; }
    if (G.KINDS.indexOf(kind) < 0) console.warn('[REG] 未知 kind「' + kind + '」(id=' + def.id + ')，仍登记。');
    var table = G._reg[kind] || (G._reg[kind] = {});
    if (table[def.id]) console.warn('[REG] 重复 id 覆盖: ' + kind + '/' + def.id);
    table[def.id] = def;
    return def;
  };

  G.get = function (kind, id) {
    var table = G._reg[kind];
    return (table && table[id]) || null;
  };

  G.all = function (kind) {
    var table = G._reg[kind];
    if (!table) return [];
    return Object.keys(table).map(function (k) { return table[k]; });
  };
})();
