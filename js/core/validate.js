// js/core/validate.js — 交叉引用验证器（契约 §14）。window load 后自动跑一遍；G.debug.validate() 可重跑。
// 扫描全部注册内容里的 id 引用（item/enemy/event/memory/npc/title/dao/location/birth），
// 缺失逐条 console.warn('[VALIDATE] ...')，最后 console.log('[VALIDATE] done, N issues')。
(function () {
  'use strict';
  G.validate = { run: run };

  var issues;
  function warn(msg) { issues++; console.warn('[VALIDATE] ' + msg); }

  function has(kind, id) { return !!G.get(kind, id); }
  function ck(kind, id, where) {
    if (id == null) return;
    if (!has(kind, id)) warn(where + ' 引用了不存在的 ' + kind + ':「' + id + '」');
  }
  function ckLoc(id, where) {
    if (id == null) return;
    if (G.IDS.locations.indexOf(id) < 0) warn(where + ' 引用了不在 ids.js 的地点:「' + id + '」');
    if (!has('location', id)) warn(where + ' 地点未注册:「' + id + '」');
  }
  function ckDao(id, where) {
    if (G.IDS.daos.indexOf(id) < 0) warn(where + ' 引用了不在 ids.js 的道途:「' + id + '」');
  }
  function ckWvar(id, where) {
    if (G.IDS.wvars.indexOf(id) < 0) warn(where + ' 引用了未知世界变量:「' + id + '」');
  }
  function ckStyle(s, where) {
    if (s && G.IDS.logStyles.indexOf(s) < 0) warn(where + ' 使用了未知日志 style:「' + s + '」');
  }

  // ---- 条件遍历 ----
  function walkCond(c, where) {
    if (c == null) return;
    if (Array.isArray(c)) { c.forEach(function (x) { walkCond(x, where); }); return; }
    for (var k in c) {
      var v = c[k];
      switch (k) {
        case 'all': case 'any': v.forEach(function (x) { walkCond(x, where); }); break;
        case 'not': walkCond(v, where); break;
        case 'loc': ckLoc(v, where); break;
        case 'wvar': ckWvar(v.id, where); break;
        case 'locvar': ckLoc(v.loc, where); break;
        case 'tend': case 'daoStage': case 'daohen': ckDao(v.id, where); break; // daohen=前世道痕
        case 'echo': if (v !== true) ck('title', v, where); break;             // 称号残响
        case 'stat': if (G.IDS.stats.indexOf(v.id) < 0) warn(where + ' 未知属性:' + v.id); break;
        case 'counter': if (G.IDS.counters.indexOf(v.id) < 0) warn(where + ' 未知累积量:' + v.id); break;
        case 'kills': ck('enemy', v.id, where); break;
        case 'item': ck('item', v.id, where); break;
        case 'npcFav': ck('npc', v.id, where); break;
        case 'npcAlive': case 'npcDead': ck('npc', v, where); break;
        case 'title': ck('title', v, where); break;
        case 'mem': ck('memory', v, where); break;
        case 'birth': ck('birth', v, where); break;
        case 'bossAlive': case 'bossDead': ck('enemy', v, where); break;
        case 'season': if (G.IDS.seasons.indexOf(v) < 0) warn(where + ' 未知季节:' + v); break;
        case 'weather': if (G.IDS.weathers.indexOf(v) < 0) warn(where + ' 未知天气:' + v); break;
        case 'pet': if (v && v.species) ck('beastlore', v.species, where + '.pet'); break; // 驭兽条件
        case 'daoxin': // 道心条件：conflict/zhuxiu/tiaohe 引用的道 id
          if (v) {
            (v.conflict || v.tiaohe || []).forEach(function (d) { ckDao(d, where + '.daoxin'); });
            if (v.zhuxiu) ckDao(v.zhuxiu, where + '.daoxin');
          }
          break;
      }
    }
  }

  // ---- 效果遍历（递归 branch/roll/combat 嵌套） ----
  function walkFx(effects, where) {
    if (!effects) return;
    if (!Array.isArray(effects)) { warn(where + ' effects 不是数组'); return; }
    effects.forEach(function (op) {
      if (op == null || typeof op !== 'object') { warn(where + ' 含非法 op'); return; }
      for (var k in op) {
        var v = op[k];
        switch (k) {
          case 'log': ckStyle(v.style, where); break;
          case 'tendAdd': for (var d in v) ckDao(d, where); break;
          case 'counterAdd': for (var c2 in v) if (G.IDS.counters.indexOf(c2) < 0) warn(where + ' 未知累积量:' + c2); break;
          case 'statAdd': for (var s2 in v) if (G.IDS.stats.indexOf(s2) < 0) warn(where + ' 未知属性:' + s2); break;
          case 'wvarAdd': case 'wvarSet': for (var wv in v) ckWvar(wv, where); break;
          case 'locvarAdd': ckLoc(v.loc, where); break;
          case 'bossSet': ck('enemy', v.enemy, where); break;
          case 'itemAdd': case 'itemDel': ck('item', v.id, where); break;
          case 'npcFavAdd': case 'npcSet': ck('npc', v.id, where); break;
          case 'titleAdd': ck('title', v, where); break;
          case 'memAdd': ck('memory', v, where); break;
          case 'eventNow': ck('event', v, where); break;
          case 'eventDelay': ck('event', v.id, where); break;
          case 'goto': case 'revealLoc': ckLoc(v, where); break;
          case 'daoAdvance': case 'daoSuppress': ckDao(v, where); break;
          case 'combat':
            ck('enemy', v.enemy, where);
            walkFx(v.onWin, where + '.combat.onWin');
            walkFx(v.onLose, where + '.combat.onLose');
            walkFx(v.onFlee, where + '.combat.onFlee');
            break;
          case 'branch':
            walkCond(v.cond, where + '.branch');
            walkFx(v.then, where + '.branch.then');
            walkFx(v['else'], where + '.branch.else');
            break;
          case 'roll':
            walkFx(v.success, where + '.roll.success');
            walkFx(v.fail, where + '.roll.fail');
            break;
          case 'insight':
            if (!v.id) warn(where + ' insight 缺少 id');
            break;
          case 'pet':                                // 驭兽效果（单一 op，{pet:{op:'...'}}）
            if (v && v.species) ck('beastlore', v.species, where + '.pet'); // gain 的物种引用
            break;
          case 'daoxin':                             // 道心调和效果 {daoxin:{op:'tiaohe',pair}}
            if (v && v.pair) v.pair.forEach(function (d) { ckDao(d, where + '.daoxin'); });
            break;
        }
      }
    });
  }

  function walkOutcomes(outs, where) {
    if (!outs) return;
    if (!Array.isArray(outs)) { warn(where + ' outcomes 不是数组'); return; }
    outs.forEach(function (o, i) {
      if (!o || !Array.isArray(o.effects)) warn(where + '.outcomes[' + i + '] 缺 effects 数组');
      else {
        walkCond(o.cond, where + '.outcomes[' + i + ']');
        walkFx(o.effects, where + '.outcomes[' + i + ']');
      }
    });
  }

  function run() {
    issues = 0;

    // 地点：ids.js 的 8 个全部要注册
    G.IDS.locations.forEach(function (id) {
      if (!has('location', id)) warn('ids.js 地点未注册: ' + id);
    });
    G.all('location').forEach(function (d) {
      var W = 'location/' + d.id;
      if (d.boss) ck('enemy', d.boss, W);
      (d.tags || []).forEach(function (t) {
        if (G.IDS.tags.indexOf(t) < 0) warn(W + ' 使用了不在 ids.js 的 tag:「' + t + '」');
      });
    });

    // 行动
    G.all('action').forEach(function (d) {
      var W = 'action/' + d.id;
      if (d.loc != null) ckLoc(d.loc, W);
      walkCond(d.cond, W);
      walkFx(d.effects || [], W);
      walkOutcomes(d.outcomes, W);
      if (d.eventChance) {
        if (!Array.isArray(d.eventChance.pool)) warn(W + ' eventChance.pool 不是数组');
        else d.eventChance.pool.forEach(function (e) { ck('event', e, W + '.eventChance'); });
      }
    });

    // 事件
    G.all('event').forEach(function (d) {
      var W = 'event/' + d.id;
      walkCond(d.cond, W);
      if (d.prefer) {
        if (d.prefer.tend) for (var t in d.prefer.tend) ckDao(t, W + '.prefer');
        if (d.prefer.wvar) d.prefer.wvar.forEach(function (pw) { ckWvar(pw.id, W + '.prefer'); });
      }
      walkFx(d.effects, W + '.effects');
      (d.choices || []).forEach(function (ch, i) {
        var CW = W + '.choices[' + i + ']';
        if (!ch.text) warn(CW + ' 缺 text');
        walkCond(ch.cond, CW);
        if (!Array.isArray(ch.outcomes) || !ch.outcomes.length) warn(CW + ' 缺 outcomes');
        else walkOutcomes(ch.outcomes, CW);
      });
      if (!d.choices && !d.effects) warn(W + ' 既无 choices 也无 effects');
    });

    // 敌人
    G.all('enemy').forEach(function (d) {
      var W = 'enemy/' + d.id;
      if (d.loot && d.loot.items) d.loot.items.forEach(function (it) { ck('item', it.id, W + '.loot'); });
      if (d.intelMem) ck('memory', d.intelMem, W);
    });

    // 道途
    G.all('dao').forEach(function (d) {
      var W = 'dao/' + d.id;
      if (G.IDS.daos.indexOf(d.id) < 0) warn(W + ' 不在 ids.js 道途列表');
      if (d.awakeningEvent) ck('event', d.awakeningEvent, W + '.awakeningEvent');
      (d.phenomena || []).forEach(function (ph) {
        if (!ph.id || !ph.firstLog) warn(W + ' 异象缺 id/firstLog');
        (ph.hooks || []).forEach(function (h) {
          if (['battleStart', 'attack', 'hit', 'kill', 'lowHp', 'roundEnd', 'win'].indexOf(h.on) < 0)
            warn(W + ' 异象钩子未知时机:' + h.on);
          walkCond(h.cond, W + '.hook');
        });
      });
    });

    // 出生
    G.all('birth').forEach(function (d) {
      var W = 'birth/' + d.id;
      if (G.IDS.births.indexOf(d.id) < 0) warn(W + ' 不在 ids.js 出生列表');
      ckLoc(d.startLoc, W);
      (d.items || []).forEach(function (it) { ck('item', it.id, W + '.items'); });
      if (d.npcFav) for (var n in d.npcFav) ck('npc', n, W + '.npcFav');
      if (d.affinity) for (var a in d.affinity) ckDao(a, W + '.affinity');
      (d.earlyHooks || []).forEach(function (h) { ck('event', h.id, W + '.earlyHooks'); });
      walkFx(d.startEffects || [], W + '.startEffects');
      if (!d.mingqian || !d.mingqian.length) warn(W + ' 缺命签 mingqian');
    });

    // NPC
    G.all('npc').forEach(function (d) {
      var W = 'npc/' + d.id;
      if (G.IDS.npcs.indexOf(d.id) < 0) warn(W + ' 不在 ids.js NPC 列表');
      if (d.loc) ckLoc(d.loc, W);
      (d.monthly || []).forEach(function (r, i) {
        walkCond(r.cond, W + '.monthly[' + i + ']');
        walkFx(r.effects || [], W + '.monthly[' + i + ']');
      });
    });

    // 称号
    G.all('title').forEach(function (d) {
      var W = 'title/' + d.id;
      walkCond(d.autoCond, W + '.autoCond');
    });

    // 记忆
    G.all('memory').forEach(function (d) {
      var W = 'memory/' + d.id;
      if (d.deathCause && d.deathCause !== '*') {
        var causes = Array.isArray(d.deathCause) ? d.deathCause : [d.deathCause];
        var known = G.IDS.deathCauses || ['shouyuan'];
        causes.forEach(function (c) {
          if (c !== '*' && known.indexOf(c) < 0 && !has('enemy', c))
            warn(W + ' deathCause 引用未知敌人/死因:' + c);
        });
      }
      if (d.defeatCause) ck('enemy', d.defeatCause, W + '.defeatCause'); // 战败记忆（nonLethal 强敌）
    });

    // 异兽志（beastlore，驭兽系统物种谱；schema 见 beast.js 文件头 §E）
    var TRACKS = ['温灵', '野凶'], RANKS = ['凡', '下', '中', '上', '玄'], STAGES = ['通灵', '灵兽', '化形'];
    G.all('beastlore').forEach(function (d) {
      var W = 'beastlore/' + d.id;
      if (!d.name) warn(W + ' 缺 name');
      if (TRACKS.indexOf(d.track) < 0) warn(W + ' 非法 track:「' + d.track + '」(须 温灵/野凶)');
      if (RANKS.indexOf(d.rank) < 0) warn(W + ' 非法 rank:「' + d.rank + '」(须 凡/下/中/上/玄)');
      if (!d.omen || typeof d.omen !== 'object') warn(W + ' 缺 omen 三阶异象');
      else STAGES.forEach(function (s) { if (!d.omen[s]) warn(W + ' omen 缺「' + s + '」阶异象文案'); });
      (d.habitat || []).forEach(function (lid) { ckLoc(lid, W + '.habitat'); });
    });

    console.log('[VALIDATE] done, ' + issues + ' issues');
    return issues;
  }

  window.addEventListener('load', function () { run(); });
})();
