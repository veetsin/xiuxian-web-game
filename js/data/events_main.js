// js/data/events_main.js — 主线/环境/链式事件（Owner: C3）。
//
// ── 本文件对外输出与登记 ──
// 必做事件：6 开场（ev_kaichang_liehu_zhizi/bingruo_guer/yaopu_xuetu/tuhu_xuetu/wuguan_zayi/miaozhu_yangzi，
//   births.js earlyHooks 引用）＋ 3 阈值（ev_langhuo_xiashan/ev_kuangdong_tafang/ev_miaozhong_yidong，time.js 引用）
//   ＋ 8 行动池伞事件（ev_shoulie_zaoyu/ev_shenshan_zaoyu/ev_yeru_heishan/ev_kuangdong_zaoyu/ev_miaoye_zaoyu/
//   ev_jishi_fengbo/ev_wuguan_shijian/ev_leiyu_yixiang，C2 eventChance 引用）＋ ev_langqun_baofu（契约 §6 范例引用）。
// 发放记忆（C1 定义）：mem_duanjianya（深山观望）/ mem_intel_shiwang（矿道遭遇）/ mem_intel_dashixiong（夜窥演武）。
// 新增 pflag：jie_le_liedao / cai_yao_zhi_tui / kuidi_jiuge / mai_le_jinyao / kan_le_yanjing / wuguan_shouru /
//   fuchou_lixia / ai_le_sanquan / duo_guo_sanquan / kanjian_dierzhuxiang / jian_miaozhu_yeji / de_zui_wuguan /
//   kuang_kele_jihao / jian_le_tafang。
// 新增 world flag：langhuo_siren / jihui 类见 events_qiyu.js。写入 legacy：langwang_slain（深山狼王战）/
//   mine_sealed（矿道尸王战）/ temple_cleansed（庙中异动邪影战）/ dashixiong_defeated（武馆之约）。
// 引用跨文件 id：敌人 yelang/yaolang/shanfei/shigui/yaoren/wuguan_dizi + 四 Boss；NPC lao_liehu/yaopu_laoban/
//   dashixiong/miaozhu/jiedao_sanxiu；物品 ganliang/ningxuecao/fuzhi/huozhezi/langpi/tiejian/shaodaozi/ningqi_dan。
//
// TODO-INTEGRATION: 建议 C4 给 kuangdong_shiwang 配 intelMem:'mem_intel_shiwang'、dashixiong_boss 配
//   intelMem:'mem_intel_dashixiong'（事件已按此发放情报记忆）。
// TODO-INTEGRATION: prefer 不支持 counter 维度，「血腥味招狼」以 cond:{counter:{id:'xuexing',gte:8}} 资格门
//   实现（ev_xingfeng_yelang）；引擎若日后支持 prefer.counter 可改为软偏好。
// TODO-INTEGRATION: pflag kuang_kele_jihao（矿道刻记号）留给 C2 矿洞探深行动作 cond 咬合点。
//
// ── 自检十问（对文件整体，以「狼祸下山」「腥风引狼」为代表）──
// 1标签：狼/险地/市集/体/雷/阴邪，按地点与天时分布。2易共现：高 wolfThreat 配狼事件，雷雨配雷事件，
//   血腥味重配引狼，丹毒高配反噬——状态真正改概率。3排斥：queueOnly 剧情钩子不进环境池；镇内不出深山事。
// 4改状态：每个 outcome 至少一个非 log op（战斗/倾向/世界变量/flag/物品/好感）。5后果：杀狼降狼患涨血腥味、
//   立誓挂两年之约、塌方揭示矿洞——全部沉淀回世界。6可解释：狼循血味、毒由丹积、辱极生誓，随机像命。
// 7钩子：eventDelay 链（狼群报复/武馆之约/药债）、pflag 复仇线、legacySet 四 Boss 痕迹。8有趣选择：迎战/
//   避祸/借物脱身各有成本；开场六难各埋一线。9服务 build：八伞事件分别喂血剑/炼体/丹/雷/因果且不署名。
// 10不暴露：可见文案只写现象与感受，无道名（命名前）、无数值机制词。
(function () {
  'use strict';

  // ═══════════════════════════════════════════
  // 一、出生开场事件（queueOnly，births.js earlyHooks 点名）
  // ═══════════════════════════════════════════

  G.define('event', {
    id: 'ev_kaichang_liehu_zhizi', title: '爹的腿',
    queueOnly: true, once: true, baseWeight: 0,
    text: '爹把那柄用了三十年的猎刀推到你面前，没说话。炕头药罐里咕嘟着凝血草，他那条坏在山里的腿，又开始疼了。「山里的规矩你都懂了，」他终于开口，「就一条——雪红了，回头。」',
    tags: ['因果', '狩猎'],
    choices: [
      {
        text: '接过猎刀，重重点头',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'lao_liehu', n: 5 } },
          { pflagSet: { id: 'jie_le_liedao' } },
          { tendAdd: { xuejian: 2 } },
          { log: { t: '刀柄上全是爹的手汗浸出的包浆。山里的活计，是你的了。', style: '平' } }
        ] }]
      },
      {
        text: '「我先把你的腿治好。」',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'cai_yao_zhi_tui' } },
          { tendAdd: { danyao: 3 } },
          { itemAdd: { id: 'ningxuecao', n: 1 } },
          { log: { t: '你翻出爹采药的旧图谱。这条腿是为你坏的，得有人管。', style: '丹' } }
        ] }]
      },
      {
        text: '「爹，我想去镇上寻活路。」',
        outcomes: [{ weight: 1, effects: [
          { money: 5 },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '爹沉默很久，摸出几个铜板塞给你：「也好。山里没出息。」', style: '平' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kaichang_bingruo_guer', title: '烧不退的夜',
    queueOnly: true, once: true, baseWeight: 0,
    text: '你又烧起来了，这是入冬第三回。庙祝踏雪送来一碗黑汤药，搁下就走。烧到最沉的时候，梦里又有人在很远的地方喊你——喊的不是你现在这个名字，可你偏偏想应。',
    tags: ['因果', '梦'],
    choices: [
      {
        text: '把药喝了，先活下来',
        outcomes: [{ weight: 1, effects: [
          { hp: 10 },
          { counterAdd: { dandu: 1 } },
          { npcFavAdd: { id: 'miaozhu', n: 3 } },
          { tendAdd: { danyao: 2 } },
          { log: { t: '药苦得钻心，烧却真的退了。命这东西，先保住再说。', style: '丹' } }
        ] }]
      },
      {
        text: '强撑着不睡，听那声音',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 5 } },
          { counterAdd: { xinmo: 2 } },
          { insight: { id: 'mengzhong_huming', title: '梦中呼名', t: '烧得最狠那晚，有人喊另一个名字。我差点应了。' } },
          { log: { t: '你咬着舌尖听了一夜。那名字越来越近，又散在鸡鸣里。', style: '因果' } }
        ] }]
      },
      {
        text: '问庙祝，梦是怎么回事',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'miaozhu', n: 2 } },
          { tendAdd: { yinguo: 3 } },
          { log: { t: '庙祝盯着你看了半晌：「梦里的话，别接。」说完就走了。', style: '因果' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kaichang_yaopu_xuetu', title: '柜底第九格',
    queueOnly: true, once: true, baseWeight: 0,
    text: '师父进山收药，留你一人看铺三日。头一夜你就睡不着了——柜底最后那一格，隔着铜锁往外渗一缕苦香，丝丝缕缕，勾着你的舌根。第二日黄昏，一个外乡人进店，开口就问：「柜底的药，卖么？出十两。」',
    tags: ['药', '隐秘'],
    choices: [
      {
        text: '谨守师命：「没有。」',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'yaopu_laoban', n: 6 } },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '外乡人冷笑出门。你后来才想明白：他没看柜，只看你。', style: '平' } }
        ] }]
      },
      {
        text: '夜里偷开一条缝，嗅药性',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { danyao: 5 } },
          { counterAdd: { dandu: 1 } },
          { pflagSet: { id: 'kuidi_jiuge' } },
          { insight: { id: 'shegen_yaoxiang', title: '舌根药香', t: '柜底那格不是一味药，是上百味熬成的一种沉默。' } },
          { log: { t: '只一缕气，你的舌头就麻了半夜。那不是治病的药。', style: '丹' } }
        ] }]
      },
      {
        text: '收钱，匀他一撮',
        outcomes: [{ weight: 1, effects: [
          { money: 20 },
          { pflagSet: { id: 'mai_le_jinyao' } },
          { roll: { chance: 0.5,
            success: [{ log: { t: '银子烫手。师父回来掂了掂药格，什么也没说。', style: '凶' } }, { counterAdd: { xinmo: 3 } }],
            fail: [{ npcFavAdd: { id: 'yaopu_laoban', n: -10 } }, { counterAdd: { xinmo: 2 } },
                   { log: { t: '师父回来只看了一眼就知道了。他没骂你，更难受。', style: '凶' } }] } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kaichang_tuhu_xuetu', title: '第一刀',
    queueOnly: true, once: true, baseWeight: 0,
    text: '师父病倒了，今日案上这头猪，只能你来。它被捆在案上，喘得很慢，眼珠一直转，最后停在你脸上。师父的规矩你背得滚瓜烂熟：稳、准、快——还有一条，别看它的眼睛。',
    tags: ['血', '杀'],
    choices: [
      {
        text: '照规矩，别开脸下刀',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xuexing: 2 } },
          { tendAdd: { lianti: 2 } },
          { money: 3 },
          { log: { t: '一刀毙命，血放得干净。帘后传来师父一声咳嗽，算是点头。', style: '血' } }
        ] }]
      },
      {
        text: '看着它的眼睛下刀',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xuexing: 3, shaqi: 1, xinmo: 1 } },
          { tendAdd: { xuejian: 4 } },
          { pflagSet: { id: 'kan_le_yanjing' } },
          { log: { t: '它的眼睛到最后都没闭。你的手，从头到尾没抖。', style: '血' } }
        ] }]
      },
      {
        text: '下不去手',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 3 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '师父披衣起来接过刀，叹了口气：「心善，是好事，也是债。」', style: '因果' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kaichang_wuguan_zayi', title: '青砖上的水',
    queueOnly: true, once: true, baseWeight: 0,
    text: '演武散场，你刚把整片青砖扫完，大师兄拎着一盆洗脚水走过来，当着满院弟子，慢慢地、匀匀地泼了一地。「杂役就该有杂役的样子，」他说，「再扫一遍。」哄笑声从四面八方压下来。',
    tags: ['体', '恶'],
    choices: [
      {
        text: '低头，再扫一遍',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'wuguan_shouru' } },
          { tendAdd: { lianti: 3 } },
          { counterAdd: { xinmo: 3 } },
          { log: { t: '你把每块砖擦得能照出人影。腰弯着，有些东西直了。', style: '体' } }
        ] }]
      },
      {
        text: '直起腰，盯着他',
        outcomes: [
          { weight: 6, effects: [
            { pflagSet: { id: 'wuguan_shouru' } },
            { npcFavAdd: { id: 'dashixiong', n: -5 } },
            { hp: -6 },
            { counterAdd: { xinmo: 2 } },
            { tendAdd: { lianti: 2 } },
            { log: { t: '他一脚把你踹进水洼里：「眼神不错。可惜命贱。」', style: '凶' } }] },
          { weight: 4, effects: [
            { pflagSet: { id: 'wuguan_shouru' } },
            { npcFavAdd: { id: 'dashixiong', n: -3 } },
            { fame: 1 },
            { tendAdd: { lianti: 2 } },
            { log: { t: '他与你对视三息，忽然笑了，转身走了。院里没人再笑。', style: '平' } }] }
        ]
      },
      {
        text: '当夜偷练他那一脚',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'wuguan_shouru' } },
          { tendAdd: { lianti: 4 } },
          { hp: -3 },
          { log: { t: '柴房里你对着月影踢了一夜。最后一下，有了点风声。', style: '体' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kaichang_miaozhu_yangzi', title: '第二炷香',
    queueOnly: true, once: true, baseWeight: 0,
    text: '夜半你被冻醒，看见养父跪在神像前，上第二炷香。他口中念念有词——不是任何一种你听过的经。香烟不往上走，平平地飘向后殿那扇门，像被什么吸着。',
    tags: ['香火', '阴邪', '因果'],
    choices: [
      {
        text: '装睡，把这一幕记下',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'kanjian_dierzhuxiang' } },
          { tendAdd: { yinguo: 4 } },
          { log: { t: '你眯着眼数他磕了几个头。九个。给山神，用不着九个。', style: '因果' } }
        ] }]
      },
      {
        text: '出声问：「爹，拜的是谁？」',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'miaozhu', n: -3 } },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '香应声而断。「睡你的去。」他的声音哑得不像他。', style: '凶' } }
        ] }]
      },
      {
        text: '盯着后殿那扇门看',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'kanjian_dierzhuxiang' } },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '门缝里黑得发稠。你看了它多久，它便看了你多久。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 二、世界阈值事件（queueOnly，time.js thresholds 点名直发）
  // ═══════════════════════════════════════════

  G.define('event', {
    id: 'ev_langhuo_xiashan', title: '狼祸下山',
    queueOnly: true, baseWeight: 0,
    text: '入夜后，狼嚎从四面围拢了青石镇。先是牲口棚塌了，跟着西巷传来撕心裂肺的哭喊——狼群进镇了。火把在街上乱成一片，有人砸门，有人喊你的名字，问镇上还有没有敢提刀的人。',
    tags: ['狼', '险地', '危险'],
    choices: [
      {
        text: '提刃上街，迎狼',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { villageFear: 10 } },
          { combat: {
            enemy: 'yaolang',
            intro: '巷口火光照出一头青瞳巨狼，嘴边还滴着血。它看见了你。',
            onWin: [
              { wvarAdd: { wolfThreat: -18, villageFear: -14 } },
              { counterAdd: { xuexing: 3 } },
              { tendAdd: { xuejian: 4 } },
              { fame: 5 },
              { rumorAdd: { t: '狼祸那夜，是那年轻人提刀站在街心，狼群愣是没能再进一步。', fame: 3 } },
              { eventDelay: { id: 'ev_langqun_baofu', months: 2, note: '狼群记住了火光下那个人影' } }
            ],
            onFlee: [
              { wvarAdd: { villageFear: 8 } },
              { counterAdd: { xinmo: 2 } },
              { log: { t: '你且战且退守住了自家门。这一夜，镇上没人睡着。', style: '凶' } }
            ]
          } }
        ] }]
      },
      {
        text: '帮镇民堵门垒栅',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { villageFear: 6, wolfThreat: -6 } },
          { tendAdd: { lianti: 2 } },
          { npcFavAdd: { id: 'lao_liehu', n: 4 } },
          { money: 3 },
          { log: { t: '你扛门板扛到天亮。狼群无隙可乘，天明前退回了山里。', style: '体' } },
          { log: { t: '邻里塞给你几个铜板，手都是抖的。', style: '平' } }
        ] }]
      },
      {
        text: '闭门熄灯，听天由命',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { villageFear: 18 } },
          { counterAdd: { xinmo: 2 } },
          { flagSet: { id: 'langhuo_siren' } },
          { rumorAdd: { t: '狼祸之夜西巷死了两口人。门板上的爪印，有指节深。', fame: 0 } },
          { log: { t: '天亮后，西巷抬出两副盖着白布的门板。你没去看。', style: '凶' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kuangdong_tafang', title: '矿洞塌方',
    queueOnly: true, baseWeight: 0,
    text: '后半夜，大地闷哼了一声，碗里的水纹一圈圈荡开。天亮后废矿方向还悬着黄尘——塌了，塌得很深。镇口乱成一团：昨日有几个胆大的进山捡铁，到现在没回来。',
    tags: ['矿', '险地', '危险'],
    choices: [
      {
        text: '赶去塌口刨人',
        outcomes: [
          { weight: 6, effects: [
            { wvarSet: { mineInstability: 55 } },
            { revealLoc: 'feikuang' },
            { hp: -5 },
            { roll: { chance: 0.55,
              success: [
                { fame: 5 }, { money: 5 },
                { tendAdd: { yinguo: 3 } },
                { npcFavAdd: { id: 'yaopu_laoban', n: 3 } },
                { log: { t: '挖到日头偏西，石缝里拽出一个活的。他攥着你不放。', style: '吉' } }],
              fail: [
                { counterAdd: { xinmo: 2 } },
                { tendAdd: { yinguo: 2 } },
                { locvarAdd: { loc: 'feikuang', key: 'corruption', n: 5 } },
                { log: { t: '刨出来的人已经凉了，脸上还带着笑，像看见了什么。', style: '凶' } }] } }
          ] },
          { weight: 4, effects: [
            { wvarSet: { mineInstability: 55 } },
            { revealLoc: 'feikuang' },
            { hp: -8 },
            { pflagSet: { id: 'jian_le_tafang' } },
            { log: { t: '你刨了一夜，指甲翻了三片。洞太深，人没找全。', style: '凶' } },
            { log: { t: '收工时你听见塌方深处有什么在挪动。不是人。', style: '凶' } }
          ] }
        ]
      },
      {
        text: '远远看着',
        outcomes: [{ weight: 1, effects: [
          { wvarSet: { mineInstability: 55 } },
          { revealLoc: 'feikuang' },
          { tendAdd: { yinguo: 1 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '人群里有人低声说：那矿每塌一回，夜里就热闹一阵。', style: '世界' } }
        ] }]
      },
      {
        text: '趁乱摸进塌口',
        cond: { stat: { id: 'min', gte: 4 } },
        outcomes: [
          { weight: 5, effects: [
            { wvarSet: { mineInstability: 55 } },
            { revealLoc: 'feikuang' },
            { money: 12 },
            { counterAdd: { xinmo: 1 } },
            { locvarAdd: { loc: 'feikuang', key: 'danger', n: 5 } },
            { log: { t: '你摸进半截新裂的矿道，捡了一袋前人遗落的铁器。', style: '平' } }] },
          { weight: 5, effects: [
            { wvarSet: { mineInstability: 55 } },
            { revealLoc: 'feikuang' },
            { hp: -10 },
            { injure: { months: 1, severity: 1 } },
            { log: { t: '二次塌方擦着你的头皮砸下。你是爬着出来的。', style: '凶' } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_miaozhong_yidong', title: '庙中异动',
    queueOnly: true, baseWeight: 0,
    text: '一连数夜，山神庙方向的呜咽声顺着风飘进镇子，狗听见就缩进窝里。有胆大的香客上去看过，回来话都说不利索：庙里的香炉自己满了——插的全是倒着的香，香灰朝天上落。',
    tags: ['阴邪', '香火', '危险'],
    choices: [
      {
        text: '上山一探',
        outcomes: [
          { weight: 6, effects: [
            { wvarSet: { ghostQi: 60 } },
            { counterAdd: { xinmo: 3 } },
            { tendAdd: { yinguo: 2 } },
            { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: 5 } },
            { log: { t: '殿里没人，神像后的影子却比神像高出一头。', style: '凶' } },
            { log: { t: '你退下山时，背后有极轻的一声笑。', style: '凶' } }] },
          { weight: 4, effects: [
            { wvarSet: { ghostQi: 60 } },
            { tendAdd: { yinguo: 3 } },
            { pflagSet: { id: 'jian_miaozhu_yeji' } },
            { branch: { cond: { npcAlive: 'miaozhu' },
              then: [{ log: { t: '你撞见庙祝深夜伏在殿前，朝着后殿连连叩首。', style: '因果' } }],
              else: [{ log: { t: '殿前的青砖上有新磕出的印子，深得像求了很多年。', style: '因果' } }] } }
          ] }
        ]
      },
      {
        text: '仗剑入庙，荡平邪祟',
        cond: { realm: { gte: 2 }, bossAlive: 'shanmiao_xieying' },
        outcomes: [{ weight: 1, effects: [
          { combat: {
            enemy: 'shanmiao_xieying',
            intro: '你一脚踏进大殿，满炉倒香齐齐熄灭。香炉后的阴影站了起来，戴着一张山神的脸。',
            onWin: [
              { bossSet: { enemy: 'shanmiao_xieying', alive: false } },
              { legacySet: { id: 'temple_cleansed' } },
              { wvarSet: { ghostQi: 8 } },
              { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: -40 } },
              { fame: 15 },
              { rumorAdd: { t: '山神庙的邪祟教人灭了！当夜呜咽声就停了，香炉里的香重新立直了。', fame: 8 } },
              { tendAdd: { yinguo: 4 } }
            ],
            onFlee: [
              { wvarSet: { ghostQi: 70 } },
              { counterAdd: { xinmo: 4 } },
              { log: { t: '你退出庙门时，那东西没有追。它在等更好的香火。', style: '凶' } }
            ]
          } }
        ] }]
      },
      {
        text: '烧符遥祭，先安一安它',
        cond: { item: { id: 'fuzhi', n: 1 } },
        outcomes: [{ weight: 1, effects: [
          { itemDel: { id: 'fuzhi', n: 1 } },
          { wvarSet: { ghostQi: 55 } },
          { tendAdd: { yinguo: 2 } },
          { npcFavAdd: { id: 'miaozhu', n: 2 } },
          { log: { t: '符灰打着旋儿往山上飘。呜咽声停了几夜，又起了。', style: '因果' } }
        ] }]
      },
      {
        text: '由它去',
        outcomes: [{ weight: 1, effects: [
          { wvarSet: { ghostQi: 68 } },
          { wvarAdd: { villageFear: 6 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '庙是山的，山是神的。你管不了，也不想管。', style: '平' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 三、行动池伞事件 ×8（C2 eventChance 引用；亦进环境池）
  // 每个伞内用 choices.cond + outcomes 权重/branch 容纳多种变化
  // ═══════════════════════════════════════════

  G.define('event', {
    id: 'ev_shoulie_zaoyu', title: '旧道岔影',
    text: '猎户旧道旁的灌木被压出一条新辙，断枝上挂着几缕灰毛，血点子一路往林子深处去。山里出了事，就在不久前。',
    tags: ['狩猎', '狼', '野外'],
    baseWeight: 12,
    cond: { loc: 'heishan_waiwei' },
    prefer: { tend: { xuejian: 0.3 }, locTags: ['狼'], wvar: [{ id: 'wolfThreat', gte: 40, boost: 1.6 }] },
    choices: [
      {
        text: '循着血迹跟过去',
        outcomes: [
          { weight: 4, effects: [
            { combat: { enemy: 'yelang',
              intro: '血迹尽头，一头带伤的独狼猛地回首——伤狼最凶。',
              onWin: [{ wvarAdd: { wolfThreat: -3 } }, { counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 3 } }],
              onFlee: [{ log: { t: '你退出了它的地界。带伤的东西，犯不着拼命。', style: '平' } }] } }] },
          { weight: 3, cond: { wvar: { id: 'wolfThreat', gte: 45 } }, effects: [
            { log: { t: '血迹尽头不是猎物——是带崽的母狼，和她的姐妹。', style: '凶' } },
            { combat: { enemy: 'yelang',
              intro: '三头母狼把崽护在身后，无路可退，齐齐扑了上来！',
              onWin: [
                { wvarAdd: { wolfThreat: -6 } },
                { counterAdd: { xuexing: 3 } },
                { tendAdd: { xuejian: 3 } },
                { eventDelay: { id: 'ev_langqun_baofu', months: 2, note: '你杀了带崽的母狼，狼群记仇' } },
                { log: { t: '狼崽的呜咽声从灌木深处传来。你没有回头。', style: '血' } }],
              onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '你护着要害且战且退，半条袖子留在了狼嘴里。', style: '凶' } }] } }] },
          { weight: 3, effects: [
            { money: 8 },
            { counterAdd: { xuexing: 1 } },
            { log: { t: '是头被狼咬死的鹿，肉还温。山里的规矩：见者有份。', style: '平' } }] },
          { weight: 2, effects: [
            { fame: 2 },
            { tendAdd: { yinguo: 3 } },
            { npcFavAdd: { id: 'lao_liehu', n: 3 } },
            { log: { t: '血迹尽头是个折了腿的山民。你把他背下了山。', style: '吉' } }] }
        ]
      },
      {
        text: '不蹚浑水，绕道设套',
        outcomes: [
          { weight: 5, effects: [
            { money: 5 },
            { log: { t: '绕了远路，套子却没空着。稳当，也寡淡。', style: '平' } }] },
          { weight: 3, effects: [
            { itemAdd: { id: 'ningxuecao', n: 1 } },
            { tendAdd: { yinguo: 1 } },
            { log: { t: '绕路时顺手采了把药草。躲开的祸，也是路。', style: '平' } }] },
          { weight: 2, cond: { wvar: { id: 'wolfThreat', gte: 60 } }, effects: [
            { counterAdd: { xinmo: 1 } },
            { wvarAdd: { villageFear: 2 } },
            { log: { t: '收套时发现麻绳齐茬断着，像被什么试了试牙口。', style: '凶' } }] }
        ]
      },
      {
        text: '味道不对，立刻下山',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { rumorAdd: { t: '听说有个外乡猎人前几日进了黑山，到今日还没见出来。', fame: 0 } },
          { log: { t: '你下山时后颈一直发麻。有些猎物，是用来钓猎人的。', style: '因果' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_shenshan_zaoyu', title: '深山动静',
    text: '古木间忽然静得反常——鸟不叫了，风也停了。这种静你听老辈人说过：山里真正的东西路过时，万物都装死。而你，正站在它要过的道上。',
    tags: ['狼', '险地', '隐秘'],
    baseWeight: 12,
    cond: { loc: 'heishan_shenchu' },
    prefer: { tend: { xuejian: 0.4 }, locTags: ['隐秘'], wvar: [{ id: 'wolfThreat', gte: 50, boost: 1.5 }] },
    choices: [
      {
        text: '提刃静待',
        outcomes: [
          { weight: 4, effects: [
            { combat: { enemy: 'yaolang',
              intro: '青色的双瞳自树影间亮起——妖狼，而且它早就看见你了。',
              onWin: [{ wvarAdd: { wolfThreat: -4 } }, { counterAdd: { xuexing: 3 } }, { tendAdd: { xuejian: 3 } }],
              onFlee: [{ counterAdd: { xinmo: 1 } }, { log: { t: '你退出林子时，那声狼嚎一直贴着你的脚跟。', style: '凶' } }] } }] },
          { weight: 2, cond: { bossAlive: 'heishan_langwang', wvar: { id: 'wolfThreat', gte: 55 } }, effects: [
            { counterAdd: { xinmo: 2 } },
            { tendAdd: { yinguo: 2 } },
            { flagSet: { id: 'langwang_jianguo_ni' } },
            { log: { t: '岩顶之上，一头小马驹大的巨狼俯视着你，金瞳独目。', style: '凶' } },
            { log: { t: '它看了你很久，转身没入林海。它不饿——或者不屑。', style: '凶' } }] },
          { weight: 2, effects: [
            { itemAdd: { id: 'tiejian', n: 1 } },
            { tendAdd: { xuejian: 2 } },
            { log: { t: '动静过后，你在腐叶下踢出半截埋了不知多少年的剑。', style: '平' } }] },
          { weight: 2, effects: [
            { itemAdd: { id: 'ningxuecao', n: 2 } },
            { tendAdd: { danyao: 2 } },
            { log: { t: '虚惊一场。倒是兽道旁那丛药草，长得邪乎地好。', style: '丹' } }] }
        ]
      },
      {
        text: '攀上高处观望',
        cond: { stat: { id: 'min', gte: 5 } },
        outcomes: [
          { weight: 3, cond: { not: { mem: 'mem_duanjianya' } }, effects: [
            { memAdd: 'mem_duanjianya' },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '远处一面孤崖直插云气，崖壁上密密麻麻——全是剑。', style: '异象' } }] },
          { weight: 3, effects: [
            { tendAdd: { yinguo: 1 } },
            { wvarAdd: { wolfThreat: -2 } },
            { log: { t: '你看清了狼群迁徙的方向，绕开了它们今冬的猎场。', style: '平' } }] },
          { weight: 4, effects: [
            { hp: -2 },
            { log: { t: '攀到高处，山雾正浓，什么也没看见，掌心倒磨破了。', style: '平' } }] }
        ]
      },
      {
        text: '循着那股气息寻过去',
        cond: { counter: { id: 'shaqi', gte: 5 } },
        outcomes: [
          { weight: 1, cond: { bossAlive: 'heishan_langwang' }, effects: [
            { combat: { enemy: 'heishan_langwang',
              intro: '兽道尽头是一片白骨铺成的空地。岩座之上，黑山之王缓缓起身，金色独目里映着你——它等这一天，比你久。',
              onWin: [
                { bossSet: { enemy: 'heishan_langwang', alive: false } },
                { legacySet: { id: 'langwang_slain' } },
                { wvarSet: { wolfThreat: 5 } },
                { counterAdd: { xuexing: 5, shaqi: 3 } },
                { tendAdd: { xuejian: 6 } },
                { fame: 25 },
                { rumorAdd: { t: '黑山狼王死了！有人拖着那张王座般的狼尸走出了深山！', fame: 10 } }],
              onFlee: [
                { counterAdd: { xinmo: 3 } },
                { log: { t: '你逃出白骨地时，它没有追。山中之王，不追死人以外的东西。', style: '凶' } }] } }] },
          { weight: 1, cond: { bossDead: 'heishan_langwang' }, effects: [
            { money: 15 },
            { itemAdd: { id: 'yaolang_ya', n: 2 } },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '气息尽头是座空了的白骨王座。山中无王，群狼四散。', style: '世界' } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_yeru_heishan', title: '夜山孤火',
    text: '后半夜，山坳里亮起一点孤零零的火光。这个时辰，这个地界，生火的不会是寻常人——要么是不怕死的，要么是死过的。',
    tags: ['夜', '险地', '隐秘'],
    baseWeight: 11,
    cond: { any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }] },
    prefer: { tend: { xuejian: 0.3 }, locTags: ['夜'], wvar: [{ id: 'wolfThreat', gte: 50, boost: 1.3 }] },
    choices: [
      {
        text: '压低身子，摸近看看',
        outcomes: [
          { weight: 3, effects: [
            { combat: { enemy: 'shanfei',
              intro: '火堆旁是几条分赃的山匪。枯枝在你脚下一响，刀就出了鞘！',
              onWin: [{ money: 15 }, { counterAdd: { shaqi: 2 } }, { tendAdd: { xuejian: 2 } },
                      { log: { t: '赃银沾着别人的血。你掂了掂，还是揣进了怀里。', style: '血' } }],
              onFlee: [{ log: { t: '你滚下土坡甩掉了追兵，怀里还攥着半根烤山鸡。', style: '平' } }] } }] },
          { weight: 2, effects: [
            { money: 6 },
            { itemAdd: { id: 'huozhezi', n: 1 } },
            { counterAdd: { xinmo: 2 } },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '火还没灭，人已经凉了。山里的夜，吃人不吐声响。', style: '凶' } }] },
          { weight: 2, effects: [
            { hp: 5 },
            { npcFavAdd: { id: 'lao_liehu', n: 3 } },
            { tendAdd: { lianti: 1 } },
            { log: { t: '是个守夜的老药农，他分你半块烤薯，讲了一夜的山。', style: '吉' } }] },
          { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 40 } }, effects: [
            { counterAdd: { xinmo: 3 } },
            { tendAdd: { yinguo: 3 } },
            { log: { t: '那点火不烧柴，也不冒烟。你走近一步，它退一步。', style: '凶' } },
            { log: { t: '它朝山神庙的方向退着，像在等你跟上去。', style: '凶' } }] }
        ]
      },
      {
        text: '绕开火光赶路',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { yinguo: 1 } },
            { log: { t: '夜里的热闹，多半不是给活人看的。你绕了半里地。', style: '平' } }] },
          { weight: 4, cond: { counter: { id: 'xuexing', gte: 6 } }, effects: [
            { log: { t: '可你身上的血腥味，在夜风里传得比火光还远。', style: '凶' } },
            { combat: { enemy: 'yelang',
              intro: '绿油油的眼睛在下风口排开——狼循着你的味来了。',
              onWin: [{ counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } }],
              onFlee: [{ hp: -4 }, { log: { t: '你弃了外衫才甩脱狼群。夜山不饶带血的人。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '欺近去，灭了那堆火',
        cond: { counter: { id: 'shaqi', gte: 8 } },
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'shanfei',
            intro: '你像狼一样欺近火堆。望风的山匪回头时，你已在三步之内。',
            onWin: [{ money: 20 }, { counterAdd: { shaqi: 3, xuexing: 2 } },
                    { rumorAdd: { t: '山里又少了一伙劫道的。没人知道是谁的手笔。', fame: 0 } }],
            onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '对方人多，你杀进去又杀了出来，谁也没讨着好。', style: '血' } }] } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_kuangdong_zaoyu', title: '矿道深处',
    text: '矿道越走越深，火光照见岩壁上一道道指甲抠出的旧痕，全都朝着洞外的方向。风从更深处来，带着铁锈和陈年尸土的味道。',
    tags: ['矿', '阴邪', '险地'],
    baseWeight: 12,
    cond: { loc: 'feikuang' },
    prefer: { tend: { lianti: 0.3 }, locTags: ['矿'], wvar: [{ id: 'mineInstability', gte: 50, boost: 1.5 }] },
    choices: [
      {
        text: '再往深处走',
        outcomes: [
          { weight: 4, effects: [
            { combat: { enemy: 'shigui',
              intro: '一具佝偻的影子从矿车后拖着腿转出来，指甲刮着岩壁。',
              onWin: [{ locvarAdd: { loc: 'feikuang', key: 'corruption', n: -3 } }, { counterAdd: { shaqi: 1 } }, { tendAdd: { lianti: 2 } }],
              onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '它不追光。你举着火折子退出来，手一直在抖。', style: '凶' } }] } }] },
          { weight: 2, effects: [
            { money: 8 },
            { tendAdd: { yinguo: 2 } },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '矿车底下蜷着一具骸骨，手里还攥着半块没吃完的饼。', style: '凶' } }] },
          { weight: 2, cond: { wvar: { id: 'mineInstability', gte: 50 } }, effects: [
            { hp: -12 },
            { injure: { months: 1, severity: 1 } },
            { locvarAdd: { loc: 'feikuang', key: 'danger', n: 5 } },
            { log: { t: '头顶炸响！你抱头滚出三丈，碎石把来路埋了一半。', style: '凶' } }] },
          { weight: 2, cond: { not: { mem: 'mem_intel_shiwang' } }, effects: [
            { memAdd: 'mem_intel_shiwang' },
            { itemAdd: { id: 'huozhezi', n: 1 } },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '塌石下压着个还有气的盗墓客。他塞给你火折子。', style: '凶' } },
            { log: { t: '「深处那东西……别用刀。用火，用雷……」他咽了气。', style: '因果' } }] },
          { weight: 1, cond: { bossAlive: 'kuangdong_shiwang', realm: { gte: 2 } }, effects: [
            { combat: { enemy: 'kuangdong_shiwang',
              intro: '最深的塌方之下，一具覆满矿尘的巨大尸身缓缓站起。百十条人命的怨气，在这一刻全看着你。',
              onWin: [
                { bossSet: { enemy: 'kuangdong_shiwang', alive: false } },
                { legacySet: { id: 'mine_sealed' } },
                { wvarSet: { mineInstability: 5 } },
                { locvarAdd: { loc: 'feikuang', key: 'corruption', n: -40 } },
                { fame: 20 },
                { tendAdd: { lianti: 3 } },
                { rumorAdd: { t: '有人只身下了废矿。他出来之后，矿里夜夜的哭声全停了。', fame: 8 } }],
              onFlee: [
                { counterAdd: { xinmo: 3 } },
                { log: { t: '你逃出洞口时，身后传来一声漫长的、失望的叹息。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '在岔口刻下记号，退出去',
        outcomes: [
          { weight: 5, effects: [
            { pflagSet: { id: 'kuang_kele_jihao' } },
            { tendAdd: { yinguo: 1 } },
            { log: { t: '你在岔口刻了记号。下次再来，路就是熟的了。', style: '平' } }] },
          { weight: 3, effects: [
            { itemAdd: { id: 'huozhezi', n: 1 } },
            { money: 3 },
            { log: { t: '退出来时捡了前人丢下的工具袋，还能用。', style: '平' } }] },
          { weight: 2, effects: [
            { counterAdd: { xinmo: 2 } },
            { hp: -3 },
            { log: { t: '身后传来指甲刮壁声，不紧不慢，跟了你一路。', style: '凶' } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_miaoye_zaoyu', title: '夜殿冷供',
    text: '你在庙里过夜。后半夜，殿中长明灯忽然矮了下去。供桌上不知何时多了一份新供品——一碗冒着热气的白米饭，一双筷子直直插在饭头上。',
    tags: ['阴邪', '香火', '夜'],
    baseWeight: 11,
    cond: { loc: 'shanshenmiao' },
    prefer: { tend: { yinguo: 0.5 }, locTags: ['阴邪'], wvar: [{ id: 'ghostQi', gte: 40, boost: 1.8 }] },
    choices: [
      {
        text: '端走那碗饭',
        outcomes: [
          { weight: 3, effects: [
            { hp: 4 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '你吃了。是温的，味道很好——这才是最瘆人的地方。', style: '凶' } }] },
          { weight: 3, effects: [
            { counterAdd: { xinmo: 3 } },
            { tendAdd: { yinguo: 2 } },
            { wvarAdd: { ghostQi: 3 } },
            { log: { t: '你的手刚碰到碗沿，殿外的哭声骤然起了。', style: '凶' } }] },
          { weight: 2, cond: { wvar: { id: 'ghostQi', gte: 50 } }, effects: [
            { counterAdd: { xinmo: 4 } },
            { tendAdd: { yinguo: 3 } },
            { log: { t: '有声音贴着你的耳根说：「替他吃，就替他还。」', style: '凶' } }] }
        ]
      },
      {
        text: '上一炷香，退到檐下',
        outcomes: [
          { weight: 5, effects: [
            { tendAdd: { yinguo: 2 } },
            { npcFavAdd: { id: 'miaozhu', n: 2 } },
            { log: { t: '香烧得很直。一夜无话，各安各的。', style: '因果' } }] },
          { weight: 3, cond: { pflag: 'xianghuo_yinji' }, effects: [
            { tendAdd: { yinguo: 4 } },
            { qi: 4 },
            { insight: { id: 'xianghuo_zhi_ji', title: '吃下去的香火', t: '我身上有庙里给的东西。它认这座庙，庙也认它。' } },
            { log: { t: '眉心一点温热，像有人隔着香烟按了按你的额头。', style: '异象' } }] }
        ]
      },
      {
        text: '守在暗处，看谁来上供',
        outcomes: [
          { weight: 4, effects: [
            { tendAdd: { yinguo: 2 } },
            { counterAdd: { xinmo: 2 } },
            { branch: { cond: { npcAlive: 'miaozhu' },
              then: [{ pflagSet: { id: 'jian_miaozhu_yeji' } },
                     { log: { t: '三更，庙祝提食盒进殿换供，口中念念有词，倒退着出门。', style: '因果' } }],
              else: [{ log: { t: '三更，一道佝偻黑影进殿换供，没有脚步声。', style: '凶' } }] } }] },
          { weight: 3, effects: [
            { counterAdd: { xinmo: 3 } },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '没人来。可天亮时那碗饭见了底，筷子干干净净。', style: '凶' } }] },
          { weight: 3, effects: [
            { counterAdd: { xinmo: -1 } },
            { log: { t: '一只山狸叼走了饭团。你笑自己疑神疑鬼，倒头睡了。', style: '平' } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_jishi_fengbo', title: '集市风波',
    text: '镇口的集市今日格外吵，人群围成一圈，你被裹在当中，想脱身都难。垫脚一看，圈子中央已经有人红了脸，撸了袖子。',
    tags: ['市集', '交际'],
    baseWeight: 10,
    cond: { loc: 'qingshizhen' },
    prefer: { locTags: ['市集'], wvar: [{ id: 'villageFear', gte: 40, boost: 1.4 }] },
    choices: [
      {
        text: '挤进去看个究竟',
        outcomes: [
          { weight: 3, effects: [
            { counterAdd: { xinmo: 1 } },
            { wvarAdd: { villageFear: 2 } },
            { log: { t: '武馆弟子当街收「保街钱」，踹翻了菜担。没人敢吭声。', style: '凶' } }] },
          { weight: 3, cond: { tend: { id: 'danyao', gte: 15 } }, effects: [
            { fame: 3 },
            { npcFavAdd: { id: 'yaopu_laoban', n: 4 } },
            { tendAdd: { danyao: 2 } },
            { log: { t: '游方郎中叫卖「驻颜仙丹」。你一闻就笑了：糖混皂角。', style: '丹' } },
            { rumorAdd: { t: '集上那骗子的「仙丹」，让个年轻人一句话拆穿了。', fame: 1 } }] },
          { weight: 3, effects: [
            { money: -5 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '回过神来腰间一轻。这一课不贵，几个铜板。', style: '凶' } }] },
          { weight: 2, cond: { item: { id: 'langpi', n: 1 } }, effects: [
            { itemDel: { id: 'langpi', n: 1 } },
            { money: 10 },
            { log: { t: '山货行今日抢着收皮子，你那张狼皮卖出了好价。', style: '吉' } }] }
        ]
      },
      {
        text: '有人仗势欺人，出头',
        outcomes: [
          { weight: 5, effects: [
            { combat: { enemy: 'wuguan_dizi',
              intro: '「哪来的不长眼的？」武馆弟子拨开人群，朝你抱了个拳。',
              onWin: [
                { fame: 5 },
                { tendAdd: { lianti: 2 } },
                { npcFavAdd: { id: 'dashixiong', n: -4 } },
                { pflagSet: { id: 'de_zui_wuguan' } },
                { rumorAdd: { t: '有人当街放倒了武馆的人，还把摊钱一文文捡还了老汉。', fame: 2 } }],
              onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你虚晃一招拉着老汉钻进了人堆。好汉不吃眼前亏。', style: '平' } }] } }] },
          { weight: 3, effects: [
            { fame: 2 },
            { counterAdd: { shaqi: 1 } },
            { tendAdd: { lianti: 1 } },
            { log: { t: '是几个地痞。你往那一站没说话，他们就散了。', style: '平' } }] },
          { weight: 2, effects: [
            { money: -8 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '一帮人反咬你撞翻了摊子。破财消灾，你认了。', style: '凶' } }] }
        ]
      },
      {
        text: '趁乱收点便宜山货',
        cond: { money: { gte: 10 } },
        outcomes: [
          { weight: 6, effects: [
            { money: -10 },
            { itemAdd: { id: 'langpi', n: 2 } },
            { log: { t: '乱市出贱价。两张好狼皮到手，转手就能翻倍。', style: '吉' } }] },
          { weight: 4, effects: [
            { money: -10 },
            { itemAdd: { id: 'cubu_yi', n: 1 } },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '回家解开包袱：一卷烂布。乱市的便宜，原是钓钩。', style: '凶' } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_wuguan_shijian', title: '演武场边',
    textFn: function () {
      var p = G.player;
      if (p.pflags['de_zui_wuguan']) return '演武场上正比试，你刚站到圈外，议论声就变了味——「就是他，放倒过馆里的人。」几道目光钉子似的钉过来。';
      if (p.pflags['wuguan_shouru']) return '演武场上正比试，圈外三层里三层。有弟子瞥见你，嗤了一声：「杂役也配看拳？」可你的眼睛，已经离不开场中那两双脚了。';
      return '演武场上正比试，喝喊声震得瓦响。圈外人头攒动，你也被卷在里头。场中那名弟子的桩功极稳，像生了根。';
    },
    tags: ['体', '修炼', '交际'],
    baseWeight: 10,
    cond: { loc: 'wuguan' },
    prefer: { tend: { lianti: 0.5 }, locTags: ['体'] },
    choices: [
      {
        text: '应声下场，讨教两手',
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'wuguan_dizi',
            intro: '弟子抱拳还礼，马步一沉：「点到为止——请！」',
            onWin: [
              { fame: 4 },
              { tendAdd: { lianti: 3 } },
              { npcFavAdd: { id: 'dashixiong', n: -2 } },
              { log: { t: '你收手而立。看台暗处，有人眯起眼把你重新打量了一遍。', style: '体' } }],
            onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你拱手认输跳出了圈。输阵不输人。', style: '平' } }] } }
        ] }]
      },
      {
        text: '只看门道，不看热闹',
        outcomes: [
          { weight: 5, effects: [
            { tendAdd: { lianti: 2 } },
            { insight: { id: 'quanjiao_mendao', title: '拳脚门道', t: '武馆的桩功根在腰背。挨打的功夫，是站出来的。' } },
            { log: { t: '你盯着场中人的腰马看了一下午，脚底板隐隐发热。', style: '体' } }] },
          { weight: 3, cond: { stat: { id: 'shen', gte: 5 } }, effects: [
            { tendAdd: { lianti: 3, yinguo: 1 } },
            { log: { t: '压轴那位的左肩有旧伤，起手必先沉一沉。你记下了。', style: '体' } }] },
          { weight: 2, effects: [
            { hp: -3 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '「看什么看？」你被巡场的弟子推搡着撵出了院门。', style: '凶' } }] }
        ]
      },
      {
        text: '转身就走',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { yinguo: 1 } },
            { log: { t: '热闹是他们的。你出了院门，身后喝喊声渐渐远了。', style: '平' } }] },
          { weight: 4, cond: { pflag: 'de_zui_wuguan' }, effects: [
            { combat: { enemy: 'wuguan_dizi',
              intro: '巷口被三个人堵住了。「打了我们的人，想就这么走？」',
              onWin: [{ fame: 3 }, { tendAdd: { lianti: 2 } },
                      { rumorAdd: { t: '武馆堵巷子寻仇，又让那人全须全尾地走出来了。', fame: 2 } }],
              onFlee: [{ hp: -5 }, { counterAdd: { xinmo: 2 } }, { log: { t: '你挨了两记闷拳才钻出巷子。这梁子结深了。', style: '凶' } }] } }] }
        ]
      }
    ]
  });

  G.define('event', {
    id: 'ev_leiyu_yixiang', title: '雷雨夜',
    text: '这场雷暴来得又急又狠，炸雷一个接一个碾过头顶，天地间白得像昼。雨幕里万物都伏低了——只有你，莫名其妙地不想躲。',
    tags: ['雷', '野外'],
    baseWeight: 9,
    cond: { weather: '雷雨' },
    prefer: { tend: { leifa: 1.0 } },
    choices: [
      {
        text: '立于雨中，看天发雷',
        outcomes: [
          { weight: 5, effects: [
            { tendAdd: { leifa: 4 } },
            { hp: -2 },
            { log: { t: '一道雷劈在不远处。你浑身汗毛倒竖——却不是因为怕。', style: '雷' } }] },
          { weight: 2, cond: { tend: { id: 'leifa', gte: 20 } }, effects: [
            { tendAdd: { leifa: 6 } },
            { qi: 5 },
            { insight: { id: 'erhou_leiming', title: '耳后雷鸣', t: '天上打雷，我骨头里也在打。它们认识。', confirm: true } },
            { log: { t: '天雷未落，你骨缝里的细雷先响了半拍。', style: '雷' } }] },
          { weight: 3, effects: [
            { hp: -6 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '雷没等到，淋了个透心凉，回去打了三天喷嚏。', style: '平' } }] }
        ]
      },
      {
        text: '寻地方避一避',
        outcomes: [
          { weight: 6, effects: [
            { counterAdd: { xinmo: -1 } },
            { log: { t: '檐下听雨，雷声隔着一层瓦，竟有些催眠。', style: '平' } }] },
          { weight: 4, effects: [
            { roll: { chance: 0.5,
              success: [
                { npcFavAdd: { id: 'jiedao_sanxiu', n: 2 } },
                { tendAdd: { yinguo: 1 } },
                { log: { t: '同檐避雨的外乡客打量你半晌：「面生。骨头倒不错。」', style: '平' } }],
              fail: [
                { tendAdd: { lianti: 1 } },
                { hp: 2 },
                { log: { t: '避雨的山洞里有个樵夫。你帮他把柴捆扛到了官道。', style: '平' } }] } }] }
        ]
      },
      {
        text: '登高引雷淬身',
        cond: { daoStage: { id: 'leifa', gte: 1 } },
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { leifa: 8 } },
            { hp: -10 },
            { qi: 8 },
            { log: { t: '你摊掌立于崖头。雷光过处，指尖焦黑，丹田烫得发亮。', style: '雷' } }] },
          { weight: 4, effects: [
            { hp: -20 },
            { injure: { months: 1, severity: 1 } },
            { tendAdd: { leifa: 4 } },
            { log: { t: '那道雷没客气。你在泥里躺到雨停，半边身子又麻又痛。', style: '凶' } }] }
        ]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 四、链式 / 状态触发事件
  // ═══════════════════════════════════════════

  // 狼群报复（契约 §6 范例引用的 id；由杀狼类 outcome eventDelay 点名）
  G.define('event', {
    id: 'ev_langqun_baofu', title: '狼群夜围',
    queueOnly: true, baseWeight: 0,
    text: '你最近欠下的血债，狼群记下了。这天夜里，此起彼伏的狼嚎围着你的住处转了大半夜，爪子挠门的声音停了又起——它们找上门来了。',
    tags: ['狼', '夜', '险地'],
    choices: [
      {
        text: '开门迎战',
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'yaolang',
            intro: '门一开，雪地里十几双绿眼睛齐齐看来。正中那头率先扑上！',
            onWin: [
              { wvarAdd: { wolfThreat: -10 } },
              { counterAdd: { xuexing: 3, shaqi: 2 } },
              { tendAdd: { xuejian: 5 } },
              { fame: 5 },
              { rumorAdd: { t: '狼群夜里围了他的屋。天亮时狼倒了一片，人没事。', fame: 3 } }],
            onFlee: [
              { money: -5 },
              { counterAdd: { xinmo: 2 } },
              { log: { t: '你弃屋而走。天亮回来，家当被拱了个底朝天。', style: '凶' } }] } }
        ] }]
      },
      {
        text: '死守门户到天明',
        outcomes: [
          { weight: 6, effects: [
            { counterAdd: { xinmo: 2 } },
            { tendAdd: { lianti: 2 } },
            { wvarAdd: { villageFear: 4 } },
            { log: { t: '天亮后你拔下门板：爪痕有指节深，门轴都挠松了。', style: '凶' } }] },
          { weight: 4, effects: [
            { combat: { enemy: 'yelang',
              intro: '哗啦一声，一头野狼撞破窗棂跳了进来！',
              onWin: [{ counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } },
                      { log: { t: '屋里见了血，窗外的狼嚎反而渐渐散了。', style: '血' } }],
              onFlee: [{ hp: -4 }, { log: { t: '你从后窗滚出去，在柴垛里蹲到天亮。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '泼烈酒乱其嗅觉',
        cond: { item: { id: 'shaodaozi', n: 1 } },
        outcomes: [{ weight: 1, effects: [
          { itemDel: { id: 'shaodaozi', n: 1 } },
          { counterAdd: { xuexing: -3 } },
          { wvarAdd: { wolfThreat: -2 } },
          { log: { t: '你绕屋泼了一圈烈酒。狼群在呛人的酒气里失了准头。', style: '平' } },
          { log: { t: '后半夜，狼嚎悻悻地远了。', style: '平' } }
        ] }]
      }
    ]
  });

  // 丹毒反噬（counter dandu 高时的资格事件）
  G.define('event', {
    id: 'ev_dandu_fanshi', title: '药账翻身',
    text: '这些日子吞下去的丹药，在今夜一起翻了账。子时刚过，一股焦苦自丹田直冲天灵，你的指甲缝里，渗出乌黑的血珠。',
    tags: ['药', '危险'],
    baseWeight: 14,
    cond: { counter: { id: 'dandu', gte: 25 } },
    prefer: { tend: { danyao: 0.6 } },
    choices: [
      {
        text: '盘膝硬压',
        outcomes: [
          { weight: 5, effects: [
            { counterAdd: { dandu: -8 } },
            { hp: -8 },
            { tendAdd: { lianti: 2 } },
            { log: { t: '天亮时你瘫在汗里，指缝的黑血总算淡了。', style: '丹' } }] },
          { weight: 3, effects: [
            { hp: -16 },
            { injure: { months: 1, severity: 1 } },
            { counterAdd: { dandu: -5 } },
            { log: { t: '毒火走窜，你昏死过去半日。醒来嘴里全是铁锈味。', style: '凶' } }] },
          { weight: 2, cond: { tend: { id: 'lianti', gte: 30 } }, effects: [
            { counterAdd: { dandu: -12 } },
            { statAdd: { ti: 1 } },
            { tendAdd: { lianti: 4 } },
            { log: { t: '毒火烧过的筋肉重新长拢时，硬得像淬过的铁。', style: '体' } }] }
        ]
      },
      {
        text: '去回春堂求解',
        cond: { money: { gte: 15 } },
        outcomes: [{ weight: 1, effects: [
          { money: -15 },
          { counterAdd: { dandu: -15 } },
          { npcFavAdd: { id: 'yaopu_laoban', n: 3 } },
          { tendAdd: { danyao: 2 } },
          { log: { t: '掌柜的把着脉骂了你半个时辰，药倒是给得实在。', style: '丹' } }
        ] }]
      },
      {
        text: '以毒攻毒，再吞一粒',
        cond: { item: { id: 'ningqi_dan', n: 1 } },
        outcomes: [{ weight: 1, effects: [
          { itemDel: { id: 'ningqi_dan', n: 1 } },
          { roll: { chance: 0.5,
            success: [
              { cult: 18 },
              { counterAdd: { dandu: 2 } },
              { tendAdd: { danyao: 5 } },
              { log: { t: '两股药力在体内相争，竟教你引着它们彼此烧尽了。', style: '丹' } }],
            fail: [
              { hp: -20 },
              { counterAdd: { dandu: 8 } },
              { injure: { months: 1, severity: 1 } },
              { log: { t: '火上浇油。你疼得在地上蜷成一团，悔得直咬牙。', style: '凶' } }] } }
        ] }]
      }
    ]
  });

  // 血腥味招狼（counter xuexing 高时的资格事件）
  G.define('event', {
    id: 'ev_xingfeng_yelang', title: '腥风不散',
    text: '你身上的血腥味，洗了几水也不曾干净。下风口的林子里，跟了你一路的那几条灰影，终于不再掩饰脚步。',
    tags: ['狼', '血', '野外'],
    baseWeight: 12,
    cond: { counter: { id: 'xuexing', gte: 8 },
            any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }, { loc: 'feikuang' }] },
    prefer: { tend: { xuejian: 0.5 }, wvar: [{ id: 'wolfThreat', gte: 40, boost: 1.5 }] },
    choices: [
      {
        text: '转身，亮刃',
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'yelang',
            intro: '既然躲不掉，那就来。你转身的瞬间，狼也动了。',
            onWin: [
              { counterAdd: { xuexing: 2 } },
              { tendAdd: { xuejian: 3 } },
              { wvarAdd: { wolfThreat: -3 } },
              { insight: { id: 'xuexing_yinlang', title: '腥气引狼', t: '身上血味重的日子，狼就来。它们是循着味来的。', confirm: true } }],
            onFlee: [{ hp: -4 }, { counterAdd: { xinmo: 1 } }, { log: { t: '你且战且退。血味没散，它们还会再来。', style: '凶' } }] } }
        ] }]
      },
      {
        text: '脱下血衣，弃在下风口',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xuexing: -6 } },
          { money: -2 },
          { tendAdd: { yinguo: 1 } },
          { log: { t: '狼群围着那件破衣撕扯。你赤着膀子，捡回一条命。', style: '平' } }
        ] }]
      },
      {
        text: '站定，与它们对视',
        cond: { any: [{ counter: { id: 'shaqi', gte: 10 } }, { fame: { gte: 50 } }] },
        outcomes: [
          { weight: 6, effects: [
            { fame: 3 },
            { counterAdd: { shaqi: 1 } },
            { rumorAdd: { t: '有人说亲眼看见狼群冲他低了头。鬼才信。', fame: 1 } },
            { log: { t: '你不动，它们便不敢动。半炷香后，灰影退散。', style: '平' } }] },
          { weight: 4, effects: [
            { combat: { enemy: 'yelang',
              intro: '领头那条没被你唬住——饿，压过了怕。',
              onWin: [{ counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } }],
              onFlee: [{ hp: -4 }, { log: { t: '你边退边挥刃，总算退到了开阔地。', style: '凶' } }] } }] }
        ]
      }
    ]
  });

  // 复仇线 · 二：夜窥演武（pflag wuguan_shouru 解锁；得情报 mem_intel_dashixiong）
  G.define('event', {
    id: 'ev_yekui_yanwu', title: '后院拳声',
    text: '馆里人都睡了，后院却有闷雷似的拳风声。你贴墙望去——是大师兄在加练，一遍，又一遍。原来他白日里那身功夫，也不是天上掉下来的。',
    tags: ['体', '隐秘', '夜'],
    baseWeight: 11,
    cond: { loc: 'wuguan', pflag: 'wuguan_shouru', not: { mem: 'mem_intel_dashixiong' } },
    prefer: { tend: { lianti: 0.6 }, locTags: ['体'] },
    choices: [
      {
        text: '伏在墙头，看到底',
        outcomes: [
          { weight: 6, effects: [
            { memAdd: 'mem_intel_dashixiong' },
            { tendAdd: { lianti: 4 } },
            { insight: { id: 'quanjiao_mendao', title: '拳脚门道', t: '他的崩拳起手必先沉左肩。看了一整夜，我记死了。', confirm: true } },
            { log: { t: '你趴到下半夜，膝盖冻得失了知觉，眼睛却越来越亮。', style: '体' } }] },
          { weight: 4, effects: [
            { hp: -5 },
            { counterAdd: { xinmo: 3 } },
            { npcFavAdd: { id: 'dashixiong', n: -3 } },
            { log: { t: '一颗石子崩飞你脚边的瓦。「偷师的贼骨头。」', style: '凶' } },
            { log: { t: '他甚至没有回头。', style: '凶' } }] }
        ]
      },
      {
        text: '学着比划一遍',
        outcomes: [
          { weight: 5, effects: [
            { tendAdd: { lianti: 3 } },
            { hp: -3 },
            { log: { t: '你在柴房照影子比划，摔了七八个跟头。有一下像了。', style: '体' } }] },
          { weight: 3, cond: { stat: { id: 'ti', gte: 5 } }, effects: [
            { tendAdd: { lianti: 5 } },
            { log: { t: '那一拳的腰劲你居然接住了。皮肉记东西，比脑子牢。', style: '体' } }] }
        ]
      },
      {
        text: '回去睡觉',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 1 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你把那股劲咽回肚里。拳声敲了一夜，敲在你梦里。', style: '平' } }
        ] }]
      }
    ]
  });

  // 复仇线 · 三：当众之辱 → 立誓（eventDelay 挂两年之约）
  G.define('event', {
    id: 'ev_wuguan_zaiwu', title: '人桩',
    text: '演武场点到你的名：大师兄要演一趟新拳，缺个「桩子」。满院的目光把你架到场中。他活动着腕骨，慢条斯理：「站好。我只用三成力。」',
    tags: ['体', '恶'],
    baseWeight: 9,
    cond: { loc: 'wuguan', pflag: 'wuguan_shouru', nopflag: 'fuchou_lixia' },
    prefer: { tend: { lianti: 0.4 }, locTags: ['体'] },
    choices: [
      {
        text: '站桩，硬接三拳',
        outcomes: [{ weight: 1, effects: [
          { hp: -12 },
          { tendAdd: { lianti: 5 } },
          { counterAdd: { xinmo: 3 } },
          { pflagSet: { id: 'ai_le_sanquan' } },
          { npcFavAdd: { id: 'dashixiong', n: 3 } },
          { log: { t: '第三拳你没有退。他收手时，眼里头一回有了点别的。', style: '体' } }
        ] }]
      },
      {
        text: '闪身躲开，落他面子',
        cond: { stat: { id: 'min', gte: 5 } },
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'dashixiong', n: -6 } },
          { fame: 3 },
          { counterAdd: { xinmo: 1 } },
          { pflagSet: { id: 'duo_guo_sanquan' } },
          { rumorAdd: { t: '大师兄三拳没碰着一个杂役的衣角，武馆的脸没处搁了。', fame: 2 } },
          { log: { t: '第三拳擦着你的耳根落空。满院死一样的静。', style: '平' } }
        ] }]
      },
      {
        text: '立誓两年后再来领教',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'fuchou_lixia' } },
          { counterAdd: { xinmo: 2, shaqi: 1 } },
          { tendAdd: { yinguo: 3 } },
          { npcFavAdd: { id: 'dashixiong', n: -2 } },
          { eventDelay: { id: 'ev_fuchou_zhi_zhan', months: 24, note: '武馆之约：两年之期' } },
          { rumorAdd: { t: '那杂役当众放话，两年后要接大师兄全力一拳。满馆笑了三天。', fame: 0 } },
          { log: { t: '「记下了。」他笑着摆手，像听一个孩子说要摘月亮。', style: '因果' } }
        ] }]
      }
    ]
  });

  // 复仇线 · 终：武馆之约（queueOnly，由立誓 eventDelay 点名；可再约）
  G.define('event', {
    id: 'ev_fuchou_zhi_zhan', title: '武馆之约',
    queueOnly: true, baseWeight: 0,
    // 到期复检：大师兄已入仙门离镇，则两年之约自然作废，不再硬把人召回打这一场
    dueCond: { noflag: 'dashixiong_li_guan' },
    textFn: function () {
      return '约定之期到了。演武场上的人比那天多出数倍——没人忘了当年那个' +
        (G.player.birthId === 'wuguan_zayi' ? '杂役' : '后生') +
        '放下的话。大师兄解下外袍，活动着腕骨走到场心，朝你伸出手，掌心向上，勾了勾。';
    },
    tags: ['体', '因果'],
    choices: [
      {
        text: '践约，上台',
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'dashixiong_boss',
            intro: '满场死寂。他这一次，从起手式开始。',
            onWin: [
              { bossSet: { enemy: 'dashixiong_boss', alive: false } },
              { legacySet: { id: 'dashixiong_defeated' } },
              { fame: 20 },
              { npcFavAdd: { id: 'dashixiong', n: 15 } },
              { tendAdd: { lianti: 5 } },
              { pflagSet: { id: 'fuchou_dechang' } },
              { rumorAdd: { t: '当年的赌约有了下文：他当众接下大师兄全力一击，还了一拳。', fame: 10 } }],
            onLose: [
              { counterAdd: { xinmo: 4 } },
              { pflagSet: { id: 'fuchou_lixia', v: false } },
              { log: { t: '他把你从台上扶起来，声音不大：「两年，不够。再来。」', style: '体' } }],
            onFlee: [
              { fame: -5 },
              { counterAdd: { xinmo: 5 } },
              { pflagSet: { id: 'fuchou_lixia', v: false } },
              { rumorAdd: { t: '到了约期，那人却跳下了台。武馆又笑了半个月。', fame: 0 } }] } }
        ] }]
      },
      {
        text: '不去。还不是时候',
        outcomes: [{ weight: 1, effects: [
          { fame: -3 },
          { counterAdd: { xinmo: 5 } },
          { pflagSet: { id: 'fuchou_lixia', v: false } },
          { rumorAdd: { t: '说大话的那位到了日子没露面。武馆门口贴了三天告示。', fame: 0 } },
          { log: { t: '那一日你背对武馆坐了一天。这口气，咽下去更沉了。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 五、基建样例保留（狼袭 / 刃上微鸣）
  // ═══════════════════════════════════════════

  G.define('event', {
    id: 'ev_langxi', title: '狼袭',
    text: '风向变了。你后颈的汗毛根根竖起——草木深处，几点绿油油的光正朝你围拢过来。',
    tags: ['狼', '险地'],
    baseWeight: 14, once: false,
    cond: { any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }] },
    prefer: {
      tend: { xuejian: 0.5 },
      locTags: ['狼'],
      wvar: [{ id: 'wolfThreat', gte: 50, boost: 1.8 }]
    },
    choices: [
      {
        text: '拔刃迎上',
        outcomes: [{ weight: 1, effects: [
          { combat: {
            enemy: 'yelang',
            intro: '你反手握刃，迎着那点绿光踏前一步！',
            onWin: [
              { wvarAdd: { wolfThreat: -3 } },
              { counterAdd: { xuexing: 2 } },
              { tendAdd: { xuejian: 3 } },
              { log: { t: '你拖着狼尸下山，雪地里一路血痕。', style: '血' } }
            ],
            onFlee: [{ log: { t: '你且战且退，总算甩脱了狼群。', style: '凶' } }]
          } }
        ] }]
      },
      {
        text: '屏息缓缓后退',
        outcomes: [
          { weight: 6, cond: { stat: { id: 'min', gte: 4 } }, effects: [
            { tendAdd: { yinguo: 1 } },
            { log: { t: '你贴着背风处一步步退出了它们的领地。狼群没有追。', style: '平' } }] },
          { weight: 4, effects: [
            { log: { t: '一根枯枝在你脚下断裂——绿光齐刷刷地转了过来！', style: '凶' } },
            { combat: { enemy: 'yelang', intro: '退路已断，野狼扑了上来！',
              onWin: [{ counterAdd: { xuexing: 2 } }, { tendAdd: { xuejian: 2 } }],
              onFlee: [{ log: { t: '你丢盔弃甲地逃下了山。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '掷出干粮，诱狼分神',
        cond: { item: { id: 'ganliang', n: 1 } },
        outcomes: [{ weight: 1, effects: [
          { itemDel: { id: 'ganliang', n: 1 } },
          { tendAdd: { danyao: 1 } },
          { log: { t: '狼群扑向干粮的工夫，你已退出半里地。破财免灾。', style: '平' } }
        ] }]
      }
    ]
  });

  G.define('event', {
    id: 'ev_jianming_chuxian', title: '刃上微鸣',
    text: '深夜换药时，你又听见了——极轻的一声嗡鸣，自枕边的刀刃传来。伤口的血还未干，刃身竟微微发烫，像一只贴上来索食的兽。',
    tags: ['隐秘', '血', '剑'],
    baseWeight: 8, once: true,
    cond: { daoStage: { id: 'xuejian', gte: 1 } },
    prefer: { tend: { xuejian: 1.0 } },
    choices: [
      {
        text: '握紧它，看它要做什么',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xuejian: 5 } },
          { insight: { id: 'shanghou_jianming', t: '它在回应血，不是回应伤。我喂了它一次，它安静了。', confirm: true } },
          { log: { t: '刃身的热意顺着掌纹爬上手臂，半晌才退。你出了一身汗。', style: '血' } }
        ] }]
      },
      {
        text: '把它丢去屋角，离远些',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xuejian: -3 } },
          { counterAdd: { xinmo: 2 } },
          { insight: { id: 'shanghou_jianming', t: '我把它丢远了。夜里它还在响，像在等我捡回去。' } },
          { log: { t: '你整夜没睡好。屋角的嗡鸣时断时续，到天亮才停。', style: '凶' } }
        ] }]
      }
    ]
  });
})();
