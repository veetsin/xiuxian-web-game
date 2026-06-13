// js/systems/birth.js — 出生抽取与开局（契约 §11）。
// 抽取权重 = (def.weight||10) × Π affinity 修正；affinity 修正 = 1 + (affinity[dao]−1) × min(1, tendSeed[dao]/20)。
// 即：前世某道倾向蒸馏的种子越满（上限20），亲和出生越容易被抽中；第一世无种子时各出生只按基础权重。
(function () {
  'use strict';
  G.sys = G.sys || {};

  var SURNAMES = ['石', '陈', '周', '苏', '黎', '燕', '秦', '阮'];
  var GIVEN = ['岩', '七', '安', '拙', '回', '野', '声', '冬'];

  G.sys.birth = {
    // 出生抽取（不应用，只返回 id）
    roll: function () {
      var births = G.all('birth');
      if (!births.length) { console.error('[BIRTH] 没有注册任何出生！'); return null; }
      var seed = (G.meta && G.meta.carried.tendSeed) || {};
      var picked = G.rng.weighted(births, function (b) {
        var w = b.weight || 10;
        if (b.affinity) {
          for (var d in b.affinity) {
            var s = seed[d] || 0;
            w *= 1 + (b.affinity[d] - 1) * Math.min(1, s / 20);
          }
        }
        return w;
      });
      return picked ? picked.id : births[0].id;
    },

    // 把出生应用到 G.player（player 须已由 newPlayer 创建、tendSeed 已注入）
    apply: function (birthId) {
      var def = G.get('birth', birthId);
      var p = G.player;
      if (!def) { console.error('[BIRTH] 未知出生:', birthId); return; }
      p.birthId = birthId;
      p.name = G.rng.pick(SURNAMES) + G.rng.pick(GIVEN);
      p.ageY = def.ageY0 != null ? def.ageY0 : 12;
      p.location = def.startLoc || 'qingshizhen';
      var L = G.locState(p.location); if (L) L.discovered = true;
      p.money = def.money || 0;

      // 属性 = base ± float(0..statsFloat)
      var f = def.statsFloat || 0;
      G.IDS.stats.forEach(function (s) {
        var base = (def.statsBase && def.statsBase[s]) != null ? def.statsBase[s] : 3;
        p.stats[s] = Math.max(1, base + (f ? G.rng.int(-f, f) : 0));
      });
      // 衍生
      p.maxHp = 40 + p.stats.ti * 8;
      p.hp = p.maxHp;
      p.maxQi = 10 + p.stats.shen * 5;
      p.qi = Math.round(p.maxQi * 0.5);

      // ── 时间影响（出生的第三根轴，除属性/道途外）──
      //   startMonth：这一世从哪个月（哪一季）起步 → 决定开局天时与早期季节事件，
      //     借此把出身与道途绑定（雷法子生于雷雨夏、寒冰子生于雪冬、御剑子生于春…）。
      //   lifespanMod：先天寿元增减（病弱减、根骨壮者增）→ 改变这一世的时间压力。
      if (def.startMonth != null) {
        var sm = G.clamp(def.startMonth, 1, 12);
        G.world.month = sm;
        G.world.season = sm <= 3 ? '春' : sm <= 6 ? '夏' : sm <= 9 ? '秋' : '冬';
      }
      if (def.lifespanMod) p.lifespan = Math.max(20, p.lifespan + def.lifespanMod);

      (def.items || []).forEach(function (it) { G.addItem(it.id, it.n || 1); });
      if (def.npcFav) {
        for (var n in def.npcFav) {
          var st = G.npcState(n);
          if (st) st.fav = def.npcFav[n];
        }
      }
      p.traits = (def.traits || []).slice();

      // 命签：三签抽一，存给出生卡与开局日志
      if (def.mingqian && def.mingqian.length) p.pflags._mingqian = G.rng.pick(def.mingqian);

      // 开局钩子由 enterLife 在「睁眼」时立即触发（见 reincarnation.enterLife）——
      // 不再走 eventDelay，否则要等两次月度推进才弹，开场身世剧情会姗姗来迟。

      if (def.startEffects && def.startEffects.length) G.fx(def.startEffects, { cause: '出生' });

      G.history('生于' + (G.get('location', p.location) || {}).name + '，是为' + def.name);
    }
  };
})();
