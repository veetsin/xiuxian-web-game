// js/systems/beast.js — 驭兽系统核心（契约真源 · 全员读此文件头）。
// 设计依据：docs/BEAST_SYSTEM_DESIGN.md（§3 数据模型 / §13 落地建议）。
// 铁律（贯穿）：少数值·重体验。一只兽对玩家只暴露「阶段名 + 态度词 + 性情/职能标签」，
//   永不出数字。最多一只活兽。兽不进回合制、不占血条、不被攻击、玩家不操作它。
//   纯原生 JS；随机一律走 G.rng；中文有修仙味、零机制词。
//
// ════════════════════════════════════════════════════════════════════════════
// §A. player.pet 数据形（null=无兽；存档由 save.js 自动序列化 player 全量）
// { speciesId, name, track:'温灵'|'野凶', spirit:0..3, temper:[], duty:[],
//   _bond:0..100(隐藏), bondWord, mood, marks:[], memory:[](≤3滚动) }
//   bondWord 档位：_bond 0-19 生分 / 20-39 相识 / 40-59 亲近 / 60-84 相托 / 85-100 命缘。
//     **UI/文案只出态度词，绝不出数字。**
//   spirit 阶段名：0 野性 / 1 通灵 / 2 灵兽 / 3 化形（本竖切远景，不实装到3）。
//   mood ∈ 安/躁/伤/病/恋主/将老。
//
// §B. 效果 DSL：单一 op {pet:{op:'...', ...}}（dsl.js 一个 case 委托 fxop(v)）
//   gain     {op:'gain', species, name?, track?, bond?(0-100数或档位词), from?}  // 得兽；已有兽则不覆盖、记 log
//   gainSoul {op:'gainSoul'}                 // 转世认主：从 meta.carried.petSoul 重建(bond=相识、续前世记忆、继承印记)，清 legacy 'pet_zhuanshi'
//   bond     {op:'bond', n}                  // 牵绊增减，自动更新 bondWord，越档时 log
//   temper   {op:'temper', add?, del?}
//   mark     {op:'mark', add}
//   spirit   {op:'spirit', up?:1, set?}      // 开灵：log + 播该阶段 omen 文案
//   mood     {op:'mood', set}
//   duty     {op:'duty', add}
//   remember {op:'remember', t}              // 记一件事(cap 3)
//   die      {op:'die', cause}               // 兽死：丧兽 log；命缘则落 legacy 'pet_zhuanshi' + 存 meta.carried.petSoul
//                                            //   + 授「丧兽」记忆；shouhun 道则记「残念入兽魂」log；清 player.pet
//   leave    {op:'leave', reason}            // 弃你而走：log + 清 player.pet
//
// §C. 条件 DSL：{pet:{...}}（dsl.js 一个 case 委托 condop(v)）
//   {pet:{has:true|false}} / {pet:{spirit:{gte:n}}} / {pet:{bondGte:'相托'}}(按档比较) /
//   {pet:{track:'温灵'}} / {pet:{duty:'示警'}} / {pet:{mark:'xue_ran'}} /
//   {pet:{species:'dujiao_lang'}} / {pet:{moodIs:'躁'}}
//
// §D. G.sys.beast 公共 API（UI/探针/内容读）
//   G.pet()                     // 函数，返回 player.pet 或 null。**全员统一用 G.pet() 取当前兽**
//   G.sys.beast.bondWord(pet)   // 态度词
//   G.sys.beast.spiritName(pet) // 阶段名
//   G.sys.beast.seen()          // 见过的 species id 数组（异兽志；gain 时引擎登记 pflags['_seenbeast_'+id]）
//   G.sys.beast.def(pet)        // G.get('beastlore', pet.speciesId)
//   G.sys.beast.monthly()       // 月度（time.js tick 第 4 步 NPC 之后调用）
//   G.sys.beast.fxop(v) / condop(v)  // DSL 委托入口
//
// §E. beastlore schema（G.define('beastlore', {...})）
//   { id, name, rank:'凡'|'下'|'中'|'上'|'玄', track:'温灵'|'野凶',
//     habitat:[locId...], catchHints:'一句获得提示',
//     temperSeed:[性情标签...], dutyPool:[可觉醒职能...],
//     omen:{ '通灵':'...', '灵兽':'...', '化形':'...' },  // 三阶异象文案，纯感受零机制词
//     rebirthForm:'转世认主时的认主异象文案' }
//
// §F. combat:end 叙事钩（本文件 G.bus.on('combat:end', {enemyId,result,rating,boss})）
//   读 G.pet()+bondWord+temper+payload：注入一次性叙事 G.log（写「它做了什么」）+ 漂移 _bond/mood。
//   档位行为：生分/相识→多半旁观；亲近→撕咬一下、劣势(逃跑)则 _bond 微降+temper 加「怯」；
//   相托→替你挡(log+mood 转伤+_bond↑)；命缘+强敌(boss)+险胜/苦战 有概率 pet 替你死(走 die op)。
//   染煞(mark xue_ran)→噬敌叙事+玩家 xuexing↑。**纯叙事+漂移，兽不进回合制、不占血条。**
//
// §G. 轮回链
//   newPlayer 加 pet:null（每世默认无兽）。命缘兽死(die op)落 legacy 'pet_zhuanshi' + meta.carried.petSoul。
//   来世内容用 {legacy:'pet_zhuanshi'} 的「梦引而至」事件 + {pet:{op:'gainSoul'}} 认主。
//   玩家死亡轮回时 player.pet 随新生归 null（兽留在上一世）。
//
// §H. 本竖切钉死的 beastlore 物种 id：
//   qingmao_quan / dujiao_lang / chimu_hu / nuanshi_gui / ya_ying / shuangwei_mao
// ════════════════════════════════════════════════════════════════════════════
(function () {
  'use strict';
  G.sys = G.sys || {};

  // ---- 全员统一取当前兽 ----
  G.pet = function () { return G.player ? G.player.pet : null; };

  // ============ 牵绊档位 ============
  // _bond 0-19 生分 / 20-39 相识 / 40-59 亲近 / 60-84 相托 / 85-100 命缘
  var BAND_FLOORS = [
    { word: '生分', floor: 0 },
    { word: '相识', floor: 20 },
    { word: '亲近', floor: 40 },
    { word: '相托', floor: 60 },
    { word: '命缘', floor: 85 }
  ];
  var BAND_WORDS = ['生分', '相识', '亲近', '相托', '命缘'];
  var SPIRIT_NAMES = ['野性', '通灵', '灵兽', '化形'];
  var OMEN_STAGE = { 1: '通灵', 2: '灵兽', 3: '化形' };
  var MOODS = ['安', '躁', '伤', '病', '恋主', '将老'];

  function bandIndex(bond) {
    var idx = 0;
    for (var i = 0; i < BAND_FLOORS.length; i++) if (bond >= BAND_FLOORS[i].floor) idx = i;
    return idx;
  }
  function wordOfBond(bond) { return BAND_FLOORS[bandIndex(bond)].word; }
  // 档位词 → 该档下限 _bond（gain/gainSoul 的 bond 可传档位词）
  function bondOfWord(word) {
    for (var i = 0; i < BAND_FLOORS.length; i++) if (BAND_FLOORS[i].word === word) return BAND_FLOORS[i].floor;
    return null;
  }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  // ============ 只读取词 helper（§D） ============
  function bondWord(pet) {
    pet = pet || G.pet();
    if (!pet) return '';
    return pet.bondWord || wordOfBond(pet._bond || 0);
  }
  function spiritName(pet) {
    pet = pet || G.pet();
    if (!pet) return '';
    return SPIRIT_NAMES[clamp(pet.spirit || 0, 0, 3)];
  }
  function petName(pet) {
    if (!pet) return '它';
    if (pet.name) return pet.name;
    var d = def(pet);
    return d ? d.name : '那头兽';
  }
  function def(pet) {
    pet = pet || G.pet();
    if (!pet) return null;
    return G.get('beastlore', pet.speciesId);
  }
  function seen() {
    if (!G.player || !G.player.pflags) return [];
    var out = [];
    for (var k in G.player.pflags) {
      if (k.indexOf('_seenbeast_') === 0 && G.player.pflags[k]) out.push(k.slice('_seenbeast_'.length));
    }
    return out;
  }

  // 更新 bondWord 缓存；越档时返回 {from, to} 供 log，否则返回 null
  function refreshBondWord(pet, oldBond) {
    var oldIdx = bandIndex(oldBond == null ? pet._bond : oldBond);
    pet.bondWord = wordOfBond(pet._bond);
    var newIdx = bandIndex(pet._bond);
    if (newIdx !== oldIdx) return { from: BAND_WORDS[oldIdx], to: BAND_WORDS[newIdx], up: newIdx > oldIdx };
    return null;
  }

  // 越档叙事（纯态度词，零数字）
  function logBandShift(pet, shift) {
    if (!shift) return;
    var nm = petName(pet);
    if (shift.up) {
      G.log('你与' + nm + '之间，似乎比从前近了一分——如今算得上「' + shift.to + '」了。', '因果');
    } else {
      G.log(nm + '看你的眼神淡了些，你们之间，退回了「' + shift.to + '」。', '平');
    }
  }

  // _bond 增减统一入口（自动越档 log）
  function addBond(pet, n) {
    if (!pet) return;
    var old = pet._bond || 0;
    pet._bond = clamp(old + n, 0, 100);
    logBandShift(pet, refreshBondWord(pet, old));
  }

  function addTemper(pet, t) {
    if (!pet || !t) return;
    pet.temper = pet.temper || [];
    if (pet.temper.indexOf(t) < 0) pet.temper.push(t);
  }
  function delTemper(pet, t) {
    if (!pet || !t || !pet.temper) return;
    var i = pet.temper.indexOf(t);
    if (i >= 0) pet.temper.splice(i, 1);
  }
  function hasMark(pet, m) { return !!(pet && pet.marks && pet.marks.indexOf(m) >= 0); }
  function addMark(pet, m) {
    if (!pet || !m) return;
    pet.marks = pet.marks || [];
    if (pet.marks.indexOf(m) < 0) pet.marks.push(m);
  }
  function remember(pet, t) {
    if (!pet || !t) return;
    pet.memory = pet.memory || [];
    if (pet.memory.indexOf(t) >= 0) return;
    pet.memory.push(t);
    while (pet.memory.length > 3) pet.memory.shift(); // 滚动 cap 3
  }

  // ============ 效果 DSL 委托（§B） ============
  function fxop(v) {
    if (!v || !v.op) { console.warn('[BEAST] fxop 缺 op:', v); return; }
    var p = G.player; if (!p) return;
    switch (v.op) {
      case 'gain': return opGain(v);
      case 'gainSoul': return opGainSoul(v);
      case 'bond': return opBond(v);
      case 'temper': return opTemper(v);
      case 'mark': return opMark(v);
      case 'spirit': return opSpirit(v);
      case 'mood': return opMood(v);
      case 'duty': return opDuty(v);
      case 'remember': return opRemember(v);
      case 'die': return opDie(v);
      case 'leave': return opLeave(v);
      default: console.warn('[BEAST] 未知 pet op:', v.op, v);
    }
  }

  // 登记「见过」（异兽志点亮）
  function markSeen(speciesId) {
    if (G.player && G.player.pflags) G.player.pflags['_seenbeast_' + speciesId] = true;
  }

  // 兽魂道阶≥2：新得兽起手牵绊 +1 档（设计 §10 咬合，叙事化不显数字）
  function shouhunBondBoost(pet) {
    var p = G.player;
    if (!p || !p.daoStage) return;
    if ((p.daoStage.shouhun || 0) >= 2) {
      // 提升到下一档下限（若未达）
      var idx = bandIndex(pet._bond);
      if (idx < BAND_FLOORS.length - 1) {
        pet._bond = Math.max(pet._bond, BAND_FLOORS[idx + 1].floor);
        pet.bondWord = wordOfBond(pet._bond);
      }
    }
  }

  function opGain(v) {
    var p = G.player;
    if (!v.species) { console.warn('[BEAST] gain 缺 species'); return; }
    markSeen(v.species); // 见过即点亮，哪怕没收下（这里收下了一并登记）
    if (p.pet) { // 已有兽：不覆盖
      G.log('你身边已有了一头同行的兽，便没有再多收一个。', '平');
      return;
    }
    var d = G.get('beastlore', v.species);
    var track = v.track || (d ? d.track : '温灵');
    // 初始牵绊：bond 可为数字或档位词，缺省 相识下限
    var bond0 = 20;
    if (v.bond != null) {
      if (typeof v.bond === 'number') bond0 = clamp(v.bond, 0, 100);
      else { var bw = bondOfWord(v.bond); if (bw != null) bond0 = bw; }
    }
    var temper0 = (d && d.temperSeed) ? d.temperSeed.slice(0, 2) : [];
    var pet = {
      speciesId: v.species,
      name: v.name || null,
      track: track,
      spirit: 0,
      temper: temper0,
      duty: [],
      _bond: bond0,
      bondWord: wordOfBond(bond0),
      mood: '安',
      marks: [],
      memory: []
    };
    p.pet = pet;
    shouhunBondBoost(pet);
    var nm = petName(pet);
    G.log('自此，' + nm + '随在你身边了。', '吉');
    if (v.from) G.log(v.from, '平');
    G.history('得伴：' + nm);
    G.bus.emit('pet:gain', { speciesId: pet.speciesId, track: pet.track });
  }

  // 转世认主：从 meta.carried.petSoul 重建（§G）
  function opGainSoul(v) {
    var p = G.player;
    var soul = G.meta && G.meta.carried ? G.meta.carried.petSoul : null;
    if (!soul) { console.warn('[BEAST] gainSoul 无 petSoul，跳过'); return; }
    if (p.pet) { G.log('你身边已有了一头同行的兽。', '平'); return; }
    markSeen(soul.species);
    var d = G.get('beastlore', soul.species);
    var pet = {
      speciesId: soul.species,
      name: soul.name || null,
      track: soul.track || (d ? d.track : '温灵'),
      spirit: 0,
      temper: (soul.temper || (d && d.temperSeed ? d.temperSeed.slice(0, 2) : [])).slice(),
      duty: [],
      _bond: bondOfWord('相识'),          // 起手「相识」
      bondWord: '相识',
      mood: '安',
      marks: (soul.marks || []).slice(),  // 继承印记
      memory: (soul.memory || []).slice() // 续前世记忆
    };
    p.pet = pet;
    // 认主异象文案（不明说转世）
    var omen = (d && d.rebirthForm) ? d.rebirthForm : '它绕着你转了三圈，把头埋进你掌心。你说不清为什么，看见它第一眼，眼眶就热了。';
    G.log(omen, '因果');
    // 清掉转世 legacy 与残魂（认主已完成，不再反复触发梦引）
    if (G.meta && G.meta.legacy) delete G.meta.legacy['pet_zhuanshi'];
    if (G.meta && G.meta.carried) G.meta.carried.petSoul = null;
    G.history('旧识转世，认你为主');
    G.bus.emit('pet:gain', { speciesId: pet.speciesId, track: pet.track, soul: true });
  }

  function opBond(v) {
    var pet = G.pet(); if (!pet) return;
    addBond(pet, v.n || 0);
  }
  function opTemper(v) {
    var pet = G.pet(); if (!pet) return;
    if (v.add) addTemper(pet, v.add);
    if (v.del) delTemper(pet, v.del);
  }
  function opMark(v) {
    var pet = G.pet(); if (!pet) return;
    if (v.add) addMark(pet, v.add);
  }
  // 开灵：log + 播该阶段 omen 文案
  function opSpirit(v) {
    var pet = G.pet(); if (!pet) return;
    var before = pet.spirit || 0;
    if (v.set != null) pet.spirit = clamp(v.set, 0, 3);
    else pet.spirit = clamp(before + (v.up || 1), 0, 3);
    if (pet.spirit === before) return;
    var stage = pet.spirit;
    var nm = petName(pet);
    G.log(nm + '通了灵窍——它如今是一头【' + SPIRIT_NAMES[stage] + '】了。', '异象');
    var d = def(pet);
    var omenKey = OMEN_STAGE[stage];
    if (d && d.omen && omenKey && d.omen[omenKey]) G.log(d.omen[omenKey], '异象');
    G.history(nm + '开灵：' + SPIRIT_NAMES[stage]);
    G.bus.emit('pet:spirit', { spirit: pet.spirit });
  }
  function opMood(v) {
    var pet = G.pet(); if (!pet) return;
    if (v.set) pet.mood = v.set;
  }
  function opDuty(v) {
    var pet = G.pet(); if (!pet) return;
    if (!v.add) return;
    pet.duty = pet.duty || [];
    if (pet.duty.indexOf(v.add) < 0) {
      pet.duty.push(v.add);
      G.log(petName(pet) + '似乎学会了新的本事。', '吉');
    }
  }
  function opRemember(v) {
    var pet = G.pet(); if (!pet) return;
    remember(pet, v.t);
  }

  // 兽死（§B die / 设计 §9）
  function opDie(v) {
    var pet = G.pet(); if (!pet) return;
    var p = G.player;
    var nm = petName(pet);
    var isMingyuan = bandIndex(pet._bond) >= 4; // 命缘
    var cause = v.cause || '';

    // 丧兽 log + 念它记得的事（重量来源：设计 §9.1）
    G.log('—— ' + nm + '去了。' + (cause ? '（' + cause + '）' : '') + ' ——', '凶');
    if (pet.memory && pet.memory.length) {
      pet.memory.forEach(function (m) { G.log('你想起：' + m, '因果'); });
    }
    G.history('丧兽：' + nm);

    // shouhun 道：残念入兽魂栈（设计 §10 单向喂养 活兽死→兽魂生）
    if (p.daoStage && (p.daoStage.shouhun || 0) >= 1) {
      G.log('那一缕不肯散的残念，循着你修的兽魂道，沉入了你的识海——它成了最先应你的那一道。', '异象');
    }

    if (isMingyuan) {
      // 命缘：落 legacy + 存 petSoul（转世认主大闭环 §G）
      if (G.meta) {
        G.meta.legacy = G.meta.legacy || {};
        G.meta.legacy['pet_zhuanshi'] = true;
        G.meta.carried = G.meta.carried || {};
        G.meta.carried.petSoul = {
          species: pet.speciesId,
          name: pet.name || null,
          track: pet.track,
          temper: (pet.temper || []).slice(),
          marks: (pet.marks || []).slice(),
          memory: (pet.memory || []).slice()
        };
      }
      // 授「丧兽」记忆（id 由内容 agent 定义；未注册则安全跳过，不报错）
      if (G.get('memory', 'mem_sangshou')) G.sys.rein.gainMemory('mem_sangshou');
      G.log('你看着那双渐渐黯下去的眼睛，忽然觉得——这不会是最后一面。', '因果');
    }

    p.pet = null;
    G.bus.emit('pet:die', { cause: cause, mingyuan: isMingyuan });
  }

  // 弃你而走（§B leave / 设计 §6.3）
  function opLeave(v) {
    var pet = G.pet(); if (!pet) return;
    var nm = petName(pet);
    G.log('某天清晨，你身边空了。' + nm + '走了，没有回头。', '凶');
    if (v.reason) G.log(v.reason, '平');
    G.history(nm + '弃你而走');
    G.player.pet = null;
    G.bus.emit('pet:leave', { reason: v.reason || '' });
  }

  // ============ 条件 DSL 委托（§C） ============
  function condop(v) {
    var pet = G.pet();
    if (v == null || typeof v !== 'object') return !!pet;
    // has
    if (v.has != null) { if (v.has ? !pet : !!pet) return false; }
    // 以下条件需有兽
    if (v.spirit != null) { if (!pet) return false; if (!cmp(pet.spirit || 0, v.spirit)) return false; }
    if (v.bondGte != null) {
      if (!pet) return false;
      var need = BAND_WORDS.indexOf(v.bondGte);
      if (need < 0) need = 0;
      if (bandIndex(pet._bond || 0) < need) return false;
    }
    if (v.track != null) { if (!pet || pet.track !== v.track) return false; }
    if (v.duty != null) { if (!pet || !pet.duty || pet.duty.indexOf(v.duty) < 0) return false; }
    if (v.mark != null) { if (!pet || !hasMark(pet, v.mark)) return false; }
    if (v.species != null) { if (!pet || pet.speciesId !== v.species) return false; }
    if (v.moodIs != null) { if (!pet || pet.mood !== v.moodIs) return false; }
    if (v.temper != null) { if (!pet || !pet.temper || pet.temper.indexOf(v.temper) < 0) return false; }
    return true;
  }
  function cmp(val, spec) {
    if (spec == null || typeof spec !== 'object') return val === spec;
    if (spec.gte != null && !(val >= spec.gte)) return false;
    if (spec.lte != null && !(val <= spec.lte)) return false;
    if (spec.eq != null && val !== spec.eq) return false;
    return true;
  }

  // ============ 月度：兽自发小事件（设计 §7.4 / §6.3，低频·叙事化） ============
  // 由 time.js tick 第 4.5 步（NPC monthly 之后）调用。每月至多触发一两件，1~3 句 log。
  function monthly() {
    var p = G.player, pet = G.pet();
    if (!p || p.dead || !pet) return;

    // 1) 老去推进：spirit 越高/牵绊越深越长寿；这里用隐藏 age 计数（pflag），避免新增 counter。
    var ageKey = '_petage_';
    p.pflags[ageKey] = (p.pflags[ageKey] || 0) + 1;
    var age = p.pflags[ageKey];
    var lifespan = petLifespan(pet);
    if (age >= lifespan) {
      // 老死（最温柔）：命缘者走转世链
      G.log(petName(pet) + '近来总卧在门口晒太阳，毛色也淡了。', '平');
      fxop({ op: 'die', cause: '老死' });
      return;
    }
    if (age >= lifespan - 2 && pet.mood !== '将老') {
      pet.mood = '将老';
      G.log(petName(pet) + '老了，步子慢下来，爱在你脚边卧着。', '平');
      return;
    }

    // 2) mood 驱动的脾气事件（设计 §7.4 末），低频
    var nm = petName(pet);
    var band = bandIndex(pet._bond);

    // 伤/病态优先（需玩家照拂的钩子）
    if (pet.mood === '伤') {
      if (G.rng.chance(0.5)) { G.log(nm + '蜷在角落舔着伤口，你递的食也不大肯吃。', '平'); }
      else { pet.mood = '安'; G.log(nm + '的伤好了些，又来蹭你的手。', '吉'); }
      return;
    }
    if (pet.mood === '病') {
      if (G.rng.chance(0.4)) { G.log(nm + '病恹恹的，得喂些药才好。', '平'); }
      else { pet.mood = '安'; G.log(nm + '的病气退了，眼里又有了神。', '吉'); }
      return;
    }

    // 躁：冷落太久（相托档以上更易闹，设计 §6.2）
    if (pet.mood === '躁') {
      if (G.rng.chance(0.4)) {
        G.log(nm + '躁得很，叼坏了你晾着的东西，冲你龇牙。', '平');
        addBond(pet, -1);
      } else { pet.mood = '安'; }
      return;
    }

    // 安：随灵性/职能/牵绊偶发好事（带猎给点钱/材料、示警）
    if (G.rng.chance(0.30)) {
      // 牵绊 < 亲近：多半干自己的活，偶尔离心
      if (band < 2) {
        if (G.rng.chance(0.4)) G.log(nm + '自顾自地在院角刨着土，没怎么理你。', '平');
        return;
      }
      // 亲近以上：开始替你做事
      var roll = G.rng.int(1, 100);
      if (hasDuty(pet, '示警') || pet.track === '温灵') {
        if (roll <= 30) { G.log(nm + '半夜忽然冲着黑处低吼，把你惊醒——许是有什么东西来过。', '平'); return; }
      }
      if (roll <= 55) {
        // 带猎：给点钱
        var money = G.rng.int(3, 9) + (pet.spirit || 0) * 2;
        p.money += money;
        G.log(nm + '清晨叼回一只野物搁在你脚边，尾巴扫着地。', '吉');
        if (band >= 3 && G.rng.chance(0.4)) remember(pet, '它把猎物放你脚边那天');
        return;
      }
      if (roll <= 75 && (pet.spirit || 0) >= 1) {
        // 示警/卜兆（叙事，不强行触发阈值事件，留给内容）
        G.log(nm + '一整天都不安生，绕着你转，像在告诉你什么。', '异象');
        return;
      }
      // 恋主小事
      if (roll <= 90 && band >= 3) {
        if (pet.mood !== '恋主') pet.mood = '恋主';
        G.log(nm + '寸步不离地跟着你，你走到哪它跟到哪。', '平');
        return;
      }
      // 牵绊自然微涨（陪伴）
      addBond(pet, 1);
      return;
    }

    // 长期冷落漂移：相托/命缘档若 mood 一直安且无互动，偶尔转躁（需要哄）
    if (band >= 3 && G.rng.chance(0.06)) {
      pet.mood = '躁';
      G.log(nm + '近来脾气见长，你冷落它太久了。', '平');
    }
  }

  function hasDuty(pet, d) { return !!(pet && pet.duty && pet.duty.indexOf(d) >= 0); }

  // 隐藏寿数（月）：凡品短、灵性越高越长；不显示，只驱动老死节奏
  function petLifespan(pet) {
    var d = def(pet);
    var rank = d ? d.rank : '凡';
    var base = { '凡': 90, '下': 120, '中': 160, '上': 220, '玄': 360 }[rank] || 90;
    base += (pet.spirit || 0) * 24;          // 开灵延寿
    base += bandIndex(pet._bond) * 8;        // 牵绊深些也活得长些
    return base;
  }

  // ============ §F combat:end 叙事钩 ============
  // 纯叙事 + 漂移；兽不进回合制、不占血条。读 G.pet()+bondWord+temper+payload。
  G.bus.on('combat:end', function (payload) {
    var pet = G.pet(); if (!pet) return;
    var p = G.player; if (!p || p.dead) return;
    var nm = petName(pet);
    var band = bandIndex(pet._bond);
    var result = payload.result;        // 'win'|'lose'|'flee'|'press'
    var rating = payload.rating;        // 秒杀/碾压/险胜/苦战/压制/威压降服
    var boss = !!payload.boss;
    var hard = (rating === '险胜' || rating === '苦战'); // 你本该险死那战

    // 染煞噬敌（设计 §8 特殊）：有 xue_ran 印记，见血兴奋，玩家 xuexing↑代价
    if (hasMark(pet, 'xue_ran') && result === 'win') {
      G.log('【异象】' + nm + '扑上去撕咬尸首，眼里泛着血光，喉咙里滚着低嚎。', '血');
      p.counters.xuexing = (p.counters.xuexing || 0) + 2;
      addBond(pet, 1);
      return;
    }

    // 命缘 + 强敌(boss) + 险胜/苦战：有概率替你死（走 die op，设计 §8 / §6.3）
    if (band >= 4 && boss && hard && (result === 'win') && G.rng.chance(0.5)) {
      G.log('那一爪本是冲着你来的。' + nm + '却毫不犹豫地扑了上去，替你受了。', '凶');
      remember(pet, '它替你挡下那致命一击的瞬间');
      fxop({ op: 'die', cause: '护主而死' });
      return;
    }

    // 相托：替你挡（叙事免伤已由战斗结算，这里写它做了什么 + mood 转伤 + 牵绊↑）
    if (band >= 3) {
      if (result === 'win' || result === 'press') {
        if (hard && G.rng.chance(0.6)) {
          G.log(nm + '死死咬住那畜生的后颈不放，替你挡了最凶的那下，自己也挂了彩。', '战');
          pet.mood = '伤';
          remember(pet, '它为你挡下那一下，自己受了伤');
          addBond(pet, 2);
        } else if (G.rng.chance(0.5)) {
          G.log(nm + '在你身侧低吼盘旋，敌手始终不敢绕到你背后。', '战');
          addBond(pet, 1);
        }
      } else if (result === 'flee') {
        G.log(nm + '叼着你的衣角往后拽，催你快走。', '战');
      }
      return;
    }

    // 亲近：撕咬一下；劣势(逃跑)则牵绊微降 + 加「怯」
    if (band >= 2) {
      if (result === 'win' && G.rng.chance(0.5)) {
        G.log(nm + '瞅准空子窜上去咬了一口，又机灵地退开。', '战');
      } else if (result === 'flee' || result === 'lose') {
        G.log(nm + '见势不妙，早早夹着尾巴躲到了一边。', '平');
        addTemper(pet, '怯');
        addBond(pet, -1);
      }
      return;
    }

    // 生分 / 相识：多半旁观（孤立感比扣血更重，设计 §8）
    if (G.rng.chance(0.7)) {
      G.log(nm + '蹲在血泊边舔着爪子看你，没动。', '平');
    }
  });

  // ============ 公共 API（§D） ============
  G.sys.beast = {
    fxop: fxop,
    condop: condop,
    bondWord: bondWord,
    spiritName: spiritName,
    seen: seen,
    def: def,
    monthly: monthly,
    // 内部 helper 暴露给 UI/探针（只读取词，不暴露 _bond 数字）
    petName: petName,
    _bandIndex: function (pet) { return bandIndex((pet || G.pet() || {})._bond || 0); }
  };
})();
