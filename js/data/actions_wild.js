// js/data/actions_wild.js — 黑山外围 / 黑山深处 / 废弃矿洞 行动（Owner: C2）。
//
// ── 本文件对外输出（登记）──
//   新增物品：kuanggao（矿镐，weapon atk3）、duanjian（断剑，weapon atk7，断剑崖拾取）
//   新增记忆（私有）：mem_langwang_zhan（斩狼王之忆，carry）
//   pflag：zhi_shenchu（已知深处入口）、de_duanjian（已得断剑）、de_kuanggao（已得矿镐）、
//          jian_langwang_yuji（见过狼王踪迹）、jian_langwang_woxue（见过狼王卧雪）、
//          jian_kuangdong_languang（浅处见过蓝光）、jian_kuangdi_languang（矿底见过蓝光）、
//          jian_kuangbi_kezi（见过矿壁刻名）、xun_zhi_languang（循前世记忆寻到蓝光所在）
//          ——后五个全是给 C1/C3 矿线与狼王线的咬合点。
//   legacy：langwang_slain（斩狼王）、mine_sealed（矿底怨气散，尸王灭）
//   引用记忆（C1）：mem_death_yelang / mem_death_yaolang / mem_death_heishan_langwang（死于狼属的旧梦，
//                  设陷阱的「循旧梦」路径）、mem_duanjianya（断剑崖钥匙）、mem_kuangdong_languang（矿底蓝光钥匙）
//   引用钉死事件（C3 并行）：ev_shoulie_zaoyu / ev_shenshan_zaoyu / ev_yeru_heishan / ev_kuangdong_zaoyu
//   引用已有事件：ev_langxi / ev_xueye_duanjian
//   黑山深处发现路径×2：yeru_heishan outcome、she_xianjing 旧梦 outcome（均落 pflag zhi_shenchu）。
//
// ── 自检十问 ──
// 1标签：野外/狩猎/狼/险地/矿/阴邪。2易共现：狼袭事件、血腥味、塌方、老猎户人脉、断剑崖旧梦。
// 3排斥：镇内安稳活计；重伤者干不了 risk≥2 的活（引擎过滤）。
// 4改状态：狼患/血腥味/杀气/倾向/银钱/物品/地点状态/跨世痕迹。5后果：杀狼沾血→更易引狼（事件
//   prefer 吃 tend 与 wvar 的闭环）；斩狼王/灭尸王落 legacy，改写来世初始世界。
// 6可解释：割掌引妖=血腥引兽；矿越挖越松→塌方；夹子被掰直暗示巨物。7钩子：狼王卧雪、矿壁刻名、
//   蓝光、断剑崖，全部落 pflag/记忆给 C1/C3 接。8有趣选择：白天稳猎 vs 夜里搏命 vs 以血换遭遇。
// 9服务 build：狩猎与夜行喂血与杀，幽谷喂修为，矿喂因果与胆魄。10不暴露：文案全是现象与传言。
//
// 风险诚实声明：risk 3 的「循狼嚎探源 / 下矿底」会撞上 Boss，战败即死，不设保底。
(function () {
  'use strict';

  // ════════ 本文件新增物品（契约 §6.5）════════
  G.define('item', {
    id: 'kuanggao', name: '矿镐', type: 'weapon', atk: 3, price: 8,
    desc: '矿上用的旧镐头，沉是沉了点，抡起来也算趁手。'
  });
  G.define('item', {
    id: 'duanjian', name: '断剑', type: 'weapon', atk: 7, price: 50,
    desc: '断剑崖带回的半截古剑。断口如新，握久了掌心微微发烫。'
  });

  // ════════ 本文件新增记忆（私有，斩狼王战利）════════
  G.define('memory', {
    id: 'mem_langwang_zhan', title: '斩狼之忆', kind: 'misc', carry: true,
    text: '你亲手终结了黑山之主。它倒下时，整座山的狼嚎齐齐喑哑——那种寂静，你一辈子忘不掉。',
    dream: '梦里你立在雪岭之巅，脚下伏着一头金瞳巨狼，再没有起来。'
  });

  // ════════════════ 黑山外围 ════════════════

  G.define('action', {
    id: 'yanjiulu_shoulie', name: '沿旧路狩猎', desc: '循着猎户旧道下套设伏，猎些山货。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 1, order: 10,
    effects: [],
    outcomes: [
      { weight: 4, effects: [
        { money: 6 }, { wvarAdd: { wolfThreat: -2 } }, { counterAdd: { xuexing: 1 } },
        { log: { t: '套到两只肥兔一只山鸡，镇上换了几个钱。', style: '平' } }] },
      { weight: 3, effects: [
        { itemAdd: { id: 'langpi', n: 1 } }, { wvarAdd: { wolfThreat: -4 } },
        { counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } },
        { log: { t: '陷坑里是头独狼。你补了一刀，剥皮时手很稳。', style: '血' } }] },
      { weight: 2, effects: [{ wvarAdd: { wolfThreat: 1 } },
        { log: { t: '套子空空。雪地上的蹄印乱得反常，兽群在躲什么。', style: '平' } }] },
      { weight: 1, cond: { wvar: { id: 'wolfThreat', gte: 40 } }, effects: [
        { log: { t: '你正收套子，灌木后忽然传来低低的喉音——', style: '凶' } },
        { combat: { enemy: 'yelang', intro: '一头瘦狼自灌木中跃出，直取你的咽喉！',
          onWin: [{ wvarAdd: { wolfThreat: -3 } }, { counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } }],
          onFlee: [{ log: { t: '你连滚带爬下了山，套子也顾不上收了。', style: '凶' } }] } }] }
    ],
    eventChance: { p: 0.15, pool: ['ev_shoulie_zaoyu', 'ev_langxi'] }
  });

  G.define('action', {
    id: 'cai_ningxuecao', name: '采凝血草', desc: '阴坡石缝里的凝血草能卖给药铺，也能自己留着保命。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 1, order: 20,
    effects: [{ tendAdd: { danyao: 2 } }],
    outcomes: [
      { weight: 5, effects: [{ itemAdd: { id: 'ningxuecao', n: 2 } },
        { log: { t: '半篓凝血草，叶上的露水沾了一袖。', style: '丹' } }] },
      { weight: 3, effects: [{ itemAdd: { id: 'ningxuecao', n: 1 } }, { itemAdd: { id: 'fuzhi', n: 1 } },
        { log: { t: '草丛里捡到一张被雨打湿又晒干的黄符，不知是谁丢的。', style: '平' } }] },
      { weight: 2, effects: [{ hp: -6 }, { counterAdd: { xuexing: 1 } },
        { log: { t: '石缝里的毒蜂蜇了你一口，半边手臂肿了三天。', style: '凶' } }] }
    ],
    eventChance: { p: 0.12, pool: ['ev_shoulie_zaoyu', 'ev_xueye_duanjian'] }
  });

  G.define('action', {
    id: 'she_xianjing', name: '设陷阱', desc: '在兽道的必经处下夹埋坑。猎物上不上钩，看天，也看手艺。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 1, order: 30,
    cond: { any: [{ item: { id: 'shoujia', n: 1 } }, { mem: 'mem_death_yelang' },
                  { mem: 'mem_death_yaolang' }, { mem: 'mem_death_heishan_langwang' }] },
    effects: [{ tendAdd: { xuejian: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { itemAdd: { id: 'langpi', n: 1 } }, { itemAdd: { id: 'langya', n: 1 } },
        { counterAdd: { xuexing: 2 } }, { wvarAdd: { wolfThreat: -4 } },
        { log: { t: '夹子上挂着一头早已僵硬的狼。这买卖不见刀光。', style: '血' } }] },
      { weight: 3, effects: [{ wvarAdd: { wolfThreat: 1 } },
        { log: { t: '守了几天，夹子纹丝不动。山里的东西学精了。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'wolfThreat', gte: 50 } }, effects: [
        { combat: { enemy: 'yelang', intro: '夹子拿住了一头狼崽，狼嚎未落，另一头已从侧面扑来！',
          onWin: [{ counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } }, { wvarAdd: { wolfThreat: -4 } }],
          onFlee: [{ wvarAdd: { wolfThreat: 2 } }, { log: { t: '你弃了夹上的猎物，退得没半分犹豫。', style: '凶' } }] } }] },
      { weight: 1, cond: { item: { id: 'shoujia', n: 1 } }, effects: [
        { itemDel: { id: 'shoujia', n: 1 } }, { wvarAdd: { wolfThreat: 3 } },
        { log: { t: '夹齿被生生掰直了。能干出这事的，不会是寻常的狼。', style: '凶' } }] },
      { weight: 1, cond: { nopflag: 'zhi_shenchu',
          any: [{ mem: 'mem_death_yelang' }, { mem: 'mem_death_yaolang' }, { mem: 'mem_death_heishan_langwang' }] },
        effects: [
        { pflagSet: { id: 'zhi_shenchu' } }, { revealLoc: 'heishan_shenchu' }, { tendAdd: { yinguo: 2 } },
        { log: { t: '你照着旧梦里的雪线下夹，却循着爪印寻到一条向深山去的隐径。', style: '因果' } }] }
    ],
    eventChance: { p: 0.1, pool: ['ev_shoulie_zaoyu'] }
  });

  G.define('action', {
    id: 'yeru_heishan', name: '夜入黑山', desc: '夜里的黑山是另一座山。进山的路人人认得，回来的路未必。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 3, order: 40,
    effects: [{ counterAdd: { shaqi: 1 } }, { tendAdd: { xuejian: 2 } }],
    outcomes: [
      { weight: 4, effects: [{ counterAdd: { xinmo: -1 } },
        { log: { t: '月色下你走得比白日更稳。黑暗里有什么在看你，你也在看它。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'wolfThreat', gte: 45 } }, effects: [
        { combat: { enemy: 'yaolang', intro: '夜色里两簇青芒无声亮起——它候你多时了。',
          onWin: [{ wvarAdd: { wolfThreat: -6 } }, { counterAdd: { xuexing: 3 } }, { tendAdd: { xuejian: 3 } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你跌撞着奔下山，夜露和冷汗分不清谁是谁。', style: '凶' } }] } }] },
      { weight: 3, cond: { nopflag: 'zhi_shenchu' }, effects: [
        { pflagSet: { id: 'zhi_shenchu' } }, { revealLoc: 'heishan_shenchu' },
        { log: { t: '你摸到一条兽群踩出的隐秘小径，一路向黑山深处蜿蜒而去。', style: '吉' } }] },
      { weight: 3, cond: { pflag: 'zhi_shenchu' }, effects: [
        { wvarAdd: { wolfThreat: 2 } },
        { log: { t: '深处方向的狼嚎一浪压过一浪，今夜的黑山躁动不安。', style: '凶' } }] },
      { weight: 2, effects: [
        { itemAdd: { id: 'langya', n: 1 } }, { counterAdd: { xuexing: 1 } },
        { log: { t: '你在兽尸旁拾到一枚断牙。咬出这伤口的东西，体型不小。', style: '凶' } }] },
      { weight: 1, effects: [
        { hp: -8 }, { log: { t: '一脚踩空滚下土坡，万幸只是擦伤。夜山不饶人。', style: '凶' } }] }
    ],
    eventChance: { p: 0.5, pool: ['ev_yeru_heishan', 'ev_langxi'] }
  });

  G.define('action', {
    id: 'gezhang_yinyao', name: '割掌引妖', desc: '山里的东西鼻子灵。猎户的老法子：拿伤口当饵，钓大的。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 2, order: 50,
    effects: [{ hp: -10 }, { counterAdd: { xuexing: 3 } }, { tendAdd: { xuejian: 3 } }],
    outcomes: [
      { weight: 4, effects: [
        { combat: { enemy: 'yelang', intro: '血腥气散出去不到半个时辰，草叶分开了——它来了。',
          onWin: [{ tendAdd: { xuejian: 2 } }, { counterAdd: { xuexing: 2 } }, { wvarAdd: { wolfThreat: -3 } }],
          onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '饵是你，钩也是你。今夜你差点被整个吞下。', style: '凶' } }] } }] },
      { weight: 2, cond: { wvar: { id: 'wolfThreat', gte: 45 } }, effects: [
        { combat: { enemy: 'yaolang', intro: '来的不是寻常野兽。青色的瞳孔在暗处亮起，像两簇鬼火。',
          onWin: [{ tendAdd: { xuejian: 4 } }, { counterAdd: { shaqi: 2 } }, { wvarAdd: { wolfThreat: -6 } },
            { rumorAdd: { t: '有人在黑山外围独个儿放倒了一头妖狼，拖下山时还在滴血。', fame: 3 } }],
          onFlee: [{ wvarAdd: { wolfThreat: 2 } }, { log: { t: '你且战且退。那对青瞳一路送你到林缘，没有追。', style: '凶' } }] } }] },
      { weight: 2, effects: [{ tendAdd: { xuejian: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '血滴进土里，什么都没来。只有远处一声不似狼的低吟。', style: '凶' } }] },
      { weight: 1, cond: { tend: { id: 'xuejian', gte: 30 } }, effects: [
        { tendAdd: { xuejian: 4 } },
        { insight: { id: 'shanghou_jianming', title: '伤后剑鸣', t: '血是饵，也是话。山里有东西听得懂。' } },
        { log: { t: '掌心的血还没落地，腰间的刃先轻轻响了一声。', style: '血' } }] }
    ]
  });

  G.define('action', {
    id: 'xun_duanjianya', name: '寻断剑崖', desc: '循着记忆里的路，去寻那道埋剑的断崖。崖下风声如刃。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 2, order: 60,
    cond: { mem: 'mem_duanjianya' },
    effects: [{ tendAdd: { xuejian: 2 } }],
    outcomes: [
      { weight: 3, cond: { nopflag: 'de_duanjian' }, effects: [
        { pflagSet: { id: 'de_duanjian' } }, { itemAdd: { id: 'duanjian', n: 1 } }, { tendAdd: { xuejian: 3 } },
        { log: { t: '崖底乱石间，半截古剑应着你的脚步声轻轻震颤。', style: '血' } }] },
      { weight: 3, effects: [{ cult: 8 }, { tendAdd: { xuejian: 3 } },
        { log: { t: '满崖风声都像刃出鞘。你迎着风坐了一夜，气血发烫。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -14 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '崖壁的浮石松了。你抓着藤蔓荡了半圈，肩头脱了臼。', style: '凶' } }] },
      { weight: 2, cond: { tend: { id: 'xuejian', gte: 40 } }, effects: [
        { tendAdd: { xuejian: 6 } }, { counterAdd: { xinmo: 2 } }, { qi: 4 },
        { insight: { id: 'shanghou_jianming', title: '伤后剑鸣', t: '断剑崖的剑都死了，可它们还在响。它们在应和我身上的什么。' } },
        { log: { t: '你立在崖心，四面八方的剑鸣朝你涌来，如朝如拜。', style: '血' } }] }
    ]
  });

  // ════════════════ 黑山深处 ════════════════

  G.define('action', {
    id: 'shenru_langqun', name: '深入狼群领地', desc: '越过兽道上的爪痕线，再往里，每一步都踩在狼的地界上。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 2, order: 10,
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { combat: { enemy: 'yelang', intro: '一声短促的嚎叫——哨狼发现了你！',
          onWin: [{ wvarAdd: { wolfThreat: -5 } }, { counterAdd: { xuexing: 3 } }, { tendAdd: { xuejian: 3 } }],
          onFlee: [{ wvarAdd: { wolfThreat: 1 } }, { log: { t: '嚎声在你身后此起彼伏，一路送你出了林子。', style: '凶' } }] } }] },
      { weight: 3, cond: { wvar: { id: 'wolfThreat', gte: 40 } }, effects: [
        { combat: { enemy: 'yaolang', intro: '挡在兽道中央的，是一头有人那么高的妖狼。它没有嚎，只是盯着你。',
          onWin: [{ wvarAdd: { wolfThreat: -8 } }, { tendAdd: { xuejian: 3 } }, { counterAdd: { xuexing: 3 } },
            { npcFavAdd: { id: 'lao_liehu', n: 4 } },
            { rumorAdd: { t: '黑山深处的狼嚎，近来稀了。', fame: 2 } }],
          onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '你退出兽道时，后背的衣裳已经湿透。', style: '凶' } }] } }] },
      { weight: 2, cond: { any: [{ fame: { gte: 35 } }, { counter: { id: 'shaqi', gte: 8 } }, { title: 'heishan_lielangren' }] },
        effects: [{ counterAdd: { shaqi: 1 } }, { tendAdd: { xuejian: 1 } },
        { log: { t: '狼群在你三丈外停住，竟无一头敢上前。', style: '世界' } }] },
      { weight: 1, effects: [
        { pflagSet: { id: 'jian_langwang_yuji' } }, { wvarAdd: { wolfThreat: 2 } },
        { log: { t: '岩壁上一道四指宽的爪痕，比你人还高，新鲜得渗着树汁。', style: '凶' } }] }
    ],
    eventChance: { p: 0.3, pool: ['ev_shenshan_zaoyu', 'ev_langxi'] }
  });

  G.define('action', {
    id: 'xun_langhao', name: '循狼嚎探源', desc: '所有狼嚎都朝着同一处山坳汇去。去那里的人，没有回来过。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 3, order: 20,
    cond: { bossAlive: 'heishan_langwang' },
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { combat: { enemy: 'heishan_langwang',
          intro: '岩顶之上，金色的独目缓缓睁开——黑山之主，就在那里等你。',
          onWin: [
            { bossSet: { enemy: 'heishan_langwang', alive: false } },
            { legacySet: { id: 'langwang_slain', v: true } },
            { wvarAdd: { wolfThreat: -60 } }, { wvarAdd: { villageFear: -25 } },
            { counterAdd: { xuexing: 5 } }, { counterAdd: { shaqi: 3 } }, { tendAdd: { xuejian: 6 } },
            { memAdd: 'mem_langwang_zhan' },
            { npcFavAdd: { id: 'lao_liehu', n: 10 } },
            { rumorAdd: { t: '黑山狼王死了！有人拖着那张小马驹大的狼皮下了山！', fame: 30 } },
            { log: { t: '狼王倒下的那一刻，整座黑山静得能听见雪落。', style: '血' } }],
          onFlee: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 3 } }, { wvarAdd: { wolfThreat: 5 } },
            { log: { t: '你不记得怎么逃下山的，只记得那声嚎在背后半月不散。', style: '凶' } }] } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'yaolang', intro: '离山坳还有半里，狼王的亲卫先一步拦住了你。',
          onWin: [{ wvarAdd: { wolfThreat: -6 } }, { tendAdd: { xuejian: 3 } }, { counterAdd: { xuexing: 3 } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你退了。山坳的方向传来一声长嚎，像是在笑。', style: '凶' } }] } }] },
      { weight: 2, effects: [
        { pflagSet: { id: 'jian_langwang_woxue' } }, { counterAdd: { xinmo: 2 } },
        { log: { t: '山坳里空无一狼，只有一圈巨大的卧痕，雪底余温未散。', style: '凶' } }] }
    ],
    eventChance: { p: 0.2, pool: ['ev_shenshan_zaoyu'] }
  });

  G.define('action', {
    id: 'yougu_tuna', name: '幽谷吐纳', desc: '深山里有处雾气不散的谷地，在那打坐，一口气能沉到脚底。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 1, order: 30,
    effects: [{ cult: 13 }, { qi: 6 }],
    outcomes: [
      { weight: 5, effects: [{ counterAdd: { xinmo: -1 } },
        { log: { t: '谷中只闻风声水声。你坐到月上中天才睁眼。', style: '平' } }] },
      { weight: 2, cond: { locvar: { loc: 'heishan_shenchu', key: 'spiritualEnergy', gte: 40 } }, effects: [
        { cult: 6 }, { log: { t: '谷底的雾绕着你转了一夜，今日的功课顺得反常。', style: '吉' } }] },
      { weight: 2, effects: [
        { combat: { enemy: 'yelang', intro: '入定正深，一声低吼贴着耳根炸开——有兽寻味而至！',
          onWin: [{ counterAdd: { xuexing: 1 } }, { tendAdd: { xuejian: 1 } }],
          onFlee: [{ cult: -4 }, { log: { t: '仓皇出谷，一月吐纳的气机散了大半。', style: '凶' } }] } }] },
      { weight: 1, effects: [{ tendAdd: { xuejian: 1 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '吸进肺里的山气，带着一丝若有似无的铁锈味。', style: '凶' } }] }
    ],
    eventChance: { p: 0.15, pool: ['ev_shenshan_zaoyu'] }
  });

  // ════════════════ 废弃矿洞 ════════════════

  G.define('action', {
    id: 'shi_kuangxie', name: '拾矿屑', desc: '塌方浅处还能扒拉出些矿渣碎铁，背去铁匠铺换钱。',
    loc: 'feikuang', timeCost: 1, risk: 1, order: 10,
    effects: [{ money: 4 }],
    outcomes: [
      { weight: 4, effects: [{ money: 2 },
        { log: { t: '敲敲打打半个月，碎铁攒了小半篓。', style: '平' } }] },
      { weight: 2, cond: { nopflag: 'de_kuanggao' }, effects: [
        { pflagSet: { id: 'de_kuanggao' } }, { itemAdd: { id: 'kuanggao', n: 1 } },
        { log: { t: '塌石底下扒出半截矿镐，柄上的手汗印还在。', style: '平' } }] },
      { weight: 2, effects: [{ hp: -5 }, { wvarAdd: { mineInstability: 2 } },
        { log: { t: '头顶簌簌落灰，一块拳头大的石头擦着耳朵砸下。', style: '凶' } }] },
      { weight: 2, effects: [{ itemAdd: { id: 'huozhezi', n: 1 } }, { tendAdd: { yinguo: 1 } },
        { log: { t: '洞口石缝里塞着个锈铁盒，里头的火折子竟还是干的。', style: '平' } }] },
      { weight: 1, cond: { locvar: { loc: 'feikuang', key: 'corruption', gte: 30 } }, effects: [
        { pflagSet: { id: 'jian_kuangdong_languang' } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '矿道深处，一点幽蓝的光闪了一下，像谁眨了下眼。', style: '异象' } }] }
    ],
    eventChance: { p: 0.12, pool: ['ev_kuangdong_zaoyu'] }
  });

  G.define('action', {
    id: 'tan_kuangdao', name: '探矿道', desc: '顺着主矿道往里走。烂支架嘎吱作响，谁也说不准哪步会塌。',
    loc: 'feikuang', timeCost: 1, risk: 2, order: 20,
    effects: [{ counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [{ money: 9 }, { wvarAdd: { mineInstability: 2 } },
        { log: { t: '一架翻倒的矿车底下，摸出个没烂透的钱袋。', style: '吉' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'shigui', intro: '岔道的黑暗里，指甲刮擦岩壁的声音越来越近。',
          onWin: [{ counterAdd: { shaqi: 2 } }, { tendAdd: { yinguo: 2 } },
            { log: { t: '枯骨散了一地，矿道里的呜咽声轻了些。', style: '因果' } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你倒退着奔出矿道，那刮擦声跟到洞口才停。', style: '凶' } }] } }] },
      { weight: 2, cond: { wvar: { id: 'mineInstability', gte: 60 } }, effects: [
        { hp: -18 }, { injure: { months: 2, severity: 2 } },
        { wvarAdd: { mineInstability: -15 } }, { locvarAdd: { loc: 'feikuang', key: 'danger', n: 5 } },
        { log: { t: '轰然一声，半条矿道塌了。你从石缝里爬出来时，半身是血。', style: '凶' } }] },
      { weight: 2, cond: { item: { id: 'huozhezi', n: 1 } }, effects: [
        { pflagSet: { id: 'jian_kuangbi_kezi' } }, { tendAdd: { yinguo: 2 } }, { cult: 4 },
        { log: { t: '火光照见岩壁上密密麻麻刻满名字，最后一行只刻了一半。', style: '因果' } }] }
    ],
    eventChance: { p: 0.3, pool: ['ev_kuangdong_zaoyu'] }
  });

  G.define('action', {
    id: 'xia_kuangdi', name: '下矿底', desc: '没人知道矿底有多深。下去过的人，都没把答案带上来。',
    loc: 'feikuang', timeCost: 1, risk: 3, order: 30,
    cond: { item: { id: 'huozhezi', n: 1 } },
    effects: [{ counterAdd: { xinmo: 2 } }],
    outcomes: [
      { weight: 4, effects: [
        { combat: { enemy: 'shigui', intro: '矿底的尸气浓得呛人。火光尽头，佝偻的影子不止一条。',
          onWin: [{ money: 6 }, { counterAdd: { shaqi: 2 } }, { tendAdd: { yinguo: 1 } },
            { log: { t: '尸鬼怀里还揣着发霉的工牌。你把它摆正了才走。', style: '因果' } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你的火折子晃灭了一瞬。再亮起时，你已在往上爬。', style: '凶' } }] } }] },
      { weight: 2, effects: [
        { pflagSet: { id: 'jian_kuangdi_languang' } }, { tendAdd: { yinguo: 3 } },
        { counterAdd: { xinmo: 2 } }, { qi: 5 },
        { log: { t: '幽蓝的光自矿底漫上来，你听见数不清的、极轻的呼吸。', style: '异象' } }] },
      { weight: 3, cond: { mem: 'mem_kuangdong_languang' }, effects: [
        { pflagSet: { id: 'xun_zhi_languang' } }, { tendAdd: { yinguo: 3 } }, { cult: 10 }, { qi: 6 },
        { log: { t: '主巷左手，第三条支巷。它还悬在那里，像在等你数完。', style: '因果' } }] },
      { weight: 2, effects: [
        { hp: -16 }, { injure: { months: 2, severity: 2 } }, { wvarAdd: { mineInstability: -12 } },
        { log: { t: '下到一半，整条竖井都在落石。你是抠着岩缝爬回来的。', style: '凶' } }] },
      { weight: 1, cond: { bossAlive: 'kuangdong_shiwang' }, effects: [
        { combat: { enemy: 'kuangdong_shiwang',
          intro: '火光落进矿底最深的水洼。水洼里，一具覆满矿尘的巨大尸身，睁开了眼。',
          onWin: [
            { bossSet: { enemy: 'kuangdong_shiwang', alive: false } },
            { legacySet: { id: 'mine_sealed', v: true } },
            { wvarSet: { mineInstability: 15 } },
            { locvarAdd: { loc: 'feikuang', key: 'corruption', n: -30 } },
            { counterAdd: { shaqi: 4 } }, { tendAdd: { yinguo: 4 } },
            { rumorAdd: { t: '废矿里那东西没了。夜里再没人听见山底下的动静。', fame: 25 } },
            { log: { t: '百十年的怨气随尘而散，矿底头一回这样安静。', style: '因果' } }],
          onFlee: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } },
            { log: { t: '你连滚带爬逃出矿洞。身后的黑暗里，那东西没有追。', style: '凶' } }] } }] }
    ],
    eventChance: { p: 0.35, pool: ['ev_kuangdong_zaoyu'] }
  });
})();
