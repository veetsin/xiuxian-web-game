// js/core/save.js — localStorage 存档。键 qingshi_save_v1；每月 tick 末自动存档（time.js 调用）。
// 序列化范围：G.world + G.player + G.meta + 日志尾部(150条) + rng 状态 + 未弹出的事件队列。
// 战斗中不存档（战斗状态不可序列化，UI 层也会拦）。
(function () {
  'use strict';
  G.save = {
    KEY: 'qingshi_save_v1',

    exists: function () {
      try { return !!localStorage.getItem(this.KEY); } catch (e) { return false; }
    },

    write: function (auto) {
      if (!G.world || !G.player || G.player.dead) return false;
      if (G.combat && !G.combat.over) return false; // 战斗中不存
      var data = {
        v: 1, t: Date.now(),
        world: G.world, player: G.player, meta: G.meta,
        log: G.logBuffer.slice(-G.BAL.logCap),
        rng: G.rng.getState(),
        pendingEvents: G.sys.events.pending.slice()
      };
      try {
        localStorage.setItem(this.KEY, JSON.stringify(data));
        if (!auto) G.ui.toast('已保存。');
        return true;
      } catch (e) {
        console.error('[SAVE] 写入失败:', e);
        if (!auto) G.ui.toast('存档失败（localStorage 不可用）。');
        return false;
      }
    },

    read: function () {
      var raw;
      try { raw = localStorage.getItem(this.KEY); } catch (e) { raw = null; }
      if (!raw) return false;
      var data;
      try { data = JSON.parse(raw); } catch (e) { console.error('[SAVE] 存档损坏:', e); return false; }
      if (!data || !data.world || !data.player) return false;
      G.world = data.world;
      G.player = data.player;
      G.meta = data.meta || G.newMeta();
      G.logBuffer = data.log || [];
      if (data.rng != null) G.rng.setState(data.rng);
      G.sys.events.pending = data.pendingEvents || [];
      G.combat = null;
      return true;
    },

    clear: function () {
      try { localStorage.removeItem(this.KEY); } catch (e) { /* 忽略 */ }
    }
  };
})();
