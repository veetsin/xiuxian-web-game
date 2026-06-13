// js/data/actions_special.js — 山神庙 / 家中 / 通用 行动（Owner: C2）。
//
// 多月行动范式：timeCost:3 → 引擎自动走 3 次月末 tick（第 2、3 月为轻量 tick，不掷环境事件，
// 但 eventQueue 到期事件、NPC 行动、世界漂移照常——闭关时世界仍在变）。
//
// ── 本文件对外输出（登记）──
//   pflag：jian_houdian_menfeng / jian_dier_zhuxiang / ting_le_zhuanxia
//     ┄ v2 ┄ shou_le_gu（替无主骸骨收过殓）、ji_guo_he（祭过河神）、ru_guo_huao（夜探入过狐坳）、de_meishu_canpian（得过媚术残篇）
//   新增物品：huzhi（狐脂，consumable，狐坳采得，喂狐/可售）、lingjiao（菱角，consumable，河神渡采得，食/喂香火）、
//            meishu_canpian（媚术残篇，consumable，狐婆赠/夜探得，喂狐）
//   新增记忆（私有 carry，喂 humei/xianghuo/yinguo 轮回线）：mem_huao_mimeng（狐坳迷梦）、mem_hedi_chenzhong（河底沉钟）、mem_luanzang_diyu（乱葬低语）
//   引用记忆（C1 并行）：mem_leichi_canwen / mem_miaodi_diyu
//   引用 pflag（C1 births.js 登记）：xianghuo_yinji（庙祝养子香火印记）、su_ji（病弱孤儿宿疾）
//   引用 Boss/敌（C4 并行，蓝图 §3 钉死）：laohu_xian / luanzang_li_zu / heshen（Boss）；humei_yao / ligui / shuigui（普通敌）
//   引用 Boss 战败记忆（C1 并行）：mem_death_laohu_xian / mem_death_luanzang_li_zu / mem_death_heshen
//   引用 legacy（applyLegacy 已接）：hu_an_jing（狐婆坳靖）、luanzang_an（乱葬岗安）、heshen_ping（河患息）
//   引用钉死事件（C3 并行）：ev_miaoye_zaoyu / ev_leiyu_yixiang
//   insight 条目：leichi_jiyi（雷池旧梦）┄ v2 ┄ huan_jue（幻觉，humei）、xianghuo_huti（香火护体，xianghuo）
//
// ── 自检十问 ──
// 1标签：香火/阴邪/夜/修炼/隐秘/梦/狐/幻/葬/渡/水。2易共现：庙 corruption/ghostQi、雷雨窗口、出生印记、狐坳夜雾、河患汛期、乱葬磷火。
// 3排斥：市集人声；守夜与白日上香一明一暗互补不同人；狐坳甜腻与乱葬阴冷不共时。4改状态：阴气/庙腐化/好感/倾向/心魔/修为/物品。
// 5后果：上香/还愿压阴气、祭河镇河患、收骸积阴德、夜探狐坳喂狐也迷神；雷雨夜打坐真的会挨雷（risk 诚实）。
// 6可解释：香火安魂所以阴气降；河神索祭所以要还；狐婆养脉所以诱人入坳；乱葬埋无名所以怨气聚。
// 7钩子：后殿门缝、第二炷香、雷池旧梦、狐坳迷梦、河底沉钟、乱葬低语全是 C1/C3 的咬合点。
// 8有趣选择：守夜赚钱但夜里有东西；祭河保平安要付祭品；夜探狐坳搏机缘还是丢了神智。
// 9服务 build：庙/乱葬喂因果与香火，狐坳喂狐，河神渡喂香火与寒，雷夜喂雷，家中吐纳是所有路的底。
// 10不暴露：全部写身体感受与现场怪相，无机制词，不点破道名。
(function () {
  'use strict';

  // ════════ 本文件新增物品（契约 §6.5）════════
  G.define('item', {
    id: 'huzhi', name: '狐脂', type: 'consumable', price: 20,
    desc: '狐坳采来的一小盒脂膏，香得发腻，抹一点便容光焕发，旁人见你说话也容易信几分。',
    use: [{ counterAdd: { xinmo: -4 } }, { tendAdd: { humei: 3 } },
          { log: { t: '脂香一上身，你照见水里的脸，竟觉出几分不属于自己的妩媚。', style: '异象' } }]
  });
  G.define('item', {
    id: 'lingjiao', name: '菱角', type: 'consumable', price: 4,
    desc: '河神渡采的鲜菱角，剥壳生食清甜。镇上人说河神最爱这一口。',
    use: [{ hp: 6 }, { qi: 3 }, { log: { t: '菱肉清甜，一口下去，胸口的浊气都顺了。', style: '平' } }]
  });
  G.define('item', {
    id: 'meishu_canpian', name: '媚术残篇', type: 'consumable', price: 35,
    desc: '狐婆所授半卷术法，墨字写在桑皮纸上，读着读着眼前就泛起重影。',
    use: [{ cult: 8 }, { tendAdd: { humei: 6 } }, { counterAdd: { xinmo: 2 } },
          { log: { t: '残篇上的口诀绕进脑子，你忽然听懂了风里别人没听见的话。', style: '异象' } }]
  });

  // ┄ 机缘记忆 mem_huao_mimeng / mem_hedi_chenzhong / mem_luanzang_diyu 由 C1 memories.js 单独定义；
  //    本文件只 memAdd / cond 引用，不重复 G.define（避免 [REG] 覆盖）。

  // ════════════════ 山神庙 ════════════════

  G.define('action', {
    id: 'shangxiang', name: '上香', desc: '给没了脸的山神添一炷香。心诚不诚，只有香知道。',
    loc: 'shanshenmiao', timeCost: 1, risk: 0, order: 10,
    cond: { any: [{ item: { id: 'xiangzhu', n: 1 } }, { money: { gte: 2 } }] },
    effects: [
      { branch: { cond: { item: { id: 'xiangzhu', n: 1 } },
        then: [{ itemDel: { id: 'xiangzhu', n: 1 } }],
        else: [{ money: -2 }] } },
      { tendAdd: { yinguo: 2 } },
      { branch: { cond: { npcAlive: 'miaozhu' }, then: [{ npcFavAdd: { id: 'miaozhu', n: 2 } }] } }
    ],
    outcomes: [
      { weight: 5, effects: [{ wvarAdd: { ghostQi: -1 } },
        { log: { t: '香烟笔直地升上去，殿里今日格外安稳。', style: '平' } }] },
      { weight: 2, effects: [{ tendAdd: { yinguo: 2 } },
        { log: { t: '落下的香灰自己排成一行，像个没写完的字。', style: '因果' } }] },
      { weight: 2, cond: { locvar: { loc: 'shanshenmiao', key: 'corruption', gte: 45 } }, effects: [
        { counterAdd: { xinmo: 2 } }, { wvarAdd: { ghostQi: 2 } },
        { log: { t: '三炷香齐齐拦腰折断。庙祝的脸色，变了。', style: '凶' } }] },
      { weight: 1, cond: { pflag: 'xianghuo_yinji' }, effects: [
        { tendAdd: { yinguo: 3 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '你总觉得，没了脸的神像在看你。从小就是。', style: '因果' } }] }
    ]
  });

  G.define('action', {
    id: 'shouye', name: '守夜', desc: '替庙祝守一夜殿。香火钱不薄——夜里听见什么，都别应声。',
    loc: 'shanshenmiao', timeCost: 1, risk: 2, order: 20,
    effects: [{ tendAdd: { yinguo: 2 } }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { npcAlive: 'miaozhu' },
          then: [{ money: 4 }, { npcFavAdd: { id: 'miaozhu', n: 3 } },
            { log: { t: '一夜只有风声。天亮时庙祝塞给你两个还热的素包子。', style: '平' } }],
          else: [{ money: 2 },
            { log: { t: '一夜只有风声。天亮时香案上搁着两个冷硬的素包子——没见着人。', style: '平' } }] } },
        { wvarAdd: { ghostQi: -2 } }] },
      { weight: 3, effects: [
        { counterAdd: { xinmo: 2 } }, { wvarAdd: { ghostQi: 2 } }, { tendAdd: { yinguo: 2 } },
        { log: { t: '后半夜，有谁在极轻地数名字。数到你时，风停了。', style: '凶' } }] },
      { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 55 } }, effects: [
        { hp: -6 }, { counterAdd: { xinmo: 3 } }, { wvarAdd: { ghostQi: 3 } },
        { log: { t: '一阵阴风灭了所有烛火。黑暗里，香炉自己响了一声。', style: '凶' } }] },
      { weight: 1, cond: { pflag: 'xianghuo_yinji' }, effects: [
        { tendAdd: { yinguo: 4 } }, { pflagSet: { id: 'jian_dier_zhuxiang' } },
        { log: { t: '你替养父上了那第二炷香。香燃到一半，火苗弯向后殿。', style: '因果' } }] },
      { weight: 2, cond: { mem: 'mem_miaodi_diyu' }, effects: [
        { pflagSet: { id: 'ting_le_zhuanxia' } }, { tendAdd: { yinguo: 3 } }, { counterAdd: { xinmo: 2 } },
        { log: { t: '你把耳朵贴上神座前第三块砖。砖下的声音，顿了一顿。', style: '因果' } }] }
    ],
    eventChance: { p: 0.45, pool: ['ev_miaoye_zaoyu'] }
  });

  G.define('action', {
    id: 'saodian', name: '扫殿', desc: '替庙里扫尘添水，修缮门窗。积德的活，没人跟你抢。',
    loc: 'shanshenmiao', timeCost: 1, risk: 0, order: 30,
    effects: [
      { tendAdd: { yinguo: 1 } },
      { branch: { cond: { npcAlive: 'miaozhu' }, then: [{ npcFavAdd: { id: 'miaozhu', n: 3 } }] } },
      { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: -2 } }
    ],
    outcomes: [
      { weight: 5, effects: [{ money: 2 },
        { log: { t: '扫到供桌底下，扫出几枚香客遗落的铜钱。', style: '平' } }] },
      { weight: 2, effects: [{ counterAdd: { xinmo: -2 } },
        { log: { t: '扫完最后一级石阶，你心里静得像殿前的水洼。', style: '吉' } }] },
      { weight: 2, effects: [{ tendAdd: { yinguo: 1 } },
        { log: { t: '梁灰里扫出半块旧匾，只剩一个金漆的「正」字。', style: '因果' } }] },
      { weight: 1, cond: { locvar: { loc: 'shanshenmiao', key: 'corruption', gte: 45 } }, effects: [
        { pflagSet: { id: 'jian_houdian_menfeng' } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '扫到后殿门前，门缝里的凉气吹得帚穗直摆。门，没锁。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'huanyuan', name: '还愿', desc: '替自己、替家里许下的旧愿还一炷重香。心里有愧的，香烧得最旺。',
    loc: 'shanshenmiao', timeCost: 1, risk: 0, order: 35,
    cond: { any: [{ item: { id: 'xiangzhu', n: 1 } }, { money: { gte: 4 } }] },
    effects: [
      { branch: { cond: { item: { id: 'xiangzhu', n: 1 } },
        then: [{ itemDel: { id: 'xiangzhu', n: 1 } }],
        else: [{ money: -4 }] } },
      { tendAdd: { xianghuo: 3 } }, { wvarAdd: { ghostQi: -2 } }
    ],
    outcomes: [
      { weight: 5, effects: [{ counterAdd: { xinmo: -3 } },
        { log: { t: '香烧到底，你心里那点压了许久的愧，像被人轻轻接了过去。', style: '吉' } }] },
      { weight: 3, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { xianghuo: 3 } }, { qi: 3 },
        { insight: { id: 'xianghuo_huti', title: '香火护体', t: '还愿那一刻，胸口暖了一下，像有什么挡在我和阴冷之间。', confirm: true } },
        { log: { t: '香烟绕你三匝不散，你觉出一层薄薄的暖意贴着身子。', style: '异象' } }] },
      { weight: 2, cond: { pflag: 'xianghuo_yinji' }, effects: [
        { tendAdd: { xianghuo: 4 } }, { counterAdd: { xinmo: -2 } },
        { log: { t: '你替养父了了那桩世代未还的愿。神像无脸，你却觉得它在看你。', style: '因果' } }] }
    ]
  });

  G.define('action', {
    id: 'xiangke_bushi', name: '香客布施', desc: '在庙前替穷苦香客舍些米粥香烛，结个善缘。散财，攒的是另一种东西。',
    loc: 'shanshenmiao', timeCost: 1, risk: 0, order: 40,
    cond: { money: { gte: 5 } },
    effects: [{ money: -5 }, { tendAdd: { xianghuo: 2 } }, { fame: 1 }],
    outcomes: [
      { weight: 5, effects: [{ wvarAdd: { villageFear: -1 } }, { counterAdd: { xinmo: -2 } },
        { log: { t: '一锅热粥舍出去，庙前的香客都念你的好。', style: '吉' } }] },
      { weight: 3, effects: [{ tendAdd: { xianghuo: 2 } }, { itemAdd: { id: 'xiangzhu', n: 1 } },
        { log: { t: '一位老香客回赠你一对自家做的素香：「好人，留着。」', style: '平' } }] },
      { weight: 2, cond: { tend: { id: 'xianghuo', gte: 30 } }, effects: [
        { wvarAdd: { ghostQi: -2 } }, { tendAdd: { xianghuo: 3 } },
        { rumorAdd: { t: '山神庙前有人月月舍粥，香客说他身上有股暖香，邪祟不近。', fame: 3 } }] }
    ]
  });

  // ════════════════ 家中 ════════════════

  G.define('action', {
    id: 'tuna_jiazhong', name: '吐纳', desc: '关上院门，对着老井坐定，一呼一吸都沉进腹底。',
    loc: 'jiazhong', timeCost: 1, risk: 0, order: 10,
    effects: [{ cult: 9 }, { qi: 5 }],
    outcomes: [
      { weight: 5, effects: [{ counterAdd: { xinmo: -1 } },
        { log: { t: '老屋四下无人，连呼吸都比外头长三分。', style: '平' } }] },
      { weight: 2, cond: { locvar: { loc: 'jiazhong', key: 'spiritualEnergy', gte: 20 } }, effects: [
        { cult: 5 }, { log: { t: '井口浮上来的凉气格外沁人，今日的功课顺得反常。', style: '吉' } }] },
      { weight: 2, cond: { counter: { id: 'dandu', gte: 15 } }, effects: [
        { cult: -3 }, { counterAdd: { dandu: -1 } },
        { log: { t: '行气到一半喉头泛苦，你停下来咳了半天。', style: '丹' } }] },
      { weight: 1, cond: { pflag: 'su_ji' }, effects: [
        { hp: -4 }, { tendAdd: { yinguo: 2 } },
        { log: { t: '咳疾又犯了。恍惚间，你又听见有人在远处喊你的名字。', style: '因果' } }] }
    ]
  });

  G.define('action', {
    id: 'biguan_sanyue', name: '闭关三月', desc: '关门，落锁，账上的米粮还够。三个月不问世事。',
    loc: 'jiazhong', timeCost: 3, risk: 0, order: 20,
    effects: [{ cult: 26 }, { qi: 10 }],
    outcomes: [
      { weight: 6, effects: [{ counterAdd: { xinmo: -2 } },
        { log: { t: '三月静坐，气机沉了下去。开门时院里的草已经齐膝。', style: '平' } }] },
      { weight: 2, effects: [{ cult: 8 },
        { log: { t: '某夜万籁俱寂，你忽觉呼吸与山风同律——这三月没白坐。', style: '吉' } }] },
      { weight: 2, cond: { counter: { id: 'xinmo', gte: 10 } }, effects: [
        { counterAdd: { xinmo: 5 } },
        { log: { t: '入定愈深，压下去的东西愈是在暗处低语。你提前出了关。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'leiyu_dazuo', name: '雷雨夜露天打坐', desc: '把蒲团搬进院里，在炸雷底下坐一夜。镇上人说这是疯了。',
    loc: 'jiazhong', timeCost: 1, risk: 1, order: 30,
    cond: { weather: '雷雨' },
    effects: [{ tendAdd: { leifa: 4 } }, { cult: 5 }, { hp: -3 }],
    outcomes: [
      { weight: 4, effects: [{ tendAdd: { leifa: 2 } }, { qi: 5 },
        { log: { t: '每声炸雷过后，你骨缝里都跟着震一下，麻而不痛。', style: '雷' } }] },
      { weight: 2, effects: [{ hp: -10 }, { tendAdd: { leifa: 5 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '半边老槐齐根焦黑。你坐的地方，离它不到一丈。', style: '凶' } }] },
      { weight: 2, effects: [{ injure: { months: 1, severity: 1 } },
        { log: { t: '淋了半夜冷雨，第二天起就烧得说胡话。', style: '凶' } }] },
      { weight: 2, cond: { tend: { id: 'leifa', gte: 25 } }, effects: [
        { cult: 12 }, { tendAdd: { leifa: 5 } }, { qi: 6 },
        { log: { t: '一道雷正落头顶云层，你周身的雨珠竟齐齐悬了一瞬。', style: '异象' } }] },
      { weight: 1, cond: { mem: 'mem_leichi_canwen' }, effects: [
        { tendAdd: { leifa: 6 } }, { tendAdd: { yinguo: 2 } },
        { insight: { id: 'leichi_jiyi', title: '雷池旧梦', t: '梦里那口池子的纹路，和今夜云里的雷光，是同一种走法。', confirm: true } },
        { log: { t: '云中雷光蜿蜒的轨迹，你竟觉得眼熟。', style: '因果' } }] }
    ],
    eventChance: { p: 0.4, pool: ['ev_leiyu_yixiang'] }
  });

  G.define('action', {
    id: 'xueye_xingqi', name: '雪夜纳寒', desc: '雪夜推窗，对着满院风雪行气。寒气逼人，骨头里却像被洗了一遍。',
    loc: 'jiazhong', timeCost: 1, risk: 1, order: 35,
    cond: { weather: '雪' },
    effects: [{ tendAdd: { handu: 4 } }, { qi: 4 }, { hp: -3 }],
    outcomes: [
      { weight: 5, effects: [{ counterAdd: { xinmo: -1 } }, { tendAdd: { handu: 1 } },
        { log: { t: '风雪贴着窗灌进来，你随它呼吸，气息一寸寸沉到脚底。', style: '异象' } }] },
      { weight: 3, cond: { stat: { id: 'ti', gte: 4 } }, effects: [
        { tendAdd: { handu: 2 } }, { tendAdd: { lianti: 1 } }, { qi: 2 },
        { log: { t: '寒气钻进骨缝，你硬顶着不退，反觉筋骨被淬得更紧实。', style: '体' } }] },
      { weight: 2, cond: { mem: 'mem_hantan_languang' }, effects: [
        { tendAdd: { handu: 4 } }, { qi: 4 },
        { insight: { id: 'bian_han', title: '辨寒', t: '这雪夜的寒，和梦里那潭黑水是一个味道。它认得我，我也认得它。', confirm: true } },
        { log: { t: '风雪里那缕寒气忽然变得熟悉——和潭底蓝光是同一种凉。', style: '因果' } }] },
      { weight: 2, effects: [{ hp: -10 }, { injure: { months: 1, severity: 1 } },
        { log: { t: '寒气趁你入定钻进经脉，半夜冻得说胡话，烧了三天。', style: '凶' } }] }
    ]
  });

  // ════════════════ 狐婆坳（humei）════════════════

  G.define('action', {
    id: 'yetan_huao', name: '夜探狐坳', desc: '入夜的狐坳飘着甜腥的香。循香进去的人，多半要迷一阵路。',
    loc: 'hupo_ao', timeCost: 1, risk: 2, order: 10,
    effects: [{ tendAdd: { humei: 3 } }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { nopflag: 'ru_guo_huao' },
          then: [{ pflagSet: { id: 'ru_guo_huao' } }], else: [] } },
        { tendAdd: { humei: 1 } },
        { log: { t: '夜雾里灯影摇曳，你跟着一截红绳转了半夜，回过神已在坳口。', style: '异象' } }] },
      { weight: 3, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { humei: 3 } }, { counterAdd: { xinmo: 1 } },
        { insight: { id: 'huan_jue', title: '幻觉', t: '坳里那些影子是假的，可它们骗不过我了——我看得见雾后头真正的东西。', confirm: true } },
        { log: { t: '甜香里浮起重重幻影，你定住心神，竟看穿了哪个是真。', style: '异象' } }] },
      { weight: 3, cond: { wvar: { id: 'ghostQi', gte: 40 } }, effects: [
        { combat: { enemy: 'humei_yao', intro: '一个绝色身影自雾里转出，眼波一转，你的脚就不听使唤了。',
          onWin: [{ tendAdd: { humei: 3 } }, { itemAdd: { id: 'huzhi', n: 1 } }, { counterAdd: { shaqi: 1 } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { money: -6 }, { counterAdd: { xinmo: 3 } },
            { log: { t: '你醒来时倒在坳外，钱袋空了，脖子上多了道齿痕。', style: '凶' } }] } }] },
      { weight: 2, cond: { nopflag: 'jian_huao_mimeng' }, effects: [
        { pflagSet: { id: 'jian_huao_mimeng' } }, { memAdd: 'mem_huao_mimeng' },
        { counterAdd: { xinmo: 2 } }, { tendAdd: { humei: 2 } },
        { log: { t: '你陷进一场太真的梦：有人替你掖被角，声音又软又甜。', style: '异象' } }] }
    ]
  });

  G.define('action', {
    id: 'wenhu_qiushu', name: '问狐求术', desc: '坳里那位狐婆，肯教人些哄人迷人的门道——只是她要的回礼，没人说得清。',
    loc: 'hupo_ao', timeCost: 1, risk: 1, order: 20,
    cond: { npcAlive: 'hupo' },
    effects: [{ npcFavAdd: { id: 'hupo', n: 2 } }, { tendAdd: { humei: 2 } }],
    outcomes: [
      { weight: 4, effects: [{ tendAdd: { humei: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '狐婆捻着你的下巴端详半晌，笑而不语，只教了你一句话术。', style: '平' } }] },
      { weight: 3, cond: { npcFav: { id: 'hupo', gte: 20 }, nopflag: 'de_meishu_canpian' }, effects: [
        { pflagSet: { id: 'de_meishu_canpian' } }, { itemAdd: { id: 'meishu_canpian', n: 1 } }, { tendAdd: { humei: 3 } },
        { log: { t: '狐婆从袖里抽出半卷桑皮纸塞给你：「拿去，别说是我教的。」', style: '吉' } }] },
      { weight: 2, cond: { tend: { id: 'humei', gte: 40 } }, effects: [
        { tendAdd: { humei: 4 } }, { npcFavAdd: { id: 'hupo', n: 3 } },
        { log: { t: '狐婆盯着你的眼睛看了很久：「你身上这点东西，比我教的还正。」', style: '异象' } }] },
      { weight: 2, effects: [{ money: -4 }, { counterAdd: { xinmo: 2 } },
        { log: { t: '你听她说了一夜软话，散时摸摸钱袋，竟空了四枚铜钱。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'cai_huzhi', name: '采狐脂寻祟', desc: '狐坳石上的狐脂能制媚术药膏。采它要顺着狐祟最浓处走，险。',
    loc: 'hupo_ao', timeCost: 1, risk: 2, order: 25,
    effects: [{ tendAdd: { humei: 2 } }],
    outcomes: [
      { weight: 4, effects: [{ itemAdd: { id: 'huzhi', n: 1 } }, { tendAdd: { humei: 1 } },
        { log: { t: '背阴石缝里刮下半盒狐脂，香得熏人，你赶紧封了口。', style: '平' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'humei_yao', intro: '采脂正专心，背后一双柔手忽然蒙住你的眼——「找我？」',
          onWin: [{ tendAdd: { humei: 3 } }, { itemAdd: { id: 'huzhi', n: 1 } }, { counterAdd: { shaqi: 1 } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { counterAdd: { xinmo: 3 } },
            { log: { t: '你被媚气勾得失了神，醒来时天已大亮，狐脂也没了。', style: '凶' } }] } }] },
      { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 45 } }, effects: [
        { wvarAdd: { ghostQi: 2 } }, { counterAdd: { xinmo: 2 } },
        { log: { t: '坳里的狐祟今夜格外重，香雾里影影绰绰全是眼睛。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'xun_hu_ji', name: '循狐迹', desc: '狐坳深处住着那位真正的主人——一头养了千年的老狐。它见客，也挑客。',
    loc: 'hupo_ao', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'laohu_xian' },
    effects: [{ counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 3, effects: [
        { combat: { enemy: 'humei_yao', intro: '深坳门前立着个媚眼如丝的女子，替主人拦你：「客人，留步。」',
          onWin: [{ tendAdd: { humei: 3 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你退出深坳，那女子的笑声追了你一路。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'laohu_xian',
          intro: '坳心一座精致小楼，帘后转出个雍容妇人，未语先笑：「千年了，总算有个看得清我的人来。」',
          onWin: [
            { bossSet: { enemy: 'laohu_xian', alive: false } },
            { legacySet: { id: 'hu_an_jing', v: true } },
            { wvarAdd: { ghostQi: -25 } }, { locvarAdd: { loc: 'hupo_ao', key: 'corruption', n: -25 } },
            { itemAdd: { id: 'meishu_canpian', n: 1 } }, { tendAdd: { humei: 6 } }, { fame: 10 },
            { rumorAdd: { t: '狐婆坳的老狐被人收了。打那以后，镇上后生再没在坳里迷过路。', fame: 25 } },
            { log: { t: '老狐眼里的媚色一寸寸褪尽，化作一缕青烟，朝你福了一福。', style: '异象' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } }, { money: -10 },
            { log: { t: '你在她的笑里越陷越深，等回过神，已记不清自己是谁。', style: '凶' } }] } }] },
      { weight: 2, cond: { tend: { id: 'humei', gte: 60 } }, effects: [
        { npcFavAdd: { id: 'hupo', n: 3 } }, { tendAdd: { humei: 3 } },
        { log: { t: '老狐隔帘打量你良久，竟挥手让你过去：「你我同道，今日不为难你。」', style: '世界' } }] }
    ]
  });

  // ════════════════ 乱葬岗（yinguo / xianghuo）════════════════

  G.define('action', {
    id: 'shougai', name: '收骸', desc: '替坡上无主的骨头收拢入土，烧一沓纸钱。积阴德的活，没人跟你抢。',
    loc: 'luanzang_gang', timeCost: 1, risk: 1, order: 10,
    effects: [{ tendAdd: { yinguo: 2 } }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { item: { id: 'zhiqian', n: 1 } },
          then: [{ itemDel: { id: 'zhiqian', n: 1 } }, { tendAdd: { xianghuo: 2 } }, { wvarAdd: { ghostQi: -3 } },
            { log: { t: '你替每具无名骨烧了张纸钱。这一夜，坡上格外安静。', style: '因果' } }],
          else: [{ wvarAdd: { ghostQi: -1 } }, { tendAdd: { yinguo: 1 } },
            { log: { t: '你把散落的骨头一一收拢埋好，磷火退了大半。', style: '因果' } }] } },
        { pflagSet: { id: 'shou_le_gu' } }, { npcFavAdd: { id: 'shihai_zhe', n: 2 } }] },
      { weight: 3, effects: [{ itemAdd: { id: 'zhiqian', n: 1 } }, { tendAdd: { yinguo: 1 } },
        { log: { t: '一座塌坟里翻出半沓没烧完的纸钱，你替它收了，回头好用。', style: '平' } }] },
      { weight: 2, cond: { nopflag: 'jian_luanzang_diyu' }, effects: [
        { pflagSet: { id: 'jian_luanzang_diyu' } }, { memAdd: 'mem_luanzang_diyu' },
        { tendAdd: { yinguo: 3 } }, { counterAdd: { xinmo: 2 } },
        { log: { t: '你收殓到天黑，满坡的草齐齐朝你伏下，无数极轻的声音在道谢。', style: '异象' } }] },
      { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 50 } }, effects: [
        { hp: -6 }, { counterAdd: { xinmo: 2 } }, { wvarAdd: { ghostQi: 1 } },
        { log: { t: '你刚埋好一具骨头，土堆下忽然伸出一只灰白的手，攥住了你的腕。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'luanzang_yeshou', name: '乱葬夜守', desc: '入夜守在岗上，看住那些不安分的坟。厉鬼夜出，胆小的别来。',
    loc: 'luanzang_gang', timeCost: 1, risk: 2, order: 20,
    effects: [{ tendAdd: { yinguo: 2 } }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [{ wvarAdd: { ghostQi: -2 } }, { tendAdd: { yinguo: 1 } },
        { log: { t: '一夜磷火浮动，你守到天明，坡上没出乱子。', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'ghostQi', gte: 45 } }, effects: [
        { combat: { enemy: 'ligui', intro: '一座坟「啪」地裂开，青面厉鬼破土而出，怨气扑面！',
          onWin: [{ wvarAdd: { ghostQi: -6 } }, { tendAdd: { yinguo: 2 } }, { counterAdd: { shaqi: 1 } },
            { branch: { cond: { tend: { id: 'xianghuo', gte: 20 } }, then: [{ tendAdd: { xianghuo: 2 } }] } }],
          onLose: [{ injure: { months: 1, severity: 2 } }, { counterAdd: { xinmo: 4 } },
            { log: { t: '厉鬼的指甲抠进你心口，那股阴寒钻进去，半月散不掉。', style: '凶' } }] } }] },
      { weight: 2, cond: { tend: { id: 'xianghuo', gte: 25 } }, effects: [
        { wvarAdd: { ghostQi: -4 } }, { tendAdd: { xianghuo: 3 } },
        { log: { t: '你低声诵念，坡上躁动的磷火竟一盏盏温顺地伏了下去。', style: '异象' } }] },
      { weight: 2, effects: [{ hp: -6 }, { counterAdd: { xinmo: 3 } }, { wvarAdd: { ghostQi: 2 } },
        { log: { t: '后半夜满坡的草同时停了。死寂里，有谁在你背后轻轻叫了你的名字。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'zhao_lizu', name: '招厉祖', desc: '乱葬岗百年怨气，尽聚在岗心那座最老的无名冢。掘开它，便是与厉祖照面。',
    loc: 'luanzang_gang', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'luanzang_li_zu', pflag: 'shou_le_gu' },
    effects: [{ counterAdd: { xinmo: 2 } }],
    outcomes: [
      { weight: 3, effects: [
        { combat: { enemy: 'ligui', intro: '冢边的小鬼先扑了上来，替它们的祖宗试你的斤两。',
          onWin: [{ wvarAdd: { ghostQi: -5 } }, { tendAdd: { yinguo: 2 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你退出岗心，身后传来一阵苍老的、不甘的冷笑。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'luanzang_li_zu',
          intro: '岗心古冢轰然崩裂，百年怨气拧成一个佝偻黑影缓缓立起：「又一个，来替它们收骨头的。」',
          onWin: [
            { bossSet: { enemy: 'luanzang_li_zu', alive: false } },
            { legacySet: { id: 'luanzang_an', v: true } },
            { wvarAdd: { ghostQi: -40 } }, { wvarAdd: { villageFear: -15 } },
            { locvarAdd: { loc: 'luanzang_gang', key: 'corruption', n: -35 } },
            { tendAdd: { yinguo: 5 } }, { branch: { cond: { tend: { id: 'xianghuo', gte: 20 } }, then: [{ tendAdd: { xianghuo: 4 } }] } },
            { rumorAdd: { t: '乱葬岗的怨气散了。打那夜起，镇西夜里再没磷火，也没人喊冤。', fame: 26 } },
            { log: { t: '黑影散作满坡安息的尘。这一片无名骨，终于睡踏实了。', style: '因果' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } }, { wvarAdd: { ghostQi: 5 } },
            { log: { t: '百年怨气没过你的头顶，你听见自己的名字被添进了那串低语里。', style: '凶' } }] } }] },
      { weight: 2, cond: { mem: 'mem_luanzang_diyu' }, effects: [
        { tendAdd: { yinguo: 3 } }, { tendAdd: { xianghuo: 2 } }, { counterAdd: { xinmo: -1 } },
        { log: { t: '你想起旧梦里那些道谢的声音，掘到一半，竟下不去手。这一夜你只烧了纸。', style: '因果' } }] }
    ]
  });

  // ════════════════ 河神渡（xianghuo / handu）════════════════

  G.define('action', {
    id: 'baidu', name: '河渡摆渡', desc: '替河婆撑一程渡船，挣几个船钱。船到河心，切记莫回头。',
    loc: 'heshen_du', timeCost: 1, risk: 1, order: 10,
    effects: [{ money: 4 }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { npcAlive: 'heshen_po' },
          then: [{ npcFavAdd: { id: 'heshen_po', n: 2 } }, { money: 1 },
            { log: { t: '河婆教你看水色辨漩涡，一整天的渡，稳稳当当。', style: '平' } }],
          else: [{ log: { t: '你独自撑了一天渡，河面安静得反常。', style: '平' } }] } }] },
      { weight: 3, cond: { stat: { id: 'min', gte: 4 } }, effects: [
        { money: 3 }, { tendAdd: { handu: 1 } },
        { log: { t: '河心一个暗漩险些掀了船，你脚下一沉稳住了篙。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'villageFear', gte: 30 } }, effects: [
        { combat: { enemy: 'shuigui', intro: '船到河心，一只青白的手攀上船舷——有什么要把你拖下水！',
          onWin: [{ tendAdd: { handu: 1 } }, { wvarAdd: { villageFear: -2 } }, { counterAdd: { shaqi: 1 } },
            { branch: { cond: { tend: { id: 'xianghuo', gte: 20 } }, then: [{ tendAdd: { xianghuo: 2 } }] } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { counterAdd: { xinmo: 3 } },
            { log: { t: '你呛了满肚子河水，是被冲到下游浅滩才捡回命的。', style: '凶' } }] } }] },
      { weight: 2, effects: [{ hp: -5 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '你忍不住回头看了一眼河心，那一眼，让你后半程手都在抖。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'jihe', name: '祭河', desc: '凑些祭品香烛祭河神，求一季风平浪静。祭轻了，河神是要记账的。',
    loc: 'heshen_du', timeCost: 1, risk: 1, order: 20,
    cond: { any: [{ item: { id: 'xiangzhu', n: 1 } }, { item: { id: 'lingjiao', n: 1 } }, { money: { gte: 6 } }] },
    effects: [
      { branch: { cond: { item: { id: 'lingjiao', n: 1 } },
        then: [{ itemDel: { id: 'lingjiao', n: 1 } }],
        else: [{ branch: { cond: { item: { id: 'xiangzhu', n: 1 } }, then: [{ itemDel: { id: 'xiangzhu', n: 1 } }], else: [{ money: -6 }] } }] } },
      { tendAdd: { xianghuo: 3 } }, { pflagSet: { id: 'ji_guo_he' } }
    ],
    outcomes: [
      { weight: 5, effects: [{ wvarAdd: { villageFear: -2 } }, { counterAdd: { xinmo: -2 } },
        { log: { t: '香烛顺水漂远，河面的漩涡缓了下来。今年夏汛，该轻些。', style: '吉' } }] },
      { weight: 3, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { xianghuo: 3 } }, { tendAdd: { handu: 1 } },
        { insight: { id: 'xianghuo_huti', title: '香火护体', t: '祭河那一拜，水底像有什么应了一声。香火真能通到那东西那里。', confirm: true } },
        { log: { t: '你叩首时，河心无端涌起一个水花，像是有谁受了这炷香。', style: '异象' } }] },
      { weight: 2, cond: { nopflag: 'jian_hedi_chenzhong' }, effects: [
        { pflagSet: { id: 'jian_hedi_chenzhong' } }, { memAdd: 'mem_hedi_chenzhong' },
        { tendAdd: { xianghuo: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '祭到一半，你听见河底一口古钟在响，一下一下，沉得心口发慌。', style: '异象' } }] },
      { weight: 2, effects: [{ wvarAdd: { villageFear: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '祭品太薄，河面忽然无风起浪，漩涡张得像一张嘴。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'shenmiao_shangxiang', name: '河神庙上香', desc: '渡口那座半塌的河神庙，香炉冷了多年。补一炷香，求个心安。',
    loc: 'heshen_du', timeCost: 1, risk: 0, order: 15,
    cond: { any: [{ item: { id: 'xiangzhu', n: 1 } }, { money: { gte: 2 } }] },
    effects: [
      { branch: { cond: { item: { id: 'xiangzhu', n: 1 } },
        then: [{ itemDel: { id: 'xiangzhu', n: 1 } }],
        else: [{ money: -2 }] } },
      { tendAdd: { xianghuo: 2 } }, { wvarAdd: { villageFear: -1 } }
    ],
    outcomes: [
      { weight: 5, effects: [{ counterAdd: { xinmo: -2 } },
        { log: { t: '香烟绕过塌了半边的庙梁，渡口的风都柔了几分。', style: '平' } }] },
      { weight: 3, effects: [{ tendAdd: { xianghuo: 2 } }, { branch: { cond: { npcAlive: 'heshen_po' }, then: [{ npcFavAdd: { id: 'heshen_po', n: 2 } }] } },
        { log: { t: '河婆见你诚心补香，多教了你一句祭河的口诀。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'villageFear', gte: 35 } }, effects: [
        { counterAdd: { xinmo: 1 } }, { wvarAdd: { villageFear: 1 } },
        { log: { t: '你刚插上香，庙后河面无端涌起一个浪头，香火灭了。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'cai_lingjiao', name: '采菱', desc: '河汊浅湾里满是野菱，撑着小划子去采。鲜菱清甜，也是上好的祭品。',
    loc: 'heshen_du', timeCost: 1, risk: 0, order: 25,
    effects: [],
    outcomes: [
      { weight: 5, effects: [{ itemAdd: { id: 'lingjiao', n: 2 } }, { money: 2 },
        { log: { t: '一划子鲜菱，吃几个，余下的拿去镇上换钱。', style: '平' } }] },
      { weight: 3, effects: [{ itemAdd: { id: 'lingjiao', n: 1 } }, { hp: 4 },
        { log: { t: '采菱采到日头偏西，剥了几个生吃，清甜爽口。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'villageFear', gte: 35 } }, effects: [
        { hp: -8 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '划子忽然被水下什么拽住，你弃了半篓菱，拼命撑回了岸。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'zhen_hehuan', name: '镇河患', desc: '河祸的根，在河心水底那位河神。它淹了百年人，是该有人去会一会了。',
    loc: 'heshen_du', timeCost: 1, risk: 3, order: 30,
    cond: { bossAlive: 'heshen', pflag: 'ji_guo_he' },
    effects: [{ counterAdd: { xinmo: 2 } }],
    outcomes: [
      { weight: 3, effects: [
        { combat: { enemy: 'shuigui', intro: '你的船刚到河心，几只水鬼便从四面攀上船舷，替河神探你的虚实。',
          onWin: [{ tendAdd: { xianghuo: 2 } }, { wvarAdd: { villageFear: -3 } }, { counterAdd: { shaqi: 1 } }],
          onFlee: [{ injure: { months: 1, severity: 1 } }, { counterAdd: { xinmo: 2 } },
            { log: { t: '你弃船泅水逃回岸边，河心那东西没有追——它在等。', style: '凶' } }] } }] },
      { weight: 4, effects: [
        { combat: { enemy: 'heshen',
          intro: '河心的水拔地而起，立成一道丈高的水墙。墙里一张古老的脸俯视着你：「还愿，还是讨债？」',
          onWin: [
            { bossSet: { enemy: 'heshen', alive: false } },
            { legacySet: { id: 'heshen_ping', v: true } },
            { wvarAdd: { villageFear: -25 } }, { locvarAdd: { loc: 'heshen_du', key: 'danger', n: -20 } },
            { tendAdd: { xianghuo: 5 } }, { fame: 12 },
            { rumorAdd: { t: '河神渡的河患平了。这百年头一回，开春不必拿活人去祭河了。', fame: 26 } },
            { log: { t: '水墙轰然垮回河里，河面第一次这样平，平得像一面镜子。', style: '异象' } }],
          onLose: [
            { injure: { months: 2, severity: 2 } }, { counterAdd: { xinmo: 4 } }, { wvarAdd: { villageFear: 5 } },
            { log: { t: '水墙合拢的一瞬，你被卷进河心。再没有人见你浮上来。', style: '凶' } }] } }] },
      { weight: 2, cond: { tend: { id: 'xianghuo', gte: 50 } }, effects: [
        { tendAdd: { xianghuo: 3 } }, { wvarAdd: { villageFear: -3 } },
        { log: { t: '你立在船头还愿不止，河心的水势竟一寸寸矮了下去——它在听。', style: '世界' } }] }
    ]
  });

  // ════════════════ 通用（任意地点） ════════════════

  G.define('action', {
    id: 'xiuxi_jingyang', name: '歇息静养', desc: '不求有功，但求把伤养好、把心放平。',
    loc: null, timeCost: 1, risk: 0, order: 90,
    effects: [{ hp: 12 }, { counterAdd: { xinmo: -1 } }],
    outcomes: [
      { weight: 7, effects: [{ qi: 3 },
        { log: { t: '吃饭，睡觉，看云。一个月就这么过去了。', style: '平' } }] },
      { weight: 3, cond: { counter: { id: 'xuexing', gte: 1 } }, effects: [
        { counterAdd: { xuexing: -2 } },
        { log: { t: '你把沾血的衣裳拆洗了三遍，身上的腥气总算淡了。', style: '平' } }] }
    ]
  });
})();
