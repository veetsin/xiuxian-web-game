// js/systems/dao.js — 隐藏道途（契约 §10）。
// 核心规则：
//   * 倾向 tend 只能被显式 tendAdd 推高（行动/事件/战斗结算），本系统只「检查与显形」。
//   * 阶段 0→1：tend 过 thresholds[0]，触发异象 firstLog + 自动开悟道录条目（玩家只看到“怪事”）。
//   * 阶段 1→2：tend 过 thresholds[1]，eventDelay 安排顿悟事件（dao.awakeningEvent，C3 写）。
//     顿悟事件里用 {daoAdvance:"xuejian"}（纳之）或 {daoSuppress:"xuejian"}（抑之）收尾。
//   * 阶段 2→3：tend 过 thresholds[2]，自动小成（命名已公开，直接日志+悟道录）。
//   * 异象按各自 unlockTend 独立解锁，进入 player.phenomena，战斗钩子由 combat.js 消费。
(function () {
  'use strict';
  G.sys = G.sys || {};

  G.sys.dao = {
    // ---- 每月底检查（time.js 第 7 步调用） ----
    checkProgress: function () {
      var p = G.player;
      G.all('dao').forEach(function (d) {
        var t = p.tend[d.id] || 0;
        var thr = d.thresholds || [25, 60, 120];

        // 异象解锁（不限阶段，各看各的 unlockTend）
        (d.phenomena || []).forEach(function (ph) {
          if (t >= (ph.unlockTend || thr[0]) && p.phenomena.indexOf(ph.id) < 0) {
            p.phenomena.push(ph.id);
            if (ph.firstLog) G.log(ph.firstLog.t, ph.firstLog.style || '异象');
            // 自动开一条悟道录（条目 id = 异象 id）
            G.sys.dao.addInsight({
              id: ph.id, title: ph.name,
              t: ph.insightLine || '说不清是什么。先记下来。'
            });
            G.history('异象初现：' + ph.name);
            if ((p.daoStage[d.id] || 0) < 1) {
              p.daoStage[d.id] = 1;
              G.bus.emit('dao:stage', { daoId: d.id, stage: 1 });
            }
          }
        });

        // 阶段1（保底：道途暂无异象数据时也能进 1，不出可见文案）
        if (t >= thr[0] && (p.daoStage[d.id] || 0) < 1) {
          p.daoStage[d.id] = 1;
          G.bus.emit('dao:stage', { daoId: d.id, stage: 1 });
        }

        // 阶段1→2：安排顿悟事件（一次性；抑之后会清掉标记允许再来）
        if (p.daoStage[d.id] === 1 && t >= thr[1] && d.awakeningEvent && !p.pflags['_awak_' + d.id]) {
          p.pflags['_awak_' + d.id] = true;
          G.sys.events.schedule(d.awakeningEvent, G.rng.int(1, 2), '有些东西快压不住了');
        }

        // 阶段2→3：小成（此时道名已公开，可直接用 stageNames）
        if (p.daoStage[d.id] === 2 && t >= thr[2]) {
          p.daoStage[d.id] = 3;
          var n3 = (d.stageNames && d.stageNames[3]) || '小成';
          G.log('水到渠成。你的「' + d.hiddenName + '」已至' + n3 + '之境。', '突破');
          G.sys.dao.addInsight({ id: 'dao_' + d.id, title: d.hiddenName + '之路', t: '已至' + n3 + '。路还在往前。', confirm: true });
          G.history(d.hiddenName + '之道' + n3);
          G.bus.emit('dao:stage', { daoId: d.id, stage: 3 });
        }
      });
    },

    // ---- 顿悟「纳之」：阶段+1、命名显现、技能解锁（{daoAdvance:"id"} op 调这里） ----
    advance: function (daoId) {
      var d = G.get('dao', daoId), p = G.player;
      if (!d) { console.warn('[DAO] advance 未知道途:', daoId); return; }
      var st = Math.min(3, (p.daoStage[daoId] || 0) + 1);
      p.daoStage[daoId] = st;
      var stageName = (d.stageNames && d.stageNames[st]) || ('第' + st + '境');
      if (st >= 2) {
        // 命名显现：从这一刻起，道名才允许出现在可见文案里
        G.log('万般怪相在此刻拼成了一个名字——【' + d.hiddenName + '】。' + stageName + '，成了。', '突破');
        G.sys.dao.addInsight({ id: 'dao_' + daoId, title: d.hiddenName + '之路', t: '它有名字了：' + d.hiddenName + '。我认下了。', confirm: true });
        G.history('悟出' + d.hiddenName + '之道（' + stageName + '）');
      }
      // 技能解锁
      if (d.skill && st >= (d.skill.unlockStage || 2) && !p.pflags['_skill_' + d.skill.id]) {
        p.pflags['_skill_' + d.skill.id] = true;
        G.log('你学会了【' + d.skill.name + '】——' + (d.skill.desc || ''), '吉');
      }
      G.bus.emit('dao:stage', { daoId: daoId, stage: st });
    },

    // ---- 顿悟「抑之」：tend 减半、+心魔、悟道录留痕（压制本身是构筑策略） ----
    suppress: function (daoId) {
      var d = G.get('dao', daoId), p = G.player;
      if (!d) { console.warn('[DAO] suppress 未知道途:', daoId); return; }
      p.tend[daoId] = Math.floor((p.tend[daoId] || 0) / 2);
      p.counters.xinmo = (p.counters.xinmo || 0) + 10;
      G.log('你把那股东西死死压回心底。夜里多了些睡不着的时辰。', '凶');
      G.sys.dao.addInsight({ id: 'dao_' + daoId, title: '压下去的东西', t: '我把它压下去了。它没有死，只是在等。', confirm: true });
      delete p.pflags['_awak_' + daoId]; // 倾向再涨回阈值时允许再次顿悟
      G.history('强行压下了某种异状');
    },

    // ---- 悟道录写行（{insight:{id,title,t,confirm}} op 调这里） ----
    addInsight: function (v) {
      var p = G.player;
      if (!v || !v.id) return;
      var entry = p.insights[v.id];
      if (!entry) {
        entry = p.insights[v.id] = { title: v.title || v.id, lines: [] };
        G.log('悟道录添了新的一页：「' + entry.title + '」。', '异象');
      } else if (v.title && entry.title === v.id) {
        entry.title = v.title;
      }
      if (v.t) {
        // 防同文重复
        var dup = entry.lines.some(function (l) { return l.text === v.t; });
        if (!dup) entry.lines.push({ text: v.t, confirmed: !!v.confirm });
        else if (v.confirm) entry.lines.forEach(function (l) { if (l.text === v.t) l.confirmed = true; });
      }
    },

    // 玩家当前可用技能列表（combat.js / UI 用）
    skills: function () {
      var p = G.player, out = [];
      G.all('dao').forEach(function (d) {
        if (d.skill && (p.daoStage[d.id] || 0) >= (d.skill.unlockStage || 2)) out.push({ dao: d, skill: d.skill });
      });
      return out;
    },

    // 异象 id → {dao, phenomenon} 索引（combat.js 建钩子用）
    phenomenonDef: function (phId) {
      var found = null;
      G.all('dao').forEach(function (d) {
        (d.phenomena || []).forEach(function (ph) {
          if (ph.id === phId) found = { dao: d, ph: ph };
        });
      });
      return found;
    }
  };
})();
