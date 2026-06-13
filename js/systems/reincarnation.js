// js/systems/reincarnation.js — 死亡 → 走马灯 → 蒸馏 → 出生抽取 → 世界重置 → 新生（契约 §11）。
//
// 蒸馏规则：
//   * carry:true 的记忆 → meta.carried.memories（去重并入）
//   * 悟道录 confirmed 行 → meta.carried.insights（只留已确认行）
//   * 各道 tend×0.15（上限20）→ meta.carried.tendSeed（与旧种子取较大者的一半相比保高）
//   * legacy 不动（legacySet 落下的跨世痕迹永续）
//   * 本世称号 → 残响（grantTitle 时已登记 meta.carried.echoes）
// 死亡记忆模板：memory def 可带 deathCause:"enemyId"|[...]|"shouyuan"|"*"，
//   死亡时引擎按 cause 匹配第一个未持有的模板自动授予（C1 范本见 memories.js）。
// legacy → 新世界修正表见 applyLegacy()，内容 Agent 新增 legacy 大多走事件 cond 即可，无需改这里。
(function () {
  'use strict';
  G.sys = G.sys || {};

  G.sys.rein = {
    // ---- 获得记忆（memAdd op 入口） ----
    gainMemory: function (memId) {
      var p = G.player;
      var def = G.get('memory', memId);
      if (!def) { console.warn('[MEM] 未知记忆:', memId); return; }
      if (p.memories.indexOf(memId) >= 0) return;
      p.memories.push(memId);
      G.log('有什么东西烙进了你的识海深处——「' + def.title + '」。', '因果');
    },

    // ---- 死亡入口（hp 归零 / die op / 寿元尽 / G.debug.kill） ----
    die: function (cause) {
      var p = G.player;
      if (!p || p.dead) return;
      p.dead = true;

      // 清场：战斗、队列、未弹事件全部作废
      G.combat = null;
      G.paused = false;
      if (G.queue) G.queue.length = 0;
      G.sys.events.pending.length = 0;

      // 死因文案
      var causeText = cause;
      var enemyDef = G.get('enemy', cause);
      if (enemyDef) causeText = '死于【' + enemyDef.name + '】之口';
      else if (cause === 'shouyuan') causeText = '寿数尽了';
      else causeText = '死于' + cause;

      G.log('—— 第' + p.lifeIndex + '世，终。' + causeText + '。——', '凶');
      G.history(causeText);

      G.meta.lastDeath = {
        cause: cause,
        locId: p.location,
        ym: { y: G.world.year, m: G.world.month }
      };

      // 死亡记忆模板匹配（先于蒸馏，使其可携带）
      var tpl = null;
      G.all('memory').forEach(function (m) {
        if (tpl || !m.deathCause) return;
        if (G.player.memories.indexOf(m.id) >= 0) return;
        var causes = Array.isArray(m.deathCause) ? m.deathCause : [m.deathCause];
        if (causes.indexOf(cause) >= 0) tpl = m;
      });
      if (!tpl) {
        G.all('memory').forEach(function (m) {
          if (tpl || m.deathCause !== '*') return;
          if (G.player.memories.indexOf(m.id) >= 0) return;
          tpl = m;
        });
      }
      if (tpl) p.memories.push(tpl.id);

      // 走马灯素材
      G._liminal = {
        lifeIndex: p.lifeIndex,
        ageY: p.ageY,
        causeText: causeText,
        chronicle: G.world.history.slice(),
        carriedMems: p.memories.filter(function (id) {
          var d = G.get('memory', id); return d && d.carry;
        }),
        confirmedInsights: Object.keys(p.insights).filter(function (k) {
          return p.insights[k].lines.some(function (l) { return l.confirmed; });
        }).map(function (k) { return p.insights[k].title; }),
        echoes: G.meta.carried.echoes.slice()
      };

      G.bus.emit('life:death', { cause: cause });

      if (G._autoplay) {
        if (G.debug && G.debug._collect) G.debug._collect.deaths++;
        this.complete();
      } else if (G.ui) {
        G.ui.setMode('liminal');
      }
    },

    // ---- 走马灯「入轮回」按钮 / autoplay 自动 ----
    complete: function () {
      this.distill();
      G.meta.reincarnationCount++;
      this.newLife();
    },

    // ---- 蒸馏 ----
    distill: function () {
      var p = G.player, carried = G.meta.carried;
      // 1) carry 记忆并入
      p.memories.forEach(function (id) {
        var d = G.get('memory', id);
        if (d && d.carry && carried.memories.indexOf(id) < 0) carried.memories.push(id);
      });
      // 2) confirmed 悟道行
      for (var k in p.insights) {
        var entry = p.insights[k];
        var confirmed = entry.lines.filter(function (l) { return l.confirmed; });
        if (!confirmed.length) continue;
        if (!carried.insights[k]) carried.insights[k] = { title: entry.title, lines: [] };
        confirmed.forEach(function (l) {
          var dup = carried.insights[k].lines.some(function (x) { return x.text === l.text; });
          if (!dup) carried.insights[k].lines.push({ text: l.text, confirmed: true });
        });
      }
      // 3) tendSeed：本世 tend×0.15 cap20，与旧种子衰减值取大
      G.all('dao').forEach(function (d) {
        var fresh = Math.min(20, Math.round((p.tend[d.id] || 0) * 0.15));
        var old = carried.tendSeed[d.id] || 0;
        var kept = Math.max(fresh, Math.floor(old / 2));
        if (kept > 0) carried.tendSeed[d.id] = kept;
        else delete carried.tendSeed[d.id];
      });
      // 4) legacy 不动；5) 称号残响在 grantTitle 时已登记
    },

    // ---- 新的一世 ----
    newLife: function () {
      var birthId = G.sys.birth.roll();

      // 世界重置回第 1 年 + legacy 修正
      G.world = G.newWorld();
      applyLegacy();

      // 新玩家：lifeIndex、tendSeed、携带记忆/悟道录
      // 驭兽（契约 §G）：newPlayer 已置 pet:null，兽留在上一世；命缘兽死的转世认主
      // 走 legacy 'pet_zhuanshi' + meta.carried.petSoul，由来世「梦引而至」事件 {pet:{op:'gainSoul'}} 重建。
      G.player = G.newPlayer();
      G.player.lifeIndex = G.meta.reincarnationCount + 1;
      var seed = G.meta.carried.tendSeed;
      for (var d in seed) G.player.tend[d] = seed[d];
      G.player.memories = G.meta.carried.memories.slice();
      for (var k in G.meta.carried.insights) {
        var src = G.meta.carried.insights[k];
        G.player.insights[k] = {
          title: src.title,
          lines: src.lines.map(function (l) { return { text: l.text, confirmed: true }; })
        };
      }

      G.sys.birth.apply(birthId);
      G.bus.emit('life:new', { lifeIndex: G.player.lifeIndex, birthId: birthId });

      if (G._autoplay) this.enterLife();
      else if (G.ui) G.ui.setMode('birth'); // 出生卡屏，「睁眼」按钮 → enterLife()
    },

    // ---- 出生卡确认后正式入世 ----
    enterLife: function () {
      var p = G.player;
      var bdef = G.get('birth', p.birthId);
      G.log('═══ 第' + p.lifeIndex + '世 ═══', '世界');
      G.log('你生在' + (G.get('location', p.location) || {}).name + '，是个' + bdef.name + '。', '平');
      if (p.pflags._mingqian) G.log('庙前老儿替你起了一卦：「' + p.pflags._mingqian + '」', '因果');
      if (bdef.visibleClue) G.log(bdef.visibleClue, '平');
      // 前世梦境（携带记忆的 dream 行）
      p.memories.forEach(function (id) {
        var m = G.get('memory', id);
        if (m && m.dream) G.log(m.dream, '因果');
      });
      G.save.write(true);
      if (G.ui) { G.ui.setMode('loc'); G.ui.refresh(); }
      // 开局身世剧情：立即弹卡（不再延后两个 tick）。每世世界重置，_evdone 随之清零，故可重弹。
      (bdef.earlyHooks || []).forEach(function (h) { G.sys.events.fire(h.id); });
      G.sys.events.pumpPending();
    }
  };

  // ---- legacy → 初始世界修正 ----
  // 引擎内置四个建议 legacy 的世界面修正；事件级反应（如「狼骨荒丘」）由内容用 {legacy:"..."} cond 实现。
  function applyLegacy() {
    var L = G.meta.legacy, w = G.world;
    if (L.langwang_slain) { // 狼王已被前世斩杀：狼患低开，狼王不复
      w.vars.wolfThreat = 8;
      w.flags['_bossdead_heishan_langwang'] = true;
      if (w.locations.heishan_shenchu) w.locations.heishan_shenchu.bossAlive = false;
    }
    if (L.mine_sealed) { // 矿洞已封：不稳低开，危险减
      w.vars.mineInstability = 8;
      if (w.locations.feikuang) w.locations.feikuang.danger = Math.max(0, w.locations.feikuang.danger - 25);
    }
    if (L.temple_cleansed) { // 庙已净化：阴气低开，邪影不复
      w.vars.ghostQi = 5;
      w.flags['_bossdead_shanmiao_xieying'] = true;
      if (w.locations.shanshenmiao) {
        w.locations.shanshenmiao.bossAlive = false;
        w.locations.shanshenmiao.corruption = 0;
      }
    }
    if (L.dashixiong_defeated) { // 大师兄已被打服：武馆不再压人
      w.flags['_bossdead_dashixiong_boss'] = true;
      if (w.locations.wuguan) w.locations.wuguan.bossAlive = false;
    }
    // ── v2 新 Boss 击破 / 支线收束的跨世修正 ──
    if (L.hu_an_jing) { // 老狐仙已了：狐婆坳魅气消，狐祟不复
      w.flags['_bossdead_laohu_xian'] = true;
      if (w.locations.hupo_ao) { w.locations.hupo_ao.bossAlive = false; w.locations.hupo_ao.corruption = 0; }
    }
    if (L.jianzhong_renzhu) { // 剑冢认主：剑灵伏，断剑崖灵气涨
      w.flags['_bossdead_jianzhong_jianling'] = true;
      if (w.locations.duanjianya) { w.locations.duanjianya.bossAlive = false; w.locations.duanjianya.spiritualEnergy += 30; }
    }
    if (L.hantan_ding) { // 寒潭蛟死：水患息，寒潭险降
      w.flags['_bossdead_hantan_jiao'] = true;
      if (w.locations.hantan) { w.locations.hantan.bossAlive = false; w.locations.hantan.danger = Math.max(0, w.locations.hantan.danger - 25); }
    }
    if (L.shouwang_fu) { // 兽王臣服：后山兽群驯顺，狼患低开
      w.flags['_bossdead_houshan_shouwang'] = true;
      w.vars.wolfThreat = Math.min(w.vars.wolfThreat, 10);
      if (w.locations.houshan_lin) w.locations.houshan_lin.bossAlive = false;
    }
    if (L.luanzang_an) { // 乱葬厉祖镇：乱葬岗安宁，镇恐慌低开
      w.flags['_bossdead_luanzang_li_zu'] = true;
      w.vars.villageFear = Math.min(w.vars.villageFear, 10);
      if (w.locations.luanzang_gang) { w.locations.luanzang_gang.bossAlive = false; w.locations.luanzang_gang.corruption = 0; }
    }
    if (L.heshen_ping) { // 河神平：河患息，河神渡险降
      w.flags['_bossdead_heshen'] = true;
      if (w.locations.heshen_du) { w.locations.heshen_du.bossAlive = false; w.locations.heshen_du.danger = Math.max(0, w.locations.heshen_du.danger - 20); }
    }
  }
})();
