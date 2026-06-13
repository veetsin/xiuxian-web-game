// js/systems/combat.js — 回合制战斗（契约 §9 完整实现）。C4 写敌人/道途战斗内容前必读本注释。
//
// ◆ 进入：效果 op {combat:{enemy, intro, onWin:[], onLose:[], onFlee:[]}}。
//   onLose 缺省 = 死亡（除非敌人带 nonLethal 特性 → 默认改为受伤放过）。
//   同一效果数组里 combat 之后的 op 会作为 afterFx 在战斗结算后执行（dsl.js 处理）。
//
// ◆ 玩家指令（每回合一个）：
//   攻击  伤害 = max(1, atk×蓄势×加成 − def) ±15%；atk = 膂力×3+武器。
//   运气  灵气+4+神识/2，且下次攻击 ×1.6（蓄势，打出后消耗）。
//   守势  本回合受伤减半，回血 2+体魄/2。
//   技能  道途阶段≥skill.unlockStage 解锁；cost:{hpPct}|{qi}；fx 为 combat-fx。
//   逃走  成功率 = 0.5 + (身法−敌spd)×0.06，夹在 [0.05,0.95]；失败则白挨一轮。
//
// ◆ 异象钩子（dao.phenomena[].hooks）：{on, chance?, cond?, fx:[combat-fx]}
//   on ∈ battleStart | attack(玩家出手前) | hit(玩家被打中后) | kill(击杀时) |
//        lowHp(玩家血量首次跌破25%) | roundEnd(每回合末) | win(战斗胜利时)
//   cond 是完整条件 DSL；chance 缺省 1。触发链一律走战斗日志，【异象】行由内容自己 clog。
//
// ◆ combat-fx op 全集：
//   {cdmgNext:{mult:1.5}}     下次攻击伤害倍率（可叠乘）
//   {cheal:n} {cqi:n}         回血 / 回灵
//   {cstack:{id:"xueyi",n:1}} 加战斗栈；栈定义来自 dao.stacks（见下）
//   {cstun:1}                 敌方眩晕 n 回合（跳过行动）
//   {cextraHit:1}             立即追加 n 次普通攻击（追加攻不再触发 attack 钩子，防无限链）
//   {cshield:n}               护盾，优先吸收伤害
//   {cdot:{id:"流血",n:4,turns:3}} 敌方持续伤害；敌 immune 含该 id 则无效
//   {cenemyHp:-n}             直接改敌方血量（无视防御/物抗）
//   {clog:{t,style}}          写战斗日志（异象行请带「【异象】」前缀）
//
// ◆ 栈系统：dao 定义里写 stacks:[{id:"xueyi", name:"血意", atkPctPerStack:0.05, max:10}]
//   combat.js 通用支持「每栈加伤」：玩家攻击倍率 ×(1 + Σ 栈数×atkPctPerStack)。
//
// ◆ 敌方特性 traits（字符串，冒号带参）：
//   "regen:10"        每回合末回血 n
//   "pack:3"          成群：每回合打 n 下，每下 atk×0.65
//   "undead"          不死：自动免疫流血、惧雷火
//   "nonLethal"       战败不致死（武馆切磋类）：默认改为受伤+丢钱
//   "phys_resist:0.7" 物理抗性：普通攻击伤害 ×0.7（cdot/cenemyHp 不受影响——异象与法力是破抗手段）
//   immune:["流血"]    免疫某些 dot；fearOf:["雷","威压"] 畏惧元素/威压。
//   玩家任一阶段≥1 的道途映射元素（血剑→血/剑、雷法→雷、炼体→体、丹药→药、因果→因果），
//   命中敌方 fearOf → 敌 atk×0.85，且每回合 12% 概率畏缩不前。
//
// ◆ 威压判定（战前）：威压值 = 境界差×40 + 名望×0.25 + 称号数×5；
//   阈值：普通敌 60 / boss 160，敌 fearOf 含"威压"再 −20。过阈 → 不战而胜（lines.submit），评价=威压降服。
//
// ◆ 评价：秒杀(≤2回合未受伤) > 碾压(血量未掉破70%) > 险胜(结束<20%) > 苦战(掉破过30%) > 压制。威压降服单列。
//   战后发 bus 'combat:end' {enemyId, result, rating, boss}，social/rumor 侧听这个做装逼反馈。
(function () {
  'use strict';
  G.sys = G.sys || {};
  G.sys.combat = {};
  G.combat = null;

  var HOOK_ONS = ['battleStart', 'attack', 'hit', 'kill', 'lowHp', 'roundEnd', 'win'];
  var DAO_ELEMENT = { xuejian: ['血', '剑'], leifa: ['雷'], lianti: ['体'], danyao: ['药'], yinguo: ['因果'] };

  function clog(t, style) {
    var c = G.combat; if (!c) return;
    c.clog.push({ t: t, style: style || '战' });
    if (c.clog.length > 60) c.clog.shift();
    if (!G._autoplay && G.ui && G.ui.renderCombat) G.ui.renderCombat();
  }

  function parseTraits(def) {
    var out = { regen: 0, pack: 1, undead: false, nonLethal: false, physResist: 1 };
    (def.traits || []).forEach(function (t) {
      var kv = String(t).split(':');
      if (kv[0] === 'regen') out.regen = parseFloat(kv[1]) || 0;
      else if (kv[0] === 'pack') out.pack = Math.max(1, parseInt(kv[1], 10) || 1);
      else if (kv[0] === 'undead') out.undead = true;
      else if (kv[0] === 'nonLethal') out.nonLethal = true;
      else if (kv[0] === 'phys_resist') out.physResist = parseFloat(kv[1]) || 1;
      else out[kv[0]] = kv[1] != null ? kv[1] : true; // 未知特性原样挂上，内容可在钩子 cond 里用
    });
    return out;
  }

  // 玩家已解锁异象的战斗钩子索引
  function buildHooks() {
    var hooks = [];
    (G.player.phenomena || []).forEach(function (phId) {
      var found = G.sys.dao.phenomenonDef(phId);
      if (found && found.ph.hooks) found.ph.hooks.forEach(function (h) {
        hooks.push({ on: h.on, chance: h.chance, cond: h.cond, fx: h.fx, _ph: found.ph.name });
      });
    });
    return hooks;
  }
  // 全部道途的栈定义索引
  function stackDefs() {
    var map = {};
    G.all('dao').forEach(function (d) {
      (d.stacks || []).forEach(function (s) { map[s.id] = s; });
    });
    return map;
  }

  function runHooks(on) {
    var c = G.combat; if (!c || c.over) return;
    c.hooks.forEach(function (h) {
      if (h.on !== on) return;
      if (h.cond && !G.cond(h.cond)) return;
      if (h.chance != null && !G.rng.chance(h.chance)) return;
      cfx(h.fx);
    });
  }

  // ---- combat-fx 解释器 ----
  function cfx(list) {
    var c = G.combat; if (!c || !list) return;
    if (!Array.isArray(list)) list = [list];
    list.forEach(function (op) {
      if (!op) return;
      for (var k in op) {
        var v = op[k];
        switch (k) {
          case 'cdmgNext': c.dmgNext *= (v.mult || 1); break;
          case 'cheal': G.player.hp = Math.min(G.player.maxHp, G.player.hp + v); break;
          case 'cqi': G.player.qi = G.clamp(G.player.qi + v, 0, G.player.maxQi); break;
          case 'cstack': {
            var sd = c.stackDefs[v.id];
            var max = sd && sd.max ? sd.max : 99;
            c.stacks[v.id] = G.clamp((c.stacks[v.id] || 0) + (v.n || 1), 0, max);
          } break;
          case 'cstun': c.stunned += (v === true ? 1 : v); break;
          case 'cextraHit': c.extraHits += (v === true ? 1 : v); break;
          case 'cshield': c.shield += v; break;
          case 'cdot': {
            if (c.immune.indexOf(v.id) >= 0) { clog(c.ename + '不为「' + v.id + '」所动。', '战'); break; }
            c.edots.push({ id: v.id, n: v.n, turns: v.turns || 2 });
            clog(c.ename + '陷入了「' + v.id + '」。', '战');
          } break;
          case 'cenemyHp':
            c.ehp = G.clamp(c.ehp + v, 0, c.emaxHp);
            if (v < 0) clog(c.ename + '受到 ' + (-v) + ' 点损伤。', '战');
            break;
          case 'clog': clog(v.t, v.style); break;
          default: console.warn('[COMBAT] 未知 combat-fx op:', k);
        }
      }
    });
  }

  // ---- 入口 ----
  G.sys.combat.start = function (opts) {
    var def = G.get('enemy', opts.enemy);
    if (!def) { console.error('[COMBAT] 未知敌人:', opts.enemy); return; }
    var p = G.player;
    var tr = parseTraits(def);
    var immune = (def.immune || []).slice();
    var fearOf = (def.fearOf || []).slice();
    if (tr.undead) {
      if (immune.indexOf('流血') < 0) immune.push('流血');
      if (fearOf.indexOf('雷') < 0) fearOf.push('雷');
      if (fearOf.indexOf('火') < 0) fearOf.push('火');
    }

    var c = G.combat = {
      eid: def.id, edef: def, ename: def.name,
      ehp: def.hp, emaxHp: def.hp, eatk: def.atk, edefv: def.def || 0, espd: def.spd || 5,
      tr: tr, immune: immune, fearOf: fearOf,
      stacks: {}, stackDefs: stackDefs(), edots: [], hooks: buildHooks(),
      dmgNext: 1, charge: 1, shield: 0, defending: false,
      stunned: 0, extraHits: 0,
      round: 1, playerHurt: false, lowestPct: 1, lowHpFired: false, hurtLineSaid: false,
      enemyFeared: false, intel: false,
      onWin: opts.onWin || null, onLose: opts.onLose || null, onFlee: opts.onFlee || null,
      afterFx: opts.afterFx || null, cause: opts.cause,
      over: false, result: null, rating: null, clog: []
    };
    G.paused = true;

    if (opts.intro) clog(opts.intro, '战');
    if (def.lines && def.lines.appear) clog(def.lines.appear, '战');
    G.log('遭遇【' + def.name + '】！', '战');
    if (G.debug && G.debug._collect) G.debug._collect.fights++;

    // 情报记忆：战前提示 + 针对增益（玩家伤害 +15%）
    if (def.intelMem && p.memories.indexOf(def.intelMem) >= 0) {
      c.intel = true;
      var memDef = G.get('memory', def.intelMem);
      clog('你想起了什么——' + (memDef ? memDef.title : '前尘旧事') + '。你知道它的弱处。', '因果');
    }

    // 畏惧元素：玩家任一阶段≥1 道途的元素命中 fearOf
    var feared = false;
    G.all('dao').forEach(function (d) {
      if ((p.daoStage[d.id] || 0) >= 1) {
        (DAO_ELEMENT[d.id] || []).forEach(function (el) {
          if (fearOf.indexOf(el) >= 0) feared = true;
        });
      }
    });
    if (feared) {
      c.enemyFeared = true;
      c.eatk = Math.round(c.eatk * 0.85);
      if (def.lines && def.lines.fear) clog(def.lines.fear, '战');
    }

    // 威压判定：可能不战而胜
    var pressure = (p.realmIdx - ((def.tier || 1) - 1)) * 40 + p.fame * 0.25 + p.titles.length * 5;
    var pThreshold = def.boss ? 160 : 60;
    if (fearOf.indexOf('威压') >= 0) pThreshold -= 20;
    if (pressure >= pThreshold && pressure > 0) {
      clog((def.lines && def.lines.submit) || (def.name + '在你面前竟不敢上前，慢慢退走了。'), '战');
      G.log('【' + def.name + '】慑于你的气势，未战先退。', '吉');
      return finish('press', '威压降服');
    }

    runHooks('battleStart');
    if (checkEnemyDead()) return;

    if (G._autoplay) autoFight();
    else if (G.ui) G.ui.setMode('combat');
  };

  // ---- 指令 ----
  G.sys.combat.cmd = function (cmd, arg) {
    var c = G.combat, p = G.player;
    if (!c || c.over || p.dead) return;
    c.defending = false;

    if (cmd === 'attack') {
      playerStrike(true);
      if (c.over) return;
    } else if (cmd === 'yunqi') {
      var gain = 4 + Math.round(p.stats.shen / 2);
      p.qi = Math.min(p.maxQi, p.qi + gain);
      c.charge = 1.6;
      clog('你按下心神缓缓吐纳，气机在指间蓄起。（灵气+' + gain + '，下次攻击增强）', '战');
    } else if (cmd === 'defend') {
      c.defending = true;
      var heal = 2 + Math.round(p.stats.ti / 2);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      clog('你收势自守，气血稍定。（回复' + heal + '）', '战');
    } else if (cmd === 'skill') {
      if (!useSkill(arg)) return; // 释放失败不耗回合
      if (c.over) return;
    } else if (cmd === 'flee') {
      var pFlee = G.clamp(0.5 + (p.stats.min - c.espd) * 0.06, 0.05, 0.95);
      if (G.rng.chance(pFlee)) {
        clog('你觑了个空子，转身没入草木之间。', '战');
        G.log('你从【' + c.ename + '】爪下脱身。', '平');
        return finish('flee', null);
      }
      clog('没逃掉！' + c.ename + '封住了你的退路。', '凶');
    } else {
      return;
    }

    // 敌方回合
    enemyTurn();
    if (c.over || p.dead) return;
    roundEnd();
  };

  function useSkill(skillId) {
    var c = G.combat, p = G.player;
    var entry = G.sys.dao.skills().filter(function (s) { return s.skill.id === skillId; })[0];
    if (!entry) return false;
    var cost = entry.skill.cost || {};
    if (cost.qi != null) {
      if (p.qi < cost.qi) { clog('灵气不济，催不动这一式。', '战'); return false; }
      p.qi -= cost.qi;
    }
    if (cost.hpPct != null) {
      var pay = Math.max(1, Math.round(p.maxHp * cost.hpPct));
      if (p.hp <= pay) { clog('气血已亏，再以伤换势只会自毙。', '凶'); return false; }
      p.hp -= pay;
    }
    cfx(entry.skill.fx);
    // 技能默认接一次挥击（cdmgNext 类技能因此立刻兑现）
    playerStrike(false);
    return true;
  }

  // isCommandAttack=true 时触发 attack 钩子；追加攻/技能附带攻不触发，防无限链
  function playerStrike(isCommandAttack) {
    var c = G.combat, p = G.player;
    if (isCommandAttack) runHooks('attack');
    if (c.over) return;

    // 每栈加伤
    var stackPct = 0;
    for (var sid in c.stacks) {
      var sd = c.stackDefs[sid];
      if (sd && sd.atkPctPerStack) stackPct += c.stacks[sid] * sd.atkPctPerStack;
    }
    var mult = c.charge * c.dmgNext * (1 + stackPct) * (c.intel ? 1.15 : 1);
    var raw = G.playerAtk() * mult - c.edefv;
    var dmg = Math.max(1, Math.round(raw * (0.85 + G.rng() * 0.3)));
    dmg = Math.max(1, Math.round(dmg * c.tr.physResist));

    c.ehp = Math.max(0, c.ehp - dmg);
    var extra = [];
    if (c.charge > 1) extra.push('蓄势');
    if (stackPct > 0) extra.push('气势如虹');
    clog('你挥击【' + c.ename + '】，造成 ' + dmg + ' 点伤害' + (extra.length ? '（' + extra.join('、') + '）' : '') + '。', '战');
    c.charge = 1; c.dmgNext = 1;

    if (!c.hurtLineSaid && c.ehp < c.emaxHp * 0.5 && c.edef.lines && c.edef.lines.hurt) {
      c.hurtLineSaid = true;
      clog(c.edef.lines.hurt, '战');
    }
    if (checkEnemyDead()) return;

    // 追加攻
    while (c.extraHits > 0 && !c.over) {
      c.extraHits--;
      clog('你的攻势未竭，追击一记！', '战');
      playerStrike(false);
    }
  }

  function checkEnemyDead() {
    var c = G.combat;
    if (!c || c.over || c.ehp > 0) return false;
    runHooks('kill');
    if (c.edef.lines && c.edef.lines.death) clog(c.edef.lines.death, '战');
    win();
    return true;
  }

  function enemyTurn() {
    var c = G.combat, p = G.player;
    if (!c || c.over || p.dead) return;
    if (c.stunned > 0) {
      c.stunned--;
      clog(c.ename + '僵在原地，动弹不得。', '战');
      return;
    }
    if (c.enemyFeared && G.rng.chance(0.12)) {
      clog(c.ename + '莫名地畏缩了一瞬，没敢扑上来。', '战');
      return;
    }
    var strikes = c.tr.pack;
    for (var s = 0; s < strikes && !c.over && !p.dead; s++) {
      var atk = strikes > 1 ? c.eatk * 0.65 : c.eatk;
      var raw = atk - G.playerDef();
      var dmg = Math.max(1, Math.round(raw * (0.85 + G.rng() * 0.3)));
      if (c.defending) dmg = Math.max(1, Math.round(dmg * 0.5));
      if (c.shield > 0) {
        var absorbed = Math.min(c.shield, dmg);
        c.shield -= absorbed; dmg -= absorbed;
        if (absorbed > 0) clog('护体气劲挡下了 ' + absorbed + ' 点伤害。', '战');
      }
      if (dmg > 0) {
        p.hp = Math.max(0, p.hp - dmg);
        c.playerHurt = true;
        clog(c.ename + (strikes > 1 ? '从侧翼撕咬' : '袭来') + '，你受到 ' + dmg + ' 点伤害。', '凶');
        c.lowestPct = Math.min(c.lowestPct, p.hp / p.maxHp);
        runHooks('hit');
        if (!c.lowHpFired && p.hp / p.maxHp < 0.25 && p.hp > 0) {
          c.lowHpFired = true;
          runHooks('lowHp');
        }
        if (checkEnemyDead()) return; // hit 钩子可能反杀（cenemyHp）
      }
      if (p.hp <= 0) { lose(); return; }
    }
  }

  function roundEnd() {
    var c = G.combat, p = G.player;
    if (!c || c.over || p.dead) return;
    // dot 结算
    var kept = [];
    c.edots.forEach(function (d) {
      c.ehp = Math.max(0, c.ehp - d.n);
      clog(c.ename + '因「' + d.id + '」损失 ' + d.n + ' 点气血。', '血');
      d.turns--;
      if (d.turns > 0) kept.push(d);
    });
    c.edots = kept;
    if (checkEnemyDead()) return;
    // 再生
    if (c.tr.regen > 0 && c.ehp < c.emaxHp) {
      c.ehp = Math.min(c.emaxHp, c.ehp + c.tr.regen);
      clog(c.ename + '的伤口以肉眼可见的速度弥合。（回复' + c.tr.regen + '）', '战');
    }
    runHooks('roundEnd');
    if (checkEnemyDead()) return;
    c.round++;
  }

  // ---- 收尾 ----
  function ratingOf(c) {
    var p = G.player;
    if (c.round <= 2 && !c.playerHurt) return '秒杀';
    if (c.lowestPct >= 0.7) return '碾压';
    if (p.hp / p.maxHp < 0.2) return '险胜';
    if (c.lowestPct < 0.3) return '苦战';
    return '压制';
  }

  function win() {
    var c = G.combat, p = G.player;
    runHooks('win');
    c.rating = ratingOf(c);
    // 击杀统计（{kills:{id,gte}} 条件 / 称号 autoCond 用）
    p.pflags['_kills_' + c.eid] = (p.pflags['_kills_' + c.eid] || 0) + 1;
    // 战利品
    var lootLines = [];
    if (c.edef.loot) {
      var lm = c.edef.loot.money;
      if (lm) {
        var got = G.rng.int(lm[0], lm[1]);
        if (got > 0) { p.money += got; lootLines.push(got + ' 文钱'); }
      }
      (c.edef.loot.items || []).forEach(function (it) {
        if (G.rng.chance(it.p != null ? it.p : 1)) {
          G.addItem(it.id, it.n || 1);
          lootLines.push('【' + G.itemName(it.id) + '】×' + (it.n || 1));
        }
      });
    }
    // 名望：层级 × 评价系数
    var fameGain = (c.edef.tier || 1) * ((c.rating === '秒杀' || c.rating === '碾压') ? 3 : 1);
    if (c.edef.boss) fameGain += 10;
    p.fame += fameGain;

    clog('—— 你赢了。此战评点：【' + c.rating + '】 ——', '吉');
    if (lootLines.length) clog('你拾取了 ' + lootLines.join('、') + '。', '吉');
    G.log('你战胜了【' + c.ename + '】（' + c.rating + '）。', '战');
    if (c.edef.boss) {
      G.world.flags['_bossdead_' + c.eid] = true;
      G.all('location').forEach(function (ld) {
        if (ld.boss === c.eid && G.world.locations[ld.id]) G.world.locations[ld.id].bossAlive = false;
      });
      G.history('击杀' + c.ename);
    }
    finish('win', c.rating);
  }

  function lose() {
    var c = G.combat, p = G.player;
    if (c.tr.nonLethal && !c.onLose) {
      // 非致命战败默认：被打趴 + 受伤 + 丢点钱
      p.hp = 1;
      clog('你眼前一黑栽倒在地。再睁眼时，对方已经走了。', '凶');
      c.onLose = [
        { injure: { months: 2, severity: 2 } },
        { money: -Math.min(p.money, 5) },
        { log: { t: '你拖着伤躯爬起来，咽下了这口气。', style: '凶' } }
      ];
      return finish('lose', null);
    }
    if (c.onLose) {
      p.hp = Math.max(p.hp, 1);
      clog('你撑不住了……', '凶');
      return finish('lose', null);
    }
    // 默认：战败即死
    c.over = true; c.result = 'lose';
    G.log('你死在了【' + c.ename + '】手里。', '凶');
    var eid = c.eid;
    G.combat = null;
    G.paused = false;
    G.sys.rein.die(eid);
  }

  // result: 'win' | 'lose' | 'flee' | 'press'
  function finish(result, rating) {
    var c = G.combat;
    c.over = true; c.result = result; c.rating = rating;
    if (G._autoplay) G.sys.combat.close();
    else if (G.ui) G.ui.renderCombat(); // 显示战果面板，等玩家点「离去」
  }

  // 玩家点「离去」（或 autoplay 直接调）：执行战后效果链，恢复主流程
  G.sys.combat.close = function () {
    var c = G.combat;
    if (!c || !c.over) return;
    G.combat = null;
    G.paused = false;
    var p = G.player;
    var chain = [];
    if (c.result === 'win' || c.result === 'press') { if (c.onWin) chain = chain.concat(c.onWin); }
    else if (c.result === 'flee') { if (c.onFlee) chain = chain.concat(c.onFlee); }
    else if (c.result === 'lose') { if (c.onLose) chain = chain.concat(c.onLose); }
    if (c.afterFx && c.result !== 'lose') chain = chain.concat(c.afterFx); // 战败仍存活时不再继续原效果链
    G.bus.emit('combat:end', { enemyId: c.eid, result: c.result, rating: c.rating, boss: !!c.edef.boss });
    if (chain.length && !p.dead) G.fx(chain, { cause: c.ename });
    G.sys.rumor.checkAutoTitles();
    if (!p.dead && !G.combat) {
      G.pump(); // 继续行动管线剩余任务（月末 tick 等）
      if (G.ui && !G.combat) {
        if (G.sys.events.pending.length) G.ui.setMode('event');
        else if (G.ui.mode === 'combat') G.ui.setMode('loc');
        G.ui.refresh();
      }
    }
  };

  // ---- autoplay 简单 AI：有技能用技能；hp<25% 尝试逃；否则攻击 ----
  function autoFight() {
    var guard = 200;
    while (G.combat && !G.combat.over && !G.player.dead && guard-- > 0) {
      var p = G.player;
      var skills = G.sys.dao.skills();
      var usable = skills.filter(function (s) {
        var cost = s.skill.cost || {};
        if (cost.qi != null && p.qi < cost.qi) return false;
        if (cost.hpPct != null && p.hp <= Math.round(p.maxHp * cost.hpPct)) return false;
        return true;
      });
      if (p.hp / p.maxHp < 0.25) G.sys.combat.cmd('flee');
      else if (usable.length && G.rng.chance(0.6)) G.sys.combat.cmd('skill', usable[0].skill.id);
      else G.sys.combat.cmd('attack');
    }
    if (G.combat && !G.combat.over) { // 兜底（不应发生）
      console.warn('[COMBAT] autoFight 超过 200 回合，强制脱离');
      G.combat.over = true; G.combat.result = 'flee';
      G.sys.combat.close();
    }
  }
})();
