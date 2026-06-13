// js/data/beast_content.js — 驭兽系统内容：得兽/成长/性情/死亡/转世事件、新行动、记忆、称号。
// 引用 beastlore.js 的物种谱条与 beast.js 的 pet 条件/效果 DSL（见 beast.js 文件头 §B/§C）。
// 引擎已为内容备好：
//   * 效果 {pet:{op:'gain'|'gainSoul'|'bond'|'temper'|'mark'|'spirit'|'mood'|'duty'|'remember'|'die'|'leave', ...}}
//   * 条件 {pet:{has, spirit:{gte}, bondGte, track, duty, mark, species, moodIs}}
//   * 丧兽记忆 id 约定为 'mem_sangshou'（命缘兽死时引擎尝试授予，未注册则安全跳过）。
//   * 转世认主走 legacy 'pet_zhuanshi' + meta.carried.petSoul（die 命缘时引擎自动落，gainSoul 重建）。
// 加载顺序：本文件必须在 beastlore.js 之后。
//
// ── 本文件落地清单（自验报告同步）──
//   事件：ev_xueye_shiyi（雪夜拾遗·野凶得兽）/ ev_jiuzhu_shangshou（救助伤兽·温灵得兽）/
//         ev_gongli_shengsi（共历生死·开灵契机）/ ev_mengyin_renzhu（梦引而至·转世认主）。
//   行动：anfu_shou（安抚）/ wei_lingwu（喂灵物·狼王心血染煞）/ fanggui_shou（放归）/
//         shoulan_zebai（兽栏择伴·驯兽人出生限定）/ gongchu_zhiling（共处之灵·开灵）。
//   记忆：mem_sangshou（丧兽之痛，引擎 die 命缘时授予；carry:false）。
//   称号：tong_shou_yu（通兽语，autoCond pet spirit≥灵兽）。
//   引用物种 id（契约 §H，beastlore.js 定义）：
//     dujiao_lang（独尾灰狼·野凶）/ nuanshi_gui（暖石龟·温灵）/ chimu_hu（赤目狐崽·野凶，备选）。
//   引用既有 id：地点 heishan_waiwei / houshan_lin / jiazhong；
//     物品 langwang_xinxue（狼王心血·enemies.js）；出生 pflag tongshou_xing（驯兽人）；
//     死因 mem_death_yelang/yaolang（雪夜拾遗门槛之一）；legacy pet_zhuanshi（轮回链）。
(function () {
  'use strict';

  // ════════════════════════════════════════════════════════════════════
  // 一、得兽来路（≥2：雪夜拾遗·野凶 / 救助伤兽·温灵）
  // ════════════════════════════════════════════════════════════════════

  // —— 雪夜拾遗（野凶 · dujiao_lang）——
  // cond：黑山外围 或 后山兽径 + 冬季 + 杀过妖狼/野狼（见过狼的凶）；无兽方可拾。
  // 「揣进怀里」→ gain 野凶 dujiao_lang（相识起手）+ temper 记仇 + 叙事；另给「由它去」留状态分支。
  G.define('event', {
    id: 'ev_xueye_shiyi', title: '雪夜拾遗',
    text: '雪埋了半道。你循着一线断续的血迹拐进背风的石坳，雪窝里蜷着一团灰——一只狼崽，独尾，后腿被铁夹咬穿了，母狼的尸首冻硬在三步外，护崽的姿势还没散。崽子听见动静，呜咽着龇出一排乳牙，眼里却没有怕，只有恨。',
    tags: ['野外', '狼', '夜', '雪'],
    baseWeight: 7, once: true,
    cond: {
      all: [
        { any: [{ loc: 'heishan_waiwei' }, { loc: 'houshan_lin' }] },
        { season: '冬' },
        { pet: { has: false } },
        { any: [{ mem: 'mem_death_yelang' }, { mem: 'mem_death_yaolang' },
                { kills: { id: 'yelang', gte: 1 } }, { kills: { id: 'yaolang', gte: 1 } }] }
      ]
    },
    prefer: { tend: { xuejian: 0.6, shouhun: 0.8 }, locTags: ['狼'] },
    choices: [
      {
        text: '揣进怀里',
        outcomes: [{ weight: 1, effects: [
          { pet: { op: 'gain', species: 'dujiao_lang', track: '野凶', bond: '相识',
                   from: '你解开铁夹，把那团抖个不停的灰塞进怀里。它咬了你一口，却没再挣。' } },
          { pet: { op: 'temper', add: '记仇' } },
          { pet: { op: 'remember', t: '雪夜里，是你把它从母狼的尸首边抱走' } },
          { counterAdd: { xuexing: 1 } },
          { log: { t: '崽子的体温隔着衣襟一点点回来。它把脸埋进你掌心，喉咙里滚着不知是凶是亲的低鸣。', style: '异象' } }
        ] }]
      },
      {
        text: '剥了母狼的皮，崽子由它去',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'langpi', n: 1 } },
          { counterAdd: { xuexing: 2, shaqi: 1 } },
          { tendAdd: { xuejian: 2 } },
          { log: { t: '你利落地起了那张好皮，没去看雪窝里那双眼睛。', style: '血' } },
          { log: { t: '下山的路上，背后一直缀着一串浅浅的、独尾拖出的雪痕。到镇口才断。', style: '凶' } }
        ] }]
      },
      {
        text: '把干粮留下，转身走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你掰下半块干粮搁在它够得着的地方，退出石坳。', style: '平' } },
          { log: { t: '它没动那块粮，只是一直盯着你的背影，盯到你看不见为止。', style: '因果' } }
        ] }]
      }
    ]
  });

  // —— 救助伤兽（温灵 · nuanshi_gui，亲近起手）——
  // cond：河边/野外见伤兽；无兽方可救。温灵起手即「亲近」（救命之恩）。
  G.define('event', {
    id: 'ev_jiuzhu_shangshou', title: '救助伤兽',
    text: '溪石滩上翻着一只巴掌大的老龟，壳沿沁着血，是被山洪卷下来磕的。它仰面挣了不知多久，四条腿划得越来越慢。奇的是，你蹲近了，那龟壳竟透出一线温意——三九寒天里，像揣着一块没凉透的灶石。',
    tags: ['野外', '水', '善'],
    baseWeight: 6, once: true,
    cond: {
      all: [
        { any: [{ loc: 'heishan_waiwei' }, { loc: 'houshan_lin' }] },
        { pet: { has: false } }
      ]
    },
    prefer: { tend: { yinguo: 0.5, danyao: 0.4 }, locTags: ['水'] },
    choices: [
      {
        text: '替它翻身，把壳上的伤敷上药',
        outcomes: [{ weight: 1, effects: [
          { pet: { op: 'gain', species: 'nuanshi_gui', track: '温灵', bond: '亲近',
                   from: '你把它翻正，嚼了把凝血草糊在壳沿的裂口上。它缩了缩，又慢慢探出头，蹭了蹭你的指头。' } },
          { pet: { op: 'mood', set: '安' } },
          { pet: { op: 'remember', t: '溪石滩上，你替它翻过身、敷过伤' } },
          { tendAdd: { yinguo: 3 } },
          { log: { t: '自那以后，那块灶石似的暖意，便慢吞吞地跟在你身后了。夜里搁在脚边，一宿都不凉。', style: '吉' } }
        ] }]
      },
      {
        text: '它命大，自己能翻过来',
        outcomes: [{ weight: 1, effects: [
          { log: { t: '你绕开它走了。走出十几步回头，它还仰着，腿划得一下比一下慢。', style: '平' } },
          { counterAdd: { xinmo: 1 } }
        ] }]
      }
    ]
  });

  // —— 街犬相随（凡·温灵 · qingmao_quan）：镇上低门槛起手，给非驯兽人一条温情来路 ——
  G.define('event', {
    id: 'ev_jiequan_xiangsui', title: '街犬相随',
    text: '镇口那条青毛灰犬，不知打哪天起，开始远远地缀着你——你蹲牲口、买炊饼、回家，它都在三五步外卧着，不远不近。今日你停下脚步回头，它竟摇着尾巴小跑过来，仰头看你，喉间发出讨好的呜咽，像是认准了你就是它要等的人。',
    tags: ['市集', '善'],
    baseWeight: 6, once: true,
    cond: { all: [{ loc: 'qingshizhen' }, { pet: { has: false } }] },
    prefer: { tend: { yinguo: 0.3 } },
    choices: [
      { text: '拍拍它的头，带它回家', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'qingmao_quan', track: '温灵', bond: '亲近',
                 from: '你蹲下身拍了拍它的头，它高兴得直转圈，一路颠颠地跟你进了门。' } },
        { pet: { op: 'remember', t: '它在镇口认了你，从此摇着尾巴跟你回了家' } },
        { tendAdd: { yinguo: 2 } },
        { log: { t: '自那天起，你回家的路上总多一条灰影子，一前一后地替你引着路。', style: '吉' } }
      ] }] },
      { text: '轰它走，养不起', outcomes: [{ weight: 1, effects: [
        { counterAdd: { xinmo: 1 } },
        { log: { t: '你跺脚把它轰开。它怏怏地退到墙角，却没走远，仍远远地望着你的背影。', style: '平' } }
      ] }] }
    ]
  });

  // —— 坠崖之雏（凡·野凶 · ya_ying）：驿道/黑山，野得不肯求人 ——
  G.define('event', {
    id: 'ev_yaying_zhuiluo', title: '坠崖之雏',
    text: '崖壁的荆棘里挂着一只半大的崖鹰，一只翅膀耷拉着，是被夜风掀落了巢。它见你靠近，不退反扑，铁钩似的喙啄得你手背见血——野性十足，半点不肯向人低头。',
    tags: ['野外', '渡'],
    baseWeight: 6, once: true,
    cond: { all: [{ any: [{ loc: 'yima_guan' }, { loc: 'heishan_waiwei' }] }, { pet: { has: false } }] },
    prefer: { tend: { shouhun: 0.5 } },
    choices: [
      { text: '忍着痛，把它从荆棘里解下来', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'ya_ying', track: '野凶', bond: '相识',
                 from: '你任它啄，慢慢把缠在它翅上的荆棘一根根挑开。血流了一手，它却忽然不动了，斜着一只金眼打量你。' } },
        { pet: { op: 'temper', add: '桀骜' } },
        { pet: { op: 'remember', t: '你流着血把它从荆棘里解下来，它记着这笔' } },
        { hp: -3 },
        { log: { t: '它落在你腕上，爪子扣得生疼，却没再飞走。野物认的不是恩，是你这份不怕疼的硬气。', style: '异象' } }
      ] }] },
      { text: '由它去，野物自有野物的命', outcomes: [{ weight: 1, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '你裹好手背，绕开了那丛荆棘。身后传来几声不甘的厉唳，越来越远。', style: '平' } }
      ] }] }
    ]
  });

  // —— 殿角双尾（中·温灵 · shuangwei_mao）：山神庙，中品门槛（阴气重/香火倾向）——
  G.define('event', {
    id: 'ev_shuangwei_dianjiao', title: '殿角双尾',
    text: '山神庙的殿角，不知何时蹲了一只灰猫，生着两条尾巴，一条直竖，一条缠在爪边。它不怕人，只对着后殿的方向一下下炸毛、低吼，倒比香火还灵验地镇着些不干净的东西。你走近，它忽然转头，一双竖瞳定定看你，喉间咕噜一声——像是早等着你来。',
    tags: ['阴邪', '香火', '夜'],
    baseWeight: 5, once: true,
    cond: { all: [{ loc: 'shanshenmiao' }, { pet: { has: false } },
                  { any: [{ wvar: { id: 'ghostQi', gte: 30 } }, { tend: { id: 'xianghuo', gte: 10 } }, { pflag: 'xianghuo_yinji' }] }] },
    prefer: { tend: { xianghuo: 0.6, yinguo: 0.4 }, locTags: ['阴邪', '香火'] },
    choices: [
      { text: '招招手，看它肯不肯跟你', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'shuangwei_mao', track: '温灵', bond: '相识',
                 from: '你伸出手。它没立刻过来，绕着你的脚踝走了两圈，嗅了又嗅，才慢条斯理地跳上你肩头，两条尾巴一齐卷住了你的脖颈。' } },
        { pet: { op: 'remember', t: '在山神庙的殿角，它从一窝阴影里挑中了你' } },
        { tendAdd: { xianghuo: 2 } },
        { wvarAdd: { ghostQi: -2 } },
        { log: { t: '有它卧在肩头，那些贴着殿角游走的凉气，竟真的退开了三尺。', style: '异象' } }
      ] }] },
      { text: '灵物有主，不可强求', outcomes: [{ weight: 1, effects: [
        { tendAdd: { xianghuo: 1 } },
        { log: { t: '你冲它合掌一礼，退出殿去。它仍蹲在原处，目送你，尾尖轻轻扫着积灰的供桌。', style: '平' } }
      ] }] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 一·甲、v2 新增 6 物种获取入口（百兽谱 6→12，无死兽铁律 §14.2）
  //   低境界=救/拾/驯（下品 mobai_she）；中品有门槛（hanlin_ta/yinhun_die/shimeng_mo）；
  //   上品高门槛（xianlei_chu/tongren_lu，realm 门槛体现「低境界遇不到/压不住」）。
  //   每事件 prefer.tend 对口道心（§14.5）；得/不得两分支，每 outcome ≥1 非 log op。
  //   引用既有 id：地点 yaopu/heishan_waiwei/hantan/feikuang/luanzang_gang/heshen_du/
  //     yizhuang/shanshenmiao/houshan_lin/duanjianya；wvar ghostQi/mineInstability；
  //     counter xinmo；mem_death_*（前世记忆门槛）。
  // ════════════════════════════════════════════════════════════════════

  // —— 畦间墨蛇（下·温灵 · mobai_she）：低门槛，对口丹药道；它辨毒救你一回 ——
  G.define('event', {
    id: 'ev_mobai_bianjie', title: '畦间墨蛇',
    text: '药圃的畦埂上盘着一条墨斑细蛇，正一片片地舐着你新栽的草药。你正要驱它，却见它舐到一丛叶色青翠的草时，猛地一缩脖颈，掉头游开了——那丛草你认得，正是看着鲜嫩、入口却能毒倒一头牛的断肠青。这小东西，竟比你还识毒。',
    tags: ['药', '野外', '善'],
    baseWeight: 6, once: true,
    cond: {
      all: [
        { any: [{ loc: 'yaopu' }, { loc: 'heishan_waiwei' }] },
        { pet: { has: false } }
      ]
    },
    prefer: { tend: { danyao: 0.6, yinguo: 0.3 }, locTags: ['药'] },
    choices: [
      { text: '蹲下来，由它在你手边舐草', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'mobai_she', track: '温灵', bond: '亲近',
                 from: '你伸出手，它信子一吐，凉凉地盘上你的腕子，却并不咬。打那天起，你采的每一味药，都先经它尝过这一关。' } },
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'remember', t: '药圃畦间，它替你辨出了那丛断肠青' } },
        { tendAdd: { danyao: 2 } },
        { log: { t: '从此你煎药辨草，身边多了一条沉静的墨影。它尝着不对便缩头，省了你不知多少回险些入口的祸。', style: '吉' } }
      ] }] },
      { text: '一棍把它挑开，蛇虫晦气', outcomes: [{ weight: 1, effects: [
        { counterAdd: { xinmo: 1 } },
        { log: { t: '你寻根棍子把它挑到畦外。它无声地游进草里，临了回头看你一眼，再不见踪影。', style: '平' } },
        { log: { t: '当夜你试新采的药材，险些把一味带毒的草下进了罐里，惊出一身冷汗。', style: '丹' } }
      ] }] }
    ]
  });

  // —— 潭底寒鳞（中·野凶 · hanlin_ta）：对口寒冰道；废矿不稳/寒潭，凶兽掂量你 ——
  G.define('event', {
    id: 'ev_hanlin_tandi', title: '潭底寒鳞',
    text: '寒潭边的石头上结着一层不合时令的白霜。你伸手一探，霜下伏着一只生鳞的水獭，黑眼冷冷地剜你一眼，并不躲。它渴极了，喉间却兀自吐出一线沁凉的寒泉，舐着自己的爪——这是潭里有名的寒鳞獭，认力不认人，寻常修士它根本懒得理。',
    tags: ['寒', '水', '野外'],
    baseWeight: 5, once: true,
    cond: {
      all: [
        { any: [{ loc: 'hantan' }, { loc: 'feikuang' }] },
        { pet: { has: false } },
        { any: [
          { tend: { id: 'handu', gte: 12 } },
          { wvar: { id: 'mineInstability', gte: 35 } },
          { season: '冬' }
        ] }
      ]
    },
    prefer: { tend: { handu: 0.7, shouhun: 0.3 }, locTags: ['寒', '水'] },
    choices: [
      { text: '不动声色，让它先掂量你身上那股寒意', outcomes: [
        { weight: 5, cond: { tend: { id: 'handu', gte: 12 } }, effects: [
          { pet: { op: 'gain', species: 'hanlin_ta', track: '野凶', bond: '相识',
                   from: '它嗅到你身上那股同源的彻骨寒，黑眼里的轻慢淡了几分。它绕着你游了一圈，啪地把湿脑袋抵上你的鞋面——算是认了你这份比它还冷的道。' } },
          { pet: { op: 'temper', add: '孤冷' } },
          { pet: { op: 'remember', t: '寒潭边，它掂量过你那股同源的寒意，才肯认你' } },
          { tendAdd: { handu: 2 } },
          { log: { t: '从此你卧处常年结着一层薄霜，暑天也凉。它认的不是你的好脸色，是你这身压得住它的寒。', style: '异象' } }
        ] },
        { weight: 4, effects: [
          { counterAdd: { xinmo: 1 } },
          { log: { t: '它斜睨着你，半晌，喷了个冷颤似的响鼻，转身钻回了黑黢黢的潭底。你身上这点道行，还没入它的眼。', style: '平' } }
        ] }
      ] },
      { text: '强行去抓它', outcomes: [{ weight: 1, effects: [
        { hp: -4 },
        { counterAdd: { shaqi: 1 } },
        { log: { t: '你手刚探近，它鳞片倏地立起，一线寒泉激在你腕上，皮肤霎时冻得发紫。它冷冷瞥你一眼，潜回了潭心——力不如它，休想强求。', style: '凶' } }
      ] }] }
    ]
  });

  // —— 渡亡之蝶（中·温灵 · yinhun_die）：对口香火/因果；乱葬岗/河神渡/义庄，阴气重处 ——
  G.define('event', {
    id: 'ev_yinhun_duwang', title: '渡亡之蝶',
    text: '荒坟连片的夜里，一只生着三足的灰蝶贴着地皮飞着。它专拣那些刚断了气的、半死不活的小物停落，翅一开一合，便像有什么被它轻轻引着，从那躯壳里挪了出来，跟着它飘向更暗处。它绕到你脚边，停在你的鞋尖上，三足轻颤，仿佛在问你：可愿与它同行这一程渡亡的路？',
    tags: ['阴邪', '葬', '夜', '渡'],
    baseWeight: 5, once: true,
    cond: {
      all: [
        { any: [{ loc: 'luanzang_gang' }, { loc: 'heshen_du' }, { loc: 'yizhuang' }] },
        { pet: { has: false } },
        { any: [
          { tend: { id: 'xianghuo', gte: 10 } },
          { tend: { id: 'yinguo', gte: 12 } },
          { wvar: { id: 'ghostQi', gte: 35 } }
        ] }
      ]
    },
    prefer: { tend: { xianghuo: 0.6, yinguo: 0.5 }, locTags: ['阴邪', '葬', '渡'] },
    choices: [
      { text: '合掌一礼，许它停在你肩头', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'yinhun_die', track: '温灵', bond: '相识',
                 from: '你合掌默念一句往生,它便轻轻振翅,落上你的肩头。从此那些缠人的阴气见了它,总要退让三分。' } },
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'remember', t: '乱葬的夜里,你许它停上肩头,与它同行渡亡的路' } },
        { tendAdd: { xianghuo: 2, yinguo: 1 } },
        { wvarAdd: { ghostQi: -2 } },
        { log: { t: '有它在,你夜行荒坟也不再瘆得慌——它扇起的微风里,总有一缕安魂的静气。', style: '异象' } }
      ] }] },
      { text: '挥手把它赶开，怕沾了亡气', outcomes: [{ weight: 1, effects: [
        { counterAdd: { xinmo: 1 } },
        { wvarAdd: { ghostQi: 1 } },
        { log: { t: '你一挥袖把它扇开。它打了个旋,无声地飘向更深的暗处,再没回头。那些它本要替你引开的东西,夜里又贴上了你的脊背。', style: '凶' } }
      ] }] }
    ]
  });

  // —— 枕边噬梦（中·温灵 · shimeng_mo）：对口因果；心魔重/背负前世死状记忆者才招它来 ——
  G.define('event', {
    id: 'ev_shimeng_zhenbian', title: '枕边噬梦',
    text: '你在山神庙里借宿,夜夜被同一个梦缠着——前世死时,那双直勾勾盯着你的眼。这一夜你又惊醒,却觉枕边伏着一团憨拙的黑影,正拿鼻子一耸一耸地嗅你。它见你醒了,也不惊慌,憨憨地拿脑袋蹭了蹭你的脸,像是把你那截没做完的噩梦,囫囵吞了下去。',
    tags: ['阴邪', '梦', '因果', '夜'],
    baseWeight: 5, once: true,
    cond: {
      all: [
        { any: [{ loc: 'shanshenmiao' }, { loc: 'yizhuang' }] },
        { pet: { has: false } },
        { any: [
          { counter: { id: 'xinmo', gte: 4 } },
          { mem: 'mem_death_generic' },
          { tend: { id: 'yinguo', gte: 12 } }
        ] }
      ]
    },
    prefer: { tend: { yinguo: 0.6 }, locTags: ['梦', '因果', '阴邪'] },
    choices: [
      { text: '伸手摸了摸那团黑影的头', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'shimeng_mo', track: '温灵', bond: '亲近',
                 from: '你摸了摸它,它憨憨地拱进你怀里,呼噜呼噜地睡了。从那夜起,前世死时那双眼,再没来扰过你的梦。' } },
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'remember', t: '山庙的枕边,是它一口口替你吃掉了那个噩梦' } },
        { counterAdd: { xinmo: -2 } },
        { log: { t: '从此它睡你枕边,把你那些没完没了的旧账噩梦一一吞去。你睡得一夜比一夜沉,人也一日比一日清明。', style: '吉' } }
      ] }] },
      { text: '吓了一跳,把它推下榻去', outcomes: [{ weight: 1, effects: [
        { counterAdd: { xinmo: 2 } },
        { log: { t: '你猛一推,它扑通滚下榻,委屈地哼了一声,颠颠地钻进了神像底下的暗处。', style: '平' } },
        { log: { t: '那双眼睛当夜又回到了你梦里,这一回,瞪得比从前更死。', style: '因果' } }
      ] }] }
    ]
  });

  // —— 雷树乌雏（上·野凶 · xianlei_chu）：高门槛(realm≥炼气初期 + 雷法/雷雨)；低境界压不住 ——
  G.define('event', {
    id: 'ev_xianlei_leishu', title: '雷树乌雏',
    text: '一道天雷刚劈过,焦黑的树桩上落着一只乌翎雏鸟,浑身炸着没散尽的雷火,金亮的眼凶狠地剜着四下。寻常人近它三步,便被那股雷意激得头皮发麻、不敢再进——它生来带劫,认的是同它一样不畏雷的人。它歪着头打量你,似在掂量:你这点道行,压得住我这身雷么?',
    tags: ['雷', '野外', '兽'],
    baseWeight: 5, once: true,
    cond: {
      all: [
        { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_waiwei' }] },
        { pet: { has: false } },
        { realm: { gte: 2 } },
        { any: [
          { tend: { id: 'leifa', gte: 18 } },
          { weather: '雷雨' }
        ] }
      ]
    },
    prefer: { tend: { leifa: 0.9, shouhun: 0.2 }, locTags: ['雷', '兽'] },
    choices: [
      { text: '迎着那股雷意,稳稳伸出手腕', outcomes: [
        { weight: 5, cond: { tend: { id: 'leifa', gte: 18 } }, effects: [
          { pet: { op: 'gain', species: 'xianlei_chu', track: '野凶', bond: '相识',
                   from: '你周身雷意一吐,与它那身躁动的雷火隐隐相和。它金眼一亮,扑棱着落上你的手腕,喙尖噼啪溅着细小的电花——它认了你这股压得住它的雷。' } },
          { pet: { op: 'temper', add: '烈性' } },
          { pet: { op: 'remember', t: '焦树下,你以雷意压住了它那身桀骜的天劫之力' } },
          { tendAdd: { leifa: 3 } },
          { hp: -3 },
          { log: { t: '它落上你肩头那一刻,你被它身上残余的雷火激得一麻。从此雷雨夜,它替你引偏那一道道本要落下的天雷。', style: '雷' } }
        ] },
        { weight: 4, effects: [
          { hp: -5 },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你手刚探近,它周身雷火轰然一炸,震得你五脏翻腾,踉跄退开。它金眼睥睨着你,振翅冲入雨幕——你这点道行,还压不住它这身天劫。', style: '雷' } }
        ] }
      ] },
      { text: '雷意太烈,退开避其锋芒', outcomes: [{ weight: 1, effects: [
        { tendAdd: { leifa: 1 } },
        { log: { t: '你识趣地退开数步。它在焦树上昂首一声清唳,振翅没入翻滚的雷云,徒留一地灼痕。', style: '平' } }
      ] }] }
    ]
  });

  // —— 雾林鹿语（上·温灵 · tongren_lu）：高门槛(realm≥炼气初期 + 因果/丹药德缘)；无缘撞不见 ——
  G.define('event', {
    id: 'ev_tongren_wulin', title: '雾林鹿语',
    text: '后山深径的雾浓得化不开。你独行许久,忽听雾里有人极轻地说了一句话,字字落在你心上正参不透的那处死结上。你猛回头,雾中立着一头角生九节的灵鹿,莹莹生光的眼温温望着你,口唇微动,分明方才说话的便是它。传说这通人语的九节鹿,非有缘有德者连影子也撞不见——它今夜,竟肯为你现身。',
    tags: ['野外', '夜', '因果'],
    baseWeight: 4, once: true,
    cond: {
      all: [
        { any: [{ loc: 'houshan_lin' }, { loc: 'duanjianya' }] },
        { pet: { has: false } },
        { realm: { gte: 2 } },
        { any: [
          { tend: { id: 'yinguo', gte: 18 } },
          { all: [{ tend: { id: 'danyao', gte: 15 } }, { mem: 'mem_death_generic' }] }
        ] }
      ]
    },
    prefer: { tend: { yinguo: 0.8, danyao: 0.4 }, locTags: ['因果'] },
    choices: [
      { text: '不惊不扰,向它郑重一揖', outcomes: [{ weight: 1, effects: [
        { pet: { op: 'gain', species: 'tongren_lu', track: '温灵', bond: '相识',
                 from: '你长揖到地,不贪不扰。它踱近前来,用温热的鼻尖抵了抵你的额,似将一句你听不全的口诀,轻轻渡进了你心里。它认下了你这份有缘有德的恭敬。' } },
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'remember', t: '雾林深处,你以恭敬有缘之心,请得这头通人语的九节鹿现身' } },
        { tendAdd: { yinguo: 3 } },
        { qi: 6 },
        { log: { t: '自那夜起,你参不透的关窍,夜里林间常有一句话替你点开;拿不准的灵物,它鼻尖一触便知真伪。', style: '因果' } }
      ] }] },
      { text: '又惊又喜,急步上前去抓', outcomes: [{ weight: 1, effects: [
        { counterAdd: { xinmo: 1 } },
        { log: { t: '你一动了贪攫之念,雾陡然散开,鹿影杳然无踪,方才那句话也再想不起来。', style: '因果' } },
        { log: { t: '此后你数次再来这片雾林,任你如何寻觅,那头九节鹿再不肯露一丝影子——缘分被你那一步贪心,踏断了。', style: '平' } }
      ] }] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 二、驭兽行动（cond {pet:{has:true}}，loc 合理；每 outcome ≥1 非 log 状态 op）
  // ════════════════════════════════════════════════════════════════════

  // —— 安抚：消「躁」、添牵绊 ——
  G.define('action', {
    id: 'anfu_shou', name: '安抚同行的兽', desc: '它近来不大安生。坐下来，给它顺顺毛，喂两口手食。',
    loc: 'jiazhong', timeCost: 1, risk: 0, order: 60,
    cond: { pet: { has: true } },
    effects: [],
    outcomes: [
      { weight: 5, cond: { pet: { moodIs: '躁' } }, effects: [
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'bond', n: 3 } },
        { log: { t: '你由着它咬你的袖子撒气，顺到第三遍，它喉咙里的火气泄了，瘫在你膝头打起盹来。', style: '吉' } }] },
      { weight: 5, cond: { pet: { moodIs: '伤' } }, effects: [
        { pet: { op: 'mood', set: '安' } },
        { pet: { op: 'bond', n: 3 } },
        { hp: -2 },
        { log: { t: '你替它换了裹伤的布，它疼得低嚎，却没躲，只把头抵在你心口，听你的动静。', style: '吉' } }] },
      { weight: 4, effects: [
        { pet: { op: 'bond', n: 2 } },
        { log: { t: '一人一兽各占半张席，谁也不说话。它的尾巴慢慢扫着地，像在数你的呼吸。', style: '平' } }] },
      { weight: 2, cond: { pet: { bondGte: '相托' } }, effects: [
        { pet: { op: 'mood', set: '恋主' } },
        { pet: { op: 'bond', n: 1 } },
        { log: { t: '你起身，它立刻跟上来，半步不离。你走到哪，那点暖就挪到哪。', style: '平' } }] }
    ]
  });

  // —— 喂灵物：耗 Boss 战利品「狼王心血」→ mark xue_ran（染煞）+ 染血道 + 副作用 ——
  // 与 §F combat:end 染煞噬敌钩咬合（有 xue_ran 印记→噬敌叙事 + 玩家 xuexing↑）。
  G.define('action', {
    id: 'wei_lingwu', name: '喂它一捧灵物', desc: '你手里那捧凝而不散的狼王心血，烫得发慌。喂给它，许能催它的凶性，也许会催出别的东西。',
    loc: 'jiazhong', timeCost: 1, risk: 1, order: 62,
    cond: { all: [{ pet: { has: true } }, { pet: { track: '野凶' } },
                  { not: { pet: { mark: 'xue_ran' } } }, { item: { id: 'langwang_xinxue', n: 1 } }] },
    effects: [],
    outcomes: [
      { weight: 1, effects: [
        { itemDel: { id: 'langwang_xinxue', n: 1 } },
        { pet: { op: 'mark', add: 'xue_ran' } },
        { pet: { op: 'temper', add: '嗜血' } },
        { pet: { op: 'mood', set: '躁' } },
        { pet: { op: 'remember', t: '你喂它喝下那捧烫手的心血那夜' } },
        { tendAdd: { xuejian: 6 } },
        { counterAdd: { xuexing: 4, shaqi: 2 } },
        { hp: -4 },
        { log: { t: '它就着你的掌心舔尽了那捧血，浑身的毛根根炸起，眼底慢慢沁出一点红。', style: '血' } },
        { log: { t: '从那以后，它见血便兴奋，喉咙里整夜滚着低嚎。你给它的，它替你还在敌人身上——连着你的命，一起染了。', style: '异象' } }
      ] }
    ]
  });

  // —— 放归：leave + 留一段记忆（temper 怯/恋主/牵绊深者文案有别）——
  G.define('action', {
    id: 'fanggui_shou', name: '放它归山', desc: '关得久了，它眼里有时会望着山的方向。也许，是时候解开那根绳了。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 0, order: 64,
    cond: { pet: { has: true } },
    effects: [],
    outcomes: [
      { weight: 5, cond: { pet: { bondGte: '相托' } }, effects: [
        { pet: { op: 'remember', t: '你松开手，放它回山的那个清晨' } },
        { pet: { op: 'leave', reason: '它走出三步，又回头望了你很久很久，才一头扎进林子，再没回头。' } },
        { tendAdd: { yinguo: 4 } },
        { log: { t: '你站在林边，直到那点熟悉的影子彻底化进墨色的山里。这一别，你都替它松了口气，又像是空了一块。', style: '因果' } }] },
      { weight: 5, effects: [
        { pet: { op: 'remember', t: '你把它放归山林的那一天' } },
        { pet: { op: 'leave', reason: '它头也不回地窜进了林子，野性到底比那点情分重。' } },
        { tendAdd: { yinguo: 2 } },
        { log: { t: '绳子解开，它愣了一瞬，随即撒腿就跑，转眼没了影。山到底是它的家。', style: '平' } }] }
    ]
  });

  // —— 驯兽人专属：兽栏择伴（家学渊源，温灵幼兽）——
  // cond：驯兽人出生(pflag tongshou_xing) + 在后山兽径(自家兽栏) + 无兽。
  G.define('action', {
    id: 'shoulan_zebai', name: '兽栏择伴', desc: '自家兽栏里养着几窝幼崽。爹说，挑一只对眼缘的，从小养着，养出来的才认主。',
    loc: 'houshan_lin', timeCost: 1, risk: 0, order: 58,
    cond: { all: [{ pflag: 'tongshou_xing' }, { pet: { has: false } }] },
    effects: [],
    outcomes: [
      { weight: 5, effects: [
        { pet: { op: 'gain', species: 'nuanshi_gui', track: '温灵', bond: '亲近',
                 from: '栏角那只暖石龟一直慢吞吞地往你脚边挪。你蹲下去，它就把头搁上了你的鞋面——选定了。' } },
        { pet: { op: 'remember', t: '在自家兽栏里，是它先认了你' } },
        { tendAdd: { shouhun: 2 } },
        { log: { t: '你抱起它。爹在栏外看着，难得地点了点头：「这只温性，是块跟你过命的料。」', style: '吉' } }] },
      { weight: 3, effects: [
        { pet: { op: 'gain', species: 'chimu_hu', track: '野凶', bond: '相识',
                 from: '最里头那只赤目狐崽冲你呲牙，你偏挑了它。越是不肯认人的，养熟了越死心塌地。' } },
        { pet: { op: 'temper', add: '机警' } },
        { tendAdd: { shouhun: 2, humei: 1 } },
        { log: { t: '狐崽在你怀里挣了半天，终于消停下来，一双赤眼滴溜溜地打量着这个新主人。', style: '平' } }] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 三、开灵契机
  // ════════════════════════════════════════════════════════════════════

  // —— 共处之灵（行动）：cond pet spirit 0 + bondGte 相识 → spirit up 1（引擎播 omen）——
  G.define('action', {
    id: 'gongchu_zhiling', name: '与它静坐通灵', desc: '它跟你日子久了，眼神渐渐不像头畜生。试着引它的气与你的息相和——也许能引它通了那点灵窍。',
    loc: 'jiazhong', timeCost: 1, risk: 0, order: 66,
    cond: { all: [{ pet: { has: true } }, { pet: { spirit: { lte: 0 } } }, { pet: { bondGte: '相识' } }] },
    effects: [],
    outcomes: [
      { weight: 4, cond: { pet: { bondGte: '亲近' } }, effects: [
        { pet: { op: 'spirit', up: 1 } },
        { pet: { op: 'bond', n: 2 } },
        { pet: { op: 'remember', t: '你引它通灵的那一夜，它第一次听懂了你的话' } },
        { qi: 4 },
        { log: { t: '你的呼吸与它的起伏渐渐叠成一拍。某一刻，它忽然抬头看你，那眼神里头——头一回，像是真听懂了。', style: '异象' } }] },
      { weight: 3, effects: [
        { pet: { op: 'bond', n: 2 } },
        { qi: 2 },
        { log: { t: '气息相和了大半夜，它终究还是头懵懂的畜生，打了个哈欠，睡了。火候未到，急不得。', style: '平' } }] },
      { weight: 2, effects: [
        { pet: { op: 'mood', set: '躁' } },
        { qi: -3 },
        { log: { t: '你引气太急，它受不住，烦躁地挣开你，冲你龇了牙。', style: '平' } }] }
    ]
  });

  // —— 共历生死·开灵（事件）：相托档以上 + 在险地，共历一场生死后开灵 ——
  G.define('event', {
    id: 'ev_gongli_shengsi', title: '共历生死',
    text: '那一夜你险些没能下山。是它先嗅出了埋伏，死死咬住扑向你后颈的那道黑影，连人带兽滚下了半面雪坡。等你回过神，它正护在你身前，肋下挂着彩，却把背脊弓成一张满弓，一步也不肯退。生死过了一遭，它看你的眼神，和从前不一样了。',
    tags: ['野外', '险地', '血', '夜'],
    baseWeight: 8, once: true,
    cond: {
      all: [
        { pet: { has: true } },
        { pet: { spirit: { lte: 0 } } },
        { pet: { bondGte: '相托' } },
        { any: [{ loc: 'heishan_waiwei' }, { loc: 'houshan_lin' }] }
      ]
    },
    prefer: { tend: { shouhun: 0.8 }, locTags: ['血'] },
    choices: [
      {
        text: '抱住它，与它共喘这口气',
        outcomes: [{ weight: 1, effects: [
          { pet: { op: 'spirit', up: 1 } },
          { pet: { op: 'mood', set: '伤' } },
          { pet: { op: 'bond', n: 4 } },
          { pet: { op: 'remember', t: '那一夜它替你滚下雪坡，从此通了灵' } },
          { tendAdd: { shouhun: 3 } },
          { log: { t: '你抱住它发抖的身子，一人一兽的心跳渐渐合成一拍。就在这死里逃生的一拍里，它眼底亮起了从未有过的灵光。', style: '异象' } }
        ] }]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 四、死亡 / 丧兽记忆（命缘兽死时引擎尝试授予 mem_sangshou；carry:false）
  // ════════════════════════════════════════════════════════════════════
  G.define('memory', {
    id: 'mem_sangshou',
    title: '空了的那半张席',
    kind: 'misc',
    carry: false,
    text: '它走了。家里忽然空出一大块——脚边没了那点暖，夜里没了那道护着你的影子。你总下意识地往身侧看，看一回，空一回。原来一头畜生，能在人心上挖出这么大一个洞。'
  });

  // ════════════════════════════════════════════════════════════════════
  // 五、命缘转世认主（轮回链：cond legacy pet_zhuanshi → gainSoul）
  // ════════════════════════════════════════════════════════════════════
  // 引擎 die 命缘时已落 legacy 'pet_zhuanshi' + meta.carried.petSoul；
  // gainSoul 从 petSoul 重建（相识起手、续前世记忆、继承印记），并自清该 legacy 与 petSoul。
  G.define('event', {
    id: 'ev_mengyin_renzhu', title: '梦引而至',
    text: '近来你总做同一个梦：风雪里一双眼睛，远远地望着你，认得你，却隔着一道你跨不过去的什么。这天你路过一处，草丛里忽然钻出一只半大的幼兽，挡在你脚边，仰头盯着你——那双眼睛你认得。它绕着你转了三圈，把头一下埋进你掌心，不肯抬起来。你说不清为什么，只觉得眼眶毫无来由地热了。',
    tags: ['野外', '梦', '因果'],
    baseWeight: 12, once: true,
    cond: {
      all: [
        { legacy: 'pet_zhuanshi' },
        { pet: { has: false } }
      ]
    },
    prefer: { locTags: ['野外', '梦'] },
    choices: [
      {
        text: '蹲下来，把它揽进怀里',
        outcomes: [{ weight: 1, effects: [
          { pet: { op: 'gainSoul' } },
          { pet: { op: 'remember', t: '这一世，它又一次先认出了你' } },
          { tendAdd: { yinguo: 4 } },
          { log: { t: '你把它揽进怀里。它在你怀里安静下来，像回到了一个找了很久很久的地方。你们谁都没说话，可你知道——这次不会再走散了。', style: '因果' } }
        ] }]
      },
      {
        text: '心头一悸，绕开它走',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你强压下那股没来由的酸热，绕开它走了。走出很远，那道小小的身影还停在原地，望着你的背影一动不动。', style: '凶' } },
          { log: { t: '当夜那个梦又来了。这一回，那双眼睛里多了一点你看不懂的东西，像是被辜负了。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // 六、称号：通兽语（autoCond pet spirit≥灵兽，引擎月末+战后自动授予）
  // ════════════════════════════════════════════════════════════════════
  G.define('title', {
    id: 'tong_shou_yu',
    name: '通兽语',
    desc: '你身边那头兽通了灵，眼里有了人的神。一人一兽相对，不必出声，便都懂了。镇上人说，你能听懂畜生说话。',
    fame: 14,
    rumor: '镇上传开了：那个人养的兽通了人性，一个眼神，它就知道主人要做什么。',
    autoCond: { pet: { spirit: { gte: 2 } } }
  });

})();
