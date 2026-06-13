// js/data/social.js — 称号 / 战斗装逼反馈 / 传闻模板 / 残响（Owner: C5）。
//
// 范式：
//   * 称号：G.define('title', {id, name, desc, fame, rumor?, autoCond?})。
//     autoCond 满足即自动授予（月末 + 每战后检查）；无 autoCond 的由本文件反馈逻辑 {titleAdd} 显式授予。
//   * 战斗装逼反馈：G.sys.social.onCombat(fn)，fn({enemyId,result,rating,boss}) 每战后被调。
//   * 传闻模板：fame 阶梯 + 今昔对比 pflag 解锁的镇民议论；在 战胜/称号/突破 三类「出名的时刻」
//     各起一条，pflag `_gs_*` 保证每世每条只说一次。
//   * 残响：称号入 meta.carried.echoes；若本世挣回了前世挣过的名号，镇上最老的人会想起些什么。
//
// ── 本文件登记的咬合点 ──
// 世界 flag：wuguan_zhendong（武馆被玩家当众打出动静；C3 武馆线可引）
// 读取的跨文件状态：
//   pflag wuguan_luodi / shu_gei_wuguan / gei_guo_mailuqian / zhouji_liehu / shou_guo_miao /
//         enshi_sanxiu（npcs.js 落）；su_ji / xianghuo_yinji（C1 births.js 落）
//   v2 pflag chaodu_xin（npcs.js 拾骸超度落 → 超度人称号）/ shuoshu_ting_shu（npcs.js 听说书落 → 今昔闲话）
//   flag  lao_liehu_si_yu_lang / sanxiu_guifu（npcs.js）
//   敌人  六敌四 Boss（ids.js v1）+ sanxiu_jiedao（npcs.js 私有）
//   v2 敌人 humei_yao / ligui / shuigui / hanjiao_you / bali / jianzhong_canling（C4）+
//         六新 Boss laohu_xian / jianzhong_jianling / hantan_jiao / houshan_shouwang / luanzang_li_zu / heshen
//   v2 legacy（C4 Boss onWin 落，本文件 {legacy:..} 读）：hu_an_jing / jianzhong_renzhu / hantan_ding /
//         shouwang_fu / luanzang_an / heshen_ping
//   v2 NPC 好感（npcs.js）：zhujian_weng / shihai_zhe / heshen_po / hupo（新 Boss 倒下时了愿加好感）
// 数值簿记：pflags._c5_press_n 记本世威压降服次数（仿引擎 _kills_ 的数字 pflag 用法）。
// v2 新增 17 称号（见「一、称号」v2 段）；v2 新增 onCombat 反馈 14~22（新道克制 / 新 Boss 险胜与了愿）。
//
// TODO-INTEGRATION: 引擎暂无「月末」bus 信号，镇民议论挂在 combat:end / title:grant / realm:up
//   三类时刻上触发；若 time.js 日后发月末信号，可把 spreadGossip 再挂上去，闲月也能起闲话。
//
// ── 自检十问 ──
// 1标签：交际/善/恶/杀/狼。2易共现：漂亮仗、Boss 倒、突破、称号到手——一切「出名的时刻」。
// 3排斥：无名小卒打的烂仗不起浪；恶名滔天时善人称号绝缘（shaqi 互斥）。
// 4改状态：称号/名望/传闻/NPC 好感/世界变量（恐慌、狼患的人心面）。5后果：称号喂威压判定，
//   威压又喂「不战屈人」——变强被承认，承认又让你更强，闭环；恶名同样滚雪球（煞星→巡使戒心）。
// 6可解释：每条传闻都有出处（看客、樵夫、说书人）；今昔对比全部引自 pflag 记下的旧事。
// 7钩子：wuguan_zhendong 给 C3；称号可作任何事件 cond（{title:"..."}）。8有趣选择：无（纯反馈层），
//   但「报名号/威压跪人」的爽点由它兑现。9服务 build：威压流主粮；杀戮流吃「煞星」，善人流吃「青石善人」。
// 10不暴露：所有文案皆镇民口吻，无数值无机制词；轮回残响只说「想起一个人」，不说轮回。
(function () {
  'use strict';

  // ════════════════════════════════════════════
  // 一、称号（v1 17 枚 + v2 17 枚 = 34 枚）
  // ════════════════════════════════════════════

  // —— 击杀型（kills autoCond，引擎自动计数）——
  G.define('title', {
    id: 'heishan_lielangren',
    name: '黑山猎狼人',
    desc: '一个人猎下三头黑山之狼的人，担得起这个名号。',
    fame: 8,
    rumor: '镇口都在传：那孩子一个人，猎了三头黑山的狼。',
    autoCond: { any: [{ kills: { id: 'yelang', gte: 3 } }, { kills: { id: 'yaolang', gte: 2 } }] }
  });
  G.define('title', {
    id: 'quxie_ren',
    name: '驱邪人',
    desc: '矿里那些不该走动的东西，被你敲碎了四具。提灯入矿的人都念你的好。',
    fame: 10,
    rumor: '挖野矿的汉子们说，矿道里干净多了——有人专杀那些脏东西。',
    autoCond: { kills: { id: 'shigui', gte: 4 } }
  });
  G.define('title', {
    id: 'jingshan_ke',
    name: '靖山客',
    desc: '三条山道因你而太平。脚夫们如今敢走夜路了。',
    fame: 10,
    rumor: '近来山道太平得反常。脚夫们说，是有位煞星把贼人杀怕了。',
    autoCond: { kills: { id: 'shanfei', gte: 3 } }
  });
  G.define('title', {
    id: 'quanya_wuguan',
    name: '拳压武馆',
    desc: '武馆的弟子，败在你手下的已经凑得齐一桌酒席。',
    fame: 12,
    rumor: '铁脊武馆的后生们私下都在传：镇上有个人，他们谁也打不过。',
    autoCond: { kills: { id: 'wuguan_dizi', gte: 5 } }
  });

  // —— Boss 型（bossDead autoCond，引擎在 Boss 倒下时落 flag）——
  G.define('title', {
    id: 'zhanlang_zhe',
    name: '斩狼者',
    desc: '黑山狼王死在你手里。整座黑山的狼嚎，曾为你喑哑过一夜。',
    fame: 25,
    rumor: '黑山的狼嚎停了。狼王的皮，正晾在镇口最高的那根旗杆上。',
    autoCond: { bossDead: 'heishan_langwang' }
  });
  G.define('title', {
    id: 'zhenshi_ren',
    name: '镇尸人',
    desc: '废矿底下压了百年的那位，被你送走了。百十个枉死的矿工，该谢你。',
    fame: 25,
    rumor: '废矿里压了百年的东西，被人超度了。当夜矿山方向，有哭声随风散尽。',
    autoCond: { bossDead: 'kuangdong_shiwang' }
  });
  G.define('title', {
    id: 'chengmiao_zhe',
    name: '澄庙者',
    desc: '山神庙里那尊借脸的脏东西没了。庙里的香，终于又烧得直了。',
    fame: 25,
    rumor: '山神庙的香火又能点了。上山还愿的人，在庙门口排到了日头偏西。',
    autoCond: { bossDead: 'shanmiao_xieying' }
  });
  G.define('title', {
    id: 'taguan_zhe',
    name: '踏馆者',
    desc: '当着满院弟子的面，你赢了那位大师兄。铁脊武馆的脊梁，从此换了人认。',
    fame: 18,
    rumor: '大师兄输了。当着全馆的面，输得心服口服。',
    autoCond: { bossDead: 'dashixiong_boss' }
  });

  // —— 名望型 ——
  G.define('title', {
    id: 'mingdong_qingshi',
    name: '名动青石',
    desc: '在这座镇子，你的名字已经不需要解释。',
    fame: 5,
    rumor: '如今镇上说事，开口总绕不开那个名字。',
    autoCond: { fame: { gte: 60 } }
  });
  G.define('title', {
    id: 'fangyuan_diyi',
    name: '方圆百里第一人',
    desc: '十里八乡，提起「高人」二字，指的就是你。',
    fame: 10,
    rumor: '邻镇来的客商一进茶肆就问：「贵地那位高人，可有缘得见？」',
    autoCond: { fame: { gte: 150 } }
  });

  // —— 境界型 ——
  G.define('title', {
    id: 'qingshizhen_xiushi',
    name: '青石镇的修士',
    desc: '凡人堆里走出来的修行人。这座镇子如今提起你，腰杆都直三分。',
    fame: 8,
    rumor: '「咱们镇，如今也是有修士的了。」镇口老人说这话时，满脸与有荣焉。',
    autoCond: { realm: { gte: 2 } }
  });
  G.define('title', {
    id: 'ludi_shenxian',
    name: '陆地神仙',
    desc: '凡间的路，你已快走到头了。',
    fame: 30,
    rumor: '老人们烧香都改了口——求山神，不如求镇上那一位。',
    autoCond: { realm: { gte: 5 } }
  });

  // —— 轮回型 ——
  G.define('title', {
    id: 'sanshi_zhiren',
    name: '三世之人',
    desc: '没人知道你为什么对这座镇子的沟沟坎坎了如指掌——连几十年前的旧事都像亲眼见过。',
    fame: 5,
    rumor: '那人头一回进山，却像把每条兽道都走过千百遍。邪门。',
    autoCond: { life: { gte: 3 } }
  });

  // —— 阴德善行型（两件善事 + 手上干净）——
  G.define('title', {
    id: 'qingshi_shanren',
    name: '青石善人',
    desc: '周济孤老，守庙护弱，刀下留人。积德的人，山里的东西都让他三分。',
    fame: 10,
    rumor: '「积德的人，山里的东西都让他三分。」庙祝是这么说你的。',
    autoCond: { fame: { gte: 25 }, counter: { id: 'shaqi', lte: 8 },
      any: [
        { all: [{ pflag: 'zhouji_liehu' }, { pflag: 'shou_guo_miao' }] },
        { all: [{ pflag: 'zhouji_liehu' }, { pflag: 'enshi_sanxiu' }] },
        { all: [{ pflag: 'shou_guo_miao' }, { pflag: 'enshi_sanxiu' }] }
      ] }
  });

  // —— 杀戮型（恶名也是名）——
  G.define('title', {
    id: 'shaxing',
    name: '煞星',
    desc: '你走过的路，连狼都嗅得出血腥。恶名也是名——夜里没人敢拦你。',
    fame: 12,
    rumor: '夜里啼哭的娃娃，一听这名号就不敢哭了。',
    autoCond: { counter: { id: 'shaqi', gte: 40 } }
  });

  // —— 评价型（由下方战斗反馈显式授予）——
  G.define('title', {
    id: 'jiuxi_pozhen',
    name: '九息破阵',
    desc: '武馆的阵仗，你九息之内打穿。看客里那声「此子是谁」，传遍了全镇。',
    fame: 15,
    rumor: '「此子是谁？九息破阵？！」武馆墙头看热闹的，当场喊哑了嗓子。'
  });
  G.define('title', {
    id: 'buzhan_quren',
    name: '不战屈人',
    desc: '你不必出手了。你站在那里，对面就会想起所有关于你的传闻。',
    fame: 15,
    rumor: '听说他如今走山路，连兵刃都懒得带了——挡路的自己会让开。'
  });

  // ════════════════════════════════════════════════════════════════════
  // ──────────────────  v2 横向扩展：+17 称号（共 34）  ──────────────────
  // ════════════════════════════════════════════════════════════════════
  //
  // ── v2 本段登记 ──
  // 引用跨文件 id（均在蓝图 §6 钉死表）：
  //   Boss：laohu_xian / jianzhong_jianling / hantan_jiao / houshan_shouwang / luanzang_li_zu / heshen
  //   普通敌：humei_yao / ligui / shuigui / hanjiao_you / bali / jianzhong_canling（含 xunzhong_ke 引）
  //   legacy：hu_an_jing / jianzhong_renzhu / hantan_ding / shouwang_fu / luanzang_an / heshen_ping
  // 读取的跨文件 pflag：chaodu_xin（npcs.js 拾骸超度落，本段善行称号引）
  // 评价型称号（无 autoCond，由下方 onCombat 显式 titleAdd）：wanjian_juechen / xianghuo_huti
  // 自检：每枚称号皆有可感知行为来源 + 传闻；autoCond 均可达（bossDead/kills/legacy/life/tend 组合，
  //   非死号）；阴德与杀业互斥（shaqi 高低分流）；轮回残响用 {life:{gte:5}}。

  // —— 六新 Boss 击破型（bossDead autoCond，引擎在 Boss 倒下时落 _bossdead_ flag）——
  G.define('title', {
    id: 'jinghu_zhe',
    name: '靖狐者',
    desc: '狐婆坳底那尊千年的老祖宗，幻术媚不动你的心。坳里的雾，再不迷人了。',
    fame: 26,
    rumor: '狐婆坳的雾散了。走夜路的人说，路边再没有死去的亲人唤他们的名字。',
    autoCond: { bossDead: 'laohu_xian' }
  });
  G.define('title', {
    id: 'jianzhong_zhi_zhu',
    name: '剑冢之主',
    desc: '断剑崖万剑成的灵，认你为主。从此那一冢断剑的剑意，都听你一人的腕。',
    fame: 26,
    rumor: '断剑崖上的剑鸣停了——不是死了，是认了主。有人说，那一冢的剑，如今跟着一个人走。',
    autoCond: { bossDead: 'jianzhong_jianling' }
  });
  G.define('title', {
    id: 'zhenjiao_zhe',
    name: '镇蛟者',
    desc: '寒潭里盘了千年的那条蛟，被你压回了潭底。潭面上的蓝光，灭了。',
    fame: 30,
    rumor: '寒潭不冒蓝气了。采冰的人说，今年的冰，是这些年最好下凿的。',
    autoCond: { bossDead: 'hantan_jiao' }
  });
  G.define('title', {
    id: 'fushou_zhe',
    name: '伏兽者',
    desc: '后山的兽王在你面前伏下了脖子。群兽换了头领，认的是你。',
    fame: 26,
    rumor: '后山的兽群近来安分得反常。猎户说，是有人把那头兽王，给降住了。',
    autoCond: { bossDead: 'houshan_shouwang' }
  });
  G.define('title', {
    id: 'andun_lizu',
    name: '安乱葬',
    desc: '乱葬岗百年怨气聚成的厉祖，被你超度了。一岗的枯骨，终于睡安稳了。',
    fame: 30,
    rumor: '乱葬岗的鬼火灭了。拾骸的老头给岗上每座坟都重立了幡，说有人替它们了了百年的怨。',
    autoCond: { bossDead: 'luanzang_li_zu' }
  });
  G.define('title', {
    id: 'xihe_zhe',
    name: '息河者',
    desc: '河神渡里收人的那位水神，被你平了。渡口的船，再不必拿活人喂河。',
    fame: 30,
    rumor: '河神渡今年没淹人。河婆撤了渡口的祭台，逢人就念，是哪位后生把河患给息了。',
    autoCond: { bossDead: 'heshen' }
  });

  // —— 新普通敌·击杀型（kills autoCond，引擎统计 _kills_）——
  G.define('title', {
    id: 'yexing_quchong',
    name: '夜行驱祟客',
    desc: '厉鬼、水鬼、狐魅——夜里出没的脏东西，被你驱散了不知多少。走夜路的人，如今念你的名。',
    fame: 14,
    rumor: '入了夜也敢走荒路的，多半身上揣着那位的名号——脏东西见了他，自己就散。',
    autoCond: { any: [{ kills: { id: 'ligui', gte: 3 } }, { kills: { id: 'shuigui', gte: 3 } }, { kills: { id: 'humei_yao', gte: 3 } }] }
  });
  G.define('title', {
    id: 'pohan_ren',
    name: '破寒人',
    desc: '寒潭里的寒蛟幼崽，被你斩了好几条。那股钻骨的寒，伤不了你分毫。',
    fame: 12,
    rumor: '寒潭边采冰的说，水里的小蛟近来少多了——有个不怕冷的，专去潭里寻它们的晦气。',
    autoCond: { kills: { id: 'hanjiao_you', gte: 2 } }
  });
  G.define('title', {
    id: 'qunshou_zhi_zhu',
    name: '群兽之主',
    desc: '后山的熊罴在你面前低过头。山里的野物，渐渐认得你的气味，绕着你走。',
    fame: 13,
    rumor: '后山打猎的撞见过怪事：一头熊罴远远见了那个人，竟掉头钻回了林子。',
    autoCond: { any: [{ kills: { id: 'bali', gte: 2 } }, { tend: { id: 'shouhun', gte: 60 } }] }
  });
  G.define('title', {
    id: 'xunzhong_ke',
    name: '寻冢客',
    desc: '断剑崖那一冢的残灵，被你应了一回又一回的剑。那些不肯散的剑意，渐渐认得你的剑路。',
    fame: 13,
    rumor: '砍柴的说，断剑崖近来夜夜剑鸣——不是哭了，是有人在跟那一冢的剑，一招一招地对。',
    autoCond: { kills: { id: 'jianzhong_canling', gte: 3 } }
  });
  G.define('title', {
    id: 'qianmian_ke',
    name: '千面客',
    desc: '狐婆坳的幻术、戏台上的脸谱，到你手里都成了惑人的本事。没人猜得透你到底是谁。',
    fame: 13,
    rumor: '镇上来了个怪人，谁都觉得跟他相熟，散了场又谁也想不起他长什么样。',
    autoCond: { any: [{ kills: { id: 'humei_yao', gte: 4 } }, { tend: { id: 'humei', gte: 60 } }] }
  });

  // —— 御剑评价型（无 autoCond，由 onCombat 显式授予；剑冢残灵或剑灵共鸣的漂亮仗触发）——
  G.define('title', {
    id: 'wanjian_juechen',
    name: '万剑绝尘',
    desc: '你一动念，剑气便成了阵。看过那一战的人说，那不是用剑——是剑听你的。',
    fame: 16,
    rumor: '断剑崖那一场，看热闹的樵夫至今说不清：那么多道剑光，到底是从哪儿冒出来的。'
  });

  // —— 香火护身型（无 autoCond，由 onCombat 净邪漂亮仗触发）——
  G.define('title', {
    id: 'xianghuo_huti',
    name: '香火护体',
    desc: '阴邪近不得你的身。你走过的地方，邪祟自己退避，香客说你眉心有光。',
    fame: 16,
    rumor: '上香的人传得神乎其神：那位站在庙里，神像前的香，烧得比谁都直。'
  });

  // —— 新地点收束型（多尊新 Boss 伏诛，方圆诸患皆靖）——
  G.define('title', {
    id: 'bafang_jing',
    name: '八方靖',
    desc: '寒潭、狐坳、乱葬、河渡……这方圆百里的祸患，被你一处处平了。凡间的夜，因你而太平。',
    fame: 40,
    rumor: '十里八乡的人如今睡得着觉了。他们说，是有位活神仙，把藏在山水里的脏东西，一处处都收拾干净了。',
    autoCond: { any: [
      { all: [{ legacy: 'hu_an_jing' }, { legacy: 'luanzang_an' }, { legacy: 'heshen_ping' }] },
      { all: [{ legacy: 'hantan_ding' }, { legacy: 'shouwang_fu' }, { legacy: 'jianzhong_renzhu' }] },
      { all: [{ legacy: 'heshen_ping' }, { legacy: 'hantan_ding' }, { legacy: 'luanzang_an' }] }
    ] }
  });

  // —— 阴德善行·超度型（积阴德 + 手上干净）——
  G.define('title', {
    id: 'chaodu_ren',
    name: '超度人',
    desc: '无主的骸骨，被你一副副收了、念了往生。乱葬岗的鬼火，因你少了许多。',
    fame: 12,
    rumor: '拾骸的老头逢人就说，乱葬岗上多了个心善的后生，跟着他给死人收骨立幡。',
    autoCond: { pflag: 'chaodu_xin', counter: { id: 'shaqi', lte: 12 } }
  });

  // —— 杀业升级型（比「煞星」更重的血手；与阴德称号靠 shaqi 互斥）——
  G.define('title', {
    id: 'xueye_shashen',
    name: '血夜煞神',
    desc: '你身上的血腥，连乱葬岗的枯骨都要偏头避让。这名号，是用命堆出来的。',
    fame: 16,
    rumor: '提起那个名字，连说书人都搁下了惊堂木——有些段子，说出来要折寿的。',
    autoCond: { counter: { id: 'shaqi', gte: 70 } }
  });

  // —— 轮回残响·深世型（活过五世的人，对这方天地的因果了如指掌）——
  G.define('title', {
    id: 'lunhui_ke',
    name: '轮回客',
    desc: '这座镇子换了几茬人，山水却都还认得你。没人说得清，你究竟在这里活过几回。',
    fame: 8,
    rumor: '镇上最老的人见了那身影，浑身一激灵——他发誓，那张脸，他打小就见过，几十年都没变。',
    autoCond: { life: { gte: 5 } }
  });

  // ════════════════════════════════════════════
  // 二、战斗装逼反馈（G.sys.social.onCombat）
  // ════════════════════════════════════════════

  // 1) 狼属：漂亮仗 → 老猎户高看一眼（人还在的话）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win') return;
    if (p.enemyId !== 'yelang' && p.enemyId !== 'yaolang') return;
    if (p.rating === '碾压' || p.rating === '秒杀') {
      G.fx([{ branch: { cond: { npcAlive: 'lao_liehu' }, then: [
        { npcFavAdd: { id: 'lao_liehu', n: 4 } },
        { log: { t: '老猎户听人说了你猎狼的利落手法，眯眼笑了：「比他爹强。」', style: '世界' } }
      ] } }]);
    }
  });

  // 2) 狼属威压降服 → 兽类记住了你的气息
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'press') return;
    if (p.enemyId !== 'yelang' && p.enemyId !== 'yaolang' && p.enemyId !== 'heishan_langwang') return;
    G.fx([
      { wvarAdd: { wolfThreat: -2 } },
      { rumorAdd: { t: '进山的人说，黑山的狼如今见了某道身影，自己就伏低了耳朵。', fame: 1 } }
    ]);
  });

  // 3) 劫道散修威压跪服 → 当年的买路钱，双手奉还（今昔对比的现场版）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'sanxiu_jiedao' || p.result !== 'press') return;
    G.fx([
      { flagSet: { id: 'sanxiu_guifu' } },
      { branch: { cond: { pflag: 'gei_guo_mailuqian' }, then: [
        { money: 20 },
        { log: { t: '「当年那二十两，小的一直替您存着！」他把钱双手奉还过头顶。', style: '吉' } },
        { rumorAdd: { t: '那个剪径的散修，把收过的买路钱原样还了回去——跪着还的。', fame: 3 } }
      ], else: [
        { rumorAdd: { t: '剪径的散修在山道上冲人磕头求饶，磕得额头见了血。', fame: 2 } }
      ] } }
    ]);
  });

  // 4) 山匪威压跪服 → 镇民睡得着觉了
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'shanfei' || p.result !== 'press') return;
    G.fx([
      { wvarAdd: { villageFear: -2 } },
      { rumorAdd: { t: '听说山里的贼人见了那位，刀都没敢拔，纳头便拜。', fame: 1 } }
    ]);
  });

  // 5) 秒杀武馆弟子 → 「九息破阵」+ 武馆震动
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'wuguan_dizi' || p.result !== 'win') return;
    if (p.rating === '秒杀') {
      G.fx([
        { flagSet: { id: 'wuguan_zhendong' } },
        { npcFavAdd: { id: 'dashixiong', n: 6 } },
        { titleAdd: 'jiuxi_pozhen' }
      ]);
    } else if (p.rating === '碾压') {
      G.fx([
        { flagSet: { id: 'wuguan_zhendong' } },
        { npcFavAdd: { id: 'dashixiong', n: 4 } },
        { rumorAdd: { t: '武馆的弟子让人当场放翻，听说馆主的脸黑了三天。', fame: 2 } }
      ]);
    }
  });

  // 6) 输给武馆弟子 → 弱小被记入旧账（今昔对比的原料）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'wuguan_dizi' || p.result !== 'lose') return;
    G.fx([
      { pflagSet: { id: 'shu_gei_wuguan' } },
      { npcFavAdd: { id: 'dashixiong', n: -2 } },
      { rumorAdd: { t: '又一个不自量力的后生，让武馆弟子拎着后领扔出了大门。', fame: 0 } }
    ]);
  });

  // 7) 胜大师兄 → 他亲手给你开门；若有当年落第的旧账，全镇都翻出来说
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'dashixiong_boss' || (p.result !== 'win' && p.result !== 'press')) return;
    G.fx([
      { npcFavAdd: { id: 'dashixiong', n: 15 } },
      { branch: { cond: { any: [{ pflag: 'wuguan_luodi' }, { pflag: 'shu_gei_wuguan' }] }, then: [
        { rumorAdd: { t: '「当年他连武馆的门槛都迈不进去。」「今天，是大师兄亲手给他开的门。」', fame: 6 } }
      ], else: [
        { rumorAdd: { t: '武馆换了说法：大师兄之上，还有一位。', fame: 4 } }
      ] } }
    ]);
  });

  // 8) Boss 险胜 → 悲壮的传奇；苦战 → 长夜的传说
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (!p.boss || p.result !== 'win') return;
    if (p.rating === '险胜') {
      G.fx([{ rumorAdd: { t: '他是爬着下的山。可那东西，死在了他后头。镇上人说起这事，声音都放轻。', fame: 4 } }]);
    } else if (p.rating === '苦战') {
      G.fx([{ rumorAdd: { t: '那一夜山里的动静就没停过。天亮之后，只有他一个人走了出来。', fame: 3 } }]);
    }
  });

  // 9) 狼王倒下 → 老猎户的一生有了交代（人不在了，就去坟前）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'heishan_langwang' || (p.result !== 'win' && p.result !== 'press')) return;
    if (p.result !== 'win') return;
    G.fx([{ branch: { cond: { npcAlive: 'lao_liehu' }, then: [
      { npcFavAdd: { id: 'lao_liehu', n: 20 } },
      { log: { t: '老猎户摸着狼王的皮，手一直在抖。那晚他喝得大醉，哭了半宿。', style: '世界' } }
    ], else: [
      { log: { t: '你把狼王的一颗獠牙，埋在了老猎户的坟前。山风呜呜，像谁应了一声。', style: '因果' } }
    ] } }]);
  });

  // 10) 碾压尸鬼 → 矿上人心安定
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'shigui' || p.result !== 'win') return;
    if (p.rating !== '碾压' && p.rating !== '秒杀') return;
    G.fx([
      { wvarAdd: { villageFear: -2 } },
      { rumorAdd: { t: '挖野矿的说，矿道里那些脏东西，如今见了生人的火把反倒往暗处缩。', fame: 1 } }
    ]);
  });

  // 11) 了结药人 → 回春堂掌柜的心事
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'yaoren' || p.result !== 'win') return;
    G.fx([{ branch: { cond: { npcAlive: 'yaopu_laoban' }, then: [
      { npcFavAdd: { id: 'yaopu_laoban', n: 5 } },
      { log: { t: '回春堂掌柜听说你毁了那药人，盯着柜台出了半天神：「造孽啊。」', style: '丹' } }
    ] } }]);
  });

  // 12) 名头越大，跌得越响 → 高名望者战败折名
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'lose' || p.boss) return;
    if (G.player.fame < 80) return;
    G.fx([{ rumorAdd: { t: '「名头再响，也有阴沟里翻船的时候。」这话最近在茶肆里传得起劲。', fame: -5 } }]);
  });

  // 13) 威压降服计数 → 三次不战而胜，授「不战屈人」
  //（数字簿记仿引擎 _kills_ 的 pflag 用法）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'press') return;
    var n = (G.player.pflags._c5_press_n || 0) + 1;
    G.player.pflags._c5_press_n = n;
    if (n >= 3) G.fx([{ titleAdd: 'buzhan_quren' }]);
  });

  // ───────────── v2：新道 / 新敌 / 新 Boss 的装逼反馈（≥8 条） ─────────────

  // 14) 御剑漂亮仗 → 「万剑绝尘」+ 剑冢残灵畏其剑意（克制 + 评价型称号）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win') return;
    // 对剑冢残灵的碾压/秒杀，或御剑小成者对剑灵 Boss 的胜利 → 剑意惊人
    var jianFeat = (p.enemyId === 'jianzhong_canling' && (p.rating === '碾压' || p.rating === '秒杀')) ||
      (p.enemyId === 'jianzhong_jianling' && G.cond({ daoStage: { id: 'yujian', gte: 2 } }));
    if (!jianFeat) return;
    G.fx([
      { titleAdd: 'wanjian_juechen' },
      { tendAdd: { yujian: 3 } },
      { rumorAdd: { t: '断剑崖那一战，看客只记得满天剑光。「人在剑里，还是剑在人里？」至今没人说得清。', fame: 3 } }
    ]);
  });

  // 15) 香火净邪漂亮仗 → 「香火护体」+ 邪物退避（克制 undead/邪 + 评价型称号）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win') return;
    var xie = (p.enemyId === 'ligui' || p.enemyId === 'shuigui' || p.enemyId === 'humei_yao');
    if (!xie) return;
    if (p.rating !== '碾压' && p.rating !== '秒杀') return;
    if (!G.cond({ tend: { id: 'xianghuo', gte: 40 } })) return;
    G.fx([
      { titleAdd: 'xianghuo_huti' },
      { wvarAdd: { ghostQi: -3 } },
      { rumorAdd: { t: '那些夜里害人的脏东西，近来见了某道身影竟自己散了。香客说，那人眉心有香火护着。', fame: 2 } }
    ]);
  });

  // 16) 兽魂震慑熊罴/兽王 → 群兽伏低，山里传开了「兽王」的名（克制兽 + 传闻）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'bali' && p.enemyId !== 'houshan_shouwang') return;
    if (p.result !== 'win' && p.result !== 'press') return;
    G.fx([
      { branch: { cond: { tend: { id: 'shouhun', gte: 30 } }, then: [
        { tendAdd: { shouhun: 2 } },
        { log: { t: '那畜生倒下前，喉咙里发出的不是嚎，是臣服的呜咽。它认了你这个新主。', style: '异象' } }
      ] } },
      { rumorAdd: { t: '后山的猎户说，山里的野物近来见了那个人都绕道走——像是换了个谁也惹不起的头领。', fame: 2 } }
    ]);
  });

  // 17) 寒蛟幼/寒潭蛟前的寒毒压制 → 寒道克续航的现场（克制 + 今昔可印证）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.enemyId !== 'hanjiao_you' && p.enemyId !== 'hantan_jiao') return;
    if (p.result !== 'win') return;
    G.fx([
      { branch: { cond: { tend: { id: 'handu', gte: 40 } }, then: [
        { tendAdd: { handu: 2 } },
        { log: { t: '它的寒息冻不住你——你身上的寒，比它更深。蛟在自己的寒里，慢慢沉了下去。', style: '异象' } }
      ], else: [
        { log: { t: '你避开它的寒息，寻着空子一击得手。潭面上的蓝光，黯了一瞬。', style: '战' } }
      ] } }
    ]);
  });

  // 18) 媚惑控场胜人形敌 → 狐魅一道的诡谲（克制人形 + 传闻）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win') return;
    if (!G.cond({ daoStage: { id: 'humei', gte: 2 } })) return;
    var renxing = (p.enemyId === 'shanfei' || p.enemyId === 'wuguan_dizi' || p.enemyId === 'humei_yao' || p.enemyId === 'sanxiu_jiedao');
    if (!renxing) return;
    if (p.rating !== '碾压' && p.rating !== '秒杀') return;
    G.fx([
      { tendAdd: { humei: 2 } },
      { rumorAdd: { t: '跟那人动过手的都说不清自己怎么输的——好像刀砍出去，砍的是自己人。邪门。', fame: 2 } }
    ]);
  });

  // 19) 新 Boss 险胜 → 各有各的悲壮（按 Boss 定制的「长夜传说」）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (!p.boss || p.result !== 'win' || p.rating !== '险胜') return;
    var line = {
      laohu_xian: '狐婆坳的雾散尽时，他正靠着坳口的老树喘气。那千年的狐祟，死在了他的真心里。',
      jianzhong_jianling: '断剑崖上一地碎剑，他在中间站着，浑身是血，却像终于握住了什么。',
      hantan_jiao: '寒潭的水面结了又化。他从冰窟窿里爬出来，怀里抱着那条蛟最后吐出的一口寒珠。',
      houshan_shouwang: '后山静了。群兽伏在一圈，中间躺着旧的兽王，站着新的——他拄着刀，站都站不稳。',
      luanzang_li_zu: '乱葬岗的鬼火一夜烧尽。天亮时拾骸的老头找到他，跪在最大的那座坟前，已哭不出声。',
      heshen: '河神渡的水退了三尺。他被河婆从浅滩里拖上来时，手里还攥着那柄斩过水神的断剑。'
    }[p.enemyId];
    if (!line) return;
    G.fx([{ rumorAdd: { t: line, fame: 5 } }]);
  });

  // 20) 新 Boss 倒下 → 对应 NPC 的了愿时刻（人物剧情收束）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (!p.boss || p.result !== 'win') return;
    if (p.enemyId === 'jianzhong_jianling') {
      G.fx([{ branch: { cond: { npcAlive: 'zhujian_weng' }, then: [
        { npcFavAdd: { id: 'zhujian_weng', n: 20 } },
        { log: { t: '铸剑老人抚着崖上那一冢断剑，老泪纵横：「它们等的人，到底是来了。」', style: '因果' } }
      ] } }]);
    } else if (p.enemyId === 'luanzang_li_zu') {
      G.fx([{ branch: { cond: { npcAlive: 'shihai_zhe' }, then: [
        { npcFavAdd: { id: 'shihai_zhe', n: 20 } },
        { log: { t: '拾骸老者给岗上每座坟重新立了幡。他说，几十年了，今夜的觉，睡得最沉。', style: '因果' } }
      ] } }]);
    } else if (p.enemyId === 'heshen') {
      G.fx([{ branch: { cond: { npcAlive: 'heshen_po' }, then: [
        { npcFavAdd: { id: 'heshen_po', n: 20 } },
        { log: { t: '河婆撤了渡口的祭台，对着河水拜了三拜：「这一渡的人，往后不用再喂你了。」', style: '因果' } }
      ] } }]);
    } else if (p.enemyId === 'laohu_xian') {
      G.fx([{ branch: { cond: { npcAlive: 'hupo' }, then: [
        { npcFavAdd: { id: 'hupo', n: 15 } },
        { log: { t: '狐婆坐在坳口晒太阳，身边一只狐都没有了。她冲你笑：「了了。我这把老骨头，也能安生了。」', style: '平' } }
      ] } }]);
    }
  });

  // 21) 新 Boss 威压降服 → 凡间的活神仙（不战屈人的更高境界 + 各地传闻）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (!p.boss || p.result !== 'press') return;
    var newBoss = (p.enemyId === 'laohu_xian' || p.enemyId === 'jianzhong_jianling' ||
      p.enemyId === 'hantan_jiao' || p.enemyId === 'houshan_shouwang' ||
      p.enemyId === 'luanzang_li_zu' || p.enemyId === 'heshen');
    if (!newBoss) return;
    G.fx([
      { fame: 6 },
      { rumorAdd: { t: '那东西在他面前竟没敢动手——伏低了，散了，退了。人们说，这哪是修士，分明是位活神仙。', fame: 4 } }
    ]);
  });

  // 22) 剑冢残灵 / 寒蛟幼等新精怪战败折损 → 凡人莫逞强的告诫（失败也有回响）
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'lose' || p.boss) return;
    var newElite = (p.enemyId === 'jianzhong_canling' || p.enemyId === 'hanjiao_you' ||
      p.enemyId === 'ligui' || p.enemyId === 'humei_yao');
    if (!newElite) return;
    G.fx([{ rumorAdd: { t: '又有人不信邪，往那些不干净的地界去了。回来的，只剩半条命和一脸的后怕。', fame: 0 } }]);
  });

  // ════════════════════════════════════════════
  // 三、传闻模板：fame 阶梯 + 今昔对比的镇民议论
  //（在战胜 / 得称号 / 突破 这些「出名的时刻」起话头，每世每条只说一次）
  // ════════════════════════════════════════════
  var GOSSIP = [
    { id: 'g_chuming', cond: { fame: { gte: 30 } },
      t: '镇口老槐树下，如今常有人提起你的名字。' },
    { id: 'g_wuguan_jiuzhang', cond: { fame: { gte: 30 }, pflag: 'wuguan_luodi' },
      t: '「当年他连武馆的入门测试都没过。」茶肆里，有人翻出了旧话，满座唏嘘。' },
    { id: 'g_mailuqian', cond: { fame: { gte: 60 }, pflag: 'gei_guo_mailuqian' },
      t: '「他还给劫道的交过买路钱呢。」「放屁——如今那贼见了他就磕头！」' },
    { id: 'g_bingyangzi', cond: { fame: { gte: 60 }, pflag: 'su_ji' },
      t: '「就是小时候连汤药钱都凑不齐的那个病秧子？」「就是他。」' },
    { id: 'g_tuhu', cond: { fame: { gte: 60 }, birth: 'tuhu_xuetu' },
      t: '「肉案上出来的学徒罢了。」「可他如今宰的，早就不是猪了。」' },
    { id: 'g_zayi', cond: { fame: { gte: 60 }, birth: 'wuguan_zayi' },
      t: '「当年在武馆扫地倒水的杂役——你再说一遍，他如今是谁？」' },
    { id: 'g_liehujia', cond: { fame: { gte: 60 }, birth: 'liehu_zhizi' },
      t: '「猎户家的种，终归是猎户家的种。」镇口的老人说这话时，与有荣焉。' },
    { id: 'g_yaotong', cond: { fame: { gte: 60 }, birth: 'yaopu_xuetu' },
      t: '「回春堂那个碾药的小学徒？当年连戥子都拿不稳的那个？」' },
    { id: 'g_miaoli', cond: { fame: { gte: 60 }, pflag: 'xianghuo_yinji' },
      t: '「庙里捡来的那孩子，果然是有来历的。」香客们说得言之凿凿。' },
    { id: 'g_shaqi', cond: { fame: { gte: 60 }, counter: { id: 'shaqi', gte: 30 } },
      t: '如今茶肆里提起那个名字，总有一瞬间，没人接话。' },
    { id: 'g_xingshang', cond: { fame: { gte: 100 } },
      t: '外乡的行脚商进镇，先打听的不是宿头，是你的传说。' },
    { id: 'g_shuoshu', cond: { fame: { gte: 160 } },
      t: '茶肆的说书人新编了你的段子。惊堂木一拍，满堂叫好。' },
    { id: 'g_liehu_fen', cond: { flag: 'lao_liehu_si_yu_lang', bossDead: 'heishan_langwang' },
      t: '老猎户坟头多了颗狼王的獠牙。没人看见是谁放的，也没人需要问。' },
    { id: 'g_gushiren', cond: { life: { gte: 2 }, fame: { gte: 80 } },
      t: '镇上最老的人说，你让他想起几十年前的一个人。叫什么，他想不起来了。',
      fx: [{ tendAdd: { yinguo: 2 } }] },
    // ── v2：新道 / 新 Boss / 说书人放大器 的今昔对比 ──
    { id: 'g_ting_zijishu', cond: { fame: { gte: 60 }, pflag: 'shuoshu_ting_shu' },
      t: '「你听过说书的讲那段没有？」「讲谁的？」「就……坐你旁边那位的。」满座哗然。' },
    { id: 'g_jianke', cond: { fame: { gte: 80 }, daoStage: { id: 'yujian', gte: 2 } },
      t: '有人说在断剑崖见过他御剑——一道人影，身后跟着一片不肯落地的剑光。' },
    { id: 'g_xianghuo', cond: { fame: { gte: 80 }, daoStage: { id: 'xianghuo', gte: 2 } },
      t: '上香的妇人传得神乎其神：那位过庙不拜，神像前的香却替他自己直了腰。' },
    { id: 'g_huoshen', cond: { fame: { gte: 60 }, daoStage: { id: 'humei', gte: 2 } },
      t: '「狐婆坳养出来的，到底不一样。」「嘘——别让他听见，谁知道他这会儿是不是你二叔。」' },
    { id: 'g_zhushui', cond: { bossDead: 'heshen' },
      t: '河神渡的老人们改了口：从前求河神保平安，如今烧香，求的是那位莫要走远。' },
    { id: 'g_anbafang', cond: { title: 'bafang_jing' },
      t: '走方的货郎把这方圆百里的太平，编成了顺口溜，一路唱到了邻县去。' }
  ];

  function spreadGossip() {
    var p = G.player;
    if (!p || p.dead || !G.world) return;
    for (var i = 0; i < GOSSIP.length; i++) {
      var g = GOSSIP[i];
      if (p.pflags['_gs_' + g.id]) continue;
      if (!G.cond(g.cond)) continue;
      G.fx([{ pflagSet: { id: '_gs_' + g.id } }, { rumorAdd: { t: g.t, fame: g.fame || 0 } }]
        .concat(g.fx || []));
      return; // 一次只起一条闲话，免得刷屏
    }
  }

  // 出名的时刻：打了胜仗 / 得了称号 / 破了境界
  G.sys.social.onCombat(function (p) {
    if (p.result === 'win' || p.result === 'press') spreadGossip();
  });
  G.bus.on('title:grant', spreadGossip);
  G.bus.on('realm:up', spreadGossip);

  // ════════════════════════════════════════════
  // 四、残响：前世挣过的名号，这一世又挣了回来
  // ════════════════════════════════════════════
  G.bus.on('title:grant', function (payload) {
    var p = G.player;
    if (!p || p.dead || !G.meta) return;
    var hasOld = G.meta.carried.echoes.some(function (e) {
      return e.title === payload.titleId && e.life < p.lifeIndex;
    });
    if (!hasOld) return;
    G.fx([
      { tendAdd: { yinguo: 2 } },
      { rumorAdd: { t: '「这名号……上一辈子，也有人担过。」镇上最老的人眯起眼，没再说下去。', fame: 2 } },
      { log: { t: '听到这话时，你心口莫名一烫，像有什么旧东西应了一声。', style: '因果' } }
    ]);
  });
})();
