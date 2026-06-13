// js/systems/time.js — 月度 tick 主循环（契约 §12 权威实现）。
// 一次 tick = 一个月结束。调用方：actions.perform（行动结算后）、timePass op、G.debug.skipMonths。
// 顺序（§12）：1 行动结算(调用方已做) → 2 eventQueue 到期必发 → 3 环境事件 roll → 4 NPC 行动
// → 5 世界变量漂移+阈值 → 6 时间推进+天时刷新 → 7 道途阈值/突破检查 → 8 伤势丹毒心魔结算
// → 9 年龄寿元 → 10 自动存档 → 11 UI 刷新。
// opts.light=true（timePass 触发的附加月）：跳过第 3 步环境事件 roll，其余照常。
(function () {
  'use strict';
  G.sys = G.sys || {};

  // 天气表（契约 §12，按季抽）
  var WEATHER = {
    '春': [['晴', 0.5], ['雨', 0.3], ['雾', 0.15], ['雷雨', 0.05]],
    '夏': [['晴', 0.45], ['雨', 0.25], ['雷雨', 0.3]],
    '秋': [['晴', 0.6], ['雾', 0.2], ['雨', 0.2]],
    '冬': [['晴', 0.5], ['雪', 0.4], ['雾', 0.1]]
  };
  // 世界变量取值范围
  var WVAR_RANGE = {
    wolfThreat: [0, 100], villageFear: [0, 100], ghostQi: [0, 100],
    mineInstability: [0, 100], sectAttention: [0, 100], marketPrice: [40, 200]
  };

  function seasonOf(month) {
    if (month <= 3) return '春';
    if (month <= 6) return '夏';
    if (month <= 9) return '秋';
    return '冬';
  }

  function rollWeather(season) {
    var table = WEATHER[season] || WEATHER['春'];
    var picked = G.rng.weighted(table, function (x) { return x[1]; });
    return picked ? picked[0] : '晴';
  }

  G.sys.time = {
    setWvar: function (id, v) {
      var r = WVAR_RANGE[id] || [0, 100];
      G.world.vars[id] = Math.round(G.clamp(v, r[0], r[1]) * 10) / 10;
    },

    // ---- 主入口：一个月过去 ----
    tick: function (opts) {
      opts = opts || {};
      var p = G.player, w = G.world;
      if (!p || p.dead) return;

      // 2. eventQueue 到期必发
      G.sys.events.dueCheck();
      if (p.dead) return;

      // 3. 环境事件 roll（light 月跳过，避免 timePass 套娃）
      if (!opts.light) G.sys.events.envRoll();
      if (p.dead) return;

      // 4. NPC 月度行动
      G.sys.npc.monthly();
      if (p.dead) return;

      // 5. 世界变量漂移 + 阈值检查
      drift();
      thresholds();
      if (p.dead) return;

      // 6. 时间推进 + 天时刷新
      var yearWrapped = false;
      w.month++;
      if (w.month > 12) { w.month = 1; w.year++; yearWrapped = true; }
      w.season = seasonOf(w.month);
      w.weather = rollWeather(w.season);

      // 7. 道途阈值检查 + 境界突破检查
      G.sys.dao.checkProgress();
      tryBreakthrough();
      if (p.dead) return;

      // 8. 伤势 / 丹毒 / 心魔 / 血腥味 / 杀气 结算
      settleBody();
      if (p.dead) return;

      // 9. 年龄寿元
      if (yearWrapped) {
        p.ageY++;
        if (p.ageY >= p.lifespan) {
          G.log('灯尽油枯。你在' + (G.get('location', p.location) || {}).name + '阖上了眼。', '凶');
          G.sys.rein.die('shouyuan');
          return;
        }
        if (p.lifespan - p.ageY === 5) G.log('你鬓边见白，自觉时日无多了。', '世界');
      }

      // 9.5 称号自动检查（按 autoCond，月末与战后各查一次）
      G.sys.rumor.checkAutoTitles();

      // 10. 自动存档
      G.save.write(true);

      // 11. UI 刷新
      if (G.ui && G.ui.refresh) G.ui.refresh();
    }
  };

  // ---- 世界自漂移（契约 §12 基准） ----
  function drift() {
    var w = G.world, T = G.sys.time;
    T.setWvar('wolfThreat', w.vars.wolfThreat + 1.5);               // 狼患自涨；狩猎类行动/老猎户会压
    var xieyingAlive = !w.flags['_bossdead_shanmiao_xieying'];
    T.setWvar('ghostQi', w.vars.ghostQi + (xieyingAlive ? 1 : -0.5)); // 邪影在世阴气积累
    T.setWvar('mineInstability', w.vars.mineInstability + 0.8);
    T.setWvar('marketPrice', G.clamp(w.vars.marketPrice + G.rng.int(-8, 8), 70, 150)); // 随机游走
    // 恐慌跟随狼患（缓动）
    var target = w.vars.wolfThreat * 0.6;
    T.setWvar('villageFear', w.vars.villageFear + (target - w.vars.villageFear) * 0.2);
    T.setWvar('sectAttention', w.vars.sectAttention - 0.5);          // 仙门关注缓慢衰减
  }

  // ---- 阈值事件（契约 §12）：事件已注册则发事件（C3 范畴），否则引擎给保底世界反应 ----
  function thresholds() {
    var w = G.world;
    thr('wolfThreat', 80, 60, '_thr_wolf', 'ev_langhuo_xiashan', function () {
      G.log('黑山的狼下山了。青石镇外围的家畜一夜之间没了大半。', '世界');
      G.sys.time.setWvar('villageFear', w.vars.villageFear + 20);
      G.sys.time.setWvar('wolfThreat', 70);
      G.sys.rumor.add('狼下山了，夜里别出门。', 0);
    });
    thr('mineInstability', 90, 60, '_thr_mine', 'ev_kuangdong_tafang', function () {
      G.log('远处闷响，废弃矿洞又塌了一截。', '世界');
      if (w.locations.feikuang) w.locations.feikuang.danger = G.clamp(w.locations.feikuang.danger + 15, 0, 100);
      G.sys.time.setWvar('mineInstability', 55);
    });
    thr('ghostQi', 80, 55, '_thr_ghost', 'ev_miaozhong_yidong', function () {
      G.log('山神庙方向夜里有呜咽声，香客都绕着走了。', '世界');
      if (w.locations.shanshenmiao) w.locations.shanshenmiao.corruption = G.clamp(w.locations.shanshenmiao.corruption + 10, 0, 100);
      G.sys.time.setWvar('ghostQi', 65);
    });
  }
  // 越阈一次性触发；回落到 resetBelow 以下后解锁，可再次触发
  function thr(varId, level, resetBelow, flagId, eventId, fallback) {
    var w = G.world;
    if (w.vars[varId] >= level && !w.flags[flagId]) {
      w.flags[flagId] = true;
      if (G.get('event', eventId)) G.sys.events.fire(eventId);
      else fallback();
    } else if (w.vars[varId] < resetBelow && w.flags[flagId]) {
      w.flags[flagId] = false;
    }
  }

  // ---- 境界突破（契约 §16 公式）：修为攒满自动尝试 ----
  function tryBreakthrough() {
    var p = G.player;
    if (p.realmIdx >= G.BAL.cultNeed.length) return;       // 已是筑基（本界顶）
    if (p.cult < p.cultNeed) return;
    var pSucc = 0.9 - p.counters.dandu * 0.004 - p.injury.severity * 0.1 - p.counters.xinmo * 0.003;
    pSucc = G.clamp(pSucc, 0.05, 0.95);
    if (G.rng.chance(pSucc)) {
      p.cult -= p.cultNeed;
      p.realmIdx++;
      p.cultNeed = p.realmIdx < G.BAL.cultNeed.length ? G.BAL.cultNeed[p.realmIdx] : Infinity;
      p.lifespan = Math.max(p.lifespan, G.BAL.lifespan[p.realmIdx]);
      p.maxHp += 14 + p.stats.ti * 2;
      p.hp = p.maxHp;
      p.maxQi += 12;
      p.qi = p.maxQi;
      var rn = G.IDS.realms[p.realmIdx];
      G.log('一线灵机自天灵贯入四肢百骸——你踏入了【' + rn + '】。', '突破');
      G.history('突破至' + rn);
      G.bus.emit('realm:up', { realmIdx: p.realmIdx });
      if (p.realmIdx >= 2) {
        G.sys.rumor.add('听说镇上有人引气入体，走上仙途了。', 3);
        G.sys.time.setWvar('sectAttention', G.world.vars.sectAttention + 8);
      }
    } else {
      // 突破失败三种代价：受伤 / 丹毒爆发 / 修为小退
      var roll = G.rng.int(1, 3);
      if (roll === 1 || p.counters.dandu < 10) {
        G.log('灵气走岔，你闷哼一声跌坐于地，喉头泛起血腥。', '凶');
        G.fx([{ injure: { months: 2, severity: 2 } }]);
      } else if (roll === 2) {
        G.log('积年的丹毒在冲关时炸开，你五内如焚。', '丹');
        G.applyHp(-Math.round(G.player.maxHp * 0.25), '丹毒反噬');
        p.counters.dandu = Math.max(0, p.counters.dandu - 15);
      } else {
        p.cult = Math.max(0, Math.round(p.cult * 0.85));
        G.log('关隘如铁。气机溃散，数月苦功付诸流水。', '凶');
      }
    }
  }

  // ---- 月度身体结算 ----
  function settleBody() {
    var p = G.player, c = p.counters;
    if (p.injury.months > 0) {
      p.injury.months--;
      if (p.injury.months <= 0) {
        p.injury.months = 0; p.injury.severity = 0;
        G.log('将养多日，伤处终于不再渗血。', '吉');
      }
    }
    c.dandu = Math.max(0, Math.round((c.dandu - 0.5) * 10) / 10);
    c.xuexing = Math.max(0, c.xuexing - 1);
    c.shaqi = Math.max(0, Math.round((c.shaqi - 0.5) * 10) / 10);
    c.xinmo = Math.max(0, Math.round((c.xinmo - 0.3) * 10) / 10);
    // 不在战斗的月份缓慢回血回灵
    if (p.hp < p.maxHp) p.hp = Math.min(p.maxHp, p.hp + Math.max(1, Math.round(p.stats.ti * 0.8)));
    if (p.qi < p.maxQi) p.qi = Math.min(p.maxQi, p.qi + 1 + Math.round(p.stats.shen * 0.5));
  }
})();
