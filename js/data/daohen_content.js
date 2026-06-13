// js/data/daohen_content.js — 死亡余痕·世界 / 敌人·异兽（Owner: 余痕·世界 Agent）。
// 落地 spec §0.6 表的「世界/地点反应」+「敌人/异兽反应」两列。引擎已建空壳，本文件填充。
// 只用引擎暴露的余痕读 handle 当门，不改任何引擎/他人文件。
//
// ── 余痕门（引擎已实现的 cond，见 dsl.js §条件 DSL）──
//   {daohen:{id,gte}} 前世道痕（meta.carried.tendSeed[id]，命数偏向，本世内不变；「似曾相识」之根）。
//     十道 id：xuejian/danyao/leifa/lianti/yinguo/handu/shouhun/xianghuo/humei/yujian。
//   {echo:'titleId'} / {echo:true} 称号残响（前世曾得某称号 / 曾名动一方）。
//   {legacy:'X'} 已被改写的世界事实。配合 {realm}/{loc}/{wvar}/{pet:{has:false}}。
//
// ── 写作口径（spec §0.6）──
//   余痕反应分小/中/大痕迹：小=梦境/传闻/暗门/描述变化；中=NPC 试探/机缘提前/敌人绕路围猎；大=legacy 改世界开局。
//   文案零机制词、有修仙味、写「重新读懂世界 / 无端熟悉」；每 outcome ≥1 非 log 状态 op；多个同类键用数组。
//   余痕事件靠 cond:{daohen} 进环境池（非 queueOnly），让带对应道痕者更早、更自然撞见对应线。
//
// ── 十道各落了哪些世界/敌兽余痕反应（自报，闭环对照）──
//   血剑 xuejian ：世界=断剑崖血迹早醒(ev_daohen_xuejian_xueji)；敌兽=狼匪凶兽盯你又被你震住、独尾灰狼来投(ev_daohen_xuejian_zhenshou)。
//   丹药 danyao ：世界=药铺古方/药债早露头(ev_daohen_danyao_gufang)；敌兽=灵草毒兽异动被你察觉、墨斑蛇近身(ev_daohen_danyao_lingcao)。
//   雷法 leifa  ：世界=雷雨夜阴庙尸矿暗门(ev_daohen_leifa_anmen)；敌兽=阴邪畏你、衔雷雏试你来投(ev_daohen_leifa_leichu)。
//   炼体 lianti ：世界=演武场/兽径力活更深选(ev_daohen_lianti_shenxuan)；敌兽=猛兽武人认你站得住、九节鹿近(ev_daohen_lianti_shoumeng)。
//   因果 yinguo ：世界=前世死地/欠债/旧誓浮现(ev_daohen_yinguo_jiuzhai)；敌兽=前世杀过你的东西莫名认你、命缘兽来寻(ev_daohen_yinguo_mingyuan)。
//   寒冰 handu  ：世界=寒潭矿底冬雪早开缝(ev_daohen_handu_kaifeng)；敌兽=寒兽亲近暖血兽不适、寒鳞獭来投(ev_daohen_handu_hanlin)。
//   兽魂 shouhun：世界=后山兽径/兽王坟早回应(ev_daohen_shouhun_shoujing)；敌兽=温灵哀怜野凶戒备服从、独尾灰狼伏首(ev_daohen_shouhun_qinshu)。
//   香火 xianghuo：世界=庙/渡口/乱葬香火线早牵动(ev_daohen_xianghuo_xianghuoxian)；敌兽=护庙兽亲近染煞兽不安、引魂蝶近(ev_daohen_xianghuo_huting)。
//   狐魅 humei  ：世界=镜水梦戏服奇遇早显影(ev_daohen_humei_xianying)；敌兽=有心智者被惑也更易识破你假味、赤目狐崽近(ev_daohen_humei_huchong)。
//   御剑 yujian ：世界=剑冢/铁器/残页早共鸣(ev_daohen_yujian_gongming)；敌兽=剑灵食铁鹰隼试你近你、崖鹰来投(ev_daohen_yujian_yaying)。
//
// ── 引用的跨文件 id（全部真源，validate 不应报缺失）──
//   地点：duanjianya/yaopu/feikuang/shanshenmiao/wuguan/houshan_lin/hantan/heshen_du/luanzang_gang/yima_guan/jiazhong/heishan_shenchu/qingshizhen
//   世界变量：ghostQi/wolfThreat/mineInstability/sectAttention/marketPrice/villageFear
//   敌人(kills/bossAlive 引用)：yelang/yaolang/shanfei/shigui/ligui/jianzhong_canling/bali
//   beastlore 物种：dujiao_lang/mobai_she/xianlei_chu/tongren_lu/hanlin_ta/yinhun_die/chimu_hu/ya_ying
//   称号(echo)：xueye_shashen/quxie_ren/quanya_wuguan/lunhui_ke/pohan_ren/qunshou_zhi_zhu/xianghuo_huti/qianmian_ke/wanjian_juechen/fangyuan_diyi 等
//   legacy：langwang_slain/temple_cleansed/jianzhong_renzhu/hantan_ding/shouwang_fu/heshen_ping/hu_an_jing
//   死忆(因果命缘读)：mem_death_houshan_shouwang/mem_death_heishan_langwang
//   pflag(私有，本文件内读写，给其他余痕事件/NPC 软咬合留口)：_daohen_* 系列
//
// ── 自检十问（对文件整体）──
// 1标签：余痕母题——同一张地图，对带某道前世偏向者「重新读懂」。各事件 tags 扣其道与地点母题。
// 2易共现：daohen 门 + locTags/天时 prefer，让对的人在对的地点更早撞见；beast 变体引 habitat 相符地。
// 3排斥：全部 daohen 硬门，无前世该道偏向者完全看不见；pet 变体 {pet:{has:false}} 互斥已有兽。
// 4改状态：每 outcome ≥1 非 log op（pet/itemAdd/revealLoc/wvarAdd/locvarAdd/pflag/tendAdd/mem/counter/rumor）。
// 5后果：暗门 revealLoc 提前露地；机缘 itemAdd/pflag 留后续读取口；敌兽叙事改 wolfThreat/ghostQi/得兽。
// 6可解释：随机来自前世道痕(命数偏向)×地点×天时，非无原因——「命数里同一种偏向，被世界认了出来」。
// 7钩子：_daohen_* pflag + revealLoc + pet gain，给后续余痕/驭兽/NPC 咬合；不破坏既有 legacy 余波。
// 8有趣选择：每事件多给「探/取/避」分支，尊重克制者亦给状态。9服务体验：让轮回下一世「无端熟悉」可感。
// 10不暴露：零机制词，写见闻、体感、旁物反应；阶段名/倾向/权重一概不出现，道名亦不点破（用「似曾相识」写）。
//
// 自验：node --check js/data/daohen_content.js；node tools/harness.js（validate 0、autoplay 无错）。
(function () {
  'use strict';

  // ══════════════════════════════════════════════════════════════════════════
  // 血剑 xuejian —— 世界：断剑崖血迹/狼群事件早醒；敌兽：狼匪凶兽盯你又被你震住、独尾灰狼来投
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 断剑崖那道旧血迹，对带血剑余痕者更早「醒」过来——崖路提前显形。
  G.define('event', {
    id: 'ev_daohen_xuejian_xueji', title: '崖下旧血',
    text: '黑山深处的风里，忽然飘来一缕铁锈味，你的脚像认得路似的，自己拐进了一条没走过的岔道。'
      + '岔道尽头是一面刀削的绝壁，崖底乱石上插满锈剑，石缝里干涸的暗红一层叠一层，新的盖着旧的。'
      + '你说不清自己为什么会知道——那些血里，有一滩，像是你的。',
    tags: ['剑', '血', '险地', '隐秘'],
    baseWeight: 7, once: true,
    cond: { all: [{ loc: 'heishan_shenchu' }, { daohen: { id: 'xuejian', gte: 5 } }] },
    prefer: { tend: { xuejian: 0.6, yujian: 0.3 }, locTags: ['险地', '血'] },
    choices: [
      {
        text: '循着那股熟悉，下崖去看',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'duanjianya' },
          { pflagSet: { id: '_daohen_xueji_xun', v: true } },
          { counterAdd: { xuexing: 1 } },
          { log: { t: '你顺着记忆里才有的落脚点下了崖。脚一沾崖底，满谷断剑齐齐一颤，像在认人。', style: '异象' } }
        ] }]
      },
      {
        text: '退回岔口，那味道太熟了',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'duanjianya' },
          { pflagSet: { id: '_daohen_xueji_bi', v: true } },
          { log: { t: '你退了回去。可那条岔道已经记在你腿上了——往后再到这一带，脚总会先往那边偏。', style: '因果' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带血剑余痕，狼匪凶兽更易盯上你，可一照面又被你身上的气味震住；独尾灰狼可来投。
  G.define('event', {
    id: 'ev_daohen_xuejian_zhenshou', title: '兽避其锋',
    text: '林子里几道绿莹莹的眼睛缀了你一路——是狼，循着血腥味来的。可它们围到三丈外，却谁也不肯再近一步，'
      + '为首那头独尾灰狼喉咙里滚着低吼，尾巴却不自觉地夹了下去。它像在你身上闻见了什么旧东西，'
      + '一种它打娘胎里就该躲开的杀气。',
    tags: ['狼', '血', '野外', '险地'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }, { loc: 'houshan_lin' }] },
      { daohen: { id: 'xuejian', gte: 8 } }
    ] },
    prefer: { tend: { xuejian: 0.7 }, locTags: ['狼', '血'], wvar: [{ id: 'wolfThreat', gte: 50, boost: 1.6 }] },
    choices: [
      {
        text: '迎着那头独尾的眼睛走过去',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'dujiao_lang', track: '野凶', bond: '相识',
                     from: '你一步步逼近，那头独尾灰狼竟先软了脊背，伏低身子，喉咙里的吼变成了呜咽。它认得你这股气味，认得它该跟着谁。' } },
            { pet: { op: 'temper', add: '畏血' } },
            { pet: { op: 'remember', t: '它打照面起，就怕你身上那股旧杀气，怕到只敢跟着' } },
            { counterAdd: { shaqi: 1 } },
            { log: { t: '余下的狼一哄而散。独尾的那头却留下了，远远缀着你，像它命里早认下了这个主。', style: '异象' } }
          ] },
          { weight: 2, effects: [
            { wvarAdd: { wolfThreat: -6 } },
            { counterAdd: { shaqi: 1 } },
            { log: { t: '你一动，整圈狼眼齐齐后退。它们认输得毫无道理，连你自己都怔了一下。', style: '凶' } },
            { rumorAdd: { t: '听说山里的狼这阵子见着那人就绕道，邪门得很。', fame: 2 } }
          ] }
        ]
      },
      {
        text: '按住腰间，等它们自己散',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { wolfThreat: -3 } },
          { tendAdd: { xuejian: 2 } },
          { log: { t: '你只是站着没动，那股从骨头里渗出来的东西就够了。狼群退得无声无息。', style: '血' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 丹药 danyao —— 世界：药炉/古方/药债事件早露头；敌兽：药人毒兽灵草异动被你察觉、墨斑蛇近身
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带丹药余痕进药铺，手比眼快地认出柜底那张古方，药债线提前牵出。
  G.define('event', {
    id: 'ev_daohen_danyao_gufang', title: '柜底旧方',
    text: '回春堂柜台后头压着一叠发黄的旧方子，你本是来抓药的，目光却没来由地钉在最底下那一张上。'
      + '那方子半边被虫蛀了，剩下的字迹潦草难认——可你竟一眼就看出它哪一味写错了、哪一步该用文火。'
      + '掌柜的顺着你的眼神看过去，神色变了变，像是想起了一桩压了很多年的旧账。',
    tags: ['药', '市集', '隐秘'],
    baseWeight: 7, once: true,
    cond: { all: [{ loc: 'yaopu' }, { daohen: { id: 'danyao', gte: 5 } }] },
    prefer: { tend: { danyao: 0.7 }, locTags: ['药'] },
    choices: [
      {
        text: '指出那方子错在哪',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: '_daohen_gufang_zhi', v: true } },
          { itemAdd: { id: 'ningxuecao', n: 2 } },
          { npcFavAdd: { id: 'yaopu_laoban', n: 6 } },
          { log: { t: '掌柜的盯着你看了好一会儿，抓了两把凝血草塞给你，没收钱。「这方子……你不是头一个看出来的。」他没再往下说。', style: '丹' } }
        ] }]
      },
      {
        text: '只是看着，没作声',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: '_daohen_gufang_jian', v: true } },
          { tendAdd: { danyao: 2 } },
          { log: { t: '你把到了嘴边的话咽了回去。可那张方子的纹路，已经印进眼里了——往后再看见药炉，你都会想起它。', style: '因果' } }
        ] }]
      }
    ]
  });

  // [敌兽·小→中痕迹] 带丹药余痕，灵草毒兽的异动逃不过你；药香把性子温和的墨斑蛇引到身边。
  G.define('event', {
    id: 'ev_daohen_danyao_lingcao', title: '草动有异',
    text: '路边一丛不起眼的野草，旁人只当是杂草，你却一眼瞧出它叶背泛着的那点青——是认得的，'
      + '是好东西。草丛深处忽地一阵窸窣，一条墨斑的小蛇探出头来，吐着信子打量你，'
      + '却不躲不咬，反倒像闻见了你身上某种它熟悉的药气。',
    tags: ['药', '野外', '隐秘'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'heishan_waiwei' }, { loc: 'yaopu' }, { loc: 'houshan_lin' }] },
      { daohen: { id: 'danyao', gte: 6 } }
    ] },
    prefer: { tend: { danyao: 0.6 }, locTags: ['药'] },
    choices: [
      {
        text: '采了那株草，由蛇去',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'ningxuecao', n: 1 } },
          { pflagSet: { id: '_daohen_lingcao_cai', v: true } },
          { log: { t: '你认得它的火候，连根起得干干净净。那墨斑蛇看你采完，才悻悻缩了回去。', style: '丹' } }
        ] }]
      },
      {
        text: '伸手让那蛇闻一闻',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'mobai_she', track: '温灵', bond: '相识',
                     from: '你摊开手掌，那墨斑蛇沿着你腕子缠了上来，凉而不冷。它认得你指缝里那股陈年的药味，认得你是同它打过交道的人。' } },
            { pet: { op: 'temper', add: '辨药' } },
            { pet: { op: 'remember', t: '草丛里，它认出了你身上那股它熟悉的旧药气' } },
            { tendAdd: { danyao: 2 } },
            { log: { t: '它在你袖里盘成一圈，凉凉地睡了。打这往后，但凡近处有异草毒物，它便先替你抖一抖。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { danyao: 2 } },
            { counterAdd: { dandu: -1 } },
            { log: { t: '蛇信子在你掌心一探，认了你这股气味，便从容地游走了。你心里却莫名一松，像验过了什么旧交情。', style: '异象' } }
          ] }
        ]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 雷法 leifa —— 世界：雷雨/雷击木/阴庙/尸矿暗门更易出现；敌兽：阴邪畏你、衔雷雏来投
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带雷法余痕，雷雨夜里阴庙后殿/尸矿深处的暗门对你提前露缝。
  G.define('event', {
    id: 'ev_daohen_leifa_anmen', title: '雷夜露缝',
    text: '一道闪电劈下来，把破庙照得惨白。就在那一瞬，你看清了——后殿那扇从没人见开过的门，'
      + '门缝里渗出一线极淡的青光，随着雷声一明一灭，像在跟天上的雷应和。'
      + '雷声里你心头莫名一静，仿佛这满殿的阴气，本就该怕你三分。',
    tags: ['雷', '阴邪', '夜', '隐秘'],
    baseWeight: 8, once: true,
    cond: { all: [
      { any: [{ loc: 'shanshenmiao' }, { loc: 'feikuang' }] },
      { weather: '雷雨' },
      { daohen: { id: 'leifa', gte: 5 } }
    ] },
    prefer: { tend: { leifa: 0.8 }, locTags: ['阴邪', '雷'], wvar: [{ id: 'ghostQi', gte: 40, boost: 1.8 }] },
    choices: [
      {
        text: '趁雷声推那扇门',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'feikuang' },
          { pflagSet: { id: '_daohen_leimen_kai', v: true } },
          { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: -5 } },
          { log: { t: '雷声盖住了门轴的呻吟。门后黑沉沉的，可你一脚踏进去，那股阴气竟自己退开了一条道。', style: '雷' } }
        ] }]
      },
      {
        text: '记下这处，雷停再说',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: '_daohen_leimen_ji', v: true } },
          { tendAdd: { leifa: 2 } },
          { log: { t: '你没动，只把那线青光记在心里。往后每逢雷雨，你都觉得这破庙在等你回来。', style: '异象' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带雷法余痕，阴邪之物照面先畏你；雷雨里衔雷雏循着你身上的雷息来投。
  G.define('event', {
    id: 'ev_daohen_leifa_leichu', title: '雷羽来投',
    text: '雷雨夜的山道上，一团湿淋淋的小东西扑棱着栽在你脚边——是只羽毛间噼啪窜着细小火星的雏鸟，'
      + '翅尖还沾着没散的雷光。它本该怕生，却一头钻进你怀里取暖，'
      + '像是天底下只认得你这一处可去。远处几缕游荡的阴影，一见你便缩了回去。',
    tags: ['雷', '兽', '夜', '野外'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }, { loc: 'heishan_waiwei' }] },
      { weather: '雷雨' },
      { daohen: { id: 'leifa', gte: 8 } }
    ] },
    prefer: { tend: { leifa: 0.7 }, locTags: ['兽', '雷'] },
    choices: [
      {
        text: '把它揣进怀里避雷',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'xianlei_chu', track: '野凶', bond: '相识',
                     from: '你解开外衫把它裹住。它在你心口蹭着，翅尖的火星顺着你的气脉走，竟不灼人——它认得你身上那点雷息，认它是同类。' } },
            { pet: { op: 'temper', add: '亲雷' } },
            { pet: { op: 'remember', t: '雷雨夜，它认准了你身上那点雷息，扑进你怀里' } },
            { tendAdd: { leifa: 2 } },
            { log: { t: '怀里那团小东西渐渐暖了，火星也歇了。打这往后，每逢雷雨将至，它便先在你肩头不安地叫，替你报天。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { leifa: 2 } },
            { wvarAdd: { ghostQi: -4 } },
            { log: { t: '你护着它躲过这阵雷。它扑棱着飞走时，山道两旁那些游荡的阴影，早被你身上的雷息逼得退了个干净。', style: '雷' } }
          ] }
        ]
      },
      {
        text: '任它自去，只管赶路',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { ghostQi: -3 } },
          { counterAdd: { xinmo: 1 } },
          { log: { t: '你没理那雏鸟。可一路上的阴邪之物，竟没一个敢近你的身——它们认得你，怕你。', style: '异象' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 炼体 lianti —— 世界：演武场/兽径/矿洞力活出现更深选择；敌兽：猛兽认可、武人愿切磋、九节鹿近
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带炼体余痕，武馆的木桩、矿洞的力活，都对你露出更深的一层门道。
  G.define('event', {
    id: 'ev_daohen_lianti_shenxuan', title: '桩有深意',
    text: '武馆院里那排打熟了的木桩，今日你站到它跟前，竟看出了不一样的东西——'
      + '哪一记该卸力、哪一步该沉胯，身子比脑子先知道。你随手一记下去，木桩闷响，'
      + '震得满院弟子都回过头来。馆里一个老把式眯着眼打量你，像在掂量一块他见过的好料。',
    tags: ['体', '修炼', '交际'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'wuguan' }, { loc: 'feikuang' }, { loc: 'houshan_lin' }] },
      { daohen: { id: 'lianti', gte: 5 } }
    ] },
    prefer: { tend: { lianti: 0.7 }, locTags: ['体'] },
    choices: [
      {
        text: '顺着这股熟悉，沉下去练',
        outcomes: [{ weight: 1, effects: [
          { statAdd: { ti: 1 } },
          { pflagSet: { id: '_daohen_zhuang_shen', v: true } },
          { log: { t: '你一记一记往深里去，筋骨里像被人提前铺好了路。一通桩打完，气都不喘——这身子，认得这套苦。', style: '体' } }
        ] }]
      },
      {
        text: '只演了一手，留三分',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { lianti: 2 } },
          { npcFavAdd: { id: 'dashixiong', n: 3 } },
          { log: { t: '你点到为止，那老把式却已记住了你。「这后生站得住，」他低声同旁人说，「像练过几辈子的。」', style: '平' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带炼体余痕，猛兽认你「站得住」不轻易扑；性烈的九节鹿反倒愿近你。
  G.define('event', {
    id: 'ev_daohen_lianti_shoumeng', title: '兽认其势',
    text: '后山兽径上，一头熊罴拦在道中，本是要扑的。可它前掌抬到半空，鼻子一动，又缓缓落了回去——'
      + '它从你站定的架势里，闻出了一种不好惹的硬气。林子深处，一头本极怕人的九节鹿，'
      + '反倒踏着碎步走近了些，乌亮的眼睛打量着你，像在认一个旧相识。',
    tags: ['兽', '体', '野外', '险地'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }] },
      { daohen: { id: 'lianti', gte: 8 } }
    ] },
    prefer: { tend: { lianti: 0.6, shouhun: 0.3 }, locTags: ['兽', '体'] },
    choices: [
      {
        text: '稳住下盘，与那鹿对视',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'tongren_lu', track: '温灵', bond: '亲近',
                     from: '你纹丝不动，任那九节鹿一步步走到近前。它低头，用犄角轻轻抵了抵你的胸口——你站得稳，稳得像它认得的那座山。' } },
            { pet: { op: 'temper', add: '认硬' } },
            { pet: { op: 'remember', t: '兽径上，它认了你那股纹丝不动、站得住的硬气' } },
            { statAdd: { ti: 1 } },
            { log: { t: '那熊罴见鹿都近了你，更不敢动，悻悻让开了道。九节鹿则缀在你身后，慢慢跟成了影子。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { statAdd: { ti: 1 } },
            { wvarAdd: { wolfThreat: -3 } },
            { log: { t: '你立得稳如桩，熊罴掂量再三，到底退了。这一带的凶兽，往后见你都先掂量掂量。', style: '体' } }
          ] }
        ]
      },
      {
        text: '抱拳冲那熊罴一笑，借道',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { lianti: 2 } },
          { counterAdd: { shaqi: -1 } },
          { log: { t: '你抱拳一礼，那畜生竟也侧身让了。山里的硬气，原是认得硬气的。', style: '平' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 因果 yinguo —— 世界：前世死地/欠债/旧誓浮现；敌兽：前世杀过你的东西莫名认你、命缘兽来寻
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·大→中痕迹] 带因果余痕回到前世死地，旧账自己浮上来；若曾死于此地的 legacy 在，痕迹更重。
  G.define('event', {
    id: 'ev_daohen_yinguo_jiuzhai', title: '旧账浮起',
    text: '到了这处地方，你心口忽然一沉，像有一笔说不清的旧账压了上来。'
      + '你分明是头一回来，却对这里的一草一木熟得发慌——哪块石头底下埋着东西，哪条路尽头死过人，'
      + '你都莫名地知道。风从那个方向吹过来，带着一句你听不见、却懂得的旧话。',
    tags: ['因果', '隐秘', '梦'],
    baseWeight: 8, once: true,
    cond: { all: [
      { any: [{ loc: 'heishan_shenchu' }, { loc: 'luanzang_gang' }, { loc: 'shanshenmiao' }, { loc: 'houshan_lin' }] },
      { daohen: { id: 'yinguo', gte: 5 } }
    ] },
    prefer: { tend: { yinguo: 0.8 }, locTags: ['因果', '葬', '阴邪'] },
    choices: [
      {
        text: '循着那股熟悉，去把旧物挖出来',
        outcomes: [
          { weight: 2, cond: { any: [{ legacy: 'langwang_slain' }, { legacy: 'shouwang_fu' }] }, effects: [
            { itemAdd: { id: 'langpi', n: 1 } },
            { memAdd: 'mem_death_heishan_langwang' },
            { pflagSet: { id: '_daohen_jiuzhai_qi', v: true } },
            { log: { t: '你扒开浮土，底下埋着一截毛皮、半枚旧牙。指尖一碰，脑子里轰地炸开一片雪——你想起来了，这里曾是你的死地。', style: '因果' } }
          ] },
          { weight: 3, effects: [
            { itemAdd: { id: 'fuzhi', n: 1 } },
            { pflagSet: { id: '_daohen_jiuzhai_qi', v: true } },
            { tendAdd: { yinguo: 3 } },
            { log: { t: '你挖出一卷被泥沁透的旧符纸，字迹早糊了。可攥在手里那一刻，你确信这是有人欠你的，或是你欠人的。', style: '异象' } }
          ] }
        ]
      },
      {
        text: '认下这股牵绊，磕个头就走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yinguo: 3 } },
          { counterAdd: { xinmo: -2 } },
          { pflagSet: { id: '_daohen_jiuzhai_bai', v: true } },
          { log: { t: '你冲那个方向磕了个头，说不清拜的是谁。可磕完，胸口那笔旧账竟轻了些——有些债，认了，就算还了一半。', style: '因果' } }
        ] }]
      }
    ]
  });

  // [敌兽·大痕迹] 带因果余痕，前世杀过你的那类东西莫名认你；命缘兽循着旧牵绊来寻（接驭兽轮回链）。
  G.define('event', {
    id: 'ev_daohen_yinguo_mingyuan', title: '旧物认人',
    text: '一头本该扑你的凶兽，到了你面前却忽然顿住，喉咙里的吼变成了一种近乎困惑的呜咽。'
      + '它绕着你转了两圈，鼻子贴着你的衣角，越闻越迟疑——它身上有一种说不清的东西在认你，'
      + '像是它的祖辈、或是它自己，曾在某一世里同你两清过一笔血账。',
    tags: ['因果', '兽', '野外'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }] },
      { daohen: { id: 'yinguo', gte: 8 } }
    ] },
    prefer: { tend: { yinguo: 0.7, shouhun: 0.3 }, locTags: ['兽', '因果'] },
    choices: [
      {
        text: '伸手，让它把这笔旧账认完',
        outcomes: [
          { weight: 3, cond: { all: [{ pet: { has: false } }, { legacy: 'pet_zhuanshi' }] }, effects: [
            { pet: { op: 'gainSoul' } },
            { pflagSet: { id: '_daohen_mingyuan_ren', v: true } },
            { log: { t: '它把脸埋进你掌心，浑身一颤——认出来了。那是你上一世以命相托、又先你而去的那一只，循着这点不肯断的牵绊，转世来寻你了。', style: '因果' } }
          ] },
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'chimu_hu', track: '野凶', bond: '相识',
                     from: '那畜生终于不再犹豫，蹭着你的手背蜷了下来。它认下了那笔说不清是谁欠谁的旧账，从此跟定了你。' } },
            { pet: { op: 'remember', t: '它身上有种东西认你，像前世同你两清过一笔账' } },
            { tendAdd: { yinguo: 2 } },
            { log: { t: '它伏在你脚边不肯走。你也说不清这是哪辈子结下的缘，只觉得欠它的、或它欠你的，今生该续上了。', style: '异象' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { yinguo: 2 } },
            { wvarAdd: { wolfThreat: -3 } },
            { log: { t: '它绕你三匝，到底没下口，反低头让你摸了摸，才转身没入林子。这一带的凶物，往后都莫名地避你三分。', style: '因果' } }
          ] }
        ]
      },
      {
        text: '不动声色，看它自去',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xinmo: 1 } },
          { tendAdd: { yinguo: 2 } },
          { log: { t: '你没伸手。它在你面前蹲了许久，终于像了却了什么似的，转身走了。你心里却空了一块——那笔账，到底没认。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 寒冰 handu —— 世界：寒潭/矿底/冬雪事件更早开缝；敌兽：寒兽亲近、暖血兽不适、寒鳞獭来投
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带寒冰余痕，矿底的寒裂、冬雪里的冰缝，对你提前开口——寒潭之路早露。
  G.define('event', {
    id: 'ev_daohen_handu_kaifeng', title: '冰下早缝',
    text: '矿洞最深处那道冰封的裂口，旁人近前只觉刺骨难当，你却觉得那寒气熨帖得很，像回到了某处旧地。'
      + '你呵一口气，霜花落在冰面上，竟顺着一道极细的缝裂开去——冰下幽蓝的光一明一灭，'
      + '像有什么在水底，认得你这股偏寒的血。',
    tags: ['寒', '水', '矿', '隐秘'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'feikuang' }, { all: [{ season: '冬' }, { loc: 'hantan' }] }] },
      { daohen: { id: 'handu', gte: 5 } }
    ] },
    prefer: { tend: { handu: 0.7 }, locTags: ['寒', '水'] },
    choices: [
      {
        text: '顺着那道缝，往寒处去',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'hantan' },
          { pflagSet: { id: '_daohen_bingfeng_xun', v: true } },
          { log: { t: '你贴着冰缝侧身挤过去，寒气钻进骨头缝里，你却越走越稳。冰的那头，幽蓝的潭水在等你。', style: '异象' } }
        ] }]
      },
      {
        text: '伸手贴一贴那片冰',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'hantan' },
          { tendAdd: { handu: 2 } },
          { healInjury: { months: 1 } },
          { log: { t: '掌心贴上寒冰，那股凉顺着血脉漫上来，竟把你身上的隐痛也镇住了几分。这寒，认得你。', style: '吉' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带寒冰余痕，寒鳞獭一类寒兽亲近你，暖血的凶兽却觉你气血偏冷而不适、退避。
  G.define('event', {
    id: 'ev_daohen_handu_hanlin', title: '寒物相亲',
    text: '潭沿的薄冰上趴着一只湿漉漉的寒鳞獭，鳞片泛着冷青的光。它本是极机警的东西，'
      + '见了你却不躲，反倒挪近了些，把冰凉的身子贴上你的脚踝——它觉出你血里那股偏寒的气，'
      + '认你是同类。倒是不远处一头来饮水的暖血野物，闻见你，浑身一抖，掉头就走。',
    tags: ['寒', '水', '兽', '险地'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'hantan' }, { loc: 'feikuang' }] },
      { daohen: { id: 'handu', gte: 8 } }
    ] },
    prefer: { tend: { handu: 0.7 }, locTags: ['寒', '水'] },
    choices: [
      {
        text: '由它贴着，伸手摸一摸',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'hanlin_ta', track: '野凶', bond: '相识',
                     from: '你摸了摸它冰凉的脊背，它眯起眼，顺势爬上你的臂弯。它认得你血里那股寒，认你不是猎人，是同类。' } },
            { pet: { op: 'temper', add: '喜寒' } },
            { pet: { op: 'remember', t: '潭边，它觉出你血里偏寒的气，认你是同类' } },
            { tendAdd: { handu: 2 } },
            { log: { t: '它盘在你颈间，凉丝丝的，倒比什么时候都安稳。打这往后，但凡近处水底有动静，它先替你竖起鳞。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { handu: 2 } },
            { log: { t: '寒鳞獭蹭够了你，才滑回水里。那头暖血野物却始终不敢回头——你身上的寒，叫它本能地犯怵。', style: '异象' } }
          ] }
        ]
      },
      {
        text: '不去惊它，沿潭边走',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { handu: 2 } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你绕开那獭，慢慢沿潭走。一路的寒物都不避你，暖血的却都远着——这寒潭，把你当自家人了。', style: '平' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 兽魂 shouhun —— 世界：后山兽径/兽王坟/异兽志更早回应；敌兽：温灵哀怜、野凶戒备或服从
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带兽魂余痕，后山兽径的踪迹、兽王坟的旧气，对你提前回应——兽径早露。
  G.define('event', {
    id: 'ev_daohen_shouhun_shoujing', title: '兽径回声',
    text: '黑山深处，你忽然在一片乱叶里辨出一行别人看不出的足印——它通向一条隐没的兽走的路。'
      + '路的尽头隐隐有股极古老的兽气，沉郁、苍凉，像一座坟。你心里莫名一动，'
      + '仿佛你身后也曾跟着这样一头通灵的巨物，一同走过这条路。',
    tags: ['兽', '野外', '隐秘', '险地'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'heishan_shenchu' }, { loc: 'heishan_waiwei' }] },
      { daohen: { id: 'shouhun', gte: 5 } }
    ] },
    prefer: { tend: { shouhun: 0.7 }, locTags: ['兽', '狼'] },
    choices: [
      {
        text: '循着那行足印走下去',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'houshan_lin' },
          { pflagSet: { id: '_daohen_shoujing_xun', v: true } },
          { log: { t: '你顺着只有你看得见的踪迹往里走，越走兽气越沉。一座荒草没顶的兽王坟，在路尽头静静等着你。', style: '异象' } }
        ] }]
      },
      {
        text: '冲那股古兽气拜一拜',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'houshan_lin' },
          { tendAdd: { shouhun: 2 } },
          { log: { t: '你不由自主朝那个方向拜了下去。风过处，万木齐响，像有一头看不见的巨物，认下了你这一礼。', style: '因果' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带兽魂余痕，温灵之兽哀怜近你，野凶之兽戒备却不敢轻动、甚至服从。
  G.define('event', {
    id: 'ev_daohen_shouhun_qinshu', title: '兽影伏首',
    text: '林子里的活物，今日待你都透着古怪。一群温顺的小兽远远围着你，眼神里竟有种近乎哀怜的东西；'
      + '而那头一向横行的独尾灰狼，明明龇着牙，前腿却忍不住一点点矮了下去——'
      + '它们都看见了你身后那道别人看不见的兽影，本能地认你这股气里有它们的主。',
    tags: ['兽', '狼', '野外'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'houshan_lin' }, { loc: 'heishan_shenchu' }, { loc: 'heishan_waiwei' }] },
      { daohen: { id: 'shouhun', gte: 8 } }
    ] },
    prefer: { tend: { shouhun: 0.7 }, locTags: ['兽', '狼'] },
    choices: [
      {
        text: '向那头矮下身的灰狼伸出手',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'dujiao_lang', track: '野凶', bond: '亲近',
                     from: '那独尾灰狼挣扎了一下，到底还是把脑袋抵进了你掌心，喉咙里发出认主的低鸣。它看见了你身后的兽影，认了你是该跟的人。' } },
            { pet: { op: 'temper', add: '伏主' } },
            { pet: { op: 'remember', t: '它看见你身后那道兽影，本能地认你为主' } },
            { wvarAdd: { wolfThreat: -5 } },
            { log: { t: '灰狼伏在你脚边，余下的兽也都散了戒心。你身后那道虚影，第一次像是有了回应。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { wvarAdd: { wolfThreat: -5 } },
            { tendAdd: { shouhun: 2 } },
            { log: { t: '灰狼到底没敢咬你，反倒夹着尾退开了。这一带的野物，自此都隐隐认你这股气里的东西。', style: '异象' } }
          ] }
        ]
      },
      {
        text: '向那群哀怜的小兽颔首',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { shouhun: 2 } },
          { counterAdd: { shaqi: -1 } },
          { log: { t: '你冲那群小兽点了点头，它们才肯散去。它们眼里那点哀怜，你看懂了——它们认得你，认得你身后跟着的，是什么。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 香火 xianghuo —— 世界：庙/渡口/乱葬岗的香火线更早牵动；敌兽：护庙兽亲近、染煞兽不安
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带香火余痕，庙里的香炉、渡口的祭火、乱葬岗的孤魂，都对你提前牵起一条线。
  G.define('event', {
    id: 'ev_daohen_xianghuo_xianghuoxian', title: '香火牵线',
    text: '你刚踏进门，那只年年蒙尘的香炉里，没人点的香灰竟自己腾起一缕极淡的青烟，'
      + '袅袅地朝你这边偏过来。四下里仿佛有许多看不见的人，把没处去的愿望、没人还的香火，'
      + '一齐轻轻搭上了你的肩——它们认得你，认得你是肯替人了愿的那种人。',
    tags: ['香火', '阴邪', '隐秘'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'shanshenmiao' }, { loc: 'heshen_du' }, { loc: 'luanzang_gang' }] },
      { daohen: { id: 'xianghuo', gte: 5 } }
    ] },
    prefer: { tend: { xianghuo: 0.7 }, locTags: ['香火', '渡', '葬'], wvar: [{ id: 'ghostQi', gte: 40, boost: 1.5 }] },
    choices: [
      {
        text: '应下这缕香火，替它们了个愿',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: '_daohen_xianghuo_ying', v: true } },
          { wvarAdd: { ghostQi: -6 } },
          { counterAdd: { xinmo: -2 } },
          { log: { t: '你冲那缕青烟拜了拜，应下了这桩没头没尾的托付。满殿的呜咽，竟一时静了下来——它们等的，就是个肯应声的人。', style: '因果' } }
        ] }]
      },
      {
        text: '受了这点暖意，记下这处',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xianghuo: 2 } },
          { healInjury: { months: 1 } },
          { log: { t: '那缕香火搭上肩头，竟有股说不出的暖。你身上的伤痛，被这点愿力悄悄护了几分。这地方，记你了。', style: '吉' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带香火余痕，护庙、引魂一类的灵物亲近你；沾了煞气的凶物则在你跟前不安。
  G.define('event', {
    id: 'ev_daohen_xianghuo_huting', title: '魂蝶绕香',
    text: '荒坡上忽然飞来一群幽蓝的蝶，绕着你打转，翅膀上的光像一盏盏微弱的引路灯——'
      + '是引魂蝶，专替无主的魂找香火的去处。它们认得你身上那点替人还愿的暖意，'
      + '一只只落在你肩头。倒是坡下那几团染了煞的阴影，被你这点香火气逼得躁动不安，远远缩着。',
    tags: ['香火', '兽', '葬', '夜'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'luanzang_gang' }, { loc: 'heshen_du' }, { loc: 'yizhuang' }, { loc: 'shanshenmiao' }] },
      { daohen: { id: 'xianghuo', gte: 8 } }
    ] },
    prefer: { tend: { xianghuo: 0.7 }, locTags: ['香火', '葬', '渡'] },
    choices: [
      {
        text: '让那群蝶落在掌心',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'yinhun_die', track: '温灵', bond: '相识',
                     from: '蝶群里最大的一只落进你掌心，振了振翅。它认得你身上那点替人了愿的香火气，从此愿引着你，也愿你引着它。' } },
            { pet: { op: 'temper', add: '引魂' } },
            { pet: { op: 'remember', t: '荒坡上，它认了你身上替人还愿的那点暖意' } },
            { wvarAdd: { ghostQi: -5 } },
            { log: { t: '蝶在你掌心歇下，幽蓝的光一明一灭。打这往后，但凡近处有迷途的、染煞的东西，它便先振翅替你引路、报警。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { wvarAdd: { ghostQi: -5 } },
            { tendAdd: { xianghuo: 2 } },
            { log: { t: '蝶群绕你一圈，引着几缕散魂往该去的地方去了。坡下那些染煞的阴影，被你这点香火气逼得退了个干净。', style: '因果' } }
          ] }
        ]
      },
      {
        text: '合掌为那些散魂念一句',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { xianghuo: 2 } },
          { wvarAdd: { ghostQi: -3 } },
          { log: { t: '你合掌低念，不知念的是什么，那群蝶却像听懂了，齐齐朝坟头飞去。荒坡上的怨气，淡了一些。', style: '因果' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 狐魅 humei —— 世界：镜/水/梦/戏服类奇遇更常显影；敌兽：有心智者被惑、也更易识破你的假味
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带狐魅余痕，镜面、水影、旧戏服里的虚影，对你提前显形——狐婆坳之路早露。
  G.define('event', {
    id: 'ev_daohen_humei_xianying', title: '影中有影',
    text: '夜里背阴的山坳，你路过一汪静水，俯身一看，水里那个倒影竟比你慢了半拍——'
      + '它先你一步抬起头，对你笑了笑。脂粉香从水面浮起来，甜得发腻。'
      + '你认得这味道，认得这一套以假乱真的把戏，仿佛你自己也曾是设局的那一个。',
    tags: ['狐', '幻', '水', '夜'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'heishan_waiwei' }, { loc: 'heshen_du' }, { loc: 'hupo_ao' }] },
      { daohen: { id: 'humei', gte: 5 } }
    ] },
    prefer: { tend: { humei: 0.7 }, locTags: ['狐', '幻', '水'] },
    choices: [
      {
        text: '对着水里的影子，先笑一个',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'hupo_ao' },
          { pflagSet: { id: '_daohen_yingzhong_xiao', v: true } },
          { log: { t: '你对那影子笑了笑，它愣了一下，竟先慌了神——这一套，你比它熟。脂粉香散去时，一条进坳的路在你眼前清晰起来。', style: '异象' } }
        ] }]
      },
      {
        text: '识破这点假味，转身就走',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'hupo_ao' },
          { tendAdd: { humei: 2 } },
          { counterAdd: { xinmo: -1 } },
          { log: { t: '你一眼看穿那香里的破绽，头也不回地走了。背后水声哗啦一响，像是被你噎了一下——它没想到，会撞上个比它更懂行的。', style: '因果' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带狐魅余痕，有心智的妖物在你面前先乱了心神；可它们也更易嗅出你那点装出来的假味。
  G.define('event', {
    id: 'ev_daohen_humei_huchong', title: '以假惑真',
    text: '坳里钻出一只赤目的小狐崽，本是来探人虚实的。它绕着你转，眼睛越来越迷离——'
      + '你身上那股惑人的气，连它这同道中的也吃了一记，脚步发软。可它毕竟是狐，'
      + '转眼又鼻子一抽，嗅出你那点装出来的味儿，警觉地后退半步，既被你惑，又看破你。',
    tags: ['狐', '幻', '夜', '阴邪'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'hupo_ao' }, { loc: 'houshan_lin' }] },
      { daohen: { id: 'humei', gte: 8 } }
    ] },
    prefer: { tend: { humei: 0.7 }, locTags: ['狐', '幻'] },
    choices: [
      {
        text: '收了那点假味，露个真心给它',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'chimu_hu', track: '野凶', bond: '相识',
                     from: '你敛去周身那层惑人的气，蹲下来由它打量。它嗅出你卸了伪装后的真心，警觉这才化开，怯怯地蹭上你的指尖。' } },
            { pet: { op: 'temper', add: '识假' } },
            { pet: { op: 'remember', t: '坳里，它既被你的气所惑，又嗅破了你那点装出来的假味' } },
            { tendAdd: { humei: 2 } },
            { log: { t: '赤目狐崽认了你，黏在你脚边不肯走。同道之间，假味哄不住，倒是这一点真，留住了它。', style: '吉' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { humei: 2 } },
            { counterAdd: { xinmo: -1 } },
            { log: { t: '你收了那层伪装，狐崽这才放下戒心，绕你两圈，叼来一截红绳搁在你脚边，转身钻回坳里去了。', style: '异象' } }
          ] }
        ]
      },
      {
        text: '索性把那点惑人的气放足',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { humei: 3 } },
          { counterAdd: { xinmo: 2 } },
          { log: { t: '你把那股气放了出去，狐崽眼神一散，乖乖伏在地上由你摆布。可你心里也跟着泛起一阵说不清的躁——这把戏，伤的不只是它。', style: '凶' } }
        ] }]
      }
    ]
  });

  // ══════════════════════════════════════════════════════════════════════════
  // 御剑 yujian —— 世界：断剑崖/剑冢/铁器/残页更早共鸣；敌兽：剑灵试你、食铁/鹰隼类异兽亲近
  // ══════════════════════════════════════════════════════════════════════════

  // [世界·中痕迹] 带御剑余痕，断剑崖的残刃、铁匠铺的铁器、旧剑谱残页，都对你提前嗡鸣共鸣。
  G.define('event', {
    id: 'ev_daohen_yujian_gongming', title: '铁器自鸣',
    text: '你打铁匠摊前过，架上那堆寻常铁器忽然齐齐一颤，发出极细的嗡鸣，'
      + '只有你一个人听得见。声音里有一种召唤，把你的脚往黑山那道插满断剑的崖底引。'
      + '你说不清缘由，只觉得那满谷的锈剑里，有一口在等你，等了很久。',
    tags: ['剑', '隐秘', '灵脉'],
    baseWeight: 7, once: true,
    cond: { all: [
      { any: [{ loc: 'qingshizhen' }, { loc: 'yima_guan' }, { loc: 'heishan_shenchu' }] },
      { daohen: { id: 'yujian', gte: 5 } }
    ] },
    prefer: { tend: { yujian: 0.7, xuejian: 0.3 }, locTags: ['剑', '市集'] },
    choices: [
      {
        text: '循着那声嗡鸣，去寻断剑崖',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'duanjianya' },
          { pflagSet: { id: '_daohen_gongming_xun', v: true } },
          { log: { t: '你顺着只有你听得见的鸣声往黑山去。越近崖底，那声音越亮——满谷断剑齐齐一颤，像在迎一个归人。', style: '异象' } }
        ] }]
      },
      {
        text: '从架上挑一柄最应你的',
        outcomes: [{ weight: 1, effects: [
          { revealLoc: 'duanjianya' },
          { itemAdd: { id: 'tiejian', n: 1 } },
          { tendAdd: { yujian: 2 } },
          { log: { t: '你的手不受使唤地按上其中一柄，它在你掌心里轻轻一震，像认了主。掌柜的看你的眼神都变了。', style: '异象' } }
        ] }]
      }
    ]
  });

  // [敌兽·中痕迹] 带御剑余痕，剑冢里的剑灵/残灵会试你手里有没有剑；食铁的鹰隼一类异兽则亲近你。
  G.define('event', {
    id: 'ev_daohen_yujian_yaying', title: '鹰隼认主',
    text: '崖顶盘旋着一只崖鹰，本是凶悍难近的，今日却一圈圈低下来，翅尖几乎擦着你的肩。'
      + '它认得你身上那股锋锐的剑气，认你是握过剑、御过剑的人。崖底乱石间，'
      + '一缕剑灵似的微光浮起来，无声地缠上你的手腕，像在试探——你这一世，手里还有没有剑。',
    tags: ['剑', '兽', '险地', '灵脉'],
    baseWeight: 6, once: true,
    cond: { all: [
      { any: [{ loc: 'duanjianya' }, { loc: 'yima_guan' }, { loc: 'heishan_shenchu' }] },
      { daohen: { id: 'yujian', gte: 8 } }
    ] },
    prefer: { tend: { yujian: 0.7 }, locTags: ['剑', '兽'] },
    choices: [
      {
        text: '抬臂，让那崖鹰落下来',
        outcomes: [
          { weight: 3, cond: { pet: { has: false } }, effects: [
            { pet: { op: 'gain', species: 'ya_ying', track: '野凶', bond: '相识',
                     from: '你稳稳抬起手臂，那崖鹰收翅落下，利爪扣住你的腕，却不伤分毫。它认得你身上的剑气，认你是它该认的主。' } },
            { pet: { op: 'temper', add: '亲锋' } },
            { pet: { op: 'remember', t: '崖顶，它认了你身上那股握过剑、御过剑的锋锐' } },
            { tendAdd: { yujian: 2 } },
            { log: { t: '崖鹰栖在你臂上，目光锐利如它认得的那柄剑。打这往后，高处一有风吹草动，它先替你掠空查看。', style: '吉' } }
          ] },
          { weight: 2, cond: { bossAlive: 'jianzhong_jianling' }, effects: [
            { revealLoc: 'duanjianya' },
            { tendAdd: { yujian: 2 } },
            { log: { t: '那缕剑灵的微光在你腕上盘旋良久，似认非认，终又退回崖底。它在等你这一世重新握起剑，再来寻它一试。', style: '异象' } }
          ] },
          { weight: 2, effects: [
            { tendAdd: { yujian: 2 } },
            { log: { t: '崖鹰绕你三匝，到底没落下，长鸣一声掠空而去。可它认得你了——往后这崖上的飞禽，都不再视你为生人。', style: '异象' } }
          ] }
        ]
      },
      {
        text: '伸指，接住那缕剑灵的试探',
        outcomes: [{ weight: 1, effects: [
          { tendAdd: { yujian: 3 } },
          { pflagSet: { id: '_daohen_jianling_shi', v: true } },
          { log: { t: '你伸出一指，任那缕微光缠上来。它在你指尖一寸寸游走，像在丈量你这一世的剑骨——量罢，竟轻轻一颤，认下了。', style: '异象' } }
        ] }]
      }
    ]
  });

})();
