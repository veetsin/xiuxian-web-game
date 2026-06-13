// js/data/ids.js — 全局唯一 ID 真源（总控维护，其他 Agent 只读）。
// 跨文件引用的 ID 必须出自此处；各内容文件内部私有 ID（事件、物品、记忆等）自行命名，
// 但涉及"别人会引用"的 ID（如 boss、地点、NPC、道途、出生）必须用下表。
G.IDS = {
  locations: ["qingshizhen", "heishan_waiwei", "heishan_shenchu", "shanshenmiao", "feikuang", "wuguan", "yaopu", "jiazhong"],
  // 青石镇 / 黑山外围 / 黑山深处 / 山神庙 / 废弃矿洞 / 武馆 / 药铺 / 家中（闭关处）
  daos: ["xuejian", "danyao", "leifa", "lianti", "yinguo"],
  // 血剑 / 丹药 / 雷法 / 炼体 / 因果
  births: ["liehu_zhizi", "bingruo_guer", "yaopu_xuetu", "tuhu_xuetu", "wuguan_zayi", "miaozhu_yangzi"],
  // 猎户之子 / 病弱孤儿 / 药铺学徒 / 屠户学徒 / 武馆杂役 / 庙祝养子
  npcs: ["lao_liehu", "yaopu_laoban", "dashixiong", "miaozhu", "waimen_xunshi", "jiedao_sanxiu"],
  // 老猎户 / 药铺老板 / 武馆大师兄 / 庙祝 / 外门巡使 / 劫道散修
  enemies: ["yelang", "yaolang", "shanfei", "shigui", "yaoren", "wuguan_dizi"],
  bosses: ["heishan_langwang", "kuangdong_shiwang", "dashixiong_boss", "shanmiao_xieying"],
  wvars: ["wolfThreat", "villageFear", "ghostQi", "mineInstability", "sectAttention", "marketPrice"],
  stats: ["li", "ti", "min", "shen"],            // 膂力 / 体魄 / 身法 / 神识
  counters: ["dandu", "xuexing", "shaqi", "xinmo"], // 丹毒 / 血腥味 / 杀气 / 心魔
  realms: ["凡身", "引气", "炼气初期", "炼气中期", "炼气后期", "炼气圆满", "筑基"],
  // 非敌人死因（引擎自产 + 内容 die op 自定义；死亡记忆 deathCause 可匹配这些）
  deathCauses: ["shouyuan", "丹毒反噬", "tupo_shibai", "伤重不治", "横死", "心魔噬身", "走火入魔"],
  seasons: ["春", "夏", "秋", "冬"],
  weathers: ["晴", "雨", "雷雨", "雪", "雾"],
  logStyles: ["平", "异象", "血", "雷", "丹", "体", "因果", "凶", "吉", "世界", "战", "突破"],
  tags: ["野外", "市集", "阴邪", "险地", "灵脉", "夜", "血", "剑", "杀", "药", "雷", "体", "因果", "善", "恶",
         "隐秘", "奇遇", "狩猎", "修炼", "交际", "劳作", "危险", "梦", "香火", "矿", "狼"]
};
// 已登记 legacy（跨轮回痕迹）建议命名：
//   langwang_slain / mine_sealed / temple_cleansed / dashixiong_defeated
// 内容 Agent 新增 legacy 时在自己文件顶部注释登记。
