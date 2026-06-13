// js/systems/rumor.js — 传闻 / 称号 / 名望 / 装逼反馈（契约 §9 评价沉淀 + DESIGN §四.10）。
//
// 称号数据形态（C5 必读）：
//   G.define('title', {
//     id, name, desc,
//     fame: 8,                       // 授予时名望
//     rumor: "……",                   // 可选：授予时自动散布的传闻
//     autoCond: {kills:{id:"yelang", gte:3}}   // 可选：满足即自动授予（月末+每战后检查）
//   });
// 没有 autoCond 的称号由内容用 {titleAdd:"id"} 显式授予。
// 装逼反馈注册：G.sys.social.onCombat(fn)；fn({enemyId,result,rating,boss}) 在每场战斗结束后被调。
(function () {
  'use strict';
  G.sys = G.sys || {};

  G.sys.rumor = {
    // 传闻：自动盖时间戳；fame 顺带加名望
    add: function (text, fame) {
      if (!G.world) return;
      G.world.rumors.unshift({ text: text, ym: G.ymText(), weight: 1 });
      if (G.world.rumors.length > G.BAL.rumorCap) G.world.rumors.pop();
      if (fame) G.player.fame = Math.max(0, G.player.fame + fame);
      G.log('坊间传闻：' + text, '世界');
    },

    // 称号授予：自动 log + fame + meta.echoes 残响登记
    grantTitle: function (id) {
      var p = G.player;
      var def = G.get('title', id);
      if (!def) { console.warn('[TITLE] 未知称号:', id); return; }
      if (p.titles.indexOf(id) >= 0) return;
      p.titles.push(id);
      p.fame += (def.fame || 0);
      G.log('世人开始这样称呼你——【' + def.name + '】。', '吉');
      G.history('得称号「' + def.name + '」');
      G.meta.carried.echoes.push({ title: id, name: def.name, life: p.lifeIndex });
      if (def.rumor) this.add(def.rumor, 0);
      G.bus.emit('title:grant', { titleId: id });
    },

    // autoCond 称号检查（月末 + 战后）
    checkAutoTitles: function () {
      var p = G.player;
      if (!p || p.dead) return;
      var self = this;
      G.all('title').forEach(function (t) {
        if (!t.autoCond) return;
        if (p.titles.indexOf(t.id) >= 0) return;
        if (G.cond(t.autoCond)) self.grantTitle(t.id);
      });
    }
  };

  // ---- 装逼反馈注册口 ----
  G.sys.social = {
    _combatReactions: [],
    onCombat: function (fn) { this._combatReactions.push(fn); }
  };

  G.bus.on('combat:end', function (payload) {
    // 引擎保底反馈：漂亮仗/Boss 仗自动起传闻（内容可用 onCombat 加更具体的）
    if (payload.result === 'win' || payload.result === 'press') {
      var ename = (G.get('enemy', payload.enemyId) || {}).name || '什么东西';
      if (payload.boss) {
        G.sys.rumor.add('那头【' + ename + '】，真的被人解决了。', 5);
      } else if (payload.rating === '秒杀') {
        G.sys.rumor.add('据说有人一照面就格杀了' + ename + '，眼都没眨。', 2);
      } else if (payload.rating === '威压降服') {
        G.sys.rumor.add('听说' + ename + '见了那人，竟不敢动手。', 2);
      }
    }
    G.sys.social._combatReactions.forEach(function (fn) {
      try { fn(payload); } catch (e) { console.error('[SOCIAL] 战斗反应异常:', e); }
    });
  });
})();
