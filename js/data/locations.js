// js/data/locations.js — 地点数据（Owner: C2，全部 8 地点完整化）。
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
// 标签咬合（给 C3 prefer.locTags 用）：
//   山神庙=阴邪/香火/夜/因果；矿洞=矿/阴邪/险地/隐秘；黑山深处=险地/狼/隐秘/血；
//   黑山外围=野外/狩猎/狼/险地；武馆=体/修炼；药铺=药/市集；青石镇=市集/交际/劳作；家中=修炼/隐秘/梦。
//
// ── 自检十问 ──
// 1标签：见各地 tags。2易共现：黑山↔狼/血/狩猎，庙↔阴邪/香火/因果，矿↔隐秘/险，武馆↔体，药铺↔药。
// 3排斥：镇中安稳与深山凶险互斥；矿洞与雷雨类天象内容互斥（地下）。
// 4改状态：danger/corruption 被事件与世界 tick 推动；庙 corruption 越高后殿越开。
// 5后果：danger 抬高环境事件概率；corruption≥45 解锁庙线 outcome（行动侧已接）。
// 6可解释：每处都有来历（矿因塌方废弃、庙神像被凿、武馆大师兄压馆）。
// 7钩子：深处/矿洞 discovered0:false 留探索感；井水冬暖夏凉暗示家中地气；庙后殿门从没人见开过。
// 8有趣选择：去险地搏机缘还是守镇里攒钱。9服务 build：灵脉养修炼，阴邪庙养雷/因果，黑山喂血与体。
// 10不暴露：描述只写见闻与传言，不提任何变量名与数值。
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
})();
