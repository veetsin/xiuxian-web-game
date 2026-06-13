// js/data/memories.js — 记忆数据（Owner: C1）。v2 扩展：28 → 56 条（+28）。
//   死亡模板：v1 ×14 + v2 ×12（6 新 Boss + 6 新普通敌）。Boss 情报：v1 ×4 + v2 ×6。
//   机缘钥匙：v1 ×5 + v2 ×6（五新道各 ≥1）。杂忆：v1 ×4 + v2 杂忆若干。
//
// memory schema 见契约 §11（v1.1 deathCause / v1.2 defeatCause）：
//   deathCause: "enemyId" | [..] | "shouyuan" | 死因串 | "*" —— 死亡时引擎按死因匹配第一个未持有的模板自动授予（"*" 兜底）。
//   defeatCause: "enemyId" —— 非致死（nonLethal）强敌战败时授予的败绩之忆。
//   kind ∈ death | intel | chance | misc（UI「前世」tab 分组用；defeat 类亦走 death 分组）。
//   carry:true 才随轮回蒸馏携带；dream 为来世开局自动播放的梦境日志（谶语，单行）。
//
// ── 本文件对外输出（他人会引用的 id）──
//   死亡模板（引擎自动授予，内容侧无需 memAdd）：
//     v1 普通敌：mem_death_yelang / yaolang / shanfei / shigui / yaoren / wuguan_dizi(defeat)
//     v1 Boss：mem_death_heishan_langwang / kuangdong_shiwang / dashixiong_boss(defeat) / shanmiao_xieying
//     v1 非战死：mem_death_shouyuan / mem_death_dandu / mem_death_tupo_shibai / mem_death_generic(兜底)
//     v2 新 Boss ×6：mem_death_laohu_xian / mem_death_jianzhong_jianling / mem_death_hantan_jiao /
//       mem_death_houshan_shouwang / mem_death_luanzang_li_zu / mem_death_heshen
//     v2 新普通敌 ×6：mem_death_humei_yao / mem_death_ligui / mem_death_shuigui /
//       mem_death_hanjiao_you / mem_death_bali / mem_death_jianzhong_canling
//   Boss 情报（C4 enemy.intelMem 钉死引用；C5 对话/C3 事件发放）：
//     v1：mem_intel_langwang / mem_intel_shiwang / mem_intel_dashixiong / mem_intel_xieying
//     v2 ×6（蓝图 §6 钉死）：mem_intel_laohu / mem_intel_jianling / mem_intel_hanjiao /
//       mem_intel_shouwang / mem_intel_lizu / mem_intel_heshen
//   机缘钥匙（C3 奇遇/事件发放；C2/C3 可用 cond {mem:"..."} 开「循前世记忆」行动/选项）：
//     v1：mem_duanjianya / mem_kuangdong_languang / mem_miaodi_diyu / mem_yaofang_gufang / mem_leichi_canwen
//     v2 ×6（五新道各 ≥1，蓝图 §6）：mem_hantan_languang(寒/handu) / mem_jianzhong_jianming(剑/yujian) /
//       mem_huao_mimeng(狐/humei) / mem_luanzang_diyu(葬/yinguo·xianghuo) / mem_hedi_chenzhong(渡/xianghuo) /
//       mem_houshan_shoujing(兽/shouhun)
//   杂忆（C3/C5 自由 memAdd）：v1 mem_zaobian_geyao / mem_qiangshang_quanpu / mem_huanbuqing_yaoqian / mem_diyi_dao
//     v2：mem_dujin_dengxin(渡口灯) / mem_xifu_jiulian(戏服旧脸) / mem_jianlu_huihuo(剑庐回火) / mem_xunying_yuxie(断翅的鹰)
//
// ── 死因字符串登记（deathCause 匹配用）──
//   引擎自产：敌人 id（战死）/ 'shouyuan'（寿尽坐化）/ '丹毒反噬'（突破时丹毒炸开，time.js）/
//             '伤重不治'（无因 hp 归零）/ '横死'（die op 缺省）——后两者落 '*' 兜底。
//   v2 新死因（ids.js 已登记 deathCauses）：'寒毒入心'（寒蛟/寒潭/寒毒结算致死，生产者预期=C4 寒蛟战 die、
//             C3 寒雾/寒毒结算 die op）/ '魇毙'（梦魇/厉鬼/乱葬梦债致死，生产者=C3 梦债结算或 C4 厉鬼战 die）/
//             '溺亡'（水鬼拖拽/河神水势/河祸致死，生产者=C4 水鬼/河神战 die、C3 河祸事件 die op）。
//   内容侧约定：冲关致死事件请用 {die:{cause:'tupo_shibai'}}，以命中 mem_death_tupo_shibai。
//   本文件把这三个新死因挂在最贴题的普通敌死亡模板上（数组 deathCause）：
//     寒毒入心→mem_death_hanjiao_you｜溺亡→mem_death_shuigui｜魇毙→mem_death_ligui。
//     如此每个新死因都有一条死亡记忆作落点（无孤儿死因）。
//
// TODO-INTEGRATION: validate.js 现已认 G.IDS.deathCauses 白名单（含 v2 三新死因）+ 已注册敌人；
//   但 v2 六新 Boss / 六新普通敌的 enemy id 由 C4 并行注册，其落地前 validate 会对本文件 12 条
//   mem_death_<v2敌/boss> 的 deathCause 报「引用未知敌人」——属并行预期（id 均在蓝图/ids.js 钉死表）。
// TODO-INTEGRATION: v2 六情报记忆 mem_intel_<x> 由 C4 enemy.intelMem 引用、C5 对话/C3 事件发放；
//   六机缘记忆 mem_<主题> 由 C3 奇遇发放；三杂忆 v2 由 C3/C5 memAdd——其发放点落地前为本文件已就位、待咬合。
//
// ── 自检十问（对文件整体回答一次）──
// 1标签：死亡/情报/机缘/执念，全是因果与轮回的沉淀物。2易共现：走马灯、来世开局梦境、布置改命行动。
// 3排斥：无强排斥（记忆是纯沉淀）；同因死亡模板每人只授一次，重复死因落兜底。
// 4改状态：入 player.memories；carry 者跨世；cond {mem:"..."} 可解锁行动/选项；intelMem 给战前提示与增伤。
// 5后果：死一次=买一条情报；机缘钥匙是「前世知道、今生改命」的开门砖（五新道各有一把指路）。
// 6可解释：死前最后一眼成为来世的梦；情报皆有来历（狐仙照水迷人、剑灵认主、寒蛟畏雷、兽王惧威、厉祖怕香、河神索祭）。
// 7钩子：寒潭蓝光/剑冢剑鸣/狐坳迷梦/乱葬低语/河底沉钟/后山兽径，各对一处 v2 新地与一条新道，C2/C3 直接咬合。
// 8有趣选择：知道寒蛟怕雷、河神要香火之后，这一世是带着情报提前去结这桩仇，还是先攒构筑绕开险地。
// 9服务 build：机缘钥匙分喂寒冰/御剑/狐魅/因果香火/兽魂；死亡梦境引导避坑与复仇（因果以记忆为食）。
// 10不暴露：text/dream 全是画面与谶语，无道名、无数值、无机制词；指路只指方位与天时，不写攻略。
(function () {
  'use strict';

  // ════════════════ 一、死亡记忆模板（kind:death，引擎按死因自动授予）════════════════

  // —— 普通敌 ×6 ——
  G.define('memory', {
    id: 'mem_death_yelang',
    title: '荒草里的绿光',
    kind: 'death',
    deathCause: 'yelang',
    carry: true,
    text: '你前世死在野狼的环伺里。倒下时草叶贴着脸，几点绿光从四面围拢过来，越来越近，越来越低。',
    dream: '你梦见深草里围拢的绿光。梦里有人说：荒径莫独行。'
  });

  G.define('memory', {
    id: 'mem_death_yaolang',
    title: '青瞳',
    kind: 'death',
    deathCause: 'yaolang',
    carry: true,
    text: '那头狼大得不像狼，青色的瞳孔里有近乎人的东西。它没有立刻咬下来——它先看着你，像在确认什么。',
    dream: '你梦见一对青瞳隔着林子望你。它认得疼，更记得仇。'
  });

  G.define('memory', {
    id: 'mem_death_shanfei',
    title: '道旁的刀',
    kind: 'death',
    deathCause: 'shanfei',
    carry: true,
    text: '你前世死在一把卷了刃的劫刀下。那山匪的手在抖，刀却不慢。他翻你钱袋的声音，是你听见的最后一个声音。',
    dream: '你梦见窄道滚石后蹲着的影子。袖中有声音：财不露白。'
  });

  G.define('memory', {
    id: 'mem_death_shigui',
    title: '岩壁上的爪声',
    kind: 'death',
    deathCause: 'shigui',
    carry: true,
    text: '矿道黑得化不开。你先听见指甲刮岩壁的声音，再看见那具佝偻的影子。它不喘气——而你的火把，先灭了。',
    dream: '你梦见黑暗里指甲刮石之声。梦里只剩一个念头：带火。'
  });

  G.define('memory', {
    id: 'mem_death_yaoren',
    title: '腥甜的药香',
    kind: 'death',
    deathCause: 'yaoren',
    carry: true,
    text: '那东西扑过来时，你闻到了浓得发腥的药香。你砍开它的皮肉，皮肉又在你眼前缓缓合上。它曾经，也是个人。',
    dream: '你梦见甜腥的药香漫过来。皮肉合得拢的东西，刀慢了就是喂它。'
  });

  G.define('memory', {
    id: 'mem_death_wuguan_dizi',
    title: '演武场的黄土',
    kind: 'defeat',
    defeatCause: 'wuguan_dizi',   // 武馆弟子 nonLethal 打不死你，但这一败会刻进记忆、带去来世
    carry: true,
    text: '演武场上你被一拳放倒，半晌爬不起来。围观的哄笑散得很快，你的名字散得更快。',
    dream: '你梦见演武场的黄土贴着脸。下回，先站稳了再出手。'
  });

  // —— Boss ×4 ——
  G.define('memory', {
    id: 'mem_death_heishan_langwang',
    title: '雪上的金瞳',
    kind: 'death',
    deathCause: 'heishan_langwang',
    carry: true,
    text: '黑山雪夜。山一样的影子立在雪线之上，金色的独目俯视着你，像看一只入冬前的兔子。然后，雪红了。',
    dream: '你又梦见那场雪，和雪上方一双金色的眼睛。'
  });

  G.define('memory', {
    id: 'mem_death_kuangdong_shiwang',
    title: '塌方之下',
    kind: 'death',
    deathCause: 'kuangdong_shiwang',
    carry: true,
    text: '最深的矿道里，那具覆满矿尘的巨尸睁开了浑浊的眼。你转身的时候洞顶塌了，黑暗压下来，连喊声都没能跑出去。',
    dream: '你梦见洞顶簌簌落灰。地底的王，不见雷火不闭眼。'
  });

  G.define('memory', {
    id: 'mem_death_dashixiong_boss',
    title: '三成力',
    kind: 'defeat',
    defeatCause: 'dashixiong_boss',   // 大师兄 nonLethal 不取你性命，但这口气你咽不下，会记一世
    carry: true,
    text: '「我只用三成力。」这是你前世记牢的一句话。他收拳的时候，连汗都没出。',
    dream: '你梦见那只收回去的拳头。梦里你在心口刻字：来日，再登门。'
  });

  G.define('memory', {
    id: 'mem_death_shanmiao_xieying',
    title: '神像后的脸',
    kind: 'death',
    deathCause: 'shanmiao_xieying',
    carry: true,
    text: '香炉后的影子站了起来，戴着山神的脸。你的刀穿影而过，像砍进了香灰里。最后你听见它笑——用很多人的声音。',
    dream: '你梦见满殿香灰无风自起，凝成一张脸。它怕雷光，更怕来历。'
  });

  // —— 非战死 ×3 ——
  G.define('memory', {
    id: 'mem_death_shouyuan',
    title: '灯尽',
    kind: 'death',
    deathCause: 'shouyuan',
    carry: true,
    text: '那一世你没死在谁手里。你活到头发白透，坐在门槛上晒太阳，一闭眼就没再睁开。临了你想：当年要是敢再走远一步……',
    dream: '你梦见一盏灯安安静静烧到了底。寿数是借来的柴，烧不旺就白借。'
  });

  G.define('memory', {
    id: 'mem_death_dandu',
    title: '五内如焚',
    kind: 'death',
    deathCause: '丹毒反噬',   // 引擎死因字符串（time.js 突破失败丹毒炸开）
    carry: true,
    text: '冲关那一刻，积年的药毒一齐炸开。你像一只烧穿的丹炉，从里头红到外头。最后的知觉，是舌根那缕熟悉的苦。',
    dream: '你梦见自己成了一只烧红的炉。毒攒够了，是丹也是火。'
  });

  G.define('memory', {
    id: 'mem_death_tupo_shibai',
    title: '差半步',
    kind: 'death',
    deathCause: 'tupo_shibai',   // 内容侧约定死因：冲关致死事件用 {die:{cause:'tupo_shibai'}}
    carry: true,
    text: '你听见体内那道关隘碎裂的声音——不是开了，是塌了。气机奔涌而出，无处可去，把你自己冲成了溃堤。',
    dream: '你梦见一道推不开的门。门没锁——推门的人伤未愈，心未静。'
  });

  // —— 通用兜底（保持在所有死亡模板之后）——
  G.define('memory', {
    id: 'mem_death_generic',
    title: '前世残影',
    kind: 'death',
    deathCause: '*',
    carry: true,
    text: '你记不清自己是怎么死的，只记得最后那一刻，风里有青石板的味道。',
    dream: '梦里你站在一条走过千百遍的街上，怎么也想不起自己的名字。'
  });

  // ════════════════ 二、Boss 情报记忆（kind:intel，C4 enemy.intelMem 钉死引用）════════════════

  G.define('memory', {
    id: 'mem_intel_langwang',
    title: '狼王的左眼',
    kind: 'intel',
    carry: true,
    text: '黑山狼王的左眼是瞎的——一道旧箭伤，老猎户年轻时留下的。它从左侧扑击时会下意识偏头，颈侧便露出旧伤的破绽。',
    dream: '你梦见雪上一只金色的独眼。左边——它看不见左边。'
  });

  G.define('memory', {
    id: 'mem_intel_shiwang',
    title: '不闭眼的尸王',
    kind: 'intel',
    carry: true,
    text: '矿洞最深处的尸王，是百十条人命的怨气养出来的。刀剑加身它浑然不觉，血也流不出来；可它腿脚僵慢，怕火光，最怕雷雨天——怨气遇雷，如雪见汤。',
    dream: '你梦见地底那双浑浊的眼。梦里你举起火把，它退了半步。'
  });

  G.define('memory', {
    id: 'mem_intel_dashixiong',
    title: '第三拳',
    kind: 'intel',
    carry: true,
    text: '大师兄的拳是三段连打，前两拳是虚的，第三拳才下杀手——可出第三拳时他必抢半步，左肋旧伤便露出空门。那道伤，是他当年替馆主挡铁鞭落下的。',
    dream: '你梦见他抢进的那半步。一，二——左肋，就是现在。'
  });

  G.define('memory', {
    id: 'mem_intel_xieying',
    title: '香火喂大的影子',
    kind: 'intel',
    carry: true,
    text: '山神庙里那道影子不是山神，是吃了多年错放香火的孤魂戾气。刀剑穿它而过如割烟；它怕雷火，更怕有人当面点破它的来历——来历一破，影子就立不住。',
    dream: '你梦见满殿香灰立成人形。你刚要喊破它的来历，它先散了。'
  });

  // ════════════════ 三、机缘记忆（kind:chance，C3 事件发放；前世知道、今生改命的钥匙）════════════════

  G.define('memory', {
    id: 'mem_duanjianya',
    title: '断剑崖',
    kind: 'chance',
    carry: true,
    text: '前世你曾在黑山深处迷过路，见过一面插满断剑的崖壁——顺着干涸的涧底走到头，背阴的那面。崖下白石如骨，每一柄断剑，都指着同一个方向。',
    dream: '你又梦见那面插满断剑的崖。顺干涸的涧底走到头，回头。'
  });

  G.define('memory', {
    id: 'mem_kuangdong_languang',
    title: '矿底蓝光',
    kind: 'chance',
    carry: true,
    text: '死在矿里的人都记得：塌方堵住的主巷左手边，第三条支巷的尽头，黑暗深处悬着一点幽幽的蓝光，像一只不肯闭上的眼睛。矿工们挖了三代，到死也没挖到它。',
    dream: '黑暗里那点蓝光又亮了。左手边，第三条岔口——你数到醒来。'
  });

  G.define('memory', {
    id: 'mem_miaodi_diyu',
    title: '庙底的低语',
    kind: 'chance',
    carry: true,
    text: '山神庙的神座底下是空的。夜深时把耳朵贴上神座前第三块砖，能听见底下有极轻的说话声——它在一个一个地数名字。数到谁，谁家的香火就断了。',
    dream: '你梦见耳朵贴着冰凉的砖。砖下的声音，停在一个熟悉的名字上。'
  });

  G.define('memory', {
    id: 'mem_yaofang_gufang',
    title: '古方残页',
    kind: 'chance',
    carry: true,
    text: '回春堂柜底最后一格，压着半页焦黄的古方，以凝血草为引，配伍狠辣。缺的半页早就烧掉了。掌柜的说过一句醉话：烧掉的那半页，写的不是药，是代价。',
    dream: '你又梦见那半页焦黄的方子。起首一味看得真切：带霜的凝血草。'
  });

  G.define('memory', {
    id: 'mem_leichi_canwen',
    title: '雷池残纹',
    kind: 'chance',
    carry: true,
    text: '黑山绝顶有一处雷劈出来的石坪，坪心一洼死水。前世某个雷雨夜你在那里躲雨，亲眼看见满坪石纹亮起，如一张银网兜住雷光，死水白炽如昼——天一亮，又灰败如常。',
    dream: '雷雨一近你手心就发麻。梦里山顶石纹亮成一张网，网住一池白光。'
  });

  // ════════════════ 四、杂忆（kind:misc，亲情/执念/悔恨/杀执；C3/C5 以 memAdd 发放）════════════════

  // 亲情
  G.define('memory', {
    id: 'mem_zaobian_geyao',
    title: '灶边的歌',
    kind: 'misc',
    carry: true,
    text: '不知是哪一世了：灶火很旺，有人背对着你哼一支跑调的歌，锅里咕嘟着冬菜。你看不清那人的脸，可你知道，那口锅里有你的一份。',
    dream: '你梦见一星灶火和一支跑调的歌。醒来时，枕上湿了一片。'
  });

  // 执念
  G.define('memory', {
    id: 'mem_qiangshang_quanpu',
    title: '墙上的拳谱',
    kind: 'misc',
    carry: true,
    text: '你扫了三年地，那卷拳谱在墙上挂了三年。你至今记得每一页翻过去的声音——是别人翻的。你只配听。',
    dream: '你梦见那面墙。这一回没人，你伸手把拳谱取了下来。'
  });

  // 悔恨
  G.define('memory', {
    id: 'mem_huanbuqing_yaoqian',
    title: '还不清的药钱',
    kind: 'misc',
    carry: true,
    text: '那一世有人替你抓了三个月的药，自己却舍不得请一回大夫。你发愿出息了十倍还他。后来你出息了，他坟头的草也三尺了。',
    dream: '你梦见一串铜钱压着药方。你把钱推过去，对面始终没人坐下。'
  });

  // 杀执
  G.define('memory', {
    id: 'mem_diyi_dao',
    title: '第一刀',
    kind: 'misc',
    carry: true,
    text: '你记得自己某一世的第一刀。不是记得那个场面，是手腕记得——那种透骨的、落下去就收不回来的轻。从那以后，每一世你的手都认得刀。',
    dream: '你梦见右手握着沉甸甸的东西。醒来摊开手，空的。'
  });

  // ════════════════════════════════════ v2 新增 28 条记忆 ════════════════════════════════════

  // ════════════════ 五、v2 新普通敌死亡模板（kind:death/defeat，引擎按死因自动授予）════════════════
  //   含三个 v2 新死因（数组 deathCause）：寒毒入心 / 溺亡 / 魇毙——每个新死因都有一条死亡记忆作落点。

  // —— 狐魅：惑死/迷途冻饿（被狐婆坳的狐魅迷了心智走入歧途）——
  G.define('memory', {
    id: 'mem_death_humei_yao',
    title: '水里的笑脸',
    kind: 'death',
    deathCause: 'humei_yao',
    carry: true,
    text: '夜里有人在唤你的名字，声音软得像棉。你跟着月下那个影子走了一程又一程，等回过神，脚下已经没有路了——只有一张照水的笑脸，越凑越近。',
    dream: '你梦见月下一个招手的影子。梦里有声音：心一动，路就没了。'
  });

  // —— 厉鬼：怨气缠身、惊魇而死（乱葬岗夜出的厉鬼，魇毙）——
  // 兼挂 '魇毙' 死因：梦魇/梦债结算致死亦授予此忆（生产者 C3 梦债结算 die op）。
  G.define('memory', {
    id: 'mem_death_ligui',
    title: '压在胸口的夜',
    kind: 'death',
    deathCause: ['ligui', '魇毙'],
    carry: true,
    text: '你睡着了，又像没睡着。有什么沉沉地压上你的胸口，黑得没有边，越压越重。你想喊，喊不出；想动，动不了。天亮时人们发现你睁着眼，已经没气了。',
    dream: '你梦见有东西压在胸口。梦里你死命提着一口气——醒着的人，它压不住。'
  });

  // —— 水鬼：拖拽入水、溺亡（河神渡水鬼，溺亡）——
  // 兼挂 '溺亡' 死因：河神水势/河祸落水致死亦授予此忆（生产者 C4 河神战 die、C3 河祸事件 die op）。
  G.define('memory', {
    id: 'mem_death_shuigui',
    title: '水底的手',
    kind: 'death',
    deathCause: ['shuigui', '溺亡'],
    carry: true,
    text: '你只是去河边洗手。一只冰凉发胀的手攥住了你的脚踝，往下拖。河水灌进口鼻时你看见水底有许多张脸，仰着，等了很久——它们要拉一个人去替自己上岸。',
    dream: '你梦见脚踝被攥住往水里拖。梦里你死命扒着岸：莫近无桥的水边。'
  });

  // —— 寒蛟幼：寒息冻毙、寒毒入心（寒潭寒蛟幼，寒毒入心）——
  // 兼挂 '寒毒入心' 死因：寒雾/采冰寒毒结算致死亦授予此忆（生产者 C4 寒蛟战 die、C3 寒雾结算 die op）。
  G.define('memory', {
    id: 'mem_death_hanjiao_you',
    title: '蓝得发邪的冷',
    kind: 'death',
    deathCause: ['hanjiao_you', '寒毒入心'],
    carry: true,
    text: '潭面忽然腾起一层蓝雾，一条幼蛟自冰下窜出，吐出的寒息比冰还冷。寒气顺着你的脊梁一路钻进心口，那里先是刺痛，后来什么都不痛了——血，是从里头冻起来的。',
    dream: '你梦见一口蓝得发邪的寒气直钻心口。寒从里冻起，热的东西才化得开它。'
  });

  // —— 熊罴：蛮力扑杀（后山兽径的熊罴）——
  G.define('memory', {
    id: 'mem_death_bali',
    title: '山一样压下来',
    kind: 'death',
    deathCause: 'bali',
    carry: true,
    text: '草木一阵翻倒，一头黑熊立起来，比两个你还高。你连刀都没拔利索，那座小山似的身躯就压了下来，一爪扇飞了你半边天。临了你只记得，它的毛是潮的，带着腥气。',
    dream: '你梦见一座黑山立起来朝你压下。梦里有声音：硬碰它的力，是拿鸡蛋撞磨盘。'
  });

  // —— 剑冢残灵：剑气反震（断剑崖剑冢残灵，非致死过招——defeat 模板）——
  // 残灵守崖试人，不取性命；被它反震挑落崖下重伤，这一败刻进记忆带去来世。
  G.define('memory', {
    id: 'mem_death_jianzhong_canling',
    title: '崖下的剑鸣',
    kind: 'defeat',
    defeatCause: 'jianzhong_canling',   // 剑冢残灵 nonLethal：试剑不杀人，败者被挑落重伤
    carry: true,
    text: '你逞强去试那满崖断剑，一道残灵自剑堆里激射而出。你每劈一剑，那股剑气便循着你的剑反震回来，比你自己的劲还重。最后你被挑落崖下，断剑在你头顶嗡嗡作响，像在笑你不自量力。',
    dream: '你梦见满崖断剑齐齐震鸣。下回——别用蛮力跟它对劈。'
  });

  // ════════════════ 六、v2 新 Boss 死亡模板（kind:death/defeat）════════════════

  // —— 老狐仙（humei 母 Boss）——
  G.define('memory', {
    id: 'mem_death_laohu_xian',
    title: '九条尾巴的影',
    kind: 'death',
    deathCause: 'laohu_xian',
    carry: true,
    text: '狐婆坳的月色稠得化不开。那位「婆婆」站起身，身后舒展开九道尾影，一双眼睛笑吟吟看着你。你忽然分不清眼前是人是狐、是梦是醒——等你想拔刀，刀已经架在了自己脖子上。',
    dream: '你梦见月下九条舒展的尾影。梦里有人提醒：它的迷局，破在一颗不动的心。'
  });

  // —— 剑冢剑灵（yujian 母 Boss）——
  G.define('memory', {
    id: 'mem_death_jianzhong_jianling',
    title: '万剑认主',
    kind: 'death',
    deathCause: 'jianzhong_jianling',
    carry: true,
    text: '断剑崖深处，满崖断剑无风自起，齐齐指向你——它们认的不是你。一道剑灵自剑堆中央凝成人形，递出的第一剑你便看不清。千万剑光罩下时，你才懂老师傅那句话：是剑认人，不是人认剑。',
    dream: '你梦见万剑悬空齐指一处。梦里一个念头滚烫：要它认你，先以剑入剑。'
  });

  // —— 寒潭蛟（handu 母 Boss）——
  G.define('memory', {
    id: 'mem_death_hantan_jiao',
    title: '冰下睁开的眼',
    kind: 'death',
    deathCause: 'hantan_jiao',
    carry: true,
    text: '你到底还是凿穿了潭心那块蓝冰。冰下一只巨眼缓缓睁开，整座寒潭骤然封冻。那条千年寒蛟自冰中升起，吐出的寒息让你的血在血管里结成了冰碴。它不咬你——它等你自己冻成一尊冰像。',
    dream: '你梦见潭心冰下睁开一只巨眼。寒蛟畏雷火——它最怕的，是从天上劈下来的那一下。'
  });

  // —— 后山兽王（shouhun 母 Boss）——
  G.define('memory', {
    id: 'mem_death_houshan_shouwang',
    title: '群兽俯首之主',
    kind: 'death',
    deathCause: 'houshan_shouwang',
    carry: true,
    text: '后山深处的兽群忽然齐齐噤声、俯下身去——你这才明白爹的警告。一头你叫不出名字的巨兽自林荫里踱出，周身群兽匍匐如臣。它没急着扑，先低吼一声，那一声里有整座山的重量，压得你两腿发软，再没站起来。',
    dream: '你梦见群兽俯首，让出中央那头巨兽。它服的不是力，是更高的威与更野的魂。'
  });

  // —— 乱葬厉祖（xianghuo/yinguo 母 Boss）——
  G.define('memory', {
    id: 'mem_death_luanzang_li_zu',
    title: '百年怨气所聚',
    kind: 'death',
    deathCause: 'luanzang_li_zu',
    carry: true,
    text: '乱葬岗的夜里，地底渗出层层叠叠的低语，无数只手自坟堆里探出，托起一团黑得发亮的怨气——那是百年来所有无主冤魂的恨，聚成了一个「祖」。它一开口，唤的全是你历世的名字。你的魂，先于身子散了。',
    dream: '你梦见黑怨里托出一个影。梦里有微光提醒：怨气最怕一炷干净的香、一道天雷。'
  });

  // —— 河神（xianghuo 母 Boss）——
  G.define('memory', {
    id: 'mem_death_heshen',
    title: '渡口的水势',
    kind: 'death',
    deathCause: 'heshen',
    carry: true,
    text: '你没按时奉上那年的河祭。渡口的水一夜暴涨，浑浊的浪里立起一道丈高的水影，戴着一张古旧的神面。它伸手一招，整条河都朝你扑来。你被卷进水里时听见它说：还愿，还是抵命？',
    dream: '你梦见渡口立起一道丈高的水影。它要的是香火与诚——不给，便要命来抵。'
  });

  // ════════════════ 七、v2 新 Boss 情报记忆（kind:intel，C4 enemy.intelMem 钉死引用）════════════════

  G.define('memory', {
    id: 'mem_intel_laohu',
    title: '不动心的破局',
    kind: 'intel',
    carry: true,
    text: '狐婆坳那位老狐仙修了千年，最厉害的是幻术媚惑——它能照着你心里最想要的，编出一整座迷局。可幻术骗的是心，心不动，迷局便立不住；锋锐的剑气与雷光能斩破幻影，让它现出九尾的原形。',
    dream: '你梦见九尾的影子在迷雾里晃。梦里你心如止水——雾，自己散了。'
  });

  G.define('memory', {
    id: 'mem_intel_jianling',
    title: '以剑入剑',
    kind: 'intel',
    carry: true,
    text: '剑冢剑灵是断剑崖万千断剑的剑意所聚，寻常刀枪近不得身——剑气会循着兵刃反震回来。它认的是剑、是剑意：唯有以纯粹的剑气与它相和，让你的剑意压过满崖剑鸣，它才会认你为主，俯首归鞘。',
    dream: '你梦见万剑齐鸣，独你掌中一道剑气压住了全场。它认了。'
  });

  G.define('memory', {
    id: 'mem_intel_hanjiao',
    title: '寒极怕火',
    kind: 'intel',
    carry: true,
    text: '寒潭那条千年蛟以寒息冰封一切，越冷越强，寻常的冷气近不得它身、伤不了它分毫。它怕的是相克的至阳——天上的雷、人间的火。引它一身寒气反噬，或以雷火破其冰甲，是这潭死水里唯一的活路。',
    dream: '你梦见寒蛟的冰甲被一道雷光劈开一线。寒极者，畏火。'
  });

  G.define('memory', {
    id: 'mem_intel_shouwang',
    title: '威压慑王',
    kind: 'intel',
    carry: true,
    text: '后山兽王是群兽之主，蛮力压人，硬碰硬如以卵击石。可它终究是兽——服的是更高的威、更野的魂。以驭兽之能震慑其心、以更盛的威压压下它的野性，群兽之主便会像它脚下的群兽一样，朝你俯首。',
    dream: '你梦见兽王在你面前矮了半分。它服的不是刀剑，是压过它的那股威。'
  });

  G.define('memory', {
    id: 'mem_intel_lizu',
    title: '香火净怨',
    kind: 'intel',
    carry: true,
    text: '乱葬厉祖是百年冤魂的怨气聚成，刀剑加身如搅黑水，越斩越多。它怕的是干净的东西——一炷诚心的香火能净它的戾、一道天雷能焚它的怨；若曾在梦里、在因果里与它结过账，更能顺着那条线找到它的本魂。',
    dream: '你梦见黑怨在一炷青烟前节节退散。怨气最怕的，是干净的香火。'
  });

  G.define('memory', {
    id: 'mem_intel_heshen',
    title: '还愿斩水',
    kind: 'intel',
    carry: true,
    text: '河神渡那位河神靠水势伤人，淹溺香火、索人血祭。硬接它的水势必败；可它本是受香火的神，最重的是「诚」与「愿」——以香火还愿能消其大半凶戾，再以凌厉剑气斩开扑来的水墙，避其水势、攻其本身，方有一线生机。',
    dream: '你梦见水墙扑来时被一线剑光劈开。它受香火，也忌真心还愿的人。'
  });

  // ════════════════ 八、v2 机缘记忆（kind:chance，C3 奇遇发放；五新道各 ≥1 把指路钥匙）════════════════

  // 寒（handu）——寒潭蓝光
  G.define('memory', {
    id: 'mem_hantan_languang',
    title: '寒潭蓝光',
    kind: 'chance',
    carry: true,
    text: '前世采冰那年，你在寒潭最厚的那块蓝冰底下见过一点幽蓝的光——不是反光，是活的，一明一灭，像潭底有什么在呼吸。把头说那是「蓝萤石」，沾了千年寒气的灵物，凿到它的人没一个活着回来。',
    dream: '你又梦见冰下那点一呼一吸的蓝光。隆冬，潭心最厚的冰下——你数着它的明灭醒来。'
  });

  // 剑（yujian）——剑冢剑鸣
  G.define('memory', {
    id: 'mem_jianzhong_jianming',
    title: '剑冢剑鸣',
    kind: 'chance',
    carry: true,
    text: '前世某个静夜，你在断剑崖下听见满崖断剑一齐嗡鸣——不是风。那些插在崖壁上的断剑朝着同一个方向，像在应和崖顶深处传来的一声更清越的剑吟。铸剑老人说，那是剑冢在挑人；听得见它喊的，才上得去。',
    dream: '你又梦见满崖断剑齐声嗡鸣。顺着最清的那一声，往崖顶深处走。'
  });

  // 狐（humei）——狐坳迷梦
  G.define('memory', {
    id: 'mem_huao_mimeng',
    title: '狐坳迷梦',
    kind: 'chance',
    carry: true,
    text: '前世你误入狐婆坳，做了一场极长极真的梦——梦里你得到了今生最想要的一切。醒来时月还在原处，你却已经在坳里转了三天三夜。临走你听见草木深处一声轻笑，柔得像替你掖好了被角。那不是恶意，是试探。',
    dream: '你又梦见狐坳那场太真的梦。梦里你提醒自己：再好的，也是借你的。'
  });

  // 葬（yinguo / xianghuo）——乱葬低语
  G.define('memory', {
    id: 'mem_luanzang_diyu',
    title: '乱葬低语',
    kind: 'chance',
    carry: true,
    text: '前世替人收骸那夜，你把耳朵贴近一座新坟，听见土下有极轻的说话声——许许多多的声音叠在一处，一个一个地数着名字、诉着冤。数到最后，那些声音忽然齐齐静了，像是发现地上有人在听。第二天，你大病一场。',
    dream: '你又梦见耳朵贴着冰凉的坟土。土下的低语停下来——它们知道你在听。'
  });

  // 渡（xianghuo / handu）——河底沉钟
  G.define('memory', {
    id: 'mem_hedi_chenzhong',
    title: '河底沉钟',
    kind: 'chance',
    carry: true,
    text: '前世你在河神渡撑船，正午无风，却从河心深处传来一声极闷的钟响——河婆说那是沉在河底的一口古钟，是几百年前镇河患用的法器，连同打钟的人一起沉了下去。钟响一回，河里就要起一回水患；可它若肯认你，水患便归你号令。',
    dream: '你又梦见正午无风的河心传来一声闷钟。钟在水底，敬它的人才捞得起。'
  });

  // 兽（shouhun）——后山兽径
  G.define('memory', {
    id: 'mem_houshan_shoujing',
    title: '后山兽径',
    kind: 'chance',
    carry: true,
    text: '前世你随驯兽人深入后山，看见一条人迹罕至的兽径——所有走兽都循着它进出，路尽头是一片白骨垒成的坡，传说是历代兽王的坟。坡上时常聚着通了灵的野物，强者为尊。能在那里立住脚的人，半山的兽都听他号令。',
    dream: '你又梦见那条走兽循行的小径。路尽头白骨成坡——强者，立于其上。'
  });

  // ════════════════ 九、v2 杂忆（kind:misc，身世/执念/羁绊；C3/C5 以 memAdd 发放）════════════════

  // 渡口亲情（渔家女/还愿人家）
  G.define('memory', {
    id: 'mem_dujin_dengxin',
    title: '渡口的灯',
    kind: 'misc',
    carry: true,
    text: '不知是哪一世了：渡口立着一盏长明的河灯，有人每夜替它添油、剪芯，嘴里念叨着保平安的话。你看不清那人的脸，只记得灯火映在水里，碎成一片暖暖的金，照着回家的那条水路。',
    dream: '你梦见渡口一盏不灭的灯，把水照成一片碎金。醒来枕边发凉。'
  });

  // 戏台执念（戏班弃儿）
  G.define('memory', {
    id: 'mem_xifu_jiulian',
    title: '戏服旧脸',
    kind: 'misc',
    carry: true,
    text: '你记得某一世卸不下的一张脸。戏唱完了，妆却洗不净，镜子里那张脸冲你笑，笑得跟台上一模一样。你忽然怕了——扮了一辈子别人，你都快想不起自己原本是什么模样。',
    dream: '你梦见镜子里一张卸不掉的戏脸。它问你：你究竟是谁？'
  });

  // 剑庐羁绊（铸剑徒/武学遗孤）
  G.define('memory', {
    id: 'mem_jianlu_huihuo',
    title: '剑庐回火',
    kind: 'misc',
    carry: true,
    text: '你记得某一世的剑炉。老师傅说你心太软铸不出杀剑，撵你下山那天，却背过身偷偷往你包袱里塞了块好铁。多年后你才懂，他嫌你软，是怕这行的火气烧坏了你；那块铁，是他没说出口的舍不得。',
    dream: '你梦见炉火映着一张转过去的背。包袱里那块好铁，还温着。'
  });

  // 兽栏羁绊（驯兽人）
  G.define('memory', {
    id: 'mem_xunying_yuxie',
    title: '断翅的鹰',
    kind: 'misc',
    carry: true,
    text: '你记得某一世养过一只断了翅的鹰。它飞不起来了，却每天清晨准时立在兽栏最高处，朝着后山的方向引颈长唳。你给它喂食、替它接骨，它从不亲近你；可你走的那天，它叫了一整夜——原来它不是不认你，是怕认了你，又要分开。',
    dream: '你梦见一只断翅的鹰立在高处，朝山长唳。那一声，像在唤一个回不来的名字。'
  });
})();
