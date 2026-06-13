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
})();
