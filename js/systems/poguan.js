// js/systems/poguan.js — 境界成长与破关体验（spec §0.5.1）。
// 修为满 ≠ 自动破境。cult 满只是「气满关未开」→ 入瓶颈；真正破境，是玩家在某个契机下「选破法」冲关的事件。
// 流程：积修为(cult 增) → 入瓶颈(cult 满，_pingjing) → 求契机(内容事件/地点/天时) → 选破法(内容选项) → 结因果(realmUp / 失败留痕)。
// 本系统提供：瓶颈检测、六破法成功率、破境结算 realmUp、{poguan} 效果 DSL、{pingjing} 条件、月度瓶颈征兆。
//
// ── 给破关内容的接口 ──
// 条件 {pingjing:true}（气满关未开，可冲关）/ {pingjing:false}（未到瓶颈）。
// 效果 {poguan:{method:'wengu'|'jiedan'|'jieshi'|'yamo'|'wudao'|'qiangxing', onSucc:[...], onFail:[...]}}：
//   引擎按破法算成功率(+道心/丹毒/伤势/地势/道途积累修正)、掷骰、施破法专属破前代价；
//   成功→realmUp()(境界+1/属性/寿元/realm:up/默认传闻+仙门关注) + 破法专属奖励 + 内容 onSucc；
//   失败→强行/压心魔遇逆冲可走火入魔致死；否则「身上命里多一道裂」+ 内容 onFail（道基裂痕/退修/救命债/偏门），不自动重试。
// 六破法（spec §3 破关方式范式）：稳固根基稳而慢 / 借丹快但积丹毒 / 借地势看灵气 / 压心魔险但稳道心 /
//   顺势悟道靠道途积累 / 强行破关高失败高反噬。
(function () {
  'use strict';
  G.sys = G.sys || {};

  var METHOD_BASE = { wengu: 0.85, jiedan: 0.72, jieshi: 0.68, yamo: 0.60, wudao: 0.50, qiangxing: 0.38 };

  G.sys.poguan = {
    atBottleneck: function () {
      var p = G.player;
      return !!p && !p.dead && p.realmIdx < G.BAL.cultNeed.length && p.cult >= p.cultNeed;
    },

    chance: function (method) {
      var p = G.player;
      var c = METHOD_BASE[method] != null ? METHOD_BASE[method] : 0.6;
      c -= p.counters.dandu * 0.004 + p.injury.severity * 0.1 + p.counters.xinmo * 0.003;
      var conf = G.sys.daoxin.activeConflicts().length;
      c -= conf * 0.08;                                   // 道心逆冲未调和 → 冲关更险
      if (method === 'jieshi') { var L = G.curLoc(); c += (L ? (L.spiritualEnergy || 0) : 0) * 0.006; } // 借地势看灵气
      if (method === 'wudao') {                            // 顺势悟道：道途积累（confirmed 悟道行）
        var ins = 0; for (var k in p.insights) ins += p.insights[k].lines.filter(function (l) { return l.confirmed; }).length;
        c += ins * 0.04;
        if (G.sys.daoxin.staged(2).length === 0) c -= 0.25; // 无已命名道，难顺势开关
      }
      return G.clamp(c, 0.05, 0.97);
    },

    // 破境结算（成功）——原 time.js 自动突破的成功块抽到这里
    realmUp: function () {
      var p = G.player;
      if (p.realmIdx >= G.BAL.cultNeed.length) return null;
      p.cult = Math.max(0, p.cult - p.cultNeed);
      p.realmIdx++;
      p.cultNeed = p.realmIdx < G.BAL.cultNeed.length ? G.BAL.cultNeed[p.realmIdx] : Infinity;
      p.lifespan = Math.max(p.lifespan, G.BAL.lifespan[p.realmIdx]);
      p.maxHp += 14 + p.stats.ti * 2; p.hp = p.maxHp;
      p.maxQi += 12; p.qi = p.maxQi;
      p.pflags['_pingjing'] = false;                       // 关已破
      var rn = G.IDS.realms[p.realmIdx];
      G.log('一线灵机自天灵贯入四肢百骸——你踏入了【' + rn + '】。', '突破');
      G.history('破境至' + rn);
      G.bus.emit('realm:up', { realmIdx: p.realmIdx });
      if (p.realmIdx >= 2) {                               // 默认世界回收（更细的回收由 §0.5 境界改写世界 + 破关内容承接）
        G.sys.rumor.add('听说镇上有人破了境，走上仙途了。', 3);
        G.sys.time.setWvar('sectAttention', G.world.vars.sectAttention + 8);
      }
      return rn;
    },

    // 月度瓶颈征兆（time.js 调）：不自动破，只给「气满关未开」的体感
    monthly: function () {
      var p = G.player; if (!p || p.dead) return;
      if (!this.atBottleneck()) { if (p.pflags['_pingjing']) p.pflags['_pingjing'] = false; return; }
      if (!p.pflags['_pingjing']) {
        p.pflags['_pingjing'] = true;
        G.log('修为已满，气机在四肢百骸里胀得发疼——可那道关，迟迟不开。气满，而关未开。', '突破');
      } else if (G.rng.chance(0.22)) {
        G.log(G.rng.pick([
          '夜里又梦见一道推不开的门，门后有光。',
          '静坐时气机自己冲撞关隘，撞得你眉心生疼。',
          '镇上的灵物、阴影、香火，今日都对你这满而未发的气，有了反应。'
        ]), '因果');
      }
    },

    // ---- DSL 委托 ----
    condop: function (v) {
      if (v === false) return !this.atBottleneck();
      return this.atBottleneck();
    },
    fxop: function (v) {
      var p = G.player, method = v.method || 'wengu';
      if (!this.atBottleneck()) { G.log('气未满，关无从破。', '平'); return; }
      if (method === 'jiedan') p.counters.dandu = Math.min(100, p.counters.dandu + 8);  // 借丹积毒（破前代价）
      if (method === 'yamo') p.counters.xinmo = Math.min(100, p.counters.xinmo + 6);     // 压心魔（破前代价）
      var conf = G.sys.daoxin.activeConflicts().length;
      if (G.rng.chance(this.chance(method))) {
        this.realmUp();
        if (method === 'yamo') { p.counters.xinmo = Math.max(0, p.counters.xinmo - 14); G.log('你以一身执念把那道关生生顶开，回头时，心反倒静了。', '吉'); }
        if (method === 'wudao' && G.sys.dao.addInsight) G.sys.dao.addInsight({ id: 'poguan_wudao', title: '破境之悟', t: '原来这道关，从来是道自己开的。', confirm: true });
        G.fx(v.onSucc || [], { cause: '破关' });
      } else {
        if ((method === 'qiangxing' || method === 'yamo') && (conf > 0 || p.counters.xinmo >= 45) && G.rng.chance(0.3 + conf * 0.1)) {
          G.log('你硬顶着那道关往前撞，撞碎的却是自己——气机逆冲，走火入魔。', '凶');
          G.sys.rein.die('走火入魔'); return;
        }
        G.log('关隘如铁，你这一冲没能开门——身上、命里，却都多了一道裂。', '凶');
        G.fx((v.onFail && v.onFail.length) ? v.onFail : [{ injure: { months: 2, severity: 2 } }], { cause: '破关失败' });
      }
    }
  };
})();
