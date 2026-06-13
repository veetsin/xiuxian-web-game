// js/main.js — 启动入口 + G.game（新游戏/续档/重开）+ G.debug（契约 §14）。
(function () {
  'use strict';

  G.game = {
    newGame: function () {
      G.meta = G.newMeta();
      G.logBuffer = [];
      G.sys.events.pending = [];
      G.sys.rein.newLife(); // → 出生卡屏（autoplay 时直接入世）
    },
    continueGame: function () {
      if (G.save.read()) {
        G.ui.mode = 'loc';
        G.ui.refresh();
        G.log('你续上了前缘。', '世界');
      } else {
        G.ui.toast('存档无法读取。');
      }
    }
  };

  // ================= G.debug（契约 §14 全量） =================
  G.debug = {
    _collect: null,

    state: function () { return { world: G.world, player: G.player, meta: G.meta }; },

    give: function (itemId, n) { G.fx([{ itemAdd: { id: itemId, n: n || 1 } }]); G.ui.refresh(); },
    tend: function (daoId, n) { G.fx([{ tendAdd: (function () { var o = {}; o[daoId] = n; return o; })() }]); },
    money: function (n) { G.fx([{ money: n }]); G.ui.refresh(); },
    goto: function (locId) { G.fx([{ goto: locId }]); G.ui.refresh(); },
    startCombat: function (enemyId) { G.fx([{ combat: { enemy: enemyId } }]); },

    kill: function () { G.sys.rein.die('debug'); },
    reincarnate: function () {
      if (!G.player.dead) G.sys.rein.die('debug');
      if (G.player.dead && G.ui.mode === 'liminal') { /* 等玩家点；或直接 complete */ }
      if (G.player.dead) G.sys.rein.complete();
    },
    skipMonths: function (n) {
      for (var i = 0; i < (n || 1); i++) {
        if (!G.player || G.player.dead) break;
        G.sys.time.tick({});
        // 跳月时把弹出的事件按「随机选项」消化掉，避免卡 UI
        var guard = 20;
        while (G.sys.events.pending.length && guard-- > 0 && !G.player.dead && !G.combat) {
          var card = G.sys.events.cardData(G.sys.events.pending[0]);
          if (!card) { G.sys.events.pending.shift(); continue; }
          G.sys.events.choose(card.choices.length ? G.rng.pick(card.choices).idx : -1);
        }
      }
      G.ui.refresh();
    },

    validate: function () { return G.validate.run(); },

    // ---- 集成测试主力：自动随机玩 n 个月 ----
    // 随机行动、随机事件选项、战斗简单 AI（combat.js autoFight：有技能用技能/低血逃/否则攻击）、
    // 死亡自动轮回继续。全程 try/catch，返回 {monthsPlayed, deaths, fights, errors:[]}。
    autoplay: function (months) {
      months = months || 12;
      var summary = { monthsPlayed: 0, deaths: 0, fights: 0, errors: [] };
      G.debug._collect = summary;
      G._autoplay = true;
      try {
        // 没开局就自动开局
        if (!G.player || !G.world) {
          try { G.game.newGame(); } catch (e0) { summary.errors.push('newGame: ' + String(e0 && e0.stack || e0)); }
        }
        for (var m = 0; m < months; m++) {
          try {
            if (!G.player) break;
            if (G.player.dead) { G.sys.rein.complete(); continue; } // complete 在 autoplay 下直达入世
            // 清掉残留事件卡（autoplay 下 pumpPending 自动随机消化）
            G.sys.events.pumpPending();
            if (G.player.dead) continue;
            if (G.combat) { G.sys.combat.close(); } // 不应出现：保险
            // 随机挑一个可用行动；没有就原地虚度一月
            var acts = G.sys.actions.available();
            if (acts.length) {
              // 偶尔随机移动换换地图
              if (G.rng.chance(0.25)) {
                var locs = G.IDS.locations.filter(function (id) {
                  var st = G.locState(id);
                  return st && st.discovered && id !== G.player.location;
                });
                if (locs.length) G.sys.actions.travel(G.rng.pick(locs));
                acts = G.sys.actions.available();
              }
              if (acts.length) G.sys.actions.perform(G.rng.pick(acts).id);
              else G.sys.time.tick({});
            } else {
              G.sys.time.tick({});
            }
            summary.monthsPlayed++;
          } catch (e) {
            summary.errors.push('month ' + m + ': ' + String(e && e.stack || e));
            // 防错误态死循环：出错的这个月强行收尾
            try { if (G.combat) { G.combat.over = true; G.combat.result = 'flee'; G.sys.combat.close(); } } catch (e2) { /* 忽略 */ }
            try { G.sys.events.pending.length = 0; G.paused = false; if (G.queue) G.queue.length = 0; } catch (e3) { /* 忽略 */ }
          }
        }
      } finally {
        G._autoplay = false;
        G.debug._collect = null;
        try { G.ui.refresh(); } catch (e4) { /* 忽略 */ }
      }
      console.log('[AUTOPLAY]', JSON.stringify({
        monthsPlayed: summary.monthsPlayed, deaths: summary.deaths,
        fights: summary.fights, errorCount: summary.errors.length
      }));
      if (summary.errors.length) console.warn('[AUTOPLAY] errors:', summary.errors);
      return summary;
    }
  };

  // ================= 启动 =================
  window.addEventListener('load', function () {
    G.ui.skeleton();
    G.ui.setMode('start'); // 开屏：有存档显示「续前缘」
  });
})();
