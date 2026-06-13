// js/data/poguan_content.js — 破关内容（spec §0.5.1「选破法」之核心）。
// 引擎在 poguan.js；本文件提供「气满关未开」时玩家主动冲关的行动与六破法选项。
// 契机事件（天时/地点/战斗/NPC/记忆/异兽）见 poguan_qiji_content.js。
//
// ── 铁律（spec §0.5.1）──
//   onSucc/onFail 只「沉淀世界状态」：绝不在其中改 cult/realmIdx、绝不自己掷破境骰。
//   破境骰、境界+1、属性/寿元/默认传闻、破法专属破前代价，全由引擎 {poguan} 独占结算。
//   本文件只产出：求关行动 + 六破法的动机文案 + 成功/失败后的世界余波。
//
// ── 本文件对外输出（登记）──
//   action：act_chongguan（闭关冲关，任意地点可见的兜底求关路径，cond:{pingjing:true}）
//   event ：ev_chongguan（queueOnly，由 eventNow 触发，可复用——一世破多关）
//   title ：po_jingguan（破境者，0..1 关口）/ po_zhuji_zheng（道基方正，铸道基稳成）/ po_zhuji_lie（裂道而成，强行/借丹铸基）
//   memory：mem_poguan_daoji_lie（道基生裂，carry 跨世）/ mem_poguan_zoushou（险些走火，carry 跨世）
//   pflag ：_poguan_wengu_done / _poguan_wudao_done / _poguan_yamo_done（破法印记，供契机/后续内容读）
//           _daoji_lie（道基裂痕，破关失败留痕）
//   引用真实 id：道 xuejian/lianti/leifa/handu；地点 G.curLoc() 动态；NPC dashixiong/miaozhu/zhujian_weng；
//           物品 ningqi_dan；counter dandu/xinmo；wvar sectAttention；insight 条目 poguan_wu（破境之悟）。
//
// ── 自检十问 ──
// 1标签：突破/吉/凶/因果/异象。2易共现：气满关未开（_pingjing）、地点灵气、天时雨雪雷、丹毒/心魔积累、道途积累。
// 3排斥：未到瓶颈不可冲（pingjing:true 守门）；queueOnly 不进环境池。4改状态：境界(引擎)/传闻/称号/心魔/丹毒/道基裂/仙门关注/NPC。
// 5后果：稳固根基稳而慢、借丹快而积毒、借地势看脚下灵气、压心魔险而后稳、顺势悟道靠道途、强行破关高反噬。
// 6可解释：关口对应身体次第（听见天地→气入经脉→小周天→气海→杂念显形→铸道基），破法即「怎么推这道关」。
// 7钩子：六破法印记 pflag、道基裂 pflag/memory/legacy 供契机事件与轮回线咬合。
// 8有趣选择：稳但慢 vs 快但伤本；借外力 vs 凭自身道；保命 vs 搏一把。
// 9服务 build：悟道路喂道途、压心魔喂道心、借地势喂踏勘、借丹喂丹毒线、强行喂裂痕跨世。
// 10不暴露：全写身体感受、见闻、旁人反应；无机制词/数值词，不点破道名。
(function () {
  'use strict';

  // ════════════════ 破境称号（titleAdd 引用）════════════════
  G.define('title', {
    id: 'po_jingguan',
    name: '破境者',
    desc: '气满而关未开时，他没有等天、等人、等机缘，只是盘膝坐定，亲手把那道关推开了。',
    fame: 4,
    rumor: '听说青石镇有个后生，闭关数日，竟自己把那道关推开了。'
  });
  G.define('title', {
    id: 'po_zhuji_zheng',
    name: '道基方正',
    desc: '筑基那一关，他走得不急不躁——铸下的道基四四方方，根脚极稳，像一块没有缝的石头。',
    fame: 10,
    rumor: '据说那人铸的道基方方正正、毫无杂质，连见多识广的老修士都点了头。'
  });
  G.define('title', {
    id: 'po_zhuji_lie',
    name: '裂道而成',
    desc: '他是硬撞、借丹、压着心魔过的关。道基铸成了，却带着一道愈合不全的裂——快是真的快，险也是真的险。',
    fame: 8,
    rumor: '都说那人破境快得吓人，可懂行的私下摇头：那道基里，有一道压不平的裂。'
  });

  // ════════════════ 破关失败记忆（memAdd 引用，carry 跨世）════════════════
  G.define('memory', {
    id: 'mem_poguan_daoji_lie',
    title: '推不开的那道关',
    kind: 'misc',
    carry: true,
    text: '你前世有一回冲关没成。关隘如铁，你这一头撞上去，关没开，身上、命里却都裂了一道——那道裂，跟着你过了奈何桥。',
    dream: '你梦见一扇推不开的门，门缝里漏出一道细细的光。梦里有声音说：莫急着撞，先看你这身根脚。'
  });
  G.define('memory', {
    id: 'mem_poguan_zoushou',
    title: '差一点没回来',
    kind: 'misc',
    carry: true,
    text: '你前世曾硬顶着那道关往里撞，气机险些逆冲——再多半口气，撞碎的就是你自己。那回是侥幸活下来的，落了一身后怕。',
    dream: '你梦见自己站在悬崖边冲一堵墙，墙没破，脚下的土先松了。梦里有声音说：有些关，不是用命去换的。'
  });

  // ════════════════ 闭关冲关：玩家主动求关的兜底路径 ════════════════
  // 不写 loc → 任意地点可见；cond:{pingjing:true} → 只在气满关未开时出现；order 小 → 排在行动表前列。
  // 它只点燃破关事件，真正选破法、掷骰在事件里。
  G.define('action', {
    id: 'act_chongguan',
    name: '闭关冲关',
    desc: '气机已满，那道关却迟迟不开，胀得四肢百骸隐隐生疼。你寻一处僻静坐下，盘膝定息，决意亲手把它推开。',
    timeCost: 1, risk: 1, order: 8,
    cond: { pingjing: true },
    effects: [{ eventNow: 'ev_chongguan' }]
  });

  // ════════════════ 破关事件：六破法 ════════════════
  // queueOnly → 不进环境池，只由 act_chongguan 的 eventNow 点名；不设 once → 一世可破多关，反复复用。
  // textFn 按当前关口（realmIdx 0..5）给开场白，掺当前地点与天时的体感。
  G.define('event', {
    id: 'ev_chongguan',
    title: '气满关未开',
    queueOnly: true,
    baseWeight: 0,
    textFn: function () {
      var p = G.player || {};
      var i = p.realmIdx || 0;
      var L = (G.curLoc && G.curLoc()) || null;
      var locName = L ? (L.name || '') : '';
      var w = (G.world && G.world.weather) || '晴';
      var here = locName ? ('此地是' + locName + '，') : '';
      var sky = ({
        '晴': '天光清亮，',
        '雨': '檐外细雨不停，',
        '雷雨': '远处闷雷一声接一声，',
        '雪': '窗外落着无声的雪，',
        '雾': '四下白雾沉沉，'
      })[w] || '';
      // 6 关口各一段，分别扣「听见天地 / 气入经脉 / 小周天成 / 气海扩张 / 杂念显形 / 铸道基」。
      var openings = [
        // 0→1 听见天地
        here + sky + '你盘膝坐定，气机在四肢里胀得发疼。' +
        '闭上眼，仿佛有极远极轻的声音要从天地间漏进来——只差最后那一线，你就能真正「听见」。那道关，就横在这一线之前。',
        // 1→2 气入经脉
        here + sky + '满满一身气，憋在丹田出不去，撞得经脉发酸。' +
        '你引着那口气，一寸一寸去叩经脉的关窍——只要气能入脉、走得通顺，这一关便算过了。可那窍门偏偏堵着最后一道。',
        // 2→3 小周天成
        here + sky + '气在身上一圈一圈地转，转到某处总差半步接不上。' +
        '你屏息凝神，要让这口气走完一整个小周天、首尾相衔——周天一旦圆转无碍，关就开了。眼下，就缺那合拢的一瞬。',
        // 3→4 气海扩张
        here + sky + '丹田里那片气海满得快要溢出来，再纳一分都觉得发胀。' +
        '你要把这气海生生撑开一圈，好容下更汹涌的灵机——撑得开是脱胎换骨，撑不开便是反噬上身。关，就卡在这一撑之间。',
        // 4→5 杂念显形
        here + sky + '气一旦攒到这般地步，心底压着的东西也跟着翻涌上来——' +
        '旧仇、执念、说不清的杂念，竟在静坐里隐隐显出形状。这一关，过的不只是气，更是心：要么把这显形的杂念理顺，要么被它牵着走。',
        // 5→6 铸道基
        here + sky + '到了这一步，前路再不是「多一口气」那么简单。' +
        '你周身灵机沉淀凝实，要在丹田之中铸下一座道基——道基的形状，往后一世都改不了。是方正稳固，还是带裂求快，全看你这一关怎么过。'
      ];
      return openings[i] || openings[0];
    },
    choices: [
      // ── 1) 稳固根基（wengu）：★无 cond，永远可选——稳而慢的兜底 ──
      {
        text: '稳住心神，一寸一寸夯实根脚，宁可慢些，也不让这一关留下半点虚浮。',
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'wengu',
                onSucc: [
                  { pflagSet: { id: '_poguan_wengu_done' } },
                  { rumorAdd: { t: '听说有人破境破得格外稳当，一步一个脚印，连根脚都夯得结结实实。', fame: 3 } },
                  { titleAdd: 'po_jingguan' },
                  { insight: { id: 'poguan_wu', title: '破境之悟', t: '这道关，原是急不得的——你越想推它，它越是如铁；你只管把脚下夯实，它自己就开了。', confirm: true } },
                  { branch: {
                    cond: { realm: { gte: 6 } },
                    then: [{ titleAdd: 'po_zhuji_zheng' }, { wvarAdd: { sectAttention: 4 } },
                           { log: { t: '你铸下的道基方方正正，没有一丝缝隙。坐定回神，连呼吸都比从前沉静。', style: '吉' } }]
                  } },
                  { branch: {
                    cond: { realm: { gte: 5 } },
                    then: [{ wvarAdd: { sectAttention: 3 } }]
                  } },
                  { branch: {
                    cond: { npcAlive: 'dashixiong' },
                    then: [{ npcFavAdd: { id: 'dashixiong', n: 2 } }]
                  } }
                ],
                onFail: [
                  { injure: { months: 1, severity: 1 } },
                  { log: { t: '关隘如铁，你这一回没能推开。好在你步步求稳，并未伤及根本——只是身上多了几分钝痛，命里似乎也淡淡裂了一道。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 2) 借丹（jiedan）：引擎自动+丹毒；有丹更顺，无丹亦可硬服气血 ──
      {
        text: '取出一枚凝气丹纳入口中，借丹力把那口气狠狠往关上一顶——快是快，只是丹毒难免。',
        cond: { item: { id: 'ningqi_dan' } },
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'jiedan',
                onSucc: [
                  { itemDel: { id: 'ningqi_dan', n: 1 } },
                  { rumorAdd: { t: '都说那人破境快得很，怕是借了丹力——快归快，听着就不太养身子。', fame: 2 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: {
                    cond: { realm: { gte: 6 } },
                    then: [{ titleAdd: 'po_zhuji_lie' }, { wvarAdd: { sectAttention: 4 } }, { pflagSet: { id: '_daoji_lie' } },
                           { log: { t: '道基是借丹力催着铸成的，成得快，根上却隐隐留了一道压不平的裂。', style: '丹' } }]
                  } },
                  { log: { t: '丹力一冲，那道关豁然洞开。只是丹毒随之沉进血里，舌根泛起一丝苦。', style: '丹' } }
                ],
                onFail: [
                  { itemDel: { id: 'ningqi_dan', n: 1 } },
                  { counterAdd: { dandu: 6 } },
                  { injure: { months: 2, severity: 2 } },
                  { log: { t: '丹力催着气往关上撞，关没开，那股药力却散在脏腑里横冲直撞——你伤了内里，丹毒也更重了几分。', style: '丹' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 借丹·无丹兜底分项（手边没丹，硬咬牙以气血代丹，更险） ──
      {
        text: '手边没有丹药，便咬牙催动一身气血当作丹力，硬往关上撞一把。',
        cond: { not: { item: { id: 'ningqi_dan' } } },
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'jiedan',
                onSucc: [
                  { rumorAdd: { t: '听说那人破境时脸白得吓人，像是把命都赌上了——好在终究是过了。', fame: 2 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: { cond: { realm: { gte: 6 } }, then: [{ titleAdd: 'po_zhuji_lie' }, { pflagSet: { id: '_daoji_lie' } }] } },
                  { log: { t: '你以气血强催那口气撞开了关，过后一阵阵发虚，唇上没了血色。', style: '凶' } }
                ],
                onFail: [
                  { counterAdd: { dandu: 4 } },
                  { injure: { months: 2, severity: 2 } },
                  { log: { t: '没有丹力托底，光凭气血硬冲，关没开，反把自己冲得七荤八素，伤了根本。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 3) 借地势（jieshi）：引擎自动看当前地点灵气；脚下灵气足更顺 ──
      {
        text: '不急着动气，先把脚下这处地脉摸透，引地气来助你叩关——灵气越足，这一推越省力。',
        outcomes: [
          {
            cond: { locvar: { loc: 'hantan', key: 'spiritualEnergy', gte: 30 } },
            effects: [{
              poguan: {
                method: 'jieshi',
                onSucc: [
                  { rumorAdd: { t: '听说有人专挑了灵气旺的地方破境，借着地脉一推就过了，省心得很。', fame: 3 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: { cond: { realm: { gte: 6 } }, then: [{ titleAdd: 'po_zhuji_zheng' }, { wvarAdd: { sectAttention: 4 } }] } },
                  { branch: { cond: { realm: { gte: 5 } }, then: [{ wvarAdd: { sectAttention: 3 } }] } },
                  { insight: { id: 'poguan_wu', title: '破境之悟', t: '天地处处有气，会借的人不必硬撑——脚下这口地气，原也是你的助力。', confirm: true } },
                  { log: { t: '地脉里的灵气顺着你引的路涌上来，那道关被这股外力一托，竟轻轻开了。', style: '吉' } }
                ],
                onFail: [
                  { injure: { months: 1, severity: 1 } },
                  { log: { t: '地气是借来了，可你与这地脉到底隔着一层，借力的那一瞬没接稳——关没开，命里淡淡裂了一道。', style: '凶' } }
                ]
              }
            }]
          },
          {
            // 兜底：脚下灵气寻常，借地势便没那么顺，但仍可一试
            effects: [{
              poguan: {
                method: 'jieshi',
                onSucc: [
                  { rumorAdd: { t: '听说那人就地破了境，也没挑什么风水宝地，倒是会借势。', fame: 2 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: { cond: { realm: { gte: 6 } }, then: [{ titleAdd: 'po_zhuji_zheng' }, { wvarAdd: { sectAttention: 4 } }] } },
                  { log: { t: '这地方灵气寻常，你勉力引来一缕，恰好够把那道关顶开一线——过了。', style: '吉' } }
                ],
                onFail: [
                  { injure: { months: 1, severity: 1 } },
                  { log: { t: '脚下地气太薄，借不上力，那道关纹丝不动——白白受了一阵反震，命里多了一道裂。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 4) 压心魔（yamo）：引擎自动+心魔，成功反而稳道心；险而后稳 ──
      {
        text: '索性直面心底翻涌的那点执念，把它狠狠压回去，用一身心志硬顶着这道关。',
        cond: { counter: { id: 'xinmo', gte: 15 } },
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'yamo',
                onSucc: [
                  { pflagSet: { id: '_poguan_yamo_done' } },
                  { rumorAdd: { t: '都说破境最怕心乱，那人却像是先把自己心里的鬼镇住了，才过的关。', fame: 3 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: { cond: { realm: { gte: 6 } }, then: [{ titleAdd: 'po_zhuji_zheng' }, { wvarAdd: { sectAttention: 4 } }] } },
                  { branch: { cond: { realm: { gte: 5 } }, then: [{ wvarAdd: { sectAttention: 3 } }] } },
                  { insight: { id: 'poguan_wu', title: '破境之悟', t: '原来挡在关前的从来不是气，是心。把心里那点鬼压住了，关就静静开了。', confirm: true } },
                  { log: { t: '你以一身执念把那道关生生顶开，回头去看，心里那点翻涌的东西，竟也安分了。', style: '吉' } }
                ],
                onFail: [
                  { counterAdd: { xinmo: 8 } },
                  { injure: { months: 1, severity: 1 } },
                  { log: { t: '你压它，它便反扑——关没顶开，心底那点东西却趁势咬了你一口，夜里愈发难安。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 5) 顺势悟道（wudao）：引擎按 confirmed 悟道/已命名道加成；用真实道途门槛守门 ──
      {
        text: '不与这道关硬碰，只顺着自己这一路走来的体悟去看它——或许那关本就该由「道」自己来开。',
        cond: { any: [
          { daoStage: { id: 'xuejian', gte: 2 } },
          { daoStage: { id: 'lianti', gte: 2 } },
          { daoStage: { id: 'leifa', gte: 2 } },
          { daoStage: { id: 'handu', gte: 2 } },
          { insightConfirmed: 'poguan_wu' }
        ] },
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'wudao',
                onSucc: [
                  { pflagSet: { id: '_poguan_wudao_done' } },
                  { rumorAdd: { t: '听说那人破境像是水到渠成，旁人还在憋气，他已经笑着睁开了眼——说是悟通了什么。', fame: 4 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: { cond: { realm: { gte: 6 } }, then: [{ titleAdd: 'po_zhuji_zheng' }, { wvarAdd: { sectAttention: 5 } }] } },
                  { branch: { cond: { realm: { gte: 5 } }, then: [{ wvarAdd: { sectAttention: 3 } }] } },
                  { insight: { id: 'poguan_wu', title: '破境之悟', t: '这道关，从头到尾都是道自己开的——我不过是走到了它该开的地方。', confirm: true } }
                ],
                onFail: [
                  { injure: { months: 1, severity: 1 } },
                  { log: { t: '你想顺势而为，可这一路的体悟还没拧成一股绳——道没替你开关，你这一坐反倒坐空了，命里淡淡裂了一道。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      },
      // ── 6) 强行破关（qiangxing）：★无 cond，高失败高反噬；引擎遇逆冲/心魔重可走火致死 ──
      {
        text: '不顾根脚虚实，不管心魔丹毒，只把一身气拧成一股，对着那道关狠狠撞过去——成败在此一举。',
        outcomes: [
          {
            effects: [{
              poguan: {
                method: 'qiangxing',
                onSucc: [
                  { rumorAdd: { t: '都说那人破境是硬撞过去的，旁人替他捏一把汗——可他偏偏撞开了，胆子是真大。', fame: 3 } },
                  { titleAdd: 'po_jingguan' },
                  { branch: {
                    cond: { realm: { gte: 6 } },
                    then: [{ titleAdd: 'po_zhuji_lie' }, { wvarAdd: { sectAttention: 5 } }, { pflagSet: { id: '_daoji_lie' } },
                           { log: { t: '道基是硬撞着铸成的，成是成了，根上却留了一道愈合不全的裂——快，是用稳换来的。', style: '凶' } }]
                  } },
                  { branch: { cond: { realm: { gte: 5 } }, then: [{ wvarAdd: { sectAttention: 3 } }] } },
                  { log: { t: '你把一身气拧成一股，对着那道关撞了过去——一声闷响，关，开了。后背早已被冷汗浸透。', style: '突破' } }
                ],
                onFail: [
                  { pflagSet: { id: '_daoji_lie' } },
                  { legacySet: { id: 'poguan_lie_henji' } },
                  { memAdd: 'mem_poguan_daoji_lie' },
                  { injure: { months: 3, severity: 2 } },
                  { log: { t: '你这一撞，关没开，自己先裂了——气机逆冲，五脏六腑像被人攥着拧。这道裂，怕是要跟你很久。', style: '凶' } }
                ]
              }
            }]
          }
        ]
      }
    ]
  });

})();
