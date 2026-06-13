// js/data/npcs.js — NPC 数据（Owner: C5）。6 个 NPC 完整：月度行为表 + 对话行动 + 私有事件。
//
// npc schema 与月度行为表的数据形态详见 js/systems/npc.js 顶部注释。
// 对话/交互内容直接在本文件 G.define('action', ...) 挂到地点，
// 用 cond:{npcFav:...}/{npcAlive:...}/{flag:...} 控制可见性，好感门槛解锁更深的话。
//
// ── 本文件登记的跨内容咬合点 ──
// 世界 flag（本世）：
//   lao_liehu_yushang     老猎户被狼群所伤，暂不能上山（狼患回落后可痊愈）
//   lao_liehu_si_yu_lang  老猎户死于狼口（玩家闭关太久的代价；C2/C3 可引）
//   dsx_jingjin_1/2       大师兄修为精进的两个台阶（cond 无法读 NPC realm，用 flag 镜像）
//   dashixiong_li_guan    大师兄拜入仙门离镇（复仇线时限！挑战大师兄的行动/事件请加 noflag）
//   miaozhu_yeji          有人撞见庙祝子时倒插香（邪神线铺垫，C3 庙线可引）
//   miaozhu_shizong       庙祝失踪（庙门里拴、香灰尚温；C3 邪神线主咬合点）
//   sanxiu_dingshang      劫道散修已盯上玩家（拦路事件已入队的防重门闩）
//   sanxiu_guifu          劫道散修被玩家威压/打服，金盆洗手
//   xianmen_jieyi         玩家杀气太重，仙门起了戒心（C3 可引）
// 玩家 pflag（本世）：
//   wuguan_luodi          递帖求试落第（“连入门测试都没过”——今昔对比的原料，social.js 引）
//   dsx_chuan_quan        大师兄亲手拆拳相授（一次性奖励门闩）
//   zhouji_liehu / shou_guo_miao / enshi_sanxiu   三件阴德事（social.js 善人称号引）
//   ting_guo_houdian      守夜时听过后殿门响（C3 庙线可引）
//   laoban_dandu_dianbo / laoban_song_yao         药铺老板丹毒提点/赠药（每世一次门闩）
//   liehu_song_hufu       老猎户赠兽骨护符（每世一次门闩）
//   gei_guo_mailuqian     给过散修买路钱（social.js 今昔对比与“双手奉还”反馈引）
//   sha_le_sanxiu         杀人越货，抹了散修的脖子
//   xunshi_zhumu_1/2      巡使两级注目；jie_le_mingtie / xie_le_mingtie 名帖去留
// 本文件新增 item：dihui_tang（涤秽汤）/ xianmen_mingtie（仙门名帖）
// 本文件私有 event：ev_npc_jiedao（拦路）/ ev_npc_xunshi_titie（巡使递帖）
// 本文件私有 enemy：sanxiu_jiedao（劫道散修战斗体；ids.js 六敌四 Boss 之外的私有补充，C4 勿重名）
// 引用跨文件 id：mem_intel_langwang（C1 定义）；四 Boss / 六敌 / 出生 pflag su_ji、xianghuo_yinji。
//
// TODO-INTEGRATION: enemies.js 狼王 intelMem 现为 mem_langwang_ruodian，契约口径应统一到
//   mem_intel_langwang（C1 定义、本文件 fav≥40 发放）。集成时对齐其一即可。
// TODO-INTEGRATION: 条件 DSL 读不到 NPC 的 realm/location，大师兄成长用 flag dsx_jingjin_* 镜像；
//   若引擎日后支持 {npcRealm:{id,gte}}，可去掉镜像 flag。
// TODO-INTEGRATION: 挑战大师兄的行动/事件（C2/C3 名下）请补 cond {noflag:'dashixiong_li_guan'}，
//   否则他人已离镇仍可被挑战。
//
// ── 自检十问（以全文件为体）──
// 1标签：交际/狩猎/药/体/香火/因果/恶。2易共现：老猎户↔狼患，庙祝↔ghostQi，大师兄↔sectAttention，
//   散修↔玩家钱多名薄。3排斥：庙祝线与武馆线互不纠缠；散修不进镇行凶。
// 4改状态：压狼患/调药价/涨阴气/好感/flag/传闻/情报记忆。5后果：老猎户死则狼患失压、镇恐慌涨；
//   大师兄离镇则复仇成空、心魔暗生；庙祝失踪给 C3 邪神线递刀。
// 6可解释：每条行为都长在人设里（猎户压狼、掌柜囤药、庙祝亲香火）。7钩子：全部 flag/pflag 上表登记。
// 8有趣选择：拦路给钱还是拼命、名帖接还是辞、落第之辱受还是讨。9服务 build：猎户喂体、庙祝喂因果、
//   掌柜喂丹、武馆喂体与复仇、散修喂杀与威压流装逼。10不暴露：台词只谈山、药、拳、香火，无一机制词。
(function () {
  'use strict';

  // ════════════════════════════════════════════
  // 一、老猎户（青石镇）—— 压狼患的人，也是会死在狼患里的人
  // ════════════════════════════════════════════
  G.define('npc', {
    id: 'lao_liehu', name: '老猎户', fav0: 0, realm0: 0,
    loc: 'qingshizhen',
    desc: '黑山脚下最后一个老猎户，一条腿坏在山里。看人的眼神还像在看兽踪。',
    monthly: [
      { // 狼患高时拖着伤腿也要上山压一压
        cond: { wvar: { id: 'wolfThreat', gte: 45 }, noflag: 'lao_liehu_yushang' },
        chance: 0.5,
        effects: [
          { wvarAdd: { wolfThreat: -5 } },
          { log: { t: '老猎户又拖着那条坏腿上了趟黑山，回来时背篓里挂着两张狼皮。', style: '世界' } }
        ],
        note: '老猎户压狼患'
      },
      { // 狼患失控时他会受伤
        cond: { wvar: { id: 'wolfThreat', gte: 75 }, noflag: 'lao_liehu_yushang' },
        chance: 0.15,
        effects: [
          { flagSet: { id: 'lao_liehu_yushang' } },
          { rumorAdd: { t: '老猎户让狼群围了，是邻村人抬回来的。这把年纪，怕是再上不了山了。', fame: 0 } }
        ],
        note: '狼患失控时老猎户遇险'
      },
      { // 狼患回落后伤愈复出
        cond: { flag: 'lao_liehu_yushang', wvar: { id: 'wolfThreat', lte: 50 } },
        chance: 0.25,
        effects: [
          { flagSet: { id: 'lao_liehu_yushang', v: false } },
          { log: { t: '老猎户的腿好利索了，又坐回镇口磨他那把猎刀。', style: '世界' } }
        ],
        note: '伤愈复出'
      },
      { // 狼患≥85：他提弓进山，再没回来——玩家闭关太久的代价
        cond: { wvar: { id: 'wolfThreat', gte: 85 } },
        chance: 0.18,
        effects: [
          { npcSet: { id: 'lao_liehu', key: 'alive', v: false } },
          { flagSet: { id: 'lao_liehu_si_yu_lang' } },
          { wvarAdd: { villageFear: 18 } },
          { rumorAdd: { t: '老猎户提着猎弓进了山，三天没回。后来有人在乱石滩上，只找到了他的弓。', fame: 0 } },
          { log: { t: '全镇的门窗在天黑前就闩死了。最后一个敢跟狼叫板的人，没了。', style: '凶' } }
        ],
        note: '狼患滔天，老猎户死于狼口'
      },
      { // 好感深了，托人捎来护身的物件（每世一次）
        cond: { npcFav: { id: 'lao_liehu', gte: 30 }, nopflag: 'liehu_song_hufu' },
        chance: 0.15,
        effects: [
          { pflagSet: { id: 'liehu_song_hufu' } },
          { itemAdd: { id: 'shougu_hufu', n: 1 } },
          { log: { t: '老猎户托货郎捎来一枚他亲手磨的兽骨符：「山里头，带着它。」', style: '吉' } }
        ],
        note: '赠兽骨护符'
      }
    ]
  });

  // 对话：听老猎户讲山——好感门槛 + 狼王情报发放（fav≥40）
  G.define('action', {
    id: 'ting_liehu_jiangshan', name: '听老猎户讲山', desc: '拎壶烧刀子去寻老猎户，听他讲黑山里的旧事。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 40,
    cond: { npcAlive: 'lao_liehu', npcFav: { id: 'lao_liehu', gte: 5 } },
    effects: [{ npcFavAdd: { id: 'lao_liehu', n: 3 } }],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { lianti: 1 } },
        { log: { t: '「下盘要稳。山里头，站得住的才活得久。」他敲着你的膝盖说。', style: '体' } }] },
      { weight: 3, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '他讲到当年雪崩埋了半支商队，讲到一半忽然不讲了，只是喝酒。', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'wolfThreat', gte: 60 } }, effects: [
        { counterAdd: { xinmo: -1 } },
        { log: { t: '「狼最近不对。」他望着黑山，半天又补了一句：「夜里别走北边。」', style: '世界' } }] },
      { weight: 4, cond: { npcFav: { id: 'lao_liehu', gte: 40 }, not: { mem: 'mem_intel_langwang' } },
        effects: [
          { memAdd: 'mem_intel_langwang' },
          { npcFavAdd: { id: 'lao_liehu', n: 3 } },
          { log: { t: '酒过三巡，他压低声音：「狼王的左眼，是我射瞎的。它打左边扑你时……会偏头。」', style: '因果' } }] }
    ]
  });

  // 对话：腊月送年货——便宜的善缘（阴德事其一）
  G.define('action', {
    id: 'song_nianhuo_liehu', name: '给老猎户送年货', desc: '割二斤肉、打一壶酒，赶在年根儿前给老猎户送去。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 41,
    cond: { npcAlive: 'lao_liehu', monthIn: [12], money: { gte: 6 } },
    effects: [
      { money: -6 },
      { npcFavAdd: { id: 'lao_liehu', n: 8 } },
      { pflagSet: { id: 'zhouji_liehu' } }
    ],
    outcomes: [
      { weight: 6, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '老头儿骂你乱花钱，转身把肉下了锅，硬留你吃了顿热乎的。', style: '吉' } }] },
      { weight: 3, cond: { flag: 'lao_liehu_yushang' }, effects: [
        { npcFavAdd: { id: 'lao_liehu', n: 4 } },
        { log: { t: '他腿上还缠着布。接过酒时，这个硬了一辈子的老人眼眶红了红。', style: '平' } }] },
      { weight: 2, effects: [
        { itemAdd: { id: 'langpi', n: 1 } },
        { log: { t: '临走他塞回你一张硝好的狼皮：「拿着。老头子不欠人情。」', style: '吉' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 二、药铺老板（药铺）—— 称药的手稳，看行情的眼更稳
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'dihui_tang', name: '涤秽汤', type: 'consumable', price: 26,
    desc: '回春堂的私方苦汤，洗经涤腑。入口如吞黄连，落肚却清明。',
    use: [
      { counterAdd: { dandu: -12 } },
      { hp: 2 },
      { log: { t: '一碗苦汤下肚，五脏像被粗布狠狠擦过一遍，浊气随汗而出。', style: '丹' } }
    ]
  });

  G.define('npc', {
    id: 'yaopu_laoban', name: '药铺老板', fav0: 0, realm0: 0,
    loc: 'yaopu',
    desc: '回春堂的掌柜，称药的手稳得很。柜台底下收些不便明说的山货。',
    monthly: [
      { // 行情低时囤药抬价
        cond: { wvar: { id: 'marketPrice', lte: 95 } },
        chance: 0.25,
        effects: [{ wvarAdd: { marketPrice: 8 } }],
        note: '低价囤药抬价'
      },
      { // 行情过热时出清陈药压价
        cond: { wvar: { id: 'marketPrice', gte: 135 } },
        chance: 0.3,
        effects: [
          { wvarAdd: { marketPrice: -10 } },
          { log: { t: '回春堂挂出水牌，出清陈年药材，药价松动了些。', style: '世界' } }
        ],
        note: '出陈药压价'
      },
      { // 镇上人心惶惶时施药安神
        cond: { wvar: { id: 'villageFear', gte: 55 } },
        chance: 0.25,
        effects: [
          { wvarAdd: { villageFear: -4 } },
          { rumorAdd: { t: '回春堂门口支了口大锅，施了三天安神汤，分文不取。', fame: 0 } }
        ],
        note: '恐慌时施药'
      },
      { // 丹毒提醒：熟客气色不对，他看得出来（每世一次）
        cond: { counter: { id: 'dandu', gte: 25 }, npcFav: { id: 'yaopu_laoban', gte: 15 }, nopflag: 'laoban_dandu_dianbo' },
        chance: 0.5,
        effects: [
          { pflagSet: { id: 'laoban_dandu_dianbo' } },
          { log: { t: '掌柜的托人带话：「你最近气色不对。丹这东西，是借命，不是续命。」', style: '丹' } }
        ],
        note: '丹毒初起，掌柜提点'
      },
      { // 丹毒深重且交情够：赠一剂私方涤秽汤（每世一次）
        cond: { counter: { id: 'dandu', gte: 55 }, npcFav: { id: 'yaopu_laoban', gte: 40 }, nopflag: 'laoban_song_yao' },
        chance: 0.35,
        effects: [
          { pflagSet: { id: 'laoban_song_yao' } },
          { itemAdd: { id: 'dihui_tang', n: 1 } },
          { log: { t: '掌柜的塞给你一只黑陶罐，没收钱：「再这么吃下去，神仙难救。」', style: '丹' } }
        ],
        note: '丹毒深重，赠涤秽汤'
      }
    ]
  });

  // 对话：向回春堂出脱山货——收购价随行情浮动
  G.define('action', {
    id: 'mai_shanhuo_huichuntang', name: '向回春堂出脱山货', desc: '把狼皮兽牙抱去回春堂，掌柜的柜下向来收这些。',
    loc: 'yaopu', timeCost: 1, risk: 0, order: 50,
    cond: { npcAlive: 'yaopu_laoban',
      any: [{ item: { id: 'langpi' } }, { item: { id: 'langya' } }, { item: { id: 'yaolang_ya' } }] },
    effects: [
      { npcFavAdd: { id: 'yaopu_laoban', n: 1 } },
      { branch: { cond: { item: { id: 'langpi' } }, then: [
        { itemDel: { id: 'langpi', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } }, then: [{ money: 5 }], else: [{ money: 3 }] } }
      ] } },
      { branch: { cond: { item: { id: 'langya' } }, then: [
        { itemDel: { id: 'langya', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } }, then: [{ money: 3 }], else: [{ money: 2 }] } }
      ] } },
      { branch: { cond: { item: { id: 'yaolang_ya' } }, then: [
        { itemDel: { id: 'yaolang_ya', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } }, then: [{ money: 12 }], else: [{ money: 8 }] } }
      ] } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { log: { t: '掌柜的拨拉着算盘，头也不抬：「皮子要趁干，下回别捂出潮气。」', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'marketPrice', gte: 120 } }, effects: [
        { money: 1 },
        { log: { t: '「今年药贵货俏。」掌柜的难得多数了几个钱给你。', style: '吉' } }] },
      { weight: 3, cond: { npcFav: { id: 'yaopu_laoban', gte: 30 } }, effects: [
        { money: 2 }, { tendAdd: { danyao: 1 } },
        { log: { t: '熟人价。掌柜的顺手教你辨了辨柜上几味药的成色。', style: '丹' } }] },
      { weight: 2, cond: { item: { id: 'yaolang_ya' } }, effects: [
        { npcFavAdd: { id: 'yaopu_laoban', n: 2 } },
        { log: { t: '掌柜的捏着枚妖狼牙端详半晌，声音压得极低：「这路货，只走柜下。」', style: '平' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 三、武馆大师兄（武馆）—— 年复一年变强的人，等不了你太久
  // ════════════════════════════════════════════
  G.define('npc', {
    id: 'dashixiong', name: '武馆大师兄', fav0: 0, realm0: 1,
    loc: 'wuguan',
    desc: '铁脊武馆的大师兄，名头比馆主还响。他看人的眼神，像在掂一块料。',
    monthly: [
      { // 精进其一：寅时练拳，破入炼气（约两三年内见分晓）
        cond: { noflag: ['dsx_jingjin_1', 'dashixiong_li_guan'] },
        chance: 0.035,
        effects: [
          { flagSet: { id: 'dsx_jingjin_1' } },
          { npcSet: { id: 'dashixiong', key: 'realm', v: 2 } },
          { rumorAdd: { t: '大师兄寅时练拳的声音，如今隔着半条街都听得见——那不是凡人的动静。', fame: 0 } }
        ],
        note: '大师兄修为精进（其一）'
      },
      { // 精进其二：拳裂石锁，镇子装不下他了
        cond: { flag: 'dsx_jingjin_1', noflag: ['dsx_jingjin_2', 'dashixiong_li_guan'] },
        chance: 0.03,
        effects: [
          { flagSet: { id: 'dsx_jingjin_2' } },
          { npcSet: { id: 'dashixiong', key: 'realm', v: 3 } },
          { rumorAdd: { t: '有人看见大师兄一拳把校场的石锁打得四分五裂。这镇子，怕是装不下他了。', fame: 0 } }
        ],
        note: '大师兄修为精进（其二）'
      },
      { // 仙门关注高的年头，九月巡使过镇时可能把他带走——复仇线的沙漏
        cond: { flag: 'dsx_jingjin_1', noflag: 'dashixiong_li_guan', monthIn: [9],
          wvar: { id: 'sectAttention', gte: 35 } },
        chance: 0.55,
        effects: [
          { flagSet: { id: 'dashixiong_li_guan' } },
          { wvarAdd: { sectAttention: -10 } },
          { rumorAdd: { t: '大师兄跟着仙门的青骡车走了。走前，他在馆门前磕了三个头。', fame: 0 } },
          { branch: { cond: { npcFav: { id: 'dashixiong', gte: 40 } }, then: [
            { npcFavAdd: { id: 'dashixiong', n: 5 } },
            { log: { t: '临行前夜他寻你喝了顿酒：「镇子太小。你我之间，总有人要先走出去。」', style: '平' } }
          ] } },
          { branch: { cond: { bossAlive: 'dashixiong_boss',
              any: [{ birth: 'wuguan_zayi' }, { pflag: 'wuguan_luodi' }, { pflag: 'shu_gei_wuguan' }] }, then: [
            { counterAdd: { xinmo: 3 } },
            { log: { t: '你站在武馆门外站了很久。有些账，这一世怕是讨不成了。', style: '凶' } }
          ] } }
        ],
        note: '大师兄拜入仙门离镇（复仇时限）'
      },
      { // 对高名望玩家的态度转化：他开始打听你
        cond: { fame: { gte: 80 }, npcFav: { id: 'dashixiong', lte: 25 }, noflag: 'dashixiong_li_guan' },
        chance: 0.3,
        effects: [
          { npcFavAdd: { id: 'dashixiong', n: 8 } },
          { log: { t: '听说大师兄在馆里提起你的名字，掂了掂拳，半晌没说话。', style: '世界' } }
        ],
        note: '名望入耳，态度转化'
      },
      { // 背景音：外乡把式踢馆，没人走得过他三招
        cond: { noflag: 'dashixiong_li_guan' },
        chance: 0.06,
        effects: [
          { wvarAdd: { sectAttention: 1 } },
          { rumorAdd: { t: '又有外乡把式来踢馆，没走过大师兄三招，被拎着后领扔出了门。', fame: 0 } }
        ],
        note: '踢馆者衬托其强'
      }
    ]
  });

  // 对话：递帖求试——弱时受辱（落第 pflag），强时论交，极强时今昔逆转
  G.define('action', {
    id: 'dsx_diti_qiushi', name: '向大师兄递帖求试', desc: '按武馆的规矩递上名帖，请大师兄过一过手。',
    loc: 'wuguan', timeCost: 1, risk: 1, order: 30,
    cond: { npcAlive: 'dashixiong', noflag: 'dashixiong_li_guan' },
    effects: [],
    outcomes: [
      { weight: 8, cond: { realm: { lte: 0 } }, effects: [
        { pflagSet: { id: 'wuguan_luodi' } },
        { npcFavAdd: { id: 'dashixiong', n: -2 } },
        { injure: { months: 1, severity: 1 } },
        { tendAdd: { lianti: 2 } },
        { log: { t: '「回去吧。」他甚至没站起身。你自始至终，没碰到他的衣角。', style: '凶' } },
        { log: { t: '满院弟子的哄笑声里，你把那口气咽进了骨头里。', style: '体' } }] },
      { weight: 8, cond: { realm: { gte: 1, lte: 1 } }, effects: [
        { npcFavAdd: { id: 'dashixiong', n: 4 } },
        { tendAdd: { lianti: 1 } },
        { log: { t: '「有点意思。」他接了你三招，收手时，眼里头一回有了你这个人。', style: '体' } }] },
      { weight: 8, cond: { realm: { gte: 2 }, nopflag: 'wuguan_luodi' }, effects: [
        { npcFavAdd: { id: 'dashixiong', n: 6 } },
        { fame: 2 },
        { log: { t: '点到即止。他抱拳道：「青石镇这几年，就出了你这么一号人物。」', style: '吉' } }] },
      { weight: 12, cond: { realm: { gte: 2 }, pflag: 'wuguan_luodi', npcFav: { id: 'dashixiong', gte: 30 }, nopflag: 'dsx_chuan_quan' },
        effects: [
          { pflagSet: { id: 'dsx_chuan_quan' } },
          { statAdd: { li: 1 } },
          { npcFavAdd: { id: 'dashixiong', n: 6 } },
          { log: { t: '「当年那个帖子都递不进门的娃娃……」他笑着摇头，亲手给你拆了一路拳。', style: '体' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 四、庙祝（山神庙）—— 阴气越涨，他笑得越慈祥
  // ════════════════════════════════════════════
  G.define('npc', {
    id: 'miaozhu', name: '庙祝', fav0: 0, realm0: 0,
    loc: 'shanshenmiao',
    desc: '山神庙的看庙人，瘦得像一炷香。他扫了一辈子殿，却从不擦神像的脸。',
    monthly: [
      { // 阴气尚浅：他还在尽职地压着
        cond: { wvar: { id: 'ghostQi', lte: 39 }, noflag: 'miaozhu_shizong' },
        chance: 0.25,
        effects: [
          { wvarAdd: { ghostQi: -2 } },
          { log: { t: '庙祝把山神像前的香灰收拾得干干净净，又在殿角洒了一圈糯米。', style: '世界' } }
        ],
        note: '庙祝日常压阴气'
      },
      { // 异变其一：子时倒插香（邪神线第一记钟）
        cond: { wvar: { id: 'ghostQi', gte: 45 }, noflag: ['miaozhu_yeji', 'miaozhu_shizong'] },
        chance: 0.3,
        effects: [
          { flagSet: { id: 'miaozhu_yeji' } },
          { wvarAdd: { ghostQi: 2 } },
          { rumorAdd: { t: '夜归的樵夫看见庙祝子时还在上香——香，是倒着插的。', fame: 0 } }
        ],
        note: '夜祭被撞见'
      },
      { // 异变其二：逢人便笑，笑得人发毛
        cond: { wvar: { id: 'ghostQi', gte: 60 }, flag: 'miaozhu_yeji', noflag: 'miaozhu_shizong' },
        chance: 0.25,
        effects: [
          { wvarAdd: { villageFear: 3 } },
          { log: { t: '庙祝近来逢人便笑。香客越来越少了——他笑得人后颈发凉。', style: '凶' } }
        ],
        note: '行止异变'
      },
      { // 失踪：庙门里拴，香灰尚温（C3 邪神线主咬合点）
        cond: { wvar: { id: 'ghostQi', gte: 75 }, flag: 'miaozhu_yeji', noflag: 'miaozhu_shizong' },
        chance: 0.3,
        effects: [
          { flagSet: { id: 'miaozhu_shizong' } },
          { npcSet: { id: 'miaozhu', key: 'alive', v: false } },   // 失踪 → 庙里行动不再把他当在场
          { wvarAdd: { villageFear: 8 } },
          { wvarAdd: { ghostQi: 5 } },
          { rumorAdd: { t: '庙祝不见了。庙门从里头拴着，香炉里的灰，还是温的。', fame: 0 } }
        ],
        note: '庙祝失踪（邪神线铺垫）'
      },
      { // 庙净之后，他回来了——瘦得脱了形
        cond: { flag: 'miaozhu_shizong', bossDead: 'shanmiao_xieying' },
        chance: 0.3,
        effects: [
          { flagSet: { id: 'miaozhu_shizong', v: false } },
          { npcSet: { id: 'miaozhu', key: 'alive', v: true } },   // 归来 → 庙里行动恢复在场
          { npcFavAdd: { id: 'miaozhu', n: 10 } },
          { rumorAdd: { t: '庙祝回来了，瘦得脱了形。谁问，他都只说自己在山里迷了路。', fame: 0 } }
        ],
        note: '庙净人归'
      },
      { // 交情深时塞符叮嘱（阴气渐起的年月）
        cond: { npcFav: { id: 'miaozhu', gte: 30 }, wvar: { id: 'ghostQi', gte: 50 }, noflag: 'miaozhu_shizong' },
        chance: 0.2,
        effects: [
          { itemAdd: { id: 'fuzhi', n: 1 } },
          { log: { t: '庙祝塞给你一道朱砂符：「夜里听见有人叫你的名字，别应。」', style: '因果' } }
        ],
        note: '赠符叮嘱'
      }
    ]
  });

  // 对话：陪庙祝守一夜庙——守的是庙，听见的未必是风
  G.define('action', {
    id: 'pei_miaozhu_shouye', name: '陪庙祝守一夜庙', desc: '庙祝年纪大了。陪这孤老头守一夜殿，添几回香。',
    loc: 'shanshenmiao', timeCost: 1, risk: 1, order: 30,
    cond: { npcAlive: 'miaozhu', noflag: 'miaozhu_shizong' },
    effects: [
      { npcFavAdd: { id: 'miaozhu', n: 4 } },
      { pflagSet: { id: 'shou_guo_miao' } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '他絮叨了半夜山神爷的旧事，讲到神像的脸是谁凿的，忽然住了口。', style: '平' } }] },
      { weight: 4, cond: { wvar: { id: 'ghostQi', gte: 50 } }, effects: [
        { pflagSet: { id: 'ting_guo_houdian' } },
        { tendAdd: { yinguo: 2 } },
        { counterAdd: { xinmo: 1 } },
        { log: { t: '三更天，后殿那扇从没开过的门，轻轻响了三声。庙祝充耳不闻。', style: '凶' } }] },
      { weight: 4, cond: { npcFav: { id: 'miaozhu', gte: 35 }, pflag: 'xianghuo_yinji' }, effects: [
        { npcFavAdd: { id: 'miaozhu', n: 4 } },
        { tendAdd: { yinguo: 2 } },
        { log: { t: '添香时他忽然说：「你眉心那点香火印，是我当年亲手点的。莫忘。」', style: '因果' } }] },
      { weight: 2, effects: [
        { qi: 3 },
        { log: { t: '一夜无事。香烟笔直，你守着守着，竟入了一个极静的境地。', style: '吉' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 五、外门巡使（每年九月过镇）—— 仙门的眼睛
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'xianmen_mingtie', name: '仙门名帖', type: 'misc', price: 100,
    desc: '一指厚的玉色名帖，触手微凉。帖上无字，对着月光看，隐有云纹流动。'
  });

  G.define('npc', {
    id: 'waimen_xunshi', name: '外门巡使', fav0: 0, realm0: 4,
    loc: 'qingshizhen',
    desc: '仙门派驻凡界的外门巡使，每年九月乘青骡车过镇。折扇不离手，眼睛却比扇骨还利。',
    monthly: [
      { // 年度巡视：九月过镇，仙门的目光扫过凡尘
        cond: { monthIn: [9] },
        effects: [
          { wvarAdd: { sectAttention: 3 } },
          { log: { t: '九月初九，仙门外门巡使的青骡车照例过镇，在驿馆歇了一夜。', style: '世界' } }
        ],
        note: '年度巡视'
      },
      { // 注目其一：小有名声或已入修行，他记下了你的名字
        cond: { monthIn: [9], nopflag: 'xunshi_zhumu_1',
          any: [{ fame: { gte: 50 } }, { realm: { gte: 2 } }] },
        chance: 0.8,
        effects: [
          { pflagSet: { id: 'xunshi_zhumu_1' } },
          { npcFavAdd: { id: 'waimen_xunshi', n: 5 } },
          { wvarAdd: { sectAttention: 6 } },
          { rumorAdd: { t: '驿馆里那位仙门巡使，跟茶博士打听了你的名姓，听完点了点头。', fame: 2 } }
        ],
        note: '巡使初次注目'
      },
      { // 注目其二：「此子是谁？」——并递帖相召（远期钩子，不做飞升）
        cond: { monthIn: [9], pflag: 'xunshi_zhumu_1', nopflag: 'xunshi_zhumu_2',
          any: [{ fame: { gte: 120 } }, { realm: { gte: 3 } }] },
        chance: 0.9,
        effects: [
          { pflagSet: { id: 'xunshi_zhumu_2' } },
          { wvarAdd: { sectAttention: 12 } },
          { rumorAdd: { t: '「此子是谁？」据说巡使在驿馆里，把这句话问了三遍。', fame: 3 } },
          { eventDelay: { id: 'ev_npc_xunshi_titie', months: 1, note: '巡使遣人来请' } }
        ],
        note: '巡使惊问，递帖相召'
      },
      { // 杀气太重，仙门起了戒心——恶名也入仙门的账
        cond: { monthIn: [9], counter: { id: 'shaqi', gte: 50 }, noflag: 'xianmen_jieyi' },
        chance: 0.6,
        effects: [
          { flagSet: { id: 'xianmen_jieyi' } },
          { wvarAdd: { sectAttention: 8 } },
          { rumorAdd: { t: '巡使临行前留了句话：「镇上煞气太重。仙门，记下了。」', fame: 0 } }
        ],
        note: '煞气入册'
      }
    ]
  });

  // 私有事件：巡使递帖（注目其二的延时召见）
  G.define('event', {
    id: 'ev_npc_xunshi_titie', title: '驿馆来请',
    queueOnly: true, once: true,
    textFn: function () {
      return '一个驿卒寻到你，说驿馆有位贵人相请。雅间里只有一盏清茶、一柄折扇，和一位看不出年纪的灰袍人。' +
        '「不必拘礼。」他推过来一方玉色名帖，「仙门外门，三年一考。这帖子，可保你直入山门一试。」';
    },
    choices: [
      {
        text: '双手接下名帖',
        outcomes: [{ weight: 1, effects: [
          { itemAdd: { id: 'xianmen_mingtie', n: 1 } },
          { pflagSet: { id: 'jie_le_mingtie' } },
          { npcFavAdd: { id: 'waimen_xunshi', n: 10 } },
          { wvarAdd: { sectAttention: 5 } },
          { log: { t: '「根骨尚可，心性未知。」他收扇起身，「山门很高，慢慢走。」', style: '吉' } }
        ] }]
      },
      {
        text: '婉言辞谢',
        outcomes: [{ weight: 1, effects: [
          { pflagSet: { id: 'xie_le_mingtie' } },
          { tendAdd: { yinguo: 3 } },
          { fame: 3 },
          { rumorAdd: { t: '仙门递来的帖子，他竟原样奉还。有人说他傻，也有人说他狂。', fame: 0 } },
          { log: { t: '灰袍人盯着你看了很久，忽而一笑：「有意思。凡尘里，也能磨出剑来。」', style: '因果' } }
        ] }]
      },
      {
        text: '冷笑离席',
        cond: { counter: { id: 'shaqi', gte: 40 } },
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { shaqi: 2 } },
          { wvarAdd: { sectAttention: 4 } },
          { npcFavAdd: { id: 'waimen_xunshi', n: -10 } },
          { log: { t: '你掀帘而出。身后扇骨轻叩桌面，三声，像在数你的罪。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 对话：九月拜会巡使——每年一面，听两句仙门见闻
  G.define('action', {
    id: 'baihui_xunshi', name: '到驿馆拜会巡使', desc: '巡使的青骡车正在驿馆。备一份土仪，去碰碰运气。',
    loc: 'qingshizhen', timeCost: 1, risk: 0, order: 60,
    cond: { monthIn: [9], pflag: 'xunshi_zhumu_1', money: { gte: 4 } },
    effects: [
      { money: -4 },
      { npcFavAdd: { id: 'waimen_xunshi', n: 2 } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { cult: 10 }, { qi: 4 },
        { log: { t: '他随口指点的两句吐纳火候，胜过你自己闷头摸索半年。', style: '吉' } }] },
      { weight: 3, cond: { npcFav: { id: 'waimen_xunshi', gte: 15 } }, effects: [
        { cult: 6 },
        { wvarAdd: { sectAttention: 2 } },
        { log: { t: '「山上一日，山下一年。」他讲了些仙门掌故，临走若有深意地看了你一眼。', style: '平' } }] },
      { weight: 2, cond: { counter: { id: 'dandu', gte: 30 } }, effects: [
        { counterAdd: { dandu: -3 } },
        { log: { t: '他扇骨一抬抵住你的腕脉，皱眉：「丹毒入络。仙门最忌带病的炉鼎。」', style: '丹' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 六、劫道散修（流窜野外）—— 欺软怕硬这四个字，他写成了活的
  // ════════════════════════════════════════════
  // 私有敌人：散修的战斗体（nonLethal：他图财，不害命——你输了破财消灾）
  G.define('enemy', {
    id: 'sanxiu_jiedao', name: '劫道散修', tier: 3,
    hp: 85, atk: 13, def: 3, spd: 9,
    traits: ['nonLethal'],
    immune: [],
    fearOf: ['威压', '因果'],
    lines: {
      appear: '那汉子指节捏得咔咔作响，掌心竟燃起一撮幽幽的火苗：「识相的，留下买路钱。」',
      hurt: '散修连退三步，眼里的轻慢褪了个干净：「你这身手，不对！」',
      fear: '散修的火苗矮了下去，握诀的手指止不住地抖。',
      death: '散修口吐血沫瘫在地上，出气多，进气少。',
      submit: '散修腿一软，膝盖先于脑子着了地：「爷！小的有眼无珠！」'
    },
    loot: { money: [20, 45], items: [{ id: 'ganliang', p: 0.4, n: 1 }] },
    boss: false
  });

  G.define('npc', {
    id: 'jiedao_sanxiu', name: '劫道散修', fav0: 0, realm0: 2,
    loc: 'heishan_waiwei',
    desc: '不知从哪儿流窜来的野路子修士，会两手粗浅法术，专在荒山野径剪径。',
    monthly: [
      { // 流窜：在野外几处地界之间换窝
        cond: { noflag: 'sanxiu_guifu' },
        chance: 0.4,
        effects: [
          { roll: { chance: 0.34,
            success: [{ npcSet: { id: 'jiedao_sanxiu', key: 'location', v: 'heishan_waiwei' } }],
            fail: [{ roll: { chance: 0.5,
              success: [{ npcSet: { id: 'jiedao_sanxiu', key: 'location', v: 'feikuang' } }],
              fail: [{ npcSet: { id: 'jiedao_sanxiu', key: 'location', v: 'shanshenmiao' } }] } }] } }
        ],
        note: '荒野流窜换窝'
      },
      { // 盯上玩家：钱多名薄、又在野地里走——下个月，路就不好走了
        cond: { money: { gte: 40 }, fame: { lte: 30 },
          noflag: ['sanxiu_dingshang', 'sanxiu_guifu'],
          any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }, { loc: 'feikuang' }, { loc: 'shanshenmiao' }] },
        chance: 0.3,
        effects: [
          { flagSet: { id: 'sanxiu_dingshang' } },
          { eventDelay: { id: 'ev_npc_jiedao', months: 1, note: '有双眼睛缀上了你' } },
          { log: { t: '你总觉得身后有道目光黏着你。猛一回头，只有山风过岗。', style: '凶' } }
        ],
        note: '盯上肥羊，次月拦路'
      },
      { // 背景音：他在别处作案
        cond: { noflag: 'sanxiu_guifu' },
        chance: 0.08,
        effects: [
          { wvarAdd: { villageFear: 2 } },
          { rumorAdd: { t: '北边官道又有人被剪了径。听说那贼人手上，会冒火。', fame: 0 } }
        ],
        note: '流窜作案'
      },
      { // 跪服之后：山道上远远抱拳，绕道而行——日常装逼氛围
        cond: { flag: 'sanxiu_guifu',
          any: [{ loc: 'heishan_waiwei' }, { loc: 'heishan_shenchu' }, { loc: 'feikuang' }, { loc: 'shanshenmiao' }] },
        chance: 0.12,
        effects: [
          { fame: 1 },
          { log: { t: '山道对面一条人影远远朝你抱了个拳，随即绕进林子里去了。', style: '吉' } }
        ],
        note: '服软后的敬畏'
      }
    ]
  });

  // 私有事件：拦路（被盯上的次月必发；威压够高时引擎自动让他跪——见 enemy fearOf 威压）
  G.define('event', {
    id: 'ev_npc_jiedao', title: '此路不通',
    queueOnly: true, once: false,
    textFn: function () {
      var loc = G.player.location;
      var inTown = (loc === 'qingshizhen' || loc === 'jiazhong' || loc === 'yaopu' || loc === 'wuguan');
      var head = inTown
        ? '出镇的头一道山弯，一条人影从老槐树后踱了出来，正堵在路心。'
        : '荒径转过山嘴，一条人影抱臂坐在道中的青石上，等你多时了。';
      return head + '他掌心托着一撮幽幽火苗，皮笑肉不笑：「二十两。买你接下来一整年的太平。」';
    },
    choices: [
      {
        text: '掏钱买路',
        cond: { money: { gte: 20 } },
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'sanxiu_dingshang', v: false } },
          { money: -20 },
          { pflagSet: { id: 'gei_guo_mailuqian' } },
          { log: { t: '他掂了掂钱袋，咧嘴一笑：「爽快。山高路远，好走不送。」', style: '凶' } }
        ] }]
      },
      {
        text: '拔刃，拼一场',
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'sanxiu_dingshang', v: false } },
          { combat: {
            enemy: 'sanxiu_jiedao',
            intro: '你把行囊往道旁一抛，缓缓拔出了兵刃。',
            onWin: [
              { flagSet: { id: 'sanxiu_guifu' } },
              { pflagSet: { id: 'enshi_sanxiu' } },
              { tendAdd: { xuejian: 2 } },
              { log: { t: '你收了手。他连滚带爬遁进山林，再没敢回头。', style: '战' } },
              { rumorAdd: { t: '那个剪径的散修撞上硬点子了，听说跑的时候连鞋都跑丢了一只。', fame: 3 } }
            ],
            onFlee: [
              { log: { t: '你且战且退甩脱了他。身后传来一声呸：「算你跑得快！」', style: '凶' } }
            ]
          } }
        ] }]
      },
      {
        text: '报上自己的名号',
        cond: { any: [{ fame: { gte: 60 } }, { title: 'heishan_lielangren' }, { title: 'zhanlang_zhe' }] },
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'sanxiu_dingshang', v: false } },
          { flagSet: { id: 'sanxiu_guifu' } },
          { fame: 3 },
          { log: { t: '你报出名号。他掌心的火「噗」地灭了，膝盖先于脑子着了地。', style: '吉' } },
          { branch: { cond: { pflag: 'gei_guo_mailuqian' }, then: [
            { money: 20 },
            { log: { t: '「上回那二十两，小的、小的一直替您存着！」他双手把钱奉还过头顶。', style: '吉' } }
          ], else: [
            { money: 8 },
            { log: { t: '他从怀里哆哆嗦嗦摸出几两碎银：「一点压惊钱，您千万收下。」', style: '吉' } }
          ] } },
          { rumorAdd: { t: '听说那剪径的散修一听对面名号，磕头磕得山响。', fame: 0 } }
        ] }]
      },
      {
        text: '杀人越货',
        cond: { any: [{ counter: { id: 'shaqi', gte: 25 } }, { tend: { id: 'xuejian', gte: 40 } }] },
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'sanxiu_dingshang', v: false } },
          { combat: {
            enemy: 'sanxiu_jiedao',
            intro: '你没有答话，出手便是杀招——劫道的撞上索命的了。',
            onWin: [
              { npcSet: { id: 'jiedao_sanxiu', key: 'alive', v: false } },
              { pflagSet: { id: 'sha_le_sanxiu' } },
              { counterAdd: { shaqi: 6 } },
              { counterAdd: { xuexing: 3 } },
              { money: 15 },
              { log: { t: '你抹了他的脖子，翻走了他全部家当。山风把血腥味吹散在林子里。', style: '血' } },
              { rumorAdd: { t: '山道上发现了那散修的尸首。下手的是谁，镇上没人敢往下问。', fame: 0 } }
            ],
            onFlee: [
              { log: { t: '他见势不妙，化作一道烟尘窜下了山坡。这梁子结死了。', style: '凶' } }
            ]
          } }
        ] }]
      },
      {
        text: '转身就跑',
        outcomes: [
          { weight: 6, cond: { stat: { id: 'min', gte: 5 } }, effects: [
            { flagSet: { id: 'sanxiu_dingshang', v: false } },
            { log: { t: '你拔腿钻进林子，七拐八绕，身后的叫骂声渐渐听不见了。', style: '平' } }] },
          { weight: 5, effects: [
            { flagSet: { id: 'sanxiu_dingshang', v: false } },
            { combat: {
              enemy: 'sanxiu_jiedao',
              intro: '你刚转身，那撮火苗已经欺到了你的后心——躲不掉了。',
              onWin: [
                { flagSet: { id: 'sanxiu_guifu' } },
                { pflagSet: { id: 'enshi_sanxiu' } },
                { log: { t: '狼狈接战，你竟反手把他打翻在地。他爬起来就跑，头也不回。', style: '战' } }
              ],
              onFlee: [{ log: { t: '连滚带爬，你总算逃出了他的视线。', style: '凶' } }]
            } }] }
        ]
      }
    ]
  });

  // 对话：寻那散修买消息——贼最熟的就是路
  G.define('action', {
    id: 'xun_sanxiu_maixiaoxi', name: '寻那散修买消息', desc: '贼人眼贼。花几个钱，听他说说这片荒山的门道。',
    loc: 'heishan_waiwei', timeCost: 1, risk: 0, order: 55,
    cond: { npcAlive: 'jiedao_sanxiu', money: { gte: 5 },
      any: [{ flag: 'sanxiu_guifu' }, { pflag: 'gei_guo_mailuqian' }, { npcFav: { id: 'jiedao_sanxiu', gte: 10 } }] },
    effects: [
      { money: -5 },
      { npcFavAdd: { id: 'jiedao_sanxiu', n: 2 } }
    ],
    outcomes: [
      { weight: 3, effects: [
        { revealLoc: 'feikuang' },
        { tendAdd: { yinguo: 1 } },
        { log: { t: '「废矿那头夜里有亮，蓝幽幽的。」他压低声音，「钱再多，我也不去。」', style: '凶' } }] },
      { weight: 3, effects: [
        { revealLoc: 'heishan_shenchu' },
        { log: { t: '「过了断剑崖就是狼王的地界。」他啐了一口，「命硬，你就去。」', style: '平' } }] },
      { weight: 4, effects: [
        { tendAdd: { yinguo: 1 } },
        { wvarAdd: { villageFear: -1 } },
        { log: { t: '他絮叨了一堆道听途说：谁家走了夜路，哪段官道太平。也算值几个钱。', style: '平' } }] }
    ]
  });

  // ════════════════════════════════════════════════════════════════════
  // ──────────────────────  v2 横向扩展：6 个新 NPC  ──────────────────────
  // ════════════════════════════════════════════════════════════════════
  //
  // ── v2 本段登记的跨内容咬合点 ──
  // 世界 flag（本世）：
  //   hupo_huan_shou        狐婆已传授魅术残篇（每世门闩）
  //   hupo_huo_sui          狐祟扩散（ghostQi 高时狐婆放纵狐脉；C3 狐坳线可引）
  //   hupo_jing_le          狐婆坳已靖（老狐仙伏诛）的单次播报门闩
  //   hupo_zhi_laohu        狐婆已点破老狐仙底细（→ 老狐仙线情报，配 mem_intel_laohu）
  //   zjw_xiu_jian          铸剑老人已为玩家修复断剑（每世门闩）
  //   zjw_kai_lu            剑冢认主（剑灵伏诛）后老人开炉的单次播报门闩
  //   heshen_su_ji          河神索祭：缺祭品时河患升（ev_npc_heshen_suoji 防重门闩）
  //   shuoshu_bian_shu      说书人已把玩家编入新段子（每世门闩）
  //   shuoshu_bi_kou        说书人惧玩家煞气，闭口避祸（每世门闩）
  // 注：hu_an_jing / jianzhong_renzhu / heshen_ping / luanzang_an / shouwang_fu / hantan_ding
  //   是 legacy（跨世痕迹，C4 Boss onWin legacySet 落），本文件一律用 {legacy:'..'} 读、
  //   {not:{legacy:'..'}} 反查；在世即时信号则用对应 bossAlive/bossDead。绝不写成 flag/noflag。
  // 玩家 pflag（本世）：
  //   humei_can_pian        得狐婆魅术残篇（喂 humei；C3/战斗可引）
  //   hu_yang_qin           狐婆认下狐养儿这一世的血脉亲（戏份门闩）
  //   yujian_can_pian       剑诀残篇（C1 出生/C3 事件落；本文件读作铸剑老人修剑门槛）
  //   xianghuo_ji_fa        得河婆香火祭法（喂 xianghuo；河神战前情报门闩、献祭选项门闩）
  //   chaodu_xin            随拾骸老者超度过无主骸骨（阴德事，social.js 善人称号引）
  //   youyi_song_fang       游方郎中已赠寒毒残方（每世门闩）
  //   shuoshu_ting_shu      在说书人摊子上听过自己的段子（今昔对比原料，social.js 可引）
  // 本段新增 item：
  //   hu_meifen（狐媚粉，消耗，喂 humei）/ duan_jian（一截断剑，material，铸剑老人可修）/
  //   xiang_zhu（祈愿香烛，consumable，喂 xianghuo）/ ku_hun_fan（枯魂幡，misc，拾骸超度用）/
  //   han_ying_shi（寒萤石，material，游方郎中收购 / 喂 handu）
  // 本段私有 event：ev_npc_hujen_shitan（狐婆施幻试探）/ ev_npc_heshen_suoji（河神索祭）/
  //   ev_npc_shihai_yejing（拾骸夜出遇厉鬼预警）
  // 本段私有 enemy：hupo_huanying（狐婆幻影，nonLethal 试探体；ids.js 六敌六 Boss 之外私有补充，C4 勿重名）
  // 引用跨文件 id（均在蓝图 §6 钉死表）：
  //   Boss：laohu_xian / jianzhong_jianling / heshen / luanzang_li_zu / houshan_shouwang / hantan_jiao
  //   Boss 情报记忆（C1 定义）：mem_intel_laohu / mem_intel_jianling / mem_intel_heshen / mem_intel_lizu
  //   普通敌（C4 定义）：humei_yao / ligui / shuigui / hanjiao_you / bali / jianzhong_canling
  //   机缘记忆（C1 定义，对齐 C3/C1 既有用法）：mem_jianzhong_jianming（剑冢剑鸣）/
  //     mem_hedi_chenzhong（河底沉钟）/ mem_luanzang_diyu（乱葬低语）/ mem_hantan_languang（寒潭蓝光）
  //   出生：huyang_er / zhujian_tu / yujia_nü / juemu_zi / gengfu_zi
  // ── v2 自检十问（以本段为体）──
  // 1标签：狐/幻/剑/水/渡/葬/香火/夜/寒。2易共现：狐婆↔ghostQi、河婆↔河患、拾骸↔ghostQi/夜、
  //   铸剑↔御剑倾向、郎中↔药价/寒萤石、说书↔名望。3排斥：六人各守一地一线互不串戏；
  //   离场/失踪/死亡后月度行为与对话全停（npcAlive/flag 守卫）。4改状态：阴气/河患/好感/倾向/flag/
  //   情报记忆/魅术残篇/剑诀残篇/香火祭法/传闻。5后果：狐婆纵狐则阴气涨；河神索祭缺品则河患升；
  //   拾骸夜出预警厉鬼；说书人把事迹今昔对比散播。6可解释：续脉/寻主/镇患/超度/寻药/攒奇谈，
  //   每条行为长在欲望与恐惧上。7钩子：全部 flag/pflag 上表登记，各引向对口新 Boss 线与新道。
  // 8有趣选择：受幻还是破幻、修剑认主与否、献祭与否、超度积德、卖药换方、自己的段子听不听。
  // 9服务 build：狐婆喂 humei、铸剑喂 yujian、河婆喂 xianghuo、拾骸喂 yinguo/xianghuo、
  //   郎中喂 danyao/handu、说书喂传闻/因果。10不暴露：台词只谈狐脉、剑、香火、骸骨、药账、奇谈，无机制词。

  // ════════════════════════════════════════════
  // 七、狐婆（狐婆坳）—— 想给狐脉续一炷人间香火的人
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'hu_meifen', name: '狐媚粉', type: 'consumable', price: 30,
    desc: '狐婆坳特有的暗红香粉，闻久了眼前会浮起不在场的人影。撒一撮在掌心，自有蛊惑人心的妙用。',
    use: [
      { counterAdd: { xinmo: 3 } },
      { tendAdd: { humei: 4 } },
      { log: { t: '你捻起一撮香粉，眼前忽然花了花。再定睛，掌心空空，心里却莫名活络起来。', style: '异象' } }
    ]
  });

  // 私有敌人：狐婆的幻影分身（nonLethal——她只是试你的心，不取你的命）
  G.define('enemy', {
    id: 'hupo_huanying', name: '狐影', tier: 3,
    hp: 70, atk: 11, def: 2, spd: 12,
    traits: ['nonLethal', 'phys_resist:0.5'],
    immune: ['流血'],
    fearOf: ['雷', '剑', '威压'],
    lines: {
      appear: '雾里走出一个和你一模一样的影子，连衣角的破处都分毫不差，只是眼瞳是竖的。',
      hurt: '那影子被你一击打散，重又在三步外凝起，咯咯地笑。',
      fear: '影子的轮廓抖了抖，竟有些站不稳了。',
      death: '影子化作一缕暗香散去，雾里传来狐婆苍老的叹息：「心还算硬。」',
      submit: '影子敛了笑，朝你福了一福，散进雾里。'
    },
    loot: { money: [0, 0], items: [{ id: 'hu_meifen', p: 0.5, n: 1 }] },
    boss: false
  });

  G.define('npc', {
    id: 'hupo', name: '狐婆', fav0: 0, realm0: 2,
    loc: 'hupo_ao',
    desc: '狐婆坳里独居的老妪，谁也说不清她的年纪。她身边总绕着几只皮毛油亮的狐狸，唤它们的名字，像唤自家儿孙。',
    monthly: [
      { // 续脉：阴气渐起的年月，她在坳里给狐脉添香——狐祟便随之外溢
        cond: { wvar: { id: 'ghostQi', gte: 50 }, noflag: 'hupo_huo_sui',
          bossAlive: 'laohu_xian', not: { legacy: 'hu_an_jing' } },
        chance: 0.25,
        effects: [
          { flagSet: { id: 'hupo_huo_sui' } },
          { wvarAdd: { ghostQi: 4 } },
          { rumorAdd: { t: '近来夜里出坳的人，总说瞧见旧相识在路边唤自己，回家一问，那人正睡在炕上。', fame: 0 } }
        ],
        note: '续狐脉，狐祟外溢'
      },
      { // 狐祟既起，便会持续蚕食人心，直到狐婆坳被靖
        cond: { flag: 'hupo_huo_sui', bossAlive: 'laohu_xian', not: { legacy: 'hu_an_jing' } },
        chance: 0.3,
        effects: [
          { wvarAdd: { ghostQi: 2 } },
          { wvarAdd: { villageFear: 2 } },
          { log: { t: '又有走夜路的人魂不守舍地回了镇，说在狐婆坳口看见了死去多年的亲人。', style: '凶' } }
        ],
        note: '狐祟蚕食（持续）'
      },
      { // 老狐仙这尊大的镇在坳底，狐婆既敬且惧；坳被靖（老狐仙伏诛）后她也消停
        cond: { any: [{ bossDead: 'laohu_xian' }, { legacy: 'hu_an_jing' }], noflag: 'hupo_jing_le' },
        chance: 0.4,
        effects: [
          { flagSet: { id: 'hupo_huo_sui', v: false } },
          { flagSet: { id: 'hupo_jing_le' } },
          { log: { t: '狐婆坳近来安静了。听采药人说，那老妪坐在坳口晒太阳，身边一只狐都没有了。', style: '世界' } }
        ],
        note: '坳靖之后（单次播报）'
      },
      { // 寻主续脉：对有狐缘的来客（狐养儿出身或已沾魅气），她格外上心
        cond: { npcFav: { id: 'hupo', gte: 20 }, noflag: 'hupo_huan_shou', bossAlive: 'laohu_xian',
          any: [{ birth: 'huyang_er' }, { pflag: 'humei_can_pian' }, { tend: { id: 'humei', gte: 30 } }] },
        chance: 0.4,
        effects: [
          { flagSet: { id: 'hupo_huan_shou' } },
          { pflagSet: { id: 'humei_can_pian' } },
          { itemAdd: { id: 'hu_meifen', n: 1 } },
          { log: { t: '狐婆枯瘦的手按上你的眉心：「你身上这点狐缘，是娘胎里带的。这残篇，拿去。」', style: '异象' } }
        ],
        note: '认狐缘，授魅术残篇'
      },
      { // 狐养儿归坳：认下血脉亲（戏份，一次性）
        cond: { birth: 'huyang_er', npcFav: { id: 'hupo', gte: 35 }, nopflag: 'hu_yang_qin', bossAlive: 'laohu_xian' },
        chance: 0.3,
        effects: [
          { pflagSet: { id: 'hu_yang_qin' } },
          { npcFavAdd: { id: 'hupo', n: 10 } },
          { log: { t: '狐婆摩挲着你的脸，浑浊的眼里落下泪来：「我的儿……总算又回坳里来了。」', style: '平' } }
        ],
        note: '狐养儿归坳，认亲'
      }
    ]
  });

  // 私有事件：狐婆施幻试探——雾起，你迎面撞见另一个自己
  G.define('event', {
    id: 'ev_npc_hujen_shitan', title: '雾里的人',
    queueOnly: true, once: true,
    textFn: function () {
      return '狐婆坳的雾说起就起。雾里有人朝你走来，走近了你才寒毛倒竖——那是你自己，连破衣角都一样，' +
        '只是一双眼睛瞳孔竖立。「你究竟是人是狐？」苍老的声音从四面八方传来，「自己分得清么？」';
    },
    choices: [
      {
        text: '拔刃，破了这幻象',
        outcomes: [{ weight: 1, effects: [
          { combat: {
            enemy: 'hupo_huanying',
            intro: '你不愿陪她玩这心障的把戏，横刀斩向那个「自己」。',
            onWin: [
              { npcFavAdd: { id: 'hupo', n: 8 } },
              { tendAdd: { yujian: 2 } },
              { counterAdd: { xinmo: -2 } },
              { log: { t: '幻影碎了。雾散处，狐婆拄杖立着，眯眼打量你：「破幻的人，不多见。」', style: '异象' } },
              { rumorAdd: { t: '听说狐婆坳里那老妪近来逢人就问：你们镇上，是不是来了个心硬的后生。', fame: 1 } }
            ],
            onFlee: [
              { counterAdd: { xinmo: 2 } },
              { log: { t: '你且战且退冲出雾团。身后狐婆的笑声追了很远：「跑什么，又不吃你。」', style: '凶' } }
            ]
          } }
        ] }]
      },
      {
        text: '凝神不动，由它去',
        cond: { counter: { id: 'xinmo', lte: 20 } },
        outcomes: [{ weight: 1, effects: [
          { npcFavAdd: { id: 'hupo', n: 6 } },
          { counterAdd: { xinmo: -1 } },
          { tendAdd: { xianghuo: 1 } },
          { log: { t: '你立定不动，任那「自己」在眼前晃。半晌雾散，狐婆颔首：「真心不动，难得。」', style: '因果' } }
        ] }]
      },
      {
        text: '伸手去抓那个「自己」',
        outcomes: [{ weight: 1, effects: [
          { counterAdd: { xinmo: 4 } },
          { tendAdd: { humei: 3 } },
          { itemAdd: { id: 'hu_meifen', n: 1 } },
          { log: { t: '你一把抓住那影子的手腕——入手温软，竟是真的。狐婆笑了：「你也是这路人。」', style: '异象' } }
        ] }]
      }
    ]
  });

  // 对话：到坳里听狐婆说狐——好感深了，她会道破坳底那尊老狐仙的底细
  G.define('action', {
    id: 'ting_hupo_shuohu', name: '听狐婆说狐', desc: '提一包点心进狐婆坳，听那老妪讲她那些「儿孙」的旧事。',
    loc: 'hupo_ao', timeCost: 1, risk: 1, order: 40,
    cond: { npcAlive: 'hupo' },
    effects: [{ npcFavAdd: { id: 'hupo', n: 3 } }],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { humei: 1 } },
        { log: { t: '她讲狐如何修行、如何借人身续脉，讲到兴处，几只狐围着你的脚踝打转。', style: '平' } }] },
      { weight: 3, cond: { wvar: { id: 'ghostQi', gte: 50 } }, effects: [
        { counterAdd: { xinmo: 1 } },
        { log: { t: '「近来坳里不太平。」她往雾深处望，「连我，也有些镇不住它们了。」', style: '凶' } }] },
      { weight: 4, cond: { npcFav: { id: 'hupo', gte: 40 }, noflag: 'hupo_zhi_laohu',
          not: { mem: 'mem_intel_laohu' } },
        effects: [
          { flagSet: { id: 'hupo_zhi_laohu' } },
          { memAdd: 'mem_intel_laohu' },
          { npcFavAdd: { id: 'hupo', n: 3 } },
          { log: { t: '她压低声音：「坳底那位千年的老祖宗，最恨人窥它真身。你若起了真心，幻术近不得你。」', style: '因果' } }] },
      { weight: 2, cond: { pflag: 'hu_yang_qin' }, effects: [
        { healInjury: { months: 1, severity: 1 } },
        { log: { t: '她非留你吃饭，把最好的一块肉夹进你碗里，絮絮叨叨问你在外头过得好不好。', style: '吉' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 八、铸剑老人（断剑崖）—— 一辈子想给剑冢寻一个主人的人
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'duan_jian', name: '一截断剑', type: 'material', price: 12,
    desc: '断剑崖下随处可拾的断剑残锋，锈得只剩半截。寻常人当废铁，识货的人，能听见它在响。'
  });

  G.define('npc', {
    id: 'zhujian_weng', name: '铸剑老人', fav0: 0, realm0: 1,
    loc: 'duanjianya',
    desc: '断剑崖下结庐的老铸匠，一手好剑术，却再不开炉。他说，剑冢里那么多剑都没等到主人，他铸的又算什么。',
    monthly: [
      { // 寻主：他在崖下听剑，盼着哪天有共鸣的人路过
        cond: { bossAlive: 'jianzhong_jianling' },
        chance: 0.12,
        effects: [
          { log: { t: '断剑崖下又传出叮叮的磨剑声。老人说，他在替剑冢里的剑，养着那点不肯散的剑意。', style: '世界' } }
        ],
        note: '崖下听剑寻主'
      },
      { // 恐惧：剑灵未认主，时而躁动伤及无辜（前置传闻 + 阴气）
        cond: { bossAlive: 'jianzhong_jianling' },
        chance: 0.1,
        effects: [
          { wvarAdd: { ghostQi: 2 } },
          { rumorAdd: { t: '断剑崖夜里有剑鸣，凄厉得像哭。砍柴的不敢再上崖了——怕被那没主的剑气削了去。', fame: 0 } }
        ],
        note: '剑灵躁动伤人（恐惧）'
      },
      { // 修剑：对有剑缘的来客（铸剑徒出身或已习剑诀），他亲手修复断剑
        cond: { npcFav: { id: 'zhujian_weng', gte: 25 }, noflag: 'zjw_xiu_jian',
          item: { id: 'duan_jian' },
          any: [{ birth: 'zhujian_tu' }, { tend: { id: 'yujian', gte: 30 } }, { pflag: 'yujian_can_pian' }] },
        chance: 0.5,
        effects: [
          { flagSet: { id: 'zjw_xiu_jian' } },
          { itemDel: { id: 'duan_jian', n: 1 } },
          { itemAdd: { id: 'tiejian', n: 1 } },
          { log: { t: '老人接过你那截断剑，闭眼听了半晌，才起了三年没生的炉火：「它认你。」', style: '异象' } }
        ],
        note: '识剑缘，修复断剑'
      },
      { // 剑冢认主之后（剑灵伏诛）：老人了了心愿，重又开炉（单次播报）
        cond: { bossDead: 'jianzhong_jianling', noflag: 'zjw_kai_lu' },
        chance: 0.6,
        effects: [
          { flagSet: { id: 'zjw_kai_lu' } },   // 播报门闩，避免每月刷
          { npcFavAdd: { id: 'zhujian_weng', n: 5 } },
          { rumorAdd: { t: '断剑崖下三年冷的炉子又烧起来了。老铸匠逢人就笑：「我那些剑，总算有人替它们等到了主。」', fame: 0 } }
        ],
        note: '剑冢认主，老人开炉'
      }
    ]
  });

  // 对话：到崖下随铸剑老人听剑——好感深了，他道破剑冢剑灵的来历
  G.define('action', {
    id: 'sui_zhujian_tingjian', name: '随老人听剑', desc: '到断剑崖下寻铸剑老人，听他讲崖上剑冢的来历。',
    loc: 'duanjianya', timeCost: 1, risk: 0, order: 40,
    cond: { npcAlive: 'zhujian_weng' },
    effects: [{ npcFavAdd: { id: 'zhujian_weng', n: 3 } }],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { yujian: 1 } },
        { log: { t: '「剑这东西，是要人养的。」他握着你的手腕比划起剑势，「腕要活，意要直。」', style: '体' } }] },
      { weight: 3, effects: [
        { itemAdd: { id: 'duan_jian', n: 1 } },
        { log: { t: '他从崖根的乱石堆里拣出一截锈剑塞给你：「拿去。听得见它响，你就有缘。」', style: '平' } }] },
      { weight: 4, cond: { npcFav: { id: 'zhujian_weng', gte: 40 },
          not: { mem: 'mem_intel_jianling' } },
        effects: [
          { memAdd: 'mem_intel_jianling' },
          { npcFavAdd: { id: 'zhujian_weng', n: 3 } },
          { log: { t: '「崖上那万剑成的灵，不杀人，只试人。」他眼里有光，「你以剑入剑，它便认你为主。」', style: '因果' } }] },
      { weight: 2, cond: { flag: 'zjw_xiu_jian' }, effects: [
        { tendAdd: { yujian: 2 } },
        { healInjury: { months: 1, severity: 1 } },
        { log: { t: '他替你把剑刃在油石上荡了几个来回，递回来时，剑身映着崖顶一线天光。', style: '吉' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 九、河婆（河神渡）—— 想用一炷香火把河患压下去的人
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'xiang_zhu', name: '祈愿香烛', type: 'consumable', price: 6,
    desc: '河神渡口的红烛素香，渡口人家自家做的。点上一炷，心里的事便有了去处。',
    use: [
      { counterAdd: { xinmo: -4 } },
      { tendAdd: { xianghuo: 3 } },
      { log: { t: '你点起一炷香，烟笔直上升。心里那点乱糟糟的东西，仿佛随烟散了。', style: '吉' } }
    ]
  });

  G.define('npc', {
    id: 'heshen_po', name: '河婆', fav0: 0, realm0: 1,
    loc: 'heshen_du',
    desc: '河神渡口的老船婆，撑了一辈子摆渡船。她说渡口的太平是香火换来的，香火一断，河里那位就要收人。',
    monthly: [
      { // 镇河患：她按时祭河，把河神渡的危险压住
        cond: { noflag: 'heshen_su_ji', not: { legacy: 'heshen_ping' },
          locvar: { loc: 'heshen_du', key: 'danger', gte: 35 } },
        chance: 0.4,
        effects: [
          { locvarAdd: { loc: 'heshen_du', key: 'danger', n: -6 } },
          { log: { t: '河婆又在渡口摆了祭，三牲清酒沉进河里。她说，喂饱了它，它这月就不闹。', style: '世界' } }
        ],
        note: '按时祭河，压河患'
      },
      { // 河神索祭：祭品不继时，河患抬头（缺祭 → 河祸窗口，C3 可引）
        cond: { noflag: 'heshen_su_ji', not: { legacy: 'heshen_ping' },
          locvar: { loc: 'heshen_du', key: 'danger', gte: 55 } },
        chance: 0.25,
        effects: [
          { flagSet: { id: 'heshen_su_ji' } },
          { locvarAdd: { loc: 'heshen_du', key: 'danger', n: 8 } },
          { rumorAdd: { t: '河神渡这季的祭品凑不齐了。河婆夜里在渡口烧纸，说河里那位，已经三个月没吃饱。', fame: 0 } },
          { eventDelay: { id: 'ev_npc_heshen_suoji', months: 1, note: '河神索祭，河婆来寻玩家' } }
        ],
        note: '祭品不继，河神索祭'
      },
      { // 河患既息（legacy），她也卸了一身担子
        cond: { legacy: 'heshen_ping' },
        chance: 0.25,
        effects: [
          { flagSet: { id: 'heshen_su_ji', v: false } },
          { log: { t: '河婆如今撑船不再烧那么多纸了。她说渡口太平了，她也能睡个囫囵觉。', style: '世界' } }
        ],
        note: '河患息，河婆得闲'
      },
      { // 寻香火：对有香火缘的来客（渔家女/还愿出身或已沾愿力），授祭法
        cond: { npcFav: { id: 'heshen_po', gte: 25 }, nopflag: 'xianghuo_ji_fa',
          any: [{ birth: 'yujia_nü' }, { tend: { id: 'xianghuo', gte: 30 } }, { pflag: 'xianghuo_yinji' }] },
        chance: 0.45,
        effects: [
          { pflagSet: { id: 'xianghuo_ji_fa' } },
          { itemAdd: { id: 'xiang_zhu', n: 2 } },
          { log: { t: '河婆把祭河的香谱手把手教你：「敬它的不是供品，是这一炷不歪的心。」', style: '因果' } }
        ],
        note: '授香火祭法'
      }
    ]
  });

  // 私有事件：河神索祭——河婆深夜叩门，求一份压灾的祭品
  G.define('event', {
    id: 'ev_npc_heshen_suoji', title: '河婆叩门',
    queueOnly: true, once: false,
    dueCond: { npcAlive: 'heshen_po', not: { legacy: 'heshen_ping' } },
    textFn: function () {
      return '后半夜，河婆冒雨叩你的门，浑身湿透。「渡口的祭品断了，河里那位今夜就要收人。」' +
        '她枯手攥住你的衣袖，「凑一份祭，或是……你陪我去渡口，替这一渡的人，跟它说几句软话。」';
    },
    choices: [
      {
        text: '出钱凑一份祭品',
        cond: { money: { gte: 15 } },
        outcomes: [{ weight: 1, effects: [
          { money: -15 },
          { flagSet: { id: 'heshen_su_ji', v: false } },
          { locvarAdd: { loc: 'heshen_du', key: 'danger', n: -10 } },
          { npcFavAdd: { id: 'heshen_po', n: 10 } },
          { tendAdd: { xianghuo: 2 } },
          { rumorAdd: { t: '河神渡今夜的祭，是个外乡后生出的钱。河婆逢人就念他的好。', fame: 1 } },
          { log: { t: '三牲沉河，水面咕嘟冒了一串泡，便平了。河婆长出一口气。', style: '因果' } }
        ] }]
      },
      {
        text: '随河婆去渡口祭河',
        cond: { pflag: 'xianghuo_ji_fa' },
        outcomes: [
          { weight: 6, effects: [
            { flagSet: { id: 'heshen_su_ji', v: false } },
            { locvarAdd: { loc: 'heshen_du', key: 'danger', n: -8 } },
            { tendAdd: { xianghuo: 3 } },
            { log: { t: '你照河婆教的香谱起祭。香烟没被河风吹歪。河面下，似有一只巨眼睁了睁，又合上了。', style: '因果' } }] },
          { weight: 3, effects: [
            { flagSet: { id: 'heshen_su_ji', v: false } },
            { memAdd: 'mem_hedi_chenzhong' },
            { tendAdd: { xianghuo: 2 } },
            { counterAdd: { xinmo: 2 } },
            { log: { t: '祭到一半，河底传来沉钟般一声闷响，你眼前发黑——那一瞬，你看清了水下盘着的东西。', style: '异象' } }] }
        ]
      },
      {
        text: '关门不理',
        outcomes: [{ weight: 1, effects: [
          { flagSet: { id: 'heshen_su_ji', v: false } },
          { locvarAdd: { loc: 'heshen_du', key: 'danger', n: 6 } },
          { npcFavAdd: { id: 'heshen_po', n: -6 } },
          { wvarAdd: { villageFear: 4 } },
          { rumorAdd: { t: '河神渡那夜还是淹了人。河婆挨家敲过门，只有几家肯开。', fame: 0 } },
          { log: { t: '你闩了门。雨声里，河婆的脚步声远了。天亮后，渡口少了一个撑船的。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 对话：到渡口随河婆学祭河——好感深了，她道破河神底细
  G.define('action', {
    id: 'sui_heshenpo_jihe', name: '随河婆学祭河', desc: '到河神渡口寻河婆，看她如何用一炷香把河里那位哄住。',
    loc: 'heshen_du', timeCost: 1, risk: 1, order: 40,
    cond: { npcAlive: 'heshen_po' },
    effects: [{ npcFavAdd: { id: 'heshen_po', n: 3 } }],
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { xianghuo: 1 } },
        { log: { t: '她教你看水色辨河神的脾气：「水发黑、起白沫，就别下船——它今天饿。」', style: '平' } }] },
      { weight: 3, cond: { locvar: { loc: 'heshen_du', key: 'danger', gte: 50 } }, effects: [
        { tendAdd: { handu: 1 } },
        { log: { t: '「河底比井里还寒。」她搓着手，「淹死的人都说，下去那一刻，是冻僵的，不是憋死的。」', style: '异象' } }] },
      { weight: 4, cond: { npcFav: { id: 'heshen_po', gte: 40 }, not: { mem: 'mem_intel_heshen' } },
        effects: [
          { memAdd: 'mem_intel_heshen' },
          { npcFavAdd: { id: 'heshen_po', n: 3 } },
          { log: { t: '「它最怕香火还愿的真心，也怕快剑斩水。」她攥紧你的手，「真要除它，别跟它斗水势。」', style: '因果' } }] },
      { weight: 2, cond: { pflag: 'xianghuo_ji_fa' }, effects: [
        { itemAdd: { id: 'xiang_zhu', n: 1 } },
        { counterAdd: { xinmo: -2 } },
        { log: { t: '她看你起香的手势已经像样，欣慰地拍拍你：「这渡口，往后也有人能接了。」', style: '因果' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 十、拾骸老者（乱葬岗）—— 想给一座岗的无主骸骨找个归处的人
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'ku_hun_fan', name: '枯魂幡', type: 'misc', price: 14,
    desc: '拾骸老者扎的小招魂幡，竹骨白纸，写着歪歪扭扭的往生咒。插在荒坟上，据说能让魂魄少走些冤枉路。'
  });

  G.define('npc', {
    id: 'shihai_zhe', name: '拾骸老者', fav0: 0, realm0: 0,
    loc: 'luanzang_gang',
    desc: '乱葬岗上拾骸的老者，背篓里总是半篓白骨。他给无名的死人收骨、立幡、念几句往生咒，几十年如一日。',
    monthly: [
      { // 超度：他日复一日给无主骸骨收骨立幡，压着岗上的怨气
        cond: { not: { legacy: 'luanzang_an' }, locvar: { loc: 'luanzang_gang', key: 'corruption', gte: 30 } },
        chance: 0.4,
        effects: [
          { locvarAdd: { loc: 'luanzang_gang', key: 'corruption', n: -5 } },
          { log: { t: '拾骸老者又在岗上立了几面枯魂幡。他说，名字记不全不要紧，有人念叨着，魂就不冤。', style: '世界' } }
        ],
        note: '收骨立幡，压怨气'
      },
      { // 恐惧：怨气太重时，岗上厉鬼夜出，老者也压不住——给玩家预警
        cond: { bossAlive: 'luanzang_li_zu', locvar: { loc: 'luanzang_gang', key: 'corruption', gte: 55 } },
        chance: 0.25,
        effects: [
          { wvarAdd: { ghostQi: 3 } },
          { rumorAdd: { t: '乱葬岗夜里有鬼火连成一线，往镇子这边漂。拾骸的老头说，岗底下那位，要醒了。', fame: 0 } },
          { eventDelay: { id: 'ev_npc_shihai_yejing', months: 1, note: '拾骸老者夜出遇厉鬼，来寻玩家预警' } }
        ],
        note: '怨气滔天，厉祖将醒（恐惧）'
      },
      { // 乱葬岗安（legacy）之后：老者了愿，岗上太平
        cond: { legacy: 'luanzang_an' },
        chance: 0.25,
        effects: [
          { npcFavAdd: { id: 'shihai_zhe', n: 5 } },
          { log: { t: '乱葬岗上的鬼火灭了。拾骸老者把背篓里最后一副骨头埋了，蹲在新坟前坐了一整天。', style: '世界' } }
        ],
        note: '岗安，老者了愿'
      },
      { // 收徒：对有阴德缘的来客（掘墓/更夫出身或已积阴德），授枯魂幡、引超度线
        cond: { npcFav: { id: 'shihai_zhe', gte: 25 }, nopflag: 'chaodu_xin', not: { legacy: 'luanzang_an' },
          any: [{ birth: 'juemu_zi' }, { birth: 'gengfu_zi' }, { tend: { id: 'yinguo', gte: 30 } }] },
        chance: 0.4,
        effects: [
          { pflagSet: { id: 'chaodu_xin' } },
          { itemAdd: { id: 'ku_hun_fan', n: 2 } },
          { tendAdd: { yinguo: 1 } },
          { log: { t: '老者递给你两面枯魂幡，教你怎么写往生咒：「跟我收骨的人少。你心善，搭把手。」', style: '因果' } }
        ],
        note: '识阴德缘，授枯魂幡'
      }
    ]
  });

  // 私有事件：拾骸夜出遇厉鬼预警——老者深夜来寻，浑身是土
  G.define('event', {
    id: 'ev_npc_shihai_yejing', title: '拾骸人夜奔',
    queueOnly: true, once: false,
    dueCond: { npcAlive: 'shihai_zhe', not: { legacy: 'luanzang_an' } },
    textFn: function () {
      return '拾骸老者半夜跌跌撞撞寻来，背篓也丢了，浑身是土。「岗底下那位，今夜从棺里坐起来了。」' +
        '他抓着你直喘，「我立的幡，烧了三十年，今夜全被它一口气吹灭了。镇上……镇上得有个准备。」';
    },
    choices: [
      {
        text: '陪老者去岗上看个究竟',
        cond: { any: [{ realm: { gte: 1 } }, { tend: { id: 'yinguo', gte: 30 } }, { tend: { id: 'xianghuo', gte: 30 } }] },
        outcomes: [
          { weight: 6, effects: [
            { memAdd: 'mem_luanzang_diyu' },
            { tendAdd: { yinguo: 2 } },
            { counterAdd: { xinmo: 3 } },
            { npcFavAdd: { id: 'shihai_zhe', n: 8 } },
            { log: { t: '你随他上了岗。月下一座最大的坟塌了半边，坟里没有尸首，只有无数低语，绕着你的耳朵打转。', style: '异象' } }] },
          { weight: 4, effects: [
            { combat: {
              enemy: 'ligui',
              intro: '岗上一团青磷扑面而来，凝成个披发的人形，张口便扑——一只夜游的厉鬼。',
              onWin: [
                { locvarAdd: { loc: 'luanzang_gang', key: 'corruption', n: -8 } },
                { memAdd: 'mem_luanzang_diyu' },
                { npcFavAdd: { id: 'shihai_zhe', n: 10 } },
                { tendAdd: { xianghuo: 2 } },
                { log: { t: '你打散了那缕厉鬼。老者忙不迭重新点幡，手抖得几乎握不住火折。', style: '战' } },
                { rumorAdd: { t: '乱葬岗那晚的鬼火，是被人镇下去的。拾骸的老头逢人就说，亏得来了个有道行的。', fame: 2 } }
              ],
              onFlee: [
                { counterAdd: { xinmo: 4 } },
                { log: { t: '你拽着老者夺路而逃。身后岗上鬼哭一片，追到岗口才散。', style: '凶' } }
              ]
            } }] }
        ]
      },
      {
        text: '替老者把镇上各家敲醒、闩门',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { villageFear: -3 } },
          { pflagSet: { id: 'chaodu_xin' } },
          { npcFavAdd: { id: 'shihai_zhe', n: 5 } },
          { tendAdd: { yinguo: 1 } },
          { rumorAdd: { t: '厉鬼出岗那夜，有人挨家敲门叫人闩窗。一镇人，没少一口。', fame: 1 } },
          { log: { t: '你陪老者跑了半夜，把临岗几户都叫醒闩了门。天亮鬼火散，总算没出人命。', style: '吉' } }
        ] }]
      },
      {
        text: '让他自己想办法',
        outcomes: [{ weight: 1, effects: [
          { wvarAdd: { ghostQi: 4 } },
          { wvarAdd: { villageFear: 5 } },
          { npcFavAdd: { id: 'shihai_zhe', n: -4 } },
          { log: { t: '你打发走了老者。那夜临岗一户人家，天亮后门窗大开，人却不见了。', style: '凶' } }
        ] }]
      }
    ]
  });

  // 对话：随拾骸老者上岗收骨——阴德事，亦可换得厉祖来历
  G.define('action', {
    id: 'sui_shihai_shougu', name: '随老者收骸骨', desc: '拾骸老者背不动了。随他上乱葬岗收几副无主的骸骨，立两面幡。',
    loc: 'luanzang_gang', timeCost: 1, risk: 1, order: 40,
    cond: { npcAlive: 'shihai_zhe', not: { legacy: 'luanzang_an' } },
    effects: [
      { npcFavAdd: { id: 'shihai_zhe', n: 4 } },
      { pflagSet: { id: 'chaodu_xin' } }
    ],
    outcomes: [
      { weight: 6, cond: { item: { id: 'ku_hun_fan', n: 1 } }, effects: [
        { itemDel: { id: 'ku_hun_fan', n: 1 } },
        { tendAdd: { yinguo: 2 } }, { tendAdd: { xianghuo: 1 } },
        { locvarAdd: { loc: 'luanzang_gang', key: 'corruption', n: -7 } },
        { log: { t: '你把自己那面枯魂幡插在最荒的一座坟头。幡子无风自动，岗上的低语，竟弱了几分。', style: '因果' } }] },
      { weight: 5, effects: [
        { tendAdd: { yinguo: 1 } },
        { locvarAdd: { loc: 'luanzang_gang', key: 'corruption', n: -3 } },
        { log: { t: '你跟着收了三副白骨，立了幡。老者念往生咒，你跟着念，竟也心安。', style: '因果' } }] },
      { weight: 3, effects: [
        { itemAdd: { id: 'ku_hun_fan', n: 1 } },
        { tendAdd: { xianghuo: 1 } },
        { log: { t: '收骨时挖出一面别人立旧的烂幡。老者郑重换了新的：「人换人，幡换幡，香火不能断。」', style: '因果' } }] },
      { weight: 4, cond: { npcFav: { id: 'shihai_zhe', gte: 40 }, not: { mem: 'mem_intel_lizu' } },
        effects: [
          { memAdd: 'mem_intel_lizu' },
          { npcFavAdd: { id: 'shihai_zhe', n: 3 } },
          { log: { t: '「岗底那位是百年怨气聚的厉祖。」老者声音压得极低，「香火能净它，快剑雷火也成。」', style: '因果' } }] },
      { weight: 2, cond: { counter: { id: 'shaqi', gte: 30 } }, effects: [
        { counterAdd: { xinmo: 2 } },
        { log: { t: '你手上沾过血。收骨时那些骨头竟齐齐冲你的方向偏了偏，老者皱起了眉。', style: '凶' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 十一、游方郎中（流动：驿马关 / 青石镇）—— 一辈子在路上找奇药验方的人
  // ════════════════════════════════════════════
  G.define('item', {
    id: 'han_ying_shi', name: '寒萤石', type: 'material', price: 16,
    desc: '废矿与寒潭深处才有的蓝色萤石，入手刺骨，黑暗里幽幽发蓝。识货的郎中拿它入药，寻常人捂久了要生冻疮。'
  });

  G.define('npc', {
    id: 'youyi_lang', name: '游方郎中', fav0: 0, realm0: 0,
    loc: 'yima_guan',
    desc: '挑着药担子走方的郎中，一年里有大半在路上。最爱收些古怪药材，说要验一个失传的方子。他和回春堂掌柜，是有些旧交情的。',
    monthly: [
      { // 走方：随药价高低在驿马关与青石镇之间挪窝（药贵则进镇，药贱则守关口收货）
        cond: {},
        chance: 0.4,
        effects: [
          { branch: { cond: { wvar: { id: 'marketPrice', gte: 115 } },
            then: [{ npcSet: { id: 'youyi_lang', key: 'location', v: 'qingshizhen' } }],
            else: [{ npcSet: { id: 'youyi_lang', key: 'location', v: 'yima_guan' } }] } }
        ],
        note: '随药价走方换窝'
      },
      { // 寻药：药价高的年月，他四处张贴收药的招子，连带把行情又抬一抬
        cond: { wvar: { id: 'marketPrice', gte: 120 } },
        chance: 0.2,
        effects: [
          { wvarAdd: { marketPrice: 3 } },
          { rumorAdd: { t: '走方的郎中沿街贴招子，高价收寒萤石、狐媚粉一类怪东西。药价又被他撩拨得涨了涨。', fame: 0 } }
        ],
        note: '寻药抬价'
      },
      { // 恐惧：庸医名声。施错过药的年月（villageFear 高），他低调避祸
        cond: { wvar: { id: 'villageFear', gte: 60 } },
        chance: 0.2,
        effects: [
          { npcSet: { id: 'youyi_lang', key: 'location', v: 'yima_guan' } },
          { log: { t: '镇上人心惶惶，游方郎中卷起药担子躲去了关口——他这行当，最怕被人当替罪羊。', style: '世界' } }
        ],
        note: '避庸医之祸'
      },
      { // 赠方：交情够、又沾寒毒/丹道的来客，他赠一张治寒毒的残方（每世一次）
        cond: { npcFav: { id: 'youyi_lang', gte: 30 }, nopflag: 'youyi_song_fang',
          any: [{ tend: { id: 'handu', gte: 30 } }, { tend: { id: 'danyao', gte: 30 } }, { counter: { id: 'dandu', gte: 30 } }] },
        chance: 0.4,
        effects: [
          { pflagSet: { id: 'youyi_song_fang' } },
          { itemAdd: { id: 'han_ying_shi', n: 1 } },
          { tendAdd: { danyao: 1 } },
          { log: { t: '郎中神秘兮兮塞给你半张药方：「寒毒入络的方子，缺一味药引。你要寻齐了，记得回来告诉我。」', style: '丹' } }
        ],
        note: '赠寒毒残方'
      }
    ]
  });

  // 对话：向游方郎中出脱药材——他收寒萤石等怪药，价随行情，亦给丹道指点
  G.define('action', {
    id: 'mai_yaocai_youyi', name: '向游方郎中卖药', desc: '游方郎中的药担子就在跟前。把寒萤石、狐媚粉一类山货卖给他，他向来识货。',
    loc: null, timeCost: 1, risk: 0, order: 58,
    // 流动 NPC：DSL 无 npcLoc 条件，故只在郎中可能落脚的两个枢纽（驿马关/青石镇）放出此行动。
    // 顶层两个 any 同名会被 JS 去重，故用 all 包住地点 any，与物品 any 并列（皆 AND）。
    cond: { npcAlive: 'youyi_lang',
      any: [{ item: { id: 'han_ying_shi' } }, { item: { id: 'hu_meifen' } }],
      all: [{ any: [{ loc: 'yima_guan' }, { loc: 'qingshizhen' }] }] },
    effects: [
      { npcFavAdd: { id: 'youyi_lang', n: 2 } },
      { branch: { cond: { item: { id: 'han_ying_shi' } }, then: [
        { itemDel: { id: 'han_ying_shi', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } }, then: [{ money: 22 }], else: [{ money: 14 }] } }
      ] } },
      { branch: { cond: { item: { id: 'hu_meifen' } }, then: [
        { itemDel: { id: 'hu_meifen', n: 1 } },
        { branch: { cond: { wvar: { id: 'marketPrice', gte: 120 } }, then: [{ money: 30 }], else: [{ money: 22 }] } }
      ] } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { log: { t: '郎中眯眼验了验成色，掂了掂分量，痛快地数钱给你：「好东西。下回有，还找我。」', style: '平' } }] },
      { weight: 3, cond: { npcFav: { id: 'youyi_lang', gte: 20 } }, effects: [
        { money: 2 }, { tendAdd: { danyao: 1 } },
        { log: { t: '他多给了你两个钱，顺手教你认了味药引的成色：「学着点，走方的本事，全在这双眼。」', style: '丹' } }] },
      { weight: 3, cond: { counter: { id: 'dandu', gte: 30 } }, effects: [
        { counterAdd: { dandu: -4 } },
        { log: { t: '他号了号你的脉，皱眉开了一剂便宜的解药：「丹吃多了。我这有现成的，拿去。」', style: '丹' } }] },
      { weight: 2, cond: { tend: { id: 'handu', gte: 40 } }, effects: [
        { tendAdd: { handu: 1 } },
        { log: { t: '「你身上这股寒气，比寒萤石还冲。」他端详你半晌，「是块入寒毒一道的料子。」', style: '异象' } }] }
    ]
  });

  // ════════════════════════════════════════════
  // 十二、说书人（青石镇 / 义庄）—— 攒一肚子奇谈、好传世的人（传闻放大器）
  // ════════════════════════════════════════════
  G.define('npc', {
    id: 'shuoshu_ren', name: '说书人', fav0: 0, realm0: 0,
    loc: 'qingshizhen',
    desc: '茶肆里说书的先生，一块惊堂木拍了半辈子。白日说书，夜里却在义庄兼着更夫的差——他说，最好的故事，都在天黑以后。',
    monthly: [
      { // 攒奇谈：把玩家闯下的名头编成新段子（名望够高，每世一次）——传闻放大器
        cond: { fame: { gte: 50 }, nopflag: 'shuoshu_bian_shu' },
        chance: 0.5,
        effects: [
          { pflagSet: { id: 'shuoshu_bian_shu' } },
          { fame: 3 },
          { rumorAdd: { t: '茶肆的说书先生新添了一回书，说的正是你。惊堂木一拍，听客挤得连门槛都站满了。', fame: 0 } }
        ],
        note: '把玩家事迹编成新书'
      },
      { // 今昔对比：他最爱讲「想当年」，把镇上人的旧底翻出来（名望更高时）
        cond: { fame: { gte: 90 }, pflag: 'shuoshu_bian_shu' },
        chance: 0.18,
        effects: [
          { rumorAdd: { t: '说书先生今日讲到一半，忽然停下问听客：「你们可还记得他刚来镇上那会儿？」满座哄笑。', fame: 0 } }
        ],
        note: '今昔对比，翻旧底'
      },
      { // 更夫差事：夜里在义庄打更，撞见些不该撞见的（阴气高的年月）——情报源
        cond: { wvar: { id: 'ghostQi', gte: 55 } },
        chance: 0.25,
        effects: [
          { wvarAdd: { villageFear: 2 } },
          { rumorAdd: { t: '义庄打更的说书先生说，后半夜停尸的板子上，盖着的白布自己动了动。他一宿没敢合眼。', fame: 0 } }
        ],
        note: '义庄打更撞见异事'
      },
      { // 恐惧：说错话惹祸。煞气重的玩家名头，他不敢乱编（避祸）
        cond: { fame: { gte: 60 }, counter: { id: 'shaqi', gte: 40 }, nopflag: 'shuoshu_bi_kou' },
        chance: 0.3,
        effects: [
          { pflagSet: { id: 'shuoshu_bi_kou' } },
          { log: { t: '说书先生本想编你的段子，搁下惊堂木又作罢：「那位的事……还是少说为妙。」', style: '凶' } }
        ],
        note: '惧煞气，闭口避祸'
      }
    ]
  });

  // 对话：到茶肆听说书人讲古——既听别人的奇谈，也能听见自己的段子
  G.define('action', {
    id: 'ting_shuoshu_jianggu', name: '听说书人讲古', desc: '茶肆里说书先生正开讲。要一碗粗茶，坐下听他讲这镇上、这凡间的奇谈。',
    loc: null, timeCost: 1, risk: 0, order: 62,
    cond: { npcAlive: 'shuoshu_ren', money: { gte: 1 },
      all: [{ any: [{ loc: 'qingshizhen' }, { loc: 'yizhuang' }] }] },
    effects: [
      { money: -1 },
      { npcFavAdd: { id: 'shuoshu_ren', n: 2 } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { counterAdd: { xinmo: -2 } },
        { log: { t: '他说的是寒潭蛟、狐婆坳、剑冢成灵的旧闻。半真半假，听得人心里发紧又发痒。', style: '平' } }] },
      { weight: 3, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '一段因果报应的本子，讲得满堂唏嘘。他收了惊堂木：「善恶到头，从来不是空话。」', style: '因果' } }] },
      { weight: 4, cond: { pflag: 'shuoshu_bian_shu' }, effects: [
        { pflagSet: { id: 'shuoshu_ting_shu' } },
        { fame: 1 },
        { log: { t: '今日这回书，说的竟是你自己。听到精彩处，邻座拍案叫好，浑不知主角就坐在身边。', style: '吉' } }] },
      { weight: 3, cond: { npcFav: { id: 'shuoshu_ren', gte: 25 }, wvar: { id: 'ghostQi', gte: 50 } }, effects: [
        { tendAdd: { yinguo: 1 } },
        { log: { t: '散场后他凑过来低声说：「义庄那边近来不干净。你既有些道行，夜里替我留个意。」', style: '凶' } }] }
    ]
  });

})();
