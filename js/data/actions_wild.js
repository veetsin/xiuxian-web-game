// js/data/actions_wild.js — 黑山外围 / 黑山深处 / 废弃矿洞 + v2 寒潭 / 断剑崖 / 后山兽径 行动（Owner: C2）。
//
// ── 本文件对外输出（登记）──
//   新增物品：kuanggao（矿镐，weapon atk3）、duanjian（断剑，weapon atk7，断剑崖拾取）
//     ┄ v2 ┄ zaobing_gao（凿冰镐，weapon atk4，寒潭凿冰用，可售）、hanjing（寒萤石，material，寒潭采得，售/喂寒）、
//             jianjue_canpian（剑诀残篇，consumable，断剑崖拾取，喂御剑）、shouwang_zhua（兽王爪，material，后山战利，售）
//   新增记忆（私有）：mem_langwang_zhan（斩狼王之忆，carry）
//     ┄ v2 ┄ mem_hantan_languang（寒潭蓝光机缘，carry，handu 轮回线）、mem_jianzhong_jianming（剑冢剑鸣机缘，carry，yujian 轮回线）
//   pflag：zhi_shenchu / de_duanjian / de_kuanggao / jian_langwang_yuji / jian_langwang_woxue /
//          jian_kuangdong_languang / jian_kuangdi_languang / jian_kuangbi_kezi / xun_zhi_languang
//     ┄ v2 ┄ zhi_hantan（已知寒潭入口）、zhi_duanjianya（已知断剑崖入口）、zhi_houshan（已知后山兽径入口）、
//            de_jianjue（已得剑诀残篇）、xun_shouwang_ji（见过兽王坟）、ting_jianming（听过满崖剑鸣）
//   legacy：langwang_slain / mine_sealed
//     ┄ v2（新 Boss 击破，applyLegacy 已接）┄ hantan_ding（寒潭镇）、jianzhong_renzhu（剑冢认主）、shouwang_fu（兽王臣服）
//   引用记忆（C1 并行）：mem_death_yelang / mem_death_yaolang / mem_death_heishan_langwang / mem_duanjianya / mem_kuangdong_languang
//   引用 Boss/敌（C4 并行，蓝图 §3 钉死）：hantan_jiao / jianzhong_jianling / houshan_shouwang（Boss）；
//                                         hanjiao_you / jianzhong_canling / bali（普通敌）
//   引用 Boss 战败记忆（C1 并行）：mem_death_hantan_jiao / mem_death_jianzhong_jianling / mem_death_houshan_shouwang
//   引用钉死事件（C3 并行）：ev_shoulie_zaoyu / ev_shenshan_zaoyu / ev_yeru_heishan / ev_kuangdong_zaoyu
//   引用已有事件：ev_langxi / ev_xueye_duanjian
//   发现路径登记：黑山深处←yeru_heishan / she_xianjing；寒潭←xia_kuangdi 寒线 outcome（落 zhi_hantan/revealLoc hantan）；
//                断剑崖←黑山深处 tan_duanjianya（落 zhi_duanjianya/revealLoc duanjianya）；
//                后山兽径←黑山深处 xun_shoujing（落 zhi_houshan/revealLoc houshan_lin）。
//
// ── 自检十问 ──
// 1标签：野外/狩猎/狼/险地/矿/阴邪/寒/水/剑/兽。2易共现：狼袭、血腥味、塌方、寒雾、剑鸣、兽踪、老猎户人脉。
// 3排斥：镇内安稳活计；重伤者干不了 risk≥2 的活（引擎过滤）；地下/水底与雷雨天象互斥。
// 4改状态：狼患/血腥味/杀气/倾向/银钱/物品/地点状态/跨世痕迹。5后果：杀狼沾血→更易引狼；斩 Boss 落 legacy 改来世初始世界；
//   采冰淬体也冻骨；崖前听剑喂剑也耗神。6可解释：血腥引兽；矿越挖越松→塌方；寒潭千年蛟养寒；剑庐弃剑成崖。
// 7钩子：狼王卧雪、矿壁刻名、蓝光、断剑崖、兽王坟、满崖剑鸣，全部落 pflag/记忆给 C1/C3 接。
// 8有趣选择：白天稳猎 vs 夜里搏命 vs 以血换遭遇 vs 凿冰淬体 vs 崖前问剑。
// 9服务 build：狩猎/夜行喂血与杀，幽谷喂修为，矿喂因果，寒潭喂寒，断剑崖喂剑，后山喂兽。10不暴露：文案全是现象与传言。
//
// 风险诚实声明：risk 3 的「循狼嚎探源 / 下矿底 / 循冰探源 / 试剑 / 寻兽王迹」会撞上 Boss，战败即死，不设保底。
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
  // ┄ v2 ┄
  G.define('item', {
    id: 'zaobing_gao', name: '凿冰镐', type: 'weapon', atk: 4, price: 16,
    desc: '采冰人专用的尖镐，镐头淬过寒，碰一下就能冻住伤口的血。'
  });
  G.define('item', {
    id: 'hanjing', name: '寒萤石', type: 'material', price: 18,
    desc: '寒潭冰下采出的幽蓝石子，攥在掌心冰得发疼，夜里自己会亮。识货的郎中见了走不动道。'
  });
  G.define('item', {
    id: 'jianjue_canpian', name: '剑诀残篇', type: 'consumable', price: 40,
    desc: '断剑崖石缝里捡的半页剑诀，墨迹被剑气蚀得只剩一半，另一半要自己用剑去补。',
    use: [{ cult: 12 }, { tendAdd: { yujian: 6 } },
          { log: { t: '残页上的剑招在你眼前自行游走，指节不由自主跟着虚划。', style: '异象' } }]
  });
  G.define('item', {
    id: 'shouwang_zhua', name: '兽王爪', type: 'material', price: 45,
    desc: '后山巨兽的一只前爪，比人手还宽，爪尖能划开熟铁。猎户说挂在门上，百兽不近。'
  });

  // ════════ 本文件新增记忆（私有，斩狼王战利 + v2 机缘）════════
  G.define('memory', {
    id: 'mem_langwang_zhan', title: '斩狼之忆', kind: 'misc', carry: true,
    text: '你亲手终结了黑山之主。它倒下时，整座山的狼嚎齐齐喑哑——那种寂静，你一辈子忘不掉。',
    dream: '梦里你立在雪岭之巅，脚下伏着一头金瞳巨狼，再没有起来。'
  });
  // ┄ v2 机缘记忆 mem_hantan_languang / mem_jianzhong_jianming 由 C1 memories.js 单独定义；
  //    本文件只 memAdd / cond 引用，不重复 G.define（避免 [REG] 覆盖）。

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
    id: 'ye_xun_huao', name: '夜行寻坳', desc: '夜里的黑山外围背阴处，常飘出一股甜腥的香。循香去看，是福是祟难说。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 1, order: 25,
    cond: { nopflag: 'zhi_huao' },
    effects: [{ counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { pflagSet: { id: 'zhi_huao' } }, { revealLoc: 'hupo_ao' }, { tendAdd: { humei: 2 } },
        { log: { t: '甜香引你转进一处背阴山坳，青瓦小院里隐约有狐影掠过。', style: '异象' } }] },
      { weight: 3, cond: { season: '冬' }, effects: [
        { tendAdd: { handu: 2 } }, { qi: 3 },
        { log: { t: '雪夜的山风冷得彻骨，你踏雪而行，呼吸间寒气入肺反觉清明。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -6 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '香味断了，你在黑林里绕了半夜，回过神已不知身在何处。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xueye_xunzong', name: '雪夜寻踪', desc: '雪后的兽踪最清。踏着没膝的雪去辨认兽行，冷得人指节生疼。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 1, order: 35,
    cond: { season: '冬' },
    effects: [{ tendAdd: { handu: 3 } }],
    outcomes: [
      { weight: 4, effects: [{ money: 5 }, { itemAdd: { id: 'langpi', n: 1 } }, { wvarAdd: { wolfThreat: -2 } },
        { log: { t: '雪地里的兽踪一目了然，你顺藤摸瓜起了两副好皮子。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'ti', gte: 4 } }, effects: [
        { tendAdd: { handu: 2 } }, { tendAdd: { lianti: 1 } }, { qi: 2 },
        { log: { t: '在雪里走了一整天，寒气逼进骨头，身上却越走越热。', style: '体' } }] },
      { weight: 3, cond: { mem: 'mem_hantan_languang' }, effects: [
        { tendAdd: { handu: 4 } }, { qi: 3 },
        { log: { t: '风雪里那缕寒，和你梦里潭底的蓝光是同一种凉。你停下脚，认了出来。', style: '因果' } }] },
      { weight: 2, effects: [{ hp: -10 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '一脚踩进雪盖的冰窟，半条腿冻得失了知觉，是爬回来的。', style: '凶' } }] }
    ]
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
      { weight: 2, cond: { nopflag: 'zhi_hantan' }, effects: [   // 矿底冰裂尽头通寒潭——寒潭唯一保底发现路径
        { pflagSet: { id: 'zhi_hantan' } }, { revealLoc: 'hantan' }, { tendAdd: { handu: 2 } },
        { hp: -6 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '矿底一道冰裂往下淌着白雾，尽头是一潭不冻的黑水，冷得人牙根发酸。', style: '异象' } }] },
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

  // ════════════════ 黑山深处 — v2 发现路径（断剑崖 / 后山兽径）════════════════

  G.define('action', {
    id: 'tan_duanjianya', name: '探断崖', desc: '深处西侧崖风里夹着金铁声。循那声去，或能寻到老辈说的埋剑断崖。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 2, order: 40,
    cond: { nopflag: 'zhi_duanjianya' },
    effects: [{ counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { pflagSet: { id: 'zhi_duanjianya' } }, { revealLoc: 'duanjianya' }, { tendAdd: { yujian: 2 } },
        { log: { t: '一道刀削的绝壁横在眼前，崖底乱石插满锈剑，无风自鸣。', style: '吉' } }] },
      { weight: 3, cond: { mem: 'mem_duanjianya' }, effects: [
        { pflagSet: { id: 'zhi_duanjianya' } }, { revealLoc: 'duanjianya' }, { tendAdd: { yujian: 3 } },
        { insight: { id: 'jianzhong_jianyi', title: '断崖剑意', t: '梦里那道崖，我循着声就找着了。它在等我。', confirm: true } },
        { log: { t: '你照着旧梦里的剑鸣一路寻去，断剑崖应声而现。', style: '因果' } }] },
      { weight: 2, effects: [{ hp: -10 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '崖风太硬，一阵横风把你拍在岩壁上，肩头擦出血来。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xun_shoujing', name: '寻兽径', desc: '狼道之外另有更野的兽踪，碗口大的足印往更深处去。要不要跟？',
    loc: 'heishan_shenchu', timeCost: 1, risk: 2, order: 45,
    cond: { nopflag: 'zhi_houshan' },
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { pflagSet: { id: 'zhi_houshan' } }, { revealLoc: 'houshan_lin' }, { tendAdd: { shouhun: 2 } },
        { log: { t: '足印引你穿过一道荆棘，眼前豁然是片更古老的兽径。', style: '吉' } }] },
      { weight: 3, cond: { wvar: { id: 'wolfThreat', gte: 40 } }, effects: [
        { combat: { enemy: 'yaolang', intro: '兽径口蹲着一头妖狼，像在替更深处的什么守门。',
          onWin: [{ pflagSet: { id: 'zhi_houshan' } }, { revealLoc: 'houshan_lin' },
            { wvarAdd: { wolfThreat: -5 } }, { tendAdd: { shouhun: 2 } }, { counterAdd: { xuexing: 2 } }],
          onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '你退回狼道，那兽径终究没敢踏进去。', style: '凶' } }] } }] },
      { weight: 2, effects: [{ hp: -8 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '足印到一处断崖前忽然没了。崖下是雾，你不敢再下。', style: '凶' } }] }
    ]
  });

  // ════════════════ 寒潭（handu）════════════════

  G.define('action', {
    id: 'aobing_caihan', name: '凿冰采寒', desc: '凿开寒潭薄冰，采冰下的幽蓝石子。寒气钻骨，也淬骨。',
    loc: 'hantan', timeCost: 1, risk: 1, order: 10,
    effects: [{ tendAdd: { handu: 3 } }, { hp: -4 }],
    outcomes: [
      { weight: 4, effects: [
        { itemAdd: { id: 'hanjing', n: 1 } }, { tendAdd: { handu: 1 } },
        { log: { t: '镐尖一磕，冰下一颗寒萤石滚出来，冷得你指节发白。', style: '异象' } }] },
      { weight: 3, cond: { nopflag: 'de_zaobing_gao' }, effects: [
        { pflagSet: { id: 'de_zaobing_gao' } }, { itemAdd: { id: 'zaobing_gao', n: 1 } },
        { log: { t: '冰窟边斜插着一柄旧凿冰镐，镐头淬过寒，你顺手拔了。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'ti', gte: 4 } }, effects: [
        { tendAdd: { handu: 2 } }, { tendAdd: { lianti: 1 } }, { qi: 3 },
        { log: { t: '寒气一寸寸逼进骨头，你咬牙顶着，身上反倒生出股韧劲。', style: '体' } }] },
      { weight: 2, effects: [{ hp: -10 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '冰面突然塌了半边，你半条腿没进黑水，冻得整条腿失了知觉。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'hantan_bianqi', name: '潭边辨气', desc: '凝神去辨那潭底蓝光里透出的寒气。它不是冷，是活的。',
    loc: 'hantan', timeCost: 1, risk: 1, order: 20,
    effects: [{ tendAdd: { handu: 2 } }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [{ qi: 4 }, { tendAdd: { handu: 1 } },
        { log: { t: '你试着随那寒气一呼一吸，气息竟一点点沉静下来。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { handu: 3 } }, { counterAdd: { xinmo: 1 } },
        { insight: { id: 'bian_han', title: '辨寒', t: '这寒不是天冷，是水底有东西在呼吸。它的气，我摸得出深浅。', confirm: true } },
        { log: { t: '你忽然分得清了：哪缕寒是死的，哪缕寒在动。', style: '异象' } }] },
      { weight: 3, cond: { season: '冬' }, effects: [
        { tendAdd: { handu: 3 } }, { qi: 3 },
        { log: { t: '隆冬的潭面寒上加寒，你坐得越久，气感越清。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -8 }, { counterAdd: { xinmo: 2 } },
        { log: { t: '寒气趁你入神钻进百窍，半边身子僵了半日才缓过来。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xun_bing_tanyuan', name: '循冰探源', desc: '潭底蓝光最盛处，是寒气的源头。下去过的人，都没把答案带上来。',
    loc: 'hantan', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'hantan_jiao' },
    effects: [{ counterAdd: { xinmo: 2 } }],
    outcomes: [
      { weight: 3, cond: { nopflag: 'jian_hantan_languang' }, effects: [
        { pflagSet: { id: 'jian_hantan_languang' } }, { memAdd: 'mem_hantan_languang' },
        { tendAdd: { handu: 3 } }, { qi: 5 },
        { log: { t: '蓝光近在咫尺，你却被一股寒意逼退。那光，认得你。', style: '异象' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'hanjiao_you', intro: '冰下窜出一条幼蛟，吐着白雾，缠上你的脚踝。',
          onWin: [{ tendAdd: { handu: 3 } }, { itemAdd: { id: 'hanjing', n: 1 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ injure: { months: 1, severity: 1 } }, { counterAdd: { xinmo: 2 } },
            { log: { t: '幼蛟的寒息冻住了你半边身子，你是滚着逃上岸的。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'hantan_jiao',
          intro: '潭水无声炸开。一条覆满寒鳞的巨蛟拔水而起，蓝光自它眼中流泻——寒潭之主，醒了。',
          onWin: [
            { bossSet: { enemy: 'hantan_jiao', alive: false } },
            { legacySet: { id: 'hantan_ding', v: true } },
            { locvarAdd: { loc: 'hantan', key: 'danger', n: -25 } },
            { itemAdd: { id: 'hanjing', n: 4 } }, { tendAdd: { handu: 6 } }, { counterAdd: { shaqi: 3 } },
            { rumorAdd: { t: '废矿底下那潭黑水，有人说镇住了。冰下的蓝光，灭了。', fame: 28 } },
            { log: { t: '巨蛟碎成漫天冰晶，潭面第一次结起了真正的、安静的冰。', style: '异象' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } },
            { log: { t: '寒息没过头顶的一瞬，你以为自己再也起不来了。', style: '凶' } }] } }] }
    ]
  });

  // ════════════════ 断剑崖（yujian）════════════════

  G.define('action', {
    id: 'tingjian', name: '崖前听剑', desc: '断剑崖满石断刃终日低鸣。坐到它们中间，听它们说话。',
    loc: 'duanjianya', timeCost: 1, risk: 1, order: 10,
    effects: [{ tendAdd: { yujian: 3 } }, { qi: 3 }],
    outcomes: [
      { weight: 4, effects: [{ counterAdd: { xinmo: -1 } }, { tendAdd: { yujian: 1 } },
        { log: { t: '万千剑鸣里你坐到天黑，心反而静得像一汪深水。', style: '平' } }] },
      { weight: 3, cond: { nopflag: 'ting_jianming' }, effects: [
        { pflagSet: { id: 'ting_jianming' } }, { tendAdd: { yujian: 3 } },
        { insight: { id: 'jianzhong_jianyi', title: '断崖剑意', t: '满崖的剑都断了，可它们还在响。它们应和的，是我身上的什么。', confirm: true } },
        { log: { t: '所有断剑的鸣声忽然朝你这一处汇拢，如朝如拜。', style: '异象' } }] },
      { weight: 3, cond: { season: '春' }, effects: [
        { tendAdd: { yujian: 2 } }, { cult: 6 },
        { log: { t: '春风过崖，剑鸣清越如新出鞘。你迎风又坐了一夜。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -6 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '一道无形剑气擦过耳际，削断了几根头发，渗出血珠。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'paolu_zhujian', name: '旧炉持剑', desc: '崖顶塌了半边的旧剑庐还剩座冷炉。拾起断剑，照着炉壁残刻一遍遍持剑空划。',
    loc: 'duanjianya', timeCost: 1, risk: 1, order: 15,
    cond: { any: [{ item: { id: 'duanjian', n: 1 } }, { item: { id: 'jianjue_canpian', n: 1 } }, { tend: { id: 'yujian', gte: 20 } }] },
    effects: [{ tendAdd: { yujian: 3 } }, { cult: 4 }],
    outcomes: [
      { weight: 4, effects: [{ tendAdd: { yujian: 1 } }, { qi: 3 },
        { log: { t: '你照着炉壁的残刻持剑空划，一招一式，渐渐有了准头。', style: '平' } }] },
      { weight: 3, cond: { item: { id: 'jianjue_canpian', n: 1 } }, effects: [
        { tendAdd: { yujian: 3 } }, { cult: 6 },
        { log: { t: '残篇缺的那半招，你竟在炉壁旧刻上补全了。剑意一下子通了。', style: '异象' } }] },
      { weight: 3, cond: { tend: { id: 'yujian', gte: 40 } }, effects: [
        { tendAdd: { yujian: 4 } }, { qi: 4 },
        { insight: { id: 'jianzhong_jianyi', title: '断崖剑意', t: '剑不在手上，在心里。我空着手，也觉得有一柄剑随我意走。' } },
        { log: { t: '你空手一引，崖底一柄断剑竟应声轻颤，似要飞来你掌中。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -6 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '一式使得急了，断剑脱手飞出，崖风里险些削了自己的耳朵。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'shi_jianjue', name: '崖底拾剑诀', desc: '崖底乱剑石缝里，常嵌着前人留下的残页。剑气护着，取它要付代价。',
    loc: 'duanjianya', timeCost: 1, risk: 2, order: 20,
    effects: [{ tendAdd: { yujian: 2 } }],
    outcomes: [
      { weight: 3, cond: { nopflag: 'de_jianjue' }, effects: [
        { pflagSet: { id: 'de_jianjue' } }, { itemAdd: { id: 'jianjue_canpian', n: 1 } }, { tendAdd: { yujian: 2 } },
        { log: { t: '石缝深处嵌着半页剑诀，墨迹被剑气蚀去一半。你割破手才抠出来。', style: '吉' } }] },
      { weight: 3, cond: { nopflag: 'de_duanjian2' }, effects: [
        { pflagSet: { id: 'de_duanjian2' } }, { itemAdd: { id: 'duanjian', n: 1 } }, { tendAdd: { yujian: 1 } },
        { log: { t: '乱石里一柄断剑应着你的脚步轻颤，你把它拔了出来。', style: '血' } }] },
      { weight: 3, cond: { tend: { id: 'yujian', gte: 40 } }, effects: [
        { combat: { enemy: 'jianzhong_canling', intro: '一柄断剑无人自起，凝出个握剑的虚影，剑尖直指你的眉心。',
          onWin: [{ tendAdd: { yujian: 4 } }, { itemAdd: { id: 'jianjue_canpian', n: 1 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ hp: -10 }, { counterAdd: { xinmo: 2 } },
            { log: { t: '那虚影的剑追了你三十步，你后背被划开一道长口子。', style: '凶' } }] } }] },
      { weight: 2, effects: [{ hp: -12 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '抠残页时惊动了石下剑气，几道无形的刃在你身上拉出血痕。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'shijian_renzhu', name: '崖心试剑', desc: '崖心立着的，是满崖断剑凝成的剑灵。它只认一个主人。',
    loc: 'duanjianya', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'jianzhong_jianling' },
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 3, cond: { nopflag: 'ting_jianming2' }, effects: [
        { pflagSet: { id: 'ting_jianming2' } }, { memAdd: 'mem_jianzhong_jianming' },
        { tendAdd: { yujian: 3 } }, { qi: 4 },
        { log: { t: '剑灵悬在崖心打量你，剑尖颤了颤，终究没有出手——这一次。', style: '异象' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'jianzhong_canling', intro: '剑灵驱动一柄前哨断剑，破空刺来。',
          onWin: [{ tendAdd: { yujian: 4 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ hp: -12 }, { counterAdd: { xinmo: 2 } },
            { log: { t: '断剑追了你出崖口，你左臂被钉穿，靠右手才挣脱。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'jianzhong_jianling',
          intro: '崖心万剑齐起，凝成一道执剑的剑灵。它静静看你：「持剑而来者众，认主者，唯一人。」',
          onWin: [
            { bossSet: { enemy: 'jianzhong_jianling', alive: false } },
            { legacySet: { id: 'jianzhong_renzhu', v: true } },
            { itemAdd: { id: 'jianjue_canpian', n: 2 } }, { tendAdd: { yujian: 6 } }, { fame: 12 },
            { insight: { id: 'jianzhong_jianyi', title: '断崖剑意', t: '剑冢认了我。万剑归心那一刻，我才懂什么叫御剑。', confirm: true } },
            { rumorAdd: { t: '断剑崖的剑灵认了主。那人下山时，满崖断剑朝他鸣了一路。', fame: 25 } },
            { log: { t: '万剑同时归鞘的轰鸣里，剑灵化作一缕剑光，没入你的眉心。', style: '异象' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } },
            { log: { t: '千剑加身的那一瞬，你连痛都来不及觉得。', style: '凶' } }] } }] }
    ]
  });

  // ════════════════ 后山兽径（shouhun）════════════════

  G.define('action', {
    id: 'shoujing_xunzong', name: '兽径寻踪', desc: '辨认兽径上的足印爪痕，摸清这片野地里都住着什么。',
    loc: 'houshan_lin', timeCost: 1, risk: 1, order: 10,
    effects: [{ tendAdd: { shouhun: 3 } }],
    outcomes: [
      { weight: 4, effects: [
        { money: 6 }, { itemAdd: { id: 'langpi', n: 1 } }, { tendAdd: { shouhun: 1 } },
        { log: { t: '循着足印起出几具陷死的小兽，皮子背去镇上换了钱。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { shouhun: 3 } }, { counterAdd: { shaqi: 1 } },
        { insight: { id: 'shi_shouzong', title: '识兽踪', t: '这山里的兽各有各的走法。看一眼爪印，我就知道它怕什么、想什么。', confirm: true } },
        { log: { t: '你蹲下细看一行爪印，忽然读懂了它落足时的犹豫。', style: '异象' } }] },
      { weight: 3, cond: { nopflag: 'xun_shouwang_ji' }, effects: [
        { pflagSet: { id: 'xun_shouwang_ji' } }, { tendAdd: { shouhun: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '足印尽头是座荒草没顶的兽王坟，鸟雀绕着飞，不肯落。', style: '凶' } }] },
      { weight: 2, effects: [{ hp: -8 }, { counterAdd: { xuexing: 1 } },
        { log: { t: '一头藏在枯叶下的母兽护崽，给了你后腿狠狠一口。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xunying_yangshou', name: '驯鹰养兽', desc: '后山兽径设个简陋兽栏，捕些雏鹰幼兽来养。通了兽性，它们便认你。',
    loc: 'houshan_lin', timeCost: 1, risk: 1, order: 15,
    effects: [{ tendAdd: { shouhun: 3 } }],
    outcomes: [
      { weight: 4, effects: [{ tendAdd: { shouhun: 1 } }, { qi: 2 },
        { log: { t: '一只断翅的雏鹰被你喂熟了，落在你腕上不肯走。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'min', gte: 4 } }, effects: [
        { tendAdd: { shouhun: 3 } }, { money: 3 },
        { log: { t: '你驯的猎鹰替你叼回了山鸡野兔，省了你不少脚力。', style: '吉' } }] },
      { weight: 3, cond: { birth: 'xunshou_ren' }, effects: [
        { tendAdd: { shouhun: 4 } }, { counterAdd: { shaqi: 1 } },
        { insight: { id: 'shi_shouzong', title: '识兽踪', t: '我喂它们时，它们眼里有光。那不是怕，是认主。', confirm: true } },
        { log: { t: '兽栏里的野物见你进来便低头蹭你，老法子，你比谁都熟。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -5 }, { counterAdd: { xuexing: 1 } },
        { log: { t: '一头没驯熟的幼狼咬穿了你的手背，你松手时它窜进了林子。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'lie_pi', name: '猎罴', desc: '后山的熊罴皮厚力沉，一掌能拍碎牛头。猎它，靠的是命也是胆。',
    loc: 'houshan_lin', timeCost: 1, risk: 2, order: 20,
    effects: [{ counterAdd: { shaqi: 1 } }, { tendAdd: { shouhun: 2 } }],
    outcomes: [
      { weight: 4, effects: [
        { combat: { enemy: 'bali', intro: '林间一声闷吼，一头小山似的熊罴拔地而起，挡住了去路。',
          onWin: [{ money: 12 }, { itemAdd: { id: 'langpi', n: 2 } }, { tendAdd: { shouhun: 3 } },
            { counterAdd: { xuexing: 2 } },
            { rumorAdd: { t: '有人独个儿放倒了后山的熊罴，那皮子铺开有半间屋大。', fame: 4 } }],
          onFlee: [{ injure: { months: 1, severity: 1 } }, { counterAdd: { xinmo: 1 } },
            { log: { t: '熊掌擦着你后背扫过，你连滚带爬才捡回半条命。', style: '凶' } }] } }] },
      { weight: 3, cond: { tend: { id: 'shouhun', gte: 40 } }, effects: [
        { tendAdd: { shouhun: 4 } }, { counterAdd: { shaqi: 1 } },
        { insight: { id: 'shi_shouzong', title: '识兽踪', t: '熊罴扑来前，肩头肌肉先动。我比它自己更先知道它要往哪扑。' } },
        { log: { t: '你迎着熊罴的扑势侧身让过，反手一刀正中要害——快得它都没反应过来。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -14 }, { injure: { months: 1, severity: 2 } },
        { log: { t: '没找见熊，倒在密林里崴了脚，一瘸一拐挨到天黑。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xun_shouwang_ji', name: '寻兽王迹', desc: '兽王坟下，埋着百年前那头通灵巨兽。它没有死透。',
    loc: 'houshan_lin', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'houshan_shouwang' },
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 3, effects: [
        { combat: { enemy: 'bali', intro: '兽王坟前蹲着头熊罴，像在替坟里的东西守门。',
          onWin: [{ tendAdd: { shouhun: 3 } }, { itemAdd: { id: 'langpi', n: 2 } }, { counterAdd: { xuexing: 2 } }],
          onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '你退出坟地，那熊罴吼了一声，没追。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'houshan_shouwang',
          intro: '荒草轰然伏倒。坟下钻出一头通体青黑的巨兽，群兽之主睁开眼——满山的鸟雀一齐惊飞。',
          onWin: [
            { bossSet: { enemy: 'houshan_shouwang', alive: false } },
            { legacySet: { id: 'shouwang_fu', v: true } },
            { wvarAdd: { wolfThreat: -20 } }, { locvarAdd: { loc: 'houshan_lin', key: 'danger', n: -20 } },
            { itemAdd: { id: 'shouwang_zhua', n: 1 } }, { tendAdd: { shouhun: 6 } }, { counterAdd: { shaqi: 3 } },
            { rumorAdd: { t: '后山的兽王让人降了。打那以后，黑山的野物见了那人都绕道走。', fame: 28 } },
            { log: { t: '巨兽缓缓伏低了头颅。那一刻，你听见漫山的兽嚎齐齐转了调。', style: '异象' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } },
            { log: { t: '兽王一掌没把你拍进土里，你是被自己的血腥味呛醒在坟边的。', style: '凶' } }] } }] },
      { weight: 2, cond: { tend: { id: 'shouhun', gte: 60 } }, effects: [
        { tendAdd: { shouhun: 3 } }, { counterAdd: { shaqi: 1 } },
        { log: { t: '坟前的兽群朝你伏下身去，竟无一头敢拦——你身上的气味，它们认得。', style: '世界' } }] }
    ]
  });
})();
