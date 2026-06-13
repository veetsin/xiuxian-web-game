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
// ── v2 新增（C3 横向扩展，本文件部分；21 新奇遇）──
//   5 新道机缘奇遇（发放机缘记忆，蓝图 §6 命名 mem_<主题>，C1 定义 carry+dream）：
//     ev_hantan_languang（→mem_hantan_languang 寒潭蓝光）/ ev_jianzhong_jianming（→mem_jianzhong_jianming 剑冢剑鸣）/
//     ev_hukeng_mimeng（→mem_huao_mimeng 狐坳迷梦）/ ev_luanzang_diyu（→mem_luanzang_diyu 乱葬低语）/
//     ev_hedi_chenzhong（→mem_hedi_chenzhong 河底沉钟）。
//   6 新 Boss 情报奇遇（发放 mem_intel_*，C4 enemy.intelMem 钉死，C1 定义）：
//     ev_laohu_chuanwen（→mem_intel_laohu）/ ev_jianling_beiwen（→mem_intel_jianling）/
//     ev_hanjiao_yiwen（→mem_intel_hanjiao）/ ev_shouwang_zuxun（→mem_intel_shouwang）/
//     ev_lizu_canbei（→mem_intel_lizu）/ ev_heshen_cibei（→mem_intel_heshen）。
//   旗舰级新奇遇（五分支，照 §4.3）：ev_jianzhong_zhumen（剑冢主门，断剑崖）。
//   轮回/前世限定：ev_huyang_qianyuan（{life:{gte:2}} 轮回者）/ ev_jianzhong_yiyin（{legacy:'jianzhong_renzhu'} 前世痕迹）。
//   新道喂养/异象奇遇：ev_hantan_caibing（handu）/ ev_houshan_qun（shouhun）/ ev_heshen_huanyuan（xianghuo）。
//   旗舰跟进：ev_jianzhong_renzhu_jieju（queueOnly，剑冢认主结局）。
//
// ── 引用的跨文件 id（均在蓝图钉死表 / ids.js）──
//   地点：hantan / duanjianya / hupo_ao / luanzang_gang / heshen_du / houshan_lin。
//   道途倾向（喂养，不暴露）：handu / shouhun / xianghuo / humei / yujian。
//   敌人：hanjiao_you / jianzhong_canling（奇遇内战斗）。Boss：jianzhong_jianling（旗舰认主战）。
//   legacy（C4 Boss onWin 落 / 本文件 cond 查）：jianzhong_renzhu（剑冢认主，旗舰奇遇落）。
//   记忆（C1 定义）：见上「发放机缘记忆 / 情报奇遇」清单。
//   NPC（C5）：hupo / zhujian_weng / heshen_po / shihai_zhe。
//
// ── 本文件新增 v2 物品 ──：hanhuang_jing（寒簧晶，handu 材料）/ shouhun_fu（兽魂符，shouhun 消耗）/
//   xiangyuan_zhu（香愿珠，xianghuo 消耗）/ hujiu_zhui（狐九坠，humei 消耗）/ jianzhong_jue_can（剑冢诀残，yujian 消耗）。
// ── 本文件新增 v2 pflag ──：hantan_jianlan / jianzhong_yindao / hukeng_rumeng / hedi_wenzhong /
//   de_jianzhong / huyang_qianyuan_jian（均有读取点：寒潭采冰/铸剑/狐婆传术/河神还愿/前世遗音等同地后续事件）。
//   ── 新增 legacy 登记 ──：jianzhong_renzhu（旗舰奇遇 ev_jianzhong_zhumen 认主战胜后 legacySet；
//     ids.js 已登记，applyLegacy 已接；C4 enemies/daos 侧若亦落则幂等。本文件 cond {legacy:'jianzhong_renzhu'} 查。）
//
// TODO-INTEGRATION: 建议 C4 给 shanmiao_xieying 配 intelMem:'mem_intel_xieying'（ev_houdian_menfeng 已发放）。
// TODO-INTEGRATION: pflag jian_miaodi_shijie（撬开庙底见石阶）留给 C2 山神庙「探地宫」类行动作 cond。
// TODO-INTEGRATION: langwang_tougu 暂为收藏/变卖品；若引擎日后支持「信物/佩饰」栏可升级为威压加成物。
// TODO-INTEGRATION: 6 新 Boss intelMem（mem_intel_laohu/jianling/hanjiao/shouwang/lizu/heshen）由 C4 enemy 引用、
//   C1 memory 定义；其落地前 validate 会报引用缺失，属并行预期。新道机缘记忆同理（C1 定义）。
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

  // ════════ v2 新道材料 / 消耗品（来源在本文件奇遇，去处为 use 或售卖）════════
  G.define('item', {
    id: 'hanhuang_jing', name: '寒簧晶', type: 'consumable', price: 35,
    desc: '寒潭蓝光里凝出的一小片晶，触手刺骨，含之凉意彻心，能压一时燥火。',
    use: [{ counterAdd: { xinmo: -8, dandu: -4 } }, { tendAdd: { handu: 3 } },
          { log: { t: '寒晶化作一线凉意沉入丹田，心头的燥火与丹毒一齐镇了下去。', style: '平' } }]
  });
  G.define('item', {
    id: 'shouhun_fu', name: '兽魂符', type: 'consumable', price: 28,
    desc: '以兽血画就的旧符，烧之能引一缕游散的兽魂附身片刻，胆气暴涨。',
    use: [{ tendAdd: { shouhun: 4 } }, { counterAdd: { shaqi: 1 } }, { hp: 6 },
          { log: { t: '符纸燃尽，一股野兽般的热血涌上四肢，你低低吼了一声。', style: '异象' } }]
  });
  G.define('item', {
    id: 'xiangyuan_zhu', name: '香愿珠', type: 'consumable', price: 40,
    desc: '受过百家香火、还过百家愿的木珠，温润生暖，握之安神定魄。',
    use: [{ counterAdd: { xinmo: -15 } }, { tendAdd: { xianghuo: 3 } }, { qi: 5 },
          { log: { t: '木珠贴掌生暖，心头百窍的杂念一齐静了，像有人替你掌了灯。', style: '因果' } }]
  });
  G.define('item', {
    id: 'hujiu_zhui', name: '狐九坠', type: 'consumable', price: 38,
    desc: '狐婆坳老狐脱下的一缕媚气凝成的玉坠，佩之顾盼生姿，言语动人。',
    use: [{ tendAdd: { humei: 4 } }, { fame: 2 }, { counterAdd: { xinmo: 2 } },
          { log: { t: '玉坠贴身一暖，你眉梢眼角不自觉染了三分媚，旁人看你的眼神都软了。', style: '平' } }]
  });
  G.define('item', {
    id: 'jianzhong_jue_can', name: '剑冢诀残', type: 'consumable', price: 55,
    desc: '剑冢石壁上拓下的半篇剑诀，字字如刃，读之识海中似有千剑齐鸣。',
    use: [{ tendAdd: { yujian: 5 } }, { cult: 8 },
          { log: { t: '残诀入目，识海里千剑同鸣。你握剑的手，第一次知道该往哪里去。', style: '平' } }]
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

  // ═══════════════════════════════════════════════════════════
  // v2 ── 五新道机缘奇遇（发放机缘记忆 mem_<主题>，carry+dream by C1）
  // ═══════════════════════════════════════════════════════════

  // 寒潭蓝光 → mem_hantan_languang（handu）
  G.define('event', {
    id: 'ev_hantan_languang', title: '潭心蓝光',
    text: '寒潭最深处，浮着一团珠子大的蓝光，幽幽地、稳稳地亮着，凉气贴着水面一圈圈荡开。你蹲在潭边，那光好像认得你——它不闪不动，却一寸寸把你的视线、你的呼吸，往潭底拽。',
    tags: ['奇遇', '寒', '水', '隐秘'],
    baseWeight: 6, once: true,
    cond: { loc: 'hantan' },
    prefer: { tend: { handu: 0.8 }, locTags: ['寒'] },
    choices: [
      {
        text: '凿冰取下那点蓝光的结晶',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'hanhuang_jing', n: 1 } },
            { memAdd: 'mem_hantan_languang' },
            { hp: -5 },
            { tendAdd: { handu: 4 } },
            { log: { t: '你凿下一片含光的寒晶，掌心一片冰麻。蓝光，仍在潭底亮着。', style: '平' } }] },
          { weight: 5, effects: [
            { hp: -12 },
            { injure: { months: 1, severity: 1 } },
            { memAdd: 'mem_hantan_languang' },
            { tendAdd: { handu: 3 } },
            { log: { t: '寒气顺着凿子反噬上来，你半边手臂冻得失了知觉，连滚带爬上了岸。', style: '凶' } },
            { log: { t: '闭上眼，满眼都是那团蓝。', style: '异象' } }] }
        ]
      },
      {
        text: '把寒气引入自身，静静受着',
        cond: { tend: { id: 'handu', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_hantan_languang' },
          { tendAdd: { handu: 8 } },
          { hp: -6 },
          { pflagSet: { id: 'hantan_jianlan' } },
          { insight: { id: 'hantan_dilan', title: '潭底的蓝', t: '我把寒潭的凉引进了骨头里。它不伤我，反而听我的——这凉，是我的了。', confirm: true } },
          { log: { t: '蓝光顺着你的呼吸沉入丹田。你呵出的气结成冰晶，落地有声。', style: '异象' } }
        ] }]
      },
      {
        text: '寒气太邪，掬一捧潭水便走',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_hantan_languang' },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你只掬了捧潭水。那点蓝光在身后亮着，像一只睁着的眼，目送你走远。', style: '平' } }
        ] }]
      }
    ]
  });

  // 剑冢剑鸣 → mem_jianzhong_jianming（yujian）
  G.define('event', {
    id: 'ev_jianzhong_jianming', title: '剑冢剑鸣',
    text: '断剑崖深处藏着一座剑冢——崖壁裂开一道窄缝，缝里黑沉沉的，却传出绵绵不绝的剑鸣，清越得不似铁器，倒像有人在里头抚琴。满崖的断剑齐齐朝那道缝低着头，像群臣朝拜。',
    tags: ['奇遇', '剑', '隐秘'],
    baseWeight: 6, once: true,
    cond: { loc: 'duanjianya' },
    prefer: { tend: { yujian: 0.8 }, locTags: ['剑'] },
    choices: [
      {
        text: '侧身挤进石缝，循剑鸣而入',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'jianzhong_jue_can', n: 1 } },
            { memAdd: 'mem_jianzhong_jianming' },
            { tendAdd: { yujian: 4 } },
            { log: { t: '缝内石壁上密密拓着剑诀残篇。你照着默记，识海里千剑同鸣。', style: '平' } }] },
          { weight: 5, effects: [
            { combat: { enemy: 'jianzhong_canling',
              intro: '石缝深处，一道剑气凝成的残灵拦在路口，无形长剑直指你的眉心！',
              onWin: [{ memAdd: 'mem_jianzhong_jianming' }, { itemAdd: { id: 'jianzhong_jue_can', n: 1 } }, { tendAdd: { yujian: 5 } },
                      { log: { t: '残灵散了。它让开的路尽头，剑鸣声更清亮了。', style: '平' } }],
              onFlee: [{ hp: -6 }, { memAdd: 'mem_jianzhong_jianming' }, { log: { t: '你退出石缝，那道剑气削断了你的发髻。剑冢，认路不认人。', style: '凶' } }] } }] }
        ]
      },
      {
        text: '以心听剑，与那鸣声相和',
        cond: { tend: { id: 'yujian', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_jianzhong_jianming' },
          { tendAdd: { yujian: 8 } },
          { qi: 6 },
          { pflagSet: { id: 'jianzhong_yindao' } },
          { insight: { id: 'jianzhong_ming', title: '剑冢的鸣', t: '剑冢里那柄主剑在唤我。我以意相和，它便认我作了听得懂剑的人。', confirm: true } },
          { log: { t: '你心念一动，应了那声剑鸣。满崖断剑同时一颤，朝你低了头。', style: '异象' } }
        ] }]
      },
      {
        text: '只在缝外拓一段壁上残诀',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_jianzhong_jianming' },
          { tendAdd: { yujian: 3 } },
          { log: { t: '你借着天光拓下缝口一段残诀。剑鸣声渐远，像在嫌你不肯进去。', style: '平' } }
        ] }]
      }
    ]
  });

  // 狐坳迷梦 → mem_huao_mimeng（humei）
  G.define('event', {
    id: 'ev_hukeng_mimeng', title: '狐坳迷梦',
    text: '狐婆坳的夜雾把你困住了。雾里没有路，只有一重又一重的幻象：你想要的、你失去的、你不敢认的，都在雾里朝你招手。你分不清哪个是真。雾的最深处，一只九尾的影子盘坐着，慢条斯理地，把你的心事一桩桩抖给你看。',
    tags: ['奇遇', '狐', '幻', '夜'],
    baseWeight: 6, once: true,
    cond: { loc: 'hupo_ao' },
    prefer: { tend: { humei: 0.8 }, locTags: ['幻'], wvar: [{ id: 'ghostQi', gte: 30, boost: 1.3 }] },
    choices: [
      {
        text: '将计就计，在梦里也演一场戏',
        cond: { tend: { id: 'humei', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_huao_mimeng' },
          { itemAdd: { id: 'hujiu_zhui', n: 1 } },
          { tendAdd: { humei: 8 } },
          { counterAdd: { xinmo: 2 } },
          { pflagSet: { id: 'hukeng_rumeng' } },
          { insight: { id: 'hu_mi', title: '坳里的迷', t: '老狐拿幻象试我，我便也给它演了一出。它笑了，说我是块做狐的料。', confirm: true } },
          { log: { t: '你顺着幻象演下去，假戏真做。雾里那影子轻笑出声，赠你一缕媚气。', style: '平' } }
        ] }]
      },
      {
        text: '咬破舌尖，凭痛认清真假',
        outcomes: [
          { weight: 6, effects: [
            { memAdd: 'mem_huao_mimeng' },
            { hp: -4 },
            { tendAdd: { humei: 3 } },
            { log: { t: '一阵剧痛把幻象震碎。雾散处，你看清了那只老狐打量你的眼。', style: '平' } }] },
          { weight: 4, effects: [
            { memAdd: 'mem_huao_mimeng' },
            { counterAdd: { xinmo: 3 } },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '你认错了真假，往幻象里走了三步，才被一棵真树撞醒。冷汗湿透。', style: '凶' } }] }
        ]
      },
      {
        text: '不接它的话，闭眼往回走',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_huao_mimeng' },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你闭着眼，凭脚下的坡度往回挪。幻象抓不住一个不肯看的人。', style: '平' } }
        ] }]
      }
    ]
  });

  // 乱葬低语 → mem_luanzang_diyu（yinguo/xianghuo）
  G.define('event', {
    id: 'ev_luanzang_diyu', title: '乱葬低语',
    text: '乱葬岗最深、最大的那座土包前，磷火聚而不散。你伏下身，把耳朵贴上冰凉的封土——底下有声音，又老又慢，一个名字一个名字地数着，数到某个名字便顿一顿，像在勾账。数着数着，它忽然停了。你莫名地知道，它在等你开口。',
    tags: ['奇遇', '葬', '阴邪', '夜'],
    baseWeight: 5, once: true,
    cond: { loc: 'luanzang_gang', wvar: { id: 'ghostQi', gte: 35 } },
    prefer: { tend: { yinguo: 0.6 }, locTags: ['阴邪'], wvar: [{ id: 'ghostQi', gte: 60, boost: 1.5 }] },
    choices: [
      {
        text: '贴着封土，把那笔账听完',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_luanzang_diyu' },
          { counterAdd: { xinmo: 4 } },
          { tendAdd: { yinguo: 5 } },
          { insight: { id: 'luanzang_diqi', title: '岗上的数', t: '乱葬岗底下那位老祖宗在数百年的旧账。它数到的名字，香火就断。它记下了我。', confirm: true } },
          { log: { t: '你听见它数到了一个熟悉的名字——你前世的名字。它念得很慢，很恨。', style: '凶' } }
        ] }]
      },
      {
        text: '焚一炷香，替这满岗孤魂超度',
        cond: { any: [{ pflag: 'qin_le_xianghuo' }, { tend: { id: 'xianghuo', gte: 20 } }, { npcFav: { id: 'shihai_zhe', gte: 15 } }] },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_luanzang_diyu' },
          { tendAdd: { xianghuo: 6 } },
          { counterAdd: { xinmo: -4 } },
          { wvarAdd: { ghostQi: -5 } },
          { insight: { id: 'luanzang_diqi', title: '岗上的数', t: '我替乱葬岗的孤魂上了香。那数账的声音停了一夜——它怕香火，更怕有人替它的卒还了债。', confirm: true } },
          { log: { t: '香烟漫过坟头，磷火一盏盏熄了。底下那数账声，迟疑了，停了。', style: '因果' } }
        ] }]
      },
      {
        text: '不敢应它，悄悄退开',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_luanzang_diyu' },
          { counterAdd: { xinmo: 2 } },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你屏着气退了三步。那声音没有追，却把你的名字，又念了一遍。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 河底沉钟 → mem_hedi_chenzhong（xianghuo/handu）
  G.define('event', {
    id: 'ev_hedi_chenzhong', title: '河底沉钟',
    text: '河神渡退潮的午后，浑黄的河水忽然变得清亮，你低头一看——河床深处沉着一口锈绿的古钟，钟身爬满水草，每当暗流涌过，便发出一声沉闷的「嗡」，一圈圈震得水面发颤。镇上老人说过：那钟一响，是河神在点名。',
    tags: ['奇遇', '渡', '水', '香火'],
    baseWeight: 6, once: true,
    cond: { loc: 'heshen_du' },
    prefer: { tend: { xianghuo: 0.6 }, locTags: ['水', '香火'], wvar: [{ id: 'villageFear', gte: 25, boost: 1.3 }] },
    choices: [
      {
        text: '潜入河底，探那口古钟',
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'xiangyuan_zhu', n: 1 } },
            { memAdd: 'mem_hedi_chenzhong' },
            { hp: -8 },
            { tendAdd: { xianghuo: 4 } },
            { log: { t: '钟肚里供着一串香愿珠，是百年前沉船人临终的祈愿。你含泪取了。', style: '因果' } }] },
          { weight: 5, effects: [
            { hp: -14 },
            { injure: { months: 1, severity: 1 } },
            { memAdd: 'mem_hedi_chenzhong' },
            { tendAdd: { handu: 2 } },
            { log: { t: '河底冰冷的手缠上你的脚踝。你撞响了沉钟，借那一声震开了水鬼，狼狈浮起。', style: '凶' } }] }
        ]
      },
      {
        text: '在岸上设案，应那钟声还愿',
        cond: { any: [{ pflag: 'qin_le_xianghuo' }, { tend: { id: 'xianghuo', gte: 25 } }, { npcFav: { id: 'heshen_po', gte: 15 } }] },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_hedi_chenzhong' },
          { tendAdd: { xianghuo: 8 } },
          { wvarAdd: { villageFear: -3 } },
          { pflagSet: { id: 'hedi_wenzhong' } },
          { insight: { id: 'he_huan', title: '河里的手', t: '河底沉钟是河神点名的法器。我应钟还愿，它便不再点我的名——香火还得上，河患就压得住。', confirm: true } },
          { log: { t: '你应着钟声上香还愿。每还一愿，钟声便柔一分，漫上岸的水退了下去。', style: '因果' } }
        ] }]
      },
      {
        text: '钟声瘆人，匆匆离了渡口',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_hedi_chenzhong' },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你快步离了渡口，那钟声却追着你响了一路，像在记你的名字。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════════════════════
  // v2 ── 六新 Boss 情报奇遇（发放 mem_intel_*，战前弱点提示+增伤）
  // 都是「听来 / 看来 / 读来」的情报，门槛中等、baseWeight 4-6
  // ═══════════════════════════════════════════════════════════

  // 老狐仙情报 → mem_intel_laohu
  G.define('event', {
    id: 'ev_laohu_chuanwen', title: '狐婆的旧话',
    text: '狐婆坳深处，老狐婆难得地多说了几句。她拨弄着炭火，眼神飘忽：「坳子最里头那位老姊妹，活了一千年喽。她最厉害的是那张嘴，能哄得你把命都送给她——可她也有怕的：她最怕镜子，最怕被人当面戳破她那张脸是借来的。」',
    tags: ['奇遇', '狐', '幻'],
    baseWeight: 5, once: true,
    cond: { loc: 'hupo_ao', any: [{ npcFav: { id: 'hupo', gte: 15 } }, { tend: { id: 'humei', gte: 20 } }, { pflag: 'huyang_renhu' }] },
    prefer: { tend: { humei: 0.5 }, locTags: ['狐'] },
    choices: [
      {
        text: '认真记下老狐仙的弱处',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_laohu' },
          { tendAdd: { humei: 3 } },
          { npcFavAdd: { id: 'hupo', n: 2 } },
          { log: { t: '你把狐婆的话一字字记牢。她瞥你一眼：「记这些做什么？……也罢。」', style: '平' } }
        ] }]
      },
      {
        text: '追问那「借来的脸」是什么意思',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_laohu' },
          { tendAdd: { humei: 2, yinguo: 1 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '狐婆的笑淡了：「她的真身，早烂在哪年的猎户陷阱里了。如今这张脸，是偷的。」', style: '平' } }
        ] }]
      }
    ]
  });

  // 剑冢剑灵情报 → mem_intel_jianling
  G.define('event', {
    id: 'ev_jianling_beiwen', title: '崖底碑文',
    text: '断剑崖底压着一方残碑，是当年葬剑之人留下的。碑文剥蚀大半，尚能辨认几行：「……万剑归冢，聚而成灵，认主则随，逆之则诛。欲服其灵者，当以剑入剑，以意御意，不可力敌——力愈强，剑愈狂。」',
    tags: ['奇遇', '剑', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'duanjianya' },
    prefer: { tend: { yujian: 0.5 }, locTags: ['剑'] },
    choices: [
      {
        text: '拓下这段御剑之法',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_jianling' },
          { tendAdd: { yujian: 3 } },
          { log: { t: '你拓下碑文。原来剑冢之灵不能硬撼，只能以剑意相认、相服。', style: '平' } }
        ] }]
      },
      {
        text: '对着残碑，揣摩「以剑入剑」',
        cond: { tend: { id: 'yujian', gte: 20 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_jianling' },
          { tendAdd: { yujian: 5 } },
          { insight: { id: 'jianzhong_ming', t: '剑冢的灵，力愈强它愈狂。要服它，得收了杀心，以剑意相和。', confirm: true } },
          { log: { t: '你照碑文收敛剑意。满崖剑鸣竟柔和了，像在回应一个肯听话的人。', style: '平' } }
        ] }]
      }
    ]
  });

  // 寒潭蛟情报 → mem_intel_hanjiao
  G.define('event', {
    id: 'ev_hanjiao_yiwen', title: '老渔的告诫',
    text: '河神渡的老艄公听说你要去寒潭，连连摆手：「那潭里盘着条千年寒蛟！它吐寒息能冻住一片水面，鳞甲又厚又滑，寻常刀剑近不得身。可它有死穴——蛟属阴寒，最受不得雷火，一炸就缩。当年有个雷修，就是逮着雷雨天，把它逼出了潭。」',
    tags: ['奇遇', '渡', '寒'],
    baseWeight: 5, once: true,
    cond: { any: [{ loc: 'heshen_du' }, { loc: 'hantan' }] },
    prefer: { tend: { handu: 0.4 }, locTags: ['寒', '水'] },
    choices: [
      {
        text: '记下寒蛟畏雷火的死穴',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_hanjiao' },
          { tendAdd: { handu: 2 } },
          { npcFavAdd: { id: 'heshen_po', n: 1 } },
          { log: { t: '你牢牢记下：寒蛟怕雷火，雷雨天是它的劫数。', style: '平' } }
        ] }]
      },
      {
        text: '细问那雷修后来如何',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_hanjiao' },
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '老艄公叹气：「逼出来了，也没杀成。那雷修……第二年开春，浮上了岸。」', style: '凶' } }
        ] }]
      }
    ]
  });

  // 后山兽王情报 → mem_intel_shouwang
  G.define('event', {
    id: 'ev_shouwang_zuxun', title: '兽栏祖训',
    text: '后山兽径的旧兽栏壁上，刻着驯兽人世代相传的祖训。其中一段单论那头兽王：「兽王者，群兽之主，威压最盛，蛮力最沉，正面硬撼者必死。然兽通灵性——以更强之威慑之，或以兽魂乱其号令，则群兽自溃，王亦可制。切记：示弱者死，争主者生。」',
    tags: ['奇遇', '兽', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'houshan_lin', any: [{ tend: { id: 'shouhun', gte: 15 } }, { pflag: 'xunshou_tongxing' }, { birth: 'xunshou_ren' }] },
    prefer: { tend: { shouhun: 0.5 }, locTags: ['兽'] },
    choices: [
      {
        text: '记下「争主则生」的兽王之道',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_shouwang' },
          { tendAdd: { shouhun: 3 } },
          { log: { t: '你记牢了：对兽王不能示弱，要以更盛的威压，跟它争这个「主」字。', style: '异象' } }
        ] }]
      },
      {
        text: '揣摩「以兽魂乱其号令」',
        cond: { tend: { id: 'shouhun', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_shouwang' },
          { tendAdd: { shouhun: 5 } },
          { insight: { id: 'shou_yu', t: '兽王靠号令统群兽。我若能乱了它的号令，群兽一散，它就只剩一身蛮力。', confirm: true } },
          { log: { t: '你对着祖训，试着引动身后的兽魂。它们躁动起来，跃跃欲与那远方的王一争。', style: '异象' } }
        ] }]
      }
    ]
  });

  // 乱葬厉祖情报 → mem_intel_lizu
  G.define('event', {
    id: 'ev_lizu_canbei', title: '镇岗残碑',
    text: '乱葬岗口立着半截被推倒的镇岗碑，碑阴刻着百年前一位游方僧的题记：「此岗百年怨气，聚于一祖。其性畏香火净土、畏雷火、畏因果勾连。寻常刀兵伤其皮毛，唯当面诵其旧名、清其旧账，方能教它散去。立此碑者，镇得一时，镇不得一世。」',
    tags: ['奇遇', '葬', '阴邪', '因果'],
    baseWeight: 5, once: true,
    cond: { loc: 'luanzang_gang' },
    prefer: { tend: { yinguo: 0.4 }, locTags: ['阴邪'], wvar: [{ id: 'ghostQi', gte: 40, boost: 1.4 }] },
    choices: [
      {
        text: '拓下厉祖的三畏',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_lizu' },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你记牢了：乱葬厉祖畏香火、畏雷火、畏因果——清了它的旧账，它才肯散。', style: '因果' } }
        ] }]
      },
      {
        text: '替这半截镇岗碑重新立起',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_lizu' },
          { tendAdd: { xianghuo: 2 } },
          { counterAdd: { xinmo: -2 } },
          { wvarAdd: { ghostQi: -2 } },
          { fame: 1 },
          { log: { t: '你费力扶正了残碑。当夜，岗上的阴风，难得地歇了一宿。', style: '因果' } }
        ] }]
      }
    ]
  });

  // 河神情报 → mem_intel_heshen
  G.define('event', {
    id: 'ev_heshen_cibei', title: '河婆的祭法',
    text: '河神渡的河婆把你拉到一旁，压低了声音：「河里那位，不是恶神，是淹死的人太多，怨气养成了水祸。它最认香火还愿——欠它的愿还清了，它的水势就软。真要动它，得趁退潮、避开它聚水成势的时候，从香案这头下手。硬碰它的水，十个去九个回不来。」',
    tags: ['奇遇', '渡', '香火', '水'],
    baseWeight: 5, once: true,
    cond: { loc: 'heshen_du', any: [{ npcFav: { id: 'heshen_po', gte: 15 } }, { tend: { id: 'xianghuo', gte: 20 } }, { pflag: 'yujia_xuanze' }] },
    prefer: { tend: { xianghuo: 0.5 }, locTags: ['香火'] },
    choices: [
      {
        text: '记下河神「认香火、避水势」的门道',
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_heshen' },
          { tendAdd: { xianghuo: 3 } },
          { npcFavAdd: { id: 'heshen_po', n: 2 } },
          { log: { t: '你记牢了：制河神要靠香火还愿，避其水势，从香案下手。', style: '因果' } }
        ] }]
      },
      {
        text: '随河婆学一遍祭河的仪轨',
        cond: { tend: { id: 'xianghuo', gte: 25 } },
        outcomes: [{ weight: 1, effects: [
          { memAdd: 'mem_intel_heshen' },
          { tendAdd: { xianghuo: 5 } },
          { insight: { id: 'he_huan', t: '河神认愿不认人。我学全了祭河的仪轨——还得清愿，就镇得住它的水。', confirm: true } },
          { log: { t: '河婆一句句教你祭文。念到末了，河面竟起了一圈温顺的回波。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════════════════════
  // v2 ── 旗舰奇遇：剑冢主门（五分支，照 spec §4.3）
  //   普通三选项（探/试/退）+ 御剑暗门（认主）+ 前世暗门（legacy）
  //   认主成功 → legacySet jianzhong_renzhu + 上品武器；跟进 queueOnly 结局
  // ═══════════════════════════════════════════════════════════
  G.define('event', {
    id: 'ev_jianzhong_zhumen', title: '剑冢主门',
    text: '循着满崖剑鸣走到最深处，石壁豁然中分，露出一座剑冢——四壁嵌满古剑，中央一方石台，台上悬着一柄通体莹白的长剑，剑不落地，悬于半空，剑尖朝下，正对着台前一个模糊的人形凹痕，像在等一个人站进去。满冢之剑，都朝那柄白剑低着头。',
    tags: ['奇遇', '剑', '隐秘'],
    baseWeight: 4, once: true,
    cond: { loc: 'duanjianya', any: [{ mem: 'mem_jianzhong_jianming' }, { pflag: 'jianzhong_yindao' }, { tend: { id: 'yujian', gte: 30 } }] },
    prefer: { tend: { yujian: 1.0 }, locTags: ['剑'] },
    choices: [
      {
        text: '取台下嵌壁的一柄古剑',
        outcomes: [
          { weight: 6, effects: [
            { itemAdd: { id: 'tiejian', n: 1 } },
            { tendAdd: { yujian: 3 } },
            { log: { t: '你拔下一柄壁上古剑。剑骨未朽，可那柄悬空的白剑，纹丝未动。', style: '平' } }] },
          { weight: 4, effects: [
            { hp: -6 },
            { itemAdd: { id: 'jianzhong_jue_can', n: 1 } },
            { tendAdd: { yujian: 2 } },
            { log: { t: '剑壁忽然剑气大作，削了你一道口子。你抓了片刻在壁的剑诀，退了开。', style: '凶' } }] }
        ]
      },
      {
        text: '试着站进那个人形凹痕',
        outcomes: [
          { weight: 5, effects: [
            { combat: { enemy: 'jianzhong_canling',
              intro: '你刚踏进凹痕，悬空白剑骤然转向你！满冢古剑同时出鞘，凝成一道剑灵的残影，向你试剑！',
              onWin: [{ tendAdd: { yujian: 4 } }, { itemAdd: { id: 'jianzhong_jue_can', n: 1 } },
                      { log: { t: '残影败退，没入白剑。白剑微微一颤，似在重新打量你。', style: '平' } }],
              onFlee: [{ hp: -8 }, { counterAdd: { xinmo: 2 } }, { log: { t: '你被满冢剑气逼出凹痕。白剑归位，剑尖却一直追着你，直到你出冢。', style: '凶' } }] } }] },
          { weight: 5, effects: [
            { hp: -10 },
            { injure: { months: 1, severity: 1 } },
            { tendAdd: { yujian: 2 } },
            { log: { t: '凹痕不认你。一踏进去，满冢剑气齐齐压下，把你掀翻在地。', style: '凶' } }] }
        ]
      },
      {
        text: '冢非吾主，长揖而退',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { qi: 3 },
          { log: { t: '你对着剑冢长揖一礼，退了出去。强求来的主，剑也不认。', style: '因果' } }
        ] }]
      },
      {
        text: '收敛剑意，以心与白剑相认',
        cond: { tend: { id: 'yujian', gte: 45 } },
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'jianzhong_jianling',
            intro: '你站进凹痕，收尽杀意，以心相邀。白剑化作万千剑光，剑冢之灵显形——它要的不是力，是认主之人，敢与它以命相照。',
            onWin: [
              { bossSet: { enemy: 'jianzhong_jianling', alive: false } },
              { legacySet: { id: 'jianzhong_renzhu' } },
              { itemAdd: { id: 'canjian_yinhen', n: 1 } },
              { tendAdd: { yujian: 10 } },
              { qi: 8 },
              { pflagSet: { id: 'de_jianzhong' } },
              { fame: 18 },
              { insight: { id: 'jianzhong_ming', t: '剑冢认我作了主。从此满冢之剑，皆随我意——这一身剑意，是它替我守了百年的。', confirm: true } },
              { rumorAdd: { t: '断剑崖一夜剑鸣鼎沸，有人说，那座千年剑冢，终于认下了一个主人。', fame: 10 } },
              { eventDelay: { id: 'ev_jianzhong_renzhu_jieju', months: 3, note: '剑冢认主，崖下铸剑老人有话' } }
            ],
            onFlee: [
              { hp: -12 },
              { counterAdd: { xinmo: 3 } },
              { log: { t: '你心神一乱，剑意散了。白剑没有伤你，只是缓缓归位——它在等一个不会动摇的人。', style: '凶' } }] } }
        ] }]
      },
      {
        text: '以前世剑缘，唤醒白剑',
        cond: { legacy: 'jianzhong_renzhu' },
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'canjian_yinhen', n: 1 } },
          { tendAdd: { yujian: 12 } },
          { qi: 10 },
          { counterAdd: { xinmo: -3 } },
          { pflagSet: { id: 'de_jianzhong' } },
          { insight: { id: 'jianzhong_ming', t: '我前世认过这座剑冢的主。白剑记得我——这一世我一进冢，它便落进了我掌心。', confirm: true } },
          { log: { t: '你尚未站定，悬空的白剑已自行飞来，剑柄稳稳贴上你的掌心。', style: '异象' } },
          { log: { t: '满冢古剑齐齐鸣应，像一群旧部，迎回了久别的主人。', style: '异象' } }
        ] }]
      }
    ]
  });

  // 剑冢认主·跟进（queueOnly，由认主 eventDelay 点名；铸剑老人收束）
  G.define('event', {
    id: 'ev_jianzhong_renzhu_jieju', title: '崖下问剑',
    queueOnly: true, once: true, baseWeight: 0,
    tags: ['奇遇', '剑', '因果'],
    textFn: function () {
      return G.cond({ npcAlive: 'zhujian_weng' })
        ? '断剑崖下，老铸剑人早就等着你了。他盯着你腰间那柄莹白的古剑，浑浊的眼里头一回有了光：「我守这崖一辈子，就盼着剑冢认个主。今日……总算盼到了。」'
        : '断剑崖下，老铸剑人的窝棚空了，炉火早冷。你腰间那柄认了主的古剑，却兀自轻鸣，像在替一个没等到这一天的人，叹一口气。';
    },
    effects: [
      { branch: { cond: { npcAlive: 'zhujian_weng' },
        then: [
          { npcFavAdd: { id: 'zhujian_weng', n: 15 } },
          { itemAdd: { id: 'jianzhong_jue_can', n: 1 } },
          { tendAdd: { yujian: 4 } },
          { rumorAdd: { t: '听说断剑崖那座剑冢认了主，崖下的老铸剑人，逢人就笑。', fame: 2 } },
          { log: { t: '老人把珍藏的半篇剑诀塞给你：「剑冢认了主，我这把老骨头，也算交了差。」', style: '平' } }
        ],
        else: [
          { tendAdd: { yujian: 3 } },
          { counterAdd: { xinmo: 2 } },
          { insight: { id: 'jianzhong_ming', t: '守崖的老人没等到我认主就走了。这柄剑，替他记着那份没说出口的盼。', confirm: true } },
          { log: { t: '你在冷透的炉灰里，捡到老人没打完的最后一柄剑坯。你替他，把它磨利了。', style: '因果' } }
        ] } }
    ]
  });

  // ═══════════════════════════════════════════════════════════
  // v2 ── 轮回限定 / 前世痕迹奇遇
  // ═══════════════════════════════════════════════════════════

  // 狐养前缘（轮回者限定 {life:{gte:2}}：前世也曾是狐婆养大的）
  G.define('event', {
    id: 'ev_huyang_qianyuan', title: '坳口旧缘',
    text: '你头一回踏进狐婆坳，坳口那只盘着的老狐却抬起头，定定看了你许久，幽幽叹了口气，化作人形的狐婆拄拐迎上来：「又是你。换了张脸，换了个名字，可你身上那股气味，我闻了几辈子，认得。这一世，你还认不认我这个……婆婆？」',
    tags: ['奇遇', '狐', '因果', '梦'],
    baseWeight: 5, once: true,
    cond: { loc: 'hupo_ao', life: { gte: 2 } },
    prefer: { tend: { humei: 0.8 }, locTags: ['狐'] },
    choices: [
      {
        text: '认下这隔世的婆婆',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'hupo', n: 20 } },
          { tendAdd: { humei: 8 } },
          { itemAdd: { id: 'hujiu_zhui', n: 1 } },
          { counterAdd: { xinmo: -3 } },
          { pflagSet: { id: 'huyang_qianyuan_jian' } },
          { insight: { id: 'hu_mi', title: '坳里的迷', t: '我前世是狐婆养大的。隔了几世，她还认得我的气味。这份缘，是真的。', confirm: true } },
          { log: { t: '你唤了一声婆婆。老狐浑浊的眼里落下泪来，把那缕传家的媚气，赠了你。', style: '平' } }
        ] }]
      },
      {
        text: '只认气味，不认这门亲',
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'hupo', n: 3 } },
          { tendAdd: { humei: 4, yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你点头认了那股气味，却没认这门亲。狐婆也不恼，只是笑得有些凉：「也好。」', style: '平' } }
        ] }]
      },
      {
        text: '前尘是债，转身离坳',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 4 } },
          { counterAdd: { xinmo: 3 } },
          { insight: { id: 'hu_mi', t: '坳口那只老狐，认得我好几世。我没回头——有些缘，认了就再难脱身。' } },
          { log: { t: '你转身就走。背后狐婆的叹息追了很远：「躲得过这一世，躲不过下一世。」', style: '凶' } }
        ] }]
      }
    ]
  });

  // 剑冢遗音（前世痕迹奇遇 {legacy:'jianzhong_renzhu'}：前世认过剑冢主，这一世崖下遗有剑意）
  G.define('event', {
    id: 'ev_jianzhong_yiyin', title: '崖下遗音',
    text: '你初到断剑崖，崖壁上一柄锈剑却无端自鸣，绕着你打转，剑尖始终朝你。崖底的乱石间，半埋着一柄你从未见过、却莫名眼熟的断剑——剑格上刻着一个字，正是你前世为这座剑冢，留下的记认。剑意未散，它在等故主回来。',
    tags: ['奇遇', '剑', '因果', '隐秘'],
    baseWeight: 5, once: true,
    cond: { loc: 'duanjianya', legacy: 'jianzhong_renzhu' },
    prefer: { tend: { yujian: 1.0 }, locTags: ['剑'] },
    choices: [
      {
        text: '取回那柄刻着旧记的断剑',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'canjian_yinhen', n: 1 } },
          { tendAdd: { yujian: 8 } },
          { qi: 5 },
          { insight: { id: 'jianzhong_ming', t: '崖下那柄断剑是我前世留的记认。剑意认主，跨了生死也没散。', confirm: true } },
          { log: { t: '你握住断剑，一段不属于这一世的剑意涌进识海——你想起了认主那夜。', style: '异象' } }
        ] }]
      },
      {
        text: '循剑意，重入剑冢深处',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yujian: 6 } },
          { pflagSet: { id: 'jianzhong_yindao' } },
          { qi: 4 },
          { log: { t: '锈剑引着你，一路走到剑冢石门前。门后白剑的鸣声，比谁都熟。', style: '异象' } }
        ] }]
      },
      {
        text: '前世的剑，留给前世',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yujian: 3, yinguo: 2 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你对着那柄断剑拜了拜，没有取。这一世的剑，你想自己挣。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ═══════════════════════════════════════════════════════════
  // v2 ── 新道喂养 / 异象奇遇 ×4
  // ═══════════════════════════════════════════════════════════

  // 寒潭采冰（handu 喂养；含寒蛟幼遭遇风险）
  G.define('event', {
    id: 'ev_hantan_caibing', title: '凿冰人',
    text: '寒潭背阴的一面结着经年不化的蓝冰，镇上识货的肯出高价。你下到潭边凿冰，越凿越深，寒气也越来越烈——凿到第三层时，冰里隐隐透出一抹游动的青影，正贴着冰面，朝你这边游来。',
    tags: ['奇遇', '寒', '水', '劳作'],
    baseWeight: 6, once: false,
    cond: { loc: 'hantan' },
    prefer: { tend: { handu: 0.6 }, locTags: ['寒'] },
    choices: [
      {
        text: '抢在青影靠近前，凿满一筐就走',
        outcomes: [
          { weight: 6, effects: [
            { money: 8 },
            { tendAdd: { handu: 3 } },
            { hp: -4 },
            { log: { t: '你手脚麻利地凿满一筐蓝冰，赶在那青影破冰前撤上了岸。', style: '平' } }] },
          { weight: 4, effects: [
            { itemAdd: { id: 'lanyingshi', n: 1 } },
            { tendAdd: { handu: 2 } },
            { hp: -6 },
            { log: { t: '冰层里冻着一块蓝萤石，你连冰一起撬了下来，冻得直哆嗦。', style: '平' } }] }
        ]
      },
      {
        text: '不退，迎着那青影凿下去',
        cond: { any: [{ tend: { id: 'handu', gte: 20 } }, { stat: { id: 'ti', gte: 5 } }, { pflag: 'caibing_naihan' }, { pflag: 'hantan_jianlan' }] },
        outcomes: [{ weight: 1, effects: [
          { combat: { enemy: 'hanjiao_you',
            intro: '冰面轰然炸裂，一条青鳞幼蛟破冰而出，寒息扑面！',
            onWin: [{ tendAdd: { handu: 5 } }, { itemAdd: { id: 'hanhuang_jing', n: 1 } }, { counterAdd: { shaqi: 1 } },
                    { log: { t: '幼蛟负伤遁回潭底。你掌中攥着一片青鳞，寒得发烫。', style: '平' } }],
            onFlee: [{ hp: -8 }, { counterAdd: { xinmo: 1 } }, { log: { t: '幼蛟的寒息冻裂了你的虎口。你弃了冰筐，狼狈上岸。', style: '凶' } }] } }
        ] }]
      },
      {
        text: '寒气太重，今日先收工',
        outcomes: [{ weight: 1, effects: [
          { money: 3 },
          { tendAdd: { handu: 1 } },
          { log: { t: '你只凿了小半筐就收了手。那青影贴着冰面，没再靠近。', style: '平' } }
        ] }]
      }
    ]
  });

  // 后山引群（shouhun 喂养；驭兽群）
  G.define('event', {
    id: 'ev_houshan_qun', title: '引群',
    text: '后山兽径上，一群野兽正围着一头受伤的同类低吼。你身上不知何时染了它们能懂的气味，群兽察觉到你，竟没有扑上来，只是齐刷刷转过头，喉间发出试探的呜咽——像在问：你，是不是它们的同类？',
    tags: ['奇遇', '兽', '野外'],
    baseWeight: 6, once: false,
    cond: { loc: 'houshan_lin' },
    prefer: { tend: { shouhun: 0.7 }, locTags: ['兽'] },
    choices: [
      {
        text: '学着它们的呜声，回应过去',
        cond: { any: [{ tend: { id: 'shouhun', gte: 20 } }, { pflag: 'xunshou_tongxing' }, { birth: 'xunshou_ren' }] },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { shouhun: 6 } },
          { itemAdd: { id: 'shouhun_fu', n: 1 } },
          { counterAdd: { shaqi: 1 } },
          { insight: { id: 'shou_yu', title: '兽的话', t: '我学它们的呜声回应，群兽竟把我认作了同类。兽魂随我，呼之即来。', confirm: true } },
          { log: { t: '你回了一声呜咽。群兽伏低了身子，绕着你打转，认了你这个外来的「头」。', style: '异象' } }
        ] }]
      },
      {
        text: '救下那头受伤的兽',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { shouhun: 3 } },
            { hp: -3 },
            { npcFavAdd: { id: 'lao_liehu', n: 2 } },
            { log: { t: '你替那头兽包扎了伤。群兽没有走，远远跟着你，到了林边才散。', style: '异象' } }] },
          { weight: 4, effects: [
            { tendAdd: { shouhun: 2 } },
            { hp: -6 },
            { counterAdd: { xinmo: 1 } },
            { log: { t: '你刚一靠近，那头伤兽受惊扑咬。你挂了彩，它却也认住了你的气味。', style: '凶' } }] }
        ]
      },
      {
        text: '不沾兽性，绕道而行',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { shaqi: -1 } },
          { log: { t: '你绕开了那群兽。它们的呜咽在背后追了几声，渐渐散了。', style: '平' } }
        ] }]
      }
    ]
  });

  // 还愿夜祭（xianghuo 喂养；河神渡/还愿线）
  G.define('event', {
    id: 'ev_heshen_huanyuan', title: '夜祭还愿',
    text: '河神渡的夜里，几户人家提着祭品来还愿——有人求来的平安，有人讨来的生计，到了该还的时候。河婆主祭，香烟笔直地升上夜空。轮到一户还不起愿的人家时，香案前一阵骚动：他们空着手，跪在那里，抖个不停。',
    tags: ['奇遇', '香火', '渡', '夜'],
    baseWeight: 6, once: false,
    cond: { loc: 'heshen_du' },
    prefer: { tend: { xianghuo: 0.7 }, locTags: ['香火'] },
    choices: [
      {
        text: '替那户人家把愿还上',
        cond: { money: { gte: 6 } },
        outcomes: [{ weight: 1, effects: [
          { money: -6 },
          { tendAdd: { xianghuo: 6 } },
          { counterAdd: { xinmo: -4 } },
          { fame: 2 },
          { npcFavAdd: { id: 'heshen_po', n: 4 } },
          { itemAdd: { id: 'xiangyuan_zhu', n: 1 } },
          { insight: { id: 'huan_yuan', title: '没还完的愿', t: '我替还不起的人还了愿。河婆说，替人还愿的善，香火记得最牢。', confirm: true } },
          { log: { t: '你替那家添了祭品。河婆替你也上了一炷香，香烟笔直，久久不散。', style: '因果' } }
        ] }]
      },
      {
        text: '随众人上香，沾一沾这香火',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { xianghuo: 4 } },
            { counterAdd: { xinmo: -2 } },
            { qi: 3 },
            { log: { t: '你跟着众人拜了三拜。香烟绕过你的眉心，留下一点说不清的暖。', style: '因果' } }] },
          { weight: 4, effects: [
            { tendAdd: { xianghuo: 2, yinguo: 1 } },
            { log: { t: '你在一旁看完了整场还愿。原来这渡口的太平，是一炷香一炷香换来的。', style: '因果' } }] }
        ]
      },
      {
        text: '看那还不起愿的人家如何收场',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 3 } },
          { counterAdd: { xinmo: 2 } },
          { wvarAdd: { villageFear: 2 } },
          { log: { t: '河婆叹气让他们先回。可那夜，河水又涨了三寸——欠河神的愿，迟早要还。', style: '凶' } }
        ] }]
      },
      {
        text: '应着河底钟声，替众人主祭',
        cond: { pflag: 'hedi_wenzhong' },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xianghuo: 7 } },
          { counterAdd: { xinmo: -5 } },
          { wvarAdd: { villageFear: -4 } },
          { fame: 3 },
          { npcFavAdd: { id: 'heshen_po', n: 6 } },
          { rumorAdd: { t: '河神渡换了个主祭的后生，应着河底的钟声念祭文，那水竟服服帖帖。', fame: 2 } },
          { insight: { id: 'he_huan', title: '河里的手', t: '我闻过河底沉钟，便接得住主祭的位子。应钟还愿，河神认我念的祭文。', confirm: true } },
          { log: { t: '你应着隐隐的河底钟声起祭。每念一句，河面便平一分，众人看你的眼神变了。', style: '因果' } }
        ] }]
      }
    ]
  });

  // 狐坳学媚（humei 喂养；狐婆传术残篇）
  G.define('event', {
    id: 'ev_hupo_xueyi', title: '婆婆的本事',
    text: '狐婆坳的火塘边，老狐婆破天荒地教起你「本事」来。她说的不是法术，是怎么把一句话说进人心坎里，怎么一个眼神就让人卸了防备。「人哪，」她拨着炭，眼角那抹红一闪，「最经不起的就是有人懂他。学会了，这世道你横着走。」',
    tags: ['奇遇', '狐', '幻', '交际'],
    baseWeight: 6, once: false,
    cond: { loc: 'hupo_ao', any: [{ npcFav: { id: 'hupo', gte: 10 } }, { tend: { id: 'humei', gte: 15 } }, { pflag: 'huyang_renhu' }, { pflag: 'fan_le_hugu' }, { pflag: 'hukeng_rumeng' }, { pflag: 'huyang_qianyuan_jian' }, { pflag: 'xiban_qiang' }] },
    prefer: { tend: { humei: 0.7 }, locTags: ['狐'] },
    choices: [
      {
        text: '用心学这门哄人的本事',
        outcomes: [
          { weight: 6, effects: [
            { tendAdd: { humei: 5 } },
            { npcFavAdd: { id: 'hupo', n: 3 } },
            { fame: 1 },
            { log: { t: '你学得极快。狐婆啧啧称奇：「天生的料子。可惜了，不做狐。」', style: '平' } }] },
          { weight: 4, effects: [
            { tendAdd: { humei: 3 } },
            { counterAdd: { xinmo: 2 } },
            { itemAdd: { id: 'hujiu_zhui', n: 1 } },
            { log: { t: '狐婆赠你一枚媚气凝的玉坠：「拿去练手。哄人之前，先别把自己哄了。」', style: '平' } }] }
        ]
      },
      {
        text: '只学辨人心，不学惑人心',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { humei: 2, yinguo: 2 } },
          { npcFavAdd: { id: 'hupo', n: 1 } },
          { insight: { id: 'kan_ren', title: '看人', t: '狐婆教我看人心。看得透不一定要哄——知道对方要什么，本身就是本事。' } },
          { log: { t: '狐婆笑你迂：「只看不哄？也罢，知人心，已是半个狐了。」', style: '平' } }
        ] }]
      },
      {
        text: '这本事太邪，婉拒了',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: -1 } },
          { npcFavAdd: { id: 'hupo', n: -1 } },
          { log: { t: '你推说学不来。狐婆收了笑：「守得住本心是好事。可这世道，老实人吃亏。」', style: '平' } }
        ] }]
      }
    ]
  });

  // 乱葬收骸（xianghuo/yinguo 喂养；拾骸老者线）
  G.define('event', {
    id: 'ev_luanzang_shouhai', title: '收骸',
    text: '乱葬岗边，拾骸老者背着骨笼，正一具一具地收殓那些被野狗刨出来的无主骸骨。他做这桩没人愿做的活计，已经几十年。见你来，他递过一副手套：「搭把手？给死人收骨头，不积阴德，积的是良心。良心这东西，比阴德金贵。」',
    tags: ['奇遇', '葬', '善', '阴邪'],
    baseWeight: 6, once: false,
    cond: { loc: 'luanzang_gang' },
    prefer: { tend: { xianghuo: 0.5 }, locTags: ['葬'], wvar: [{ id: 'ghostQi', gte: 30, boost: 1.2 }] },
    choices: [
      {
        text: '戴上手套，帮老者收骸',
        outcomes: [
          { weight: 7, cond: { pflag: 'juemu_shouku' }, effects: [
            { tendAdd: { xianghuo: 5, yinguo: 1 } },
            { counterAdd: { xinmo: -4 } },
            { branch: { cond: { npcAlive: 'shihai_zhe' },
              then: [{ npcFavAdd: { id: 'shihai_zhe', n: 8 } }],
              else: [{ fame: 2 }] } },
            { wvarAdd: { ghostQi: -3 } },
            { log: { t: '入土的手艺你熟。收殓、培土、压纸钱，一气呵成。老者看直了眼：「行家。」', style: '因果' } }] },
          { weight: 6, cond: { npcAlive: 'shihai_zhe' }, effects: [
            { tendAdd: { xianghuo: 4 } },
            { counterAdd: { xinmo: -3 } },
            { npcFavAdd: { id: 'shihai_zhe', n: 5 } },
            { wvarAdd: { ghostQi: -2 } },
            { log: { t: '你陪老者收了一下午骸骨。他指着最大那座坟：「那位，可别去惊动。」', style: '因果' } }] },
          { weight: 4, effects: [
            { tendAdd: { xianghuo: 3 } },
            { counterAdd: { xinmo: -2 } },
            { fame: 1 },
            { log: { t: '你默默收殓了几具无主骸骨。培土时，岗上的阴风都让了你三分。', style: '因果' } }] }
        ]
      },
      {
        text: '替这些孤魂上一炷香',
        cond: { any: [{ pflag: 'qin_le_xianghuo' }, { pflag: 'huanyuan_xushen' }, { pflag: 'gengfu_yejian' }, { tend: { id: 'xianghuo', gte: 15 } }] },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xianghuo: 5 } },
          { counterAdd: { xinmo: -4 } },
          { wvarAdd: { ghostQi: -3 } },
          { insight: { id: 'huan_yuan', title: '没还完的愿', t: '我替乱葬岗的孤魂上了香。无人祭的魂，最认这一点香火——它们记得谁待它们好。' } },
          { log: { t: '你点起一炷香插在岗头。满岗磷火，竟一齐朝那点香光，矮了下去。', style: '因果' } }
        ] }]
      },
      {
        text: '心里发毛，没敢久留',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你帮着搭了把手就走。老者在身后叹气：「年轻人怕，是对的。」', style: '平' } }
        ] }]
      }
    ]
  });

  // 崖前铸剑（yujian 喂养；铸剑老人传艺，断剑崖）
  G.define('event', {
    id: 'ev_duanjianya_zhujian', title: '崖前炉火',
    text: '断剑崖下，老铸剑人支起了炉子，叮叮当当地修一柄崖上取下的断剑。他抬眼瞧你：「光听剑没用，剑这东西，得自己上手才懂。来，替我拉风箱——火候到了，我教你认剑骨。」炉火映得满崖断剑都泛起暖红。',
    tags: ['奇遇', '剑', '隐秘', '劳作'],
    baseWeight: 6, once: false,
    cond: { loc: 'duanjianya', any: [{ npcAlive: 'zhujian_weng' }, { tend: { id: 'yujian', gte: 15 } }, { birth: 'zhujian_tu' }, { pflag: 'zhujian_tingjian' }] },
    prefer: { tend: { yujian: 0.7 }, locTags: ['剑'] },
    choices: [
      {
        text: '替老人拉风箱，学认剑骨',
        outcomes: [
          { weight: 6, cond: { npcAlive: 'zhujian_weng' }, effects: [
            { tendAdd: { yujian: 5 } },
            { npcFavAdd: { id: 'zhujian_weng', n: 4 } },
            { hp: -2 },
            { log: { t: '一炉火下来，你的手记住了剑的脾性。老人难得点头：「孺子可教。」', style: '平' } }] },
          { weight: 4, effects: [
            { tendAdd: { yujian: 3 } },
            { itemAdd: { id: 'tiejian', n: 1 } },
            { log: { t: '你蹲在冷炉边自己琢磨修剑。修是修不好，倒摸熟了剑骨的纹理。', style: '平' } }] }
        ]
      },
      {
        text: '取一柄断剑，自己试着开锋',
        cond: { any: [{ tend: { id: 'yujian', gte: 20 } }, { pflag: 'de_jianzhong' }] },
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yujian: 6 } },
          { hp: -4 },
          { itemAdd: { id: 'jianzhong_jue_can', n: 1 } },
          { insight: { id: 'jianzhong_ming', title: '剑冢的鸣', t: '我亲手给一柄断剑开了锋。剑在我手里活过来的那一刻，我懂了什么叫御剑。' } },
          { log: { t: '你照着崖上千剑的剑意，一点点磨开断口。剑成时，它在你掌心轻鸣。', style: '异象' } }
        ] }]
      },
      {
        text: '只看不做，烤会儿火便走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yujian: 2 } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你烤着炉火看老人修剑。叮当声里，崖上的剑鸣似乎也温柔了些。', style: '平' } }
        ] }]
      }
    ]
  });
})();
