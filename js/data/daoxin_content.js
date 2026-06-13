// js/data/daoxin_content.js — 道心冲突与兼修内容（Owner: 道心冲突内容 Agent）。
// 落地 spec §3.5「杂念→逆冲→入魔→调和」闭环。只用引擎暴露的 {daoxin} 条件/效果 DSL
// （见 js/systems/daoxin.js 文件头）与契约 §5/§6 的通用 op；不改任何引擎/他人文件。
//
// ── 五对冲突（玄幻因果，spec §3.5；引擎 daoxin.js 钉死）──
//   ['leifa','handu']    雷火冲阴寒：雷火借天威，阴寒收杀机，一阳一阴在脉里互绞
//   ['xuejian','xianghuo'] 血煞污香火：以伤换杀的血气，熏黑了你替人还愿点起的香火
//   ['humei','yinguo']   媚术扰因果：媚术添一笔人情债，因果道偏要你认债还清
//   ['danyao','leifa']   丹毒压雷息：丹火养在身里的浊毒，压住了雷法该有的清越雷息
//   ['shouhun','yujian'] 兽性冲剑心：兽魂要你扑要你咬，剑心要你定要你直
//   （pair flag 由引擎按字典序记 _tiaohe_<a>_<b>；本文件只传 pair，排序交给引擎。）
//
// ── 对外输出（id 钉死，引擎/总控引用）──
//   事件：ev_daoxin_wenxin（queueOnly，引擎在「逆冲」新出现时 eventDelay 安排；
//         textFn 按 G.sys.daoxin.activeConflicts()[0] 这对冲突变脸，三选范式）
//   入魔死亡记忆：mem_zouhuo_rumo（kind death，deathCause ['走火入魔','心魔噬身']，carry）
//   调和支线事件（queueOnly，被 ev_daoxin_wenxin「求调和」点名）：
//     ev_tiaohe_shicheng（师承·药铺老板「以药护雷脉」，调和 danyao×leifa 丹毒压雷息）
//     ev_tiaohe_fabao（法宝·残剑镇血煞 / 香灰玉镇心魔，调和 xuejian×xianghuo）
//     ev_tiaohe_shiyan（誓言·「不以媚术害无辜」，调和 humei×yinguo）
//     ev_tiaohe_yizhi（抑之·「我知道它在但不用」，按当前冲突对收束，通用兜底）
//   生死调和走 action（被 mem_death_* 解锁）：act_tiaohe_shengsi（兽性冲剑心，被后山兽王杀过）
//   称号：shuangdao_tiaohe（双道调和者）/ chixin_ren（持心人）/ rumo_zhe（入魔者·恶名，autoCond 入魔后世可见残响）
//   新增物品（法宝）：xianghui_yu（香灰玉，镇心魔；契约 §6.5 内容可新增 item）
//
// ── 引用的跨文件 id ──
//   道途：leifa/handu/xuejian/xianghuo/humei/yinguo/danyao/shouhun/yujian（C4 daos.js）
//   NPC：yaopu_laoban（药铺老板，npcs.js，师承调和）
//   物品：duanjian（断剑，actions_wild.js，法宝调和·残剑镇血煞）/ qingxin_san 不强制
//   死亡记忆（生死调和读）：mem_death_houshan_shouwang（兽王，memories.js C1）
//   死因：走火入魔 / 心魔噬身（ids.js deathCauses 已登记）
//   引擎 DSL：{daoxin:{level/conflict/anyConflict/jianxiu/zhuxiu/tiaohe}} 条件
//             {daoxin:{op:'tiaohe',pair,by}} 效果 / {daoSuppress} / {die:{cause}}
//
// ── 自检十问（对文件整体）──
// 1标签：隐秘+道心+各对冲突元素。2易共现：引擎在「逆冲」新出现时点名 ev_daoxin_wenxin；调和支线/生死调和按 cond。
// 3排斥：全部 queueOnly / 高门槛 action，不进环境池。4改状态：每 outcome ≥1 非 log op（tiaohe/daoSuppress/pflag/题词/心魔/记忆/称号）。
// 5后果：守→压一门+心魔+主修确认；并行→短期异象+反噬 pflag（突破/战斗回收）；调和→落 tiaohe flag、得复合称号。
// 6可解释：贪多无主→杂念→逆冲→强压失败/违誓→入魔，前因可追，死亡记忆写明可学习的教训。
// 7钩子：反噬 pflag（_bingxing_fanshi）给引擎突破/战斗回收；调和 flag 给称号 autoCond；恶名 rumorAdd 给传闻面。
// 8有趣选择：压、合、冒进三条都有味道与代价，不是一条最优。9服务 build：把兼修从「错误」变成「稀有有理由的玩法」。
// 10不暴露：冲突写「身体里两种天理打架」，调和写「把两条路说通的理由」，不出现「技能树/双修 build」。
//
// 自验：node --check js/data/daoxin_content.js
(function () {
  'use strict';

  // 五对冲突的「身体里两种天理打架」叙事（问心事件 textFn 按 activeConflicts()[0] 变脸）。
  // key 用字典序的 'a|b'，与引擎 _tiaohe_<a>_<b> 同序，便于查表。
  var CONFLICT_TEXT = {
    'handu|leifa': {
      name: '一热一寒',
      scene: '夜半，你身体里像有两场天气在抢着下。'
        + '左半边脉络滚着雷雨前的燥热，右半边却结了霜，凉得发疼。'
        + '它们谁也不让谁，在你心口正中拧成一个解不开的结。',
      hint: '一条路要你借天上的火，一条路要你收身上的杀机——它们本不该长在同一个人身上。'
    },
    'xianghuo|xuejian': {
      name: '血污了香',
      scene: '你替人还过愿、点过香，那点温吞的暖意本在心里养着。'
        + '可这几月，一股以伤换命的腥气漫上来，把那缕香火熏得发黑。'
        + '梦里你跪在神龛前，手却握着一把还在滴血的刃。',
      hint: '一条路用血与痛去换杀机，一条路要你干净地替人还愿——血气一重，香火就脏了。'
    },
    'humei|yinguo': {
      name: '欠了一笔账',
      scene: '你越来越会用那点勾人的法子，可每用一回，命数里就多记一笔看不见的账。'
        + '夜里你听见有人在耳边一笔一笔地算，算得你心慌。'
        + '一个声音劝你只管去取，另一个声音却要你认下、还清。',
      hint: '一条路替你白讨人情，一条路偏要你认债还债——你欠的，迟早要从别处补回去。'
    },
    'danyao|leifa': {
      name: '浊压清越',
      scene: '你身里养着丹火，也养着丹毒。那点浊气沉在丹田，黏稠、发闷。'
        + '可你引气时，耳后那道本该清越的雷息被它压着，响也响不亮，断断续续。'
        + '像有人往一口好钟里灌了泥。',
      hint: '一条路以身为炉、容得下毒，一条路借天威、要的是清——浊气一重，雷就哑了。'
    },
    'shouhun|yujian': {
      name: '兽与剑',
      scene: '你心里像拴着一头兽。它要你扑、要你咬、要你顺着血气冲出去。'
        + '可你按在剑上的那只手却在发抖——它要你定、要你直、要你心如止水。'
        + '一个要乱，一个要静，在你胸口互相撕咬。',
      hint: '一条路放兽性出笼，一条路要剑心如镜——兽一动，剑就歪了。'
    }
  };

  function ckey(pair) {
    return pair.slice().sort().join('|');
  }
  // 当前第一对冲突的文案；无冲突时给个安全兜底（理论上引擎不会在无冲突时点名）。
  function curConflict() {
    var cs = (G.sys && G.sys.daoxin && G.sys.daoxin.activeConflicts) ? G.sys.daoxin.activeConflicts() : [];
    var pair = (cs && cs[0]) ? cs[0] : ['handu', 'leifa'];
    return { pair: pair, info: CONFLICT_TEXT[ckey(pair)] || CONFLICT_TEXT['handu|leifa'] };
  }
  // 取「副道」=这对里非主修的一条（守主修压一门用）。无明确主修时压字典序第二条。
  function sideDao(pair) {
    var zhu = (G.sys && G.sys.daoxin && G.sys.daoxin.zhuxiu) ? G.sys.daoxin.zhuxiu() : null;
    if (zhu && pair.indexOf(zhu) >= 0) {
      return pair[0] === zhu ? pair[1] : pair[0];
    }
    return pair.slice().sort()[1];
  }
  function mainDao(pair) {
    var zhu = (G.sys && G.sys.daoxin && G.sys.daoxin.zhuxiu) ? G.sys.daoxin.zhuxiu() : null;
    if (zhu && pair.indexOf(zhu) >= 0) return zhu;
    return pair.slice().sort()[0];
  }

  // ════════════════════════════════════════════════════════════════════
  // 一、问心事件 ev_daoxin_wenxin（钉死 id；引擎在「逆冲」新出现时 eventDelay 安排）
  //   textFn 按 activeConflicts()[0] 变脸；三选范式：守主修压一门 / 求调和 / 强行并行。
  // ════════════════════════════════════════════════════════════════════
  G.define('event', {
    id: 'ev_daoxin_wenxin',
    title: '问心',
    queueOnly: true,
    tags: ['隐秘', '道心'],
    baseWeight: 0,
    textFn: function () {
      var c = curConflict();
      return c.info.scene + '\n'
        + '你睁着眼到天亮。悟道录摊在膝头，两行字各说各的理，墨迹相互洇开，谁也压不住谁。\n'
        + c.info.hint + '\n这一关，得你自己过。';
    },
    choices: [
      // —— 选择一：守主修，压下另一门 ——
      {
        text: '守住自己认准的那条，把另一门压回去',
        outcomes: [{ weight: 1, effects: [
          { branch: {
            // 副道按当前冲突对动态决定：用 chance 占位无意义，这里用 daoxin.zhuxiu 取舍 → 由各 case 落 daoSuppress。
            // 为保证「压的是副道」，对五对各写一条 branch，命中当前冲突即压其副道。
            cond: { daoxin: { conflict: ['handu', 'leifa'] } },
            then: [{ daoSuppress: 'handu' }, { insight: { id: 'wenxin_yare', title: '问心·压寒', t: '雷火与阴寒挤在一处时，我宁可只走亮的那条。', confirm: true } }],
            else: [{ branch: {
              cond: { daoxin: { conflict: ['xianghuo', 'xuejian'] } },
              then: [{ daoSuppress: 'xuejian' }, { insight: { id: 'wenxin_yaxue', title: '问心·守香', t: '香火要干净，我便先把那点血气按下。', confirm: true } }],
              else: [{ branch: {
                cond: { daoxin: { conflict: ['humei', 'yinguo'] } },
                then: [{ daoSuppress: 'humei' }, { insight: { id: 'wenxin_yamei', title: '问心·认债', t: '欠的账迟早要还，那点勾人的便宜，我不占了。', confirm: true } }],
                else: [{ branch: {
                  cond: { daoxin: { conflict: ['danyao', 'leifa'] } },
                  then: [{ daoSuppress: 'danyao' }, { insight: { id: 'wenxin_yadan', title: '问心·清雷', t: '要雷响得亮，丹田里就不能太浊。', confirm: true } }],
                  else: [{ daoSuppress: 'shouhun' }, { insight: { id: 'wenxin_yashou', title: '问心·定剑', t: '心里那头兽，我留着看，但不再放它出笼。', confirm: true } }]
                } }]
              } }]
            } }]
          } },
          { log: { t: '你咬碎牙关，把那不肯安分的一门一寸寸按回去。心口的结松了些，却也空了一块。', style: '凶' } },
          { counterAdd: { xinmo: 4 } }
        ] }]
      },
      // —— 选择二：求调和（开支线，按当前冲突对点名对应调和事件/留钩子）——
      {
        text: '不压不冒进——去找一个能把两条路说通的理由',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'qiu_tiaohe' } },
          { log: { t: '你决定不急着取舍。总该有个法子，让这两条路在一个人身上并行不悖。', style: '平' } },
          // 丹毒压雷息 → 药铺老板「以药护雷脉」（师承）
          { branch: {
            cond: { daoxin: { conflict: ['danyao', 'leifa'] } },
            then: [
              { log: { t: '你想起回春堂掌柜常说，药能伤人，也能护脉。也许他知道怎么让这丹火和雷息相安。', style: '平' } },
              { eventDelay: { id: 'ev_tiaohe_shicheng', months: 1, note: '去回春堂请教以药护雷脉' } }
            ],
            else: [{ branch: {
              // 血煞污香火 → 法宝（残剑镇血煞 / 香灰玉镇心魔）
              cond: { daoxin: { conflict: ['xianghuo', 'xuejian'] } },
              then: [
                { log: { t: '你听过一桩旧话：以物镇煞。一截认了主的残剑，或一枚浸过百家香灰的玉，都压得住这点血腥。', style: '平' } },
                { eventDelay: { id: 'ev_tiaohe_fabao', months: 1, note: '寻一件能镇血煞的法器' } }
              ],
              else: [{ branch: {
                // 媚术扰因果 → 誓言
                cond: { daoxin: { conflict: ['humei', 'yinguo'] } },
                then: [
                  { log: { t: '你忽然明白：欠不欠账，不在术，在心。若立下一条自己绝不越的线，账也许就能算清。', style: '因果' } },
                  { eventDelay: { id: 'ev_tiaohe_shiyan', months: 1, note: '为自己立一条誓' } }
                ],
                // 一热一寒 / 兽性冲剑心 → 暂以「抑之·我知道它在但不用」之法门收束（通用调和支线）
                else: [
                  { log: { t: '你寻不到现成的师承或法器，便想：也许不必让它们彼此相杀，只要心里有个主，知道何时用、何时按。', style: '平' } },
                  { eventDelay: { id: 'ev_tiaohe_yizhi', months: 1, note: '试着为这两条路定一个主' } }
                ]
              } }]
            } }]
          } }
        ] }]
      },
      // —— 选择三：强行并行（短期强力异象 + 反噬 pflag）——
      {
        text: '都不舍——让两条路一起烧，烧出个名堂',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'bingxing_fanshi' } },     // 反噬 pflag：引擎突破/战斗回收
          { pflagSet: { id: 'daoxin_jiqi' } },         // 短期「气机鼎沸」标记
          { log: { t: '你索性松开了那道闸。两股天理在你身里同时炸开，气血翻涌，一瞬间你强得吓人——也乱得吓人。', style: '异象' } },
          { counterAdd: { xinmo: 8 } },
          { rumorAdd: { t: '有人撞见那个人深夜在荒地里走，周身气息忽冷忽热，像揣着两个魂。', fame: 2 } },
          { branch: {
            cond: { daoxin: { level: '入魔' } },
            then: [{ log: { t: '可你心里那点警兆告诉你：这把火，迟早要回头烧你自己。', style: '凶' } }],
            else: [{ log: { t: '你赢了今夜，但身体里那两种天理，并没有真的握手。它们只是暂时一起朝外了。', style: '凶' } }]
          } }
        ] }]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 二、调和支线（剧情非菜单，spec §3.5 五法各 ≥1，均以 {daoxin:{op:'tiaohe'}} 收束）
  // ════════════════════════════════════════════════════════════════════

  // 2.1 师承调和：药铺老板「以药护雷脉」——调和 丹毒压雷息（danyao×leifa）
  G.define('event', {
    id: 'ev_tiaohe_shicheng',
    title: '以药护雷脉',
    queueOnly: true,
    tags: ['隐秘', '道心', '药', '雷'],
    text: '回春堂后堂，药香压过了铺面的喧闹。你把那点丹田发浊、雷息发哑的难处说了，'
      + '掌柜没抬头，只把一味药推到你面前：「丹火养身，浊气难免。可雷走的是脉，脉里若先用药润开、护住，浊与雷就不必在一处相争了。」'
      + '他一句一句教你认这几味护脉的药。你忽然听懂了：原来不是要你舍一门，是你从前不会让它们各走各的道。',
    choices: [
      {
        text: '依掌柜的法子，以药护住雷脉',
        cond: { npcAlive: 'yaopu_laoban' },
        outcomes: [{ weight: 1, effects: [
          { daoxin: { op: 'tiaohe', pair: ['danyao', 'leifa'], by: '师承' } },
          { npcFavAdd: { id: 'yaopu_laoban', n: 8 } },
          { counterAdd: { xinmo: -6 } },
          { pflagSet: { id: 'qiu_tiaohe', v: false } },
          { insight: { id: 'tiaohe_yiyao_huleimai', title: '以药护雷脉', t: '丹火和雷息本不必相争——先用药把脉护住，浊归浊，雷归雷，各走各的路。', confirm: true } },
          { log: { t: '你照掌柜说的，先以药润脉。再引气时，那道哑了许久的雷息，竟一点点清越起来。', style: '雷' } }
        ] }]
      },
      {
        text: '（掌柜不在）自己照方子慢慢摸索',
        cond: { npcDead: 'yaopu_laoban' },
        outcomes: [{ weight: 1, effects: [
          { daoxin: { op: 'tiaohe', pair: ['danyao', 'leifa'], by: '师承' } },
          { counterAdd: { xinmo: -3 } },
          { hp: -6 },
          { pflagSet: { id: 'qiu_tiaohe', v: false } },
          { insight: { id: 'tiaohe_yiyao_huleimai', title: '以药护雷脉', t: '丹火和雷息本不必相争——先用药把脉护住，浊归浊，雷归雷，各走各的路。', confirm: true } },
          { log: { t: '没了掌柜指点，你试坏了几味药，呕了一回，才终于把护脉的法子摸顺。', style: '丹' } }
        ] }]
      }
    ]
  });

  // 2.2 法宝调和：残剑镇血煞 / 香灰玉镇心魔——调和 血煞污香火（xuejian×xianghuo）
  G.define('event', {
    id: 'ev_tiaohe_fabao',
    title: '以物镇煞',
    queueOnly: true,
    tags: ['隐秘', '道心', '血', '香火'],
    textFn: function () {
      var hasJian = G.cond({ item: { id: 'duanjian', n: 1 } });
      return '你把那点「血气熏黑香火」的难处，对着随身的物件出了神。'
        + (hasJian
          ? '腰间那截断剑忽然轻轻一颤，像在应你——剑是杀器，可一旦认了主，它替你担着的血煞，便不会再回头熏你的香火。'
          : '你想起两样压得住血煞的东西：一截认了主的残剑，或一枚浸过百家香灰的玉。前者你或许已有，后者得去香堂结一段缘。');
    },
    choices: [
      {
        // 法宝一：残剑认主镇血煞（持 duanjian）
        text: '让腰间那截残剑认你为主，替你担着血煞',
        cond: { item: { id: 'duanjian', n: 1 } },
        outcomes: [{ weight: 1, effects: [
          { daoxin: { op: 'tiaohe', pair: ['xuejian', 'xianghuo'], by: '法宝' } },
          { pflagSet: { id: 'canjian_renzhu' } },
          { counterAdd: { xinmo: -5, xuexing: -2 } },
          { pflagSet: { id: 'qiu_tiaohe', v: false } },
          { insight: { id: 'tiaohe_canjian_zhenxue', title: '残剑镇血煞', t: '剑替我担着杀机，血便不必再脏了香火——它认了我，我也认了它。', confirm: true } },
          { log: { t: '你以指血点在断剑残刃上。剑身一暗，那股一直熏着你心头香火的血腥，竟尽数归了剑里。', style: '血' } }
        ] }]
      },
      {
        // 法宝二：去香堂换一枚香灰玉镇心魔（无残剑时的另一条路；本文件新增 item）
        text: '去香堂，求一枚浸过百家香灰的玉',
        cond: { not: { item: { id: 'duanjian', n: 1 } } },
        outcomes: [
          { weight: 3, cond: { money: { gte: 12 } }, effects: [
            { money: -12 },
            { itemAdd: { id: 'xianghui_yu', n: 1 } },
            { daoxin: { op: 'tiaohe', pair: ['xuejian', 'xianghuo'], by: '法宝' } },
            { counterAdd: { xinmo: -6 } },
            { pflagSet: { id: 'qiu_tiaohe', v: false } },
            { insight: { id: 'tiaohe_xianghuiyu_zhenmo', title: '香灰玉镇心魔', t: '百家的香火都沉在这枚玉里——它压着我心头的魔，血气再重，也烧不脏那点暖。', confirm: true } },
            { log: { t: '你把那枚温润的香灰玉贴身收好。心头那缕被血气熏黑的香火，竟一点点亮回来了。', style: '因果' } }
          ] },
          { weight: 2, cond: { money: { lte: 11 } }, effects: [
            { log: { t: '香堂的玉要香火钱，你囊中羞涩，只得空手而回。这桩调和，还得再攒些日子。', style: '平' } },
            { eventDelay: { id: 'ev_tiaohe_fabao', months: 2, note: '攒够香火钱再去香堂' } }
          ] }
        ]
      }
    ]
  });

  // 2.3 誓言调和：「不以媚术害无辜」——调和 媚术扰因果（humei×yinguo）
  G.define('event', {
    id: 'ev_tiaohe_shiyan',
    title: '立一条线',
    queueOnly: true,
    tags: ['隐秘', '道心', '狐', '因果'],
    text: '你终于想明白，那笔越欠越多的账，根子不在术，在你怎么用术。'
      + '媚术本身不脏，脏的是拿它去害不该害的人。你在心里划下一道线，重得像刻进骨头：'
      + '——往后这点勾人的法子，可用来周旋、自保、谋生，却绝不加于无辜。'
      + '誓言落定的一刻，耳边那一笔一笔算账的声音，忽然静了。',
    choices: [
      {
        text: '立誓：不以媚术害无辜，违则自堕',
        outcomes: [{ weight: 1, effects: [
          { daoxin: { op: 'tiaohe', pair: ['humei', 'yinguo'], by: '誓言' } },
          { pflagSet: { id: 'shi_bu_haiwugu' } },     // 违誓回收钩子：可由后续害无辜事件读，触发入魔
          { counterAdd: { xinmo: -5 } },
          { pflagSet: { id: 'qiu_tiaohe', v: false } },
          { insight: { id: 'tiaohe_shiyan_buhaiwugu', title: '不以媚术害无辜', t: '术没有错，错的是用它去害人。我给自己划了条线——守住它，账就算清了。', confirm: true } },
          { log: { t: '你默念誓言。命数里那一笔笔欠账，竟随着这一句话，慢慢平了。', style: '因果' } }
        ] }]
      },
      {
        text: '（你拿不准自己守得住）暂不立誓，再想想',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你迟疑了。立誓容易守誓难，你怕自己有朝一日反悔，反招更重的反噬。', style: '平' } },
          { counterAdd: { xinmo: 2 } },
          { eventDelay: { id: 'ev_tiaohe_shiyan', months: 2, note: '想清楚再立誓' } }
        ] }]
      }
    ]
  });

  // 2.4 抑之调和：「我知道它在但不用」——通用收束（一热一寒 / 兽性冲剑心 等无现成师承法宝时）
  //   抑之调和不是失败，而是形成「知其在、不用之」的道心（spec §3.5）。
  G.define('event', {
    id: 'ev_tiaohe_yizhi',
    title: '心里有个主',
    queueOnly: true,
    tags: ['隐秘', '道心'],
    textFn: function () {
      var c = curConflict();
      return '你不再想着压死哪一门，也不再放任它们互相撕咬。\n'
        + '你只是日日静坐，把' + c.info.name + '那两股天理一遍遍看清楚，看到它们各自的来路与边界。\n'
        + '渐渐地，你心里立起了一个主：知道哪一条该在什么时候出来，哪一条该在什么时候安分。\n'
        + '它们都还在，只是再不能擅自做主了。';
    },
    choices: [
      {
        text: '不压不弃，只在心里立一个主',
        outcomes: [{ weight: 1, effects: [
          // 按当前冲突对收束：一热一寒 / 兽性冲剑心（其余对走专属支线，理论上不到这里，仍兜底）
          { branch: {
            cond: { daoxin: { conflict: ['handu', 'leifa'] } },
            then: [{ daoxin: { op: 'tiaohe', pair: ['handu', 'leifa'], by: '抑之' } }],
            else: [{ branch: {
              cond: { daoxin: { conflict: ['shouhun', 'yujian'] } },
              then: [{ daoxin: { op: 'tiaohe', pair: ['shouhun', 'yujian'], by: '抑之' } }],
              else: [{ branch: {
                cond: { daoxin: { conflict: ['danyao', 'leifa'] } },
                then: [{ daoxin: { op: 'tiaohe', pair: ['danyao', 'leifa'], by: '抑之' } }],
                else: [{ branch: {
                  cond: { daoxin: { conflict: ['humei', 'yinguo'] } },
                  then: [{ daoxin: { op: 'tiaohe', pair: ['humei', 'yinguo'], by: '抑之' } }],
                  else: [{ daoxin: { op: 'tiaohe', pair: ['xianghuo', 'xuejian'], by: '抑之' } }]
                } }]
              } }]
            } }]
          } },
          { pflagSet: { id: 'chixin' } },           // 持心人称号 autoCond 读
          { counterAdd: { xinmo: -8 } },
          { pflagSet: { id: 'qiu_tiaohe', v: false } },
          { insight: { id: 'tiaohe_yizhi_zhuxin', title: '我知道它在，但我不用', t: '把一条路按下，不是输。是我心里有了主——它还在，何时用我说了算。', confirm: true } },
          { log: { t: '你睁开眼。身体里那两股天理还在，却第一次都听你的话了。', style: '突破' } }
        ] }]
      }
    ]
  });

  // 2.5 生死调和：被后山兽王杀过 → 前世记忆让你理解「剑心为何要定」——调和 兽性冲剑心（shouhun×yujian）
  //   走 action（持 mem_death_houshan_shouwang 才可见），把死亡变成调和的理由（spec §3.5 生死调和）。
  G.define('action', {
    id: 'act_tiaohe_shengsi',
    name: '对坐前世那一爪',
    desc: '夜深，你又梦见前世被那头兽王一爪拍碎的瞬间。你索性静坐下来，把那一爪从头到尾看了个清楚。',
    loc: null,
    timeCost: 1,
    risk: 0,
    order: 80,
    cond: {
      all: [
        { mem: 'mem_death_houshan_shouwang' },
        { daoxin: { conflict: ['shouhun', 'yujian'] } },
        { not: { daoxin: { tiaohe: ['shouhun', 'yujian'] } } }
      ]
    },
    effects: [
      { log: { t: '你重新走了一遍那场死。兽王扑来时不疾不徐，每一爪都收放有度——它放兽性出笼，却始终有一颗定住的心。', style: '因果' } },
      { log: { t: '你忽然懂了：前世你死，不是因为兽性太烈，是因为你只有兽性、没有那颗定住的心。', style: '突破' } },
      { daoxin: { op: 'tiaohe', pair: ['shouhun', 'yujian'], by: '生死' } },
      { counterAdd: { xinmo: -7 } },
      { tendAdd: { yujian: 4 } },
      { insight: { id: 'tiaohe_shengsi_shoujian', title: '兽要烈，心要定', t: '前世我被那一爪拍碎，是因为只有兽、没有剑。兽可以烈，但握兽的那只手，得稳。', confirm: true } }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 三、入魔闭环：贪学 / 强压失败 / 违誓 → 走火入魔 / 心魔噬身
  // ════════════════════════════════════════════════════════════════════

  // 3.1 入魔死亡记忆（钉死 id；引擎在 die '走火入魔'/'心魔噬身' 时尝试授予）。
  G.define('memory', {
    id: 'mem_zouhuo_rumo',
    title: '两条路烧穿了我',
    kind: 'death',
    deathCause: ['走火入魔', '心魔噬身'],
    carry: true,
    text: '前世你什么都想要——血与香、雷与寒、兽与剑，一门也不肯舍。'
      + '它们在你身体里争了太久，终于在一个夜里一齐反扑。你没有死在敌人手上，是死在自己手上。'
      + '最后清醒的一刻，你才明白：不是路太多，是你心里始终没有一个主。',
    dream: '你又梦见那一夜，身体里两种天理一起烧穿了你。梦里有声音说：贪多无主，必反噬其身——先立一个主，再谈兼修。'
  });

  // 3.2 强行并行后「气机鼎沸」未及调和 → 心魔噬身（高风险事件，反噬 pflag 在场时点名概率回收）。
  //   引擎在突破/战斗会回收 bingxing_fanshi；此处再给内容侧一条「贪进入魔」的剧情致死路径。
  G.define('event', {
    id: 'ev_rumo_fanshi',
    title: '反噬',
    queueOnly: true,
    tags: ['隐秘', '道心', '凶'],
    text: '那把你强行并行烧起来的火，终究回头了。'
      + '夜半，两股天理在你身体里同时反扑，气血逆行，七窍生烟。'
      + '你想压，压不住；想调和，已经太晚。心里那个一直没立起来的「主」，此刻空空荡荡。',
    choices: [
      {
        text: '拼尽最后一口气，强行镇压',
        outcomes: [
          { weight: 3, cond: { counter: { id: 'xinmo', gte: 60 } }, effects: [
            { log: { t: '你压不住了。两种天理烧穿经脉，你在自己点燃的火里，再没能睁开眼。', style: '凶' } },
            { die: { cause: '走火入魔' } }
          ] },
          { weight: 2, effects: [
            { log: { t: '你呕出一大口黑血，总算把那把火压了回去——但经脉已伤，元气大损。', style: '凶' } },
            { hp: -20 }, { injure: { months: 3, severity: 2 } },
            { counterAdd: { xinmo: 6 } },
            { pflagSet: { id: 'bingxing_fanshi', v: false } },
            { daoSuppress: 'leifa' },
            { insight: { id: 'rumo_jingxun', title: '差一点烧穿', t: '我险些死在自己手上。两条路一起烧，没有主心骨，迟早反噬——下回，先立一个主。', confirm: true } }
          ] }
        ]
      },
      {
        text: '不再挣扎，任它去',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你松了手。心里那点贪念终于把你拖了下去——心魔噬身，万劫不复。', style: '凶' } },
          { die: { cause: '心魔噬身' } }
        ] }]
      }
    ]
  });

  // 3.3 违誓入魔：立过「不以媚术害无辜」之誓，却拿媚术害了无辜 → 誓力反噬。
  //   钩子事件：持 shi_bu_haiwugu 且做了害无辜的事（内容侧/他人事件可 eventNow 点名此事件回收）。
  G.define('event', {
    id: 'ev_weishi_rumo',
    title: '誓言反噬',
    queueOnly: true,
    tags: ['隐秘', '道心', '因果', '凶'],
    cond: { pflag: 'shi_bu_haiwugu' },
    text: '你终究破了自己立下的那条线——用那点勾人的法子，害了一个本不该害的人。'
      + '誓言落定时静下来的那个声音，此刻又响了，比从前任何一次都重。'
      + '它一笔一笔地算，算到你违誓的这一笔时，命数像被人攥住，狠狠一拧。',
    choices: [
      {
        text: '认罚——把违誓的因果一肩担下',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'shi_bu_haiwugu', v: false } },
          { log: { t: '你不躲。誓力反噬如刀绞，你咬牙受了，命去了大半，人却保住了。', style: '凶' } },
          { hp: -25 }, { lifespanY: -5 }, { counterAdd: { xinmo: 10 } },
          { rumorAdd: { t: '听说那个人立过誓又自己破了，遭了一场说不清的恶报。', fame: -3 } },
          { insight: { id: 'weishi_jingxun', title: '誓不可轻立', t: '我立过誓，又自己破了。誓力反噬比刀还狠——往后宁可不立，立了就守到死。', confirm: true } }
        ] }]
      },
      {
        text: '不认——硬扛因果，反把杀机引向心脉',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你不肯认。可你越是抗拒，那笔账就算得越狠。心魔趁虚噬入，你被自己破的誓拖进了魔障。', style: '凶' } },
          { counterAdd: { xinmo: 20 } },
          { die: { cause: '心魔噬身' } }
        ] }]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 四、复合称号（调和成功 ≥2；入魔/违誓给恶名）
  // ════════════════════════════════════════════════════════════════════

  // 4.1 双道调和者：任一对冲突已调和（autoCond 用 any 覆盖五对）。
  G.define('title', {
    id: 'shuangdao_tiaohe',
    name: '双道调和者',
    desc: '别人兼修，越修越乱；你却把两条本该相争的路说通了，让它们在一个人身上并行不悖。镇上懂行的人说，这才是真有道心。',
    fame: 18,
    rumor: '有人说，那个人身上养着两门本该相克的功法，竟一点不乱——像是找到了把它们说通的理由。',
    autoCond: { any: [
      { daoxin: { tiaohe: ['danyao', 'leifa'] } },
      { daoxin: { tiaohe: ['xuejian', 'xianghuo'] } },
      { daoxin: { tiaohe: ['humei', 'yinguo'] } },
      { daoxin: { tiaohe: ['handu', 'leifa'] } },
      { daoxin: { tiaohe: ['shouhun', 'yujian'] } }
    ] }
  });

  // 4.2 持心人：以「抑之」之道立主调和过（chixin pflag），知其在而不擅用——道心稳。
  G.define('title', {
    id: 'chixin_ren',
    name: '持心人',
    desc: '你心里立着一个主。再多的路在你身体里争，也争不过你那一颗定住的心——知道它在，却由你说了算。',
    fame: 16,
    rumor: '镇上传，那个人身上明明压着好几门相冲的功法，神色却稳得像一口古井，半点不乱。',
    autoCond: { pflag: 'chixin' }
  });

  // 4.3 入魔者（恶名）：曾走火入魔/心魔噬身死过（legacy 残响跨世可见）。
  //   引擎在入魔死时若落 legacy 'zouhuo_rumo_si'，则后世满足此 autoCond——属悲剧残响，给恶名传闻。
  G.define('title', {
    id: 'rumo_zhe',
    name: '入魔之名',
    desc: '你前世贪多无主，终于被身体里相争的天理烧成了灰。这桩旧事像一道焦痕，跟着你的魂转世而来——它提醒你，也警告着别人。',
    fame: -8,
    rumor: '老人们压低声音说：那一脉里出过一个走火入魔的，死状极惨。这一世的他，眼里偶尔也闪过那点不祥。',
    autoCond: { legacy: 'zouhuo_rumo_si' }
  });

  // 法宝调和路径 ev_tiaohe_fabao 用的「香灰玉」镇心魔，物品已由 enemies.js 定义（邪影/厉祖/河神战利，
  //   consumable 减心魔 -20），本文件只 itemAdd / cond 引用，不重复 G.define（避免 [REG] 覆盖）。

})();
