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
//   ev_wu_xuejian / ev_wu_danyao / ev_wu_leifa / ev_wu_lianti / ev_wu_yinguo
//   （C4 在 daos.js 各 dao.awakeningEvent 按上述 id 填写；id 钉死不改。）
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
})();
