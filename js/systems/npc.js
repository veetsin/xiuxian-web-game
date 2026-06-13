// js/systems/npc.js — NPC 月度行动框架（契约 §13 NPC 动态）。数据驱动，npcs.js 写内容。
//
// NPC 数据形态（C5 必读）：
//   G.define('npc', {
//     id, name, desc,
//     loc: "qingshizhen",        // 常驻地点（NPCState.location 初值）
//     fav0: 0, realm0: 0,        // 初始好感 / 初始境界
//     monthly: [                 // 月度行为表：每月逐条评估，cond 过 + chance 中 → 执行 effects
//       { cond: {wvar:{id:"wolfThreat", gte:50}},  // 条件 DSL，可省（=恒真）
//         chance: 0.5,                             // 概率，可省（=必发）
//         effects: [ ...效果 DSL... ],              // 标准效果 op（wvarAdd/rumorAdd/npcSet/log 等）
//         note: "老猎户上山压狼患" }                  // 注释，引擎不读
//     ]
//   });
// 对话/交互类内容请直接在 npcs.js 里 G.define('action', {...cond:{npcFav:...}}) 挂到地点上。
// NPC 死亡：effects 里 {npcSet:{id:"x", key:"alive", v:false}}；死后月度行为自动停。
(function () {
  'use strict';
  G.sys = G.sys || {};

  G.sys.npc = {
    monthly: function () {
      G.all('npc').forEach(function (def) {
        var st = G.npcState(def.id);
        if (!st || !st.alive) return;
        (def.monthly || []).forEach(function (rule) {
          if (G.player.dead) return;
          if (rule.cond && !G.cond(rule.cond)) return;
          if (rule.chance != null && !G.rng.chance(rule.chance)) return;
          G.fx(rule.effects || [], { cause: def.name, npc: def.id });
        });
      });
    }
  };
})();
