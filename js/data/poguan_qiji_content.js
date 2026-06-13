// js/data/poguan_qiji_content.js — 破关契机（spec §0.5.1「求契机」之内容）。
// 引擎在 poguan.js；核心冲关行动在 poguan_content.js。本文件提供「气满关未开」时，
// 由天时/地点/战斗/NPC/前世记忆/异兽点燃的破关契机事件——让破境有「为什么是现在」。
//
// ── 设计口径（硬性）──
//   · 全部事件 cond 必含 {pingjing:true}（只在「气满关未开」的瓶颈里现身），叠加各来源专属 cond。
//   · 不设 queueOnly（让月度环境 roll 能弹）、不设 once（可复触：这一关没冲过，契机还会再来）。
//   · 每个事件是 choices 事件：2~3 个「契合该契机」的破法选项 + 1 个「今夜未到/再忍一忍」婉拒项。
//       破法项 effects 用 [{poguan:{method,onSucc:[…],onFail:[…]}}]，全部交引擎掷骰结算；
//       onSucc/onFail 只负责「沉淀世界状态」——绝不在其中改 cult/realmIdx、绝不自掷破境骰（铁律，见 REF）。
//   · 婉拒项务必无 cond（autoplay 兜底永远有得选），只给一句体感反馈，不破关。
//   · prefer/weight 让事件在合适道途/世界态更易现；破法项可带 cond（如地势/记忆深浅）做差异化。
//   · 文案=身体感受、见闻、旁人反应；不点破道名、不写机制词/数值词。
//
// ── 本文件自洽产出（他处不引用，无需对外登记，但在此列明）──
//   事件 ×6：
//     qj_tianshi_leiye（天时·雷雨夜）/ qj_didian_jianzhong（地点·断剑崖剑冢）/
//     qj_zhandou_xuezhan（战斗·血战濒死）/ qj_npc_miaozhu（NPC·庙祝点执念）/
//     qj_jiyi_qianshi（记忆·前世旧誓道痕）/ qj_yishou_qishou（异兽·契兽护关）。
//   新定义 title ×2：poguan_jielei（借雷破关·吉名）/ poguan_xuekai（血中破关·凶名）。
//   新定义 memory ×2：mem_poguan_jianzhong（剑冢破关·carry）/ mem_poguan_shishi（破关失手成执·carry）。
//
// ── 自检十问 ──
// 1标签:各来源对应的天时/地点/血/香火/梦/兽。2易共现:仅瓶颈期(pingjing)且来源 cond 命中。
// 3排斥:无 queueOnly→进环境池;无 once→未破成可复触。4改状态:破成沉淀 title/mem/传闻/世界变量,失败留裂痕执念。
// 5后果:成功→引擎境界+1并执行 onSucc;失败→引擎留命里裂+onFail(伤/债/执念),不自动重试。
// 6可解释:气满已久,是这场雷/这处旧地/这一战/这个人/这桩旧誓/这只命缘兽,替你把关推开半寸。
// 7钩子:借各道元素(雷/剑气/血/香火/因果/兽灵)与各来源,接 poguan.js 六破法。8有趣选择:借势稳但挑天时地利,
//   强行险而不等;压心魔可定道心但险走火;顺势悟道靠道途积累——同一关,不同道、不同境,选法不同。
// 9服务 build:让破境有「为什么是现在」,按道途/关口差异化。10不暴露:正文只见身体与见闻,破法名以体感写。
(function () {
  'use strict';

  // ════════════════ 自洽 title / memory（先定义，后被 onSucc/onFail 引用）════════════════

  G.define('title', {
    id: 'poguan_jielei',
    name: '借雷登阶',
    desc: '有人在雷雨夜里把那道关生生劈开了。雷没劈着人，倒像是替他开了门。',
    fame: 6,
    rumor: '那夜镇外一道惊雷迟迟不散，雷停时，听说有人换了一身气象。'
  });

  G.define('title', {
    id: 'poguan_xuekai',
    name: '血里破关',
    desc: '命悬一线时反倒破了境——这样的人，身上总带着一股压不住的狠与腥。',
    fame: 5,
    rumor: '都说他是从死人堆里爬出来才上的道，血气重得叫人不敢近身。'
  });

  G.define('memory', {
    id: 'mem_poguan_jianzhong',
    title: '剑冢里推开的那道关',
    kind: 'chance',
    carry: true,
    text: '前世你在那片插满断剑的崖上破的境。无数旧剑同时一颤，剑气替你顶开了那道铁一般的关。你记得那一刻满崖剑鸣，像有人在替你应声。',
    dream: '你梦见一崖断剑同时轻颤。梦里有声音说：你的关，在断剑崖。'
  });

  G.define('memory', {
    id: 'mem_poguan_shishi',
    title: '没能推开的那道门',
    kind: 'chance',
    carry: true,
    text: '前世你有过一回机会，却没能把那道关推开。气机逆冲回来，身上、命里都裂了一道，自此那道门成了夜夜来叩的执念。',
    dream: '你又梦见那扇推不开的门。门后有光，门却纹丝不动。'
  });

  // ════════════════ 1 · 天时 — 雷雨夜引雷顺势破关（雷法）════════════════
  // 来源:天时。cond 加 weather:'雷雨'。借天雷之地势 / 顺雷势悟道 / 强行。
  G.define('event', {
    id: 'qj_tianshi_leiye', title: '雷停之前',
    cond: { pingjing: true, weather: '雷雨' },
    tags: ['雷', '夜'],
    baseWeight: 12,
    prefer: { tend: { leifa: 1.2 } },
    textFn: function () {
      return '又是一夜雷雨。可这一次，每一道劈下的天雷都像在叩你的天灵——你满了许久却开不了的那道关，竟与天上的轰鸣遥遥相和。' +
        '\n雨幕里电光一闪一闪，照见你心口那处胀痛已久的地方。气满，关未开；而此刻，天替你递了一把钥匙。' +
        '\n要不要，趁这雷还没停？';
    },
    choices: [
      {
        text: '站到雨里去，借这一夜天雷之势冲关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'jieshi',
            onSucc: [
              { log: { t: '一道惊雷自天灵贯下，你周身骨节齐鸣——雷停时，那道关已在你身后。', style: '突破' } },
              { titleAdd: 'poguan_jielei' },
              { tendAdd: { leifa: 4 } },
              { rumorAdd: { t: '昨夜镇外那道久不散的惊雷，原是有人借它上了道。', fame: 2 } }
            ],
            onFail: [
              { log: { t: '雷势太烈，你硬接了下来，关没开，反被那一震劈得气血翻涌。', style: '雷' } },
              { counterAdd: { xinmo: 4 } }
            ] } }
        ] }]
      },
      {
        text: '闭目静坐，顺着雷声里那点天理去悟这道关',
        cond: { tend: { id: 'leifa', gte: 20 } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wudao',
            onSucc: [
              { log: { t: '你忽然听懂了雷里那点意思——原来这道关，从来不必硬撞。', style: '突破' } },
              { tendAdd: { leifa: 3 } },
              { rumorAdd: { t: '有人雷雨夜里枯坐一宿，第二天眼底像藏了电光。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '雷声乱了你的心神，那点将悟未悟的意思，又散回了雨里。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '气血已沸，索性硬顶着这雷往关上撞',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'qiangxing',
            onSucc: [
              { log: { t: '你不管不顾地撞了上去，关竟被这股蛮劲连同天雷一并撞开。', style: '突破' } },
              { rumorAdd: { t: '听说有个不要命的，雷雨里硬生生闯了关。', fame: 2 } }
            ],
            onFail: [
              { log: { t: '蛮力撞在铁关上，反震回来，命里又添一道裂。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '今夜雷太急，关却仿佛还差一线——再忍一忍',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你退回屋檐下。雷照旧劈着，那道关却还闭着——这一夜的天时，到底不是你的。', style: '平' } }
        ] }]
      }
    ]
  });

  // ════════════════ 2 · 地点 — 断剑崖剑冢借地势破关（剑修/御剑）════════════════
  // 来源:地点。cond 加 loc:'duanjianya'(高灵气剑冢)。借满崖剑气之地势 / 顺势悟道 / 稳固根基。
  G.define('event', {
    id: 'qj_didian_jianzhong', title: '满崖剑鸣',
    cond: { pingjing: true, loc: 'duanjianya' },
    tags: ['剑', '灵脉', '险地'],
    baseWeight: 14,
    prefer: { tend: { yujian: 1.0, xuejian: 0.8 } },
    textFn: function () {
      var carry = G.player.memories.indexOf('mem_poguan_jianzhong') >= 0;
      return (carry
        ? '你又站在了这片插满断剑的崖上。说不清为什么，越靠近这里，你那道开不了的关就越痒——仿佛它本该在此处开。'
        : '崖上插满了不知多少年的断剑，剑气在风里嗡嗡地响。你气满已久的那道关，竟被这满崖剑鸣勾得隐隐发颤。')
        + '\n这里灵气厚得几乎能用手抓住，每一把锈剑都还残着一丝不肯散的锋意。气满，关未开；可此地此景，像在替你磨那最后一线。';
    },
    choices: [
      {
        text: '立于剑冢正中，引满崖剑气助你开关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'jieshi',
            onSucc: [
              { log: { t: '满崖断剑同时一颤，无数残锋汇成一线，替你把那道关顶开了。', style: '突破' } },
              { memAdd: 'mem_poguan_jianzhong' },
              { tendAdd: { yujian: 3 } },
              { locvarAdd: { loc: 'duanjianya', key: 'jianyi', n: 5 } },
              { rumorAdd: { t: '断剑崖那夜剑鸣彻夜，第二天有把锈剑竟自己出了土。', fame: 2 } }
            ],
            onFail: [
              { log: { t: '剑气太利，你引得猛了，反被那一线锋意割得经脉生疼，关却纹丝不动。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '抚着一柄断剑，从这满崖旧锋里去悟自己的关',
        cond: { tend: { id: 'yujian', gte: 18 } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wudao',
            onSucc: [
              { log: { t: '你忽然懂了这些断剑为何不肯散——它们和你一样，都在等一道关。你这一懂，关就开了。', style: '突破' } },
              { tendAdd: { yujian: 4 } },
              { rumorAdd: { t: '有人在断剑崖上坐悟一宿，下崖时眉宇间多了三分剑意。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '那点剑里的意思你抓住了又滑走，关前差的那一线，今日终究没补上。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '不急不躁，借此地灵厚，稳稳地把根基垫到关下',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wengu',
            onSucc: [
              { log: { t: '你在崖上稳坐数日，一寸一寸把气机垫实——关开得不惊不险，却踏实。', style: '突破' } },
              { rumorAdd: { t: '断剑崖上有个稳坐多日的人，起身时已换了气象。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '根基垫得再稳，那道关今日就是不肯松口——你身上添了道暗伤。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '剑鸣虽盛，你心里那道关还闭着——再等等',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你收回手，任满崖剑鸣在身后远去。地势是好地势，可关，还没到开的时辰。', style: '平' } }
        ] }]
      }
    ]
  });

  // ════════════════ 3 · 战斗 — 血战濒死后破关（血剑/炼体/御剑）════════════════
  // 来源:战斗。cond 用 hpPct:{lte:0.35} 近似「血战濒死后」。强行 / 压心魔 / 借势(借这一身血气)。
  G.define('event', {
    id: 'qj_zhandou_xuezhan', title: '一线之间',
    cond: { pingjing: true, hpPct: { lte: 0.35 } },
    tags: ['血', '杀', '危险'],
    baseWeight: 13,
    prefer: { tend: { xuejian: 1.2, lianti: 0.9 } },
    textFn: function () {
      return '你浑身是血，气血只剩薄薄一层，连站直都费力。可偏偏在这命悬一线的时候，那道压了许久开不了的关，忽然松动了——' +
        '\n像是身体到了绝处，反倒把多余的杂念全逼了出去，只剩下那道关，赤裸裸地横在你面前。' +
        '\n再不破，可能就没机会了；要破，也是拿命去赌。';
    },
    choices: [
      {
        text: '把这一身将尽的血气，全压上去硬撞这道关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'qiangxing',
            onSucc: [
              { log: { t: '绝处一搏，你拿命撞开了那道关——活下来时，已是另一番气象。', style: '突破' } },
              { titleAdd: 'poguan_xuekai' },
              { counterAdd: { xuexing: 4 } },
              { rumorAdd: { t: '有人从死里逃生，回来时像换了个人，浑身血气压不住。', fame: 2 } }
            ],
            onFail: [
              { log: { t: '这一撞用尽了最后的力气，关没开，你几乎没能再站起来。', style: '凶' } },
              { injure: { months: 3, severity: 3 } }
            ] } }
        ] }]
      },
      {
        text: '强压住翻涌的杀念，借这点死意把心顶定，再开关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'yamo',
            onSucc: [
              { log: { t: '你把翻涌的杀念一口压回去，反借那点直面生死的定，将关顶开。回神时，心反倒静了。', style: '突破' } },
              { tendAdd: { xuejian: 2 } },
              { rumorAdd: { t: '听说有人在险些没命之后破了境，眼神比从前沉了。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '杀念压不住，反噬上来，关没开，心里那点魔障却更深了。', style: '凶' } },
              { counterAdd: { xinmo: 6 } }
            ] } }
        ] }]
      },
      {
        text: '顺着这濒死逼出的血气之势，引它去冲关',
        cond: { tend: { id: 'xuejian', gte: 15 } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'jieshi',
            onSucc: [
              { log: { t: '你顺着这一身被逼到极处的血气，引它直冲关隘——血未冷，关已开。', style: '突破' } },
              { tendAdd: { xuejian: 3 } },
              { counterAdd: { xuexing: 3 } }
            ],
            onFail: [
              { log: { t: '血气虽烈却太乱，引不成势，关没开，伤却更重了。', style: '凶' } },
              { injure: { months: 2, severity: 2 } }
            ] } }
        ] }]
      },
      {
        text: '不能拿命去赌——先保住这条命，关日后再说',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你咬牙忍住那股冲动，先护住残命。关松了一线又重新闭紧——但你还活着。', style: '平' } }
        ] }]
      }
    ]
  });

  // ════════════════ 4 · NPC — 庙祝点破执念后破关（香火/因果）════════════════
  // 来源:NPC(师长/庙祝点破执念)。cond 加 npcAlive:'miaozhu'。压心魔 / 顺势悟道 / 稳固根基。
  G.define('event', {
    id: 'qj_npc_miaozhu', title: '庙祝的一句话',
    cond: { pingjing: true, npcAlive: 'miaozhu' },
    tags: ['香火', '因果', '交际'],
    baseWeight: 11,
    prefer: { tend: { xianghuo: 1.1, yinguo: 0.9 } },
    textFn: function () {
      return '你气满关未开的事，连山神庙的庙祝都看出来了。他没念经，只往香炉里添了一把香，慢慢说：' +
        '\n「你这道关开不了，不是气不够——是心里有个结，你自己不肯解。」' +
        '\n香烟一缕缕往上飘。他这句话，倒像是替你把那个一直绕不过去的结，轻轻点了一下。';
    },
    choices: [
      {
        text: '借这柱香的定力，把心里那个结压住，趁势开关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'yamo',
            onSucc: [
              { log: { t: '香烟里你把那个结一寸寸按下去，按到底时，关「咔」地开了——心也松了。', style: '突破' } },
              { tendAdd: { xianghuo: 3 } },
              { npcFavAdd: { id: 'miaozhu', n: 5 } },
              { rumorAdd: { t: '山神庙里那位常去添香的人，近来气象大不一样了。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '那个结你到底没按住，反倒被它勾出更深的心魔，关没开。', style: '凶' } },
              { counterAdd: { xinmo: 6 } }
            ] } }
        ] }]
      },
      {
        text: '顺着庙祝点破的那点意思，去悟自己这道关',
        cond: { npcFav: { id: 'miaozhu', gte: 20 } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wudao',
            onSucc: [
              { log: { t: '他一句话点醒了你——原来这道关，是道自己要开。你这一悟，结解了，关也开了。', style: '突破' } },
              { tendAdd: { yinguo: 2 } },
              { npcFavAdd: { id: 'miaozhu', n: 4 } },
              { rumorAdd: { t: '庙祝逢人便说，那是个有慧根的，迟早上得了道。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '那点意思你似懂非懂，关前差的一线，这一回还是没补上。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '谢过庙祝，回去把根基扎扎实实垫到关下',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wengu',
            onSucc: [
              { log: { t: '心结一松，你回去稳坐数日，把气机垫得实实的——关开得不惊不险。', style: '突破' } },
              { npcFavAdd: { id: 'miaozhu', n: 2 } }
            ],
            onFail: [
              { log: { t: '根基垫得再稳，那道关今日仍不肯松——你身上添了道暗伤。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '心结一时解不开——你向庙祝告辞，关的事再缓缓',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你谢过他，却没急着去破。那个结他点破了，可解开它，还得你自己。关，再缓缓。', style: '平' } }
        ] }]
      }
    ]
  });

  // ════════════════ 5 · 记忆 — 前世旧誓/道痕点燃破关（轮回/因果）════════════════
  // 来源:记忆。cond 加 daohen:{id:'yinguo',gte:4}(前世因果道痕,命数偏向)。顺势悟道 / 压心魔 / 借势。
  G.define('event', {
    id: 'qj_jiyi_qianshi', title: '前世的那道门',
    cond: { pingjing: true, daohen: { id: 'yinguo', gte: 4 } },
    tags: ['梦', '因果', '隐秘'],
    baseWeight: 12,
    prefer: { tend: { yinguo: 1.2 } },
    textFn: function () {
      var carry = G.player.memories.indexOf('mem_poguan_shishi') >= 0;
      return (carry
        ? '夜里你又梦见那扇推不开的门——和前世一模一样。只是这一回，门后的光，比记忆里更近了。'
        : '夜里你梦见一扇紧闭的门，门后透着光。醒来时心口发紧，仿佛这扇门，前世就横在你面前过。')
        + '\n气满关未开的滞涩，和梦里那扇门叠在了一起。你忽然明白：这道关，前世你就曾走到门前。' +
        '\n这一回，是续上那段没走完的路的时候了。';
    },
    choices: [
      {
        text: '循着这前世留下的因果，顺势去悟这道关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wudao',
            onSucc: [
              { log: { t: '梦里那扇门终于向你打开——原来前世今生，要破的是同一道关。这一回，你推开了。', style: '突破' } },
              { tendAdd: { yinguo: 4 } },
              { rumorAdd: { t: '有人说他像是把上辈子没走完的路，这辈子接着走了下去。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '那扇门又一次在你指尖合拢。前世今生，你还是没能推开它——命里又添一道裂。', style: '凶' } },
              { memAdd: 'mem_poguan_shishi' }
            ] } }
        ] }]
      },
      {
        text: '压住那段旧因果勾起的心绪，凝心去开关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'yamo',
            onSucc: [
              { log: { t: '你把那段翻涌的前尘旧事一并压下，心定，门开——回神时，那桩执念竟也淡了。', style: '突破' } },
              { tendAdd: { yinguo: 2 } }
            ],
            onFail: [
              { log: { t: '旧因果压不住，反勾出更深的执，关没开，心魔却重了。', style: '凶' } },
              { counterAdd: { xinmo: 6 } },
              { memAdd: 'mem_poguan_shishi' }
            ] } }
        ] }]
      },
      {
        text: '借这梦里门后透来的那点光为势，冲关',
        cond: { daohen: { id: 'yinguo', gte: 8 } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'jieshi',
            onSucc: [
              { log: { t: '你顺着门后那道光直冲过去——前世今生的因果在此刻接上了头，关随之而开。', style: '突破' } },
              { tendAdd: { yinguo: 3 } }
            ],
            onFail: [
              { log: { t: '那道光太虚，借不成势，门没开，你反被卷回了更深的梦里。', style: '凶' } },
              { injure: { months: 2, severity: 2 } }
            ] } }
        ] }]
      },
      {
        text: '前尘太重，今夜还推不动这扇门——先醒过来',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你强迫自己从梦里醒来。门还在那儿，前世的路也还没走完——但不是今夜。', style: '平' } }
        ] }]
      }
    ]
  });

  // ════════════════ 6 · 异兽 — 契兽护关破关（兽魂/雷法/寒冰）════════════════
  // 来源:异兽。cond 加 pet:{has:true}(有契兽)。借兽灵之势 / 顺势悟道 / 压心魔。
  G.define('event', {
    id: 'qj_yishou_qishou', title: '它守在关前',
    cond: { pingjing: true, pet: { has: true } },
    tags: ['兽', '隐秘'],
    baseWeight: 12,
    prefer: { tend: { shouhun: 1.2 } },
    textFn: function () {
      var wild = G.cond({ pet: { track: '野凶' } });
      return '你气满关未开的这些日子，那只与你结了命缘的灵物，一直守在近旁不肯走。' +
        (wild
          ? '\n它今夜格外躁动，绕着你低吼，毛发根根竖起，像在替你逼退什么看不见的东西。'
          : '\n它今夜格外安静，伏在你身侧，呼吸与你渐渐合上了拍，像在替你撑住什么。')
        + '\n你忽然觉得，这道关，或许有它在，就能开。';
    },
    choices: [
      {
        text: '与它气息相合，借它那一身兽灵之势冲关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'jieshi',
            onSucc: [
              { log: { t: '你与它气息合而为一，那股野而纯的灵性涌入你身——关，被你们一同顶开了。', style: '突破' } },
              { tendAdd: { shouhun: 4 } },
              { pet: { op: 'bond', n: 6 } },
              { rumorAdd: { t: '有人破境那夜，身边那只灵物对天长鸣了一宿。', fame: 1 } }
            ],
            onFail: [
              { log: { t: '气息没能完全合上，那股灵性冲得太急，反震得你气血翻涌，关没开。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '看着它，从这命缘相守里去悟自己的关',
        cond: { pet: { spirit: { gte: 30 } } },
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'wudao',
            onSucc: [
              { log: { t: '它的眼睛干净得像一汪水，你看着看着，忽然懂了这道关——心一通透，关就开了。', style: '突破' } },
              { tendAdd: { shouhun: 3 } },
              { pet: { op: 'bond', n: 4 } }
            ],
            onFail: [
              { log: { t: '那点通透一闪而逝，没能抓住。关前差的一线，今日还是没补上。', style: '凶' } }
            ] } }
        ] }]
      },
      {
        text: '有它守着，压住心头杂念，凝神开关',
        outcomes: [{ weight: 1, effects: [
          { poguan: { method: 'yamo',
            onSucc: [
              { log: { t: '有它在侧，你心里那点慌乱反倒定了。杂念一压，关随之而开。', style: '突破' } },
              { pet: { op: 'bond', n: 4 } }
            ],
            onFail: [
              { log: { t: '杂念压不住，关没开，连带它也跟着焦躁起来。', style: '凶' } },
              { counterAdd: { xinmo: 5 } }
            ] } }
        ] }]
      },
      {
        text: '不愿连累它——今夜先不破，把它安顿好',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你拍了拍它的背，没急着去冲关。它陪着的日子还长，这道关，不急在一时。', style: '平' } }
        ] }]
      }
    ]
  });

})();
