// js/data/ids.js — 全局唯一 ID 真源（总控维护，其他 Agent 只读）。
// 跨文件引用的 ID 必须出自此处；各内容文件内部私有 ID（事件、物品、记忆等）自行命名，
// 但涉及"别人会引用"的 ID（如 boss、地点、NPC、道途、出生）必须用下表。
//
// ── v2 横向扩展（全部内容翻倍；出生扩到 18）──
//   新增 5 道 / 8 地点 / 12 出生 / 6 NPC / 6 普通敌 / 6 Boss，详见 docs/EXPANSION_BLUEPRINT.md。
//   下表「┄ 新增」分隔线之后为 v2 ID；含义注释见蓝图。
G.IDS = {
  locations: [
    "qingshizhen", "heishan_waiwei", "heishan_shenchu", "shanshenmiao", "feikuang", "wuguan", "yaopu", "jiazhong",
    // ┄ 新增 8 ┄
    "hantan", "duanjianya", "hupo_ao", "luanzang_gang", "yizhuang", "yima_guan", "houshan_lin", "heshen_du"
    // 寒潭 / 断剑崖 / 狐婆坳 / 乱葬岗 / 义庄 / 驿马关 / 后山兽径 / 河神渡
  ],
  daos: [
    "xuejian", "danyao", "leifa", "lianti", "yinguo",
    // 血剑 / 丹药 / 雷法 / 炼体 / 因果
    // ┄ 新增 5 ┄
    "handu", "shouhun", "xianghuo", "humei", "yujian"
    // 寒冰(寒毒减速·克续航) / 兽魂(驭兽群攻·克兽) / 香火(愿力护盾·克邪) / 狐魅(媚惑幻控·克人) / 御剑(剑气多段·破防)
  ],
  births: [
    "liehu_zhizi", "bingruo_guer", "yaopu_xuetu", "tuhu_xuetu", "wuguan_zayi", "miaozhu_yangzi",
    // ┄ 新增 12（共 18）┄
    "yujia_nü", "juemu_zi", "huyang_er", "zhujian_tu", "caibing_ren", "xunshou_ren",
    "youfang_lang", "huolang_zi", "huanyuan_er", "xiban_qi", "gengfu_zi", "wuxue_guer"
    // 渔家女 / 掘墓子 / 狐养儿 / 铸剑徒 / 采冰人 / 驯兽人 /
    // 游方郎中徒 / 货郎子 / 还愿人家的孩子 / 戏班弃儿 / 更夫之子 / 没落武学世家遗孤
  ],
  npcs: [
    "lao_liehu", "yaopu_laoban", "dashixiong", "miaozhu", "waimen_xunshi", "jiedao_sanxiu",
    // ┄ 新增 6（共 12）┄
    "hupo", "zhujian_weng", "heshen_po", "shihai_zhe", "youyi_lang", "shuoshu_ren"
    // 狐婆 / 铸剑老人 / 河婆 / 拾骸老者 / 游方郎中 / 说书人
  ],
  enemies: [
    "yelang", "yaolang", "shanfei", "shigui", "yaoren", "wuguan_dizi",
    // ┄ 新增 6 普通（共 12）┄
    "humei_yao", "ligui", "shuigui", "hanjiao_you", "bali", "jianzhong_canling"
    // 狐魅 / 厉鬼 / 水鬼 / 寒蛟幼 / 熊罴 / 剑冢残灵
  ],
  bosses: [
    "heishan_langwang", "kuangdong_shiwang", "dashixiong_boss", "shanmiao_xieying",
    // ┄ 新增 6（共 10）┄
    "laohu_xian", "jianzhong_jianling", "hantan_jiao", "houshan_shouwang", "luanzang_li_zu", "heshen"
    // 老狐仙 / 剑冢剑灵 / 寒潭蛟 / 后山兽王 / 乱葬厉祖 / 河神
  ],
  wvars: ["wolfThreat", "villageFear", "ghostQi", "mineInstability", "sectAttention", "marketPrice"],
  stats: ["li", "ti", "min", "shen"],            // 膂力 / 体魄 / 身法 / 神识
  counters: ["dandu", "xuexing", "shaqi", "xinmo"], // 丹毒 / 血腥味 / 杀气 / 心魔
  realms: ["凡身", "引气", "炼气初期", "炼气中期", "炼气后期", "炼气圆满", "筑基"],
  // 非敌人死因（引擎自产 + 内容 die op 自定义；死亡记忆 deathCause 可匹配这些）
  deathCauses: ["shouyuan", "丹毒反噬", "tupo_shibai", "伤重不治", "横死", "心魔噬身", "走火入魔", "寒毒入心", "魇毙", "溺亡"],
  seasons: ["春", "夏", "秋", "冬"],
  weathers: ["晴", "雨", "雷雨", "雪", "雾"],
  logStyles: ["平", "异象", "血", "雷", "丹", "体", "因果", "凶", "吉", "世界", "战", "突破"],
  tags: ["野外", "市集", "阴邪", "险地", "灵脉", "夜", "血", "剑", "杀", "药", "雷", "体", "因果", "善", "恶",
         "隐秘", "奇遇", "狩猎", "修炼", "交际", "劳作", "危险", "梦", "香火", "矿", "狼",
         // ┄ 新增 ┄
         "寒", "狐", "兽", "水", "葬", "渡", "幻"]
};
// 已登记 legacy（跨轮回痕迹）：
//   v1：langwang_slain / mine_sealed / temple_cleansed / dashixiong_defeated
//   v2（新 Boss 击破/支线收束，applyLegacy 已加世界修正）：
//   hu_an_jing(狐婆坳靖) / jianzhong_renzhu(剑冢认主) / hantan_ding(寒潭镇) /
//   shouwang_fu(兽王臣服) / luanzang_an(乱葬岗安) / heshen_ping(河患息)
// 内容 Agent 新增 legacy 时在自己文件顶部注释登记。
