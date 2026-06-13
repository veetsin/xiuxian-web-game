// js/data/births.js — 出生数据（Owner: C1）。v2 扩展：6 → 18 种出身（+12），开局体验十八不同。
//   三轴各异（蓝图 §4 核心要求）：属性(statsBase) × 道途(主 affinity) × 时间(startMonth 季节 + lifespanMod 寿元)。
//   开局即落在亲和地点：青石镇/黑山/药铺/武馆/山神庙 + v2 八新地（寒潭/断剑崖/狐婆坳/乱葬岗/义庄/驿马关/后山兽径/河神渡）。
//
// birth schema 见契约 §11（v1.1：weight/ageY0；v2：startMonth 1-12 决定开局季节天时 / lifespanMod 先天寿元增减）。
//   * affinity 只在有前世 tendSeed 时放大抽取权重（见 systems/birth.js roll），第一世纯按 weight。
//   * mingqian 三签开局抽一展示；visibleClue 是给玩家的可见线索（写人话，不写机制）。
//   * earlyHooks 一律引用 ev_kaichang_<出生id>（C3 并行实现，queueOnly 开局剧情，命名勿改）。
//   * startMonth 把出身绑死季节进而绑道：寒/葬/夜生于冬，狐/货生于夏，剑/愿生于春，渔/兽/武生于秋（蓝图 §4 时间轴）。
//
// ── 本文件对外输出（他人会引用的 id）──
//   出生 id ×18（ids.js 真源）。v1：liehu_zhizi / bingruo_guer / yaopu_xuetu / tuhu_xuetu / wuguan_zayi / miaozhu_yangzi
//     v2 +12：yujia_nü / juemu_zi / huyang_er / zhujian_tu / caibing_ren / xunshou_ren /
//             youfang_lang / huolang_zi / huanyuan_er / xiban_qi / gengfu_zi / wuxue_guer
//   新增物品（本文件 G.define）：
//     v1：tigu_dao（剔骨刀）
//     v2：yugang_cha（渔叉）/ luogu_chan（捞骨铲）/ canjian（半截断剑）/ bingzhui（冰镩）/ xunying_shao（驯鹰哨）/
//         yaolu（药篓）/ huolang_dan（货郎担）/ banbu_jianpu（半部剑诀·消耗品）/ xiban_mianju（戏班面具）/ gengluo（更锣）
//   pflag（v1）：su_ji（病弱孤儿宿疾）/ xianghuo_yinji（庙祝养子香火印记）
//   pflag（v2，给 C2/C3/C5 的咬合点，下方各出生注释处说明读取预期）：
//     hangu_rugu（采冰人寒气入骨）/ huyang_xin（狐养儿狐心难辨）/ yinzhai（掘墓子阴债缠身）/
//     huanyuan_zhai（还愿人家香火宿债）/ tongshou_xing（驯兽人通兽性）/ jianlu_qichu（铸剑徒剑庐弃徒身份）
//
// ── 引用的跨文件 id（均在蓝图钉死表内）──
//   事件（C3 实现，蓝图 §6）：ev_kaichang_<出生id> ×18，含 v2 十二个 ev_kaichang_yujia_nü … ev_kaichang_wuxue_guer。
//   NPC（C5 实现，ids.js 真源）：lao_liehu / yaopu_laoban / dashixiong / miaozhu /
//     hupo / zhujian_weng / heshen_po / shihai_zhe / youyi_lang / shuoshu_ren
//   地点（C2 实现，ids.js 真源）：v2 八新地点全部用作 startLoc。
//   物品（items.js 基建）：liedao / ganliang / cubu_yi / ningxuecao / zhixuesan / fuzhi / langpi / shaodaozi / huozhezi
//   道途（C4 实现，ids.js 真源）：affinity 引用 handu / shouhun / xianghuo / humei / yujian（v2 五新道）。
//
// TODO-INTEGRATION: 十八个 ev_kaichang_* 由 C3 实现；八新 startLoc 由 C2 实现；六新 NPC 的 fav 由 C5 实现——
//                   其落地前 validate 会报 earlyHooks/startLoc/npc 引用缺失，属并行预期。birth.js 对未注册
//                   NPC 的 fav 安全跳过；对未注册 startLoc 退回 qingshizhen 不致报错（见 systems/birth.js apply）。
//
// ── 自检十问（对文件整体回答一次）──
// 1标签：十八种出身=十八种开局困境与活法（接山活/宿疾/试药/血腥/受辱/食香火 + 河上讨生/替人掘骨/狐窝长大/
//   剑庐弃徒/寒潭采冰/兽栏驯鹰/随师走方/商队杂工/世代还愿/戏班拾儿/守夜打更/剑术遗孤）。
// 2易共现：各自亲和的地点与人，开局即落在亲和点上（v2 出生绑 v2 新地与新 NPC）。
// 3排斥：彼此互斥（一世只生一种）；季节互锁（寒冰子不会生在盛夏，雷法子不会生在隆冬）；穷/富、安稳/险地各成一极。
// 4改状态：属性/银钱/物品/npcFav/倾向种子(tendAdd 喂主道)/counters 底色/pflag/startMonth 季节/lifespanMod 寿元/开局钩子。
// 5后果：earlyHooks 第1月剧情定调；各 pflag（宿疾/阴债/寒气/狐心/香火债/通兽性/剑庐身份）都是日后事件的火种。
// 6可解释：每条数值长在身世里——采冰人耐寒淬体故寿增、掘墓子沾阴债故寿减、渔家女河上身法好、铸剑徒臂力准头足。
// 7钩子：所有 pflag 与 visibleClue 都在下方各出生注释里标明给谁读、读来做什么。
// 8有趣选择：三轴交叉出选择空间——同样想走御剑，是生在春日剑庐当弃徒（zhujian_tu），还是秋日武学遗孤承半部剑诀（wuxue_guer）。
// 9服务 build：affinity 与 startEffects 的 tendAdd 把十八出身分喂十道（含 v2 五新道：寒冰/兽魂/香火/狐魅/御剑），但不锁死。
// 10不暴露：可见文案（desc/visibleClue/mingqian/traits）只谈命与活法，无道名、无倾向、无数值机制词。
(function () {
  'use strict';

  // ════════ 本文件新增物品 ════════
  // v1
  G.define('item', {
    id: 'tigu_dao', name: '剔骨刀', type: 'weapon', atk: 4, price: 10,
    desc: '师父用旧的剔骨短刀，刃薄而韧，认得骨缝。'
  });
  // v2 出生佩物（武器/工具/消耗）。每件都有去处：武器自动佩戴，工具供 C2 地点行动作门槛/材料，
  // 消耗品行囊可用。售卖点统一走市集（任何 material/misc/weapon 引擎默认可在镇市变卖）。
  G.define('item', {
    id: 'yugang_cha', name: '渔叉', type: 'weapon', atk: 4, price: 10,
    desc: '三股倒钩的旧渔叉，扎鱼也扎水里说不清的东西。'
  });
  G.define('item', {
    id: 'luogu_chan', name: '捞骨铲', type: 'weapon', atk: 4, price: 8,
    desc: '掘墓收骸用的窄刃铲，铲过的土比谁都凉。'
  });
  G.define('item', {
    id: 'canjian', name: '半截断剑', type: 'weapon', atk: 5, price: 14,
    desc: '剑庐挑剩的废剑，齐根断了半截，握柄处却还认得手。'
  });
  G.define('item', {
    id: 'bingzhui', name: '冰镩', type: 'weapon', atk: 4, price: 9,
    desc: '凿寒潭冰层的长钎，钎尖常年挂着一层化不开的白霜。'
  });
  G.define('item', {
    id: 'xunying_shao', name: '驯鹰哨', type: 'misc', price: 8,
    desc: '兽骨削的尖哨，一声唿哨，半山的飞禽走兽都竖起耳朵。'
  });
  G.define('item', {
    id: 'yaolu', name: '药篓', type: 'misc', price: 6,
    desc: '游方郎中背的旧竹篓，分着上百个小格，每格一味药一段脾性。'
  });
  G.define('item', {
    id: 'huolang_dan', name: '货郎担', type: 'misc', price: 12,
    desc: '一头针头线脑、一头糖人拨浪鼓的挑担，走村串巷的本钱。'
  });
  G.define('item', {
    id: 'banbu_jianpu', name: '半部剑诀', type: 'consumable', price: 40,
    desc: '没落剑术世家传下的半部剑诀，纸页焦脆，招式只剩前半。',
    // 翻读半部剑诀：补一点根基，喂御剑底子（去处：行囊使用）。
    use: [{ cult: 8 }, { tendAdd: { yujian: 4 } },
          { log: { t: '你照着残页比划，半招过后再无下文——空处却隐隐有锋。', style: '平' } }]
  });
  G.define('item', {
    id: 'xiban_mianju', name: '戏班面具', type: 'misc', price: 5,
    desc: '戏班拾来的旧傩面，戴上它，你就不是你了——哄人也好，藏脸也好。'
  });
  G.define('item', {
    id: 'gengluo', name: '更锣', type: 'misc', price: 4,
    desc: '守夜打更的铜锣，敲过半生长夜，锣面磨得发亮。'
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

  // ════════════════════════ v2 新增 12 出生（三轴：属性 × 道途 × 时间）════════════════════════

  // ════════ 渔家女（秋·河神渡）════════
  // 三轴：身法/神识 × 香火(handu 辅) × 秋(8月)。困境：河上讨生，河神渡的水与香火都缠着她。
  G.define('birth', {
    id: 'yujia_nü',
    name: '渔家女',
    desc: '娘走得早，你跟着爹在河神渡撒网摸鱼，半个身子泡在水里长大。渡口的河婆说你水性好得不像人，又说，水好的人，最该敬着这条河。',
    weight: 9,
    startLoc: 'heshen_du',
    ageY0: 13,
    startMonth: 8,           // 秋汛，鱼肥水浑
    lifespanMod: 0,
    money: 6,
    statsBase: { li: 2, ti: 3, min: 4, shen: 3 },
    statsFloat: 1,
    items: [{ id: 'yugang_cha', n: 1 }, { id: 'ganliang', n: 2 }],
    npcFav: { heshen_po: 14 },   // 河婆看着她长大
    traits: ['识水性', '会泅渡'],
    visibleClue: '河婆教你：船过渡口中心那道暗流，要先朝水里抛把米——那是给河里那位的。',
    affinity: { xianghuo: 1.35, handu: 1.15 },
    mingqian: [
      '命签·下下：水里有手，莫贪深处的鱼。',
      '命签·中平：撒网收网，看天看潮。',
      '命签·上上：献过香火的人，水也让她三分。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_yujia_nü', months: 1 }],
    startEffects: [
      { tendAdd: { xianghuo: 3 } },   // 自幼敬河神、抛米还愿，香火底子
      { statAdd: { min: 1 } }          // 水里讨生，身法活
    ]
  });

  // ════════ 掘墓子（冬·乱葬岗）════════
  // 三轴：体魄/神识 × 因果(xianghuo 辅) × 冬(11月)。困境：替人掘墓收骸，沾一身阴与梦债，先天折寿。
  G.define('birth', {
    id: 'juemu_zi',
    name: '掘墓子',
    desc: '你家三代替乱葬岗收无主的骸骨，挣几个埋人的辛苦钱。爹临死攥着你的手说：埋人的人，自己的命也埋进去半截——少沾些，听见没。',
    weight: 8,
    startLoc: 'luanzang_gang',
    ageY0: 13,
    startMonth: 11,          // 寒冬，土硬，夜长，阴气最重
    lifespanMod: -3,         // 阴债缠身，先天折寿
    money: 4,
    statsBase: { li: 3, ti: 4, min: 2, shen: 3 },
    statsFloat: 1,
    items: [{ id: 'luogu_chan', n: 1 }, { id: 'ganliang', n: 1 }, { id: 'fuzhi', n: 1 }],
    npcFav: { shihai_zhe: 12 },   // 拾骸老者是同行前辈
    traits: ['不惧尸', '夜眼'],
    visibleClue: '拾骸老者说：收骨头别图省事翻面，脸朝下埋的，是不愿被人记得的——记住它，它就缠上你。',
    affinity: { yinguo: 1.3, xianghuo: 1.2 },
    mingqian: [
      '命签·下下：埋人者，半身已在土里。',
      '命签·中平：一锹一镐，挣的是阴间的工钱。',
      '命签·上上：替死人安身，活人替你挡灾。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_juemu_zi', months: 1 }],
    startEffects: [
      { tendAdd: { yinguo: 5 } },
      { pflagSet: { id: 'yinzhai' } },   // 阴债缠身：C3 乱葬/梦债线、C5 拾骸老者对话的咬合点（夜出遇厉鬼预警门槛）
      { counterAdd: { xinmo: 2 } }       // 见多死人，心头压着东西
    ]
  });

  // ════════ 狐养儿（夏·狐婆坳）════════
  // 三轴：身法/神识高 × 狐魅(yinguo 辅) × 夏(6月)。困境：被狐婆养大，分不清人狐。
  G.define('birth', {
    id: 'huyang_er',
    name: '狐养儿',
    desc: '你不记得亲娘，只记得狐婆坳里那个总在月下梳头的婆婆。她喂你、哄你、教你说话，却从不许你照水里的影子。镇上人见了你都绕道走，背后叫你「狐崽子」。',
    weight: 7,
    startLoc: 'hupo_ao',
    ageY0: 13,
    startMonth: 6,           // 仲夏，月夜长，狐祟盛
    lifespanMod: 0,
    money: 5,
    statsBase: { li: 2, ti: 2, min: 4, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'cubu_yi', n: 1 }, { id: 'ganliang', n: 1 }],
    npcFav: { hupo: 22 },
    traits: ['媚眼', '通灵窍'],
    visibleClue: '狐婆叮嘱过你一句怪话：心动了就照水，心不动，连水里的影子都骗你。',
    affinity: { humei: 1.4, yinguo: 1.1 },
    mingqian: [
      '命签·下下：人面狐心，照水即迷。',
      '命签·中平：是人是狐，全在一念。',
      '命签·上上：狐婆坳里养出的，鬼也哄得动。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_huyang_er', months: 1 }],
    startEffects: [
      { tendAdd: { humei: 4 } },
      { pflagSet: { id: 'huyang_xin' } },   // 狐心难辨：C3 狐祟/老狐仙线、C5 狐婆对话的咬合点
      { statAdd: { shen: 1 } }
    ]
  });

  // ════════ 铸剑徒（春·断剑崖）════════
  // 三轴：膂力/身法 × 御剑(xuejian 辅) × 春(2月)。困境：剑庐弃徒，断剑崖下听剑。
  G.define('birth', {
    id: 'zhujian_tu',
    name: '铸剑徒',
    desc: '你在剑庐学锻剑，淬了三年火，老师傅却嫌你心太软，铸不出杀气，把你撵下了山。临走他指着断剑崖说：你听得见剑哭，迟早是它们认你，不是你认它们。',
    weight: 9,
    startLoc: 'duanjianya',
    ageY0: 14,
    startMonth: 2,           // 初春，山涧解冻，崖下水声起
    lifespanMod: 0,
    money: 7,
    statsBase: { li: 4, ti: 3, min: 4, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'canjian', n: 1 }, { id: 'ganliang', n: 2 }],
    npcFav: { zhujian_weng: 16 },   // 铸剑老人收留这个弃徒
    traits: ['手准', '听剑'],
    visibleClue: '铸剑老人说：崖上那些断剑都朝着一个方向断的——什么时候你听出它们在喊谁，就该上去了。',
    affinity: { yujian: 1.4, xuejian: 1.15 },
    mingqian: [
      '命签·下下：心太软的人，铸不出快剑，先死在自己剑下。',
      '命签·中平：千锤百炼，先炼脾性。',
      '命签·上上：断剑也认主——崖上那些，都在等你。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_zhujian_tu', months: 1 }],
    startEffects: [
      { tendAdd: { yujian: 4 } },
      { pflagSet: { id: 'jianlu_qichu' } }   // 剑庐弃徒身份：C3 剑冢线、C5 铸剑老人对话/赠剑诀的咬合点
    ]
  });

  // ════════ 采冰人（冬·寒潭）════════
  // 三轴：体魄/膂力 × 寒冰(lianti 辅) × 冬(12月)。困境：寒潭采冰，寒气入骨却也淬体，先天耐寒增寿。
  G.define('birth', {
    id: 'caibing_ren',
    name: '采冰人',
    desc: '入了腊月，你便和几个壮汉去寒潭凿冰，一块块拖回镇上窖藏，供来年夏天镇上的冰碗冰镇。寒潭的水蓝得发邪，老人说潭底压着东西，凿冰时千万别凿太深。',
    weight: 9,
    startLoc: 'hantan',
    ageY0: 14,
    startMonth: 12,          // 隆冬，寒潭结冰，正是采冰时令
    lifespanMod: 3,          // 长年耐寒淬体，根骨壮、底子厚，增寿
    money: 7,
    statsBase: { li: 4, ti: 4, min: 2, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'bingzhui', n: 1 }, { id: 'ganliang', n: 2 }, { id: 'shaodaozi', n: 1 }],
    npcFav: { lao_liehu: 5 },   // 寒潭近黑山，与老猎户在山口照过面
    traits: ['耐寒', '臂力沉'],
    visibleClue: '把头叮嘱：寒潭中心那块冰最厚最蓝，谁也别去凿——蓝得发邪的冰底下，有不肯睡的东西。',
    affinity: { handu: 1.4, lianti: 1.15 },
    mingqian: [
      '命签·下下：凿冰莫贪深，潭心那块冰，是它的眼皮。',
      '命签·中平：一身寒气一身力，冷年壮年。',
      '命签·上上：寒入了骨，冻不死的人，火也烧不化。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_caibing_ren', months: 1 }],
    startEffects: [
      { tendAdd: { handu: 4 } },          // 寒气日日入骨，寒冰底子
      { pflagSet: { id: 'hangu_rugu' } }, // 寒气入骨：C2 寒潭采冰行动、C3 寒雾/寒蛟线的咬合点（御寒/辨寒门槛）
      { counterAdd: { xuexing: 0 } }      // 占位无负担：采冰人不沾血腥
    ]
  });

  // ════════ 驯兽人（秋·后山兽径）════════
  // 三轴：膂力/身法 × 兽魂(xuejian 辅) × 秋(9月)。困境：黑山兽栏养兽驯鹰，通兽性。
  G.define('birth', {
    id: 'xunshou_ren',
    name: '驯兽人',
    desc: '你家在后山兽径边搭了兽栏，养鹰、驯犬、收受伤的山货卖给镇上。你打小睡在兽堆里，听得懂它们哪声是饿、哪声是怕、哪声是要咬人。爹说，通兽性是本事，也是引祸的钩子。',
    weight: 9,
    startLoc: 'houshan_lin',
    ageY0: 14,
    startMonth: 9,           // 深秋，兽肥膘足，也是兽群躁动下山时
    lifespanMod: 0,
    money: 6,
    statsBase: { li: 4, ti: 3, min: 4, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'xunying_shao', n: 1 }, { id: 'liedao', n: 1 }, { id: 'ganliang', n: 1 }],
    npcFav: { lao_liehu: 12 },   // 同在黑山讨生，老猎户与驯兽人家是熟识
    traits: ['通兽性', '识鹰'],
    visibleClue: '爹反复讲：后山深处兽群忽然齐齐噤声的时候，不是太平，是兽王醒了——掉头就走。',
    affinity: { shouhun: 1.4, xuejian: 1.1 },
    mingqian: [
      '命签·下下：通兽性者，终被兽性反噬。',
      '命签·中平：一栏鹰犬，半山耳目。',
      '命签·上上：群兽之主，也认得唤它的人。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_xunshou_ren', months: 1 }],
    startEffects: [
      { tendAdd: { shouhun: 4 } },
      { pflagSet: { id: 'tongshou_xing' } }   // 通兽性：C2 后山驭兽/识踪行动、C3 兽群事件、C4 兽王战的咬合点
    ]
  });

  // ════════ 游方郎中徒（夏·青石镇）════════
  // 三轴：神识/身法 × 丹药(handu 辅) × 夏(5月)。困境：随师走方，识药也识寒毒。
  G.define('birth', {
    id: 'youfang_lang',
    name: '游方郎中徒',
    desc: '你师父是个走方的郎中，背一只药篓游村串镇，今天在这镇，明天在那关。你跟他认了五年药，也认全了人——谁家有隐疾，谁家欠着药钱，谁家的病是装的。',
    weight: 10,
    startLoc: 'qingshizhen',
    ageY0: 14,
    startMonth: 5,           // 初夏，草木盛，采药走方的好时令
    lifespanMod: 0,
    money: 8,
    statsBase: { li: 2, ti: 3, min: 4, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'yaolu', n: 1 }, { id: 'ningxuecao', n: 2 }, { id: 'ganliang', n: 1 }],
    npcFav: { youyi_lang: 16, yaopu_laoban: 5 },   // 游方郎中是师父；与坐堂的回春堂掌柜有同行之谊
    traits: ['辨百草', '识脉'],
    visibleClue: '师父教过你一手：寒毒入体，脉象沉伏如冰下水——这手别处学不来，是他在寒潭边吃过亏换的。',
    affinity: { danyao: 1.35, handu: 1.15 },
    mingqian: [
      '命签·下下：医得了别人，医不了自家。',
      '命签·中平：一篓草药，半世风尘。',
      '命签·上上：寒毒奇症入了你的眼，便成了你的方。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_youfang_lang', months: 1 }],
    startEffects: [
      { tendAdd: { danyao: 4 } },
      { counterAdd: { dandu: 2 } }   // 随师尝药验毒，落下浅浅毒底
    ]
  });

  // ════════ 货郎子（夏·驿马关）════════
  // 三轴：身法/体魄 × 因果/狐魅双辅 × 夏(4月)。开局银钱高。困境：商队杂工，眼利嘴活走官道。
  G.define('birth', {
    id: 'huolang_zi',
    name: '货郎子',
    desc: '你爹是驿马关上的老货郎，挑着担子走南闯北，你从小跟着摇拨浪鼓、记账目、看人脸色。爹说：货郎不靠力气靠眼力——东西的好歹、人心的虚实，一眼要看个八九分。',
    weight: 10,
    startLoc: 'yima_guan',
    ageY0: 14,
    startMonth: 4,           // 初夏，商旅往来最盛，赶集的好时节
    lifespanMod: 0,
    money: 18,               // 商家底子，开局银钱最宽
    statsBase: { li: 3, ti: 3, min: 4, shen: 3 },
    statsFloat: 1,
    items: [{ id: 'huolang_dan', n: 1 }, { id: 'ganliang', n: 2 }, { id: 'shaodaozi', n: 1 }],
    npcFav: { youyi_lang: 8, shuoshu_ren: 6 },   // 走官道认得游方郎中与说书人
    traits: ['眼利', '会还价'],
    visibleClue: '爹的生意经：货郎担两头压秤，少了哪头都翻车——人也一样，太实诚的，活不长。',
    affinity: { yinguo: 1.15, humei: 1.15 },
    mingqian: [
      '命签·下下：走江湖的，钱多命短。',
      '命签·中平：货真价实，童叟无欺。',
      '命签·上上：一张嘴走遍天下，连鬼都赊你的账。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_huolang_zi', months: 1 }],
    startEffects: [
      { tendAdd: { humei: 2, yinguo: 2 } },   // 走方看人、说话哄人，两道底色各浅喂一点
      { statAdd: { min: 1 } }
    ]
  });

  // ════════ 还愿人家的孩子（春·山神庙）════════
  // 三轴：神识/身法 × 香火(yinguo 辅) × 春(1月)。困境：家中世代还愿，香火缠身。
  G.define('birth', {
    id: 'huanyuan_er',
    name: '还愿人家的孩子',
    desc: '你家世代在山神庙还愿——祖上许过一桩大愿，求来一脉香火不绝，代价是子子孙孙都得替这桩愿添香守诺。你打小被抱去庙里磕头，香灰落了一身，洗也洗不净。',
    weight: 9,
    startLoc: 'shanshenmiao',
    ageY0: 13,
    startMonth: 1,           // 正月，上香还愿、庙会最盛的时节
    lifespanMod: 0,
    money: 6,
    statsBase: { li: 2, ti: 3, min: 3, shen: 4 },
    statsFloat: 1,
    items: [{ id: 'fuzhi', n: 3 }, { id: 'ganliang', n: 1 }, { id: 'huozhezi', n: 1 }],
    npcFav: { miaozhu: 12, heshen_po: 4 },   // 庙祝看着还愿人家长大；河神渡的河婆也是敬香火的同道
    traits: ['识文断字', '通香火'],
    visibleClue: '祖训刻在你心里：愿是借的，香火是利钱——年年添、代代守，断一年，那位就来收本。',
    affinity: { xianghuo: 1.4, yinguo: 1.1 },
    mingqian: [
      '命签·下下：祖上欠的愿，要儿孙的命来还。',
      '命签·中平：晨昏一炷香，守的是祖宗的诺。',
      '命签·上上：还得清的愿，换得来神佛照拂。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_huanyuan_er', months: 1 }],
    startEffects: [
      { tendAdd: { xianghuo: 5 } },
      { pflagSet: { id: 'huanyuan_zhai' } }   // 香火宿债：C3 还愿/河神/邪神线、C5 庙祝/河婆对话的咬合点
    ]
  });

  // ════════ 戏班弃儿（秋·青石镇）════════
  // 三轴：身法/神识 × 狐魅(yinguo 辅) × 秋(7月)。困境：戏班拾来的，会唱会演会哄人。
  G.define('birth', {
    id: 'xiban_qi',
    name: '戏班弃儿',
    desc: '你是草台戏班在庙会上拾来的弃婴，班主见你嗓子能唱便留下了。台上你扮过千百张脸——书生、小姐、判官、鬼差。台下你最清楚一件事：戏假，看戏的人哭笑也假，唯独赏钱是真的。',
    weight: 8,
    startLoc: 'qingshizhen',
    ageY0: 14,
    startMonth: 7,           // 初秋，庙会戏台最多的赶场时节
    lifespanMod: 0,
    money: 7,
    statsBase: { li: 2, ti: 3, min: 4, shen: 3 },
    statsFloat: 1,
    items: [{ id: 'xiban_mianju', n: 1 }, { id: 'cubu_yi', n: 1 }, { id: 'ganliang', n: 1 }],
    npcFav: { shuoshu_ren: 14 },   // 同是靠嘴吃饭的，说书人惜才
    traits: ['百变脸', '会哄人'],
    visibleClue: '班主醉后吐真言：戏台上扮多了别人，自己是谁就忘了——记着，卸了妆要认得镜子里那张脸。',
    affinity: { humei: 1.3, yinguo: 1.15 },
    mingqian: [
      '命签·下下：扮谁久了，就成了谁的替死鬼。',
      '命签·中平：一张戏脸，混口饭吃。',
      '命签·上上：能哄活人，也能哄死鬼。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_xiban_qi', months: 1 }],
    startEffects: [
      { tendAdd: { humei: 4 } },
      { statAdd: { min: 1 } }
    ]
  });

  // ════════ 更夫之子（冬·义庄）════════
  // 三轴：体魄/神识 × 因果(xianghuo 辅) × 冬(10月)。困境：守夜打更，夜里见得多。
  G.define('birth', {
    id: 'gengfu_zi',
    name: '更夫之子',
    desc: '爹是镇上的更夫，守了三十年的夜，落脚就在义庄边那间值房。你从小跟着他打更，三更半夜走遍青石镇的每条巷子——别人睡着的时辰，是你睁眼的时辰。夜里那些事，你见得比谁都多。',
    weight: 9,
    startLoc: 'yizhuang',
    ageY0: 14,
    startMonth: 10,          // 初冬，夜最长，更夫最忙
    lifespanMod: 0,
    money: 5,
    statsBase: { li: 3, ti: 4, min: 3, shen: 3 },
    statsFloat: 1,
    items: [{ id: 'gengluo', n: 1 }, { id: 'huozhezi', n: 1 }, { id: 'ganliang', n: 2 }],
    npcFav: { shuoshu_ren: 8, shihai_zhe: 5 },   // 说书人夜里也是更夫同道；义庄边与拾骸老者照过面
    traits: ['夜眼', '不惧夜'],
    visibleClue: '爹的规矩：打更走到义庄那段，锣要轻、脚要快、不回头——回头的更夫，没几个活到天亮。',
    affinity: { yinguo: 1.25, xianghuo: 1.2 },
    mingqian: [
      '命签·下下：守夜人识得夜，夜也识得守夜人。',
      '命签·中平：一更天黑，五更天明，循着锣声走完一生。',
      '命签·上上：见过最深的夜，便不怕任何黑。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_gengfu_zi', months: 1 }],
    startEffects: [
      { tendAdd: { yinguo: 4 } },
      { counterAdd: { xinmo: 2 } }   // 夜里见得多，心头压着东西
    ]
  });

  // ════════ 武学世家遗孤（秋·武馆）════════
  // 三轴：膂力/体魄 × 御剑(lianti 辅) × 秋(8月)。困境：没落剑术世家遗孤，家传半部剑诀。
  G.define('birth', {
    id: 'wuxue_guer',
    name: '武学世家遗孤',
    desc: '你家曾是一方有名的剑术世家，到你爹这辈败落，又遭了一场横祸，只剩你一个，被铁脊武馆收作记名弟子寄养。家传的半部剑诀缝在你贴身的衣襟里——后半部，连同仇人的名字，都断在那场祸里。',
    weight: 9,
    startLoc: 'wuguan',
    ageY0: 14,
    startMonth: 8,           // 秋，习武的好时令，也合武馆秋季较技
    lifespanMod: 0,
    money: 6,
    statsBase: { li: 4, ti: 4, min: 3, shen: 2 },
    statsFloat: 1,
    items: [{ id: 'banbu_jianpu', n: 1 }, { id: 'tiejian', n: 1 }, { id: 'ganliang', n: 1 }],
    npcFav: { dashixiong: 4, zhujian_weng: 6 },   // 武馆记名弟子，与大师兄有一面之分；剑术同源，铸剑老人惜其家学
    traits: ['剑骨', '记招快'],
    visibleClue: '爹临终塞给你半部剑诀，只来得及说一句：后半部不在纸上，在断剑崖——它认得我家的剑意。',
    affinity: { yujian: 1.3, lianti: 1.2 },
    mingqian: [
      '命签·下下：家仇半字未续，先折在记名弟子的台阶上。',
      '命签·中平：寄人篱下，一招一式都得自己偷学。',
      '命签·上上：断了的剑诀，断剑崖替你接上后半。'
    ],
    earlyHooks: [{ id: 'ev_kaichang_wuxue_guer', months: 1 }],
    startEffects: [
      { tendAdd: { yujian: 3, lianti: 2 } },   // 家传剑骨 + 武馆桩功底子
      { statAdd: { li: 1 } }
    ]
  });
})();
