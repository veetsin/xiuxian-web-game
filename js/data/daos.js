// js/data/daos.js — 道途数据（Owner: C4）。五条道途全部完整实现。
//
// dao schema 全貌见契约 §10；扩展字段（契约 v1.1 登记）：
//   stacks: [{id, name, atkPctPerStack, max}]  // 战斗栈定义，combat.js 通用支持「每栈加伤」
//   phenomena[].insightLine: "..."             // 异象首现时自动写进悟道录的那行字（玩家口吻）
//
// ── 五道打法定位（战斗差异一览）──
//   血剑：以伤换爆发——挨打叠「血意」、濒死翻倍、血煞斩烧血求杀。上限最高，命也最薄。
//   丹药：续航资源——开战借药力回灵、回合末药香疗伤、濒死药力护脉、丹火淬体边打边补；丹毒反成毒锋。
//   雷法：先手爆发克邪——雷雨天开场炸、四成概率先声夺人定住敌人、引雷诀雷蚀穿防穿物抗，尸/邪的天敌。
//   炼体：站撸回复——挨打生盾、逐回合扎根叠「桩劲」越打越重、半血以下痛处生筋回血，金刚桩减伤反击。
//   因果：保命+情报针对——梦中预演先手、死生帘护命、致命伤四成落空、因果回溯停敌一手；
//         对「前世杀过你的东西」（mem_death_×）在其巢穴有宿业 dot+加伤的专属针对。
//
// ── 跨文件 id 登记 ──
//   顿悟事件（C3 并行实现，命名钉死）：ev_wu_xuejian（已有）/ ev_wu_danyao / ev_wu_leifa /
//     ev_wu_lianti / ev_wu_yinguo。
//   引用记忆（C1 并行定义 mem_death_<敌id> 系列）：mem_death_heishan_langwang /
//     mem_death_kuangdong_shiwang / mem_death_shanmiao_xieying。
//   技能 id（UI/平衡侧可引用）：xuesha_zhan / danhuo_cuiti / yinlei_jue / jingang_zhuang / yinguo_huisu。
//   栈 id：xueyi（血意）/ zhuangjin（桩劲）。
//
// ── 平衡注（与 enemies.js 调参表配套；曲线经蒙特卡洛沙盘验证，结论见 enemies.js 文件头）──
//   异象解锁梯度统一 25 / 45 / 70（70 档在阶段2阈值60之后，是「认下这条道」的奖励）。
//   技能耗用：血煞斩 10%气血（无灵气需求，搏命流；自伤喂 2 层血意）；丹火淬体 灵气10；
//   引雷诀 灵气12；金刚桩 灵气8；因果回溯 灵气18（停敌+护盾+点裂缝，开销最重防无限定身）。
//   雷蚀/药毒/宿业等 dot 与 cenemyHp 直伤不吃 def/物抗（契约 §9）——这是尸王(def12)与邪影(物抗0.7)的正解通道。
//   关键实测：中期血剑全构筑+情报 vs 狼王 ≈47%（设计五五开）；后期雷法 vs 尸王 ≈95%、vs 邪影 ≈93%；
//   中期炼体 vs 大师兄 100%（9回合掉五成血）；中期因果+死忆 vs 狼王 ≈75%（复仇针对成立）。
//
// ── TODO-INTEGRATION（引擎能力缺口，内容侧已用现有机制绕过）──
//   1. 钩子 cond 读不到当前战斗对象（敌 id/traits）：「雷走阴邪」「旧债如刀」用地点（巢穴）代位
//      （邪物只在 shanshenmiao/feikuang 开打；Boss 战必在其巢）。若引擎日后提供 {cenemy:{id|trait}}
//      条件，可改为精确点名。
//   2. 「死生之帘」的致命伤免死无法做成硬性「一场一次」（hit 钩子无每战一次开关）；
//      现用 chance:0.4 + 小额回血 + 定身一手软化（救回也只剩一口气，下一击照样致命）。
//      若引擎给 hooks 加 oncePerBattle 标记，可改为足额一次。
//
// ── 自检十问（对本文件整体）──
// 1标签：血/剑、药/丹、雷、体、因果五系。2易共现：各自的饲料行为（受伤持刃/采药服药/雷雨夜行/
//   挨打硬抗/轮回记忆复仇）与对口出身（猎户屠户/药铺/庙祝/武馆/病孤）。
// 3排斥：彼此争 tend 喂养节奏；抑之（daoSuppress）本身是另一条构筑路。
// 4改状态：异象给战斗钩子，技能改战斗资源曲线，insight 落悟道录（confirmed 跨世）。
// 5后果：道途元素命中敌 fearOf（雷克尸、因果慑邪、药慑药人、体慑武人、血慑狼匪）；台词与传闻随评价走。
// 6可解释：每条异象都是「行为喂出来的身体变化」，firstLog 只写感受。
// 7钩子：顿悟事件 ×5 给 C3；mem_death/mem_intel 给 C1；栈名给战斗日志；技能给 UI。
// 8有趣选择：纳之成形 vs 抑之半废+心魔；五道答卷打四 Boss 各有最优解。
// 9服务 build：见「五道打法定位」。10不暴露：阶段2命名前，所有可见文案无道名无机制词。
(function () {
  'use strict';

  // ════════ 血剑道 —— 以伤换爆发（完整参考实现）════════
  G.define('dao', {
    id: 'xuejian',
    hiddenName: '血剑',
    stageNames: ['', '异象', '血剑雏形', '血剑小成'],
    thresholds: [25, 60, 120],
    stacks: [{ id: 'xueyi', name: '血意', atkPctPerStack: 0.06, max: 10 }],
    phenomena: [
      {
        id: 'shanghou_jianming', name: '伤后剑鸣', unlockTend: 25,
        firstLog: { t: '你受伤后，腰间刀剑微微发热，像有什么在回应你的血。', style: '异象' },
        insightLine: '受了伤之后更容易出现。持刃时最明显。',
        hooks: [
          { on: 'hit', chance: 0.5, fx: [
            { cstack: { id: 'xueyi', n: 1 } },
            { clog: { t: '【异象】伤口的血沿着刃身倒流，你握柄的手一阵发烫。', style: '血' } }
          ]},
          { on: 'attack', chance: 0.25, cond: { counter: { id: 'xuexing', gte: 3 } }, fx: [
            { cdot: { id: '流血', n: 3, turns: 2 } },
            { clog: { t: '【异象】你这一击带出一线血光，伤口竟难以合拢。', style: '血' } }
          ]}
        ]
      },
      {
        id: 'xue_bukenliu', name: '血不肯流', unlockTend: 45,
        firstLog: { t: '濒死之际，你的血不再外涌，反而向着握刃的手臂倒灌。', style: '异象' },
        insightLine: '越是濒死，那股力越是清醒。我有点怕它，也有点想用它。',
        hooks: [
          { on: 'lowHp', fx: [
            { cdmgNext: { mult: 1.8 } },
            { cheal: 15 },
            { clog: { t: '【异象】血灌入刃，伤口竟自行收拢——你眼前的一切都慢了下来。', style: '血' } }
          ]},
          { on: 'roundEnd', chance: 0.6, cond: { hpPct: { lte: 0.35 } }, fx: [
            { cheal: 6 },
            { clog: { t: '【异象】伤口大张着，你的血却一滴都不肯落地。', style: '血' } }
          ]},
          { on: 'win', chance: 0.6, fx: [
            { cheal: 8 },
            { clog: { t: '【异象】杀意餍足，你的伤口竟自行收口了几分。', style: '血' } }
          ]}
        ]
      },
      {
        id: 'renxue_tongqi', name: '刃血同息', unlockTend: 70,
        firstLog: { t: '杀招递出的那一瞬，你听不见自己的心跳——它跳在刃上。', style: '异象' },
        insightLine: '我和这口刃，开始用同一处伤口呼吸了。伤得越重，它越醒。',
        hooks: [
          { on: 'attack', chance: 0.5, cond: { hpPct: { lte: 0.5 } }, fx: [
            { cextraHit: 1 },
            { clog: { t: '【异象】刃随血走，你的手腕不由自主追出了半招。', style: '血' } }
          ]},
          { on: 'kill', fx: [
            { cheal: 6 }, { cqi: 4 },
            { clog: { t: '【异象】敌血溅上刃身的刹那，一股暖流自刃柄渡回你掌心。', style: '血' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'xuesha_zhan', name: '血煞斩',
      desc: '以伤换势，血光出鞘——自伤亦养血意。',
      cost: { hpPct: 0.1 },
      fx: [
        { cstack: { id: 'xueyi', n: 2 } },
        { cdmgNext: { mult: 2.2 } },
        { clog: { t: '你割开掌心，血雾缠剑而起！', style: '血' } }
      ]
    },
    awakeningEvent: 'ev_wu_xuejian',
    suppressible: true
  });

  // ════════ 丹药道 —— 续航资源 ════════
  G.define('dao', {
    id: 'danyao',
    hiddenName: '丹道',
    stageNames: ['', '异象', '丹感雏形', '丹道小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'shegen_yaoxiang', name: '舌根药香', unlockTend: 25,
        firstLog: { t: '近来你总在舌根尝到一缕若有似无的药香，苦里能分出七八种滋味。', style: '丹' },
        insightLine: '碰过药草的日子，那股药香就更清楚。它在替我记着什么。',
        hooks: [
          { on: 'roundEnd', chance: 0.35, fx: [
            { cheal: 3 },
            { clog: { t: '【异象】喉间药香一转，伤处的钝痛竟散了几分。', style: '丹' } }
          ]}
        ]
      },
      {
        id: 'dantian_rulu', name: '丹田如炉', unlockTend: 45,
        firstLog: { t: '静坐时你觉出小腹里有一点温吞吞的火。这些年吃下去的药力没有走，都在那儿煨着。', style: '丹' },
        insightLine: '吃下去的东西都还在，存在小腹那点火里，等我取用。',
        hooks: [
          { on: 'battleStart', fx: [
            { cqi: 6 },
            { clog: { t: '【异象】腹中那点火自己旺了起来，温热的药力顺着气脉走。', style: '丹' } }
          ]},
          { on: 'lowHp', fx: [
            { cheal: 14 },
            { clog: { t: '【异象】命悬一线，积年的药力自骨缝里渗出，死死护住心脉。', style: '丹' } }
          ]}
        ]
      },
      {
        id: 'yidu_yangfeng', name: '以毒养锋', unlockTend: 70,
        firstLog: { t: '你指甲缝里渗出极淡的青色。毒虫爬过你的手背，掉头就走。', style: '丹' },
        insightLine: '积在身子里的那些毒，原来不是债，是存粮。',
        hooks: [
          { on: 'attack', chance: 0.35, cond: { counter: { id: 'dandu', gte: 12 } }, fx: [
            { cdot: { id: '药毒', n: 4, turns: 2 } },
            { clog: { t: '【异象】你这一击带上了积年药毒，它的伤口嗤嗤地冒起细泡。', style: '丹' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'danhuo_cuiti', name: '丹火淬体',
      desc: '引丹田药力为火，淬血合创，边打边补。',
      cost: { qi: 10 },
      fx: [
        { cheal: 18 },
        { cdmgNext: { mult: 1.4 } },
        { clog: { t: '丹火轰然自小腹升起，淬过的血肉重新拢合！', style: '丹' } }
      ]
    },
    awakeningEvent: 'ev_wu_danyao',
    suppressible: true
  });

  // ════════ 雷法道 —— 先手爆发克邪 ════════
  G.define('dao', {
    id: 'leifa',
    hiddenName: '雷法',
    stageNames: ['', '异象', '雷音雏形', '雷法小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'erhou_leiming', name: '耳后雷鸣', unlockTend: 25,
        firstLog: { t: '雷雨夜里，你听见自己骨缝深处有极细的雷声，跟着天上的炸响一齐震。', style: '雷' },
        insightLine: '只在雷雨天出现。天上响一声，骨头里应一声。',
        hooks: [
          { on: 'battleStart', cond: { weather: '雷雨' }, chance: 0.75, fx: [
            { cdmgNext: { mult: 1.5 } },
            { clog: { t: '【异象】天边雷动，你指尖窜过一线麻意，气机陡然炸开。', style: '雷' } }
          ]}
        ]
      },
      {
        id: 'xiansheng_duoren', name: '先声夺人', unlockTend: 45,
        firstLog: { t: '你发现自己出手总比念头快半拍——像身子里有什么东西，等不及了。', style: '雷' },
        insightLine: '它要的就是先出手的那半拍。快过念头，快过对面的杀心。',
        hooks: [
          { on: 'battleStart', chance: 0.4, fx: [
            { cstun: 1 },
            { clog: { t: '【异象】不等它动，你周身先炸了一记闷雷——它竟被慑在原地！', style: '雷' } }
          ]}
        ]
      },
      {
        id: 'leixing_kexie', name: '雷走阴邪', unlockTend: 70,
        firstLog: { t: '路过山神庙那晚，你打了个喷嚏，鼻尖竟溅出一点火星——满殿阴风齐齐缩了回去。', style: '雷' },
        insightLine: '阴邪的东西沾不得我。我骨头里那点雷，是它们的克星。',
        hooks: [
          // TODO-INTEGRATION: 无法以 cond 点名敌方 undead/邪物，用其巢穴（阴邪两地）代位。
          // roundEnd 而非 attack：雷气自行游走，蓄势/运气的回合也在烧——这是尸王/邪影战的主输出补环。
          { on: 'roundEnd', chance: 0.5, cond: { any: [{ loc: 'shanshenmiao' }, { loc: 'feikuang' }] }, fx: [
            { cenemyHp: -10 },
            { clog: { t: '【异象】你周身雷气自行游走，噼啪烙上那东西的影子。', style: '雷' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'yinlei_jue', name: '引雷诀',
      desc: '引天雷入体再泼出去，至刚至烈，甲胄尸秽皆挡不住。',
      cost: { qi: 12 },
      fx: [
        { cdmgNext: { mult: 1.9 } },
        { cenemyHp: -10 },
        { cdot: { id: '雷蚀', n: 10, turns: 2 } },
        { clog: { t: '你并指引雷入体，一声霹雳自掌心炸出！', style: '雷' } }
      ]
    },
    awakeningEvent: 'ev_wu_leifa',
    suppressible: true
  });

  // ════════ 炼体道 —— 站撸回复 ════════
  G.define('dao', {
    id: 'lianti',
    hiddenName: '炼体',
    stageNames: ['', '异象', '铜皮雏形', '金刚小成'],
    thresholds: [25, 60, 120],
    stacks: [{ id: 'zhuangjin', name: '桩劲', atkPctPerStack: 0.05, max: 6 }],
    phenomena: [
      {
        id: 'guxiang_rugu', name: '骨响如鼓', unlockTend: 25,
        firstLog: { t: '你活动筋骨时，骨节发出闷雷似的脆响，挨过打的地方反而更结实了。', style: '体' },
        insightLine: '硬挨下来的伤，好了之后那块肉就不一样了。',
        hooks: [
          { on: 'hit', chance: 0.35, fx: [
            { cshield: 3 },
            { clog: { t: '【异象】皮肉一紧，你硬生生卸去了这一下的几分力。', style: '体' } }
          ]}
        ]
      },
      {
        id: 'lidi_shenggen', name: '立地生根', unlockTend: 45,
        firstLog: { t: '你站桩时脚底发沉，像有根须往地里扎。一炷香后，推你的人推不动了。', style: '体' },
        insightLine: '站得越久越沉。这双脚底下，怕是真的有根。',
        hooks: [
          { on: 'roundEnd', fx: [
            { cstack: { id: 'zhuangjin', n: 1 } },
            { cheal: 2 }
          ]},
          { on: 'roundEnd', chance: 0.4, fx: [
            { clog: { t: '【异象】你的下盘又沉了一分，气血自脚底一路生上来。', style: '体' } }
          ]}
        ]
      },
      {
        id: 'tongchu_shengjin', name: '痛处生筋', unlockTend: 70,
        firstLog: { t: '旧伤养好之后，那块皮肉摸上去比别处更韧，像底下多长了一层筋。', style: '体' },
        insightLine: '挨过的打没有白挨。痛过的地方，长出来的是甲。',
        hooks: [
          { on: 'hit', chance: 0.35, cond: { hpPct: { lte: 0.5 } }, fx: [
            { cheal: 6 },
            { cstack: { id: 'zhuangjin', n: 1 } },
            { clog: { t: '【异象】这一下打实了，痛处的筋肉却热腾腾地鼓胀起来。', style: '体' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'jingang_zhuang', name: '金刚桩',
      desc: '扎桩沉腰，筋肉绷如铁石——来力皆回。',
      cost: { qi: 8 },
      fx: [
        { cshield: 10 },
        { cdmgNext: { mult: 1.5 } },
        { clog: { t: '你扎桩沉腰，浑身筋肉绷如铁石——来力皆回！', style: '体' } }
      ]
    },
    awakeningEvent: 'ev_wu_lianti',
    suppressible: true
  });

  // ════════ 因果道 —— 保命 + 情报针对 ════════
  G.define('dao', {
    id: 'yinguo',
    hiddenName: '因果',
    stageNames: ['', '异象', '宿命雏形', '因果小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'jishi_zhimeng', name: '既视之梦', unlockTend: 25,
        firstLog: { t: '你梦见了还没发生的事。醒来时枕边发凉，梦里的细节却清清楚楚。', style: '因果' },
        insightLine: '梦见的事，后来真的发生了。前世的东西在牵着我。',
        hooks: [
          { on: 'battleStart', chance: 0.3, fx: [
            { cdmgNext: { mult: 1.3 } },
            { clog: { t: '【异象】这一幕你在梦里见过——它往哪边躲，你已经知道了。', style: '因果' } }
          ]}
        ]
      },
      {
        id: 'shisheng_zhilian', name: '死生之帘', unlockTend: 45,
        firstLog: { t: '险处你总能先半步偏头，杀招贴着耳根掠空。你分明没有看见它来。', style: '因果' },
        insightLine: '死字临头的时候，眼前会垂下一道帘。帘后面那条路，走得。',
        hooks: [
          { on: 'lowHp', fx: [
            { cshield: 15 },
            { clog: { t: '【异象】千百种死法自眼前闪过，你拣中了那条活路。', style: '因果' } }
          ]},
          // 致命伤免死：hit 钩子在死亡判定之前结算，回血即续命（TODO-INTEGRATION 见文件头注 2）。
          { on: 'hit', chance: 0.4, cond: { hpPct: { lte: 0 } }, fx: [
            { cheal: 10 },
            { cstun: 1 },
            { clog: { t: '【异象】那一击分明落下了——却像落进了别人的命里。你还站着。', style: '因果' } }
          ]}
        ]
      },
      {
        id: 'jiuzhai_rudao', name: '旧债如刀', unlockTend: 70,
        firstLog: { t: '你梦见自己死过的地方。梦里你绕到那东西背后，看清了它颈下的死穴。', style: '因果' },
        insightLine: '杀过我的东西，这一世我看得见它的死处。债，总是要还的。',
        hooks: [
          // 「杀过你的敌人，这一世你看得见它的死穴」：mem_death_<敌id>（C1 定义）+ 其巢穴地点代位。
          // TODO-INTEGRATION: 同文件头注 1，若引擎提供敌方 cond 可精确点名。
          { on: 'battleStart', cond: { all: [{ mem: 'mem_death_heishan_langwang' }, { loc: 'heishan_shenchu' }] }, fx: [
            { cdmgNext: { mult: 1.4 } },
            { cdot: { id: '宿业', n: 6, turns: 99 } },
            { clog: { t: '【异象】这头狼欠你一条命。旧债自雪下涌起，缠住了它的喉颈。', style: '因果' } }
          ]},
          { on: 'battleStart', cond: { all: [{ mem: 'mem_death_kuangdong_shiwang' }, { loc: 'feikuang' }] }, fx: [
            { cdmgNext: { mult: 1.4 } },
            { cdot: { id: '宿业', n: 6, turns: 99 } },
            { clog: { t: '【异象】它的尸身上还挂着你前世那条命。债主上门，连本带利。', style: '因果' } }
          ]},
          { on: 'battleStart', cond: { all: [{ mem: 'mem_death_shanmiao_xieying' }, { loc: 'shanshenmiao' }] }, fx: [
            { cdmgNext: { mult: 1.4 } },
            { cdot: { id: '宿业', n: 6, turns: 99 } },
            { clog: { t: '【异象】你看见它周身缠满讨债的影子——其中一道，生着你前世的脸。', style: '因果' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'yinguo_huisu', name: '因果回溯',
      desc: '逆此战因果回拨一线：敌之杀招落空，你的一击落向命数的裂缝。',
      cost: { qi: 18 },
      fx: [
        { cstun: 1 },
        { cshield: 12 },
        { cdmgNext: { mult: 1.5 } },
        { clog: { t: '你逆着此战的因果回拨一线——它的杀招落了空。', style: '因果' } }
      ]
    },
    awakeningEvent: 'ev_wu_yinguo',
    suppressible: false // 因果躲不掉：顿悟事件（C3）的「抑之」选项亦只是暂避，文案侧自圆。
  });
})();
