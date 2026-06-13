// js/data/daohen_death_content.js — 死亡余痕·死亡记忆交互（spec §0.6「死亡记忆的交互要求」）。
//   Owner: 死亡记忆避坑 Agent。只改本文件。读 memories.js 全部死亡/败绩记忆 id，
//   为每条死亡记忆补「避同死 / 复仇策略 / 再见态度 / 我曾来过」的【行动级】读取点，
//   让「死一次 = 买一条改命情报」真正成立——不只做收藏，每条都改下一世的选择与状态。
//
// ── 设计映射（spec §0.6 表「死亡记忆 → 下一世开行动暗门/战前提示/避坑选择」）──
//   1 普通敌死忆 → 避同死：持 {mem:'mem_death_<敌>'} 在相关地点多出一个「循前世死法避坑」的行动，
//     真改状态（少受伤 / 得情报 flag / 避战 / 降危险），而非纯文案。覆盖 v1 六普通敌 + v2 可达普通敌。
//   2 Boss 死忆 → 复仇策略：持 {mem:'mem_death_<boss>'} 在该 Boss 所在地多出一个「提前布置/克制」行动，
//     落 dhd_ke_<boss> 增益 flag（C2/C3 的 Boss 战可 cond 读它给优势）+ 情报，给「行动级」复仇钩，
//     与引擎既有 intelMem(mem_intel_*) 战前提示并行不冲突。覆盖 v1 四 Boss + v2 六 Boss。
//   3 非致死战败记忆 → 再见态度：持 defeatCause 记忆再见对手时，态度变（约战/服气/求教/避战/羞辱）。
//     mem_death_wuguan_dizi(武馆弟子) / mem_death_dashixiong_boss(大师兄) / mem_death_jianzhong_canling(剑冢残灵)。
//   3·之二 自戕之死（无敌可避）→ 避同死：丹毒反噬/突破暴毙/寿尽也在死忆里留可学习信息，落点在家中修炼/突破地：
//     mem_death_dandu(趁早泄毒) / mem_death_tupo_shibai(关前稳一稳) / mem_death_shouyuan(趁早多走一步)。
//   4 兜底死忆 → 「我曾来过」：持 {mem:'mem_death_generic'}（多见于第二世起）早期一个轻事件，给似曾相识的迷惘。
//   覆盖：memories.js 全部 26 条 mem_death_* 死亡/败绩记忆，逐条都有 ≥1 行动级读取点，无遗漏。
//
// ── 写作口径（spec §0.6）──
//   零机制词、有修仙味；NPC 不明确记得前世，写成「似曾相识 / 莫名笃定 / 手脚自己先动了」。
//   每个 outcome ≥1 个非 log 状态 op（避坑要真避：少受伤/避战/得情报 flag/降危险）。
//   文案常用「你像是早知道会这样」「手比脑子先记得」的笔触——记忆在身，命数偏过一寸。
//
// ── 本文件对外输出（登记，他处可 cond 读）──
//   Boss 克制增益 pflag（C2/C3 的 Boss 战/事件可 {pflag:'dhd_ke_<boss>'} 读，给战前优势/特殊选项）：
//     dhd_ke_langwang / dhd_ke_shiwang / dhd_ke_xieying / dhd_ke_dashixiong /
//     dhd_ke_laohu / dhd_ke_jianling / dhd_ke_hantan / dhd_ke_shouwang / dhd_ke_lizu / dhd_ke_heshen
//   避坑/态度一次性门闩 pflag（本文件自用，防重复触发）：dhd_* 见各行动 nopflag。
//   pflag dhd_ti_<x>（已对 x 提过防 = 该普通敌避坑已用过本世一次）。
//   全部行动/事件 id 以 dh_death_ 前缀，杜绝与 C2/C3 撞 id。
//
// ── 引用的真实 id（均来自 ids.js / memories.js，跨世可携带的 carry 死忆）──
//   地点：heishan_waiwei / heishan_shenchu / feikuang / yima_guan / wuguan / duanjianya /
//         hupo_ao / luanzang_gang / heshen_du / hantan / houshan_lin / shanshenmiao
//   死亡记忆：mem_death_yelang/yaolang/shanfei/shigui/yaoren/wuguan_dizi(defeat) /
//            heishan_langwang/kuangdong_shiwang/dashixiong_boss(defeat)/shanmiao_xieying /
//            humei_yao/ligui/shuigui/hanjiao_you/bali/jianzhong_canling(defeat) /
//            laohu_xian/jianzhong_jianling/hantan_jiao/houshan_shouwang/luanzang_li_zu/heshen / generic
//
// ── 自检十问（对文件整体回答一次）──
// 1标签：余痕/死亡/避坑/复仇/态度/梦——全是「死过一次」沉淀成的本能。2易共现：前世死地、前世死法、对应 Boss 战。
// 3排斥：避坑行动持对应死忆才现身；一次性门闩防本世重复；与正路行动同地并列不互斥。
// 4改状态：少受伤/避战/降危险/得克制 flag/态度 flag/NPC 好感——全是非 log 实 op。
// 5后果：死一次→下一世手脚先记得→该绕的绕、该克的克、该约的约，死得越多越「老练」。
// 6可解释：身体比脑子先记得疼；命数偏过一寸，遇同一处险地自己就慢半拍、留一手。
// 7钩子：Boss 克制 flag 留给 C2/C3 的 Boss 战读；态度 flag 留给 social/npc 读；不强求，缺了也能独立成立。
// 8有趣选择：带着死忆这一世是提前去结那桩仇（用克制 flag 占优），还是先攒构筑、绕开死地。
// 9服务轮回：把「痛失一世」换成「这一世更懂怎么活」——记忆是改命的本钱，不是收藏品。
// 10不暴露：全是画面与本能，无道名、无数值、无机制词；提醒只指方位天时与一个「留心」，不写攻略。
(function () {
  'use strict';

  // 小工具：避坑/态度行动的统一「似曾相识」开场（纯文案 helper，避免泄漏全局）。
  // 仅作可读性，不参与注册。

  // ════════════════════════════════════════════════════════════════════
  // 一、普通敌死忆 → 避同死（持 mem_death_<敌> 在死地多一个「循前世死法避坑」行动）
  //   每条 ≥1 非 log op：少受伤 / 避战 / 降地点危险 / 得情报 flag。nopflag 门闩防本世重复。
  // ════════════════════════════════════════════════════════════════════

  // —— 野狼/妖狼：荒径围拢的绿光 → 不独行、先占高处、避开狼道 ——
  G.define('action', {
    id: 'dh_death_bi_lang', name: '择路避狼', order: 6,
    desc: '荒草一深你心里就发紧。哪片草伏得不对、风里有没有腥气，你像是早就知道。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 0,
    cond: { any: [{ mem: 'mem_death_yelang' }, { mem: 'mem_death_yaolang' }], nopflag: 'dhd_ti_lang' },
    effects: [
      { pflagSet: { id: 'dhd_ti_lang' } },
      { log: { t: '你绕开那道草伏得最低的口子，从背风的高坡走。说不清为什么，你就是知道那底下蹲着东西。', style: '平' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { wvarAdd: { wolfThreat: -3 } },
        { qi: 4 },
        { log: { t: '果然，坡下灌木里几点绿光一闪即没——它们没敢上来。你出了身冷汗，脚下却没乱。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { wvarAdd: { wolfThreat: -2 } },
        { healInjury: { months: 1 } },
        { log: { t: '你拣了根趁手的火棍贴身走。手比脑子先记得那种被围住的滋味——这一回，你不独行。', style: '平' } }
      ] }
    ]
  });

  // —— 山匪：道旁卷刃的劫刀 → 财不露白、避开窄道滚石口 ——
  G.define('action', {
    id: 'dh_death_cangcai', name: '藏好财物', order: 7,
    desc: '过驿道前你下意识把钱袋往里头掖了掖，又解下来分两处藏。「财不露白」四个字，像谁在你耳边说过。',
    loc: 'yima_guan', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_shanfei', nopflag: 'dhd_ti_fei' },
    effects: [
      { pflagSet: { id: 'dhd_ti_fei' } },
      { pflagSet: { id: 'dhd_an_cai' } }   // 已藏财：留给劫道事件读，被劫时少破财（C3 可选读）
    ],
    outcomes: [
      { weight: 6, effects: [
        { money: 4 },
        { log: { t: '转角滚石后果然有人影晃了一下。你不动声色绕了开去——袖中那点碎银，半文没露。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { fame: 1 },
        { log: { t: '你把好走的明路让给了别人，自己挑了条更绕的。同行的脚夫笑你胆小，你只笑笑——他不懂。', style: '平' } }
      ] }
    ]
  });

  // —— 尸鬼：矿道里先灭的火把 → 记得带火、不深入 ——
  G.define('action', {
    id: 'dh_death_dai_huo', name: '备足火把', order: 6,
    desc: '下矿前你执意多绑了两把浸油的火把在腰上，又往怀里塞了火折子。同伴笑你怕黑，你说不出口——你是怕那声刮岩壁的指甲。',
    loc: 'feikuang', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_shigui', nopflag: 'dhd_ti_gui' },
    effects: [
      { pflagSet: { id: 'dhd_ti_gui' } },
      { pflagSet: { id: 'dhd_bei_huo' } }   // 已备火：矿洞尸鬼/尸王遭遇时占优（C2/C3 可读）
    ],
    outcomes: [
      { weight: 5, effects: [
        { itemAdd: { id: 'huozhezi', n: 1 } },
        { log: { t: '黑暗里果然响起咯咯的刮石声。你火把一举，那佝偻影子缩了回去——这一回，灭的不是你的火。', style: '吉' } }
      ] },
      { weight: 5, effects: [
        { healInjury: { months: 1 } },
        { log: { t: '你没像上回那样一头扎进深巷。火光照到哪，你才走到哪。身后那片化不开的黑，你这次绕过去了。', style: '平' } }
      ] }
    ]
  });

  // —— 药人：合得拢的皮肉 + 腥甜药香 → 战前弱点意识（刀别停、惧火惧药） ——
  G.define('action', {
    id: 'dh_death_bian_yaoren', name: '辨那股药香', order: 8,
    desc: '深山里飘来一缕浓得发腥的甜香，旁人闻着发腻，你却脊背一凉——那东西刀慢半分就喂它，你太记得了。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_yaoren', nopflag: 'dhd_ti_yaoren' },
    effects: [
      { pflagSet: { id: 'dhd_ti_yaoren' } },
      { pflagSet: { id: 'dhd_zhi_yaoren' } }   // 知药人弱处：再遇药人战占优（C3 遭遇事件可读）
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { danyao: 2 } },
        { log: { t: '你循着腥甜避开了那片烂熟的草木。它的皮肉合得拢，怕的是火、是相克的药气——你这回先记着了。', style: '平' } }
      ] },
      { weight: 4, effects: [
        { itemAdd: { id: 'zhixuesan', n: 1 } },
        { log: { t: '你提早寻了几味带火气、带药性的东西揣在身上。下回它再扑过来，刀就不会停了。', style: '平' } }
      ] }
    ]
  });

  // —— 狐魅：月下招手的影 → 守心避迷（v2 普通敌）——
  G.define('action', {
    id: 'dh_death_shou_xin', name: '守心而行', order: 8,
    desc: '狐坳的甜香一漫上来，你就把舌尖抵住上颚、心神攥成一团。月下要是有人唤你的名字，软得像棉——千万别应。',
    loc: 'hupo_ao', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_humei_yao', nopflag: 'dhd_ti_humei' },
    effects: [
      { pflagSet: { id: 'dhd_ti_humei' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { humei: 2 } },
        { log: { t: '月下果然立着个招手的影子，软语唤你的名。你掐着掌心没动——脚下的路，这回没在你眼前消失。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { qi: 5 },
        { log: { t: '你像是早知道这香气底下藏着张照水的笑脸。心一动路就没了——你偏不动心，循着来路退了出来。', style: '平' } }
      ] }
    ]
  });

  // —— 厉鬼：压在胸口的夜（魇毙）→ 提气避魇（v2 普通敌）——
  G.define('action', {
    id: 'dh_death_ti_qi', name: '提气过夜', order: 8,
    desc: '入乱葬岗前你先深深换了三口气，把一口真气提在胸口不肯松。睡是不敢睡的——那压上来的、黑得没边的重，你死过一次才知道是什么。',
    loc: 'luanzang_gang', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_ligui', nopflag: 'dhd_ti_ligui' },
    effects: [
      { pflagSet: { id: 'dhd_ti_ligui' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { xianghuo: 2 } },
        { log: { t: '后半夜果然有什么沉沉压上你胸口。你死命提着那口气——醒着提气的人，它压不实。天亮时你还睁着眼，活着。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { counterAdd: { xinmo: -1 } },
        { log: { t: '你在坟堆背风处守了一夜，一刻没敢真睡。手心那口气提到天明——这一回，没让那片夜压下来。', style: '平' } }
      ] }
    ]
  });

  // —— 水鬼：水底攥脚踝的手（溺亡）→ 莫近无桥水（v2 普通敌）——
  G.define('action', {
    id: 'dh_death_bi_shui', name: '不近深水', order: 9,
    desc: '渡口的水你只敢在有桥有埠的地方挨着。没人烟的深湾、独自一处的水边，你死活不肯下去——脚踝上那只冰凉发胀的手，你忘不掉。',
    loc: 'heshen_du', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_shuigui', nopflag: 'dhd_ti_shuigui' },
    effects: [
      { pflagSet: { id: 'dhd_ti_shuigui' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { qi: 4 },
        { log: { t: '你绕开那处无桥的静水，挑了埠头人多的地方过。水里那些仰着的脸，这回没等到你去替它们上岸。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { money: 3 },
        { log: { t: '有人喊你去那处僻静水汊摸鱼，说鱼肥。你摇头不去——你像是早知道那水底下有人在等。', style: '平' } }
      ] }
    ]
  });

  // —— 寒蛟幼：钻心的蓝寒（寒毒入心）→ 御寒护心（v2 普通敌）——
  G.define('action', {
    id: 'dh_death_yu_han', name: '御寒护心', order: 9,
    desc: '近寒潭前你把贴身的棉絮重重裹了一层，又含了口烈酒暖着心口。潭面要是腾起一层蓝雾，那钻进心口的冷——你领教过它怎么从里头把人冻透。',
    loc: 'hantan', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_hanjiao_you', nopflag: 'dhd_ti_hanjiao' },
    effects: [
      { pflagSet: { id: 'dhd_ti_hanjiao' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { handu: 2 } },
        { log: { t: '潭面果然腾起蓝雾，一口寒息直钻心口。你护着那点暖意没让它冻实——寒从里冻起，热的东西才化得开它，你记着。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { healInjury: { months: 1 } },
        { log: { t: '你没像上回那样空着身子凑近冰下的蓝光。带火带暖、不久留——这一回，那股冷没能顺着脊梁爬进你心里。', style: '平' } }
      ] }
    ]
  });

  // —— 熊罴：山一样压下来的蛮力 → 避其力（v2 普通敌）——
  G.define('action', {
    id: 'dh_death_bi_bali', name: '避其蛮力', order: 9,
    desc: '后山草木一阵翻倒，你心口就猛地一缩。那座小山似的身躯一立起来，硬碰它的力是拿鸡蛋撞磨盘——你拿命换过这条道理。',
    loc: 'houshan_lin', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_bali', nopflag: 'dhd_ti_bali' },
    effects: [
      { pflagSet: { id: 'dhd_ti_bali' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { shouhun: 2 } },
        { log: { t: '草木翻倒处果然立起一头黑熊。你不硬接，绕着它的爪势游走——它毛是潮的、力是蛮的，可它转身慢。你这回活着退了下来。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { qi: 4 },
        { log: { t: '你远远听见那阵草木翻倒声就改了道。不去硬碰那座会动的小山——你像是早知道碰上了会是什么下场。', style: '平' } }
      ] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 二、Boss 死忆 → 复仇策略（持 mem_death_<boss> 在该 Boss 死地多一个「提前布置/克制」行动）
  //   落 dhd_ke_<boss> 增益 flag（留给 C2/C3 的 Boss 战 cond 读，给战前优势/特殊选项）+ 情报。
  //   与引擎既有 intelMem(mem_intel_*) 战前提示并行，互不冲突；这里给的是「行动级」复仇钩。
  //   每条 ≥1 非 log op（落 flag 即状态变更），nopflag 门闩防本世重复。
  // ════════════════════════════════════════════════════════════════════

  // —— 黑山狼王（雪上的金瞳）→ 布陷·诱其左盲侧 ——
  G.define('action', {
    id: 'dh_death_fu_langwang', name: '雪线布陷', order: 12,
    desc: '黑山一落雪，你梦里那双金色独目就亮起来。你避开雪线明处，沿着兽道下绊索、堆滚石——这一回，你想自己挑地方等它。',
    loc: 'heishan_shenchu', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_heishan_langwang', nopflag: 'dhd_fu_langwang', season: '冬' },
    effects: [
      { pflagSet: { id: 'dhd_fu_langwang' } },
      { pflagSet: { id: 'dhd_ke_langwang' } },   // 已布陷诱狼王：Boss 战占优（C2/C3 可读）
      { log: { t: '你把绊索系在它惯走的那道雪坡上，借着记忆里它扑击的方位，专挑它看不见的左侧下手。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { tendAdd: { xuejian: 2 } },
        { log: { t: '布置妥当，你退到上风。雪还在下。这一世，换你在暗处看着它走来。', style: '吉' } }
      ] }
    ]
  });

  // —— 矿洞尸王（塌方之下）→ 探明退路·候雷雨 ——
  G.define('action', {
    id: 'dh_death_bu_shiwang', name: '探尸王退路', order: 12,
    desc: '最深那条矿道你一闭眼就看见——覆满矿尘的巨尸睁眼，洞顶簌簌落灰。这回你先把退路和撑木看了个遍，不见雷雨天，绝不进去叫醒它。',
    loc: 'feikuang', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_kuangdong_shiwang', nopflag: 'dhd_bu_shiwang' },
    effects: [
      { pflagSet: { id: 'dhd_bu_shiwang' } },
      { pflagSet: { id: 'dhd_ke_shiwang' } },   // 已探退路候雷：尸王战占优
      { log: { t: '你记下了每一根快朽的撑木、每一处能藏身的支巷。地底的王不见雷火不闭眼——你打算等天上的雷替你叫它。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { itemAdd: { id: 'huozhezi', n: 1 } },
        { log: { t: '退路、火、雷雨天——三样齐了，你才肯再下那条最深的巷。这一回，塌下来的不该是你。', style: '吉' } }
      ] }
    ]
  });

  // —— 山神庙邪影（神像后的脸）→ 查其来历·备雷火 ——
  G.define('action', {
    id: 'dh_death_cha_xieying', name: '查影子的来历', order: 12,
    desc: '满殿香灰无风自起、凝成一张脸——这画面烧在你识海里。你翻遍庙志旧碑，要把那道影子是哪些孤魂戾气养出来的，一笔一笔查清。',
    loc: 'shanshenmiao', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_shanmiao_xieying', nopflag: 'dhd_cha_xieying' },
    effects: [
      { pflagSet: { id: 'dhd_cha_xieying' } },
      { pflagSet: { id: 'dhd_ke_xieying' } },   // 已查来历备雷火：邪影战可当面点破其来历
      { tendAdd: { yinguo: 2 } },
      { log: { t: '你查到了那些错放的香火、那些没名没姓埋在庙后的人。它怕雷火，更怕有人当面喊破它的来历——来历一破，影子就立不住。', style: '因果' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '你把那串名字记死了。下回它再戴着山神的脸笑，你能一口叫破它到底是谁。', style: '平' } }
      ] }
    ]
  });

  // —— 老狐仙（九尾的影）→ 静心破幻·备清醒之物 ——
  G.define('action', {
    id: 'dh_death_po_laohu', name: '静心备破幻', order: 12,
    desc: '狐婆坳的月色一稠，你梦里那九道舒展的尾影就晃起来。这回你先静坐养一颗不动的心，又寻了能刺痛醒神的物事贴身——它的迷局，破在一颗不动的心。',
    loc: 'hupo_ao', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_laohu_xian', nopflag: 'dhd_po_laohu' },
    effects: [
      { pflagSet: { id: 'dhd_po_laohu' } },
      { pflagSet: { id: 'dhd_ke_laohu' } },   // 已备破幻：老狐仙战可破其迷局
      { tendAdd: { humei: 2 } },
      { log: { t: '你想清楚了——它照着你心里最想要的编一座迷局，骗的是心。心不动，迷局便立不住。你把这一条刻进了骨头。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '再入坳时，它递来的那场太真的梦，你认得出是借你的。这一回，你不会在梦里把刀架上自己脖子。', style: '吉' } }
      ] }
    ]
  });

  // —— 剑冢剑灵（万剑认主）→ 以剑入剑·先和其鸣 ——
  G.define('action', {
    id: 'dh_death_he_jianling', name: '先和满崖剑鸣', order: 12,
    desc: '断剑崖深处那一幕你忘不掉——万剑认的不是你。这回你不急着拔剑，先在崖前听满崖断剑的嗡鸣，一寸寸把自己的剑意调到与它相和。',
    loc: 'duanjianya', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_jianzhong_jianling', nopflag: 'dhd_he_jianling' },
    effects: [
      { pflagSet: { id: 'dhd_he_jianling' } },
      { pflagSet: { id: 'dhd_ke_jianling' } },   // 已和其鸣：剑灵战可以剑入剑、令其认主
      { tendAdd: { yujian: 2 } },
      { log: { t: '是剑认人，不是人认剑。寻常刀枪近不得身，剑气会循着兵刃反震回来——唯有以剑意压过满崖剑鸣，它才肯认你。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '崖上千剑随你掌中那道剑气一起一伏。这一回，你不再用蛮力跟它对劈——你要它归鞘认主。', style: '吉' } }
      ] }
    ]
  });

  // —— 寒潭蛟（冰下睁开的眼）→ 候雷·备火破冰甲 ——
  G.define('action', {
    id: 'dh_death_po_hantan', name: '候雷破蛟', order: 12,
    desc: '潭心冰下那只缓缓睁开的巨眼，把你冻成冰像的那口寒息——你记得清清楚楚。这回你不在隆冬动它，单等一个雷雨天，备足火,引它一身寒气反噬。',
    loc: 'hantan', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_hantan_jiao', nopflag: 'dhd_po_hantan' },
    effects: [
      { pflagSet: { id: 'dhd_po_hantan' } },
      { pflagSet: { id: 'dhd_ke_hantan' } },   // 已候雷备火：寒潭蛟战可破其冰甲
      { tendAdd: { handu: 2 } },
      { log: { t: '寒极者畏火。它以寒息冰封一切，越冷越强；可天上的雷、人间的火能劈开它的冰甲。这一池死水里，这是唯一的活路。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '你看准了天色，把火与雷都算进了去意里。下回再凿穿那块蓝冰，睁眼的就未必是它了。', style: '吉' } }
      ] }
    ]
  });

  // —— 后山兽王（群兽俯首）→ 蓄威慑王 ——
  G.define('action', {
    id: 'dh_death_zhen_shouwang', name: '蓄威慑兽王', order: 12,
    desc: '群兽齐齐噤声俯首、让出中央那头巨兽——爹的警告你这回懂了。它服的不是力，是更高的威与更野的魂。你压住性子，先把自己的威与兽缘养厚。',
    loc: 'houshan_lin', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_houshan_shouwang', nopflag: 'dhd_zhen_shouwang' },
    effects: [
      { pflagSet: { id: 'dhd_zhen_shouwang' } },
      { pflagSet: { id: 'dhd_ke_shouwang' } },   // 已蓄威：兽王战可以威压慑服
      { tendAdd: { shouhun: 2 } },
      { log: { t: '它终究是兽。硬碰硬如以卵击石，可你若有压过它的威、更野的魂，群兽之主便会像它脚下的群兽一样朝你俯首。', style: '平' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '你不再急着扑上去送命。这一世，你要它先在你面前矮下半分。', style: '吉' } }
      ] }
    ]
  });

  // —— 乱葬厉祖（百年怨气）→ 备净香·候天雷 ——
  G.define('action', {
    id: 'dh_death_jing_lizu', name: '备香净厉祖', order: 12,
    desc: '地底渗出的层层低语，黑得发亮的怨气唤着你历世的名——魂先于身散的滋味，你尝过。这回你备下一炷诚心的净香、单候一道天雷，要去会一会那个「祖」。',
    loc: 'luanzang_gang', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_luanzang_li_zu', nopflag: 'dhd_jing_lizu' },
    effects: [
      { pflagSet: { id: 'dhd_jing_lizu' } },
      { pflagSet: { id: 'dhd_ke_lizu' } },   // 已备净香候雷：厉祖战可净其怨、焚其魂
      { tendAdd: { xianghuo: 2 } },
      { log: { t: '刀剑加身如搅黑水，越斩越多。它怕干净的东西——一炷诚心的香能净它的戾，一道天雷能焚它的怨。这两样，你都备齐了。', style: '因果' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '它一开口就唤你历世的名。这回你不慌——香在手，雷在天，你要顺着那条因果的线找到它的本魂。', style: '因果' } }
      ] }
    ]
  });

  // —— 河神（渡口的水势）→ 备香火还愿 ——
  G.define('action', {
    id: 'dh_death_huan_heshen', name: '备香火还愿', order: 12,
    desc: '渡口一夜暴涨的浑浪、那道丈高戴着古旧神面的水影——「还愿，还是抵命」那句话，你被卷进水里时听得真真的。这回你先把香火与诚心备足。',
    loc: 'heshen_du', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_heshen', nopflag: 'dhd_huan_heshen' },
    effects: [
      { pflagSet: { id: 'dhd_huan_heshen' } },
      { pflagSet: { id: 'dhd_ke_heshen' } },   // 已备香火还愿：河神战可消其凶戾
      { tendAdd: { xianghuo: 2 } },
      { log: { t: '它本是受香火的神，最重「诚」与「愿」。硬接它的水势必败；以香火还愿能消其大半凶戾，再以利剑斩开扑来的水墙，方有一线生机。', style: '因果' } }
    ],
    outcomes: [
      { weight: 1, effects: [
        { qi: 3 },
        { log: { t: '你把那年欠下的河祭一并备齐了。下回它再立起丈高的水影问你，你递得出香火，也接得住它的水。', style: '吉' } }
      ] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 三、非致死战败记忆 → 再见态度（持 defeatCause 记忆，再见对手时态度变：约战/服气/求教/不蛮力）
  //   做成「行动级」选择，每条 ≥1 非 log op。NPC 态度走 npcFavAdd / flag，不写「记得前世」。
  // ════════════════════════════════════════════════════════════════════

  // —— 武馆弟子（演武场的黄土）→ 再上演武场：站稳了再约战 ——
  G.define('action', {
    id: 'dh_death_zai_wuguan', name: '再上演武场', order: 14,
    desc: '一进武馆你两脚就自己扎稳了马步。上回那记把你放倒的拳、那阵散得飞快的哄笑，身体记得比脑子还清——这回你想，先站稳了再出手。',
    loc: 'wuguan', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_wuguan_dizi', nopflag: 'dhd_zai_wuguan' },
    effects: [
      { pflagSet: { id: 'dhd_zai_wuguan' } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { statAdd: { ti: 1 } },
        { log: { t: '你没急着递帖比试，先沉下心扎了半月的桩。馆里弟子看你下盘的功夫，收起了脸上那点轻慢。', style: '体' } }
      ] },
      { weight: 5, effects: [
        { tendAdd: { lianti: 2 } },
        { log: { t: '你专挑上回放倒你的那路拳法练。手腕、腰胯一一对上——你像是早知道他下一拳会落在哪。', style: '平' } }
      ] }
    ]
  });

  // —— 大师兄（三成力）→ 登门求教 / 来日再战 ——
  G.define('action', {
    id: 'dh_death_jian_dashixiong', name: '会会大师兄', order: 14,
    desc: '「我只用三成力。」这句话你记了一世。再见他收拳时连汗都不出的样子，你心口那道刻的字又烫起来——这回，你是带着备而来的。',
    loc: 'wuguan', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_dashixiong_boss', npcAlive: 'dashixiong', noflag: 'dashixiong_li_guan', nopflag: 'dhd_jian_dashixiong' },
    effects: [
      { pflagSet: { id: 'dhd_jian_dashixiong' } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { npcFavAdd: { id: 'dashixiong', n: 4 } },
        { tendAdd: { lianti: 2 } },
        { log: { t: '你放下争胜的心，反向他讨教那三段连打的门道。他愣了一下，竟也耐着性子拆给你看——他左肋那道旧伤，你看在眼里。', style: '平' } }
      ] },
      { weight: 5, effects: [
        { counterAdd: { shaqi: 1 } },
        { pflagSet: { id: 'dhd_ke_dashixiong' } },   // 已摸清第三拳破绽：再战大师兄占优
        { log: { t: '你不动声色看他喂招。前两拳是虚的，第三拳才下杀手——出手时他必抢半步，左肋旧伤就露了空门。这回你记死了。', style: '战' } }
      ] }
    ]
  });

  // —— 剑冢残灵（崖下的剑鸣）→ 再试满崖断剑：不再蛮力对劈 ——
  G.define('action', {
    id: 'dh_death_zai_canling', name: '再试满崖断剑', order: 14,
    desc: '上回逞强去试那满崖断剑，被一道残灵循着你的剑反震挑落崖下。断剑在头顶嗡嗡作响像在笑你——这回你学乖了，不拿蛮力跟它对劈。',
    loc: 'duanjianya', timeCost: 1, risk: 1,
    cond: { mem: 'mem_death_jianzhong_canling', nopflag: 'dhd_zai_canling' },
    effects: [
      { pflagSet: { id: 'dhd_zai_canling' } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { yujian: 3 } },
        { log: { t: '你不再一剑剑硬劈。你顺着那股反震的劲卸力、借力，残灵的剑气头一回没能把你掀翻——它似乎也认了你这点长进。', style: '平' } }
      ] },
      { weight: 5, effects: [
        { qi: 5 },
        { log: { t: '你在崖前站了半晌没动手，先看明白那残灵是怎么循着兵刃反震的。你劈一剑它反一记，你偏不给它借力的由头。', style: '平' } }
      ] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 三·之二、自戕之死（非战死）→ 避同死：丹毒反噬 / 突破暴毙 / 寿尽
  //   这三条死忆没有可避的「敌」，但 spec §0.6 要求「走火入魔/突破暴毙也要在死亡记忆里留下可学习的信息」，
  //   且每条死忆都得开一个避同死读取点。落点在家中（修炼/突破地）：持死忆者多一个
  //   「想起前世怎么死的」行动，真改状态（清丹毒/稳心魔/不强求突破/惜命），让下一世不再死在同一处。
  // ════════════════════════════════════════════════════════════════════

  // —— 丹毒反噬（五内如焚）→ 趁早泄毒、不再贪丹 ——
  G.define('action', {
    id: 'dh_death_xie_dandu', name: '趁早泄丹毒', order: 13,
    desc: '冲关那一刻积年药毒一齐炸开、把你从里头烧穿的滋味，你舌根还记得那缕熟悉的苦。这回你不等它攒够，趁早以汗、以针、以清水把毒往外逼。',
    loc: 'jiazhong', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_dandu', nopflag: 'dhd_xie_dandu' },
    effects: [
      { pflagSet: { id: 'dhd_xie_dandu' } },
      { counterAdd: { dandu: -8 } },
      { log: { t: '你逼出一身黑汗，舌根那缕苦淡了些。毒攒够了是丹也是火——这回你不肯再拿自己当烧穿的炉。', style: '丹' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { counterAdd: { dandu: -4 } },
        { log: { t: '你把那几味最烈的丹收进匣底，先不吃了。前世那场从里红到外的火，这一世你打算绕开。', style: '平' } }
      ] },
      { weight: 4, effects: [
        { tendAdd: { danyao: 2 } },
        { log: { t: '你照着身子里那点熟门熟路的苦，配了副解药慢慢化它。辨毒泄毒这桩事，你的手像是早就会了。', style: '平' } }
      ] }
    ]
  });

  // —— 突破失败（差半步）→ 关隘前先稳住伤与心，不强冲 ——
  G.define('action', {
    id: 'dh_death_wen_guan', name: '关前稳一稳', order: 13,
    desc: '体内那道关隘塌裂、气机奔涌把自己冲成溃堤的那一下，你记忆犹新——不是开了，是塌了。这回临关前你先把伤养透、把心定住，绝不带伤带躁去推那道门。',
    loc: 'jiazhong', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_tupo_shibai', nopflag: 'dhd_wen_guan' },
    effects: [
      { pflagSet: { id: 'dhd_wen_guan' } },
      { counterAdd: { xinmo: -6 } },
      { log: { t: '门没锁，推门的人伤未愈、心未静——前世你就栽在这上头。这回你把那口躁气压了又压，宁可慢，不肯塌。', style: '平' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { healInjury: { months: 1, severity: 1 } },
        { qi: 5 },
        { log: { t: '你把旧伤养了又养，气息匀得听不见。差的那半步，这一世你想踏踏实实补上，不再硬冲。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { counterAdd: { xinmo: -3 } },
        { log: { t: '你在蒲团上枯坐到心静如水才肯起身。手比脑子先记得那道塌掉的关——这回，你等得起。', style: '平' } }
      ] }
    ]
  });

  // —— 寿尽（灯尽）→ 趁早多走一步、不留遗憾 ——
  G.define('action', {
    id: 'dh_death_zao_xing', name: '趁早多走一步', order: 13,
    desc: '那一世你活到头发白透，坐在门槛上一闭眼没再睁开。临了那句「当年要是敢再走远一步」，像根刺扎在你心里。这回你不肯再把日子坐成一盏慢慢烧到底的灯。',
    loc: 'jiazhong', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_shouyuan', nopflag: 'dhd_zao_xing' },
    effects: [
      { pflagSet: { id: 'dhd_zao_xing' } },
      { cult: 6 },
      { log: { t: '寿数是借来的柴，烧不旺就白借。你把那点临终的悔，化成了今早多下的一分功——这回，趁早。', style: '平' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { qi: 6 },
        { log: { t: '你比从前更舍得逼自己一把。门槛外的路还长，你不想再到白头才悔没敢走远。', style: '吉' } }
      ] },
      { weight: 4, effects: [
        { tendAdd: { yinguo: 2 } },
        { log: { t: '你翻出搁置多年的念想，趁手脚还利落，先迈了出去。前世那盏安安静静烧到底的灯，这回你不点了。', style: '平' } }
      ] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 四、兜底死忆 → 「我曾来过」的迷惘（持 mem_death_generic，早期一个轻事件，似曾相识）
  //   queueOnly + 自排期：第二世起、行至青石镇老街时，一段无端的迷惘。≥1 非 log op。
  // ════════════════════════════════════════════════════════════════════

  // 触发载体：一个 loc:null 的轻行动「青石老街」——持 generic 死忆且非首世，行至镇上自然撞见。
  // 用行动而非环境事件，确保「行动级」读取点成立、且玩家主动点开（避坑/迷惘的自反性）。
  G.define('action', {
    id: 'dh_death_wo_ceng_lai', name: '青石老街', order: 4,
    desc: '镇上这条老街你头一回走，脚下却莫名熟门熟路。青石板缝里的青苔、拐角那株歪脖子槐——你说不清，就是觉得来过。',
    loc: 'qingshizhen', timeCost: 1, risk: 0,
    cond: { mem: 'mem_death_generic', life: { gte: 2 }, age: { lte: 16 }, nopflag: 'dhd_wo_ceng_lai' },
    effects: [
      { pflagSet: { id: 'dhd_wo_ceng_lai' } },
      { log: { t: '风里有股青石板的味道，你心里咯噔一下——最后那一刻闻见的，好像就是这个味。可你怎么也想不起自己是怎么死的，连那一世叫什么名字都记不清了。', style: '因果' } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { yinguo: 3 } },
        { log: { t: '你在歪脖子槐下站了好一会儿。一条走过千百遍的街、一个怎么也想不起的名字——这点迷惘，像谁悄悄替你掖在了心底。', style: '平' } }
      ] },
      { weight: 5, effects: [
        { qi: 4 },
        { insight: { id: 'wo_ceng_lai', title: '我曾来过', t: '这条街我走过，这镇子我来过。我记不起前尘，可身子比我先记得——它替我留着一点说不清的小心。' } },
        { log: { t: '你顺着那点说不清的熟络多看了两眼街角。它什么都没告诉你，又好像什么都提醒了你——往后遇着险处，留个心。', style: '因果' } }
      ] }
    ]
  });

})();
