// js/systems/daoxin.js — 道心冲突与兼修系统（spec §3.5）。
// 兼修多道是有诱惑、有风险、有剧情重量的选择：学得越杂，身体里的声音越多；没有主心骨则道心紊乱，
// 轻则异象失控（杂念→逆冲），重则走火入魔。冲突先表现为体验（梦乱/气机逆行/异象抢节奏/悟道录矛盾行），
// 再表现为数值。本系统只做「检测 + 钩子 + DSL」，问心/调和/入魔的剧情在 js/data/daoxin_content.js。
//
// ── API（内容/UI 读；DSL 见下）──
//   5 冲突对（玄幻因果）：leifa↔handu(雷火冲阴寒) / xuejian↔xianghuo(血煞污香火) /
//     humei↔yinguo(媚术扰因果) / danyao↔leifa(丹毒压雷息) / shouhun↔yujian(兽性冲剑心)。
//   G.sys.daoxin.staged(min) → 阶段≥min 的道 id 数组
//   G.sys.daoxin.zhuxiu() → 主修道 id（阶段最高→confirmed insight 最多→最近一次纳之；无则 null）
//   G.sys.daoxin.activeConflicts() → 未调和的冲突对 [['a','b'],...]（双方阶段≥2）
//   G.sys.daoxin.level() → '无'|'杂念'(2+道阶段≥1)|'逆冲'(≥1对冲突)|'入魔'(3+道阶段≥2 或持禁法)
//   G.sys.daoxin.isTiaohe(a,b) → 该对是否已调和
//   G.sys.daoxin.monthly() → 月度杂念结算 + 逆冲新出现时安排问心（time.js 调）
//   G.sys.daoxin.combatDisrupt() → 逆冲战斗扰动，返回 {t,style} 或 null（combat.js roundEnd 调并 clog）
//   G.sys.daoxin.fxop(v)/condop(v) → DSL 委托
// ── 条件 DSL {daoxin:{...}} ──
//   {level:'逆冲'}(按层级 gte) / {conflict:['leifa','handu']}(该对正冲突) / {anyConflict:true} /
//   {jianxiu:{gte:N}}(N+道阶段≥2) / {zhuxiu:'xuejian'} / {tiaohe:['a','b']}(该对已调和)
// ── 效果 DSL {daoxin:{op:'tiaohe', pair:['a','b'], by:'师承|法宝|誓言|生死|抑之'}} ──
//   落 world.flags['_tiaohe_<a_b>'] + 调和 log。入魔致死内容侧直接 {die:{cause:'走火入魔'|'心魔噬身'}}。
//   入魔死亡 → meta.legacy['zouhuo_rumo_si']（rumo_zhe 称号读取），本文件监听 life:death 自动落。
(function () {
  'use strict';
  G.sys = G.sys || {};

  var CONFLICTS = [
    ['leifa', 'handu'], ['xuejian', 'xianghuo'], ['humei', 'yinguo'],
    ['danyao', 'leifa'], ['shouhun', 'yujian']
  ];
  var LEVELS = ['无', '杂念', '逆冲', '入魔'];
  function pkey(a, b) { return a < b ? a + '_' + b : b + '_' + a; }
  function cmp(val, spec) {
    if (spec == null || typeof spec !== 'object') return val === spec;
    if (spec.gte != null && !(val >= spec.gte)) return false;
    if (spec.lte != null && !(val <= spec.lte)) return false;
    return true;
  }

  G.sys.daoxin = {
    pairs: function () { return CONFLICTS.map(function (p) { return p.slice(); }); },

    staged: function (min) {
      var p = G.player, out = [];
      if (!p) return out;
      G.all('dao').forEach(function (d) { if ((p.daoStage[d.id] || 0) >= min) out.push(d.id); });
      return out;
    },

    zhuxiu: function () {
      var p = G.player; if (!p) return null;
      var best = null, bestStage = -1, bestIns = -1;
      G.all('dao').forEach(function (d) {
        var st = p.daoStage[d.id] || 0;
        if (st < 2) return; // 主修须已命名
        var e = p.insights['dao_' + d.id];
        var ins = e ? e.lines.filter(function (l) { return l.confirmed; }).length : 0;
        if (st > bestStage || (st === bestStage && ins > bestIns)) { best = d.id; bestStage = st; bestIns = ins; }
      });
      var last = p.pflags['_last_advance']; // tie-break：最近一次纳之
      if (last && (p.daoStage[last] || 0) === bestStage) best = last;
      return best;
    },

    isTiaohe: function (a, b) { return !!(G.world && G.world.flags['_tiaohe_' + pkey(a, b)]); },

    activeConflicts: function () {
      var p = G.player, self = this, out = [];
      if (!p) return out;
      CONFLICTS.forEach(function (pair) {
        if ((p.daoStage[pair[0]] || 0) >= 2 && (p.daoStage[pair[1]] || 0) >= 2 && !self.isTiaohe(pair[0], pair[1]))
          out.push(pair.slice());
      });
      return out;
    },

    level: function () {
      if (!G.player) return '无';
      if (this.staged(2).length >= 3 || G.player.pflags['_jinfa']) return '入魔';
      if (this.activeConflicts().length >= 1) return '逆冲';
      if (this.staged(1).length >= 2) return '杂念';
      return '无';
    },
    levelIdx: function () { return LEVELS.indexOf(this.level()); },

    // ---- 月度（time.js 调）：杂念叙事 + 逆冲新出现时安排问心 ----
    monthly: function () {
      var p = G.player; if (!p || p.dead) return;
      var lv = this.level();
      if ((lv === '逆冲' || lv === '入魔') && this.activeConflicts().length && !p.pflags['_nichong_seen']) {
        p.pflags['_nichong_seen'] = true;
        G.sys.events.schedule('ev_daoxin_wenxin', 1, '道心逆冲，气机相争');
      }
      if (lv !== '逆冲' && lv !== '入魔') p.pflags['_nichong_seen'] = false; // 调和后复位，可再冲再问
      if (lv === '杂念' && G.rng.chance(0.12)) {
        G.log('夜里你又做那种乱梦——几条没名字的路在身体里争着说话，醒来心口发空。', '因果');
        p.counters.xinmo = Math.min(100, p.counters.xinmo + G.rng.int(1, 3));
        this._zania();
      }
    },
    _zania: function () { // 悟道录非确认行（相互矛盾的杂音）
      var p = G.player, e = p.insights['daoxin_zania'];
      if (!e) p.insights['daoxin_zania'] = e = { title: '心头杂音', lines: [] };
      var line = G.rng.pick([
        '学得太杂了。身体里的声音，开始各说各的。',
        '哪条才是我的主心骨？我还分不清。',
        '气机有时会自己拧上一拧，像两个人在抢一只手。'
      ]);
      if (!e.lines.some(function (l) { return l.text === line; })) e.lines.push({ text: line, confirmed: false });
    },

    // ---- 战斗逆冲扰动（combat.js roundEnd 调；返回消息让 combat 用 clog 打）----
    combatDisrupt: function () {
      var c = G.combat; if (!c || c.over) return null;
      if (this.levelIdx() < 2) return null; // 逆冲及以上
      if (!G.rng.chance(0.15)) return null;
      var p = G.player;
      if (p.qi > 0) p.qi = Math.max(0, p.qi - G.rng.int(2, 5)); // 气机岔了半拍
      return { t: '【逆冲】身体里两种天理猛地一顶，你的气机岔了半拍。', style: '凶' };
    },

    // ---- DSL 委托 ----
    condop: function (v) {
      var self = this;
      if (v.level != null) return self.levelIdx() >= LEVELS.indexOf(v.level);
      if (v.anyConflict != null) return v.anyConflict ? self.activeConflicts().length > 0 : self.activeConflicts().length === 0;
      if (v.conflict) {
        var a = v.conflict[0], b = v.conflict[1];
        return self.activeConflicts().some(function (p) { return (p[0] === a && p[1] === b) || (p[0] === b && p[1] === a); });
      }
      if (v.tiaohe) return self.isTiaohe(v.tiaohe[0], v.tiaohe[1]);
      if (v.jianxiu) return cmp(self.staged(2).length, v.jianxiu);
      if (v.zhuxiu) return self.zhuxiu() === v.zhuxiu;
      return true;
    },
    fxop: function (v) {
      if (v.op === 'tiaohe' && v.pair) {
        var k = '_tiaohe_' + pkey(v.pair[0], v.pair[1]);
        if (!G.world.flags[k]) {
          G.world.flags[k] = true;
          G.log('你总算找到了能把这两条路说通的理由——身体里那场打了许久的架，停了。', '吉');
        }
        if (this.level() !== '逆冲' && this.level() !== '入魔') G.player.pflags['_nichong_seen'] = false;
      }
    }
  };

  // 入魔身死 → 跨世污染痕迹（rumo_zhe 恶名称号据此 autoCond）
  G.bus.on('life:death', function (payload) {
    if (payload && (payload.cause === '走火入魔' || payload.cause === '心魔噬身') && G.meta)
      G.meta.legacy['zouhuo_rumo_si'] = true;
  });
})();
