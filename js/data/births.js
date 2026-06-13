// js/data/births.js — 出生数据（Owner: C1）。六种出身全部完整实现，开局体验六不同：
//   初始地点（黑山外围/家中/药铺/青石镇/武馆/山神庙）、银钱（2~12）、人际、行囊、线索、命签全部互异。
//
// birth schema 见契约 §11（v1.1：weight 基础抽取权重缺省10 / ageY0 初始年龄缺省12）。
//   * affinity 只在有前世 tendSeed 时放大抽取权重（见 systems/birth.js roll），第一世纯按 weight。
//   * mingqian 三签开局抽一展示；visibleClue 是给玩家的可见线索（写人话，不写机制）。
//   * earlyHooks 一律引用 ev_kaichang_<出生id>（C3 并行实现，queueOnly 开局剧情，命名勿改）。
//
// ── 本文件对外输出（他人会引用的 id）──
//   出生 id ×6（ids.js 真源）：liehu_zhizi / bingruo_guer / yaopu_xuetu / tuhu_xuetu / wuguan_zayi / miaozhu_yangzi
//   新增物品：tigu_dao（剔骨刀，屠户学徒佩刀）
//   pflag：su_ji（病弱孤儿宿疾在身，C2/C3 可写求医/恶化/续命线）
//          xianghuo_yinji（庙祝养子的香火印记，C3 庙线/邪神线、C5 庙祝对话的咬合点）
//
// ── 引用的跨文件 id ──
//   事件（C3 实现）：ev_kaichang_liehu_zhizi / ev_kaichang_bingruo_guer / ev_kaichang_yaopu_xuetu /
//                    ev_kaichang_tuhu_xuetu / ev_kaichang_wuguan_zayi / ev_kaichang_miaozhu_yangzi
//   NPC（C5 实现，ids.js 真源）：lao_liehu / yaopu_laoban / dashixiong / miaozhu
//   物品（items.js 基建）：liedao / ganliang / cubu_yi / ningxuecao / zhixuesan / fuzhi / langpi / shaodaozi / huozhezi
//
// TODO-INTEGRATION: 六个 ev_kaichang_* 由 C3 并行实现；其落地前 validate 会报 earlyHooks 引用缺失，属预期。
// TODO-INTEGRATION: npcFav 引用的 dashixiong / miaozhu 由 C5 注册；其落地前 validate 报 npc 缺失属预期，
//                   birth.js 对未注册 NPC 的 fav 会安全跳过，不致报错。
//
// ── 自检十问（对文件整体回答一次）──
// 1标签：六种出身=六种开局困境（接山活养爹 / 宿疾缠身 / 试药积毒 / 血腥沾身 / 受辱人下 / 邪庙食香火）。
// 2易共现：各自亲和的地点与人（黑山旧道/老屋病榻/回春堂/肉案/铁脊武馆/山神庙），开局即落在亲和点上。
// 3排斥：彼此互斥（一世只生一种）；穷出身排斥富开局，安稳出身排斥浓机缘（庙祝养子反之）。
// 4改状态：属性/银钱/物品/npcFav/倾向种子/counters 底色（丹毒3·血腥4·心魔3）/pflag/开局钩子事件。
// 5后果：earlyHooks 第1月剧情定调；负好感的大师兄、宿疾、香火印记都是日后事件的火种。
// 6可解释：每条数值长在身世里——屠户子壮、病孤神识高带恙、药徒带毒底子、杂役耐打心头憋气。
// 7钩子：su_ji、xianghuo_yinji、柜底药格、倒插的第二炷香、雪红莫上山——全是给 C2~C5 的咬合点。
// 8有趣选择：生在险地（山神庙/黑山口）换浓机缘，生在镇里换人脉银钱；穷病开局赌的是那些梦。
// 9服务 build：affinity 与 startEffects 的 tendAdd 把六出身分别喂向五道（猎户/屠户→血剑炼体，
//   病孤→因果丹药，药徒→丹药，杂役→炼体，庙子→因果雷法），但不锁死，行为仍可改道。
// 10不暴露：可见文案（desc/visibleClue/mingqian/traits）只谈命与活法，无道名、无倾向、无数值机制词。
(function () {
  'use strict';

  // ════════ 本文件新增物品 ════════
  G.define('item', {
    id: 'tigu_dao', name: '剔骨刀', type: 'weapon', atk: 4, price: 10,
    desc: '师父用旧的剔骨短刀，刃薄而韧，认得骨缝。'
  });

  // ════════ 猎户之子 ════════
  // 困境：爹的腿坏在山里，猎屋扎在上山道口——山里的活计和炕头的药钱，一起压上你的肩。
  // 资源：六出身里唯一开局就在野外的；有刀、有皮子、有一身山里本事和爹换命攒下的人望。
  G.define('birth', {
    id: 'liehu_zhizi',
    name: '猎户之子',
    desc: '爹是黑山脚下最后一个老猎户，猎屋就扎在上山道口。你五岁认兽踪，八岁拉满弓，十二岁那年，爹的腿坏在了山里。如今药罐子在炕头咕嘟，山里的活计，该有人接了。',
    weight: 10,
    startLoc: 'heishan_waiwei',
    ageY0: 12,
    money: 10,
    statsBase: { li: 4, ti: 3, min: 3, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'liedao', n: 1 }, { id: 'ganliang', n: 2 }, { id: 'langpi', n: 1 }],
    npcFav: { lao_liehu: 15 },
    traits: ['识兽踪'],
    visibleClue: '爹常说：黑山的雪一红，就不要再上山了。',
    affinity: { xuejian: 1.3, lianti: 1.2 },
    mingqian: [
      '命签·下下：血浸雪线，慎冬。',
      '命签·中平：兽走旧道，人循旧辙。',
      '命签·上上：刃上开花。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_liehu_zhizi', months: 1 }],
    startEffects: [
      { tendAdd: { xuejian: 2 } },      // 自小摸刀放血，手上有数
      { counterAdd: { xuexing: 2 } }    // 剥皮起肉沾下的味，山里东西闻得见
    ]
  });

  // ════════ 病弱孤儿 ════════
  // 困境：底子最薄（开局带恙、宿疾在身、心头有怯）、钱最少（两枚铜板）；
  //        换来的是一间能做梦的老屋，和那些不属于这一世的梦。
  G.define('birth', {
    id: 'bingruo_guer',
    name: '病弱孤儿',
    desc: '你不记得爹娘的样子。他们留给你的，只有镇梢一间漏风的老屋，和一场烧了三天三夜的大病。病好之后，你常做些古怪的梦；镇上人背地里说，这孩子怕是养不大。',
    weight: 8,
    startLoc: 'jiazhong',
    ageY0: 12,
    money: 2,
    statsBase: { li: 2, ti: 2, min: 3, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'cubu_yi', n: 1 }, { id: 'ganliang', n: 1 }],
    npcFav: { miaozhu: 6, yaopu_laoban: 3 },   // 庙祝施过粥饭；回春堂掌柜赊过两副药
    traits: ['病骨', '多梦'],
    visibleClue: '烧得最厉害那晚，你梦里有人在很远的地方喊你的名字——不是现在这个名字。',
    affinity: { yinguo: 1.4, danyao: 1.2 },
    mingqian: [
      '命签·下下：灯芯将尽，借风续之；风里有债。',
      '命签·中平：旧债未清，新账莫欠。',
      '命签·上上：死过一回的人，命硬。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_bingruo_guer', months: 1 }],
    startEffects: [
      { tendAdd: { yinguo: 5 } },
      { pflagSet: { id: 'su_ji' } },    // 宿疾在身：C2/C3 的求医/恶化/续命钩子
      { hp: -14 },                      // 开局带恙，气血不满
      { counterAdd: { xinmo: 3 } }      // 久病之人，心头有怯
    ]
  });

  // ════════ 药铺学徒 ════════
  // 困境：是药三分毒——替师父试了几年药，毒底子已经悄悄落下了；柜底那格不许问的药，迟早要问。
  // 资源：银钱最宽裕、有药材傍身、有掌柜的器重，离百草和那半页不能说的东西最近。
  G.define('birth', {
    id: 'yaopu_xuetu',
    name: '药铺学徒',
    desc: '十岁那年你被卖进回春堂当学徒。碾药、看炉、试药——苦的咸的毒的，都先过你的舌头。掌柜的说你这条舌头金贵，比戥子还准。',
    weight: 10,
    startLoc: 'yaopu',
    ageY0: 12,
    money: 12,
    statsBase: { li: 2, ti: 3, min: 3, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'ningxuecao', n: 2 }, { id: 'zhixuesan', n: 1 }],
    npcFav: { yaopu_laoban: 15 },
    traits: ['辨百草'],
    visibleClue: '师父有条死规矩：柜底最后一格的药，谁来问，都说没有。',
    affinity: { danyao: 1.5, yinguo: 1.1 },
    mingqian: [
      '命签·下下：尝百草者，先死于草。',
      '命签·中平：照方抓药，按部就班。',
      '命签·上上：死灰里捂着一粒活丹。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_yaopu_xuetu', months: 1 }],
    startEffects: [
      { tendAdd: { danyao: 4 } },
      { counterAdd: { dandu: 3 } }      // 经年试药落下的毒底子
    ]
  });

  // ════════ 屠户学徒 ════════
  // 困境：一身洗不掉的血腥味——夜路上，有鼻子的东西都闻得见你；刀下亡魂，也都记着你。
  // 资源：六出身里身板最壮，有刀有酒有镇上人脉，肉案上学来的手上功夫不输武馆。
  G.define('birth', {
    id: 'tuhu_xuetu',
    name: '屠户学徒',
    desc: '师父是镇上唯一的屠户，你十岁起跟他学刀。他教你的第一件事不是下刀，是听——肉里的筋路骨缝，都在刀尖上说话。',
    weight: 10,
    startLoc: 'qingshizhen',
    ageY0: 12,
    money: 8,
    statsBase: { li: 4, ti: 4, min: 2, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'tigu_dao', n: 1 }, { id: 'ganliang', n: 1 }, { id: 'shaodaozi', n: 1 }],
    npcFav: { lao_liehu: 6 },           // 肉案常年收老猎户的山货，两家有交情
    traits: ['手稳', '不怕血'],
    visibleClue: '师父杀猪从不看猪的眼睛。他说看了，刀就钝了。',
    affinity: { xuejian: 1.3, lianti: 1.25 },
    mingqian: [
      '命签·下下：刀下亡魂挤挤挨挨，都在等你回头。',
      '命签·中平：一把刀养活一家，莫问刀外事。',
      '命签·上上：千刀万剐里，剐出个金刚不坏。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_tuhu_xuetu', months: 1 }],
    startEffects: [
      { tendAdd: { lianti: 2, xuejian: 2 } },
      { counterAdd: { xuexing: 4, shaqi: 2 } }   // 肉案上沾来的血腥味，和一缕化不开的杀性
    ]
  });

  // ════════ 武馆杂役 ════════
  // 困境：人下之人——扫了三年地没摸过拳谱，馆里谁都能支使你、作践你；大师兄眼里你不如一块练功石。
  // 资源：几乎一无所有，只有挨打挨出来的筋骨，和心口那股压不灭的气。
  G.define('birth', {
    id: 'wuguan_zayi',
    name: '武馆杂役',
    desc: '你在铁脊武馆扫了三年地。拳谱挂在墙上，没人教过你一个字；可挨打不用人教——馆里上下，谁都能支使你两下。',
    weight: 10,
    startLoc: 'wuguan',
    ageY0: 12,
    money: 5,
    statsBase: { li: 3, ti: 4, min: 3, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'cubu_yi', n: 1 }, { id: 'ganliang', n: 2 }],
    npcFav: { dashixiong: -8 },         // 大师兄眼里，你连块练功石都不如
    traits: ['耐打'],
    visibleClue: '看门的老头嚼着烟丝说：馆里的真功夫不在拳谱上，在挨的打里。',
    affinity: { lianti: 1.4, yinguo: 1.1 },
    mingqian: [
      '命签·下下：人下之人，命如门槛，人人踏得。',
      '命签·中平：扫地三年，腰背自直。',
      '命签·上上：忍字头上一把刀，拔出来便是出鞘。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_wuguan_zayi', months: 1 }],   // 开局受辱（C3）
    startEffects: [
      { tendAdd: { lianti: 4 } },
      { counterAdd: { xinmo: 3 } }      // 憋在心口的那股气
    ]
  });

  // ════════ 庙祝养子 ════════
  // 困境：生在邪庙，香火喂大——吃下去的香火，迟早是要还的；后殿那扇门，迟早要开。
  // 资源：识文断字、离阴邪与机缘都最近；养父的疼爱，是这座庙里唯一干净的东西。
  G.define('birth', {
    id: 'miaozhu_yangzi',
    name: '庙祝养子',
    desc: '你是庙祝从雪地里捡回来的，在山神庙吃百家香火长大。养父教你认字、扫殿、添香，唯独神像身后那间小屋，他从不许你进。',
    weight: 10,
    startLoc: 'shanshenmiao',
    ageY0: 12,
    money: 6,
    statsBase: { li: 2, ti: 2, min: 4, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'fuzhi', n: 2 }, { id: 'ganliang', n: 1 }, { id: 'huozhezi', n: 1 }],
    npcFav: { miaozhu: 20 },
    traits: ['识文断字', '不惧夜'],
    visibleClue: '养父每夜都给神像上第二炷香。那炷香，从来不许你碰。',
    affinity: { yinguo: 1.35, leifa: 1.2 },
    mingqian: [
      '命签·下下：吃了香火的，迟早要还愿。',
      '命签·中平：晨钟暮鼓，扫叶添香。',
      '命签·上上：神前长大的孩子，鬼也让三分。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_miaozhu_yangzi', months: 1 }],
    startEffects: [
      { tendAdd: { yinguo: 4 } },
      { pflagSet: { id: 'xianghuo_yinji' } }   // 香火印记：C3 庙线/邪神线、C5 庙祝对话的咬合点
    ]
  });
})();
