// js/data/actions_special.js — 山神庙 / 家中 / 通用 行动（Owner: C2）。
//
// 多月行动范式：timeCost:3 → 引擎自动走 3 次月末 tick（第 2、3 月为轻量 tick，不掷环境事件，
// 但 eventQueue 到期事件、NPC 行动、世界漂移照常——闭关时世界仍在变）。
//
// ── 本文件对外输出（登记）──
//   pflag：jian_houdian_menfeng（见过后殿门缝，庙线钩子）、jian_dier_zhuxiang（替庙祝上过第二炷香）、
//          ting_le_zhuanxia（循前世记忆贴砖听过庙底低语）
//   引用记忆（C1）：mem_leichi_canwen（雷池残纹钥匙）、mem_miaodi_diyu（庙底低语钥匙）
//   引用 pflag（C1 births.js 登记）：xianghuo_yinji（庙祝养子香火印记）、su_ji（病弱孤儿宿疾）
//   引用钉死事件（C3 并行）：ev_miaoye_zaoyu / ev_leiyu_yixiang
//   insight 条目：leichi_jiyi（雷池旧梦）
//
// ── 自检十问 ──
// 1标签：香火/阴邪/夜/修炼/隐秘/梦。2易共现：庙的 corruption/ghostQi、雷雨天窗口、出生印记（香火/宿疾）。
// 3排斥：市集人声；守夜与白日上香一明一暗互补不同人。4改状态：阴气/庙腐化/好感/倾向/心魔/修为。
// 5后果：上香压阴气、守夜喂阴邪遭遇、扫殿积善缘；雷雨夜打坐真的会挨雷（risk 诚实）。
// 6可解释：香火安魂所以阴气降；淋雨受寒所以伤；庙里数名字的是谁——留给 C3 答。
// 7钩子：后殿门缝、第二炷香、雷池旧梦全是 C1/C3 的咬合点。8有趣选择：守夜赚香火钱但夜里有东西；
//   闭关三月换大修为但世界自走。9服务 build：庙喂因果，雷夜喂雷，家中吐纳是所有路的底。
// 10不暴露：全部写身体感受与庙中怪相，无机制词。
(function () {
  'use strict';

  // ════════════════ 山神庙 ════════════════

  G.define('action', {
    id: 'shangxiang', name: '上香', desc: '给没了脸的山神添一炷香。心诚不诚，只有香知道。',
    loc: 'shanshenmiao', timeCost: 1, risk: 0, order: 10,
    cond: { any: [{ item: { id: 'xiangzhu', n: 1 } }, { money: { gte: 2 } }] },
    effects: [
      { branch: { cond: { item: { id: 'xiangzhu', n: 1 } },
        then: [{ itemDel: { id: 'xiangzhu', n: 1 } }],
        else: [{ money: -2 }] } },
      { tendAdd: { yinguo: 2 } }, { npcFavAdd: { id: 'miaozhu', n: 2 } }
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
          then: [{ money: 4 }, { npcFavAdd: { id: 'miaozhu', n: 3 } }],
          else: [{ money: 2 }] } },
        { wvarAdd: { ghostQi: -2 } },
        { log: { t: '一夜只有风声。天亮时庙祝塞给你两个还热的素包子。', style: '平' } }] },
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
      { tendAdd: { yinguo: 1 } }, { npcFavAdd: { id: 'miaozhu', n: 3 } },
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
