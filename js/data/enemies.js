// js/data/enemies.js — 敌人数据（Owner: C4）。23 个敌人全部完整：12 普通 + 10 Boss
//   （v1：6 普通 + 4 Boss；v2：6 普通 + 6 Boss）。另有 C5 私有敌不在本文件。
//
// enemy schema 见契约 §9。traits 由 combat.js 解释（regen:n / pack:n / undead / nonLethal / phys_resist:f），
// lines 五句台词缺一不可（appear/hurt/fear/death/submit），loot.money 为 [min,max]。
// intelMem：玩家持有该记忆 → 战前弱点提示 + 伤害+15%。
//
// ── 跨文件 id 登记（本文件引用/输出）──
// 引用记忆（C1 并行定义，集成期落地）：mem_intel_langwang / mem_intel_shiwang /
//   mem_intel_dashixiong / mem_intel_xieying（v1 四 Boss intelMem，命名钉死）；
//   v2 六 Boss intelMem：mem_intel_laohu / mem_intel_jianling / mem_intel_hanjiao /
//   mem_intel_shouwang / mem_intel_lizu / mem_intel_heshen（蓝图 §6 钉死，C1 已实现）。
// 死亡/战败记忆（C1 已定义 mem_death_<敌id>，引擎按 deathCause 自动授予；本文件不写 onWin）。
// 本文件新增物品（v1）：langwang_xinxue / yinsui / quanpu_canye / xianghui_yu。
// 本文件新增物品（v2 Boss 战利品，均自带 use 消费点，不与他人物品撞 id）：
//   laohu_neidan（老狐仙内丹·破幻）/ jianling_jingpo（剑灵精魄·剑气）/ jiaolong_han_zhu（蛟龙寒珠·御寒）/
//   shouwang_jin（兽王筋·炼体）/ lizu_yuanpo（厉祖怨魄·净化向材料，自带焚化 use）/ hetu_can（河图残卷·镇水）。
// v2 普通敌/Boss 的其余战利品复用他人已定义且已有消费点的物品（不重复定义）：
//   hu_meifen（狐媚粉,C5）/ huzhi（狐脂,C2）/ hanjing 寒萤石(C2,回春堂收)/ hansui_zhu 寒髓珠(C3)/
//   jianjue_canpian 剑诀残篇(C2)/ jianzhong_jue_can 剑冢诀残(C3)/ shouwang_zhua 兽王爪(C2,回春堂收)/
//   xiangyuan_zhu 香愿珠(C3)/ xianghui_yu 香灰玉(本文件)/ ku_hun_fan 枯魂幡(C5)/ zhiqian 纸钱(C2)。
// 畏惧元素与十道咬合：v1 五道走 combat.js DAO_ELEMENT（血剑→血/剑、雷法→雷、炼体→体、丹药→药、因果→因果）；
//   v2 五道（寒/兽/香火/狐/剑）不在引擎元素表，其克制由 daos.js 钩子 cond（巢穴地点代位）实装，
//   敌人 fearOf 仍驱动 lines.fear 叙事与 v1 元素畏缩（如寒蛟惧雷、厉鬼/河神惧雷火）。
//   尸鬼/尸王/厉鬼/河神等 undead/邪自动惧雷火；「火/破幻/兽魂/香火/御剑」作叙事弱点写在 fearOf。
//
// ── 调参表（蒙特卡洛 3000 局/格实测；公式见契约 §16：伤害=max(1,atk×倍率−def)±15%，
//    玩家 atk=膂力×3+武器、def=体魄；AI=技能循环+低血守势。「全构筑」=该道三异象+技能，
//    「情报」=对应 mem_intel_×（伤害+15%）。临时沙盘脚本复刻 combat.js 全管线后已删）──
// 基准人：L1=第1世凡身 li4 ti3 武器4（atk16 hp64）；初期=炼气初期 li5 ti4 铁剑（atk21 hp118）；
//          中期=炼气中期 li6 ti5（atk24 hp150）；后期=炼气后期 li7 ti5（atk27 hp172）。
// 野狼   ｜ L1 两回合稳吃（pack:2 群袭只挠破皮）；引气境即可威压劝退——第一个装逼里程碑。
// 妖狼   ｜ L1 带刀 ≈90%、5回合掉六成血（第一道墙）；无武器弱出身（如病弱孤儿）0%；初期碾压。
// 山匪   ｜ L1 ≈100%、4回合掉三成血。钱袋子；惧血与威压（「看清剑痕跪地求饶」的素材位）。
// 尸鬼   ｜ L1 物理 0%（def5+再生5 磨不死）——「刀剑无用」第一课；初期稳过，雷法异象更快。
// 药人   ｜ L1 0%（再生10 检定墙）；初期任意构筑 ≈100%，丹道近乎无伤（战末血 93%）。
// 武馆弟子｜ L1 带刀稳赢掉四成血；武馆杂役空手 8 回合掉六成血险赢；nonLethal 败者只伤不死。
// 狼王   ｜ L1/中期白板 0%（必死，3~4 回合被撕碎）；中期血剑全构筑+情报 ≈47%（设计五五开）；
//        ｜ 后期血剑 ≈85%。旁路：中期炼体 ≈36%、中期因果+死忆 ≈75%、后期雷法 ≈65%、丹道 0%。
//        ｜ 筑基+名望百余可威压臣服（boss 阈值 160，惧威压 −20）。
// 尸王   ｜ 物理墙：后期纯物理 0%（def12+再生8+免流血）；后期雷法全构筑+情报 ≈95%（8回合）——
//        ｜ 雷蚀 dot/雷击直伤不吃 def 不吃物抗，是设计正解；中期雷法 0%（差第三异象与境界）。
// 大师兄 ｜ 白板 0%；中期炼体全构筑+情报 100%（9回合掉五成血，复仇爽点）；中期血剑可一搏。
//        ｜ nonLethal=败了养伤两月再来（长梯子）。圆满+名望60 可威压让路（阈值140，惧威压）。
// 邪影   ｜ 硬克血剑（后期血剑全构筑 0%：物抗0.7+免流血）；后期雷法 ≈93%（8.5回合）；
//        ｜ 后期因果+死忆 ≈60%（23 回合 11% 血的还债长账）；无死忆因果 0%。spd12 基本逃不掉。
//
// ── v2 调参（同口径粗算；普通敌 hp25~70；Boss hp300~520 atk26~32，照契约 §16 与 spec tier 表）──
// 普通敌：狐魅 hp32 atk9（人形小妖，惧雷/破幻，御剑/雷法照面即破）；厉鬼 hp55 atk12 undead 免流血
//   （物理磨不死，香火/雷火直伤是正解）；水鬼 hp40 atk9 拖拽（命中降 spd 表达为 spd 低、缠斗，惧香火/火）；
//   寒蛟幼 hp60 atk11 regen:4（续航墙——寒冰滚 dot/雷法直伤压回血，惧雷/火）；
//   熊罴 hp58 atk16 pack:1 蛮力（高 atk 硬桩，惧威压/兽魂震慑，炼体硬抗/兽魂震克）；
//   剑冢残灵 hp50 atk13 phys_resist:0.5（剑气反震→以物抗近似，nonLethal 试剑不杀，惧御剑共鸣）。
// Boss（第一世白板多半必死，轮回带 intelMem+对口道可破）：
//   老狐仙 hp300 atk26 tier4（幻术媚惑，惧破幻——御剑/雷法异象+情报破；humei 自身亦克其同类媚术）；
//   剑冢剑灵 hp340 atk28 def10 tier4（高 def，御剑多段破防/血剑爆发解，惧御剑认主）；
//   寒潭蛟 hp480 atk30 regen:6 tier5（寒息冰封+回血，雷法直伤/寒冰滚 dot 压续航，惧雷/火）；
//   后山兽王 hp360 atk30 pack:1 tier4（蛮力压迫，兽魂震慑/炼体站撸，惧威压/兽魂）；
//   乱葬厉祖 hp500 atk28 undead 免流血 tier5（百年怨气，香火净化/雷火直伤/因果，惧香火/雷火）；
//   河神 hp460 atk30 regen:5 tier5（水祸淹溺+回血，香火还愿/御剑斩水，惧香火/雷火）。
// 设计意图实测向：寒蛟被寒冰 dot+雷法克（regen 压成净亏）；兽王被兽魂叠层/炼体克（pack 群兽震慑）；
//   厉祖/河神被香火净邪直伤克（undead/邪回血被 cenemyHp 破）；老狐仙被御剑/雷破幻克；剑灵被御剑/血剑克。
//   undead/邪自动惧雷火 → 雷法对厉祖/河神/厉鬼亦有效（保底通道，不强求新道）。
//
// ── 自检十问（对本文件整体）──
// 1标签：v1 狼/匪/尸/药/武/邪六类 + v2 狐/鬼/水/寒/兽/剑六类，各归其地
//   （黑山/官道/矿洞/药铺线/武馆/山神庙 + 狐婆坳/乱葬岗/河神渡/寒潭/后山兽径/断剑崖）。
// 2易共现：高 wolfThreat 出狼、高 mineInstability 出尸、高 ghostQi 出邪/厉鬼、血腥味重引兽、
//   寒地出寒蛟、葬地出厉鬼、渡口出水鬼、狐坳夜出狐魅。
// 3排斥：镇内市集无凶兽；nonLethal 武馆系/剑冢残灵（试剑）不致死。4改状态：战利品/击杀计数/名望/Boss 死亡 flag。
// 5后果：杀狼压狼患涨血腥；Boss 亡则一方平靖（legacy/onWin 由行动·事件侧落，本文件不写 onWin）；
//   内丹/精魄/寒珠/兽筋/怨魄/河图是对口构筑奖励，皆自带消费 use。
// 6可解释：每个敌人都有来路（狐因坳成精、厉鬼因葬地怨聚、水鬼因溺、寒蛟因潭寒、熊罴因兽径、残灵因剑冢）。
// 7钩子：intelMem 十枚给 C1、惧元素给十道叙事、submit/fear 台词给 C5 装逼反馈、新材料给消费 use。
// 8有趣选择：打/逃/威压劝退三岔路；Boss 都有「这一世先不碰」的撤退价值。
// 9服务 build：寒蛟喂寒冰、兽王/熊罴喂兽魂炼体、厉祖/河神喂香火、老狐仙/狐魅喂狐魅破幻、剑灵/残灵喂御剑。
// 10不暴露：台词全是兽性人情精怪神祇口吻，无数值机制词。
(function () {
  'use strict';

  // ════════ 本文件新增物品（Boss 构筑奖励 / 材料钩子）════════
  G.define('item', {
    id: 'langwang_xinxue', name: '狼王心血', type: 'consumable', price: 80,
    desc: '凝而不散的一捧心头血，隔着皮囊都烫手。山里人说，吞了狼王心血的人，夜里看得见风。',
    use: [{ hp: 25 }, { statAdd: { li: 1 } }, { counterAdd: { xuexing: 4 } }, { tendAdd: { xuejian: 3 } },
          { log: { t: '心血入喉如吞炭火，你听见自己周身的血低低嗥了一声。', style: '血' } }]
  });
  G.define('item', {
    id: 'yinsui', name: '阴髓', type: 'material', price: 60,
    desc: '尸王骨芯里凝出的一段乌玉般阴髓，握久了指尖发麻。炼药炼器的人见了它走不动道。'
  });
  G.define('item', {
    id: 'quanpu_canye', name: '拳谱残页', type: 'consumable', price: 100,
    desc: '铁脊拳谱的最后一页。挂在墙上那本，从来就缺着这一页。',
    use: [{ statAdd: { ti: 1 } }, { cult: 10 }, { tendAdd: { lianti: 5 } },
          { log: { t: '纸上拳意入骨，你的脊背自己绷成了一张弓。', style: '体' } }]
  });
  G.define('item', {
    id: 'xianghui_yu', name: '香灰玉', type: 'consumable', price: 50,
    desc: '邪影散后，香炉死灰里凝出的一小块温玉，像庙里百年香火欠下的一点善。',
    use: [{ counterAdd: { xinmo: -20 } }, { qi: 8 },
          { log: { t: '温玉贴掌，心头百窍的杂音一齐静了下去。', style: '吉' } }]
  });

  // ════════════════ 普通敌人 ×6 ════════════════

  // —— 野狼：群袭、怕威压（§16 基线 hp25 atk7 def1）——
  // pack:2 → 每回合两口，各 65% 力道；引气境（境差1×40=40 ≥ 阈值60−20）即可吓退，第一个装逼里程碑。
  G.define('enemy', {
    id: 'yelang', name: '野狼', tier: 1,
    hp: 25, atk: 7, def: 1, spd: 6,
    traits: ['pack:2'],
    immune: [],
    fearOf: ['威压', '火'],
    lines: {
      appear: '荒草伏低。两道灰影一前一后围拢上来，肋骨根根可见，绿瞳幽幽。',
      hurt: '受创的野狼呜咽后退，同伴的低吼却从你身后逼近了。',
      fear: '野狼们耳朵贴了下去，围着你打转，却始终不敢扑上来。',
      death: '最后一头野狼抽搐着蹬直了腿。草丛重归死寂，只剩风声。',
      submit: '野狼们夹起尾巴，一步三回头地退进了灌木深处。'
    },
    loot: { money: [2, 6], items: [{ id: 'langpi', p: 0.55, n: 1 }, { id: 'langya', p: 0.35, n: 1 }] },
    boss: false
  });

  // —— 妖狼：开过灵智、微再生、惧雷（§16 基线 hp55 atk12 def3）——
  // 第1世的第一道墙：硬打 6 回合掉大半条命；炼气初期或雷法异象后轻松。
  G.define('enemy', {
    id: 'yaolang', name: '妖狼', tier: 2,
    hp: 55, atk: 12, def: 3, spd: 8,
    traits: ['regen:2'],
    immune: [],
    fearOf: ['雷', '威压'],
    lines: {
      appear: '这头狼比寻常野狼大出一倍，双目泛着淡淡青芒——它在打量你，像人那样打量。',
      hurt: '妖狼舔了舔伤口，青芒大盛，皮肉竟以肉眼可见的速度蠕动弥合。',
      fear: '妖狼的青瞳骤然收缩，前爪不安地刨着地——它认得你身上那股天威。',
      death: '青芒自妖狼眼中褪去。临死前，它朝黑山深处长嚎了一声，像在报信。',
      submit: '妖狼僵立半晌，忽然低下头颅，缓缓退入林中，再不回头。'
    },
    loot: { money: [6, 14], items: [{ id: 'langpi', p: 0.8, n: 2 }, { id: 'yaolang_ya', p: 0.5, n: 1 }] },
    boss: false
  });

  // —— 山匪：欺软怕硬、惧威压与血（§16 基线 hp45 atk10 def2）——
  // 「劫道散修看清你的剑痕后跪地求饶」的素材位：血剑异象者一照面就把他吓软。
  G.define('enemy', {
    id: 'shanfei', name: '山匪', tier: 2,
    hp: 45, atk: 10, def: 2, spd: 6,
    traits: [],
    immune: [],
    fearOf: ['威压', '血'],
    lines: {
      appear: '道旁滚石后转出一条挎刀大汉，刀背拍着掌心：「此山是我开——留下买路钱。」',
      hurt: '山匪虎口震裂，连退三步，声音都变了：「邪门！这小子邪门！」',
      fear: '山匪看清你刃上经年的血痕，刀尖肉眼可见地抖了起来。',
      death: '山匪到死都攥着那把刀。这座荒山，到底没能姓成他的。',
      submit: '山匪扑通跪倒，把刀双手奉过头顶：「好汉！小的有眼无珠！」'
    },
    loot: { money: [10, 25], items: [{ id: 'ganliang', p: 0.5, n: 1 }, { id: 'zhixuesan', p: 0.3, n: 1 }] },
    boss: false
  });

  // —— 尸鬼：不死、不惧流血、怕雷火（§16 基线 hp70 atk9 def5 regen5）——
  // 物理磨不死（def5+regen5 把白板净输出压到≈4/回合），是「血剑不是万能」的第一课；雷法的口粮。
  G.define('enemy', {
    id: 'shigui', name: '尸鬼', tier: 3,
    hp: 70, atk: 9, def: 5, spd: 3,
    traits: ['undead', 'regen:5'],
    immune: ['流血'],
    fearOf: ['雷', '火'],
    lines: {
      appear: '矿道深处拖出一具佝偻人形，指甲刮着岩壁，咯咯作响。腥风扑面，灯火齐齐一矮。',
      hurt: '你的刃在它身上豁开一道口子——不出血，它也不慢半分。',
      fear: '尸鬼僵在原地，喉间咯咯作响，竟不敢向你挪近半步。',
      death: '尸鬼瘫成一堆枯骨，一缕黑气自骨缝里散尽，矿道忽然亮堂了些。',
      submit: '尸鬼贴着岩壁缓缓缩回黑暗深处，咯咯声渐不可闻。'
    },
    loot: { money: [0, 5], items: [] },
    boss: false
  });

  // —— 药人：高再生、怕雷火/因果/药（§16 基线 hp60 atk8 regen10）——
  // 再生10 是新手检定墙：净输出不过 10/回合就别想耗死它。爆发（血煞斩）/续航（丹火淬体）/dot（雷蚀）三解。
  // 惧「药」：丹道异象者身上的药气，它残存的人性记得——当年就是药把它喂成这样的。
  G.define('enemy', {
    id: 'yaoren', name: '药人', tier: 3,
    hp: 60, atk: 8, def: 2, spd: 5,
    traits: ['regen:10'],
    immune: [],
    fearOf: ['雷', '火', '因果', '药'],
    lines: {
      appear: '那东西曾经是个人。如今药斑鼓胀了它周身，一步步挪来，滴下腥绿的汁。',
      hurt: '伤口翻涌着合拢，浓得发苦的药香呛进你的喉咙。',
      fear: '药人浑浊的眼缩了缩——它残存的那点神智，认得你身上的气味。',
      death: '药人瘫成一滩枯药渣，渣里隐约可见一张终于睡着了的人脸。',
      submit: '药人晃了晃，转过身，蹒跚着遁入了草木深处。'
    },
    loot: { money: [0, 3], items: [{ id: 'ningxuecao', p: 0.8, n: 2 }] },
    boss: false
  });

  // —— 武馆弟子：切磋不致命、惧威压与「体」（§16 基线 hp50 atk11 nonLethal）——
  // 第1世带刀稳赢、空手（武馆杂役）八回合血战；输了养两月伤丢几个钱，是能反复爬的梯子。
  // 惧「体」= 他摸得出你筋骨的成色，炼体路的对口装逼位。
  G.define('enemy', {
    id: 'wuguan_dizi', name: '武馆弟子', tier: 2,
    hp: 50, atk: 11, def: 2, spd: 7,
    traits: ['nonLethal'],
    immune: [],
    fearOf: ['威压', '体'],
    lines: {
      appear: '武馆弟子抱拳一礼，沉腰开胯拉开架势：「请。」',
      hurt: '弟子抹了把嘴角的血，收起轻视，扎下了正经马步。',
      fear: '弟子搭手一掂便变了脸色——你这身筋骨的分量，他兜不住。',
      death: '弟子被放倒在地，挣了两挣没能起身，咬牙抱拳：「服了。」',
      submit: '弟子收势退开半步，深深一揖：「这趟是我自不量力。」'
    },
    loot: { money: [0, 0], items: [] },
    boss: false
  });

  // ════════════════ Boss ×4 ════════════════

  // —— 黑山狼王（tier4，§16 锚：hp380 atk30 def8）——
  // 设计：第1世必死的早期威压源（单击 30，三爪撕碎凡身）；独狼之王不群猎——满山狼群只围观。
  //       炼气中期 + mem_intel_langwang + 血剑全构筑 ≈五成；后期稳杀；筑基高名望可威压臣服。
  //       惧「血」：血剑异象者身上的味道不是猎物的味道——兽王的本能认得同类的杀性。
  G.define('enemy', {
    id: 'heishan_langwang', name: '黑山狼王', tier: 4,
    hp: 380, atk: 30, def: 8, spd: 9,
    traits: [],
    immune: [],
    fearOf: ['威压', '血', '火'],
    lines: {
      appear: '雪线之上，巨狼自岩顶俯视着你——小马驹般大小，左眼一道狰狞旧疤。满山狼嚎，霎时俱寂。',
      hurt: '狼王第一次正眼看你。那份王座般的从容，裂开了一道缝。',
      fear: '狼王嗅了嗅，独目骤然眯起，竟向后挪了半步——你身上的味道，不是猎物该有的味道。',
      death: '山一样的躯体轰然倒下，雪雾腾起三丈。这一夜，整座黑山的狼嚎都是哑的。',
      submit: '狼王凝视你良久，缓缓地、缓缓地俯低了头颅，喉间滚出臣服的呜声。黑山换了主人。'
    },
    loot: {
      money: [80, 150],
      items: [{ id: 'langwang_xinxue', p: 1, n: 1 }, { id: 'yaolang_ya', p: 1, n: 3 }, { id: 'langpi', p: 1, n: 5 }]
    },
    intelMem: 'mem_intel_langwang',
    boss: true
  });

  // —— 矿洞尸王（tier5，§16 锚：hp520 atk26 def12）——
  // 设计：物理墙（def12+regen8+免流血），纯刀剑后期也磨不动——逼玩家转「雷法克尸」或绕路。
  //       雷蚀/宿业一类 dot 与直伤不吃 def 不吃物抗，是融穿它的唯一正解。不惧威压（死人不认名望）。
  G.define('enemy', {
    id: 'kuangdong_shiwang', name: '矿洞尸王', tier: 5,
    hp: 520, atk: 26, def: 12, spd: 3,
    traits: ['undead', 'regen:8'],
    immune: ['流血'],
    fearOf: ['雷', '火'],
    lines: {
      appear: '塌方最深处，一具覆满矿尘的巨大尸身缓缓起立。百十年的怨气压下来，你的火光矮成了豆。',
      hurt: '尸王胸口裂开蛛网般的纹路，又咯咯地缓缓合拢——它不知道痛为何物。',
      fear: '尸王僵滞了一瞬。你身上那种气息，是它入土以来头一样忌惮的东西。',
      death: '尸王轰然碎成齑粉。尘埃落定时，矿道深处传来许多人长长舒气的声音。',
      submit: '尸王浑浊的眼珠定在你身上，许久，竟缓缓侧身，让开了那条百年无人活着走完的矿道。'
    },
    loot: { money: [100, 200], items: [{ id: 'yinsui', p: 1, n: 1 }] },
    intelMem: 'mem_intel_shiwang',
    boss: true
  });

  // —— 武馆大师兄（tier3，§16 锚：hp320 atk28 nonLethal）——
  // 设计：复仇装逼场景。nonLethal=可以一败再败再来（每败养伤两月），杂役线的长梯子。
  //       炼气中期炼体全构筑（桩劲站撸）可胜；圆满+名望可威压让路（惧威压，阈值140）。
  //       不惧「体」元素：他自己就是炼筋骨的，吓不住——只能真刀真枪打服（弟子才会怯）。
  G.define('enemy', {
    id: 'dashixiong_boss', name: '武馆大师兄', tier: 3,
    hp: 320, atk: 28, def: 8, spd: 10,
    traits: ['nonLethal'],
    immune: [],
    fearOf: ['威压'],
    lines: {
      appear: '大师兄缓缓活动着腕骨，骨节炸响如爆豆：「站稳了。我只用三成力。」',
      hurt: '大师兄吐掉一口带血的唾沫，眼里的轻慢烧成了郑重：「好。再来！」',
      fear: '大师兄搭手一接，脸色就变了——你这身筋骨练到了哪一步，他读得懂。',
      death: '大师兄单膝砸进青砖，撑着不肯倒。半晌，他咳着血笑了：「好……好得很。」',
      submit: '大师兄盯着你看了很久，忽然抱拳，躬到底，侧身让开了路。满馆鸦雀无声。'
    },
    loot: { money: [0, 0], items: [{ id: 'quanpu_canye', p: 1, n: 1 }] },
    intelMem: 'mem_intel_dashixiong',
    boss: true
  });

  // —— 山神庙邪影（tier5，§16 锚：hp450 atk32 phys_resist:0.7）——
  // 设计：物抗0.7+免流血硬克纯物理与血剑；雷（dot/直伤破抗）与因果（宿业+保命）是正解。
  //       spd12 → 身法5也只有约8%逃率：进后殿之前，想清楚。不惧威压（邪祟不认人间名望）。
  G.define('enemy', {
    id: 'shanmiao_xieying', name: '山神庙邪影', tier: 5,
    hp: 450, atk: 32, def: 5, spd: 12,
    traits: ['phys_resist:0.7'],
    immune: ['流血'],
    fearOf: ['雷', '火', '因果'],
    lines: {
      appear: '香炉后的阴影无声立起，戴着一张山神的脸。许多人的声音叠在一处开口：「还愿，还是讨债？」',
      hurt: '你的攻势穿透影身，它散了又聚，发出香灰摩擦般的窃笑。',
      fear: '邪影的轮廓剧烈地颤动起来——你身上带着它吞不下去的东西。',
      death: '邪影发出不似人间的长嚎，散作满殿黑灰。被凿去脸的神像上，缓缓淌下两行陈年香灰。',
      submit: '邪影一寸寸缩回神像背后。死寂中，炉里三炷断香无火自燃——它在礼送你出殿。'
    },
    loot: { money: [0, 0], items: [{ id: 'fuzhi', p: 1, n: 3 }, { id: 'xianghui_yu', p: 1, n: 1 }] },
    intelMem: 'mem_intel_xieying',
    boss: true
  });

  // ════════════════════════════════════════════════════════════════
  //  v2 新增（蓝图 §3）：6 普通敌（tier1-3） + 6 Boss（tier4-5）。
  //  下方先定义 6 个 Boss 专属战利品（均 consumable 自带 use 消费点，或 material 带焚化 use；
  //  其余战利品复用他人已有消费点物品，见文件头登记，不重复 define）。
  // ════════════════════════════════════════════════════════════════

  // —— v2 Boss 专属战利品（每件都有去处：自带 use 即消费点）——
  G.define('item', {
    id: 'laohu_neidan', name: '老狐仙内丹', type: 'consumable', price: 120,
    // 消费点：行囊「使用」即服。千年狐丹补神识、定心神、喂狐魅路；服后那点媚气随之入体。
    desc: '一枚温润的暖玉内丹，对光看，里头似有一只小狐蜷着打盹。狐婆坳千年的修行，都凝在这一颗里。',
    use: [{ qi: 20 }, { statAdd: { shen: 1 } }, { counterAdd: { xinmo: -12 } }, { tendAdd: { humei: 4 } },
          { log: { t: '内丹化作一股暖流直冲眉心，纷乱的念头一齐静了，眼前的世界忽然清楚了几分。', style: '吉' } }]
  });
  G.define('item', {
    id: 'jianling_jingpo', name: '剑灵精魄', type: 'consumable', price: 130,
    // 消费点：服之以剑意淬神识，喂御剑路、长修为。万剑之灵散后凝成的一点魄。
    desc: '剑灵溃散后，剑气里凝出的一缕锋锐精魄，握在手里嗡嗡轻鸣，割得掌心生疼又舍不得放。',
    use: [{ statAdd: { shen: 1 } }, { cult: 15 }, { tendAdd: { yujian: 5 } },
          { log: { t: '精魄入体，万千剑鸣在你识海里炸开，你的神识被磨得又利又亮。', style: '异象' } }]
  });
  G.define('item', {
    id: 'jiaolong_han_zhu', name: '蛟龙寒珠', type: 'consumable', price: 110,
    // 消费点：含服化寒入髓，御寒淬体、喂寒冰路；千年蛟的内息所凝。
    desc: '寒潭蛟眉心取出的一颗冰珠，握久了整条手臂都麻，珠面的霜怎么也化不尽。',
    use: [{ statAdd: { ti: 1 } }, { qi: 12 }, { healInjury: { months: 1, severity: 1 } }, { tendAdd: { handu: 5 } },
          { log: { t: '寒珠的冷顺着喉咙一路沉到骨髓，你打了个寒战，旧伤处的滞胀竟松开了。', style: '异象' } }]
  });
  G.define('item', {
    id: 'shouwang_jin', name: '兽王筋', type: 'consumable', price: 100,
    // 消费点：以兽王筋淬体增力，喂炼体/兽魂路；群兽之主的一身蛮力都在这根筋里。
    desc: '后山兽王腿上抽出的一根主筋，韧得刀都割不断，攥在手里能感到它还在突突地跳。',
    use: [{ statAdd: { li: 1 } }, { hp: 20 }, { tendAdd: { lianti: 3 } }, { tendAdd: { shouhun: 3 } },
          { log: { t: '兽王的筋力顺着臂膀漫开，你握拳一捏，骨节炸响如鞭。', style: '体' } }]
  });
  G.define('item', {
    id: 'lizu_yuanpo', name: '厉祖怨魄', type: 'material', price: 70,
    // 消费点：自带「焚化」use——百年怨气太重不可久留，唯有当场焚去，化作一点阴德与心安。
    //   （亦是材料向：desc 注明可交拾骸老者超度，但 use 保证即便不交也有去处，不留死物。）
    desc: '乱葬厉祖溃散后留下的一团乌黑怨魄，攥着它整夜做噩梦。拾骸的老者说，这东西得焚了超度，留不得。',
    use: [{ counterAdd: { xinmo: -8 } }, { counterAdd: { shaqi: -3 } }, { tendAdd: { xianghuo: 4 } },
          { log: { t: '你点起一炷香，把那团怨魄焚了。黑气散尽时，压在心口的那块东西也轻了。', style: '吉' } }]
  });
  G.define('item', {
    id: 'hetu_can', name: '河图残卷', type: 'consumable', price: 115,
    // 消费点：参研残卷悟水势、定心神、喂香火路；河神镇水的图谶残篇。
    desc: '河神沉在渡底的一卷水蚀残图，纹路像水又像字，看久了耳边有潮声。镇水的法门，藏在这残缺的半幅里。',
    use: [{ statAdd: { shen: 1 } }, { cult: 12 }, { counterAdd: { xinmo: -6 } }, { tendAdd: { xianghuo: 5 } },
          { log: { t: '你顺着残图的纹路看下去，眼前浮起千顷水势的来去——心忽然定了。', style: '异象' } }]
  });

  // ════════════════ v2 普通敌人 ×6 ════════════════

  // —— 狐魅（tier2，人形小妖）：媚惑·惧雷/破幻——
  // charm 引擎无对应 trait：用 lines 叙事 + 不实装真控制（按蓝图「可用 lines 叙事，不实装真控制」）。
  // 怕「火/雷」：雷法异象者一照面破幻吓退（fearOf 走 lines.fear + v1 雷元素畏缩）；御剑破幻见 daos 狐魅克制。
  G.define('enemy', {
    id: 'humei_yao', name: '狐魅', tier: 2,
    hp: 32, atk: 9, def: 1, spd: 9,
    traits: [],
    immune: [],
    fearOf: ['雷', '火'],
    lines: {
      appear: '月色里转出个红衣女子，眉眼弯弯朝你一笑，香风扑面，你的脚下没来由地软了一软。',
      hurt: '女子娇笑一声向后飘开，半边脸却褪成了狐相，绿瞳幽幽：「小哥哥好狠的心。」',
      fear: '她迎面撞上你身上那股气，媚笑僵在脸上，慌忙拿袖子掩住了露出的狐尾。',
      death: '红衣散落一地，化作一只七窍流血的小狐，临死还睁着一双不甘的媚眼。',
      submit: '女子盈盈一福，眼波流转间已退入花影：「今夜……算奴家看走了眼。」'
    },
    loot: { money: [3, 10], items: [{ id: 'huzhi', p: 0.5, n: 1 }, { id: 'hu_meifen', p: 0.35, n: 1 }] },
    boss: false
  });

  // —— 厉鬼（tier3，乱葬岗夜出）：undead 免流血·惧香火/雷火——
  // undead 自动免流血+惧雷火（combat.js）；额外靠香火直伤（daos 香火净邪 hook）破其阴回。
  G.define('enemy', {
    id: 'ligui', name: '厉鬼', tier: 3,
    hp: 55, atk: 12, def: 4, spd: 6,
    traits: ['undead'],
    immune: ['流血'],
    fearOf: ['雷', '火', '香火'],
    lines: {
      appear: '乱葬岗的夜雾里立起一道青面人影，七窍淌着黑血，指甲长得拖到了地上，腥气逼得灯火直矮。',
      hurt: '你的刃穿过它的身子，带起一蓬阴风，它咯咯怪笑着重新聚拢，伤口处不见一滴血。',
      fear: '厉鬼撞上你周身那点暖光，惨叫着缩成一团，青烟滚滚地往坟堆里钻。',
      death: '厉鬼发出一声拖长的哀嚎，溃成漫天黑灰。乱葬岗上，几座塌了的坟头，安静了下来。',
      submit: '厉鬼贴着地皮一寸寸退回坟茔，临没入土前回头瞪了你一眼，怨毒里掺了畏惧。'
    },
    loot: { money: [0, 4], items: [{ id: 'zhiqian', p: 0.6, n: 2 }, { id: 'ku_hun_fan', p: 0.25, n: 1 }] },
    boss: false
  });

  // —— 水鬼（tier2，河神渡/水）：拖拽降 spd·惧香火/火——
  // 「命中降 spd」引擎无 op：以低 spd（缠斗迟滞）+ lines 叙事近似（蓝图「省略为台词」）。怕香火（净阴）。
  G.define('enemy', {
    id: 'shuigui', name: '水鬼', tier: 2,
    hp: 40, atk: 9, def: 2, spd: 4,
    traits: [],
    immune: [],
    fearOf: ['香火', '火'],
    lines: {
      appear: '渡口的水面咕嘟冒泡，一只惨白肿胀的手攀上了船舷。水鬼睁着翻白的眼，要拖个替死的下去。',
      hurt: '水鬼被你打得沉下水去，没等你喘气，冰凉的手又缠上了你的脚踝，往下死拽。',
      fear: '水鬼一沾你身上的香火气，像被烫着般猛地松了手，扑通缩回了浑浊的河里。',
      death: '水鬼翻着白眼浮上水面，肿胀的身子一点点瘪下去，化成一滩浑水散开了。',
      submit: '水鬼盯着你看了半晌，咕咚一声沉入水底，再没冒上来——它另寻替身去了。'
    },
    loot: { money: [2, 8], items: [{ id: 'lingjiao', p: 0.5, n: 2 }] },
    boss: false
  });

  // —— 寒蛟幼（tier3，寒潭）：寒息·regen:4·惧雷/火——
  // 「寒息降玩家 spd」引擎无 op：以 regen:4 续航墙为核心考题（寒冰滚 dot/雷法直伤压回血），寒息写台词。
  G.define('enemy', {
    id: 'hanjiao_you', name: '寒蛟幼', tier: 3,
    hp: 60, atk: 11, def: 3, spd: 7,
    traits: ['regen:4'],
    immune: [],
    fearOf: ['雷', '火'],
    lines: {
      appear: '潭面薄冰炸裂，窜出一条丈许长的幼蛟，通体覆着蓝鳞，张口吐出的白雾过处，连空气都冻得发脆。',
      hurt: '幼蛟吃痛翻滚，伤口却结起冰碴，转眼又弥合如初，吐出的寒息更急了。',
      fear: '幼蛟撞上那股能克它的气息，蓝鳞炸起，盘起身子连连后缩，不敢再近前。',
      death: '幼蛟僵直着沉入潭底，蓝光自鳞下一点点黯去。潭水恢复了死一般的平静。',
      submit: '幼蛟绕着你游了两圈，吐出一口寒雾算作示威，终究潜回了潭底深处。'
    },
    loot: { money: [4, 12], items: [{ id: 'hanjing', p: 0.6, n: 1 }, { id: 'bingzhui', p: 0.3, n: 1 }] },
    boss: false
  });

  // —— 熊罴（tier2，后山兽径）：高 atk 蛮力·pack:1·惧威压/兽魂震慑——
  // pack:1=单体重击（每下足力）；高 atk16 是早期硬桩。怕威压（境界差劝退）与兽魂震慑（daos 兽魂克兽）。
  G.define('enemy', {
    id: 'bali', name: '熊罴', tier: 2,
    hp: 58, atk: 16, def: 3, spd: 5,
    traits: ['pack:1'],
    immune: [],
    fearOf: ['威压', '兽魂'],
    lines: {
      appear: '后山兽径的灌木轰然炸开，一头黑熊般的巨兽直立起来，足有一人半高，一掌拍碎了碗口粗的树。',
      hurt: '熊罴吃了一记闷哼后退，随即更狂暴地咆哮起来，红了眼睛朝你扑来。',
      fear: '熊罴前掌悬在半空，忽然嗅到你身上那股镇压百兽的气息，喉咙里的咆哮变成了呜咽。',
      death: '熊罴轰然倒地，震得满径落叶簌簌。它到死都没明白，自己怎么会怕了一个两脚的小东西。',
      submit: '熊罴垂下前掌，喉间滚着低低的服软声，侧身让开了兽径，缩回了林子深处。'
    },
    loot: { money: [6, 15], items: [{ id: 'lingjiao', p: 0.3, n: 1 }, { id: 'shougu_hufu', p: 0.25, n: 1 }] },
    boss: false
  });

  // —— 剑冢残灵（tier3，断剑崖）：剑气反震·惧御剑·nonLethal 试剑不杀——
  // 「剑气反震（攻击时反伤）」引擎无 op：以 phys_resist:0.5 近似（硬壳卸力），反伤写台词。
  // nonLethal=断剑崖试剑不取性命（败则受伤放过，按 defeatCause 授「败绩之忆」，非 deathCause）。怕御剑共鸣。
  G.define('enemy', {
    id: 'jianzhong_canling', name: '剑冢残灵', tier: 3,
    hp: 50, atk: 13, def: 4, spd: 9,
    traits: ['phys_resist:0.5', 'nonLethal'],
    immune: [],
    fearOf: ['剑', '御剑'],
    lines: {
      appear: '断剑崖的剑堆里浮起一团剑气凝成的人影，没有面目，只一柄无形之剑遥遥指住了你的咽喉。',
      hurt: '你的攻势撞在它身上，泛起一圈剑气涟漪，竟有半数力道顺着你的兵刃倒卷回来，震得你虎口发麻。',
      fear: '残灵的剑气陡然一滞——它认出了你身上同源的剑意，那柄无形剑迟疑着垂了下来。',
      death: '残灵的人影散作满天碎剑光，叮叮当当落回剑堆里。崖上的剑鸣，低了一调。',
      submit: '残灵收剑后退，剑气凝成一个抱拳的虚影，无声地认了这一场，散回了断剑之中。'
    },
    loot: { money: [0, 6], items: [{ id: 'jianjue_canpian', p: 0.5, n: 1 }, { id: 'canjian', p: 0.2, n: 1 }] },
    boss: false
  });

  // ════════════════ v2 Boss ×6 ════════════════

  // —— 老狐仙（tier4，狐婆坳千年狐，幻术媚惑）——
  // 设计：第1世幻术媚惑难缠（atk26 中等但幻术磨人，台词向）；惧破幻（御剑/雷异象）与真心不动（低心魔）。
  //   对口：humei 自身（同类媚术克）、御剑（破幻）、雷法（破幻）。intelMem=mem_intel_laohu。不惧威压（千年道行）。
  G.define('enemy', {
    id: 'laohu_xian', name: '老狐仙', tier: 4,
    hp: 300, atk: 26, def: 5, spd: 11,
    traits: [],
    immune: [],
    fearOf: ['雷', '火', '剑', '御剑'],
    lines: {
      appear: '狐婆坳最深处，一位绝色妇人凭栏而坐，鬓边一点朱砂。她抬眼一笑，万千幻象同时铺开——你已分不清哪个是真。',
      hurt: '幻象碎了一角，妇人脸上掠过一丝惊讶，九条狐尾自裙裾下缓缓舒展开来：「有点意思。」',
      fear: '你这一道破幻的气机扫过，满室幻象哗然崩散。老狐仙敛了笑，眸底第一次有了忌惮。',
      death: '老狐仙的身形层层剥落，最终化作一只九尾老狐，伏在地上幽幽长叹，化作一缕青烟散了。狐婆坳的雾，淡了。',
      submit: '老狐仙凝视你良久，九尾轻摆，幻象尽数收起：「修行千年，今日识得真人。这坳，从此让你三分。」'
    },
    loot: { money: [40, 90], items: [{ id: 'laohu_neidan', p: 1, n: 1 }, { id: 'hu_meifen', p: 1, n: 2 }, { id: 'huzhi', p: 1, n: 2 }] },
    intelMem: 'mem_intel_laohu',
    boss: true
  });

  // —— 剑冢剑灵（tier4，断剑崖万剑成灵）——
  // 设计：高 def10 的剑系 Boss，纯钝力难破——御剑多段破防/血剑爆发解。惧御剑认主、以剑入剑。
  //   对口：yujian（破防多段）、血剑（剑系爆发）。intelMem=mem_intel_jianling。
  G.define('enemy', {
    id: 'jianzhong_jianling', name: '剑冢剑灵', tier: 4,
    hp: 330, atk: 27, def: 9, spd: 12,
    traits: [],
    immune: [],
    fearOf: ['剑', '御剑', '血'],
    lines: {
      appear: '断剑崖的万千断剑齐齐拔地而起，悬成一座剑山，山巅凝出一道剑气铸成的人形——剑冢之主，万剑之灵。',
      hurt: '你这一击竟破了它的剑阵！剑灵周身的剑山微微一晃，发出一声不甘的龙吟。',
      fear: '剑灵的剑势骤然一顿——它在你身上认出了与自己同源的剑意，悬空的万剑迟疑地垂下了剑尖。',
      death: '剑灵散作漫天剑光，万千断剑叮咚落回崖底。一柄最锋的，斜斜插在你脚前，剑柄朝着你。',
      submit: '万剑齐齐调转，剑尖朝下，剑灵的人形对你遥遥一拜：「以剑入剑者，可执此冢。」'
    },
    loot: { money: [30, 70], items: [{ id: 'jianling_jingpo', p: 1, n: 1 }, { id: 'jianzhong_jue_can', p: 1, n: 1 }, { id: 'jianjue_canpian', p: 1, n: 2 }] },
    intelMem: 'mem_intel_jianling',
    boss: true
  });

  // —— 寒潭蛟（tier5，寒潭千年蛟，寒息冰封）——
  // 设计：hp480 + regen:6 续航墙，寒息冰封压迫；雷法直伤/寒冰滚 dot 把回血压成净亏是正解（dot 不吃 def）。
  //   惧雷/火，引其寒反噬。intelMem=mem_intel_hanjiao。不惧威压（千年蛟，水之主）。
  G.define('enemy', {
    id: 'hantan_jiao', name: '寒潭蛟', tier: 5,
    hp: 440, atk: 29, def: 6, spd: 8,
    traits: ['regen:5'],
    immune: [],
    fearOf: ['雷', '火'],
    lines: {
      appear: '整座寒潭无声炸开，冰水冲天而起。一条覆满玄蓝寒鳞的巨蛟拔水而出，独目流泻幽蓝寒光——寒潭之主，醒了。',
      hurt: '巨蛟的寒鳞被你崩落数片，伤处涌出的不是血，是结成冰晶的玄液，转眼又冻合如初。',
      fear: '巨蛟撞上那道克它寒息的气机，盘踞的身躯剧烈一颤，蓝光大盛又骤暗，第一次现出畏退之意。',
      death: '巨蛟发出一声震动整座废矿的悲鸣，碎成漫天冰晶。潭面第一次结起了真正的、安静的厚冰。',
      submit: '巨蛟独目里的寒光渐渐沉静，盘起身躯让开潭心，一声低吟震落崖上积雪——它认了潭上来的这个人。'
    },
    loot: { money: [80, 160], items: [{ id: 'jiaolong_han_zhu', p: 1, n: 1 }, { id: 'hansui_zhu', p: 1, n: 1 }, { id: 'hanjing', p: 1, n: 4 }] },
    intelMem: 'mem_intel_hanjiao',
    boss: true
  });

  // —— 后山兽王（tier4，群兽之主，蛮力压迫）——
  // 设计：pack:1 单体重击（atk30 满力）+ 高 hp，蛮力压迫；兽魂震慑/驭+威压、炼体站撸是正解。
  //   惧威压（兽魂震慑）。intelMem=mem_intel_shouwang。
  G.define('enemy', {
    id: 'houshan_shouwang', name: '后山兽王', tier: 4,
    hp: 340, atk: 27, def: 6, spd: 8,
    traits: ['pack:1'],
    immune: [],
    fearOf: ['威压', '兽魂', '火'],
    lines: {
      appear: '后山兽径尽头，一头牛犊般大小的巨兽踏着累累兽骨走来，每一步都震得地面发颤。百兽伏地，无一敢抬头。',
      hurt: '兽王第一次被打得退了半步，独自咆哮一声，满山的兽嚎齐齐应和——这是它在召唤群兽。',
      fear: '兽王猛地顿住，鼻翼翕动着嗅到你身上那股镇压百兽的气息，喉间的咆哮，竟低成了一声呜咽。',
      death: '兽王轰然倒地，压塌了半边兽骨堆。山林死寂片刻，随即百兽四散奔逃——它们的王，没了。',
      submit: '兽王俯下硕大的头颅，前肢曲起，喉间滚出臣服的低吼。这一刻起，后山的百兽，都听你的了。'
    },
    loot: { money: [40, 85], items: [{ id: 'shouwang_jin', p: 1, n: 1 }, { id: 'shouwang_zhua', p: 1, n: 1 }, { id: 'langpi', p: 1, n: 3 }] },
    intelMem: 'mem_intel_shouwang',
    boss: true
  });

  // —— 乱葬厉祖（tier5，乱葬岗百年怨气所聚）——
  // 设计：hp500 undead 免流血，百年怨气墙；香火净化/雷火直伤/因果是正解（undead 自动惧雷火保底）。
  //   惧香火/雷火。intelMem=mem_intel_lizu。不惧威压（怨灵不认生人名望）。
  G.define('enemy', {
    id: 'luanzang_li_zu', name: '乱葬厉祖', tier: 5,
    hp: 440, atk: 27, def: 5, spd: 6,
    traits: ['undead'],
    immune: ['流血'],
    fearOf: ['雷', '火', '香火'],
    lines: {
      appear: '乱葬岗所有的坟头同时塌陷，无数白骨爬出来，叠成一具数丈高的骸骨巨人。百年的怨气压下来，天都黑了一层。',
      hurt: '你的攻势在骸骨巨人身上崩开一个窟窿，里头爬出更多白骨补上，不见一滴血，只有怨气滚滚外溢。',
      fear: '你身上那点香火净气扫过，骸骨巨人发出震耳的哀嚎，半边身子的白骨簌簌剥落，连连退避。',
      death: '骸骨巨人轰然崩塌，化作满地枯骨与一声悠长的叹息。乱葬岗百年的夜哭，今夜歇了。',
      submit: '骸骨巨人僵在原地，无数怨魂自骨缝间望着你那点香火，缓缓伏低、散去——它们等的，原是个超度的人。'
    },
    loot: { money: [50, 100], items: [{ id: 'lizu_yuanpo', p: 1, n: 1 }, { id: 'xianghui_yu', p: 1, n: 1 }, { id: 'ku_hun_fan', p: 1, n: 2 }] },
    intelMem: 'mem_intel_lizu',
    boss: true
  });

  // —— 河神（tier5，河神渡水祸，淹溺香火）——
  // 设计：hp460 + regen:5（水势不竭），淹溺压迫；香火还愿/御剑斩水是正解，避其水势（regen 被香火直伤压）。
  //   惧香火/雷火。intelMem=mem_intel_heshen。不惧威压（一方水神）。
  G.define('enemy', {
    id: 'heshen', name: '河神', tier: 5,
    hp: 420, atk: 29, def: 7, spd: 9,
    traits: ['regen:4'],
    immune: [],
    fearOf: ['雷', '火', '香火', '剑'],
    lines: {
      appear: '河神渡的整条河倒卷而起，立成一道丈高的水墙，墙心浮出一张被香火熏得模糊的神面：「断我香火的，是你？」',
      hurt: '你这一击劈开了水墙，神面扭曲了一瞬，碎裂处的河水却汹涌补回，淹溺之势丝毫不减。',
      fear: '你奉上的那炷愿香气机一漫，河神的水势猛地一缩——它终究是靠香火供着的，最怕的也是香火。',
      death: '河神发出一声不甘的长吟，水墙轰然垮塌，化作满渡口的暴雨落下。雨歇时，河水第一次温顺地退回了岸内。',
      submit: '河神的神面在水墙里沉静下来，缓缓垂首：「你既奉香火，又镇得住我——这渡口，往后由你说了算。」'
    },
    loot: { money: [60, 120], items: [{ id: 'hetu_can', p: 1, n: 1 }, { id: 'xiangyuan_zhu', p: 1, n: 2 }, { id: 'xianghui_yu', p: 1, n: 1 }] },
    intelMem: 'mem_intel_heshen',
    boss: true
  });
})();
