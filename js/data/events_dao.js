// js/data/events_dao.js — 道途顿悟事件（Owner: C3）。
//
// 顿悟事件范式（全部严格照 ev_wu_xuejian）：
//   * queueOnly:true + once:true —— 只能被 dao.js 的 eventDelay 点名，不进环境池。
//   * 必含「纳之」与「抑之」两个选择：
//       纳之 → {daoAdvance:"daoId"}（引擎自动：阶段+1、命名显现日志、技能解锁、悟道录确认行）
//       抑之 → {daoSuppress:"daoId"}（引擎自动：tend 减半、心魔+10、悟道录留痕、允许日后再顿悟）
//   * 正文写身体与心境的临界感受；事件标题与正文在「纳之」之前仍不得出现道名。
//
// ── 本文件对外输出 ──
//   v1：ev_wu_xuejian / ev_wu_danyao / ev_wu_leifa / ev_wu_lianti / ev_wu_yinguo
//   v2（新增 5，蓝图 §6 钉死，C4 daos.js 各 dao.awakeningEvent 引用，id 不改）：
//     ev_wu_handu（寒冰）/ ev_wu_shouhun（兽魂）/ ev_wu_xianghuo（香火）/ ev_wu_humei（狐魅）/ ev_wu_yujian（御剑）
//   （纳之 daoAdvance / 抑之 daoSuppress 严格照 ev_wu_xuejian；命名前正文不见道名。）
//
// ── 引用的跨文件 id（均在蓝图钉死表 / ids.js）──
//   道途：handu / shouhun / xianghuo / humei / yujian（C4 daos.js 实现）。
//
// ── 自检十问（对文件整体）──
// 1标签：隐秘+各道元素。2易共现：各自 tend 过阶段2阈值后 1~2 月（dao.js 安排）。3排斥：环境池（queueOnly）。
// 4改状态：daoAdvance/daoSuppress 必落其一，外加倾向/累积量/传闻。5后果：纳之得命名与技能；抑之半废+心魔，
//   但压制本身是构筑（清心散/静养可对冲），日后 tend 回涨可再顿悟。6可解释：积累至临界，水满自溢。
// 7钩子：纳之的 rumorAdd 给 C5 传闻面；抑之的 insight 留痕跨世可见。8有趣选择：两边都有味道——成形是路，
//   压制也是路。9服务 build：五道各自的核心节点。10不暴露：命名前正文只有现象，「它」不名。
(function () {
  'use strict';

  // ════════ 血剑顿悟（基建参考实现，保留）════════
  G.define('event', {
    id: 'ev_wu_xuejian', title: '血中有声',
    queueOnly: true, once: true,
    textFn: function () {
      var hurt = G.player.injury.severity > 0 || G.player.hp < G.player.maxHp * 0.7;
      return (hurt
        ? '旧伤未愈的深夜，那股热意终于不再安分。'
        : '一个再寻常不过的深夜，那股热意忽然不再安分。')
        + '那东西——你只能叫它「它」——顺着血脉爬遍四肢，所过之处，每一道旧伤疤都在发烫。你的刃在三步之外自行出了半寸鞘，嗡鸣如泣。\n它在等你点头。或者摇头。';
    },
    tags: ['隐秘', '血', '剑'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——顺着那股热意走到底',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'xuejian' },
          { tendAdd: { xuejian: 5 } },
          { log: { t: '热意灌入刃身的刹那，你听懂了那声嗡鸣。它不是泣，是应。', style: '血' } },
          { rumorAdd: { t: '后半夜镇北传来一声剑鸣，惊起满林宿鸟。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——咬碎牙关，把它压回去',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'xuejian' },
          { log: { t: '你把手按在刃上，一寸寸将它按回鞘中。', style: '凶' } },
          { log: { t: '嗡鸣止息的刹那，你听见心里某处「咔」了一声。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 丹道顿悟 ════════
  G.define('event', {
    id: 'ev_wu_danyao', title: '满喉药香',
    queueOnly: true, once: true,
    textFn: function () {
      var du = G.player.counters.dandu >= 15;
      return (du
        ? '后半夜，积在你骨血里的药毒忽然安静了——像百川入海前的那一刻平潮。'
        : '后半夜，舌根那缕若有似无的药香骤然炸开。')
        + '这些年尝过咽过熬过的百般药味，此刻在你喉头一味一味地排开，苦是苦，辛是辛，君臣佐使，各归各位。你忽然「看」得见自己五脏之间药力流转的脉络，像看一张烧到一半的方子。\n火候到了。这一炉，是成是废，只差你一句话。';
    },
    tags: ['隐秘', '药'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——引这炉药力归位',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'danyao' },
          { tendAdd: { danyao: 5 } },
          { counterAdd: { dandu: -6 } },
          { log: { t: '满喉药香化作一线暖流坠入丹田。药性顺了，毒性也驯了。', style: '丹' } },
          { rumorAdd: { t: '回春堂的掌柜近来逢人便说，这镇上有条舌头是仙人赏饭吃的。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——一口咽回腹中',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'danyao' },
          { counterAdd: { dandu: 3 } },
          { log: { t: '你把那口药气死死咽了回去。此后半月，吃什么都是一股焦苦。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 雷法顿悟 ════════
  G.define('event', {
    id: 'ev_wu_leifa', title: '骨中先雷',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.world.weather === '雷雨'
        ? '又是雷雨夜。但这一次不一样——你骨缝里的细雷，抢在了天雷的前头。'
        : '窗外晴空万里，你骨缝里的雷声却一阵密过一阵，像隔着一层皮肉在擂鼓。')
        + '每一次震响，你的指尖就亮一分麻意；你甚至说得出，下一道天雷该落在哪座山头。那股在你骨头里养了许久的东西已经攒满了，正隔着天灵盖，与天上的某种东西遥遥相认。\n它要一个出口。给，或者不给。';
    },
    tags: ['隐秘', '雷'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——开骨引它上天灵',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'leifa' },
          { tendAdd: { leifa: 5 } },
          { hp: -5 },
          { log: { t: '一声只有你听得见的炸雷，自尾椎直贯天灵。', style: '雷' } },
          { log: { t: '那一晚你眼底有电光一闪而没，看什么都亮了一层。', style: '雷' } },
          { rumorAdd: { t: '昨夜有道雷落进镇子附近，却没伤着一草一木。怪事。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——封骨锁髓压下去',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'leifa' },
          { hp: -8 },
          { log: { t: '你咬牙把那阵震颤一寸寸压回骨髓。从此每逢阴雨，周身骨节隐隐作痛。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 炼体顿悟 ════════
  G.define('event', {
    id: 'ev_wu_lianti', title: '千锤之夜',
    queueOnly: true, once: true,
    textFn: function () {
      var hurt = G.player.injury.severity > 0;
      return (hurt
        ? '伤还没好利索，可今夜疼法不一样——疼得有章法。'
        : '今夜你的身体烫得像一座刚熄火的窑。')
        + '挨过的每一拳、扛过的每一道伤、压断又长拢的每一寸筋骨，此刻在皮肉深处一处处应声发热，像满炉烧红的铁同时听见了锤响。你的身体替你记着全部的账。\n现在它问你：这一锤，落，还是不落。';
    },
    tags: ['隐秘', '体'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——以痛为薪，落锤',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'lianti' },
          { tendAdd: { lianti: 5 } },
          { statAdd: { ti: 1 } },
          { log: { t: '筋骨齐鸣如夯。一层旧皮褪下，你赤脚踩进雪里，不觉得冷。', style: '体' } },
          { rumorAdd: { t: '有人后半夜听见镇边传来打夯一样的闷响，一声接一声。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——松开咬了多年的牙',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'lianti' },
          { hp: 10 },
          { log: { t: '你长长吐出那口气。身上轻了，心里却空落落的，像撂下一件没打完的铁。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 因果顿悟 ════════
  G.define('event', {
    id: 'ev_wu_yinguo', title: '看见线的人',
    queueOnly: true, once: true,
    textFn: function () {
      var multi = G.player.lifeIndex >= 2;
      return '梦又来了。这一次你没有醒——你站在梦里，看见天地万物都拖着一条极细的线：镇口的老人连着山上的坟，檐下的燕连着去年的巢。'
        + (multi
          ? '而你自己身后的线密得吓人，穿过生，穿过死，一路通向你记不全的那几场前尘。'
          : '而你自己身后的线又密又沉，一路通向你看不见的远处。')
        + '\n有一只手，正把其中一根线头，轻轻递到你面前。';
    },
    tags: ['隐秘', '因果', '梦'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——接过那根线头',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'yinguo' },
          { tendAdd: { yinguo: 5 } },
          { counterAdd: { xinmo: -3 } },
          { log: { t: '你伸手接住。醒来时晨光大亮，看人看物，目光总先落在他们身后的空处。', style: '因果' } },
          { rumorAdd: { t: '镇上有人说，那后生看人的眼神，像在看你身后站着的谁。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——在梦里背过身去',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'yinguo' },
          { counterAdd: { xinmo: 4 } },
          { log: { t: '你背过身。可那只手的影子落在你肩上，凉了很多天。', style: '凶' } },
          { log: { t: '有些账，背过身去也还在长利息。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ════════ 寒冰顿悟（ev_wu_handu）════════
  // 母题：寒毒、蓝萤、寒潭。临界感受=骨血里那点凉攒成了实物，要么纳为利器，要么压回去。
  G.define('event', {
    id: 'ev_wu_handu', title: '骨里的霜',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.world.season === '冬' || G.world.weather === '雪'
        ? '又是一个滴水成冰的夜。可这一回，最冷的不是窗外，是你自己的骨头里。'
        : '盛夏的夜里你却盖了三层被，仍止不住地抖——冷不是从外头来的。')
        + '这些年钻进骨缝的那点凉，今夜忽然不再四散，反而一寸寸往一处攒。攒到胸口，凝成一小团硬硬的、几乎称得上锋利的东西。你呵出的气是白的，落在被面上，结了一层薄霜。\n它在等你：是把它含住，还是化开。';
    },
    tags: ['隐秘', '寒'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——把那团凉含在胸口',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'handu' },
          { tendAdd: { handu: 5 } },
          { hp: -4 },
          { log: { t: '你含住那团寒。它顺着血脉游遍四肢，所过之处，痛觉都迟钝了。', style: '异象' } },
          { log: { t: '你伸手按上窗棂，掌印过处，结了一圈细白的霜花。', style: '异象' } },
          { rumorAdd: { t: '入夏头一桩怪事：有户人家的水缸，半夜结了层冰。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——逼一口热血把它化开',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'handu' },
          { hp: -6 },
          { log: { t: '你咬破舌尖，逼一口热血冲向胸口，把那团凉一点点烘化。', style: '凶' } },
          { log: { t: '化是化开了。可从此一到阴雨天，你的关节就先疼起来。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 兽魂顿悟（ev_wu_shouhun）════════
  // 母题：黑山妖兽、狼群、兽王坟。临界感受=身后跟着的那些影子第一次有了重量，肯听你的。
  G.define('event', {
    id: 'ev_wu_shouhun', title: '身后的影',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.player.counters.xuexing >= 6
        ? '满身血腥味的这个夜里，你梦见自己又站在了那片兽道上。'
        : '入夜后山风一起，你莫名走到了屋外，对着黑山的方向站定。')
        + '这些年你识过太多兽踪、收过太多兽尸，那些走兽的魂气，原来一直没散——它们排在你身后，像一群没主的卒。今夜它们头一回有了分量，齐刷刷把脸转向你，喉间滚着低吼，等一个号令。\n你只要开口，它们就是你的。可一旦应了，你也就成了它们的一员。';
    },
    tags: ['隐秘', '兽'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——向那群影子伸出手',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'shouhun' },
          { tendAdd: { shouhun: 5 } },
          { counterAdd: { shaqi: 1 } },
          { log: { t: '你一伸手，身后群影呜地涌上，没入你的脊背，沉甸甸地落了根。', style: '异象' } },
          { log: { t: '那一夜起，黑山的兽见了你都绕道——你身上有它们怕的味道。', style: '异象' } },
          { rumorAdd: { t: '猎户说山里的兽近来邪性，远远见了某个后生，扭头就跑。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——喝散那群影子',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'shouhun' },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你低喝一声，挥手将那群影子驱散。它们退进黑暗，没有走远。', style: '凶' } },
          { log: { t: '此后每逢月圆，你后颈总像有无数双眼睛，在等你回头。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 香火顿悟（ev_wu_xianghuo）════════
  // 母题：香火、还愿、河神、邪神。临界感受=多年吃的香火在心口聚成一点暖，能护身也能净邪。
  G.define('event', {
    id: 'ev_wu_xianghuo', title: '心口一点暖',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.player.counters.xinmo >= 20
        ? '心魔最重的这个夜里，你鬼使神差地走进了香烟最浓的地方。'
        : '一个再寻常不过的夜里，一缕香烟无端从你心口升起。')
        + '这些年受过的供、上过的香、替人还过的愿，原来没有白费——它们一点点积在你心口，今夜聚成一团温吞吞的暖。这团暖一亮，四下的阴气都退了三尺；连你自己心里那些见不得光的念头，都被它照得无处藏身。\n它问你：要不要把这点暖，认作护身的灯。';
    },
    tags: ['隐秘', '香火'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——把这点暖认作灯',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'xianghuo' },
          { tendAdd: { xianghuo: 5 } },
          { counterAdd: { xinmo: -5 } },
          { log: { t: '你合掌护住心口那点暖。它倏地一亮，满室阴影齐齐退散。', style: '异象' } },
          { log: { t: '从此你走夜路不必再提灯——心里这盏，照得更远。', style: '异象' } },
          { rumorAdd: { t: '有人说那后生夜里走过乱坟岗，连个野鬼都没敢凑近。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——把这点暖吹熄',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'xianghuo' },
          { counterAdd: { xinmo: 6 } },
          { log: { t: '你不愿欠人香火的人情，一口气把那点暖吹熄了。', style: '凶' } },
          { log: { t: '灯灭的刹那，四下的阴气又悄悄漫了回来，贴着你的脚跟。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 狐魅顿悟（ev_wu_humei）════════
  // 母题：狐坳、狐祟、幻术。临界感受=照镜时镜里那张脸开始替你笑，媚气攒到了临界。
  G.define('event', {
    id: 'ev_wu_humei', title: '镜里的笑',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.world.weather === '雾'
        ? '雾锁了整座镇子的这个夜里，你对着一盆静水梳头。'
        : '夜深人静，你对着一面铜镜出神。')
        + '镜里那张脸是你的，神情却不全是你的——它先你一步弯了眼，唇角挑起一抹你从没练过的笑。这些年你哄过的人、骗过的关、说过的软话，都化作一缕缠人的媚气，养在眉梢眼角，今夜终于满了。镜里的「你」朝你招手，那笑能勾魂。\n纳它入眼，还是打碎这面镜。';
    },
    tags: ['隐秘', '狐', '幻'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——对镜里的笑也笑一个',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'humei' },
          { tendAdd: { humei: 5 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你也朝镜里弯了眼。两张脸合而为一，那抹媚长在了你脸上。', style: '异象' } },
          { log: { t: '从此你一抬眼，旁人便不由自主想听你的话——连你自己都怕。', style: '异象' } },
          { rumorAdd: { t: '镇上姑娘小子都说，那人一笑起来，叫人忘了自己姓什么。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——一掌打碎那面镜',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'humei' },
          { hp: -4 },
          { counterAdd: { xinmo: 3 } },
          { log: { t: '你一掌拍碎铜镜。碎片里十几张脸，张张都还在朝你笑。', style: '凶' } },
          { log: { t: '此后你不敢久照镜子——怕那笑，又攒了回来。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ════════ 御剑顿悟（ev_wu_yujian）════════
  // 母题：断剑崖、剑冢、剑诀。临界感受=身边铁器自己离手悬空，剑意第一次脱手而行。
  G.define('event', {
    id: 'ev_wu_yujian', title: '离手三寸',
    queueOnly: true, once: true,
    textFn: function () {
      return (G.world.season === '春'
        ? '一个料峭的春夜，你照例擦着那柄剑。'
        : '夜里你照例擦着那柄剑，剑身映着一点孤灯。')
        + '擦到一半，手忽然一空——剑自己离了掌心，稳稳悬在你面前三寸处，剑尖随你的目光转。你这才明白，这些年枯坐崖前、临摹剑痕、听剑入眠，那点东西早不在手上了，它在你的意里。屋里所有的铁器都轻轻地颤，争着要听你的号令。\n召它们随你心走，还是按它们回鞘。';
    },
    tags: ['隐秘', '剑'],
    baseWeight: 0,
    choices: [
      {
        text: '纳之——以意驭它，凌空一引',
        outcomes: [{ weight: 1, effects: [
          { daoAdvance: 'yujian' },
          { tendAdd: { yujian: 5 } },
          { qi: -6 },
          { log: { t: '你心念一动，那柄剑绕室飞旋，墙上钉的铁器齐齐随它起舞。', style: '异象' } },
          { log: { t: '剑归鞘时，你的目光所及之处，万物都仿佛带了三分锋。', style: '异象' } },
          { rumorAdd: { t: '断剑崖下听见过夜半剑鸣，绕梁不绝，像谁在崖上练了一宿。', fame: 1 } }
        ] }]
      },
      {
        text: '抑之——伸手把它按回掌中',
        outcomes: [{ weight: 1, effects: [
          { daoSuppress: 'yujian' },
          { qi: -3 },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你一把攥住悬空的剑，强按回掌心。剑身嗡鸣不止，像在抗议。', style: '凶' } },
          { log: { t: '此后你握剑总觉得隔了一层——它认得你，却不肯再听你。', style: '凶' } }
        ] }]
      }
    ]
  });
})();
