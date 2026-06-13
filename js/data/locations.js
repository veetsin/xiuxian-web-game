// js/data/locations.js — 地点数据（Owner: C2，v1 8 地点 + v2 新增 8 地点）。
//
// location schema：
//   { id, name, desc,                       // desc 为中央面板地点描述
//     tags: [...],                          // 取自 ids.js tags；事件 prefer.locTags 会乘权重
//     danger0, spiritualEnergy0, corruption0, stability0,   // 初始地点状态（0~100）
//     discovered0: false,                   // 缺省 true；false = 需 revealLoc 解锁
//     boss: "enemyId" }                     // 此地之主；bossSet/legacy 会同步 bossAlive
//
// 解锁链（C2 行动侧已落实，事件侧 C3 可另加路径）：
//   黑山深处 ← 夜入黑山(yeru_heishan outcome) / 设陷阱(she_xianjing，持死于狼属的 mem_death_* 旧梦路径)
//   废弃矿洞 ← 打听消息(dating_xiaoxi，老矿工醉话 outcome)
//   ┄ v2 新增 8 地点的发现路径（本文件行动侧至少各一条 revealLoc，事件侧 C3 可另加）┄
//   寒潭 hantan       ← 下矿底深处遇寒雾(xia_kuangdi 的寒线 outcome) / 采冰人出生即在
//   断剑崖 duanjianya ← 黑山深处「寻崖」行动 / 持 mem_duanjianya 旧路径(actions_wild 已有 xun_duanjianya 不解锁，本文件新增 tan_duanjianya 解锁) / 铸剑徒出生即在
//   狐婆坳 hupo_ao    ← 黑山外围夜行「闻歌」outcome(ye_xun_huao) / 狐养儿出生即在
//   乱葬岗 luanzang_gang ← 镇外「乱葬岗收骸」入口由打听解锁(dating 新 outcome 在 town) / 掘墓子·更夫出生即在
//   义庄 yizhuang     ← 青石镇内，初始可见(discovered0 缺省 true)
//   驿马关 yima_guan  ← 青石镇官道，打听商路解锁(town 新 outcome) / 货郎子出生即在
//   后山兽径 houshan_lin ← 黑山深处「兽径」行动解锁(xun_shoujing) / 驯兽人出生即在
//   河神渡 heshen_du  ← 青石镇外河边，打听河祸解锁(town 新 outcome) / 渔家女·还愿人出生即在
// 标签咬合（给 C3 prefer.locTags 用，含 v2 新 tag 寒/狐/兽/水/葬/渡/幻）：
//   山神庙=阴邪/香火/夜/因果；矿洞=矿/阴邪/险地/隐秘；黑山深处=险地/狼/隐秘/血；
//   黑山外围=野外/狩猎/狼/险地；武馆=体/修炼；药铺=药/市集；青石镇=市集/交际/劳作；家中=修炼/隐秘/梦；
//   寒潭=寒/水/灵脉/险地；断剑崖=剑/险地/隐秘/灵脉；狐婆坳=狐/幻/夜/阴邪；乱葬岗=葬/阴邪/夜/梦；
//   义庄=葬/阴邪/夜；驿马关=渡/市集/交际；后山兽径=兽/野外/狼/险地；河神渡=渡/水/香火。
//
// ── 自检十问 ──
// 1标签：见各地 tags（v2 八地各扣其母题：寒潭=寒水、断剑崖=剑、狐婆坳=狐幻、乱葬岗/义庄=葬、驿马关/河神渡=渡、后山=兽）。
// 2易共现：黑山↔狼/血/狩猎，庙↔阴邪/香火，矿↔隐秘/险，寒潭↔寒/水，狐坳↔狐/幻/夜，乱葬↔葬/梦/阴邪，渡口↔水/香火。
// 3排斥：镇中安稳与险地凶险互斥；义庄/乱葬的阴冷与驿马关的市集喧闹互斥；地下/水底与雷雨天象互斥。
// 4改状态：danger/corruption 被事件与世界 tick 推动；庙 corruption 越高后殿越开；狐坳 ghostQi 高则狐祟扩散。
// 5后果：danger 抬高环境事件概率；corruption≥45 解锁庙线；新地 Boss 亡则一方平靖（legacy 由行动侧落）。
// 6可解释：每处都有来历（矿塌废弃、剑庐弃剑成崖、狐婆养脉、乱葬埋无名、河神索祭）。
// 7钩子：深处/矿洞/寒潭/断剑崖 discovered0:false 留探索感；各新地 boss 留「这一世先不碰」的退路。
// 8有趣选择：去险地搏机缘还是守镇里攒钱；采冰淬体还是冻骨。9服务 build：灵脉养修炼，阴邪养因果/香火，寒潭喂寒，剑崖喂剑，狐坳喂狐，后山喂兽。
// 10不暴露：描述只写见闻与传言，不提任何变量名与数值，不点破道名。
(function () {
  'use strict';

  G.define('location', {
    id: 'qingshizhen', name: '青石镇',
    desc: '一条青石板老街贯穿全镇，两侧是茶肆、铁匠铺和挂着褪色幌子的杂货行。北望黑山，山色如墨；镇口的老槐树下总有人摆龙门阵，说些山里山外的闲话。在这里，银钱、消息和人情，都是能救命的东西。',
    tags: ['市集', '交际', '劳作'],
    danger0: 0, spiritualEnergy0: 5, corruption0: 0, stability0: 100
  });

  G.define('location', {
    id: 'heishan_waiwei', name: '黑山外围',
    desc: '出镇北行十里便是黑山外围。猎户旧道在荒草间若隐若现，沿途可见兽蹄印与折断的箭杆。再往里，林子陡然深暗下去——那是连老猎户都要掂量掂量的地界。',
    tags: ['野外', '狩猎', '狼', '险地'],
    danger0: 35, spiritualEnergy0: 15, corruption0: 5, stability0: 90
  });

  G.define('location', {
    id: 'heishan_shenchu', name: '黑山深处',
    desc: '古木遮天，白昼如暮。这里的兽道不是人踩出来的——碗口粗的爪痕从树根一路挠到三人高处，树皮翻卷如灼。狼嚎自四面八方涌来，分不清远近，也分不清是一头，还是一百头。',
    tags: ['野外', '险地', '狼', '隐秘', '血'],
    danger0: 70, spiritualEnergy0: 40, corruption0: 10, stability0: 80,
    discovered0: false,
    boss: 'heishan_langwang'
  });

  G.define('location', {
    id: 'shanshenmiao', name: '山神庙',
    desc: '半山腰的破庙，山神像的脸被人凿去了，香炉里却偶尔有新的香灰，不知是谁来上的。殿角的蛛网年年扫年年结，唯独后殿那扇门，从没人见它开过。起风时满殿呜呜作响，像有谁在轻轻数着来人的名字。',
    tags: ['阴邪', '香火', '隐秘', '夜', '因果'],
    danger0: 45, spiritualEnergy0: 30, corruption0: 40, stability0: 70,
    boss: 'shanmiao_xieying'
  });

  G.define('location', {
    id: 'feikuang', name: '废弃矿洞',
    desc: '前朝的铁矿，塌过三回，埋了百十号人，最后一回连抚恤都没发就封了山。洞口的封条烂成了纸絮，黑风从洞里一阵阵往外淌，吹得人后颈发凉。老辈人说：矿里头，死人比活人记性好。',
    tags: ['矿', '险地', '隐秘', '阴邪'],
    danger0: 60, spiritualEnergy0: 35, corruption0: 30, stability0: 40,
    discovered0: false,
    boss: 'kuangdong_shiwang'
  });

  G.define('location', {
    id: 'wuguan', name: '武馆',
    desc: '镇东头的「铁脊武馆」，青砖院墙，晨昏的喝喊声震得瓦片嗡嗡作响。馆里大师兄的名头比馆主还响——据说他一记崩拳，能把碗口粗的木桩打得拦腰而断。镇上的后生，一半想进去，一半挨过里头的拳头。',
    tags: ['体', '修炼', '交际'],
    danger0: 15, spiritualEnergy0: 10, corruption0: 0, stability0: 100,
    boss: 'dashixiong_boss'
  });

  G.define('location', {
    id: 'yaopu', name: '药铺',
    desc: '「回春堂」三个字的金漆掉得只剩个「春」。百年的药气浸进了每一道木纹，柜上药香沉沉，柜下听说收些来路不明的山货。掌柜的称药从不看戥子，手一掂，分毫不差。',
    tags: ['药', '市集', '交际'],
    danger0: 5, spiritualEnergy0: 10, corruption0: 0, stability0: 100
  });

  G.define('location', {
    id: 'jiazhong', name: '家中',
    desc: '一间漏风的老屋，灶冷席薄，好处是清静。院里那口老井冬暖夏凉，井沿的青苔比别处绿得深些，三伏天里凑近了，能吸到一口沁凉的潮气。关起门来，外头的事一概与你无关。',
    tags: ['修炼', '隐秘', '梦'],
    danger0: 0, spiritualEnergy0: 20, corruption0: 0, stability0: 100
  });

  // ════════════════ v2 新增 8 地点 ════════════════

  G.define('location', {
    id: 'hantan', name: '寒潭',
    desc: '废矿最深处一道冰裂尽头，藏着这方终年不冻反结冰的黑水潭。潭面浮着层薄冰，冰下幽蓝的光一明一灭，像有什么在水底睁着眼。靠近潭沿，呵气成霜，骨头缝里都往外渗凉——老矿工说，那不是冷，是潭里的东西在打量你。',
    tags: ['寒', '水', '灵脉', '险地'],
    danger0: 50, spiritualEnergy0: 40, corruption0: 10, stability0: 60,
    discovered0: false,
    boss: 'hantan_jiao'
  });

  G.define('location', {
    id: 'duanjianya', name: '断剑崖',
    desc: '黑山深处一道刀削般的绝壁，崖底乱石插满了断剑残刃，锈成一片铁色的林子。无风时也常闻嗡鸣，似有千百口剑在石底低低应和。崖顶有间塌了半边的旧剑庐，据说当年一位铸剑人在此弃尽心血之作，自此封炉。',
    tags: ['剑', '险地', '隐秘', '灵脉'],
    danger0: 45, spiritualEnergy0: 35, corruption0: 5, stability0: 75,
    discovered0: false,
    boss: 'jianzhong_jianling'
  });

  G.define('location', {
    id: 'hupo_ao', name: '狐婆坳',
    desc: '黑山外围背阴的一处山坳，夜里常飘出脂粉与香烛混着的甜腥气。坳里一座青瓦小院，住着个谁也说不清年纪的狐婆，养着一窝毛色发亮的狐。镇上后生晚归经过，十有八九要迷一阵路——醒来时，怀里多半攥着不知谁塞的一截红绳。',
    tags: ['狐', '幻', '夜', '阴邪'],
    danger0: 40, spiritualEnergy0: 25, corruption0: 30, stability0: 70,
    discovered0: false,
    boss: 'laohu_xian'
  });

  G.define('location', {
    id: 'luanzang_gang', name: '乱葬岗',
    desc: '青石镇西的一片荒坡，埋的多是无名横死之人，坟头连块碑都没有。白日里乌鸦满树，入夜则磷火浮动，风一过，满坡的草都朝同一个方向伏下去。岗上常有个拾骸的老者，挨个替无主的骨头收拢入土——他说，不收，它们夜里要自己起来走。',
    tags: ['葬', '阴邪', '夜', '梦'],
    danger0: 40, spiritualEnergy0: 20, corruption0: 45, stability0: 55,
    discovered0: false,
    boss: 'luanzang_li_zu'
  });

  G.define('location', {
    id: 'yizhuang', name: '义庄',
    desc: '镇南一所青砖义庄，专停那些一时下不了葬的客死之人。停灵的板床一排排码着，盖着白布，夜里更夫提灯巡过，灯影里白布偶尔会鼓动一下——多半是风。庄口常坐着个说书的，白日讲今古奇谈，入夜便兼着打更，镇上的奇闻怪事，没有他不知道的。',
    tags: ['葬', '阴邪', '夜'],
    danger0: 25, spiritualEnergy0: 15, corruption0: 25, stability0: 80
  });

  G.define('location', {
    id: 'yima_guan', name: '驿马关',
    desc: '青石镇外官道上的一处驿站关隘，南来北往的商队都在此歇脚换马。关前一片热闹的草市，货郎吆喝、镖师吃酒、郎中支摊，三教九流挤作一团。消息和银钱在这里流转得最快，山外的风声，往往先到驿马关，才传进镇里。',
    tags: ['渡', '市集', '交际'],
    danger0: 15, spiritualEnergy0: 5, corruption0: 0, stability0: 95,
    discovered0: false
  });

  G.define('location', {
    id: 'houshan_lin', name: '后山兽径',
    desc: '黑山深处再往里，是兽走出来的路。这里没有狼群的章法，只有更古老更蛮横的东西——碗大的足印陷在腐叶里，断枝上挂着撕扯的兽皮。深处有座荒草没顶的兽王坟，相传是百年前一头通灵巨兽的葬身处，至今鸟雀不落。',
    tags: ['兽', '野外', '狼', '险地'],
    danger0: 60, spiritualEnergy0: 30, corruption0: 10, stability0: 65,
    discovered0: false,
    boss: 'houshan_shouwang'
  });

  G.define('location', {
    id: 'heshen_du', name: '河神渡',
    desc: '青石镇外一条大河的渡口，河面宽得望不见对岸，水色深碧，漩涡无声地转。渡口立着座半塌的河神庙，每年开春镇上都要凑钱祭河——祭轻了，夏汛便要淹人。摆渡的河婆撑了一辈子船，最忌讳船到河心时回头：她说水底有手，专拽回头的人。',
    tags: ['渡', '水', '香火'],
    danger0: 30, spiritualEnergy0: 20, corruption0: 15, stability0: 75,
    discovered0: false,
    boss: 'heshen'
  });
})();
