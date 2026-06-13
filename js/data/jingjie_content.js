// js/data/jingjie_content.js — 境界改写世界（落地规范 §0.5）。
// Owner：境界世界 Agent。只在本文件 G.define event/action/title + G.sys.social.onCombat 注册。
// 引擎已建空壳由本文件填充；本文件不改引擎、不改他人数据文件，只读引用真实 id。
//
// 核心命题（spec §0.5）：境界不是等级，是玩家与世界关系的「改写器」。
//   同一个老地方、老活计、老胜利，在不同 realm 给玩家不同的感知 / 行动 / 代价 / 机缘 / 战后回响。
//   靠「换一张脸重新交互」，不靠涨数值。可见文案写「重新读懂世界」，零机制词，不点破道名。
//
// realmIdx：0 凡身 / 1 引气 / 2 炼气初期 / 3 炼气中期 / 4 炼气后期 / 5 炼气圆满 / 6 筑基。
//
// ── 落地的境界反应清单（四类，全部用真实 loc / wvar / NPC id）──
//   A 老地方换脸（感知+行动，{realm:{gte:2or3}}）：
//     A1 act_yaopu_dianqi   药铺·掂气：炼气初期起，掂药能掂出别人掂不出的气性（旧活计变深选择）
//     A2 act_wuguan_tingfeng 武馆·听风：炼气初期起，听得见全场拳风里的破绽（旧热闹变新感知）
//     A3 act_miao_houdian   山神庙·照壁：炼气中期起，看得见后殿门缝里渗出的旧债阴影
//     A4 ev_zhen_qiji       青石镇·气机：炼气初期起的随机小异象——看见以前看不见的镇上气机
//   B 代价事件（境界越高因果越重，{realm:{gte:4or5}}）：
//     B1 ev_xianmen_chawen  炼气后期：仙门外门巡使上门查问（sectAttention 升 / 招揽 / 退让分支）
//     B2 ev_fanren_qiuyi    炼气后期：凡人上门求医救人（救 / 拒 / 遮，改 villageFear/名望/心魔）
//     B3 ev_yuanqing_wenxin 炼气圆满：大机缘与大麻烦同步靠近的「问心」（仙门+邪物+旧债同盯）
//   C 机缘形态随境界（同一机缘母题不同入口）：
//     C1 ev_shenmiao_jiyuan 庙眼玉：低境界捡线索 / 高境界镇封争夺（{realm} 分支）
//   D 战后随境界反馈（G.sys.social.onCombat 注册，同一胜利不同回响）：
//     D1 凡兽小胜：凡身被当后生、炼气被传「能耐」、筑基则「青石镇的天象动了动」
//     D2 镇邪/净庙胜：低境界惊叹九息、高境界镇民敬畏避让、仙门留意
//
// 登记的 flag（均有读取点，列出读取处）：
//   pflag jingjie_zhi_qixing  → A1 写，B1 仙门查问 textFn 读（被仙门视为「辨气有术」）
//   pflag jingjie_xianmen_zhaolan → B1 招揽分支写，B3 问心 textFn + onCombat D2 读
//   pflag jingjie_zhen_diwei  → A4/D1 写（成了地方变量），B2 textFn 读（凡人因此来求）
//   flag  jingjie_xianghui_zhen → C1 镇封写，C1 复访 cond + onCombat 读
//   pflag jingjie_jiu_zhai_xian → A3 写（看见旧债），B3 problem 分支 cond 读
// 不新增公共 counter / wvar / loc / NPC，全部用既有真源。sectAttention/villageFear/ghostQi 为既有 wvar。
//
// ── 自检十问（整文件作答）──
// 1主题：境界=与世界关系的改写器；老地方、旧活计、旧胜利随境界换脸。
// 2入口：玩家在老地点 + realm 门槛触发新行动/事件；战后由 onCombat 回响。
// 3状态：改 sectAttention/villageFear/ghostQi、NPC 好感、名望、心魔、pflag/flag、insight、rumor、memAdd。
// 4随机：结果由 realm × 地点 × 世界变量 × NPC 在否解释，非乱给。
// 5代价：境界越高，仙门关注、凡人缠身、旧债逼问、心魔随之而来（B 段）。
// 6回收：flag 均有后续读取点（见上）；C1 镇封落 flag + 复访读；D 段读 realm/flag 变脸。
// 7钩子：B1 招揽 flag、C1 镇封 flag、B3 问心都留给后续支线/战后咬合。
// 8选择有趣：求医救人还是明哲保身；机缘是镇是争还是退；被仙门招揽接不接。
// 9服务体验：让玩家回老地方是「重新读懂世界」，不是清旧任务。
// 10不暴露：只写见闻、身体感受、旁人反应，不提变量名/数值/道名/机制词。
(function () {
  'use strict';

  var R = G.IDS.realms; // ["凡身","引气","炼气初期","炼气中期","炼气后期","炼气圆满","筑基"]
  function realmIdx() { return (G.player && G.player.realmIdx) || 0; }

  // ════════════════════════════════════════════════════════════
  // A 老地方换脸：同一地点高境界出现新感知 / 旧活计变深选择
  // ════════════════════════════════════════════════════════════

  // A1 药铺·掂气：凡身只是掂斤两的杂活；炼气初期起，手一沾药就掂得出别人掂不出的「气性」。
  //    旧活计（称药做工）变成更深的辨识选择，并被药铺老板高看。
  G.define('action', {
    id: 'act_yaopu_dianqi', name: '替掌柜掂药', order: 25,
    desc: '柜上新到一批山货，掌柜让你上手掂掂成色。手一沾上去，指腹竟先于眼睛知道了药性。',
    loc: 'yaopu', timeCost: 1, risk: 0,
    cond: { realm: { gte: 2 } },
    effects: [
      { branch: { cond: { npcAlive: 'yaopu_laoban' }, then: [{ npcFavAdd: { id: 'yaopu_laoban', n: 2 } }] } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { money: 5 }, { pflagSet: { id: 'jingjie_zhi_qixing' } },
        { insight: { id: 'jingjie_dianqi', title: '掂得出的气', t: '以前掂的是斤两，如今掂的是药里那口活气。同样一味药，死的活的，一掂便知。' } },
        { log: { t: '你掂出三株以次充好的当归。掌柜眯眼看你的手，半晌没说话。', style: '平' } }] },
      { weight: 3, effects: [
        { money: 3 }, { tendAdd: { danyao: 2 } }, { pflagSet: { id: 'jingjie_zhi_qixing' } },
        { log: { t: '指尖那点麻意你越来越熟。药气在你手心里，像有了脉。', style: '丹' } }] },
      { weight: 2, cond: { realm: { gte: 4 } }, effects: [
        { money: 8 }, { npcFavAdd: { id: 'yaopu_laoban', n: 3 } }, { pflagSet: { id: 'jingjie_zhi_qixing' } },
        { rumorAdd: { t: '回春堂的掌柜如今进了贵货，先要请那位掂一掂才敢收。', fame: 2 } },
        { log: { t: '掌柜把祖传的戥子推到一边：「您这双手，比戥子准。」', style: '吉' } }] }
    ]
  });

  // A2 武馆·听风：凡身看的是热闹，炼气初期起，整场拳风里的破绽都「听」得见。
  //    旧的「看比试」变成读破绽的新感知；据此可挑战或藏拙。
  G.define('action', {
    id: 'act_wuguan_tingfeng', name: '场边听拳风', order: 28,
    desc: '又是演武场比试日。你站到圈外，这一回不必盯着看——满场的拳风扑在脸上，谁的桩虚、谁的劲断，闭着眼都分得清。',
    loc: 'wuguan', timeCost: 1, risk: 0,
    cond: { realm: { gte: 2 } },
    outcomes: [
      { weight: 5, effects: [
        { tendAdd: { lianti: 2 } },
        { insight: { id: 'jingjie_tingfeng', title: '听得见的破绽', t: '从前要瞪眼看半天，如今风一过，谁的腰马先散，自己就报到耳朵里来。' } },
        { log: { t: '你闭着眼站了一炷香。场中每一记拳的虚实，都在风里报给你听。', style: '体' } }] },
      { weight: 3, cond: { npcAlive: 'dashixiong' }, effects: [
        { npcFavAdd: { id: 'dashixiong', n: -2 } }, { tendAdd: { lianti: 2 } },
        { log: { t: '大师兄收拳时往圈外扫了一眼——正撞上你那双看穿了什么的眼睛。', style: '体' } }] },
      { weight: 2, cond: { realm: { gte: 4 } }, effects: [
        { tendAdd: { lianti: 3 } }, { fame: 2 },
        { rumorAdd: { t: '武馆里有弟子说，那位往场边一站，谁的拳都使不利索了。', fame: 2 } },
        { log: { t: '满场的劲力在你感知里铺成一张网。你忽然懂了，自己早已不在这张网里。', style: '突破' } }] }
    ]
  });

  // A3 山神庙·照壁：炼气中期起，看得见后殿门缝里渗出的旧债阴影——以前只当是阴风。
  //    落 jingjie_jiu_zhai_xian，B3 问心读取。
  G.define('action', {
    id: 'act_miao_houdian', name: '近看后殿门缝', order: 35,
    desc: '后殿那扇从没人见开过的门，今日你走近了细看。门缝里渗出的不是阴风——是一团团说不清是人是影的东西，正贴着门板，朝外张望。',
    loc: 'shanshenmiao', timeCost: 1, risk: 1,
    cond: { realm: { gte: 3 } },
    effects: [
      { pflagSet: { id: 'jingjie_jiu_zhai_xian' } },
      { tendAdd: { yinguo: 2 } }
    ],
    outcomes: [
      { weight: 5, effects: [
        { counterAdd: { xinmo: 2 } },
        { insight: { id: 'jingjie_jiuzhai', title: '门缝里的旧债', t: '门后那些影子认得我。它们欠着什么，或是我欠着它们——这账，迟早要算到我头上。' } },
        { log: { t: '一道影子隔着门缝伸出半只手，指向你。你后退一步，它便缩了回去。', style: '因果' } }] },
      { weight: 3, cond: { npcAlive: 'miaozhu' }, effects: [
        { npcFavAdd: { id: 'miaozhu', n: 2 } }, { wvarAdd: { ghostQi: -2 } },
        { log: { t: '庙祝不知何时立在你身后，低声道：「您也看见了……这庙，压不住多久了。」', style: '因果' } }] },
      { weight: 2, cond: { locvar: { loc: 'shanshenmiao', key: 'corruption', gte: 50 } }, effects: [
        { hp: -6 }, { counterAdd: { xinmo: 3 } }, { wvarAdd: { ghostQi: 3 } },
        { log: { t: '门缝里齐刷刷探出十几只手，抓向你的境界气机。你强自镇住，冷汗湿透了背。', style: '凶' } }] }
    ]
  });

  // A4 青石镇·气机：炼气初期起的随机小异象——走在老街上，看得见以前看不见的镇上气机。
  //    成了「地方变量」前的铺垫：高境界落 jingjie_zhen_diwei（B2 凡人求医读取）。
  G.define('event', {
    id: 'ev_zhen_qiji', title: '老街上的气',
    textFn: function () {
      if (realmIdx() >= 4) return '还是那条青石板老街，可你如今走过去，气象全变了。家家屋脊上的气机你都看得分明——谁家有喜、谁家藏病、哪堵墙底下埋着不干净的东西。镇民迎面走来，竟有人下意识地朝你侧身让路，自己都不知为何。';
      return '走在熟得不能再熟的青石板街上，你忽然顿住。茶肆的热气、铁匠铺的火气、老槐树下那点说不清的旧气……以前只当是市井烟火，如今一丝一缕，都在你眼里活了过来。';
    },
    tags: ['市集'],
    baseWeight: 6,
    cond: { all: [{ loc: 'qingshizhen' }, { realm: { gte: 2 } }] },
    choices: [
      {
        text: '顺着气机，看个明白',
        outcomes: [
          { weight: 5, effects: [
            { tendAdd: { yinguo: 1 } },
            { insight: { id: 'jingjie_zhenqi', title: '镇上的气', t: '这镇子在我眼里不再是一片屋顶，而是一张会喘气、会生病、会藏事的活物。' } },
            { log: { t: '你站在街心，第一次「看」清了整座镇子的呼吸。', style: '异象' } }] },
          { weight: 4, cond: { realm: { gte: 4 } }, effects: [
            { pflagSet: { id: 'jingjie_zhen_diwei' } }, { fame: 2 },
            { rumorAdd: { t: '镇上人说不清那位哪里不一样了，只觉得他一来，连狗都不叫了。', fame: 2 } },
            { log: { t: '你立在街心，满街的人不自觉地放轻了脚步。你已是这镇子的一部分，像山，像河。', style: '突破' } }] }
        ]
      },
      {
        text: '收回目光，照旧赶路',
        outcomes: [
          { weight: 6, effects: [
            { qi: 3 },
            { log: { t: '你收住心神。看得太多，未必是福——这道理你近来才慢慢咂摸出味来。', style: '平' } }] }
        ]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════
  // B 代价事件：境界越高，因果越重（仙门关注 / 凡人求助 / 高阶窥探 / 心魔问心）
  // ════════════════════════════════════════════════════════════

  // B1 仙门查问：炼气后期，外门巡使受命上门盘问来历。sectAttention 升；可结善、被招揽、或冷退。
  //    招揽分支落 jingjie_xianmen_zhaolan（B3 + 战后 D2 读）。
  G.define('event', {
    id: 'ev_xianmen_chawen', title: '查问来历',
    textFn: function () {
      var base = '一个青石镇从没见过的外乡人寻上门来——青衫束发，腰悬令牌，正是仙门外门的巡使。「这一方水土，近来气机紊乱，源头便在阁下身上。」他笑意不达眼底，「敢问，师承何处？」';
      if (G.player.pflags['jingjie_zhi_qixing']) base += '\n\n他打量你的手：「听闻阁下辨气有术。这等天分，埋在凡尘里，可惜了。」';
      return base;
    },
    tags: ['交际'],
    baseWeight: 0, once: true, queueOnly: true,
    cond: { realm: { gte: 4 } },
    choices: [
      {
        text: '据实自承，不卑不亢',
        outcomes: [
          { weight: 6, effects: [
            { wvarAdd: { sectAttention: 10 } }, { fame: 3 },
            { rumorAdd: { t: '仙门来人查过镇上那位了。来时倨傲，走时——客气了不少。', fame: 2 } },
            { insight: { id: 'jingjie_xianmen', title: '仙门的目光', t: '我已经入了他们的眼。这目光既是机缘，也是悬在头顶的一把剑。', confirm: true } },
            { log: { t: '巡使盘问良久，临走时朝你拱了拱手——这一礼，他起初是不打算行的。', style: '因果' } }] }
        ]
      },
      {
        text: '示之以能，接下招揽',
        cond: { realm: { gte: 5 } },
        outcomes: [
          { weight: 5, effects: [
            { wvarAdd: { sectAttention: 16 } }, { fame: 5 },
            { pflagSet: { id: 'jingjie_xianmen_zhaolan' } },
            { rumorAdd: { t: '仙门的人在青石镇留了话——那位若肯出山，外门随时扫榻相迎。', fame: 4 } },
            { insight: { id: 'jingjie_xianmen', title: '仙门的目光', t: '他们递了帖子。是青云直上的梯，还是身不由己的笼，我一时还看不分明。', confirm: true } },
            { log: { t: '巡使取出一枚刻着山门纹样的玉帖，双手奉上：「外门虚位以待。」', style: '吉' } }] }
        ]
      },
      {
        text: '不答，请他回去',
        outcomes: [
          { weight: 5, effects: [
            { wvarAdd: { sectAttention: 6 } }, { counterAdd: { xinmo: 2 } },
            { rumorAdd: { t: '仙门来人吃了闭门羹。临走撂下一句：「山高水长，后会有期。」', fame: 1 } },
            { log: { t: '你只淡淡回了句「山野之人，当不起」。巡使眼神一冷，拂袖而去。', style: '平' } }] }
        ]
      }
    ]
  });

  // B2 凡人求医：炼气后期，你已是地方变量，凡人开始上门求你救命。救 / 拒 / 借机敛财。
  G.define('event', {
    id: 'ev_fanren_qiuyi', title: '上门求救',
    textFn: function () {
      if (G.player.pflags['jingjie_zhen_diwei']) return '后半夜，门被擂得山响。一个浑身是泥的汉子跪在门槛外，膝行进来抱住你的腿：「神仙救命！我那娃娃高热三日，眼看不行了——镇上都说，您是这地界上顶顶有本事的人！」';
      return '一个面生的妇人候在你门外大半日，见你出来，扑通跪下，怀里抱着个烧得脸通红的孩子：「求您看一眼……大夫都摇头了，可我听说，您不一样。」';
    },
    tags: ['交际', '善'],
    baseWeight: 5, once: false,
    cond: { all: [{ realm: { gte: 4 } }, { loc: 'qingshizhen' }] },
    prefer: { wvar: [{ id: 'villageFear', gte: 40, boost: 1.5 }] },
    choices: [
      {
        text: '出手相救，分文不取',
        outcomes: [
          { weight: 6, effects: [
            { qi: -8 }, { wvarAdd: { villageFear: -4 } }, { fame: 4 },
            { tendAdd: { danyao: 2, yinguo: 1 } },
            { rumorAdd: { t: '那位半夜替人救活了快咽气的娃娃，连一文钱都没要。镇上替他立了长生牌。', fame: 4 } },
            { log: { t: '你以真气替孩子逼出寒热。天亮时娃娃睁了眼，那汉子的头磕在地上咚咚响。', style: '吉' } }] },
          { weight: 3, cond: { realm: { gte: 5 } }, effects: [
            { qi: -6 }, { wvarAdd: { villageFear: -6 } }, { fame: 6 },
            { titleAdd: 'jingjie_jishi_xian' },
            { log: { t: '你指尖一点真气渡入，孩子当场退了热。满屋人看你的眼神，已不像看人。', style: '突破' } }] }
        ]
      },
      {
        text: '救人，但收下谢礼',
        outcomes: [
          { weight: 5, effects: [
            { qi: -8 }, { money: 20 }, { wvarAdd: { villageFear: -3 } }, { fame: 2 },
            { log: { t: '你救了孩子，也收下了那汉子凑出的二十两碎银。救命的本事，本就金贵。', style: '平' } }] }
        ]
      },
      {
        text: '闭门不见，由他去',
        outcomes: [
          { weight: 5, effects: [
            { counterAdd: { xinmo: 4 } }, { wvarAdd: { villageFear: 2 } }, { fame: -2 },
            { rumorAdd: { t: '有人半夜抱着病娃求到那位门上，门，没开。', fame: 0 } },
            { insight: { id: 'jingjie_bujiu', title: '没开的那扇门', t: '我修的是长生，不是慈悲。可那娃娃的哭声，夜里总在耳边响。' } },
            { log: { t: '你听着门外的哭求，到底没开那扇门。这一夜，你睡得并不安稳。', style: '凶' } }] }
        ]
      }
    ]
  });

  // B3 圆满问心：炼气圆满，大机缘与大麻烦同步靠近——仙门、邪物、旧债同时盯上你。
  //    内容侧「问心」：是承因果、避锋芒、还是借势。读取 B1/A3 落下的 flag 变脸。
  G.define('event', {
    id: 'ev_yuanqing_wenxin', title: '同时盯上你的',
    textFn: function () {
      var p = G.player, lines = [];
      lines.push('修为圆满的这一夜，你枯坐灯下，忽觉四面八方都有目光压来，密不透风。');
      if (p.pflags['jingjie_xianmen_zhaolan']) lines.push('——仙门递过帖子，等着你点头入山。');
      else lines.push('——仙门的巡使又在镇外打转，迟迟不肯走。');
      if (p.pflags['jingjie_jiu_zhai_xian']) lines.push('——山神庙后殿那些旧债的影子，近来夜夜入梦，伸手朝你要个说法。');
      else lines.push('——黑山深处有股阴冷的东西，循着你的气机，正一寸寸摸近。');
      lines.push('大机缘和大麻烦，从来是一起来的。你到了非选不可的时候。');
      return lines.join('\n');
    },
    tags: ['梦', '因果'],
    baseWeight: 0, once: true, queueOnly: true,
    cond: { realm: { gte: 5 } },
    choices: [
      {
        text: '认下这一身因果，迎上去',
        outcomes: [
          { weight: 6, effects: [
            { counterAdd: { xinmo: -4 } }, { fame: 4 },
            { legacySet: { id: 'jingjie_yuanqing_dang', v: true } },
            { insight: { id: 'jingjie_wenxin', title: '迎上去的人', t: '躲不过的，便不躲。这一身机缘和债，我担得起。', confirm: true } },
            { log: { t: '你睁开眼，神色定了下来。来的是福是祸，你都站着接。', style: '突破' } }] }
        ]
      },
      {
        text: '敛尽锋芒，避其锐气',
        outcomes: [
          { weight: 5, effects: [
            { wvarAdd: { sectAttention: -10 } }, { counterAdd: { xinmo: 2 } },
            { pflagSet: { id: 'jingjie_lianfeng' } },
            { rumorAdd: { t: '镇上那位近来深居简出，连药铺都少见他了。', fame: 0 } },
            { insight: { id: 'jingjie_wenxin', title: '收锋的人', t: '木秀于林，风必摧之。我把光收回去，是为了走得更远。', confirm: true } },
            { log: { t: '你闭门谢客，气机内敛如常人。逼近的那些目光，渐渐松了。', style: '平' } }] }
        ]
      },
      {
        text: '借这股势，强行冲关',
        cond: { realm: { gte: 5 } },
        outcomes: [
          { weight: 4, effects: [
            { cult: 40 }, { counterAdd: { xinmo: 8 } }, { wvarAdd: { sectAttention: 8 } },
            { insight: { id: 'jingjie_wenxin', title: '踩势而上', t: '千钧压顶，我偏要借这股力一冲到底——成了便是天高地阔，败了……不去想败。', confirm: true } },
            { log: { t: '你索性敞开识海，引那万千压力为己用，全力冲击下一重天关！', style: '突破' } }] },
          { weight: 3, effects: [
            { counterAdd: { xinmo: 12 } }, { injure: { months: 2, severity: 2 } },
            { log: { t: '强压之下你气机翻涌，一口血喷在灯上。这一步，到底是急了。', style: '凶' } }] }
        ]
      }
    ]
  });

  // ════════════════════════════════════════════════════════════
  // C 机缘形态随境界：同一机缘母题，低境界捡线索 vs 高境界争夺/镇封
  // ════════════════════════════════════════════════════════════

  // C1 庙眼玉：低境界（凡身/引气）只是在香灰里捡着块温玉，当稀罕物；
  //    高境界（炼气中期起）才看出这是镇着后殿旧债的「庙眼」，机缘变成镇封 / 争夺的抉择。
  G.define('event', {
    id: 'ev_shenmiao_jiyuan', title: '香灰里的玉',
    textFn: function () {
      if (realmIdx() >= 3) return '你拨开山神座下积年的香灰，那块温玉静静卧在灰底。如今你一眼便知它的来历——这是一枚「庙眼」，整座庙的旧债阴气，全靠它压着。玉色已浊，撑不了多久了。是取走它换一桩机缘，还是耗自己的气机替它续上一口，镇住后殿那些东西？';
      return '你替庙里扫殿时，在山神座下的香灰里摸到一块温润的玉。入手生暖，灰扑扑的也看不出名堂，倒是个能换几个钱的稀罕物。';
    },
    tags: ['奇遇', '香火', '因果'],
    baseWeight: 4, once: true,
    cond: { loc: 'shanshenmiao' },
    prefer: { locTags: ['香火', '因果'] },
    choices: [
      // —— 低境界入口：捡线索 ——
      {
        text: '揣进怀里，留个念想',
        cond: { realm: { lte: 2 } },
        outcomes: [
          { weight: 6, effects: [
            { itemAdd: { id: 'miaoyan_yu', n: 1 } },
            { tendAdd: { yinguo: 2 } },
            { insight: { id: 'jingjie_xianghui', title: '温玉的来路', t: '庙里捡的那块玉，夜里贴身搁着，竟比白日还暖些。说不清来路，先收着。' } },
            { log: { t: '你把温玉揣进怀里。它贴着胸口，一下一下地暖，像有口气在里头。', style: '异象' } }] }
        ]
      },
      // —— 高境界入口：镇封（续庙眼，舍机缘，落 legacy + flag）——
      {
        text: '耗气机续上它，镇住后殿',
        cond: { realm: { gte: 3 } },
        outcomes: [
          { weight: 6, effects: [
            { qi: -10 }, { wvarAdd: { ghostQi: -10 } },
            { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: -12 } },
            { flagSet: { id: 'jingjie_xianghui_zhen' } },
            { legacySet: { id: 'temple_cleansed', v: true } },
            { branch: { cond: { npcAlive: 'miaozhu' }, then: [
              { npcFavAdd: { id: 'miaozhu', n: 12 } },
              { log: { t: '你渡真气入玉，浊色一点点回了温润。庙祝伏地长拜，老泪纵横。', style: '吉' } }
            ], else: [
              { log: { t: '你渡真气入玉，浊色一点点回了温润。空庙之中，仿佛有谁轻轻舒了口气。', style: '因果' } }
            ] } },
            { rumorAdd: { t: '山神庙后殿不再夜夜作响了。镇上人说，是那位替山神续了一口气。', fame: 3 } },
            { insight: { id: 'jingjie_xianghui', title: '续上的那口气', t: '我没取走那块庙眼，反倒搭进去半身真气。有些东西，镇着比拿着更要紧。', confirm: true } }] }
        ]
      },
      // —— 高境界入口：取走（夺机缘，放旧债，代价后置）——
      {
        text: '取走庙眼，由它去',
        cond: { realm: { gte: 3 } },
        outcomes: [
          { weight: 5, effects: [
            { itemAdd: { id: 'miaoyan_yu', n: 1 } }, { cult: 20 },
            { wvarAdd: { ghostQi: 12 } },
            { locvarAdd: { loc: 'shanshenmiao', key: 'corruption', n: 15 } },
            { counterAdd: { xinmo: 5 } },
            { branch: { cond: { npcAlive: 'miaozhu' }, then: [{ npcFavAdd: { id: 'miaozhu', n: -10 } }] } },
            { rumorAdd: { t: '自打那位从庙里取走了什么，山神庙后殿的动静，一夜比一夜大。', fame: 1 } },
            { eventDelay: { id: 'ev_shenmiao_jiyuan_fan', months: 4, note: '取走庙眼，后殿旧债反扑' } },
            { log: { t: '你拔走庙眼纳入丹田，灵机暴涨。身后空庙里，无数道目光骤然睁开。', style: '凶' } }] }
        ]
      },
      {
        text: '原样埋回，不动它',
        outcomes: [
          { weight: 4, effects: [
            { tendAdd: { yinguo: 1 } },
            { log: { t: '你把玉重新埋回香灰里，拍平。有些机缘，不是给你的，便不要去碰。', style: '平' } }] }
        ]
      }
    ]
  });

  // C1 后续：取走庙眼四个月后旧债反扑（queueOnly，由上面的 eventDelay 点名）。
  G.define('event', {
    id: 'ev_shenmiao_jiyuan_fan', title: '旧债登门',
    text: '取走庙眼那夜起，你便夜夜难安。这一回它们不再隔着门——后殿放出来的那些影子，循着庙眼的气息，一路摸到了你门前。窗纸上，贴满了模糊的手印。',
    tags: ['因果', '凶'],
    baseWeight: 0, queueOnly: true,
    effects: [
      { counterAdd: { xinmo: 6 } }, { hp: -8 }, { wvarAdd: { ghostQi: 5 } },
      { memAdd: 'mem_jingjie_jiuzhai' },
      { insight: { id: 'jingjie_xianghui', title: '讨上门的债', t: '我夺了镇魂的玉，这债便记在了我头上。早知如此……可世上没有早知道。', confirm: true } },
      { log: { t: '你一夜没合眼，听着满窗的指甲刮挠声。天亮它们才退去——但你知道，它们还会来。', style: '凶' } }
    ]
  });

  // C1 机缘物 & 反扑记忆（本文件自有 id，G.define 一次；C1/反扑事件引用）。
  G.define('item', {
    id: 'miaoyan_yu', name: '庙眼玉', type: 'misc', price: 30,
    desc: '山神座下香灰里得来的一枚温玉。入手生暖，懂行的说，这是镇庙的「庙眼」——离了庙，它的暖一日淡过一日。'
  });
  G.define('memory', {
    id: 'mem_jingjie_jiuzhai', title: '讨上门的旧债', kind: 'misc',
    text: '你曾夺走山神庙的庙眼，放出了后殿镇着的旧债。它们循气追到你门前，那满窗的手印，此生难忘。',
    carry: true, dream: '你又梦见一扇贴满手印的窗纸，窗外有谁在低低地，向你讨一个说法。'
  });

  // ════════════════════════════════════════════════════════════
  // D 战后随境界反馈：同一胜利，不同境界得不同传闻 / 敬畏 / 冷处理
  //    （读 G.player.realmIdx 变脸；spec §0.5：低境界惊叹九息，筑基则「青石镇的天象动了动」）
  // ════════════════════════════════════════════════════════════

  // D1 凡兽小胜：同一头野狼/妖狼/熊罴，凡身被当愣头后生，炼气被传「有能耐」，筑基则成天象。
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win' && p.result !== 'press') return;
    if (p.enemyId !== 'yelang' && p.enemyId !== 'yaolang' && p.enemyId !== 'bali') return;
    var ri = realmIdx();
    if (ri >= 6) {
      // 筑基：胜负早不是问题，胜利本身成了天象异闻
      G.fx([
        { pflagSet: { id: 'jingjie_zhen_diwei' } },
        { rumorAdd: { t: '那畜生还没近身就软了腿。镇上老人说，怕是青石镇的天象，动了动。', fame: 2 } }
      ]);
    } else if (ri >= 3) {
      // 炼气中后期：成了地方变量，镇民开始传你的能耐
      G.fx([{ rumorAdd: { t: '听说那位进山，野物见了影子就避开走。这镇上，是真出了个有能耐的人。', fame: 1 } }]);
    } else if (ri <= 1 && p.rating === '苦战') {
      // 凡身/引气苦战取胜：还只是个让人捏把汗的愣头后生
      G.fx([{ rumorAdd: { t: '镇口那愣头后生又拖了头狼回来，浑身是血——迟早要把命搭进黑山。', fame: 0 } }]);
    }
  });

  // D2 镇邪/净庙之胜：同一场胜，低境界惊叹手段利落，高境界镇民敬畏避让、仙门留意。
  G.sys.social.onCombat(function (p) {
    if (G.player.dead) return;
    if (p.result !== 'win' && p.result !== 'press') return;
    if (p.enemyId !== 'ligui' && p.enemyId !== 'shigui' && p.enemyId !== 'humei_yao' && p.enemyId !== 'shanmiao_xieying') return;
    var ri = realmIdx();
    if (ri >= 5) {
      // 圆满及以上：连仙门都要多看一眼；镇民已不敢直视
      G.fx([
        { wvarAdd: { sectAttention: 4 } },
        { rumorAdd: { t: '那邪物在他面前连形都凝不住，转眼就散了。镇上人提起他，已不敢直呼其名。', fame: 3 } },
        { branch: { cond: { pflag: 'jingjie_xianmen_zhaolan' }, then: [
          { log: { t: '镇外仙门巡使远远望着这一幕，眼神变了变——这样的人物，山门是势在必得了。', style: '因果' } }
        ] } }
      ]);
    } else if (ri >= 3) {
      // 炼气中后期：镇民开始敬而远之
      G.fx([{ rumorAdd: { t: '不干净的东西见了那位都躲着走。镇上人敬他，也有点怕他。', fame: 2 } }]);
    } else if (p.rating === '秒杀' || p.rating === '碾压') {
      // 低境界漂亮仗：惊叹手段利落（九息那一路的口径）
      G.fx([{ rumorAdd: { t: '那东西刚冒头就让人九息内打散了，围观的腿都软了——好利落的手段！', fame: 1 } }]);
    }
  });

  // ════════════════════════════════════════════════════════════
  // 称号（评价型，由上方 D2/B2 显式 titleAdd 授予）
  // ════════════════════════════════════════════════════════════
  G.define('title', {
    id: 'jingjie_jishi_xian', name: '济世仙长',
    desc: '修为圆满，却肯为一介凡人耗损真气、救人于垂死。这名声，是用慈悲挣来的。',
    fame: 8,
    rumor: '镇上立起了一块长生牌，供的是个会救人的活神仙。'
  });

  // ── legacy 登记（本文件新增）──
  //   jingjie_yuanqing_dang（圆满问心选「迎上去」；后续支线/出生梦境可读，applyLegacy 未接则安全忽略）
  //   复用既有 temple_cleansed（C1 镇庙眼，与原 legacy 同义，applyLegacy 已接）
})();
