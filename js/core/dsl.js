// js/core/dsl.js — 条件 DSL（G.cond，契约 §5）与效果 DSL（G.fx，契约 §6）的完整实现。
// 重要语义（内容 Agent 必读）：
//   1. 条件对象内多键为 AND；组合器 {all:[...]}/{any:[...]}/{not:{...}}。
//   2. 效果 = op 对象数组，顺序执行；玩家死亡后中断剩余效果。
//   3. {combat:{...}} 是「暂停型」op：进入战斗后，同一数组里它后面的 op 会被存为 afterFx，
//      等战斗（胜/逃/非致命败）结算完再执行。建议把 combat 放在效果数组末尾。
//   4. {timePass:{months:n}} 立即推进 n 个世界月（轻量 tick，不掷环境事件，到期事件照发）。
//   5. 扩展 op（契约 v1.1 登记）：daoAdvance / daoSuppress / healInjury；扩展 cond：kills。
(function () {
  'use strict';

  // ============ 状态访问小工具（全引擎共用） ============
  G.locState = function (id) { return (G.world && G.world.locations[id]) || null; };
  G.npcState = function (id) { return (G.world && G.world.npcs[id]) || null; };
  G.curLoc = function () { return G.player ? G.locState(G.player.location) : null; };
  G.itemCount = function (id) {
    if (!G.player) return 0;
    for (var i = 0; i < G.player.inventory.length; i++)
      if (G.player.inventory[i].id === id) return G.player.inventory[i].n;
    return 0;
  };
  G.addItem = function (id, n) {
    n = (n == null) ? 1 : n;
    var inv = G.player.inventory, i;
    for (i = 0; i < inv.length; i++) {
      if (inv[i].id === id) {
        inv[i].n += n;
        if (inv[i].n <= 0) inv.splice(i, 1);
        return;
      }
    }
    if (n > 0) inv.push({ id: id, n: n });
  };
  G.itemName = function (id) { var d = G.get('item', id); return d ? d.name : id; };
  G.ymText = function () { return G.world ? (G.world.year + '年' + G.world.month + '月') : ''; };
  // 本世年表（走马灯素材），只记关键事
  G.history = function (text) {
    if (!G.world) return;
    G.world.history.push({ ym: G.ymText(), text: text });
    if (G.world.history.length > 80) G.world.history.shift();
  };
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  G.clamp = clamp;

  // hp 增减统一入口：非战斗中扣到 0 → 直接死亡流程；战斗中由 combat.js 自己结算。
  G.applyHp = function (n, cause) {
    var p = G.player; if (!p || p.dead) return;
    p.hp = Math.min(p.maxHp, p.hp + n);
    if (p.hp <= 0) {
      p.hp = 0;
      if (G.combat && !G.combat.over) return; // 战斗内：交给 combat 判定败北
      G.sys.rein.die(cause || '伤重不治');
    }
  };

  // ============ 条件 DSL ============
  function cmp(val, spec) { // {gte, lte, eq} 可并存
    if (spec == null || typeof spec !== 'object') return val === spec;
    if (spec.gte != null && !(val >= spec.gte)) return false;
    if (spec.lte != null && !(val <= spec.lte)) return false;
    if (spec.eq != null && val !== spec.eq) return false;
    return true;
  }
  function num(v) { return (typeof v === 'number' && !isNaN(v)) ? v : 0; }

  G.cond = function (c, ctx) {
    if (c == null) return true;
    if (Array.isArray(c)) return c.every(function (x) { return G.cond(x, ctx); });
    var p = G.player, w = G.world, v, st;
    for (var k in c) {
      v = c[k];
      var ok = true;
      switch (k) {
        case 'all': ok = v.every(function (x) { return G.cond(x, ctx); }); break;
        case 'any': ok = v.some(function (x) { return G.cond(x, ctx); }); break;
        case 'not': ok = !G.cond(v, ctx); break;
        case 'loc': ok = p.location === v; break;
        case 'wvar': ok = cmp(num(w.vars[v.id]), v); break;
        case 'locvar': {
          var L = G.locState(v.loc);
          var val = L ? (typeof L[v.key] === 'number' ? L[v.key] : num((L.vars || {})[v.key])) : 0;
          ok = cmp(val, v);
        } break;
        // flag/noflag/pflag/nopflag 接受单个 id 或 id 数组（数组=全部满足，AND）。
        // 数组形式避免「同一对象写两个 noflag 键被 JS 静默去重」的隐患。
        case 'flag': ok = Array.isArray(v) ? v.every(function (x) { return !!w.flags[x]; }) : !!w.flags[v]; break;
        case 'noflag': ok = Array.isArray(v) ? v.every(function (x) { return !w.flags[x]; }) : !w.flags[v]; break;
        case 'pflag': ok = Array.isArray(v) ? v.every(function (x) { return !!p.pflags[x]; }) : !!p.pflags[v]; break;
        case 'nopflag': ok = Array.isArray(v) ? v.every(function (x) { return !p.pflags[x]; }) : !p.pflags[v]; break;
        case 'legacy': ok = !!(G.meta && G.meta.legacy[v]); break;
        // 道途余痕（spec §0.6）：前世道痕（carried.tendSeed，命数偏向，跨世留存且本世内不变），
        //   用于让 NPC/世界/敌人/异兽对你「似曾相识」。{daohen:{id:'leifa', gte:5}}
        case 'daohen': ok = cmp(num((G.meta && G.meta.carried && G.meta.carried.tendSeed || {})[v.id]), v); break;
        // 称号残响：前世名声。{echo:'titleId'}（曾得该称号）或 {echo:true}（曾名动一方）
        case 'echo': {
          var ec = (G.meta && G.meta.carried && G.meta.carried.echoes) || [];
          ok = (v === true) ? ec.length > 0 : ec.some(function (e) { return e.title === v; });
        } break;
        case 'tend': ok = cmp(num(p.tend[v.id]), v); break;
        case 'daoStage': ok = cmp(num(p.daoStage[v.id]), v); break;
        case 'stat': ok = cmp(num(p.stats[v.id]), v); break;
        case 'counter': ok = cmp(num(p.counters[v.id]), v); break;
        case 'kills': ok = cmp(num(p.pflags['_kills_' + v.id]), v); break; // 扩展：本世击杀数（引擎统计）
        case 'hpPct': ok = cmp(p.hp / Math.max(1, p.maxHp), v); break;
        case 'money': ok = cmp(p.money, v); break;
        case 'fame': ok = cmp(p.fame, v); break;
        case 'realm': ok = cmp(p.realmIdx, v); break;
        case 'age': ok = cmp(p.ageY, v); break;
        case 'season': ok = w.season === v; break;
        case 'weather': ok = w.weather === v; break;
        case 'monthIn': ok = v.indexOf(w.month) >= 0; break;
        case 'item': ok = G.itemCount(v.id) >= (v.n != null ? v.n : 1); break;
        case 'npcFav': st = G.npcState(v.id); ok = !!st && cmp(st.fav, v); break;
        case 'npcAlive': st = G.npcState(v); ok = !!st && st.alive; break;
        case 'npcDead': st = G.npcState(v); ok = !!st && !st.alive; break;
        case 'title': ok = p.titles.indexOf(v) >= 0; break;
        case 'mem': ok = p.memories.indexOf(v) >= 0; break;
        case 'birth': ok = p.birthId === v; break;
        case 'life': ok = cmp(p.lifeIndex, v); break;
        case 'bossAlive': ok = !w.flags['_bossdead_' + v]; break;
        case 'bossDead': ok = !!w.flags['_bossdead_' + v]; break;
        case 'insightConfirmed': {
          var entry = p.insights[v];
          ok = !!entry && entry.lines.some(function (l) { return l.confirmed; });
        } break;
        case 'chance': ok = G.rng.chance(v); break; // 仅用于 outcomes 分支
        case 'pet': ok = G.sys.beast.condop(v); break; // 驭兽条件，委托 beast.js（见其文件头 §C）
        case 'daoxin': ok = G.sys.daoxin.condop(v); break; // 道心冲突条件，委托 daoxin.js（见其文件头）
        default:
          console.warn('[DSL] 未知条件 op:', k);
          ok = true;
      }
      if (!ok) return false;
    }
    return true;
  };

  // ============ 效果 DSL ============
  G.fx = function (effects, ctx) {
    ctx = ctx || {};
    if (!effects) return;
    if (!Array.isArray(effects)) effects = [effects];
    for (var i = 0; i < effects.length; i++) {
      if (G.player && G.player.dead) return; // 死亡中断
      var op = effects[i];
      if (op == null) continue;
      if (op.combat) { // 暂停型：剩余 fx 挂到战斗后
        var rest = effects.slice(i + 1);
        G.sys.combat.start(Object.assign({}, op.combat, { afterFx: rest, cause: ctx.cause }));
        return;
      }
      fx1(op, ctx);
    }
  };

  function fx1(op, ctx) {
    var p = G.player, w = G.world, v, k, st;
    for (var key in op) {
      v = op[key];
      switch (key) {
        case 'log': G.log(v.t, v.style); break;
        case 'hp': G.applyHp(v, ctx.cause); break;
        case 'qi': p.qi = clamp(p.qi + v, 0, p.maxQi); break;
        case 'money': p.money = Math.max(0, p.money + v); break;
        case 'cult': {
          var gain = v;
          if (gain > 0 && p.injury.severity > 0) gain = Math.round(gain * (1 - 0.2 * p.injury.severity)); // 伤势压修炼
          p.cult = Math.max(0, p.cult + gain);
        } break;
        case 'fame': p.fame = Math.max(0, p.fame + v); break;
        case 'lifespanY':
          p.lifespan += v;
          if (p.lifespan <= p.ageY) { G.sys.rein.die('shouyuan'); return; }
          break;
        case 'statAdd':
          for (k in v) {
            p.stats[k] = Math.max(1, (p.stats[k] || 0) + v[k]);
            if (k === 'ti') { p.maxHp += 8 * v[k]; p.hp = clamp(p.hp + 8 * v[k], 1, p.maxHp); }
            if (k === 'shen') { p.maxQi += 5 * v[k]; }
          }
          break;
        case 'tendAdd': // 隐藏倾向唯一增长途径；绝不写可见文案
          for (k in v) p.tend[k] = clamp((p.tend[k] || 0) + v[k], 0, 150);
          break;
        case 'counterAdd':
          for (k in v) p.counters[k] = Math.max(0, (p.counters[k] || 0) + v[k]);
          break;
        case 'wvarAdd':
          for (k in v) G.sys.time.setWvar(k, num(w.vars[k]) + v[k]);
          break;
        case 'wvarSet':
          for (k in v) G.sys.time.setWvar(k, v[k]);
          break;
        case 'locvarAdd': {
          var L = G.locState(v.loc);
          if (L) {
            if (typeof L[v.key] === 'number') L[v.key] = clamp(L[v.key] + v.n, 0, 100);
            else L.vars[v.key] = num(L.vars[v.key]) + v.n;
          }
        } break;
        case 'bossSet': {
          w.flags['_bossdead_' + v.enemy] = (v.alive === false);
          G.all('location').forEach(function (ld) {
            if (ld.boss === v.enemy && w.locations[ld.id]) w.locations[ld.id].bossAlive = (v.alive !== false);
          });
        } break;
        case 'flagSet': w.flags[v.id] = (v.v !== false); break;
        case 'pflagSet': p.pflags[v.id] = (v.v !== false); break;
        case 'legacySet': G.meta.legacy[v.id] = (v.v !== false); break;
        case 'itemAdd':
          G.addItem(v.id, v.n == null ? 1 : v.n);
          G.log('获得【' + G.itemName(v.id) + '】×' + (v.n == null ? 1 : v.n) + '。', '吉');
          break;
        case 'itemDel':
          G.addItem(v.id, -(v.n == null ? 1 : v.n));
          G.log('失去【' + G.itemName(v.id) + '】×' + (v.n == null ? 1 : v.n) + '。', '平');
          break;
        case 'npcFavAdd':
          st = G.npcState(v.id);
          if (st) st.fav = clamp(st.fav + v.n, -100, 100);
          break;
        case 'npcSet':
          st = G.npcState(v.id);
          if (st) st[v.key] = v.v;
          break;
        case 'rumorAdd': G.sys.rumor.add(v.t, v.fame || 0); break;
        case 'titleAdd': G.sys.rumor.grantTitle(v); break;
        case 'memAdd': G.sys.rein.gainMemory(v); break;
        case 'insight': G.sys.dao.addInsight(v); break;
        case 'eventNow': G.sys.events.fire(v); break;
        case 'eventDelay': G.sys.events.schedule(v.id, v.months, v.note); break;
        case 'goto': {
          var Ld = G.locState(v);
          if (Ld) {
            Ld.discovered = true;
            p.location = v;
            var def = G.get('location', v);
            G.log('你来到' + (def ? def.name : v) + '。', '平');
          }
        } break;
        case 'revealLoc': {
          var Lr = G.locState(v);
          if (Lr && !Lr.discovered) {
            Lr.discovered = true;
            var defr = G.get('location', v);
            G.log('你得知了一处去处：' + (defr ? defr.name : v) + '。', '世界');
          }
        } break;
        case 'timePass':
          for (var m = 0; m < (v.months || 1); m++) {
            if (p.dead) return;
            G.sys.time.tick({ light: true });
          }
          break;
        case 'injure': {
          var sev = clamp(v.severity || 1, 1, 3);
          p.injury.months = Math.max(p.injury.months, v.months || 1);
          p.injury.severity = Math.max(p.injury.severity, sev);
          G.log(['你受了点伤，行动间隐隐作痛。', '你伤得不轻，需要将养些时日。', '你伤及根本，气血翻涌不止。'][sev - 1], '凶');
        } break;
        case 'healInjury': // 扩展：减轻伤势（止血散/疗伤药用）
          if (p.injury.months > 0) {
            p.injury.months = Math.max(0, p.injury.months - (v.months || 1));
            if (v.severity) p.injury.severity = Math.max(0, p.injury.severity - v.severity);
            if (p.injury.months <= 0) { p.injury.months = 0; p.injury.severity = 0; G.log('你的伤好得差不多了。', '吉'); }
          }
          break;
        case 'die': G.sys.rein.die(v.cause || '横死'); return;
        case 'branch':
          G.fx(G.cond(v.cond, ctx) ? v.then : (v['else'] || []), ctx);
          break;
        case 'roll':
          G.fx(G.rng.chance(v.chance) ? (v.success || []) : (v.fail || []), ctx);
          break;
        case 'daoAdvance': G.sys.dao.advance(v); break;   // 扩展：顿悟「纳之」
        case 'daoSuppress': G.sys.dao.suppress(v); break; // 扩展：顿悟「抑之」
        case 'pet': G.sys.beast.fxop(v); break;           // 驭兽效果，委托 beast.js（见其文件头 §B）
        case 'daoxin': G.sys.daoxin.fxop(v); break;       // 道心调和效果，委托 daoxin.js
        default:
          console.warn('[DSL] 未知效果 op:', key, op);
      }
      if (G.player && G.player.dead) return;
    }
  }
})();
