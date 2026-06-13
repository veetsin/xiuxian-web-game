// js/data/items.js — 核心物品（基建 Owner）。内容 Agent 不改此文件，可在自己文件里 G.define('item',...) 新增。
//
// 物品 schema（契约 v1.1 登记）：
//   { id, name, desc, type: "weapon"|"consumable"|"material"|"misc",
//     atk: 4,            // weapon 专用；引擎自动佩戴 atk 最高者
//     use: [ ...fx... ], // consumable 专用；行囊「使用」时执行（不耗月）
//     price: 8 }         // 参考价（做工 +3/月 为锚）
//
// ── 自检十问（对本文件整体）──
// 1标签：工具/耗材/凡俗物。2易共现：狩猎、采药、市集行动。3排斥：仙家宝物（本层全是凡品）。
// 4改状态：use 改 hp/伤势/修为/丹毒/心魔。5后果：丹药留 dandu，符纸留给雷法/庙线作钩子。
// 6可解释：每件凡物都有铺子或山里的来路。7钩子：火折子→矿洞探洞、符纸→庙、妖狼牙→武馆换钱。
// 8有趣选择：吃凝气丹快修但积毒。9服务 build：止血散养血剑流硬打法、清心散服务压制流。
// 10不暴露：use 文案全为身体感受，无机制词。
(function () {
  'use strict';
  // —— 武器 ——
  G.define('item', { id: 'liedao', name: '猎刀', type: 'weapon', atk: 4, price: 12, desc: '猎户惯用的短刀，刃口磨得发亮。' });
  G.define('item', { id: 'tiejian', name: '铁剑', type: 'weapon', atk: 6, price: 30, desc: '镇上铁匠打的青铁剑，分量压手。' });

  // —— 耗材 ——
  G.define('item', {
    id: 'zhixuesan', name: '止血散', type: 'consumable', price: 8,
    desc: '药铺常备的金疮药粉，敷上便能合住小伤口。',
    use: [{ hp: 15 }, { healInjury: { months: 1 } }, { log: { t: '药粉一敷，伤处的灼痛渐渐退了。', style: '丹' } }]
  });
  G.define('item', {
    id: 'liaoshang_yao', name: '疗伤药', type: 'consumable', price: 20,
    desc: '内服的汤药丸子，活血生肌。',
    use: [{ hp: 30 }, { healInjury: { months: 1, severity: 1 } }, { log: { t: '一股暖意自丹田散向四肢，伤势好了大半。', style: '丹' } }]
  });
  G.define('item', {
    id: 'ningxuecao', name: '凝血草', type: 'consumable', price: 4,
    desc: '黑山阴坡常见的药草，嚼碎敷伤能止血。',
    use: [{ hp: 8 }, { log: { t: '草汁苦涩，伤口倒是清爽了些。', style: '丹' } }]
  });
  G.define('item', {
    id: 'ganliang', name: '干粮', type: 'consumable', price: 2,
    desc: '掺了豆面的硬饼，出远门用。',
    use: [{ hp: 4 }, { log: { t: '你啃完半块硬饼，腹中踏实了些。', style: '平' } }]
  });
  G.define('item', {
    id: 'ningqi_dan', name: '凝气丹', type: 'consumable', price: 25,
    desc: '药铺柜底的粗丹，据说吃了打坐事半功倍，就是火气大。',
    use: [{ cult: 15 }, { counterAdd: { dandu: 4 } }, { tendAdd: { danyao: 2 } },
          { log: { t: '丹力化开，气走周天，喉头却留了一缕焦苦。', style: '丹' } }]
  });
  G.define('item', {
    id: 'qingxin_san', name: '清心散', type: 'consumable', price: 18,
    desc: '安神的药散，夜里多梦的人买它。',
    use: [{ counterAdd: { xinmo: -10 } }, { log: { t: '心头那点躁意，像被凉水浇熄了。', style: '丹' } }]
  });
  G.define('item', {
    id: 'shaodaozi', name: '烧刀子', type: 'consumable', price: 4,
    desc: '镇口酒肆的劣酒，辣得很。',
    use: [{ hp: 2 }, { counterAdd: { xinmo: -2 } }, { log: { t: '一口辣酒下肚，胆气壮了三分。', style: '平' } }]
  });

  // —— 材料 / 杂物 ——
  G.define('item', { id: 'langpi', name: '狼皮', type: 'material', price: 6, desc: '硝制过能卖个好价钱。' });
  G.define('item', { id: 'langya', name: '狼牙', type: 'material', price: 3, desc: '猎户拿它串项链，说能避邪。' });
  G.define('item', { id: 'yaolang_ya', name: '妖狼牙', type: 'material', price: 12, desc: '透着青黑色的长牙，隐有凉意。' });
  G.define('item', { id: 'fuzhi', name: '符纸', type: 'material', price: 5, desc: '庙里求的黄纸符，朱砂画的什么看不懂。' });
  G.define('item', { id: 'huozhezi', name: '火折子', type: 'misc', price: 2, desc: '进山探洞少不了它。' });
  G.define('item', { id: 'shougu_hufu', name: '兽骨护符', type: 'misc', price: 15, desc: '老猎户雕的骨符，握着心安。' });
  G.define('item', { id: 'cubu_yi', name: '粗布衣', type: 'misc', price: 5, desc: '浆洗得发白的旧衣。' });
})();
