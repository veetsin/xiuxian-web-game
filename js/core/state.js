// js/core/state.js — 状态工厂（契约 §4）+ 平衡常数（契约 §16）。
// G.world / G.player / G.meta 三大状态在此创建；具体填充由 birth/reincarnation 系统完成。
(function () {
  'use strict';

  G.sys = G.sys || {};

  // 平衡基线（契约 §16）
  G.BAL = {
    cultNeed: [60, 150, 300, 600, 1000, 1600],   // realmIdx i → i+1 所需修为
    lifespan: [50, 58, 68, 80, 95, 115, 200],    // 各境界寿元（年）
    logCap: 150,
    rumorCap: 30
  };

  G.world = null;
  G.player = null;
  G.meta = null;

  // 跨轮回元数据
  G.newMeta = function () {
    return {
      reincarnationCount: 0,
      legacy: {},                                   // 跨世世界痕迹 {id:true}
      carried: { memories: [], insights: {}, tendSeed: {}, echoes: [] },
      lastDeath: null                               // {cause, locId, ym}
    };
  };

  // 新一世的世界（从 location/npc 注册数据实例化；legacy 修正由 reincarnation.applyLegacy 做）
  G.newWorld = function () {
    var w = {
      year: 1, month: 1, season: '春', weather: '晴',
      vars: { wolfThreat: 25, villageFear: 20, ghostQi: 30, mineInstability: 20, sectAttention: 0, marketPrice: 100 },
      flags: {},
      locations: {}, npcs: {},
      rumors: [], eventQueue: [], history: []
    };
    G.all('location').forEach(function (d) {
      w.locations[d.id] = {
        id: d.id,
        danger: d.danger0 || 0,
        spiritualEnergy: d.spiritualEnergy0 || 0,
        corruption: d.corruption0 || 0,
        stability: d.stability0 != null ? d.stability0 : 100,
        discovered: d.discovered0 !== false,
        bossAlive: !!d.boss,
        tags: (d.tags || []).slice(),
        vars: {}
      };
    });
    G.all('npc').forEach(function (d) {
      w.npcs[d.id] = {
        id: d.id, alive: true, fav: d.fav0 || 0,
        realm: d.realm0 || 0, location: d.loc || 'qingshizhen', flags: {}
      };
    });
    return w;
  };

  // 空白玩家（出生系统负责填肉）
  G.newPlayer = function () {
    var tend = {}, daoStage = {};
    G.all('dao').forEach(function (d) { tend[d.id] = 0; daoStage[d.id] = 0; });
    return {
      name: '无名', lifeIndex: 1, birthId: null,
      ageY: 12, realmIdx: 0,
      hp: 40, maxHp: 40, qi: 10, maxQi: 10,
      cult: 0, cultNeed: G.BAL.cultNeed[0],
      lifespan: G.BAL.lifespan[0],
      money: 0, fame: 0,
      stats: { li: 3, ti: 3, min: 3, shen: 3 },
      counters: { dandu: 0, xuexing: 0, shaqi: 0, xinmo: 0 },
      inventory: [], traits: [],
      tend: tend, daoStage: daoStage,
      phenomena: [],
      insights: {},          // {entryId:{title, lines:[{text, confirmed}]}}
      memories: [], titles: [], pflags: {},
      injury: { months: 0, severity: 0 },
      location: 'qingshizhen',
      pet: null,             // 驭兽系统：null=无兽。数据形见 js/systems/beast.js 文件头 §A
      dead: false
    };
  };

  // 衍生数值
  G.realmName = function () { return G.IDS.realms[G.player.realmIdx] || '凡身'; };
  G.playerWeapon = function () { // 自动佩戴 atk 最高的武器
    var best = null;
    (G.player.inventory || []).forEach(function (it) {
      var d = G.get('item', it.id);
      if (d && d.type === 'weapon' && (!best || d.atk > best.atk)) best = d;
    });
    return best;
  };
  G.playerAtk = function () {
    var wpn = G.playerWeapon();
    return G.player.stats.li * 3 + (wpn ? wpn.atk : 0);
  };
  G.playerDef = function () { return G.player.stats.ti; };
})();
