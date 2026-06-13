// js/core/save.js — 本地存档。
//   · 自动槽：localStorage 键 qingshi_save_v1，每月 tick 末自动存（time.js 调用），刷新不丢。
//   · 手动文件：导出/导入 JSON 文件，可长期保存、跨浏览器/跨设备迁移（纯本地，无服务器/账号）。
// 序列化范围：G.world + G.player + G.meta + 日志尾部 + rng 状态 + 未弹出的事件队列。
// 战斗中不存档（战斗状态不可序列化，UI 层亦拦）。snapshot()/restore() 为自动槽与文件共用的内核。
(function () {
  'use strict';
  G.save = {
    KEY: 'qingshi_save_v1',
    BACKUP_KEY: 'qingshi_save_backup_before_import', // 导入前自动备份当前存档，防误导入
    APP: 'qingshi-wendaolu',                         // 文件归属标识，导入时据此拒绝异类文件
    SCHEMA_VERSION: 1,                               // 存档数据结构版本
    GAME_VERSION: 'dev',                             // 项目版本（暂无版本号，占位 dev）

    // ---- 内核：把当前游戏状态打包成可序列化的数据对象 ----
    snapshot: function () {
      return {
        v: 1, t: Date.now(),
        world: G.world, player: G.player, meta: G.meta,
        log: G.logBuffer.slice(-G.BAL.logCap),
        rng: G.rng.getState(),
        pendingEvents: G.sys.events.pending.slice()
      };
    },

    // ---- 内核：把数据对象恢复进游戏状态（自动槽 read 与文件 import 共用）----
    restore: function (data) {
      G.world = data.world;
      G.player = data.player;
      G.meta = data.meta || G.newMeta();
      G.logBuffer = data.log || [];
      if (data.rng != null) G.rng.setState(data.rng);
      G.sys.events.pending = data.pendingEvents || [];
      G.combat = null;
    },

    exists: function () {
      try { return !!localStorage.getItem(this.KEY); } catch (e) { return false; }
    },

    // ---- 自动槽：写 localStorage ----
    write: function (auto) {
      if (!G.world || !G.player || G.player.dead) return false;
      if (G.combat && !G.combat.over) return false; // 战斗中不存
      try {
        localStorage.setItem(this.KEY, JSON.stringify(this.snapshot()));
        if (!auto) G.ui.toast('已保存。');
        return true;
      } catch (e) {
        console.error('[SAVE] 写入失败:', e);
        if (!auto) G.ui.toast('存档失败（localStorage 不可用）。');
        return false;
      }
    },

    // ---- 自动槽：读 localStorage ----
    read: function () {
      var raw;
      try { raw = localStorage.getItem(this.KEY); } catch (e) { raw = null; }
      if (!raw) return false;
      var data;
      try { data = JSON.parse(raw); } catch (e) { console.error('[SAVE] 存档损坏:', e); return false; }
      if (!data || !data.world || !data.player) return false;
      this.restore(data);
      return true;
    },

    clear: function () {
      try { localStorage.removeItem(this.KEY); } catch (e) { /* 忽略 */ }
    },

    // ════════════════ 手动文件：导出 ════════════════
    // 生成 {app, schemaVersion, exportedAt, gameVersion, data} 包裹并触发浏览器下载。
    // 纯前端 Blob 下载，无第三方库；file:// 与 GitHub Pages 均可用。
    exportFile: function () {
      if (!G.world || !G.player) { G.ui.toast('尚无可导出的存档。'); return false; }
      var wrapper = {
        app: this.APP,
        schemaVersion: this.SCHEMA_VERSION,
        exportedAt: new Date().toISOString(),
        gameVersion: this.GAME_VERSION,
        data: this.snapshot()
      };
      var text;
      try { text = JSON.stringify(wrapper); }
      catch (e) { console.error('[SAVE] 导出序列化失败:', e); G.ui.toast('导出失败：存档无法序列化。'); return false; }

      var date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      var name = 'qingshi-save-life-' + (G.player.lifeIndex || 1) + '-' + date + '.json';
      try {
        var blob = new Blob([text], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = name;
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { try { URL.revokeObjectURL(url); } catch (e) { /* 忽略 */ } }, 1500);
        G.ui.toast('已导出：' + name);
        G.log('已导出本地存档文件：' + name, '世界');
        return true;
      } catch (e) {
        console.error('[SAVE] 导出下载失败:', e);
        G.ui.toast('导出失败（浏览器不支持文件下载）。');
        return false;
      }
    },

    // ════════════════ 手动文件：导入 ════════════════
    // 校验包裹合法性；合法则弹确认（覆盖当前进度），确认后备份+恢复+写回+刷新。
    // 失败一律不动当前存档，仅走日志/toast 提示。
    _validateExport: function (w) {
      if (!w || typeof w !== 'object' || Array.isArray(w)) return { ok: false, msg: '存档文件无法识别。' };
      if (w.app !== this.APP) return { ok: false, msg: '这不是《青石问道录》的存档文件。' };
      var d = w.data;
      if (!d || typeof d !== 'object' || Array.isArray(d)) return { ok: false, msg: '存档缺少数据。' };
      if (!d.world || !d.player) return { ok: false, msg: '存档结构不完整，缺世界或角色数据。' };
      return { ok: true };
    },

    importFromText: function (text) {
      var wrapper;
      try { wrapper = JSON.parse(text); }
      catch (e) { G.ui.toast('存档文件损坏：不是合法 JSON。'); G.log('导入失败：文件不是合法 JSON。', '凶'); return false; }

      var v = this._validateExport(wrapper);
      if (!v.ok) { G.ui.toast(v.msg); G.log('导入失败：' + v.msg, '凶'); return false; }

      var self = this;
      var li = (wrapper.data.player && wrapper.data.player.lifeIndex) || '?';
      var when = wrapper.exportedAt ? '（导出于 ' + String(wrapper.exportedAt).slice(0, 10) + '）' : '';
      var info = '此存档为第' + li + '世' + when + '。导入将覆盖当前进度——原存档会自动备份。确意续此前缘？';
      G.ui.confirmBox(info, function () { self._applyImport(wrapper); });
      return true;
    },

    _applyImport: function (wrapper) {
      // 1) 导入前备份当前 localStorage 存档（防误导入）
      try {
        var cur = localStorage.getItem(this.KEY);
        localStorage.setItem(this.BACKUP_KEY, cur == null ? '' : cur);
      } catch (e) { /* localStorage 不可用也不阻断导入 */ }

      // 2) 恢复 → 写回。出错则从备份回滚，绝不留半残状态。
      try {
        this.restore(wrapper.data);
        localStorage.setItem(this.KEY, JSON.stringify(this.snapshot())); // 直写，绕过 write 的 dead 守护
      } catch (e) {
        console.error('[SAVE] 导入恢复失败:', e);
        try {
          var bk = localStorage.getItem(this.BACKUP_KEY);
          if (bk) { localStorage.setItem(this.KEY, bk); this.read(); }
        } catch (e2) { /* 回滚也失败，已无能为力，但不抛出 */ }
        G.ui.mode = 'loc'; G.ui.refresh();
        G.ui.toast('导入失败：存档结构异常，已保留原存档。');
        G.log('导入失败：存档结构异常，已回退原存档。', '凶');
        return false;
      }

      G.ui.mode = 'loc'; G.ui.refresh();
      G.ui.toast('导入成功，前缘已续。');
      G.log('已导入本地存档，前缘自异处续起。', '世界');
      return true;
    }
  };
})();
