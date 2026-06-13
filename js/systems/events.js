// js/systems/events.js — 事件系统（契约 §8）。
// 权重公式：w = baseWeight × Π prefer 修正，封顶 baseWeight×6。
//   prefer.tend    {daoId: coef} → w *= 1 + tend×coef/100
//   prefer.locTags ["阴邪",...]  → 当前地点每命中一个 tag ×1.5
//   prefer.wvar    [{id,gte,boost}] → 条件满足 ×boost
// 每月环境事件概率 = 30% + 当前地点 danger×0.3%；eventQueue 到期必发（无视 cond）。
// 事件可选字段（契约 v1.1 扩展）：
//   queueOnly:true — 不进环境池/eventChance 池，只能被 eventNow/eventDelay 点名（顿悟、剧情钩子用）。
//   effects:[...]  — 无 choices 的事件用单个「继续」按钮结算这些效果。
(function () {
  'use strict';
  G.sys = G.sys || {};

  G.sys.events = {
    pending: [],   // 已触发待玩家处理的事件 id 队列（UI 一张张弹卡）

    // ---- 资格：硬门槛 ----
    eligible: function (def) {
      if (!def) return false;
      if (def.once && G.world.flags['_evdone_' + def.id]) return false;
      return G.cond(def.cond);
    },

    // ---- 权重（软偏好） ----
    weightOf: function (def) {
      var base = def.baseWeight != null ? def.baseWeight : 10;
      var w = base, p = G.player;
      if (def.prefer) {
        var pr = def.prefer;
        if (pr.tend) for (var d in pr.tend) w *= 1 + (p.tend[d] || 0) * pr.tend[d] / 100;
        if (pr.locTags) {
          var L = G.curLoc();
          if (L) pr.locTags.forEach(function (t) { if (L.tags.indexOf(t) >= 0) w *= 1.5; });
        }
        if (pr.wvar) pr.wvar.forEach(function (s) {
          var v = G.world.vars[s.id] || 0;
          var hit = (s.gte == null || v >= s.gte) && (s.lte == null || v <= s.lte);
          if (hit) w *= (s.boost || 1.5);
        });
      }
      return Math.min(w, base * 6);
    },

    // ---- 触发：进 pending 队列，由 pumpPending 弹卡 ----
    fire: function (id) {
      var def = G.get('event', id);
      if (!def) { console.warn('[EVENT] 触发未知事件:', id); return; }
      if (def.once && G.world.flags['_evdone_' + id]) return;
      G.world.flags['_evdone_' + id] = true;
      this.pending.push(id);
    },

    // ---- 延时安排（eventDelay op） ----
    schedule: function (id, months, note) {
      var w = G.world;
      // 去重：同一事件已在队列中则不重复排期（防止门槛失效时被反复塞入，如劫道散修连环拦路）
      for (var i = 0; i < w.eventQueue.length; i++) if (w.eventQueue[i].eventId === id) return;
      var m = w.month + (months || 1);
      var y = w.year;
      while (m > 12) { m -= 12; y++; }
      w.eventQueue.push({ eventId: id, dueY: y, dueM: m, note: note || '' });
    },

    // ---- 月末第 2 步：到期必发（无视 cond，once 标记照打） ----
    dueCheck: function () {
      var w = G.world, self = this;
      var due = [], rest = [];
      w.eventQueue.forEach(function (q) {
        if (q.dueY < w.year || (q.dueY === w.year && q.dueM <= w.month)) due.push(q);
        else rest.push(q);
      });
      w.eventQueue = rest;
      due.forEach(function (q) {
        var def = G.get('event', q.eventId);
        if (!def) { console.warn('[EVENT] eventQueue 中事件未注册:', q.eventId); return; }
        // dueCond：到期时再校验有效性（独立于 cond，仅供需要的剧情事件 opt-in）。
        // 失效则静默丢弃——例如「武馆之约」到期时大师兄已入仙门离镇，旧约自然作废。
        if (def.dueCond && !G.cond(def.dueCond)) return;
        G.world.flags['_evdone_' + q.eventId] = true;
        self.pending.push(q.eventId);
      });
    },

    // ---- 月末第 3 步：环境事件 roll ----
    envRoll: function () {
      var L = G.curLoc();
      var danger = L ? (L.danger || 0) : 0;
      if (!G.rng.chance(0.30 + danger * 0.003)) return;
      var self = this;
      var cands = G.all('event').filter(function (e) {
        return !e.queueOnly && self.eligible(e);
      });
      if (!cands.length) return;
      var picked = G.rng.weighted(cands, function (e) { return self.weightOf(e); });
      if (picked) this.fire(picked.id);
    },

    // ---- 事件卡渲染数据（UI 消费） ----
    cardData: function (id) {
      var def = G.get('event', id);
      if (!def) return null;
      var text = '';
      try { text = def.textFn ? def.textFn() : (def.text || ''); }
      catch (e) { console.error('[EVENT] textFn 异常:', id, e); }
      var choices = (def.choices || [])
        .map(function (c, i) { return { idx: i, text: c.text, def: c }; })
        .filter(function (c) { return G.cond(c.def.cond); }); // 不满足的整个选项隐藏，不解释
      return { id: id, def: def, title: def.title || '变故', text: text, choices: choices };
    },

    // ---- 玩家选择（choiceIdx 为原始 choices 下标；-1 = 无选项事件的「继续」） ----
    choose: function (choiceIdx) {
      var id = this.pending.shift();
      var def = G.get('event', id);
      if (!def) { this.pumpPending(); return; }
      if (choiceIdx === -1) {
        if (def.effects) G.fx(def.effects, { cause: def.title });
      } else {
        var ch = (def.choices || [])[choiceIdx];
        if (ch) {
          var alive = (ch.outcomes || []).filter(function (o) { return G.cond(o.cond); });
          var pick = G.rng.weighted(alive, function (o) { return o.weight || 1; });
          if (pick) G.fx(pick.effects, { cause: def.title });
        }
      }
      // 选择的效果可能开战（paused）或死亡；都各自接管流程
      if (!G.paused && !(G.player && G.player.dead)) {
        G.pump(); // 继续可能存在的队列（如闭关被打断后的剩余月份）
      }
      if (G.ui && G.ui.refresh) G.ui.refresh();
    },

    // ---- 把攒下的事件卡交给玩家 / autoplay 自动消化 ----
    pumpPending: function () {
      if (G.player && G.player.dead) { this.pending.length = 0; return; }
      if (G.combat) return; // 战斗收尾后会再来
      if (G._autoplay) {
        // autoplay：随机选项直接消化，直到清空（中途可能进战斗/死亡）
        var guard = 60;
        while (this.pending.length && guard-- > 0) {
          if (G.player.dead || G.combat) return;
          var card = this.cardData(this.pending[0]);
          if (!card) { this.pending.shift(); continue; }
          var pick = card.choices.length ? G.rng.pick(card.choices).idx : -1;
          this.choose(pick);
        }
        return;
      }
      if (this.pending.length) {
        if (G.ui) G.ui.setMode('event');
      } else if (G.ui && (G.ui.mode === 'event' || G.ui.mode === 'combat')) {
        G.ui.setMode('loc');
      }
    }
  };
})();
