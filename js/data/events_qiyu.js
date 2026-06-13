// js/data/events_qiyu.js — 奇遇事件（Owner: C3）。
//
// 奇遇范式（契约 §8）：高门槛 cond、低 baseWeight、once:true 为主、tags 含「奇遇」。
// 同一奇遇靠 choices 的 cond 给不同倾向的人看不同选项（旗舰示范：古炉残方五分支），绝不暴露标签。
//
// ── 本文件对外输出与登记 ──
// 旗舰：ev_gulu_canfang（古炉残方，DESIGN §四.7 五分支）＋ 跟进 ev_yaozhai_huixiang（queueOnly）。
// 钉死奇遇：ev_duanjianya（cond mem_duanjianya）/ ev_langgu_huangqiu（cond legacy langwang_slain）/
//   ev_kuangdong_languang / ev_leichi_canwen（雷雨限定）/ ev_yaowang_gufang / ev_miaodi_diyu /
//   ev_qianshi_zhihen（{life:{gte:2}} 轮回者限定）。
// 时限机缘（NPC 可抢）：ev_hantan_chuanwen → ev_hantan_qibao（去取）/ ev_hantan_jieju（queueOnly 到期，
//   拖延则外门巡使取走：flagSet hantan_bei_qu + 传闻）。
// 发放记忆（仅允许清单内 id，C1 定义）：mem_kuangdong_languang / mem_leichi_canwen / mem_yaofang_gufang /
//   mem_miaodi_diyu / mem_intel_langwang（ev_guzhong_canbei）/ mem_intel_xieying（ev_houdian_menfeng）。
//   （mem_duanjianya / mem_intel_shiwang / mem_intel_dashixiong 在 events_main.js 发放。）
// 新增物品：gulu_yidan / canjian_yinhen / langwang_tougu / lanyingshi / hansui_zhu / jingdi_hantie / leijimu_xin。
// 新增 pflag：gulu_xueqi / yaozhai_zhuisuo / hantan_de_bao / jian_miaodi_shijie / ke_le_xinhen / kuidi_jiuge（主文件）。
// 新增 world flag：jihui_hantan / hantan_bei_qu。消费 C1 pflag：xianghuo_yinji、kanjian_dierzhuxiang（主文件落）。
//
// TODO-INTEGRATION: 建议 C4 给 shanmiao_xieying 配 intelMem:'mem_intel_xieying'（ev_houdian_menfeng 已发放）。
// TODO-INTEGRATION: pflag jian_miaodi_shijie（撬开庙底见石阶）留给 C2 山神庙「探地宫」类行动作 cond。
// TODO-INTEGRATION: langwang_tougu 暂为收藏/变卖品；若引擎日后支持「信物/佩饰」栏可升级为威压加成物。
//
// ── 自检十问（对文件整体，以古炉残方为代表）──
// 1标签：奇遇+各道元素，分布五道与因果。2易共现：高门槛地点（深山/矿底/庙底）、对应天时（雷雨）、对应身世
//   与记忆（柜底九格/香火印记/前世痕）。3排斥：低龄低险的镇内日常；once:true 不复现。4改状态：每个 outcome
//   至少一个非 log op（物品/记忆/倾向/flag/战斗/属性）。5后果：记忆跨世携带、时限机缘被抢落 flag 起传闻、
//   药债牵出回春堂旧账。6可解释：炉是古修遗物、崖是古战场、潭光遭樵夫撞见所以藏不住——机缘有来路，被抢有去向。
// 7钩子：eventDelay（药债/寒潭到期）、pflag（地宫石阶）、legacy 消费（狼骨荒丘）。8有趣选择：普通人三条稳路，
//   有「经历」的人各开一扇暗门。9服务 build：五分支各喂一道；断剑崖喂血剑、雷池喂雷法、老井喂炼体。
// 10不暴露：所有暗门选项只写行为（滴血/辨灰/引雷/追债），不写道名标签；倾向数值永不见文案。
(function () {
  'use strict';

  // ════════ 本文件新增物品 ════════
  G.define('item', {
    id: 'gulu_yidan', name: '古炉遗丹', type: 'consumable', price: 45,
    desc: '从古丹炉死灰里扒出的乌色药丸，坚硬如石，隐有暖香。',
    use: [{ cult: 28 }, { counterAdd: { dandu: 7 } }, { tendAdd: { danyao: 3 } },
          { log: { t: '陈年的丹力悍然化开，气走周天，喉间焦苦三日不散。', style: '丹' } }]
  });
  G.define('item', {
    id: 'canjian_yinhen', name: '残剑·饮恨', type: 'weapon', atk: 9, price: 120,
    desc: '断剑崖顶的暗红古剑，断口如新。入手微烫，似有脉搏。'
  });
  G.define('item', {
    id: 'langwang_tougu', name: '狼王头骨', type: 'misc', price: 80,
    desc: '黑山之王的头骨，左眼眶留着一道旧箭痕。兽类见之辟易。'
  });
  G.define('item', {
    id: 'lanyingshi', name: '蓝萤石', type: 'material', price: 30,
    desc: '矿底裂缝里凿出的石头，幽幽发蓝，入夜光不熄。'
  });
  G.define('item', {
    id: 'hansui_zhu', name: '寒髓珠', type: 'consumable', price: 90,
    desc: '北谷寒潭心浮沉百年的珠子，触手生温，凝神如洗。',
    use: [{ statAdd: { shen: 1 } }, { qi: 10 },
          { log: { t: '珠化清凉自眉心散开，耳目澄明，连呼吸都静了。', style: '吉' } }]
  });
  G.define('item', {
    id: 'jingdi_hantie', name: '井底寒铁', type: 'material', price: 30,
    desc: '老井最深处凿下的黑铁，盛夏握着也冰手。是打兵器的好料。'
  });
  G.define('item', {
    id: 'leijimu_xin', name: '雷击木心', type: 'consumable', price: 22,
    desc: '遭天雷劈开的古松木心，白亮如骨，丝丝缕缕渗着麻意。',
    use: [{ tendAdd: { leifa: 3 } }, { cult: 6 },
          { log: { t: '木心含在舌下，一线麻意顺着牙根爬进后颈。', style: '雷' } }]
  });

  // ═══════════════════════════════════════════
  // 旗舰奇遇：古炉残方（DESIGN_PROMPT §四.7 五分支范式）
  // 普通人三选项；丹药经验/血异象/雷倾向/因果倾向各开一扇暗门（choices.cond，不暴露标签）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_gulu_canfang', title: '古炉残方',
    text: '巨岩之下，你发现半座塌进山土的古丹炉。炉口积灰盈尺，灰下却隐有暗红余温——这炉子灭了不知多少年，竟还没凉透。炉壁上錾着半篇药方，后半截连同炉身，一起断进了土里。',
    tags: ['奇遇', '药', '隐秘'],
    baseWeight: 4, once: true,
    cond: { loc: 'heishan_shenchu' },
    prefer: { tend: { danyao: 0.8 }, locTags: ['隐秘'] },
    choices: [
      {
        text: '搜索炉底',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'gulu_yidan', n: 1 } },
            { tendAdd: { danyao: 2 } },
            { log: { t: '死灰深处摸出一粒乌丸，硬得硌手，香得醒神。', style: '丹' } }] },
          { weight: 3, effects: [
            { hp: -4 },
            { itemAdd: { id: 'ningxuecao', n: 1 } },
            { log: { t: '灰下余火烫了你满手燎泡。只刨出几株药草的焦根。', style: '凶' } }] },
          { weight: 2, effects: [
            { combat: { enemy: 'yaoren',
              intro: '炉灰无风自动——一具周身药斑的东西从炉后撑了起来。守炉的人，成了炉养的东西。',
              onWin: [{ tendAdd: { danyao: 2 } }, { itemAdd: { id: 'ningxuecao', n: 2 } },
                      { log: { t: '它倒下时朝丹炉爬了半尺。到死都在守。', style: '凶' } }],
              onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你退出山坳。背后传来灰烬被翻动的沙沙声。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '敲下一块炉壁',
        outcomes: [
          { weight: 6, effects: [
            { money: 10 },
            { tendAdd: { lianti: 1 } },
            { log: { t: '炉铁入手极沉。镇上铁匠掂了掂，给了个不敢还价的数。', style: '吉' } }] },
          { weight: 4, effects: [
            { hp: -8 },
            { locvarAdd: { loc: 'heishan_shenchu', key: 'danger', n: 3 } },
            { log: { t: '锤声未落，半面炉壁轰然塌下，你躲得慢了半步。', style: '凶' } }] }
        ]
      },
      {
        text: '离开',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { log: { t: '炉前的土拱起一圈，像座没立碑的坟。你作了个揖，走了。', style: '因果' } }
        ] }]
      },
      {
        text: '辨认炉灰中的药性',
        cond: { tend: { id: 'danyao', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { danyao: 7 } },
          { itemAdd: { id: 'gulu_yidan', n: 1 } },
          { insight: { id: 'shegen_yaoxiang', title: '舌根药香', t: '炉灰里至少熬过九味主药，是壮血续命的路子。我认得出了。', confirm: true } },
          { log: { t: '你捻灰一嗅，百年前那一炉药，在你舌根上活了过来。', style: '丹' } }
        ] }]
      },
      {
        text: '将自己的血滴入炉中',
        cond: { tend: { id: 'xuejian', gte: 40 } },
        outcomes: [{ weight: 1, effects: [
          { hp: -10 },
          { tendAdd: { xuejian: 8 } },
          { counterAdd: { xuexing: 2 } },
          { qi: 6 },
          { pflagSet: { id: 'gulu_xueqi' } },
          { insight: { id: 'shanghou_jianming', t: '那座死炉喝了我的血，炉心竟跳了一下。血这东西，什么都认。', confirm: true } },
          { log: { t: '血珠落进炉心，满炉死灰无风自旋，排成一圈古字，散了。', style: '血' } }
        ] }]
      },
      {
        text: '尝试以雷火重启炉心',
        cond: { tend: { id: 'leifa', gte: 25 } },
        outcomes: [
          { weight: 6, effects: [
            { qi: -8 },
            { itemAdd: { id: 'gulu_yidan', n: 2 } },
            { tendAdd: { leifa: 6 } },
            { log: { t: '你引一缕麻意度入炉心。死火复明的一瞬，两粒遗丹托灰而出。', style: '雷' } }] },
          { weight: 4, effects: [
            { qi: -8 },
            { hp: -12 },
            { injure: { months: 1, severity: 1 } },
            { tendAdd: { leifa: 3 } },
            { log: { t: '炉心炸开一蓬火星，你半条手臂焦了皮。百年死炉，脾气还在。', style: '凶' } }] }
        ]
      },
      {
        text: '追索炉前死去之人的药债',
        cond: { tend: { id: 'yinguo', gte: 30 } },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 8 } },
          { pflagSet: { id: 'yaozhai_zhuisuo' } },
          { eventDelay: { id: 'ev_yaozhai_huixiang', months: 2, note: '药债的线被牵动了' } },
          { insight: { id: 'jishi_zhimeng', title: '既视之梦', t: '炉前死过人。他欠的债没还完，线还连在活人身上——通向镇里。', confirm: true } },
          { log: { t: '你闭目按住炉壁。无数细线自炉中漫出，散于风里。', style: '因果' } },
          { log: { t: '唯有一根又细又韧，一路指向青石镇。', style: '因果' } }
        ] }]
      }
    ]
  });

  // 古炉跟进：药债回响（queueOnly，由追索药债 eventDelay 点名）
  G.define('event', {
    id: 'ev_yaozhai_huixiang', title: '药债回响',
    queueOnly: true, once: true, baseWeight: 0,
    text: '顺着那根线，你在镇上找到了线的另一头——回春堂。掌柜的听完你说的山中古炉，脸色一点点白下去，半晌，从柜底最深处摸出一只油纸包：「祖上替人看炉，亏过一味药。这账，压了回春堂三代人。」',
    tags: ['奇遇', '因果', '药'],
    choices: [
      {
        text: '替故人收下这笔债',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'liaoshang_yao', n: 2 } },
          { money: 20 },
          { npcFavAdd: { id: 'yaopu_laoban', n: 8 } },
          { tendAdd: { yinguo: 4 } },
          { log: { t: '「替他收了，就是替他了了。」掌柜的长揖到地。', style: '因果' } }
        ] }]
      },
      {
        text: '替他把这笔债勾了',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 6 } },
          { npcFavAdd: { id: 'yaopu_laoban', n: 15 } },
          { counterAdd: { xinmo: -3 } },
          { rumorAdd: { t: '回春堂的掌柜近来轻快得很，称药给得格外足。', fame: 1 } },
          { log: { t: '你抬手在空中虚虚一抹。那根线断了。', style: '因果' } },
          { log: { t: '掌柜的肩头，肉眼可见地松了下来。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 断剑崖（血剑机缘；cond {mem:"mem_duanjianya"}，记忆在 events_main 深山观望发放、跨世可携带）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_duanjianya', title: '断剑崖',
    text: '照着烙在识海里的那幅画面，你拨开最后一道藤幕——断剑崖到了。崖壁上插满锈剑，成百上千，柄柄朝外，像一面竖起的铁鬃。唯有崖顶孤零零一柄，完好如新，剑身暗红，在风里轻轻地鸣。',
    tags: ['奇遇', '剑', '血', '隐秘'],
    baseWeight: 8, once: true,
    cond: { loc: 'heishan_shenchu', mem: 'mem_duanjianya' },
    prefer: { tend: { xuejian: 1.0 }, locTags: ['血'] },
    choices: [
      {
        text: '攀上崖顶，拔那柄剑',
        outcomes: [
          { weight: 3, effects: [
            { hp: -8 },
            { itemAdd: { id: 'canjian_yinhen', n: 1 } },
            { tendAdd: { xuejian: 6 } },
            { counterAdd: { xuexing: 2 } },
            { log: { t: '你攀得满手是血。握住剑柄的一瞬，满崖锈剑齐齐一颤。', style: '血' } }] },
          { weight: 7, cond: { tend: { id: 'xuejian', gte: 40 } }, effects: [
            { hp: -12 },
            { itemAdd: { id: 'canjian_yinhen', n: 1 } },
            { tendAdd: { xuejian: 10 } },
            { counterAdd: { xuexing: 3 } },
            { insight: { id: 'shanghou_jianming', t: '断剑崖上千剑皆死，只有它活着。它等的不是人，是血。', confirm: true } },
            { log: { t: '你的血顺着掌纹漫上剑身。暗红剑身亮如初淬。', style: '血' } },
            { log: { t: '崖下千柄锈剑，在那一刻齐齐垂首。', style: '异象' } }] }
        ]
      },
      {
        text: '取一柄崖下锈剑',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'tiejian', n: 1 } },
          { tendAdd: { xuejian: 2 } },
          { log: { t: '锈剑出壁簌簌掉渣，好在剑骨未朽，磨磨还能用。', style: '平' } }
        ] }]
      },
      {
        text: '在崖前静坐一夜',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 4 } },
          { qi: 6 },
          { insight: { id: 'jishi_zhimeng', t: '崖上千剑是一场古战的墓碑。梦里我听见了那一战的喊杀。' } },
          { log: { t: '风穿剑林，呜呜如万人低语。天亮时你衣上覆了层剑锈。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 狼骨荒丘（前世痕迹奇遇！cond {legacy:"langwang_slain"}：前世杀了狼王，这一世才有这座丘）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_langgu_huangqiu', title: '狼骨荒丘',
    text: '林海深处有一座灰白的小丘——走近才看清，那是狼骨堆成的。成百上千具狼骸拱卫着丘顶一具小马驹大小的巨狼骨架，骨架左眼眶上，一道旧伤痕清晰可见。你说不清为什么，你认得它。它好像也还认得你。',
    tags: ['奇遇', '狼', '因果', '隐秘'],
    baseWeight: 6, once: true,
    cond: { loc: 'heishan_shenchu', legacy: 'langwang_slain' },
    prefer: { tend: { yinguo: 0.8 }, locTags: ['狼'] },
    choices: [
      {
        text: '登丘，取狼王头骨',
        outcomes: [
          { weight: 6, effects: [
            { itemAdd: { id: 'langwang_tougu', n: 1 } },
            { counterAdd: { shaqi: 2 } },
            { fame: 5 },
            { rumorAdd: { t: '有人从黑山深处背回一颗狼王头骨，镇口的狗吓得三天没叫。', fame: 3 } },
            { log: { t: '你伸手抱起头骨。满丘白骨咔咔轻响，却无一根敢动。', style: '凶' } }] },
          { weight: 4, effects: [
            { combat: { enemy: 'yaolang',
              intro: '你的脚刚踏上骨丘，守陵的狼群自四面林影中无声合围。',
              onWin: [{ itemAdd: { id: 'langwang_tougu', n: 1 } }, { counterAdd: { xuexing: 3 } }, { tendAdd: { xuejian: 3 } },
                      { log: { t: '守陵的狼退散了。你抱走了它们王的头骨。', style: '血' } }],
              onFlee: [{ counterAdd: { xinmo: 2 } }, { log: { t: '你退下骨丘。狼群不追，只目送——像在替谁守诺。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '在丘前坐到日落',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 5 } },
          { counterAdd: { xinmo: -2 } },
          { insight: { id: 'jishi_zhimeng', t: '那座狼骨丘是冲着一个死人垒的。我梦见过它活着的样子——在另一世。', confirm: true } },
          { log: { t: '日头西沉，丘顶骨架镀了层金边。前尘旧债，两讫了。', style: '因果' } }
        ] }]
      },
      {
        text: '拜三拜，原路退走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 3 } },
          { counterAdd: { shaqi: -2 } },
          { log: { t: '你对着骨丘拜了三拜。转身时，四面林子里响起低低狼吟。', style: '因果' } },
          { log: { t: '不是示威。像送行。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 矿底蓝光（发放 mem_kuangdong_languang）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_kuangdong_languang', title: '矿底蓝光',
    text: '火光照不到的最深处，岩壁裂缝里渗出一线幽幽的蓝。那光不跳不闪，稳得不像火；不暖不灼，凉得不像光。裂缝太窄，人过不去——光却从你的眼睛，一直照进心里去。',
    tags: ['奇遇', '矿', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'feikuang' },
    prefer: { locTags: ['矿'], wvar: [{ id: 'mineInstability', gte: 40, boost: 1.4 }] },
    choices: [
      {
        text: '抡镐凿宽裂缝',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'lanyingshi', n: 1 } },
            { memAdd: 'mem_kuangdong_languang' },
            { locvarAdd: { loc: 'feikuang', key: 'danger', n: 3 } },
            { log: { t: '你凿下一块蓝莹莹的石头，掌心一凉。', style: '吉' } },
            { log: { t: '可裂缝深处的那片蓝，纹丝没有变淡。', style: '凶' } }] },
          { weight: 5, effects: [
            { hp: -10 },
            { injure: { months: 1, severity: 1 } },
            { memAdd: 'mem_kuangdong_languang' },
            { log: { t: '第三镐落下，头顶岩层呻吟着垮了一角。你连滚带爬。', style: '凶' } },
            { log: { t: '逃出生天，闭上眼，满眼还是那片蓝。', style: '异象' } }] }
        ]
      },
      {
        text: '把眼睛凑上去看',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_kuangdong_languang' },
          { counterAdd: { xinmo: 2 } },
          { tendAdd: { yinguo: 3 } },
          { insight: { id: 'jishi_zhimeng', t: '矿底蓝光的深处有东西在动。很慢，很大，很冷。' } },
          { log: { t: '你看了多久，记不清了。火折子烧到指尖才把你烫醒。', style: '凶' } }
        ] }]
      },
      {
        text: '用碎石泥浆封死裂缝',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_kuangdong_languang' },
          { tendAdd: { yinguo: 2 } },
          { locvarAdd: { loc: 'feikuang', key: 'corruption', n: -3 } },
          { log: { t: '有些东西不该见光。你封得很仔细，手却一直在抖。', style: '平' } },
          { log: { t: '当夜阖眼，那道蓝光仍在眼底，不增，不减。', style: '异象' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 雷池残纹（雷雨天限定；发放 mem_leichi_canwen）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_leichi_canwen', title: '雷池残纹',
    text: '炸雷连劈一处山坳，你循光而去：雨水在坳底积成一泓浅池，池底青石上，密密的古纹随每道天雷亮起一次——那纹路在吃雷。而且吃得很香。',
    tags: ['奇遇', '雷', '隐秘'],
    baseWeight: 5, once: true,
    cond: { weather: '雷雨', any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }] },
    prefer: { tend: { leifa: 1.0 } },
    choices: [
      {
        text: '涉水，踏纹而立',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { leifa: 8 } },
            { memAdd: 'mem_leichi_canwen' },
            { qi: 6 },
            { log: { t: '雷光顺着纹路爬上你的脚踝，又麻又烫。', style: '雷' } },
            { log: { t: '你站到雨停。骨头缝里，全是细碎的雷声。', style: '雷' } }] },
          { weight: 4, effects: [
            { hp: -15 },
            { injure: { months: 1, severity: 1 } },
            { tendAdd: { leifa: 5 } },
            { memAdd: 'mem_leichi_canwen' },
            { log: { t: '一道天雷直入池心！你被掀出一丈，半身焦麻。', style: '凶' } },
            { log: { t: '可那篇纹路，你闭着眼也画得出来了。', style: '雷' } }] }
        ]
      },
      {
        text: '在岸边描下纹路',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_leichi_canwen' },
          { tendAdd: { leifa: 3, yinguo: 1 } },
          { insight: { id: 'erhou_leiming', title: '耳后雷鸣', t: '山坳的古纹是雷养出来的。我一笔不差地记下来了。', confirm: true } },
          { log: { t: '你借雷光一笔笔地描。描到后来，是纹往你眼里钻。', style: '雷' } }
        ] }]
      },
      {
        text: '雷太急，避进岩缝',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 1 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '那池雷光在你眼皮底下亮了一夜，你愣是没敢再下去。', style: '平' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 药王古方（发放 mem_yaofang_gufang；咬合 C1 药铺学徒「柜底最后一格」线索）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_yaowang_gufang', title: '药王古方',
    text: '掌柜的醉倒在了后堂，柜底最后一格的铜锁，头一回没有锁上。格子里没有药，只有一只褪色锦囊，囊面绣着一个「王」字——镇上老人提过：回春堂的祖上，给真正的药王爷打过下手。',
    tags: ['奇遇', '药', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'yaopu',
            any: [{ birth: 'yaopu_xuetu' }, { pflag: 'kuidi_jiuge' }, { npcFav: { id: 'yaopu_laoban', gte: 25 } }] },
    prefer: { tend: { danyao: 0.8 }, locTags: ['药'] },
    choices: [
      {
        text: '解囊一观',
        outcomes: [
          { weight: 7, effects: [
            { memAdd: 'mem_yaofang_gufang' },
            { tendAdd: { danyao: 5 } },
            { insight: { id: 'shegen_yaoxiang', t: '那古方的君药我闻所未闻，方理却是通的——它治的不是病，是命数。' } },
            { log: { t: '一页薄绢，一篇古方。你一目十行地背，心口突突直跳。', style: '丹' } }] },
          { weight: 3, effects: [
            { memAdd: 'mem_yaofang_gufang' },
            { npcFavAdd: { id: 'yaopu_laoban', n: -8 } },
            { counterAdd: { xinmo: 2 } },
            { log: { t: '「看够了么。」掌柜的声音自背后响起，比铜锁还凉。', style: '凶' } },
            { log: { t: '可方子已经进了你的脑子，谁也掏不走了。', style: '丹' } }] }
        ]
      },
      {
        text: '替他合上柜门，落锁',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'yaopu_laoban', n: 6 } },
          { tendAdd: { yinguo: 3 } },
          { log: { t: '你锁好柜子，扶他进屋。主人不给的东西，不能拿。', style: '因果' } }
        ] }]
      },
      {
        text: '隔囊嗅药，凭香认方',
        cond: { tend: { id: 'danyao', gte: 30 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_yaofang_gufang' },
          { tendAdd: { danyao: 7 } },
          { insight: { id: 'shegen_yaoxiang', t: '隔着锦囊我闻出了七味药。第八味没有气味——那一味，是人的寿数。', confirm: true } },
          { log: { t: '你阖眼细嗅。那篇没见过的古方，在你心里自己写完了。', style: '丹' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 庙底低语（发放 mem_miaodi_diyu，邪神线入口）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_miaodi_diyu', title: '庙底低语',
    text: '殿中扫地，你的脚步在神像正前方踏出了一声空响——地砖下面是空的。你伏下身，耳朵贴上砖面：下面有声音。很低，很慢，像有人在一个字一个字地数着什么。数到某处，它停了。你莫名觉得，它数到的是你。',
    tags: ['奇遇', '阴邪', '香火', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'shanshenmiao', wvar: { id: 'ghostQi', gte: 35 } },
    prefer: { locTags: ['阴邪'], wvar: [{ id: 'ghostQi', gte: 60, boost: 1.5 }], tend: { yinguo: 0.5 } },
    choices: [
      {
        text: '贴着砖缝，听下去',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_miaodi_diyu' },
          { counterAdd: { xinmo: 4 } },
          { tendAdd: { yinguo: 4 } },
          { insight: { id: 'miaodi_shengyin', title: '庙底的声音', t: '庙底下数数的那个东西，数的是名字。隔一阵，就划掉一个。' } },
          { log: { t: '你听见了自己的名字。它念得又轻又熟，像念了很多年。', style: '凶' } }
        ] }]
      },
      {
        text: '撬开那块地砖',
        outcomes: [
          { weight: 5, effects: [
            { memAdd: 'mem_miaodi_diyu' },
            { hp: -8 },
            { counterAdd: { xinmo: 5 } },
            { wvarAdd: { ghostQi: 6 } },
            { pflagSet: { id: 'jian_miaodi_shijie' } },
            { log: { t: '砖一掀开，陈年阴风灌满大殿，长明灯齐齐爆了灯花。', style: '凶' } },
            { log: { t: '砖下没有声音了。只有一级向下的石阶。', style: '凶' } }] },
          { weight: 5, cond: { pflag: 'xianghuo_yinji' }, effects: [
            { memAdd: 'mem_miaodi_diyu' },
            { tendAdd: { yinguo: 5 } },
            { qi: 5 },
            { pflagSet: { id: 'jian_miaodi_shijie' } },
            { log: { t: '阴风缠上你的手腕，又像被烫着似的猛然缩回。', style: '异象' } },
            { log: { t: '眉心微热——自小吃下的香火，在替你挡。', style: '异象' } }] }
        ]
      },
      {
        text: '装作不知，扫完这殿',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你把那块砖扫得格外干净。砖下的声音，再没响过。', style: '平' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 后殿门缝（邪神线深入；发放 mem_intel_xieying；可直面邪影）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_houdian_menfeng', title: '后殿门缝',
    text: '那扇从没人见它开过的后殿门，今夜虚掩着一条缝。缝里没有光，却飘出香气——第二炷香的味道。门轴上的积灰纹丝未动：这门不是被人推开的，是它自己开的。',
    tags: ['奇遇', '阴邪', '隐秘', '夜'],
    baseWeight: 5, once: true,
    cond: { loc: 'shanshenmiao',
            any: [{ locvar: { loc: 'shanshenmiao', key: 'corruption', gte: 45 } },
                  { pflag: 'kanjian_dierzhuxiang' },
                  { mem: 'mem_miaodi_diyu' }] },
    prefer: { locTags: ['阴邪'], wvar: [{ id: 'ghostQi', gte: 50, boost: 1.6 }] },
    choices: [
      {
        text: '凑近门缝望进去',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_xieying' },
          { counterAdd: { xinmo: 4 } },
          { tendAdd: { yinguo: 3 } },
          { log: { t: '黑暗里立着一道比神像更高的影子，正倒插着一炷香。', style: '凶' } },
          { log: { t: '门缝漏进一线月光，它绕着走——它怕亮的东西。', style: '异象' } }
        ] }]
      },
      {
        text: '推门而入',
        cond: { realm: { gte: 1 } },
        outcomes: [
          { weight: 5, effects: [
            { memAdd: 'mem_intel_xieying' },
            { counterAdd: { xinmo: 5 } },
            { wvarAdd: { ghostQi: 5 } },
            { log: { t: '殿内无人。满墙的香根根倒插，香灰齐齐飘向房梁。', style: '凶' } },
            { log: { t: '你退出来时，门在身后自己合上了，轻得像叹息。', style: '凶' } }] },
          { weight: 5, cond: { bossAlive: 'shanmiao_xieying', realm: { gte: 2 } }, effects: [
            { combat: { enemy: 'shanmiao_xieying',
              intro: '那张山神的脸自黑暗中浮起，贴到你面前：「进来了，就别走了。」',
              onWin: [
                { bossSet: { enemy: 'shanmiao_xieying', alive: false } },
                { legacySet: { id: 'temple_cleansed' } },
                { wvarSet: { ghostQi: 8 } },
                { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: -40 } },
                { fame: 15 },
                { rumorAdd: { t: '山神庙后殿的门敞开了，里头干干净净，香也立直了。', fame: 8 } }],
              onFlee: [
                { hp: -10 },
                { counterAdd: { xinmo: 5 } },
                { memAdd: 'mem_intel_xieying' },
                { log: { t: '你撞破门板滚出后殿，笑声像香灰一样落了你一身。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '转身就走，不回头',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '虚掩的门是在请人。你走得很快，没让它请到。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 旧痕（轮回者限定奇遇：cond {life:{gte:2}}）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_qianshi_zhihen', title: '旧痕',
    text: '路过镇口老槐树，你莫名停了脚。树身一人高处有道旧刀痕，皮肉早已合拢，只剩浅浅一道白。你认得这道痕——起刀的角度，收刀的力道，和你的手法一模一样。可你这一世，从没在这棵树上动过刀。',
    tags: ['奇遇', '因果', '梦'],
    baseWeight: 4, once: true,
    cond: { loc: 'qingshizhen', life: { gte: 2 } },
    prefer: { tend: { yinguo: 1.2 } },
    choices: [
      {
        text: '把手按上那道旧痕',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 8 } },
          { counterAdd: { xinmo: -2 } },
          { qi: 4 },
          { insight: { id: 'jishi_zhimeng', title: '既视之梦', t: '老槐树上的刀痕是我刻的——不是这一世的我。前世的东西，真的还在。', confirm: true } },
          { log: { t: '掌心贴上树皮的一瞬，一段不属于这一世的午后涌来。', style: '因果' } },
          { log: { t: '蝉鸣，刀，和一个没说完的赌约。', style: '因果' } }
        ] }]
      },
      {
        text: '在旁边再刻一道',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 5 } },
          { pflagSet: { id: 'ke_le_xinhen' } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你照着记忆里的手法落下第二刀。两道痕并在一起。', style: '因果' } },
          { log: { t: '像隔世的两个人，击了一次掌。', style: '因果' } }
        ] }]
      },
      {
        text: '走开，不去想',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xinmo: 3 } },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你加快了脚步。可那道痕落在眼里，像谁替你记的账。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════
  // 时限机缘三连：寒潭异光 → 北谷寒潭 → 潭光易主（拖延则外门巡使取走）
  // ═══════════════════════════════════════════
  G.define('event', {
    id: 'ev_hantan_chuanwen', title: '寒潭异光',
    text: '茶肆里炸了锅：有樵夫赌咒发誓，黑山北谷的寒潭一夜之间亮得像落了星子，潭心浮着一团珠子大的光，凑近了浑身寒毛都往潭里飘。也有人嗤笑：「那地方邪性。光越好看，越是要命的东西。」',
    tags: ['奇遇', '市集', '隐秘'],
    baseWeight: 7, once: true,
    cond: { loc: 'qingshizhen', noflag: 'hantan_bei_qu' },
    prefer: { locTags: ['市集'], wvar: [{ id: 'sectAttention', gte: 10, boost: 1.3 }] },
    choices: [
      {
        text: '连夜动身去北谷',
        outcomes: [
          { weight: 6, effects: [
            { goto: 'heishan_waiwei' },
            { hp: -8 },
            { itemAdd: { id: 'hansui_zhu', n: 1 } },
            { pflagSet: { id: 'hantan_de_bao' } },
            { log: { t: '潜到第三次，你的指尖终于扣住了那团光。', style: '吉' } },
            { log: { t: '出水时你嘴唇乌青，掌心却暖得像握着一小团月亮。', style: '吉' } }] },
          { weight: 4, effects: [
            { goto: 'heishan_waiwei' },
            { hp: -14 },
            { injure: { months: 1, severity: 1 } },
            { flagSet: { id: 'jihui_hantan' } },
            { eventDelay: { id: 'ev_hantan_jieju', months: 2, note: '寒潭的光，藏不了多久' } },
            { log: { t: '寒气顺着骨缝往里钻，三探三空，你只得先爬上岸。', style: '凶' } },
            { log: { t: '那团光还在潭心浮着。能等你几日，难说。', style: '平' } }] }
        ]
      },
      {
        text: '记下方位，改日再去',
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'jihui_hantan' } },
          { eventDelay: { id: 'ev_hantan_jieju', months: 2, note: '寒潭的光，藏不了多久' } },
          { tendAdd: { yinguo: 1 } },
          { log: { t: '你把樵夫的话记在心里。山里的东西等不等人，难说。', style: '平' } }
        ] }]
      },
      {
        text: '邪性的东西，不沾',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你喝完茶起身走人。从此潭是潭，你是你。', style: '平' } }
        ] }]
      }
    ]
  });

  // 寒潭·去取（趁机缘未被取走，亲赴北谷可再试）
  G.define('event', {
    id: 'ev_hantan_qibao', title: '北谷寒潭',
    text: '北谷寒潭就在眼前。潭水黑得发蓝，潭心一点光浮浮沉沉，像一颗不肯落底的星。水面上没有雾——所有的寒气，都贴着水皮打转，等着咬第一个下水的人。',
    tags: ['奇遇', '隐秘', '野外'],
    baseWeight: 30, once: false,
    cond: { loc: 'heishan_waiwei', flag: 'jihui_hantan', noflag: 'hantan_bei_qu', nopflag: 'hantan_de_bao' },
    prefer: { locTags: ['野外'] },
    choices: [
      {
        text: '下潭取珠',
        outcomes: [
          { weight: 6, effects: [
            { hp: -8 },
            { itemAdd: { id: 'hansui_zhu', n: 1 } },
            { pflagSet: { id: 'hantan_de_bao' } },
            { log: { t: '寒意割肉。你抓住那团光的一瞬，整座潭忽然安静了。', style: '吉' } },
            { log: { t: '像完成了一桩等了很久的事。', style: '吉' } }] },
          { weight: 4, effects: [
            { hp: -12 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '潭心的光滑不留手，三探三空。你抖着牙关上了岸。', style: '凶' } }] }
        ]
      },
      {
        text: '先投石试潭',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '石子沉了很久，潭底隐约回了一声叩响。潭比山深。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 寒潭·到期结局（queueOnly：玩家拖延则巡使取走——机缘会被 NPC 抢）
  G.define('event', {
    id: 'ev_hantan_jieju', title: '潭光易主',
    queueOnly: true, once: true, baseWeight: 0,
    tags: ['奇遇'],
    textFn: function () {
      return G.player.pflags['hantan_de_bao']
        ? '北谷的消息又传回了镇上。茶肆里说得有鼻子有眼，你袖中却微微一凉——东西早就不在潭里了。'
        : '茶肆里又在说北谷寒潭。这一回，说的是潭光熄了的消息。';
    },
    effects: [
      { branch: { cond: { pflag: 'hantan_de_bao' },
        then: [
          { fame: 3 },
          { rumorAdd: { t: '外门巡使绕着北谷寒潭转了三圈，脸黑得比潭水还沉。', fame: 1 } },
          { log: { t: '听说也有人去寻那潭中之光——去晚了。东西在你这。', style: '吉' } }
        ],
        else: [
          { flagSet: { id: 'hantan_bei_qu' } },
          { flagSet: { id: 'jihui_hantan', v: false } },
          { wvarAdd: { sectAttention: 6 } },
          { rumorAdd: { t: '外门巡使从北谷寒潭取走一颗鸽卵大的寒珠，连夜送回了山门。', fame: 0 } },
          { log: { t: '消息传来时，潭里的光已经进了别人的袖子。', style: '凶' } },
          { log: { t: '山里的东西，果然不等人。', style: '因果' } },
          { counterAdd: { xinmo: 2 } }
        ] } }
    ]
  });

  // ═══════════════════════════════════════════
  // 其余奇遇
  // ═══════════════════════════════════════════

  // 古冢残碑（发放 mem_intel_langwang：百年前围猎狼王的血泪情报）
  G.define('event', {
    id: 'ev_guzhong_canbei', title: '古冢残碑',
    text: '乱石岗上斜插着一截残碑，碑下的坟茔早被风雨抹平了。碑文风蚀过半，依稀认得出是百年前一场围猎的名录——十七个名字。最末一行小字：「猎狼王不成，十七人皆殁。立碑者愧，不敢署名。」',
    tags: ['奇遇', '因果', '狼', '隐秘'],
    baseWeight: 4, once: true,
    cond: { loc: 'heishan_shenchu', bossAlive: 'heishan_langwang' },
    prefer: { tend: { yinguo: 0.5 }, locTags: ['隐秘'] },
    choices: [
      {
        text: '拓下碑背的围猎记略',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_langwang' },
          { tendAdd: { yinguo: 3 } },
          { log: { t: '碑背还有半篇小字，记着那头狼王的路数与习性。', style: '因果' } },
          { log: { t: '百年前十七条命换的东西，你收下了。', style: '因果' } }
        ] }]
      },
      {
        text: '为十七人垒坟培土',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 5 } },
          { counterAdd: { xinmo: -2 } },
          { fame: 2 },
          { log: { t: '你垒了大半日土。转身时山风穿过碑缝，呜地一声。', style: '因果' } },
          { log: { t: '像十七个人，一齐应了。', style: '因果' } }
        ] }]
      },
      {
        text: '与我无关，绕开走',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xinmo: 1 } },
          { log: { t: '当夜宿营，你梦见有人在数数，数到十七就停。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 井底寒气（家中老井，炼体机缘；盛夏限定）
  G.define('event', {
    id: 'ev_laojing_hanqi', title: '井底寒气',
    text: '三伏天，镇上的井都快见了底，你家这口老井却凉得反常。打水时，井底深处隐约透上来一丝白汽；水面映出你的脸，呼出的气，竟然是白的。',
    tags: ['奇遇', '隐秘', '体'],
    baseWeight: 5, once: true,
    cond: { loc: 'jiazhong', monthIn: [6, 7] },
    prefer: { tend: { lianti: 0.6 }, locTags: ['隐秘'] },
    choices: [
      {
        text: '缒绳下井一探',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'jingdi_hantie', n: 1 } },
            { tendAdd: { lianti: 2 } },
            { log: { t: '井壁最深处嵌着一块黑沉沉的寒铁，凿了半日才下来。', style: '吉' } },
            { log: { t: '难怪这井，百年水不腐。', style: '平' } }] },
          { weight: 5, effects: [
            { statAdd: { ti: 1 } },
            { hp: -6 },
            { tendAdd: { lianti: 4 } },
            { log: { t: '井底寒气像针，往骨缝里扎。你咬牙坐了一炷香。', style: '体' } },
            { log: { t: '上来时浑身通红，筋骨缝里像被洗过一遍。', style: '体' } }] }
        ]
      },
      {
        text: '每日打井水擦身',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { lianti: 3 } },
          { counterAdd: { xinmo: -2 } },
          { hp: 5 },
          { log: { t: '一个伏天擦下来，皮肉紧了一层，暑气近不了身。', style: '体' } }
        ] }]
      },
      {
        text: '压上石板，别多事',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 1 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你压了块石板在井口。当夜梦里，井底有人轻敲了三下。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 夜市残卷（市集奇遇，钱换机缘，真伪难辨）
  G.define('event', {
    id: 'ev_yeshi_canjuan', title: '夜市残卷',
    text: '散集后的夜市口，一个面生的游方客守着一方布，布上只有一卷边角焦黑的旧书。「山火里抢出来的，」他说，「识货的拿去。十二个钱，不还价。」',
    tags: ['奇遇', '市集', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'qingshizhen', money: { gte: 12 } },
    prefer: { locTags: ['市集'], wvar: [{ id: 'marketPrice', gte: 100, boost: 1.3 }] },
    choices: [
      {
        text: '买下残卷',
        outcomes: [
          { weight: 5, effects: [
            { money: -12 },
            { cult: 20 },
            { insight: { id: 'tuna_gufa', title: '残卷吐纳法', t: '残卷的呼吸法子与镇上口诀差了三处。照它改了，气走得顺多了。', confirm: true } },
            { log: { t: '灯下细读，残卷法门古拙生涩，却字字落在实处。', style: '吉' } }] },
          { weight: 3, effects: [
            { money: -12 },
            { tendAdd: { danyao: 4 } },
            { itemAdd: { id: 'ningxuecao', n: 2 } },
            { log: { t: '是半篇药经。照方炮制，寻常草药也多出三分力。', style: '丹' } }] },
          { weight: 2, effects: [
            { money: -12 },
            { counterAdd: { xinmo: 2 } },
            { log: { t: '回家展开：头一页之后，全是空白。', style: '凶' } },
            { log: { t: '那游方客，再没在镇上出现过。', style: '凶' } }] }
        ]
      },
      {
        text: '借灯翻两页再说',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { yinguo: 1 } },
            { log: { t: '似是而非。放下书时，那人笑了笑：「不是你的缘分。」', style: '平' } }] },
          { weight: 4, cond: { stat: { id: 'shen', gte: 5 } }, effects: [
            { cult: 8 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '你把开篇两页死死记下，回家默出来，竟是完整一段。', style: '吉' } }] }
        ]
      },
      {
        text: '来路太脏，不接茬',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 1 } },
          { log: { t: '山火里抢出来的东西，火气没散。你摇头走开了。', style: '平' } }
        ] }]
      }
    ]
  });

  // 雷击古松（雷雨限定第二景：雷火遗材）
  G.define('event', {
    id: 'ev_leiji_gusong', title: '雷击古松',
    text: '一道天雷正落在岭上那株三人合抱的古松上！火光冲天，雨幕都压不住。你赶到时，古松从顶到根裂作两半，焦黑的裂口里，木心白得发亮，丝丝缕缕往外冒着细小的电芒。',
    tags: ['奇遇', '雷', '野外'],
    baseWeight: 5, once: true,
    cond: { loc: 'heishan_waiwei', weather: '雷雨' },
    prefer: { tend: { leifa: 0.8 }, locTags: ['野外'] },
    choices: [
      {
        text: '剖取雷击木心',
        outcomes: [
          { weight: 6, effects: [
            { itemAdd: { id: 'leijimu_xin', n: 2 } },
            { tendAdd: { leifa: 3 } },
            { log: { t: '木心入手微麻，香气清冽。雷劈过的木头，百邪不近。', style: '雷' } }] },
          { weight: 4, effects: [
            { hp: -10 },
            { itemAdd: { id: 'leijimu_xin', n: 1 } },
            { tendAdd: { leifa: 4 } },
            { log: { t: '刀刚触到木心，一缕余雷顺着刀身炸上手臂。', style: '凶' } },
            { log: { t: '你咬着牙，还是剖下来一块。', style: '雷' } }] }
        ]
      },
      {
        text: '守着雷火烤到天明',
        outcomes: [{ weight: 1, effects: [
          { hp: 6 },
          { tendAdd: { leifa: 2 } },
          { counterAdd: { xinmo: -2 } },
          { log: { t: '雷火的暖与寻常火不同，烤得人骨头缝里发松。', style: '雷' } },
          { log: { t: '你守着这棵死去的老树坐了一夜，像守灵，又像赴宴。', style: '平' } }
        ] }]
      },
      {
        text: '折一截焦枝送去庙里',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'miaozhu', n: 4 } },
          { tendAdd: { yinguo: 2 } },
          { itemAdd: { id: 'fuzhi', n: 1 } },
          { log: { t: '庙祝郑重接过焦枝，回赠朱砂符：「雷火净物，鬼神都敬。」', style: '因果' } }
        ] }]
      }
    ]
  });

  // ════════ 基建样例保留：雪下之刃 ════════
  G.define('event', {
    id: 'ev_xueye_duanjian', title: '雪下之刃',
    text: '雪后初晴，你在一处背阴的岩缝里看见半截露出雪面的剑柄。剑身入雪三尺，周围一圈雪却化得干干净净，露出底下黑褐色的旧土——像是什么东西在底下烘着。',
    tags: ['奇遇', '剑', '隐秘'],
    baseWeight: 3, once: true,
    cond: { loc: 'heishan_waiwei', season: '冬' },
    prefer: { tend: { xuejian: 1.0 } },
    choices: [
      {
        text: '拔出来看看',
        outcomes: [
          { weight: 7, effects: [
            { itemAdd: { id: 'tiejian', n: 1 } },
            { pflagSet: { id: 'ba_le_duanjian' } },
            { log: { t: '剑身完好，竟无半点锈迹。入手沉而温，不似铁器该有的凉。', style: '吉' } }] },
          { weight: 3, effects: [
            { hp: -5 }, { itemAdd: { id: 'tiejian', n: 1 } }, { tendAdd: { xuejian: 3 } },
            { pflagSet: { id: 'ba_le_duanjian' } },
            { log: { t: '剑刃在出土的瞬间割破了你的虎口。奇怪的是，血珠落上剑身，洇得极快。', style: '血' } }] }
        ]
      },
      {
        text: '不祥之物，绕开走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你退开几步，朝那岩缝拜了拜。有些东西露出来，是想让人看见——所以更不能碰。', style: '因果' } }
        ] }]
      },
      {
        text: '割破手掌，以血试剑',
        cond: { tend: { id: 'xuejian', gte: 30 } },
        outcomes: [{ weight: 1, effects: [
          { hp: -8 },
          { itemAdd: { id: 'tiejian', n: 1 } },
          { tendAdd: { xuejian: 8 } },
          { counterAdd: { xuexing: 2 } },
          { pflagSet: { id: 'ba_le_duanjian' } },
          { insight: { id: 'shanghou_jianming', t: '那柄雪里的剑喝了我的血才肯出来。它认这个。', confirm: true } },
          { log: { t: '血落剑身，嗡鸣大作！积雪簌簌而落，剑自行跃出，柄正正递到你掌心。', style: '血' } }
        ] }]
      }
    ]
  });
})();
