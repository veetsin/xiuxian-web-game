// js/data/memories.js — 记忆数据（Owner: C1）。死亡模板 ×14 / Boss 情报 ×4 / 机缘钥匙 ×5 / 杂忆 ×4。
//
// memory schema 见契约 §11（v1.1 扩展 deathCause）：
//   deathCause: "enemyId" | [..] | "shouyuan" | "*" —— 死亡时引擎按死因匹配第一个未持有的模板自动授予（"*" 兜底）。
//   kind ∈ death | intel | chance | misc（UI「前世」tab 分组用）。
//   carry:true 才随轮回蒸馏携带；dream 为来世开局自动播放的梦境日志（谶语，单行）。
//
// ── 本文件对外输出（他人会引用的 id）──
//   死亡模板（引擎自动授予，内容侧无需 memAdd）：
//     mem_death_yelang / mem_death_yaolang / mem_death_shanfei / mem_death_shigui / mem_death_yaoren /
//     mem_death_wuguan_dizi / mem_death_heishan_langwang / mem_death_kuangdong_shiwang /
//     mem_death_dashixiong_boss / mem_death_shanmiao_xieying / mem_death_shouyuan /
//     mem_death_dandu / mem_death_tupo_shibai / mem_death_generic（兜底）
//   Boss 情报（C4 enemy.intelMem 钉死引用；C5 对话/C3 事件发放）：
//     mem_intel_langwang / mem_intel_shiwang / mem_intel_dashixiong / mem_intel_xieying
//   机缘钥匙（C3 事件发放钉死；C2/C3 可用 cond {mem:"..."} 开「循前世记忆」行动/选项）：
//     mem_duanjianya / mem_kuangdong_languang / mem_miaodi_diyu / mem_yaofang_gufang / mem_leichi_canwen
//   杂忆（C3/C5 自由 memAdd）：mem_zaobian_geyao / mem_qiangshang_quanpu / mem_huanbuqing_yaoqian / mem_diyi_dao
//
// ── 死因字符串登记（deathCause 匹配用）──
//   引擎自产：敌人 id（战死）/ 'shouyuan'（寿尽坐化）/ '丹毒反噬'（突破时丹毒炸开，time.js）/
//             '伤重不治'（无因 hp 归零）/ '横死'（die op 缺省）——后两者落 '*' 兜底。
//   内容侧约定：冲关致死事件请用 {die:{cause:'tupo_shibai'}}，以命中 mem_death_tupo_shibai。
//
// TODO-INTEGRATION: validate.js 只认 enemyId/'shouyuan'/'*' 三类死因，会对 '丹毒反噬' 与 'tupo_shibai'
//                   误报「deathCause 引用未知敌人」（2 条）；请基建把上方登记的死因字符串加入白名单。
// TODO-INTEGRATION: 旧样例 id mem_xueye_langtong / mem_qianshi_canying / mem_langwang_ruodian 已废弃删除。
//                   enemies.js（C4）intelMem 与 npcs.js（C5）「听老猎户讲山」仍引用 mem_langwang_ruodian，
//                   需按各自任务卡切换为 mem_intel_langwang（钉死 id，本文件已就位）。
// TODO-INTEGRATION: 杂忆 4 条暂无发放点，待 C3 事件 / C5 对话以 memAdd 接入（id 见上方登记）。
//
// ── 自检十问（对文件整体回答一次）──
// 1标签：死亡/情报/机缘/执念，全是因果与轮回的沉淀物。2易共现：走马灯、来世开局梦境、布置改命行动。
// 3排斥：无强排斥（记忆是纯沉淀）；同因死亡模板每人只授一次，重复死因落兜底。
// 4改状态：入 player.memories；carry 者跨世；cond {mem:"..."} 可解锁行动/选项；intelMem 给战前提示与增伤。
// 5后果：死一次=买一条情报；五把机缘钥匙是「前世知道、今生改命」的开门砖。
// 6可解释：死前最后一眼成为来世的梦；情报皆有来历（箭伤是老猎户射的、邪影是错放香火养的）。
// 7钩子：断剑崖/矿底蓝光/庙底砖/柜底古方/山顶雷池，各对一处地图与一条道，C2/C3 直接咬合。
// 8有趣选择：知道狼王瞎了左眼之后，这一世是提前进山复仇，还是绕着雪线走。
// 9服务 build：机缘钥匙分喂血剑/丹药/雷法/因果；死亡梦境引导避坑与复仇（因果以记忆为食）。
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
    kind: 'death',
    deathCause: 'wuguan_dizi',
    carry: true,
    text: '演武场上你被一拳放倒，再没能起来。围观的哄笑散得很快，你的名字散得更快。',
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
    kind: 'death',
    deathCause: 'dashixiong_boss',
    carry: true,
    text: '「我只用三成力。」这是你前世听见的最后一句人话。他收拳的时候，连汗都没出。',
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
})();
