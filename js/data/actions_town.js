// js/data/actions_town.js — 青石镇 / 药铺 / 武馆 行动（Owner: C2）。
//
// action schema 见契约 §7。范式要点：
//   * effects 必然发生；outcomes 按权重抽一（cond 不满足的剔除）；eventChance 行动后定向事件。
//   * 不在行动名里标注道途归属；tendAdd 永远藏在 effects/outcomes 里，不进文案。
//   * 每个 outcome 至少 1 个非 log 的状态 op（铁律）。
//
// ── 本文件对外输出（登记）──
//   新增物品：shoujia（兽夹，设陷阱用）、xiangzhu（香烛，上香用）
//     ┄ v2 ┄ biaoqi（镖旗，misc，雇镖/护商凭证，可售）、zhiqian（纸钱，misc，乱葬/义庄/河神渡通用，消费于收骸·祭河·守灵）
//   pflag：zhi_feikuang / wuguan_neitang_de / ren_chu_gufang
//     ┄ v2 ┄ zhi_luanzang（已听说乱葬岗，revealLoc 去重）、zhi_yima（已知驿马关，revealLoc 去重）、
//            zhi_heshen（已听说河神渡，revealLoc 去重）、de_biaoqi（已得镖旗）
//   legacy：dashixiong_defeated
//   insight 条目：yaoxing_zaji / wuguan_quanpu ┄ v2 ┄ xiyan_jiqiao（戏言机巧，humei 暗示）
//   引用记忆（C1）：mem_yaofang_gufang（古方残页钥匙）
//   引用的钉死事件（C3 并行实现）：ev_jishi_fengbo / ev_wuguan_shijian
//   引用敌（C4 并行，蓝图 §3）：shanfei（雇镖护商遇匪，已有）
//   废弃矿洞唯一保底发现路径在本文件：dating_xiaoxi 的「老矿工醉话」outcome；
//   v2 三地保底发现路径同样在 dating_xiaoxi（乱葬岗/驿马关/河神渡 各一 revealLoc outcome）。
//
// ── 自检十问 ──
// 1标签：劳作/市集/交际/药/体/渡/葬。2易共现：镇内人脉、攒钱买药、市价行情、武馆扬名、商路镖局、戏台说书。
// 3排斥：黑山的搏命活（镇中无 risk 3）；偷拳谱与大师兄好感互斥；义庄阴冷与草市喧闹互斥。
// 4改状态：钱/物品/好感/倾向/世界变量/传闻/拳脚伤。5后果：宰牲沾血腥、采买受 marketPrice 牵动、
//   打听揭开废矿/乱葬/驿马关/河神渡并搬运世情、雇镖压商路风险、戏台哄人喂狐。
// 6可解释：穷人先吃饭再求道；血腥味来自肉案；药价随行就市；商队过关才有镖局生意。
// 7钩子：平安钱/柜底收货/后山醉话/河祸传闻/戏班拾儿，全是给 C3/C5 的咬合点。
// 8有趣选择：一个月买药=一个月不挣钱；偷看内堂=高风险换厚利；雇镖稳当但费钱。
// 9服务 build：宰牲喂血与杀、辨药喂丹、练拳喂体、戏台哄人喂狐、吐纳是所有路的底。10不暴露：无任何机制词。
//
// TODO-INTEGRATION: 卖山货每月每种至多结算一件（引擎无按持有量循环的 op）；若日后支持批量出售可改。
(function () {
  'use strict';

  // ════════ 本文件新增物品（契约 §6.5）════════
  G.define('item', {
    id: 'shoujia', name: '兽夹', type: 'misc', price: 14,
    desc: '铁打的捕兽夹，咬合处还留着旧血锈。下夹的地方比夹子本身更要紧。'
  });
  G.define('item', {
    id: 'xiangzhu', name: '香烛', type: 'misc', price: 3,
    desc: '一对素香红烛。山神庙的香炉冷了很久了。'
  });
  // ┄ v2 ┄
  G.define('item', {
    id: 'biaoqi', name: '镖旗', type: 'misc', price: 12,
    desc: '驿马关镖局发的护货小旗，插在车头能少招些蟊贼。旗角绣着个褪了色的「镖」字。'
  });
  G.define('item', {
    id: 'zhiqian', name: '纸钱', type: 'misc', price: 2,
    desc: '一沓黄表纸钱。烧给无主的、淹死的、横死的——它们也认这个。'
  });

  // ════════════════ 青石镇 ════════════════

  G.define('action', {
    id: 'dagong', name: '做工', desc: '替镇上商铺扛包记账，挣几个辛苦钱。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 10,
    effects: [{ money: 3 }],
    outcomes: [
      { weight: 5, effects: [{ hp: 3 }, { log: { t: '一个月手脚不停，掌柜的多赏了口热饭。', style: '平' } }] },
      { weight: 2, effects: [{ money: 2 }, { log: { t: '你帮货行追回一笔烂账，得了点赏钱。', style: '吉' } }] },
      { weight: 2, effects: [{ tendAdd: { lianti: 1 } }, { log: { t: '整月的重活压下来，你的肩背倒比从前更结实了。', style: '体' } }] },
      { weight: 1, effects: [{ wvarAdd: { villageFear: 1 } },
        { log: { t: '武馆的人来街面收「平安钱」，满街没人敢吭声。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'bang_tuhu_zaisheng', name: '帮屠户宰牲', desc: '肉案后的活计：牵牲、放血、剔骨。工钱给得爽快。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 15,
    effects: [{ money: 4 }, { counterAdd: { xuexing: 2 } }],
    outcomes: [
      { weight: 5, effects: [{ tendAdd: { xuejian: 1 } },
        { log: { t: '你下刀越来越稳，血都溅不到袖口了。', style: '血' } }] },
      { weight: 2, effects: [{ hp: 4 }, { tendAdd: { lianti: 1 } },
        { log: { t: '收工后一碗滚热的下水汤，喝得浑身冒汗。', style: '平' } }] },
      { weight: 2, cond: { birth: 'tuhu_xuetu', stat: { id: 'li', lte: 5 } }, effects: [
        { statAdd: { li: 1 } },
        { log: { t: '师父按着你的手腕走了一刀：「使腰，不是使胳膊。」', style: '体' } }] },
      { weight: 2, effects: [{ money: 3 }, { counterAdd: { shaqi: 1 } }, { tendAdd: { xuejian: 2 } },
        { log: { t: '年节前连宰七日，案上的腥气熏进了骨头缝。', style: '血' } }] },
      { weight: 1, effects: [{ hp: -5 },
        { log: { t: '一头没捆牢的牲口惊了，蹄子结结实实踹在你肋上。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'tuna_xiulian', name: '吐纳修炼', desc: '寻处僻静地，照着不知哪辈人传下的口诀呼吸吐纳。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 20,
    effects: [{ cult: 8 }, { qi: 4 }],
    outcomes: [
      { weight: 6, effects: [{ counterAdd: { xinmo: -1 } },
        { log: { t: '气息绵长了些。说不上有什么仙缘，总归心静。', style: '平' } }] },
      { weight: 2, cond: { locvar: { loc: 'qingshizhen', key: 'spiritualEnergy', gte: 5 } },
        effects: [{ cult: 4 }, { log: { t: '今夜镇上格外安静，你隐约摸到了一丝气感。', style: '吉' } }] },
      { weight: 1, cond: { counter: { id: 'xinmo', gte: 15 } },
        effects: [{ counterAdd: { xinmo: 2 } }, { log: { t: '杂念纷起，越压越乱，这月几乎白坐了。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'ganji_caimai', name: '赶集采买', desc: '逢集添置些日用山货。行情时好时坏，全看时运。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 25,
    cond: { money: { gte: 10 } },
    effects: [],
    outcomes: [
      { weight: 4, effects: [{ money: -10 }, { itemAdd: { id: 'ganliang', n: 2 } }, { itemAdd: { id: 'huozhezi', n: 1 } },
        { log: { t: '集上转了一日，该添置的都添置上了。', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'marketPrice', lte: 85 } }, effects: [
        { money: -10 }, { itemAdd: { id: 'ganliang', n: 2 } }, { itemAdd: { id: 'ningxuecao', n: 2 } },
        { itemAdd: { id: 'xiangzhu', n: 2 } },
        { log: { t: '今年货贱，同样的钱挑回了满满一担。', style: '吉' } }] },
      { weight: 3, cond: { wvar: { id: 'marketPrice', gte: 120 } }, effects: [
        { money: -8 }, { itemAdd: { id: 'ganliang', n: 1 } },
        { log: { t: '什么都贵得离谱，你捏着钱袋空走了半条街。', style: '平' } }] },
      { weight: 2, cond: { money: { gte: 14 } }, effects: [
        { money: -14 }, { itemAdd: { id: 'shoujia', n: 1 } },
        { log: { t: '旧货摊上淘到一副铁兽夹，齿口还利得很。', style: '吉' } }] },
      { weight: 2, effects: [{ money: -10 }, { itemAdd: { id: 'xiangzhu', n: 2 } },
        { itemAdd: { id: 'fuzhi', n: 1 } }, { itemAdd: { id: 'ganliang', n: 1 } },
        { log: { t: '庙会的摊子摆到了镇口，香烛黄纸都便宜。', style: '平' } }] }
    ],
    eventChance: { p: 0.15, pool: ['ev_jishi_fengbo'] }
  });

  G.define('action', {
    id: 'dating_xiaoxi', name: '打听消息', desc: '茶肆里泡上半日，镇上的风吹草动都会过耳。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 35,
    cond: { money: { gte: 1 } },
    effects: [{ money: -1 }],
    outcomes: [
      { weight: 3, cond: { nopflag: 'zhi_feikuang' }, effects: [
        { pflagSet: { id: 'zhi_feikuang' } }, { revealLoc: 'feikuang' },
        { log: { t: '一个老矿工喝高了，絮叨起北坡废矿当年埋人的旧事。', style: '世界' } }] },
      { weight: 3, cond: { wvar: { id: 'wolfThreat', gte: 45 } }, effects: [
        { wvarAdd: { villageFear: 2 } },
        { rumorAdd: { t: '黑山的狼今年邪性，连老猎户都说看不懂兽踪。' } }] },
      { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 50 } }, effects: [
        { rumorAdd: { t: '有人夜里路过山神庙，听见殿里有女人在哭。' } }] },
      { weight: 2, cond: { wvar: { id: 'sectAttention', gte: 10 } }, effects: [
        { wvarAdd: { sectAttention: 1 } },
        { rumorAdd: { t: '镇上来了位佩剑的生人，挨家查问近来的怪事。' } }] },
      { weight: 2, cond: { nopflag: 'zhi_yima' }, effects: [   // 驿马关：商路枢纽，打听商情即解锁
        { pflagSet: { id: 'zhi_yima' } }, { revealLoc: 'yima_guan' },
        { log: { t: '茶客们正议论官道上的驿马关：「那关前的草市，啥都买得着。」', style: '世界' } }] },
      { weight: 2, cond: { nopflag: 'zhi_heshen', any: [{ wvar: { id: 'villageFear', gte: 20 } }, { season: '春' }] },
        effects: [   // 河神渡：河祸传闻/开春祭河话头解锁
        { pflagSet: { id: 'zhi_heshen' } }, { revealLoc: 'heshen_du' },
        { rumorAdd: { t: '河神渡又要祭河了。老人说今年祭轻了，夏汛怕是要淹人。' } }] },
      { weight: 2, cond: { nopflag: 'zhi_luanzang', any: [{ wvar: { id: 'ghostQi', gte: 35 } }, { season: '冬' }] },
        effects: [   // 乱葬岗：阴气重/隆冬厉鬼夜出话头解锁
        { pflagSet: { id: 'zhi_luanzang' } }, { revealLoc: 'luanzang_gang' }, { tendAdd: { yinguo: 1 } },
        { rumorAdd: { t: '镇西乱葬岗夜里又见磷火，更夫说听见坡上有人在喊冤。' } }] },
      { weight: 3, effects: [{ counterAdd: { xinmo: -1 } },
        { log: { t: '听了一肚子家长里短，没什么正经消息，倒也解闷。', style: '平' } }] }
    ],
    eventChance: { p: 0.12, pool: ['ev_jishi_fengbo'] }
  });

  // ════════════════ 药铺 ════════════════

  G.define('action', {
    id: 'banggong_bianyao', name: '帮工辨药', desc: '替掌柜碾药看炉、给生药分拣归柜，挣份工钱。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 10,
    effects: [{ money: 3 }, { tendAdd: { danyao: 2 } }],
    outcomes: [
      { weight: 5, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { log: { t: '掌柜的让你掌了一回戥子，你没看走眼。', style: '丹' } }] },
      { weight: 2, effects: [{ itemAdd: { id: 'ningxuecao', n: 1 } },
        { log: { t: '分拣剩下的边角药材，掌柜的挥挥手赏了你。', style: '平' } }] },
      { weight: 2, cond: { tend: { id: 'danyao', gte: 20 } }, effects: [
        { insight: { id: 'yaoxing_zaji', title: '药性杂记', t: '苦的麻舌，毒的麻指尖。手指比舌头先知道。', confirm: true } },
        { tendAdd: { danyao: 2 } },
        { log: { t: '抓了一个月药，你闭着眼也能摸出几味性烈的。', style: '丹' } }] },
      { weight: 2, cond: { npcFav: { id: 'yaopu_laoban', gte: 25 } }, effects: [
        { money: 3 }, { tendAdd: { danyao: 3 } },
        { log: { t: '掌柜的破例让你守了三炉药，火候口诀念给你听。', style: '丹' } }] },
      { weight: 2, cond: { mem: 'mem_yaofang_gufang' }, effects: [
        { pflagSet: { id: 'ren_chu_gufang' } }, { tendAdd: { danyao: 3 } },
        { log: { t: '整理柜底时你一眼认出那半页焦黄的古方——和梦里一样。', style: '因果' } }] },
      { weight: 1, effects: [{ hp: -4 }, { counterAdd: { dandu: 2 } },
        { log: { t: '替客人试了一口新到的药酒，舌头麻了三天。', style: '凶' } }] }
    ]
  });

  G.define('action', {
    id: 'mai_zhixuesan', name: '买止血散', desc: '称一包金疮药粉，有备无患。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 20,
    cond: { money: { gte: 8 } },
    effects: [{ money: -8 }, { itemAdd: { id: 'zhixuesan', n: 1 } }],
    outcomes: [
      { weight: 7, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 1 } },
        { log: { t: '掌柜的称药时多看了你两眼：「年轻人，少往山里跑。」', style: '平' } }] },
      { weight: 3, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 2 } }, { tendAdd: { danyao: 1 } },
        { log: { t: '你帮着碾了半晌药，掌柜的话多了些，药也给得足。', style: '平' } }] }
    ]
  });

  G.define('action', {
    id: 'zhua_liaoshangyao', name: '抓疗伤药', desc: '请掌柜的开一帖活血生肌的汤药。药价随行就市。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 25,
    cond: { money: { gte: 20 } },
    effects: [
      { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } },
        then: [{ money: -24 }],
        else: [{ branch: { cond: { wvar: { id: 'marketPrice', lte: 85 } }, then: [{ money: -16 }], else: [{ money: -20 }] } }] } },
      { itemAdd: { id: 'liaoshang_yao', n: 1 } }
    ],
    outcomes: [
      { weight: 6, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 1 } },
        { log: { t: '掌柜的把药包扎得方方正正：「三碗水，煎成一碗。」', style: '平' } }] },
      { weight: 2, effects: [{ itemAdd: { id: 'ningxuecao', n: 1 } },
        { log: { t: '掌柜的多搭了把凝血草：「山里跑的，用得上。」', style: '吉' } }] },
      { weight: 2, effects: [{ wvarAdd: { villageFear: 1 } },
        { log: { t: '「近来抓伤药的多，」掌柜的压低声音，「山里不太平。」', style: '世界' } }] }
    ]
  });

  G.define('action', {
    id: 'mai_ningqidan', name: '买凝气丹', desc: '柜底的粗丹，打坐前服一粒事半功倍——就是火气大。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 30,
    cond: { money: { gte: 24 } },
    effects: [
      { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } },
        then: [{ money: -30 }],
        else: [{ branch: { cond: { wvar: { id: 'marketPrice', lte: 85 } }, then: [{ money: -20 }], else: [{ money: -25 }] } }] } },
      { itemAdd: { id: 'ningqi_dan', n: 1 } }, { tendAdd: { danyao: 1 } }
    ],
    outcomes: [
      { weight: 6, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 1 } },
        { log: { t: '掌柜的叮嘱：一月一粒，多了伤身。', style: '丹' } }] },
      { weight: 2, effects: [{ cult: 3 },
        { log: { t: '掌柜的多送了半包药引，沏水喝也有进益。', style: '吉' } }] },
      { weight: 2, cond: { wvar: { id: 'sectAttention', gte: 15 } }, effects: [
        { wvarAdd: { sectAttention: 1 } },
        { log: { t: '柜前有个佩剑的生人也在买丹，多看了你一眼。', style: '世界' } }] }
    ]
  });

  G.define('action', {
    id: 'mai_shanhuo', name: '卖山货药材', desc: '把皮子、兽牙和药草折给回春堂，价钱随行就市。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 40,
    cond: { any: [{ item: { id: 'langpi', n: 1 } }, { item: { id: 'langya', n: 1 } },
                  { item: { id: 'yaolang_ya', n: 1 } }, { item: { id: 'ningxuecao', n: 1 } },
                  { item: { id: 'yinsui', n: 1 } }, { item: { id: 'hanjing', n: 1 } },
                  { item: { id: 'shouwang_zhua', n: 1 } }] },
    effects: [
      { branch: { cond: { item: { id: 'yinsui', n: 1 } }, then: [   // 矿洞尸王身上的阴髓，识货的掌柜肯出大价
        { itemDel: { id: 'yinsui', n: 1 } }, { npcFavAdd: { id: 'yaopu_laoban', n: 3 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 55 }], else: [{ money: 40 }] } },
        { log: { t: '掌柜的一见那截阴髓，瞳孔一缩，压低声音报了个数。', style: '丹' } }] } },
      { branch: { cond: { item: { id: 'hanjing', n: 1 } }, then: [   // 寒潭寒萤石，配药引材，郎中也抢
        { itemDel: { id: 'hanjing', n: 1 } }, { npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 22 }], else: [{ money: 16 }] } },
        { log: { t: '掌柜的捏着那颗寒萤石呵了口气，石上的霜半晌不化：「好东西。」', style: '丹' } }] } },
      { branch: { cond: { item: { id: 'shouwang_zhua', n: 1 } }, then: [   // 后山兽王爪，炼器避兽的稀罕料
        { itemDel: { id: 'shouwang_zhua', n: 1 } }, { npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 50 }], else: [{ money: 38 }] } },
        { log: { t: '掌柜的掂着那只兽王爪，咋舌：「挂门上能镇宅，我替你寻个识货的。」', style: '平' } }] } },
      { branch: { cond: { item: { id: 'langpi', n: 1 } }, then: [
        { itemDel: { id: 'langpi', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 8 }], else: [{ money: 5 }] } }] } },
      { branch: { cond: { item: { id: 'langya', n: 1 } }, then: [
        { itemDel: { id: 'langya', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 3 }], else: [{ money: 2 }] } }] } },
      { branch: { cond: { item: { id: 'yaolang_ya', n: 1 } }, then: [
        { itemDel: { id: 'yaolang_ya', n: 1 } }, { npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 16 }], else: [{ money: 11 }] } }] } },
      { branch: { cond: { item: { id: 'ningxuecao', n: 1 } }, then: [
        { itemDel: { id: 'ningxuecao', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } }, then: [{ money: 5 }], else: [{ money: 3 }] } }] } }
    ],
    outcomes: [
      { weight: 5, effects: [{ npcFavAdd: { id: 'yaopu_laoban', n: 1 } },
        { log: { t: '掌柜的拨着算盘，一样样替你折成银钱。', style: '平' } }] },
      { weight: 2, cond: { wvar: { id: 'marketPrice', gte: 120 } }, effects: [
        { money: 2 }, { log: { t: '近来药材金贵，山货也跟着水涨船高。', style: '吉' } }] },
      { weight: 2, cond: { counter: { id: 'xuexing', gte: 5 } }, effects: [
        { npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { log: { t: '掌柜的掂着货色打量你：「这路货，有多少我收多少。」', style: '平' } }] },
      { weight: 1, cond: { wvar: { id: 'sectAttention', gte: 20 } }, effects: [
        { wvarAdd: { sectAttention: 1 } },
        { log: { t: '一个生面孔翻看你卖的山货，问得格外细。', style: '世界' } }] }
    ]
  });

  // ════════════════ 武馆 ════════════════

  G.define('action', {
    id: 'zayi_lianquan', name: '杂役练拳', desc: '挑水劈柴之余，蹲在院角照着弟子们的架势比划。',
    loc: 'wuguan', timeCost: 1, risk: 0, order: 10,
    effects: [{ tendAdd: { lianti: 3 } }, { qi: 2 }],
    outcomes: [
      { weight: 5, effects: [{ hp: -3 }, { tendAdd: { lianti: 1 } },
        { log: { t: '对着木桩打了一个月，虎口的茧磨破了又长。', style: '体' } }] },
      { weight: 2, cond: { stat: { id: 'ti', lte: 5 } }, effects: [
        { statAdd: { ti: 1 } },
        { log: { t: '某天清晨你忽然觉得，担两桶水上坡，腿不晃了。', style: '体' } }] },
      { weight: 2, effects: [{ money: 1 }, { counterAdd: { xinmo: 1 } },
        { log: { t: '整月被弟子们支使跑腿，赏钱拿了，气也受了。', style: '平' } }] },
      { weight: 2, cond: { birth: 'wuguan_zayi' }, effects: [
        { tendAdd: { lianti: 3 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '你把内院晨课的桩功偷偷记了个全，夜里背人练。', style: '体' } }] },
      { weight: 1, cond: { npcFav: { id: 'dashixiong', lte: -5 } }, effects: [
        { hp: -5 }, { tendAdd: { lianti: 2 } }, { counterAdd: { xinmo: 2 } },
        { log: { t: '大师兄罚你扎了一个时辰马步，腿肚子抖成筛糠。', style: '体' } }] }
    ],
    eventChance: { p: 0.15, pool: ['ev_wuguan_shijian'] }
  });

  G.define('action', {
    id: 'wuguan_qiecuo', name: '武馆切磋', desc: '下场和武馆弟子过几招。点到为止，可拳脚没长眼。',
    loc: 'wuguan', timeCost: 1, risk: 1, order: 20,
    effects: [],
    outcomes: [
      { weight: 1, effects: [
        { combat: { enemy: 'wuguan_dizi', intro: '弟子抱拳行礼，沉腰落马——「请。」',
          onWin: [{ fame: 2 }, { tendAdd: { lianti: 2 } }, { npcFavAdd: { id: 'dashixiong', n: 2 } },
            { log: { t: '围观的弟子们窃窃私语，看你的眼神不一样了。', style: '体' } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { tendAdd: { lianti: 2 } }, { counterAdd: { xinmo: 1 } },
            { log: { t: '你被撂翻在青砖地上。挨的每一下，身上都记得。', style: '体' } }],
          onFlee: [{ counterAdd: { xinmo: 1 } },
            { log: { t: '你拱手认输退出场子，后颈烧得厉害。', style: '平' } }] } }
      ] }
    ],
    eventChance: { p: 0.2, pool: ['ev_wuguan_shijian'] }
  });

  G.define('action', {
    id: 'toukan_neitang', name: '偷看内堂功法', desc: '内堂的拳谱只传入室弟子。墙不算高，看你敢不敢。',
    loc: 'wuguan', timeCost: 1, risk: 2, order: 30,
    cond: { nopflag: 'wuguan_neitang_de' },
    effects: [{ counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 3, cond: { stat: { id: 'min', gte: 5 } }, effects: [
        { pflagSet: { id: 'wuguan_neitang_de' } }, { cult: 25 }, { tendAdd: { lianti: 5 } },
        { insight: { id: 'wuguan_quanpu', title: '墙上拳谱', t: '内堂那几式，发力全在腰背，不在拳上。我记全了。', confirm: true } },
        { log: { t: '你伏在梁上半个时辰没动，把墙上的图谱烙进脑子。', style: '吉' } }] },
      { weight: 2, effects: [
        { pflagSet: { id: 'wuguan_neitang_de' } }, { cult: 10 }, { tendAdd: { lianti: 3 } },
        { log: { t: '巡夜的脚步声逼得你提前翻墙，只来得及扫了几眼。', style: '平' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'wuguan_dizi', intro: '「谁在那儿！」巡夜的弟子一把扯住你的衣领。',
          onWin: [{ fame: 3 }, { tendAdd: { lianti: 2 } },
            { rumorAdd: { t: '听说有人深夜溜进武馆，反把巡夜的弟子打趴下了。', fame: 2 } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { npcFavAdd: { id: 'dashixiong', n: -5 } }, { counterAdd: { xinmo: 2 } },
            { log: { t: '你被扭送出门，摔在街心。看门老头直摇头。', style: '凶' } }],
          onFlee: [{ counterAdd: { xinmo: 1 } },
            { log: { t: '你甩脱那只手翻墙就跑，鞋都跑丢了一只。', style: '平' } }] } }] },
      { weight: 2, cond: { noflag: 'dashixiong_li_guan' }, effects: [   // 大师兄已离镇则撞不见他
        { combat: { enemy: 'dashixiong_boss', intro: '院里不知何时立着一条人影。大师兄活动着腕骨：「胆子不小。」',
          onWin: [{ pflagSet: { id: 'wuguan_neitang_de' } }, { fame: 15 },
            { legacySet: { id: 'dashixiong_defeated', v: true } },
            { npcFavAdd: { id: 'dashixiong', n: 10 } }, { tendAdd: { lianti: 4 } },
            { rumorAdd: { t: '铁脊武馆的大师兄，败给了一个偷看拳谱的小子！', fame: 10 } }],
          onLose: [{ injure: { months: 2, severity: 2 } }, { money: -5 },
            { npcFavAdd: { id: 'dashixiong', n: -8 } }, { counterAdd: { xinmo: 3 } },
            { rumorAdd: { t: '有个不知天高地厚的，让大师兄拎着领子扔出了武馆。' } },
            { log: { t: '他只用了三招。你趴在地上，没看清他怎么出的手。', style: '凶' } }],
          onFlee: [{ counterAdd: { xinmo: 2 } },
            { log: { t: '你抱头翻墙而逃，身后传来一声嗤笑。', style: '凶' } }] } }] }
    ]
  });

  // 持「仙门名帖」赴外门试——三年一考的机缘，终于落到了玩法里（飞升仅作传说，本世只记名）
  G.define('action', {
    id: 'chi_tie_fu_kao', name: '持帖赴外门试',
    desc: '九月巡使过镇，可凭名帖往驿馆一试。外门三年一考，过了便在仙门记下名姓。',
    loc: 'qingshizhen', timeCost: 1, risk: 1, order: 8,
    cond: { item: { id: 'xianmen_mingtie', n: 1 }, monthIn: [9], nopflag: 'waimen_jiming' },
    outcomes: [
      { weight: 5, cond: { realm: { gte: 2 } }, effects: [
        { itemDel: { id: 'xianmen_mingtie', n: 1 } }, { pflagSet: { id: 'waimen_jiming' } },
        { fame: 30 }, { cult: 80 }, { wvarAdd: { sectAttention: 12 } },
        { rumorAdd: { t: '青石镇出了个被仙门外门记名的人。巡使亲手在名册上添了一笔。', fame: 8 } },
        { log: { t: '考较过后，巡使合扇一礼：「外门记你一名。山门开时，自有人来寻你。」', style: '吉' } }] },
      { weight: 6, cond: { realm: { lte: 1 } }, effects: [
        { counterAdd: { xinmo: 2 } },
        { log: { t: '你连引气都未稳，几道试题下来汗透重衣。巡使收回名帖：「火候未到，三年后再来。」', style: '凶' } }] }
    ]
  });

  // ════════════════ 青石镇 — v2 戏台（humei 饲料）════════════════

  G.define('action', {
    id: 'xitai_chang', name: '戏台帮闲', desc: '镇口搭了戏台，帮着张罗、跑场、哄看客叫好。会哄人的吃这碗饭。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 28,
    effects: [{ money: 3 }, { tendAdd: { humei: 2 } }],
    outcomes: [
      { weight: 5, effects: [{ money: 2 }, { fame: 1 },
        { log: { t: '你一嗓子叫好带起满场喝彩，班主多赏了你几个钱。', style: '平' } }] },
      { weight: 3, cond: { stat: { id: 'min', gte: 4 } }, effects: [
        { tendAdd: { humei: 3 } }, { fame: 1 },
        { insight: { id: 'xiyan_jiqiao', title: '戏言机巧', t: '看客想听什么，我一眼就看得出。话顺着他的心说，钱袋自己就开了。', confirm: true } },
        { log: { t: '你顺着看客的脸色编词，三句话就把一个生人哄得掏了赏钱。', style: '吉' } }] },
      { weight: 2, cond: { birth: 'xiban_qi' }, effects: [
        { tendAdd: { humei: 4 } }, { money: 3 },
        { log: { t: '这台你熟门熟路。班主拍你肩：「还是你哄人有一套。」', style: '吉' } }] },
      { weight: 2, effects: [{ counterAdd: { xinmo: 1 } },
        { log: { t: '哄了一整月看客，散场后对着空台子，你忽然不知自己是谁。', style: '凶' } }] }
    ]
  });

  // ════════════════ 义庄（xianghuo / handu / yinguo）════════════════

  G.define('action', {
    id: 'tingling_shouye', name: '义庄守夜', desc: '替义庄守一夜停灵。工钱给得爽快——夜里白布鼓动，莫要去掀。',
    loc: 'yizhuang', timeCost: 1, risk: 2, order: 10,
    effects: [{ money: 4 }, { tendAdd: { yinguo: 2 } }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { item: { id: 'zhiqian', n: 1 } },
          then: [{ itemDel: { id: 'zhiqian', n: 1 } }, { wvarAdd: { ghostQi: -2 } }, { tendAdd: { xianghuo: 2 } },
            { log: { t: '你在每张板床前烧了张纸钱。这一夜，白布没再动过。', style: '因果' } }],
          else: [{ tendAdd: { yinguo: 1 } },
            { log: { t: '一夜更鼓，停灵的白布纹丝不动。天亮时你松了口气。', style: '平' } }] } }] },
      { weight: 3, effects: [
        { counterAdd: { xinmo: 2 } }, { wvarAdd: { ghostQi: 1 } }, { tendAdd: { handu: 1 } },
        { log: { t: '后半夜一具尸身的指头动了动。你死死盯着，直到天光。', style: '凶' } }] },
      { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 55 } }, effects: [
        { hp: -8 }, { counterAdd: { xinmo: 3 } }, { wvarAdd: { ghostQi: 2 } },
        { log: { t: '一盏长明灯无风自灭。黑暗里，有谁掀开了白布坐起来。', style: '凶' } }] },
      { weight: 2, cond: { tend: { id: 'xianghuo', gte: 25 } }, effects: [
        { wvarAdd: { ghostQi: -3 } }, { tendAdd: { xianghuo: 3 } },
        { log: { t: '你守夜时低声诵念，庄里的阴气竟随你的呼吸一寸寸退散。', style: '异象' } }] }
    ]
  });

  G.define('action', {
    id: 'tingshi_dagong', name: '义庄打杂', desc: '替义庄抬棺、净身、缝裹尸布。晦气活，工钱却比别处高。',
    loc: 'yizhuang', timeCost: 1, risk: 1, order: 20,
    effects: [{ money: 5 }, { counterAdd: { xinmo: 1 } }],
    outcomes: [
      { weight: 5, effects: [{ tendAdd: { yinguo: 1 } },
        { log: { t: '一具具收殓妥当，你的手越来越稳，心也越来越沉。', style: '平' } }] },
      { weight: 3, effects: [{ itemAdd: { id: 'zhiqian', n: 1 } }, { itemAdd: { id: 'fuzhi', n: 1 } },
        { log: { t: '死者怀里搜出一沓没烧完的纸钱和一张旧符，你替他收了。', style: '平' } }] },
      { weight: 2, cond: { stat: { id: 'shen', gte: 4 } }, effects: [
        { tendAdd: { yinguo: 2 } }, { counterAdd: { xinmo: 1 } },
        { log: { t: '替一具溺亡的尸身净身时，你摸到它指缝里还攥着河底的水草。', style: '因果' } }] },
      { weight: 2, effects: [{ hp: -5 }, { counterAdd: { xinmo: 2 } },
        { log: { t: '裹尸时那张脸忽然朝你笑了一下。你后退半步，撞翻了灯。', style: '凶' } }] }
    ]
  });

  // ════════════════ 驿马关（经济 / 交际）════════════════

  G.define('action', {
    id: 'guanqian_ganji', name: '关前赶集', desc: '驿马关的草市三教九流，南北货都有。行情时好时坏，全看时运。',
    loc: 'yima_guan', timeCost: 1, risk: 0, order: 10,
    cond: { money: { gte: 8 } },
    effects: [],
    outcomes: [
      { weight: 4, effects: [{ money: -8 }, { itemAdd: { id: 'ganliang', n: 2 } }, { itemAdd: { id: 'shaodaozi', n: 1 } },
        { log: { t: '草市上转了一日，添了干粮，还捎了壶关外的烧刀子。', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'marketPrice', lte: 90 } }, effects: [
        { money: -8 }, { itemAdd: { id: 'liaoshang_yao', n: 1 } }, { itemAdd: { id: 'zhiqian', n: 2 } },
        { log: { t: '关外药材贱，你低价收了一帖好疗伤药，还顺了沓纸钱。', style: '吉' } }] },
      { weight: 3, cond: { wvar: { id: 'marketPrice', gte: 120 } }, effects: [
        { money: -6 }, { itemAdd: { id: 'ganliang', n: 1 } }, { wvarAdd: { sectAttention: 0 } },
        { log: { t: '关税涨了，啥都贵，你捏着钱袋只敢添了点干粮。', style: '平' } }] },
      { weight: 2, cond: { money: { gte: 12 }, nopflag: 'de_biaoqi' }, effects: [
        { money: -12 }, { pflagSet: { id: 'de_biaoqi' } }, { itemAdd: { id: 'biaoqi', n: 1 } },
        { log: { t: '镖局的人塞给你一面护货小旗：「插车头上，蟊贼能少招几个。」', style: '平' } }] }
    ]
  });

  G.define('action', {
    id: 'datan_shanglu', name: '打探商路', desc: '在镖师酒桌、货郎摊前听商路上的风声。消息有时比货还值钱。',
    loc: 'yima_guan', timeCost: 1, risk: 0, order: 20,
    cond: { money: { gte: 1 } },
    effects: [{ money: -1 }],
    outcomes: [
      { weight: 4, effects: [{ wvarAdd: { marketPrice: -4 } }, { money: 2 },
        { log: { t: '你探得一支贱卖的货队将到，转手指给相熟的掌柜，赚了个跑腿钱。', style: '吉' } }] },
      { weight: 3, cond: { wvar: { id: 'sectAttention', gte: 8 } }, effects: [
        { wvarAdd: { sectAttention: 1 } },
        { rumorAdd: { t: '驿马关来过几个佩剑的生人，问的全是镇里近来的怪事。' } }] },
      { weight: 2, cond: { wvar: { id: 'wolfThreat', gte: 50 } }, effects: [
        { wvarAdd: { villageFear: 1 } },
        { rumorAdd: { t: '近来商队都绕开黑山脚那条近道——说是入夜有狼跟车。' } }] },
      { weight: 3, effects: [{ counterAdd: { xinmo: -1 } }, { money: 1 },
        { log: { t: '听了一桌子南北奇谈，没探着正经商情，倒蹭了顿酒。', style: '平' } }] }
    ]
  });

  G.define('action', {
    id: 'guhuo_huzou', name: '雇镖护商', desc: '随商队走一趟近道，挂旗当个散镖。镖银厚，路上未必太平。',
    loc: 'yima_guan', timeCost: 1, risk: 2, order: 30,
    cond: { money: { gte: 1 } },
    effects: [{ counterAdd: { shaqi: 1 } }],
    outcomes: [
      { weight: 4, effects: [
        { branch: { cond: { item: { id: 'biaoqi', n: 1 } }, then: [{ money: 16 }], else: [{ money: 12 }] } },
        { fame: 1 },
        { log: { t: '一路无事，商队顺顺当当过了关。镖银到手，沉甸甸的。', style: '吉' } }] },
      { weight: 3, effects: [
        { combat: { enemy: 'shanfei', intro: '近道转角滚石一拦，挎刀的劫匪拍着刀背：「留下买路钱！」',
          onWin: [{ money: 18 }, { fame: 3 }, { counterAdd: { xuexing: 2 } },
            { rumorAdd: { t: '驿马关那边来了个能打的散镖，劫道的吃了大亏。', fame: 2 } }],
          onLose: [{ injure: { months: 1, severity: 1 } }, { money: -8 }, { counterAdd: { xinmo: 1 } },
            { log: { t: '货被劫了，你也挨了刀。镖局的脸色，难看得很。', style: '凶' } }],
          onFlee: [{ money: -5 }, { counterAdd: { xinmo: 1 } },
            { log: { t: '你弃货保命，护的镖丢了，镖银自然也没了。', style: '凶' } }] } }] },
      { weight: 2, cond: { fame: { gte: 30 } }, effects: [
        { money: 14 }, { fame: 2 }, { wvarAdd: { villageFear: -1 } },
        { log: { t: '你的名头在道上传开，这趟连匪影都没见，镖银照拿。', style: '吉' } }] }
    ]
  });
})();
