// js/systems/actions.js — 行动系统（契约 §7）+ 行动→月末的执行管线。
// 管线说明（autoplay 与战斗暂停都依赖它，改动请慎重）：
//   perform(id) 把 [必然效果 → outcomes 抽一 → eventChance → N 次月末 tick] 压入 G.queue，
//   然后 G.pump() 顺序执行。combat 会置 G.paused=true 暂停队列，战斗收尾时恢复并继续。
//   全部任务跑完后 events.pumpPending() 负责把攒下的事件卡弹给玩家。
(function () {
  'use strict';
  G.sys = G.sys || {};

  // ---- 执行队列 ----
  G.queue = [];
  G.paused = false;
  G.pump = function () {
    while (!G.paused && G.queue.length) {
      if (G.player && G.player.dead) { G.queue.length = 0; break; }
      var task = G.queue.shift();
      try { task(); }
      catch (e) {
        console.error('[QUEUE] 任务异常:', e);
        if (G.debug && G.debug._collect) G.debug._collect.errors.push(String(e && e.stack || e));
      }
    }
    if (G.player && G.player.dead) { G.queue.length = 0; return; }
    if (!G.paused && !G.queue.length) G.sys.events.pumpPending();
  };

  G.sys.actions = {
    // 当前可见行动：loc 匹配（或 loc:null 任意地点）+ cond 满足 + 重伤过滤，按 order 排序
    available: function () {
      var p = G.player;
      if (!p || p.dead) return [];
      return G.all('action').filter(function (a) {
        if (a.loc != null && a.loc !== p.location) return false;
        if (p.injury.severity >= 2 && (a.risk || 0) >= 2) return false; // 重伤干不了搏命的事
        return G.cond(a.cond);
      }).sort(function (a, b) { return (a.order || 50) - (b.order || 50); });
    },

    // 执行一个主行动（UI / autoplay 入口）
    perform: function (id) {
      var p = G.player;
      if (!p || p.dead || G.combat || G.sys.events.pending.length) return false;
      var a = G.get('action', id);
      if (!a) { console.warn('[ACTION] 未知行动:', id); return false; }

      // 1) 必然效果
      G.queue.push(function () {
        if (a.effects && a.effects.length) G.fx(a.effects, { cause: a.name });
      });
      // 2) outcomes：剔除 cond 不满足的，按权重抽一
      G.queue.push(function () {
        if (!a.outcomes || !a.outcomes.length) return;
        var alive = a.outcomes.filter(function (o) { return G.cond(o.cond); });
        var pick = G.rng.weighted(alive, function (o) { return o.weight || 1; });
        if (pick) G.fx(pick.effects, { cause: a.name });
      });
      // 3) 行动后定向事件
      G.queue.push(function () {
        var ec = a.eventChance;
        if (!ec || !ec.pool || !ec.pool.length) return;
        if (!G.rng.chance(ec.p != null ? ec.p : 0.3)) return;
        var cands = ec.pool
          .map(function (eid) { return G.get('event', eid); })
          .filter(function (e) { return e && G.sys.events.eligible(e); });
        var picked = G.rng.weighted(cands, function (e) { return G.sys.events.weightOf(e); });
        if (picked) G.sys.events.fire(picked.id);
      });
      // 4) 月末 tick × timeCost
      var months = Math.max(1, a.timeCost || 1);
      for (var m = 0; m < months; m++) {
        (function (idx) {
          G.queue.push(function () { G.sys.time.tick(idx > 0 ? { light: true } : {}); });
        })(m);
      }

      G.pump();
      if (G.ui && G.ui.refresh) G.ui.refresh();
      return true;
    },

    // 地图点击移动（不耗月；战斗/事件中禁止）
    travel: function (locId) {
      var p = G.player;
      if (!p || p.dead || G.combat || G.sys.events.pending.length) return false;
      var L = G.locState(locId);
      if (!L || !L.discovered || p.location === locId) return false;
      p.location = locId;
      var def = G.get('location', locId);
      G.log('你动身去了' + (def ? def.name : locId) + '。', '平');
      if (G.ui && G.ui.refresh) G.ui.refresh();
      return true;
    },

    // 行囊使用消耗品（不耗月）
    useItem: function (itemId) {
      var d = G.get('item', itemId);
      if (!d || d.type !== 'consumable' || G.itemCount(itemId) <= 0) return false;
      if (G.player.dead) return false;
      G.addItem(itemId, -1);
      G.log('你用了【' + d.name + '】。', '平');
      if (d.use) G.fx(d.use, { cause: d.name });
      if (G.ui && G.ui.refresh) G.ui.refresh();
      return true;
    }
  };
})();
