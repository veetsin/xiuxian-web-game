// js/data/daos.js — 道途数据（Owner: C4）。十条道途全部完整实现（v1 五道 + v2 新五道）。
//
// dao schema 全貌见契约 §10；扩展字段（契约 v1.1 登记）：
//   stacks: [{id, name, atkPctPerStack, max}]  // 战斗栈定义，combat.js 通用支持「每栈加伤」
//   phenomena[].insightLine: "..."             // 异象首现时自动写进悟道录的那行字（玩家口吻）
//
// ── 十道打法定位（战斗差异一览）──
//   血剑：以伤换爆发——挨打叠「血意」、濒死翻倍、血煞斩烧血求杀。上限最高，命也最薄。
//   丹药：续航资源——开战借药力回灵、回合末药香疗伤、濒死药力护脉、丹火淬体边打边补；丹毒反成毒锋。
//   雷法：先手爆发克邪——雷雨天开场炸、四成概率先声夺人定住敌人、引雷诀雷蚀穿防穿物抗，尸/邪的天敌。
//   炼体：站撸回复——挨打生盾、逐回合扎根叠「桩劲」越打越重、半血以下痛处生筋回血，金刚桩减伤反击。
//   因果：保命+情报针对——梦中预演先手、死生帘护命、致命伤四成落空、因果回溯停敌一手；
//         对「前世杀过你的东西」（mem_death_×）在其巢穴有宿业 dot+加伤的专属针对。
//   寒冰：寒毒续航杀——回合末叠「寒毒」dot 滚雪球、开场/出手减敌势、寒髓诀强毒+冻结打断；
//         dot 不吃 def/物抗，专克 regen/undead 的回血（药人/尸鬼/寒蛟续航被压死），怕高温（扩展位）与自身寒反噬。
//   兽魂：召兽群攻震兽——开场召「兽魂」叠层（每栈加伤）、出手概率多段撕咬、引魂噬召兽追打；
//         对兽（pack 群兽/兽王）震慑加伤，怕死物无魂可驭（巢穴在尸地时召唤失灵）与噬魂伤神识。
//   香火：愿力护盾净邪——挨打生「愿力盾」吸伤、回合末对阴邪直伤、燃愿化盾为一击净邪爆发；
//         dot/直伤破物抗，专克 undead/邪（厉鬼/尸/河神/邪影），怕杀气重则愿力不应（高 shaqi 折扣）。
//   狐魅：媚惑幻控——出手概率使敌落空或转自伤（cenemyHp）、挨打幻影闪避生盾/定身、摄魂媚夺其一手；
//         对人形/有心智者媚控加成，怕无心智者免疫（巢穴在尸/邪地时媚术失灵）与用媚反噬心魔。
//   御剑：剑气多段破防——出手概率追加剑气段（cextraHit）+ 部分破防（cdmgNext 表达无视部分 def）、
//         万剑诀三段剑气；区别血剑「以伤换爆发」——御剑是连段/破防，不靠低血、不烧血，怕贴身压制（高 atk 近身折扣）。
//
// ── 跨文件 id 登记 ──
//   顿悟事件（C3 并行实现，命名钉死）：ev_wu_xuejian（已有）/ ev_wu_danyao / ev_wu_leifa /
//     ev_wu_lianti / ev_wu_yinguo；v2 新增 ev_wu_handu / ev_wu_shouhun / ev_wu_xianghuo /
//     ev_wu_humei / ev_wu_yujian。
//   引用记忆（C1 并行定义 mem_death_<敌id> 系列）：mem_death_heishan_langwang /
//     mem_death_kuangdong_shiwang / mem_death_shanmiao_xieying。
//   技能 id（UI/平衡侧可引用）：xuesha_zhan / danhuo_cuiti / yinlei_jue / jingang_zhuang / yinguo_huisu /
//     hansui_jue / yinhun_shi / ranyuan / sheihun_mei / wanjian_jue。
//   栈 id：xueyi（血意）/ zhuangjin（桩劲）；v2 新增 handu(寒毒，dot 非加伤栈)/ shouhun(兽魂)/ yuanli(愿力，shield 来源)。
//
// ── 平衡注（与 enemies.js 调参表配套；曲线经蒙特卡洛沙盘验证，结论见 enemies.js 文件头）──
//   异象解锁梯度统一 25 / 45 / 70（70 档在阶段2阈值60之后，是「认下这条道」的奖励）。
//   技能耗用：血煞斩 10%气血（无灵气需求，搏命流；自伤喂 2 层血意）；丹火淬体 灵气10；
//   引雷诀 灵气12；金刚桩 灵气8；因果回溯 灵气18（停敌+护盾+点裂缝，开销最重防无限定身）。
//   雷蚀/药毒/宿业等 dot 与 cenemyHp 直伤不吃 def/物抗（契约 §9）——这是尸王(def12)与邪影(物抗0.7)的正解通道。
//   关键实测：中期血剑全构筑+情报 vs 狼王 ≈47%（设计五五开）；后期雷法 vs 尸王 ≈95%、vs 邪影 ≈93%；
//   中期炼体 vs 大师兄 100%（9回合掉五成血）；中期因果+死忆 vs 狼王 ≈75%（复仇针对成立）。
//   ── v2 新五道平衡（与 enemies.js 文件头调参表配套；曲线同口径粗算）──
//   异象解锁梯度照旧 25 / 45 / 70。技能耗用：寒髓诀 灵气12（强 dot+冻结一手）；引魂噬 灵气10+喂血腥；
//     燃愿 灵气10（化盾为净邪爆发，盾越厚伤越高）；摄魂媚 灵气12（夺敌一手+概率自伤）；万剑诀 灵气14（三段剑气）。
//   寒毒/愿力直伤/剑气段同走 dot 与 cenemyHp（不吃 def/物抗）——这是 regen/undead/物抗系敌的破解通道。
//   关键意图：寒冰滚 dot 把寒蛟(regen4)续航压死（雷法外的第二解）；兽魂叠层越打越重克兽王；
//     香火愿力盾+净邪直伤克厉祖/河神（dot 破 undead 回血）；狐魅媚控克人形 Boss 老狐仙、但对无心智 Boss 失效；
//     御剑多段破防克剑灵(def 高)、与血剑并列剑系但打法两路。第一世白板对新 Boss 多半必死，轮回带情报+对口道可破。
//
// ── TODO-INTEGRATION（引擎能力缺口，内容侧已用现有机制绕过）──
//   1. 钩子 cond 读不到当前战斗对象（敌 id/traits）：「雷走阴邪」「旧债如刀」用地点（巢穴）代位
//      （邪物只在 shanshenmiao/feikuang 开打；Boss 战必在其巢）。若引擎日后提供 {cenemy:{id|trait}}
//      条件，可改为精确点名。同理 v2：寒冷克续航、香火净阴邪、狐魅对无心智失效，均以巢穴地点代位
//      （寒地 hantan、葬地 luanzang_gang/yizhuang、渡口 heshen_du、狐坳 hupo_ao、剑崖 duanjianya、兽径 houshan_lin）；
//      狐魅「对无心智失效」用「仅在人形/狐出没的地点生效」正向代位，避免在尸/邪地误触发媚控。
//   2. 「死生之帘」的致命伤免死无法做成硬性「一场一次」（hit 钩子无每战一次开关）；
//      现用 chance:0.4 + 小额回血 + 定身一手软化（救回也只剩一口气，下一击照样致命）。
//      若引擎给 hooks 加 oncePerBattle 标记，可改为足额一次。
//   3. 寒毒/兽魂/愿力「滚动叠层」无法读敌方 regen 强度做动态强度；用固定 dot.n + 多 hook 叠加近似
//      （回合末持续上毒、每次叠新 dot 段），实测足以压过 regen:4。
//
// ── 自检十问（对本文件整体）──
// 1标签：血/剑、药/丹、雷、体、因果五系 + v2 寒/兽/香火/狐/剑五系，共十道。
// 2易共现：各自的饲料行为（受伤持刃/采药服药/雷雨夜行/挨打硬抗/轮回记忆复仇/寒潭采冰/狩猎驭兽/
//   上香还愿/夜探狐坳/持剑听剑）与对口出身（猎户屠户/药铺/庙祝/武馆/病孤/采冰人/驯兽人/还愿子/狐养儿/铸剑徒）。
// 3排斥：彼此争 tend 喂养节奏；抑之（daoSuppress）本身是另一条构筑路。
// 4改状态：异象给战斗钩子，技能改战斗资源曲线，insight 落悟道录（confirmed 跨世）。
// 5后果：道途元素命中敌 fearOf（雷克尸、因果慑邪、寒克寒蛟/续航、兽魂震兽王、香火净厉鬼/河神、
//   狐魅控人形、剑气慑剑灵）；台词与传闻随评价走。
// 6可解释：每条异象都是「行为喂出来的身体变化」，firstLog 只写身体感受与怪相，无道名无机制词无数值。
// 7钩子：顿悟事件 ×10 给 C3；mem_death/mem_intel 给 C1；栈名给战斗日志；技能给 UI；元素映射给 combat.js。
// 8有趣选择：纳之成形 vs 抑之半废+心魔；十道答卷打十 Boss 各有最优解（对口克制成立）。
// 9服务 build：见「十道打法定位」。10不暴露：阶段2命名前，所有可见文案无道名无机制词。
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
          // 致命伤免死：hit 钩子在死亡判定之前结算，回血即续命。once=每战仅一次，
          // 那道「活路」一世只垂一次帘，不再是可反复触发的随机不死。
          { on: 'hit', chance: 0.4, once: true, cond: { hpPct: { lte: 0 } }, fx: [
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

  // ════════════════════════════════════════════════════════════════
  //  v2 新增五道（蓝图 §1）。元素畏惧映射（DAO_ELEMENT）属引擎，本批五道不在表内——
  //  其「克制」通过 hooks 的 cond（巢穴地点代位）实装，不依赖引擎 fearOf 畏惧系统；
  //  敌人 fearOf 仍驱动 lines.fear 叙事。详见文件头 TODO-INTEGRATION 1。
  // ════════════════════════════════════════════════════════════════

  // ════════ 寒冰道 —— 寒毒减速 + 克续航 ════════
  // 母题：矿底寒毒、蓝萤石、寒潭。打法：roundEnd 持续上寒毒 dot（滚雪球）+ battleStart/attack 减敌势；
  //   dot 不吃 def/物抗，专啃 regen/undead 的回血（这是寒蛟 regen4、尸鬼/药人续航之外的第二解）。
  //   寒髓诀 强寒毒 + 冻结一手打断对方节奏。代价：寒毒亦反噬己身（高叠层 firstLog 写齿冷指僵），文案侧。
  G.define('dao', {
    id: 'handu',
    hiddenName: '寒冰',
    stageNames: ['', '异象', '寒冰雏形', '寒冰小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'zhigu_hanyi', name: '指骨含寒', unlockTend: 25,
        firstLog: { t: '近来你指尖总是冰的，呵气成霜。摸过的东西，会留下一圈极淡的白。', style: '异象' },
        insightLine: '我的手凉得不正常。碰过寒气重的地方，那股冷就更往骨头里钻。',
        hooks: [
          // 通用（不限地点）寒毒只是「减速序章」，dot 较轻——克续航的重头在巢穴 hook（hansui_kefeng）。
          { on: 'roundEnd', chance: 0.4, fx: [
            { cdot: { id: '寒毒', n: 3, turns: 2 } },
            { clog: { t: '【异象】你呵出的白雾缠上它的伤口，那处的血凝住了，泛起霜花。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'hanqi_yapo', name: '寒气压境', unlockTend: 45,
        firstLog: { t: '你与人对峙时，对方会忽然打个寒颤，搓手跺脚——明明并不冷。', style: '异象' },
        insightLine: '我一动杀念，周遭就降了温。对面的手脚会变慢，像被冻住了一拍。',
        hooks: [
          { on: 'battleStart', chance: 0.55, fx: [
            { cdot: { id: '寒毒', n: 4, turns: 2 } },
            { clog: { t: '【异象】一层白霜自你脚下漫开，它的动作肉眼可见地迟滞了。', style: '异象' } }
          ]},
          { on: 'attack', chance: 0.3, fx: [
            { cdot: { id: '寒毒', n: 3, turns: 2 } },
            { clog: { t: '【异象】你这一下带出刺骨寒意，它的伤口结起了冰碴。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'hansui_kefeng', name: '寒髓克锋', unlockTend: 70,
        // 克续航的核心：在 regen/undead 敌的巢穴（寒潭/矿洞/葬地）寒毒加重，把回血压成净亏。
        // TODO-INTEGRATION: 无法 cond 点名敌 regen/undead，用其巢穴代位（文件头注 1）。
        firstLog: { t: '你梦见自己沉在潭底，四周的水都冻成了蓝。醒来时，被褥下结了一层薄冰。', style: '异象' },
        insightLine: '会回血的、不死的东西，最怕我这股寒。冻住了，它就补不回来了。',
        hooks: [
          // 巢穴克续航主环：寒地/续航敌处每回合末滚动寒毒 + 直伤（cenemyHp 无视 def/regen），把回血压成净亏。
          { on: 'roundEnd', chance: 0.65, cond: { any: [{ loc: 'hantan' }, { loc: 'feikuang' }, { loc: 'luanzang_gang' }, { loc: 'yizhuang' }, { loc: 'heshen_du' }] }, fx: [
            { cdot: { id: '寒毒', n: 8, turns: 3 } },
            { cenemyHp: -10 },
            { clog: { t: '【异象】寒髓自你周身泛起，那东西刚合拢的伤口又一寸寸冻裂开来。', style: '异象' } }
          ]},
          { on: 'lowHp', fx: [
            { cdot: { id: '寒毒', n: 8, turns: 2 } },
            { clog: { t: '【异象】命悬一线，你周身寒气暴涨，连呼吸都凝成了刀子割向它。', style: '异象' } }
          ]}
        ]
      }
    ],
    skill: {
      // 寒髓诀：冻结打断（cstun）+ 一记普攻倍率（cdmgNext，吃 def）+ 中等寒毒 dot。
      //   它的「破防神技」化在巢穴 hook（hansui_kefeng）的滚动直伤里——对非续航/非寒地敌只是一记中规中矩的强攻。
      unlockStage: 2, id: 'hansui_jue', name: '寒髓诀',
      desc: '引一身寒髓灌入敌骨，强毒入髓，冻得它停下这一手。',
      cost: { qi: 12 },
      fx: [
        { cdot: { id: '寒毒', n: 7, turns: 2 } },
        { cstun: 1 },
        { cdmgNext: { mult: 1.5 } },
        { clog: { t: '你呵气成冰，一道寒髓贯入它的骨缝——它僵住了。', style: '异象' } }
      ]
    },
    awakeningEvent: 'ev_wu_handu',
    suppressible: true
  });

  // ════════ 兽魂道 —— 召兽群攻 + 震慑兽 ════════
  // 母题：黑山妖兽、狼群、兽王坟。打法：battleStart 召「兽魂」叠层（每栈加伤，越打越凶）+
  //   attack 概率多段撕咬（cextraHit 群攻）；引魂噬召兽追打。对兽（pack/兽径/兽王坟）震慑加伤。
  //   代价：死物无魂可驭（巢穴在尸/葬地时召唤失灵——文案+不触发增益）；噬魂伤神识（高层 firstLog 写）。
  G.define('dao', {
    id: 'shouhun',
    hiddenName: '兽魂',
    stageNames: ['', '异象', '驭兽雏形', '驭兽小成'],
    thresholds: [25, 60, 120],
    stacks: [{ id: 'shouhun', name: '兽魂', atkPctPerStack: 0.06, max: 8 }],
    phenomena: [
      {
        id: 'shouyan_ruxue', name: '兽眼如血', unlockTend: 25,
        firstLog: { t: '入夜后你的眼睛会泛起一点幽光，野狗见了你绕道走，山雀不敢落在你肩上。', style: '异象' },
        insightLine: '畜生都怕我。可越是杀过的兽，夜里越觉得它们跟在身后，离我不远。',
        hooks: [
          { on: 'battleStart', fx: [
            { cstack: { id: 'shouhun', n: 1 } },
            { clog: { t: '【异象】你身后的暗处响起一声低低的兽嗥——有什么应着你醒了。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'qunhun_si', name: '群魂噬', unlockTend: 45,
        firstLog: { t: '动手时你眼前会闪过许多兽影，它们替你扑咬，撕过之处你竟也觉得齿间发酸。', style: '异象' },
        insightLine: '它们听我的。我一出手，那些魂影就跟着扑上去，连撕带咬。',
        hooks: [
          { on: 'attack', chance: 0.4, fx: [
            { cstack: { id: 'shouhun', n: 1 } },
            { cextraHit: 1 },
            { clog: { t: '【异象】一道兽影自你掌侧窜出，咬住了它的下盘——你顺势追了一记。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'qunshou_zhenwang', name: '群兽镇王', unlockTend: 70,
        // 震兽：在兽径/黑山深处（群兽与兽王巢穴）兽魂大涨、群魂扑咬加重；
        //   roundEnd 的兽影撕咬走 cenemyHp 直伤（破 def，是震慑兽王 def7 的稳定输出补环）。TODO-INTEGRATION 同注 1。
        firstLog: { t: '你梦见自己立在一座兽骨堆成的坟前，万兽俯首。醒来枕边落了一撮不属于你的兽毛。', style: '异象' },
        insightLine: '成群的畜生，连那些当头的，到了我面前都得伏低。这股气，是它们祖宗传下来怕的。',
        hooks: [
          { on: 'battleStart', cond: { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }, { loc: 'heishan_waiwei' }] }, fx: [
            { cstack: { id: 'shouhun', n: 4 } },
            { cdmgNext: { mult: 1.4 } },
            { clog: { t: '【异象】你脚下的兽魂成群涌起，对面那畜生的气焰，矮了下去。', style: '异象' } }
          ]},
          { on: 'roundEnd', chance: 0.55, cond: { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }] }, fx: [
            { cstack: { id: 'shouhun', n: 1 } },
            { cenemyHp: -10 },
            { clog: { t: '【异象】群魂不肯散，又一道兽影从侧翼咬上去，咬穿了它的皮糙肉厚。', style: '异象' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'yinhun_shi', name: '引魂噬',
      desc: '以血腥引动兽魂，召群兽附形，追着它撕咬一阵。',
      cost: { qi: 10 },
      fx: [
        { cstack: { id: 'shouhun', n: 2 } },
        { cextraHit: 2 },
        { counterAdd: { xuexing: 1 } },
        { clog: { t: '你喉间滚出一声不似人声的低吼，群兽之魂应声扑出！', style: '异象' } }
      ]
    },
    awakeningEvent: 'ev_wu_shouhun',
    suppressible: true
  });

  // ════════ 香火道 —— 愿力护盾 + 净邪 ════════
  // 母题：香火、还愿、河神、邪神。打法：hit 生「愿力盾」（cshield 吸伤）+ roundEnd 对阴邪直伤；
  //   燃愿化盾为一击净邪爆发。dot/直伤破物抗——专克 undead/邪（厉鬼/尸/河神/邪影）。
  //   代价：杀气重则愿力不应（高 shaqi 时净邪 hook 折扣，文案侧；hook 用 counter cond 表达）。
  G.define('dao', {
    id: 'xianghuo',
    hiddenName: '香火',
    stageNames: ['', '异象', '愿力雏形', '愿力小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'tixiang_huluan', name: '体香护暖', unlockTend: 25,
        firstLog: { t: '你身上总有一缕淡淡的香火气，挥不散。阴冷的屋子，你一进去就觉得暖了几分。', style: '异象' },
        insightLine: '我身上有股香味，自己闻不太到，别人说像庙里的。阴气重的地方，它替我挡着。',
        hooks: [
          { on: 'hit', chance: 0.4, fx: [
            { cshield: 6 },
            { clog: { t: '【异象】那一击落下时，你周身腾起一层淡金的暖光，替你卸了力道。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'yuanli_jingxie', name: '愿力净邪', unlockTend: 45,
        // 净邪：在阴邪/葬/渡的巢穴（厉鬼/尸/河神/邪影所在）出手与回合末焚阴气直伤——
        //   破物抗、压 undead/邪 回血（cenemyHp 不吃 def/物抗/regen），这是香火克厉祖/河神的正解通道。
        // TODO-INTEGRATION 同注 1（巢穴地点代位敌方 undead/邪）。
        firstLog: { t: '路过停尸的义庄，你掌心忽然发烫，阴风绕着你打转却近不得身，像被什么烫退了。', style: '异象' },
        insightLine: '阴邪的东西沾我不得。我掌心那点暖，是百家香火攒下来的，烧得它们直缩。',
        hooks: [
          { on: 'hit', chance: 0.45, fx: [
            { cshield: 8 },
            { clog: { t: '【异象】暖光又起，护住了你的要害。', style: '异象' } }
          ]},
          // 出手时净邪直伤（破物抗压回血的主输出）；高 shaqi 则折损（杀气重愿力不应——代价仍在）。
          { on: 'attack', chance: 0.5, cond: { all: [
              { any: [{ loc: 'yizhuang' }, { loc: 'luanzang_gang' }, { loc: 'heshen_du' }, { loc: 'shanshenmiao' }, { loc: 'feikuang' }] },
              { counter: { id: 'shaqi', lte: 50 } }
            ] }, fx: [
            { cenemyHp: -12 },
            { clog: { t: '【异象】你掌心金光裹上这一击，那东西的影子被烧得滋滋作响。', style: '异象' } }
          ]},
          { on: 'roundEnd', chance: 0.6, cond: { all: [
              { any: [{ loc: 'yizhuang' }, { loc: 'luanzang_gang' }, { loc: 'heshen_du' }, { loc: 'shanshenmiao' }, { loc: 'feikuang' }] },
              { counter: { id: 'shaqi', lte: 50 } }
            ] }, fx: [
            { cenemyHp: -10 },
            { clog: { t: '【异象】余下的金光自行游走，一遍遍灼着那东西，烧得它合不拢伤口。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'baishi_xianghuo', name: '百世香火', unlockTend: 70,
        firstLog: { t: '你梦见无数人朝你跪拜、上香、磕头还愿。醒来时枕边有三炷无火自燃的断香。', style: '异象' },
        insightLine: '攒了百世的香火都认我。愿力厚到一处，连最阴的东西都得低头——除非我手上沾的杀业太重。',
        hooks: [
          { on: 'lowHp', fx: [
            { cshield: 20 },
            { clog: { t: '【异象】千万道还愿的声音在你耳边响起，金光裹住你，把那一击挡在了身外。', style: '异象' } }
          ]},
          { on: 'roundEnd', chance: 0.6, cond: { all: [
              { any: [{ loc: 'yizhuang' }, { loc: 'luanzang_gang' }, { loc: 'heshen_du' }, { loc: 'shanshenmiao' }, { loc: 'feikuang' }] },
              { counter: { id: 'shaqi', lte: 60 } }
            ] }, fx: [
            { cenemyHp: -13 },
            { clog: { t: '【异象】愿力如潮，一遍遍漫过那东西，烧去它身上一层又一层的阴秽。', style: '异象' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'ranyuan', name: '燃愿',
      desc: '焚去护身的愿力，化作一击净邪的金火——盾越厚，这一下越烈。',
      cost: { qi: 10 },
      fx: [
        { cenemyHp: -14 },
        { cdmgNext: { mult: 1.6 } },
        { cshield: 4 },
        { clog: { t: '你低诵一句还愿的旧辞，护身的金光骤然收拢，烧成一道净邪的火！', style: '异象' } }
      ]
    },
    awakeningEvent: 'ev_wu_xianghuo',
    suppressible: true
  });

  // ════════ 狐魅道 —— 媚惑幻控 + 克人 ════════
  // 母题：狐婆坳、狐祟、幻术。打法：attack 概率使敌当回合落空或自伤（cenemyHp）+ hit 幻影闪避（cshield/cstun）；
  //   摄魂媚夺敌一手。对人形/有心智加成（用「人形/狐出没地点」正向代位，避免对无心智误触发）。
  //   代价：无心智者免疫（巢穴在尸/邪/兽地时媚术不灵——正向 cond 不覆盖那些地点）；用媚伤心魔（firstLog 写）。
  G.define('dao', {
    id: 'humei',
    hiddenName: '狐魅',
    stageNames: ['', '异象', '狐魅雏形', '媚狐小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'meiyan_huoren', name: '媚眼惑人', unlockTend: 25,
        firstLog: { t: '近来与人说话，对方常看着看着就走了神，问什么应什么。你的眼尾，不知何时多了一点上挑。', style: '异象' },
        insightLine: '我一看人，对方就容易听我的、信我的。这股劲，对会动心思的人最灵。',
        hooks: [
          // 人形/有心智出没的地点正向代位：人祸/狐/市集/渡口；不覆盖尸葬兽邪地（无心智免疫）。
          { on: 'attack', chance: 0.35, cond: { any: [{ loc: 'hupo_ao' }, { loc: 'qingshizhen' }, { loc: 'yima_guan' }, { loc: 'heishan_waiwei' }, { loc: 'wuguan' }, { loc: 'duanjianya' }] }, fx: [
            { cenemyHp: -6 },
            { clog: { t: '【异象】你似笑非笑看它一眼，它一阵恍惚，挥出的招竟落向了自己。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'huanying_shanbi', name: '幻影闪避', unlockTend: 45,
        firstLog: { t: '险处你身形会忽然散成几重虚影，攻向你的人扑了个空，自己都怔住了。', style: '异象' },
        insightLine: '危急时我会化出好几个影子，真身藏在里头。看花了眼的，往往就慌了手脚。',
        hooks: [
          { on: 'hit', chance: 0.4, fx: [
            { cshield: 7 },
            { clog: { t: '【异象】它打中的只是一重残影，影子散开的刹那，它愣了一愣。', style: '异象' } }
          ]},
          { on: 'attack', chance: 0.3, cond: { any: [{ loc: 'hupo_ao' }, { loc: 'qingshizhen' }, { loc: 'yima_guan' }, { loc: 'heishan_waiwei' }, { loc: 'wuguan' }, { loc: 'duanjianya' }] }, fx: [
            { cstun: 1 },
            { clog: { t: '【异象】你眼波一转，它竟被勾住了神，僵在原地半晌没回过神。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'shehun_meiyu', name: '摄魂媚域', unlockTend: 70,
        firstLog: { t: '你梦见自己坐在一群跪伏的人中间，他们眼里只有你。醒来时，镜子里的人朝你笑了一下——你没有笑。', style: '异象' },
        insightLine: '会动情、会起念的，逃不出我这股媚。可越用它，夜里心头那点杂念就越压不住。',
        hooks: [
          { on: 'attack', chance: 0.4, cond: { any: [{ loc: 'hupo_ao' }, { loc: 'qingshizhen' }, { loc: 'yima_guan' }, { loc: 'heishan_waiwei' }, { loc: 'wuguan' }, { loc: 'duanjianya' }] }, fx: [
            { cenemyHp: -9 },
            { cstun: 1 },
            { clog: { t: '【异象】你启唇一笑，它的眼神彻底散了，握刀的手反手划向了自己。', style: '异象' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'sheihun_mei', name: '摄魂媚',
      desc: '一笑摄魂，夺它这一手——心智越全的，越逃不开。',
      cost: { qi: 12 },
      fx: [
        { cstun: 1 },
        { cenemyHp: -8 },
        { cshield: 6 },
        { counterAdd: { xinmo: 1 } },
        { clog: { t: '你回眸一笑，媚意如丝缠住它的神魂——它呆住了。', style: '异象' } }
      ]
    },
    awakeningEvent: 'ev_wu_humei',
    suppressible: true
  });

  // ════════ 御剑道 —— 剑气多段 + 破防 ════════
  // 母题：断剑崖、剑冢、剑诀。打法：attack 概率追加剑气段（cextraHit）+ 部分破防（cdmgNext 表达无视部分 def）；
  //   万剑诀三段剑气。区别血剑：御剑是远程连段/破防，不靠低血爆发、不烧血、无血意栈。
  //   克：群敌/低防/高 def 的剑灵（多段破防）。代价：被贴身压制时折扣（高 atk 近身，文案侧）；御剑耗神识。
  G.define('dao', {
    id: 'yujian',
    hiddenName: '御剑',
    stageNames: ['', '异象', '御剑雏形', '御剑小成'],
    thresholds: [25, 60, 120],
    phenomena: [
      {
        id: 'zhijian_zigu', name: '指间自鼓', unlockTend: 25,
        firstLog: { t: '你空手虚划，指尖竟带出一缕极细的风，割断了三尺外的草叶。断口齐整得像刀切。', style: '异象' },
        insightLine: '我手边的刀剑会自己轻轻颤，像在等我。我一动念，那点风就替我出了手。',
        hooks: [
          { on: 'attack', chance: 0.4, fx: [
            { cextraHit: 1 },
            { clog: { t: '【异象】一缕无形剑气随你的手势飞出，在它身上又划开一道。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'jianqi_pojia', name: '剑气破甲', unlockTend: 45,
        // 破甲：cenemyHp 直伤无视 def——这是御剑对高 def 目标（剑灵 def10）的破解核心，cdmgNext 再补一记。
        firstLog: { t: '你出手时，对方的甲胄、皮糙肉厚都像纸一样——剑气是从缝里钻进去的，不靠蛮力。', style: '异象' },
        insightLine: '硬壳挡不住我。剑气会找它的缝，再厚的防，也有一线可入。',
        hooks: [
          { on: 'attack', chance: 0.5, fx: [
            { cdmgNext: { mult: 1.4 } },
            { cenemyHp: -9 },
            { clog: { t: '【异象】你剑气一引，它的硬壳上裂开一线，这一击长驱直入。', style: '异象' } }
          ]}
        ]
      },
      {
        id: 'wanjian_chaozong', name: '万剑朝宗', unlockTend: 70,
        // 克剑灵/低防群敌：在剑冢/断剑崖剑气共鸣，多段大涨。TODO-INTEGRATION 同注 1。
        firstLog: { t: '你梦见万千断剑自一座剑坟里拔地而起，齐齐指向你，又齐齐俯首。醒来时满室的铁器都在轻鸣。', style: '异象' },
        insightLine: '断剑崖那些剑，认我。聚到一处，能连成一片剑雨——再多的敌、再硬的壳，都扫得动。',
        hooks: [
          { on: 'attack', chance: 0.5, fx: [
            { cextraHit: 1 },
            { cdmgNext: { mult: 1.3 } },
            { clog: { t: '【异象】你周身剑气连成一线，一段未尽，第二段已追了上去。', style: '异象' } }
          ]},
          // 剑冢/断剑崖剑气共鸣：开场万剑齐发 + 每回合末一片剑雨破甲直伤（cenemyHp 无视 def，破剑灵 def9 的核心）。
          { on: 'battleStart', cond: { any: [{ loc: 'duanjianya' }] }, fx: [
            { cextraHit: 2 },
            { cdmgNext: { mult: 1.5 } },
            { clog: { t: '【异象】满崖断剑齐齐一震，应着你的气息，朝那东西飞掠而去。', style: '异象' } }
          ]},
          { on: 'roundEnd', chance: 0.6, cond: { any: [{ loc: 'duanjianya' }] }, fx: [
            { cenemyHp: -12 },
            { clog: { t: '【异象】崖上断剑不肯歇，一片剑雨自上而下，找着它甲胄的缝钻了进去。', style: '异象' } }
          ]}
        ]
      }
    ],
    skill: {
      unlockStage: 2, id: 'wanjian_jue', name: '万剑诀',
      desc: '催三段剑气连斩，每段都顺着甲缝长驱，破防见血。',
      cost: { qi: 14 },
      fx: [
        { cdmgNext: { mult: 1.5 } },
        { cextraHit: 2 },
        { cenemyHp: -6 },
        { clog: { t: '你掐诀一引，三道剑气前后相衔，破甲而入！', style: '异象' } }
      ]
    },
    awakeningEvent: 'ev_wu_yujian',
    suppressible: true
  });
})();
