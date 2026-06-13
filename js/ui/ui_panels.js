// js/ui/ui_panels.js — 顶栏/舆图/地点行动/事件卡/侧栏六tab/开屏/出生卡/走马灯/系统栏（契约 §13）。
(function () {
  'use strict';
  var esc = function (s) { return G.ui.esc(s); };

  // ================= 顶栏 =================
  G.ui.renderTopbar = function () {
    var p = G.player, w = G.world;
    var box = document.getElementById('topbar-stats');
    if (!box) return;
    function seg(label, val, cls) {
      return '<span class="tb-seg' + (cls ? ' ' + cls : '') + '"><span class="tb-label">' + label + '</span>' + val + '</span>';
    }
    var bdef = G.get('birth', p.birthId);
    var cultText = p.cultNeed === Infinity ? (p.cult + '·圆满') : (p.cult + '/' + p.cultNeed);
    var injuryText = p.injury.severity > 0 ? ('<span class="tb-injury">带伤' + '·'.repeat(p.injury.severity) + '</span>') : '';
    box.innerHTML =
      seg('', '第' + p.lifeIndex + '世', 'tb-life') +
      seg('', w.year + '年' + w.month + '月·' + w.season + '·' + w.weather) +
      seg('', esc(p.name) + '（' + (bdef ? bdef.name : '？') + '）') +
      seg('境界', G.realmName()) +
      seg('寿元', p.ageY + '/' + p.lifespan) +
      seg('气血', p.hp + '/' + p.maxHp + ' ' + injuryText) +
      seg('灵气', p.qi + '/' + p.maxQi) +
      seg('修为', cultText) +
      seg('银两', p.money) +
      seg('名望', p.fame);
  };

  // ================= 系统栏 =================
  G.ui.renderSysbar = function () {
    var box = document.getElementById('sysbar');
    if (!box || box.children.length) return; // 只绑一次
    box.innerHTML =
      '<button id="sys-save" class="btn btn-sm">保存</button>' +
      '<button id="sys-load" class="btn btn-sm">读取</button>' +
      '<button id="sys-restart" class="btn btn-sm btn-danger">重开</button>';
    document.getElementById('sys-save').onclick = function () {
      if (G.combat) { G.ui.toast('战斗中无法保存。'); return; }
      if (G.player && G.player.dead) { G.ui.toast('此身已死，无可保存。'); return; }
      G.save.write(false);
    };
    document.getElementById('sys-load').onclick = function () {
      if (G.combat) { G.ui.toast('战斗中无法读取。'); return; }
      if (G.save.read()) { G.ui.mode = 'loc'; G.ui.refresh(); G.ui.toast('前缘已续。'); }
      else G.ui.toast('没有可读的存档。');
    };
    document.getElementById('sys-restart').onclick = function () {
      G.ui.confirmBox('重开将抹去全部存档与轮回记忆，从混沌中另起一局。此举不可挽回。', function () {
        G.save.clear();
        location.reload();
      });
    };
  };

  // ================= 舆图 =================
  G.ui.renderMap = function () {
    var p = G.player, w = G.world;
    var box = document.getElementById('map-list');
    if (!box) return;
    var html = '';
    G.IDS.locations.forEach(function (id) {
      var st = w.locations[id];
      var def = G.get('location', id);
      if (!st || !def) return;
      if (!st.discovered) {
        html += '<div class="map-item map-unknown">〔未知之地〕</div>';
        return;
      }
      var cur = p.location === id;
      var dangerDots = '';
      var lvl = Math.min(5, Math.ceil(st.danger / 20));
      for (var i = 0; i < 5; i++) dangerDots += '<i class="' + (i < lvl ? 'd-on' : 'd-off') + '"></i>';
      html += '<div class="map-item' + (cur ? ' map-cur' : '') + '" data-loc="' + id + '">' +
        '<div class="map-name">' + esc(def.name) + (cur ? '<span class="map-here">身在此处</span>' : '') + '</div>' +
        '<div class="map-danger">险 ' + dangerDots + (st.bossAlive && def.boss ? '<span class="map-boss">主</span>' : '') + '</div>' +
        '</div>';
    });
    box.innerHTML = html;
    Array.prototype.forEach.call(box.querySelectorAll('.map-item[data-loc]'), function (el) {
      el.onclick = function () {
        var id = el.getAttribute('data-loc');
        if (id !== G.player.location) G.sys.actions.travel(id);
      };
    });
    // 世界风声（不报数字，只给趋势话）
    var wv = document.getElementById('map-wvars');
    var hints = [];
    if (w.vars.wolfThreat >= 60) hints.push('狼患日炽');
    else if (w.vars.wolfThreat >= 35) hints.push('山有狼踪');
    if (w.vars.ghostQi >= 60) hints.push('庙影幢幢');
    if (w.vars.mineInstability >= 60) hints.push('矿洞将倾');
    if (w.vars.villageFear >= 50) hints.push('镇人惶惶');
    if (w.vars.sectAttention >= 30) hints.push('仙门有目');
    if (w.vars.marketPrice >= 125) hints.push('药价腾贵');
    else if (w.vars.marketPrice <= 80) hints.push('药价低贱');
    wv.innerHTML = hints.length ? '<div class="panel-title">风声</div>' + hints.map(function (h) {
      return '<div class="wv-hint">' + h + '</div>';
    }).join('') : '';
  };

  // ================= 中央：地点 + 行动 =================
  G.ui.renderLoc = function (center) {
    var p = G.player;
    var def = G.get('location', p.location);
    var st = G.curLoc();
    var html = '<div class="loc-head"><div class="loc-name">' + esc(def.name) + '</div>' +
      '<div class="loc-weather">' + G.world.year + '年' + G.world.month + '月 · ' + G.world.season + ' · ' + G.world.weather + '</div></div>' +
      '<div class="loc-desc">' + esc(def.desc) + '</div>';
    if (st.bossAlive && def.boss) {
      var bdef = G.get('enemy', def.boss);
      if (bdef) html += '<div class="loc-bosshint">此地有主：传闻【' + esc(bdef.name) + '】盘踞于此。</div>';
    }
    if (p.injury.severity >= 2) html += '<div class="loc-injuryhint">你伤势未愈，凶险的事做不得。</div>';

    html += '<div class="panel-title">行止</div><div class="action-list">';
    var actions = G.sys.actions.available();
    if (!actions.length) html += '<div class="action-none">此地暂无可为之事。</div>';
    actions.forEach(function (a) {
      var riskText = ['无虞', '微险', '行险', '搏命'][Math.min(3, a.risk || 0)];
      html += '<div class="action-item" data-act="' + a.id + '">' +
        '<div class="action-name">' + esc(a.name) +
        '<span class="action-meta risk-' + (a.risk || 0) + '">' + riskText + '</span>' +
        ((a.timeCost || 1) > 1 ? '<span class="action-meta">' + a.timeCost + '月</span>' : '') +
        '</div>' +
        '<div class="action-desc">' + esc(a.desc || '') + '</div></div>';
    });
    html += '</div>';
    center.innerHTML = html;
    Array.prototype.forEach.call(center.querySelectorAll('.action-item'), function (el) {
      el.onclick = function () { G.sys.actions.perform(el.getAttribute('data-act')); };
    });
  };

  // ================= 中央：事件卡 =================
  G.ui.renderEvent = function (center) {
    var card = G.sys.events.cardData(G.sys.events.pending[0]);
    if (!card) { G.sys.events.pending.shift(); G.ui.setMode('loc'); return; }
    var html = '<div class="event-card">' +
      '<div class="event-title">' + esc(card.title) + '</div>' +
      '<div class="event-text">' + esc(card.text).replace(/\n/g, '<br>') + '</div>' +
      '<div class="event-choices">';
    if (card.choices.length) {
      card.choices.forEach(function (c) {
        html += '<button class="btn btn-choice" data-ch="' + c.idx + '">' + esc(c.text) + '</button>';
      });
    } else {
      html += '<button class="btn btn-choice" data-ch="-1">（继续）</button>';
    }
    html += '</div></div>';
    center.innerHTML = html;
    Array.prototype.forEach.call(center.querySelectorAll('.btn-choice'), function (el) {
      el.onclick = function () {
        G.sys.events.choose(parseInt(el.getAttribute('data-ch'), 10));
      };
    });
  };

  // ================= 侧栏 tab =================
  var TABS = [
    ['wudao', '悟道录'], ['qianshi', '前世'], ['chuanwen', '传闻'],
    ['chenghao', '称号'], ['xingnang', '行囊'], ['renwu', '人物'],
    ['lingshou', '灵兽']
  ];

  G.ui.renderSide = function () {
    var tabsBox = document.getElementById('side-tabs');
    var body = document.getElementById('side-body');
    if (!tabsBox) return;
    tabsBox.innerHTML = TABS.map(function (t) {
      return '<span class="side-tab' + (G.ui.tab === t[0] ? ' tab-cur' : '') + '" data-tab="' + t[0] + '">' + t[1] + '</span>';
    }).join('');
    Array.prototype.forEach.call(tabsBox.querySelectorAll('.side-tab'), function (el) {
      el.onclick = function () { G.ui.tab = el.getAttribute('data-tab'); G.ui.renderSide(); };
    });
    var fn = {
      wudao: tabWudao, qianshi: tabQianshi, chuanwen: tabChuanwen,
      chenghao: tabChenghao, xingnang: tabXingnang, renwu: tabRenwu,
      lingshou: tabLingshou
    }[G.ui.tab] || tabWudao;
    body.innerHTML = fn();
    bindSideEvents(body);
  };

  function tabWudao() {
    var p = G.player;
    var html = '';
    // 已命名的道途（阶段≥2 才公开道名与阶段）
    G.all('dao').forEach(function (d) {
      var st = p.daoStage[d.id] || 0;
      if (st >= 2) {
        html += '<div class="wd-dao">【' + esc(d.hiddenName) + '】' + esc(d.stageNames[st] || '') +
          (d.skill && p.pflags['_skill_' + d.skill.id] ? '<div class="wd-skill">技：' + esc(d.skill.name) + ' — ' + esc(d.skill.desc || '') + '</div>' : '') +
          '</div>';
      }
    });
    var keys = Object.keys(p.insights);
    if (!keys.length && !html) return '<div class="side-empty">尚无所悟。怪事会自己找上门来的。</div>';
    keys.forEach(function (k) {
      var e = p.insights[k];
      html += '<div class="wd-entry"><div class="wd-title">' + esc(e.title) + '</div>';
      e.lines.forEach(function (l) {
        html += '<div class="wd-line' + (l.confirmed ? ' wd-confirmed' : '') + '">' +
          (l.confirmed ? '◆ ' : '◇ ') + esc(l.text) + '</div>';
      });
      html += '</div>';
    });
    return html;
  }

  function tabQianshi() {
    var p = G.player, m = G.meta;
    var html = '<div class="qs-head">此为第' + p.lifeIndex + '世' +
      (m.reincarnationCount > 0 ? '，已历' + m.reincarnationCount + '次轮回' : '') + '。</div>';
    if (m.lastDeath) {
      var locDef = G.get('location', m.lastDeath.locId);
      html += '<div class="qs-death">前世终于' + (locDef ? esc(locDef.name) : '不知名处') +
        '（' + m.lastDeath.ym.y + '年' + m.lastDeath.ym.m + '月）。</div>';
    }
    // 道途余痕（spec §0.6）：前世走过的道，在命数里留下的偏向（不是修为，是「似曾相识」的根）
    var seed = m.carried.tendSeed || {};
    var hen = G.all('dao').filter(function (d) { return (seed[d.id] || 0) > 0; })
      .sort(function (a, b) { return (seed[b.id] || 0) - (seed[a.id] || 0); });
    var mems = p.memories.map(function (id) { return G.get('memory', id); }).filter(Boolean);
    if (!mems.length && !m.carried.echoes.length && !hen.length) {
      return html + '<div class="side-empty">没有前尘可忆。第一世的人，干干净净。</div>';
    }
    if (hen.length) {
      html += '<div class="qs-group">道途余痕</div>';
      hen.forEach(function (d) {
        var s = seed[d.id] || 0;
        var deg = s >= 14 ? '命数里深深刻着' : s >= 7 ? '命数里留着' : '命数里隐约还有';
        html += '<div class="qs-echo">' + deg + '一缕' + esc(d.hiddenName) + '的偏向——身边的人、物、兽，有时会无端对你这股气有反应。</div>';
      });
    }
    var groups = { death: '殒身之忆', intel: '深藏之识', chance: '机缘之念', misc: '残篇' };
    Object.keys(groups).forEach(function (kind) {
      var list = mems.filter(function (x) { return (x.kind || 'misc') === kind; });
      if (!list.length) return;
      html += '<div class="qs-group">' + groups[kind] + '</div>';
      list.forEach(function (mm) {
        html += '<div class="qs-mem"><div class="qs-title">' + esc(mm.title) + '</div>' +
          '<div class="qs-text">' + esc(mm.text) + '</div></div>';
      });
    });
    if (m.carried.echoes.length) {
      html += '<div class="qs-group">残响</div>';
      m.carried.echoes.forEach(function (e) {
        html += '<div class="qs-echo">第' + e.life + '世曾名动一方：「' + esc(e.name) + '」</div>';
      });
    }
    return html;
  }

  function tabChuanwen() {
    var rs = G.world.rumors;
    if (!rs.length) return '<div class="side-empty">镇上近来无话可说。</div>';
    return rs.map(function (r) {
      return '<div class="rumor"><span class="rumor-ym">' + esc(r.ym) + '</span>' + esc(r.text) + '</div>';
    }).join('');
  }

  function tabChenghao() {
    var ts = G.player.titles;
    if (!ts.length) return '<div class="side-empty">尚无名号。世人还不识得你。</div>';
    return ts.map(function (id) {
      var d = G.get('title', id);
      if (!d) return '';
      return '<div class="title-item"><div class="title-name">' + esc(d.name) + '</div>' +
        '<div class="title-desc">' + esc(d.desc || '') + '</div></div>';
    }).join('');
  }

  function tabXingnang() {
    var p = G.player;
    var html = '<div class="inv-money">银钱：' + p.money + ' 文</div>';
    if (p.traits.length) html += '<div class="inv-traits">身具：' + p.traits.map(esc).join('、') + '</div>';
    html += '<div class="inv-stats">膂力' + p.stats.li + ' 体魄' + p.stats.ti + ' 身法' + p.stats.min + ' 神识' + p.stats.shen + '</div>';
    if (!p.inventory.length) return html + '<div class="side-empty">行囊空空。</div>';
    var wpn = G.playerWeapon();
    p.inventory.forEach(function (it) {
      var d = G.get('item', it.id);
      if (!d) return;
      var isWpn = wpn && wpn.id === it.id;
      html += '<div class="inv-item"><div class="inv-name">' + esc(d.name) + ' ×' + it.n +
        (isWpn ? '<span class="inv-equipped">佩</span>' : '') + '</div>' +
        '<div class="inv-desc">' + esc(d.desc || '') + '</div>' +
        (d.type === 'consumable' ? '<button class="btn btn-xs inv-use" data-item="' + it.id + '">用</button>' : '') +
        '</div>';
    });
    return html;
  }

  function tabRenwu() {
    var html = '';
    G.all('npc').forEach(function (d) {
      var st = G.npcState(d.id);
      if (!st) return;
      var favText = st.fav >= 60 ? '恩义' : st.fav >= 30 ? '信任' : st.fav >= 10 ? '相识' : st.fav <= -20 ? '交恶' : '陌生';
      html += '<div class="npc-item"><div class="npc-name">' + esc(d.name) +
        '<span class="npc-fav">' + (st.alive ? favText : '已故') + '</span></div>' +
        '<div class="npc-desc">' + esc(d.desc || '') + '</div></div>';
    });
    return html || '<div class="side-empty">你还不认得什么人。</div>';
  }

  // 灵兽：当前兽（全出词·零数字） + 异兽志（见过的灵物）
  // mood → 一句感受话（不出机制词）
  var PET_MOOD_WORD = {
    '安': '神态安泰', '躁': '焦躁难安', '伤': '带着伤',
    '病': '气息恹恹', '恋主': '寸步不离你', '将老': '毛色见衰，老态渐生'
  };
  // 印记 id → 可读异象词（marks 为机制 token，UI 只出词）
  var PET_MARK_WORD = { 'xue_ran': '染煞' };
  function markWord(m) { return PET_MARK_WORD[m] || m; }

  function tabLingshou() {
    var beast = G.sys.beast;
    var pet = G.pet();
    var html = '';

    if (pet) {
      var d = beast.def(pet);
      var speciesName = d ? d.name : '不知名的灵物';
      // 名 + 物种 + 阶段 + 态度，仿人物/悟道录卡片风
      html += '<div class="npc-item">' +
        '<div class="npc-name">' + esc(pet.name || speciesName) +
        '<span class="npc-fav">' + esc(beast.bondWord(pet) || '生分') + '</span></div>' +
        '<div class="npc-desc">' + esc(speciesName) + ' · ' +
        esc(beast.spiritName(pet) || '野性') + ' · ' + esc(pet.track || '') + '</div>';

      // 当前心绪
      html += '<div class="wd-line">此刻：' + esc(PET_MOOD_WORD[pet.mood] || pet.mood || '安') + '</div>';

      // 性情
      if (pet.temper && pet.temper.length) {
        html += '<div class="inv-traits">性情：' + pet.temper.map(esc).join('、') + '</div>';
      }
      // 职能（觉醒之能）
      if (pet.duty && pet.duty.length) {
        html += '<div class="inv-traits">通晓：' + pet.duty.map(esc).join('、') + '</div>';
      }
      // 印记
      if (pet.marks && pet.marks.length) {
        html += '<div class="inv-traits">印记：' + pet.marks.map(function (m) { return esc(markWord(m)); }).join('、') + '</div>';
      }
      html += '</div>';

      // 它记得的事
      if (pet.memory && pet.memory.length) {
        html += '<div class="panel-title">它记得的事</div>';
        pet.memory.forEach(function (t) {
          html += '<div class="qs-mem"><div class="qs-text">' + esc(t) + '</div></div>';
        });
      }
    } else {
      html += '<div class="side-empty">你身边还没有相伴的灵物。</div>';
    }

    // 异兽志：见过的灵物（不做集齐进度/百分比）
    var seenIds = beast.seen ? beast.seen() : [];
    html += '<div class="panel-title">异兽志</div>';
    if (seenIds.length) {
      seenIds.forEach(function (id) {
        var ld = G.get('beastlore', id);
        if (!ld) return;
        var rankText = ld.rank ? ld.rank + '阶' : '';
        html += '<div class="npc-item"><div class="npc-name">' + esc(ld.name) +
          (rankText ? '<span class="npc-fav">' + esc(rankText) + '</span>' : '') + '</div>' +
          '<div class="npc-desc">' + esc((ld.track || '') + (ld.catchHints ? ' · ' + ld.catchHints : '')) + '</div></div>';
      });
      html += '<div class="wd-line">江湖上还有没见过的灵物。</div>';
    } else {
      html += '<div class="side-empty">江湖上还有没见过的灵物。</div>';
    }

    return html;
  }

  function bindSideEvents(body) {
    Array.prototype.forEach.call(body.querySelectorAll('.inv-use'), function (el) {
      el.onclick = function () { G.sys.actions.useItem(el.getAttribute('data-item')); };
    });
  }

  // ================= 开屏 =================
  G.ui.renderStart = function (overlay) {
    var hasSave = G.save.exists();
    overlay.innerHTML =
      '<div class="card card-start">' +
      '  <div class="start-title">青石问道录</div>' +
      '  <div class="start-sub">一镇，一山，一口气。死了再来。</div>' +
      '  <div class="card-btns card-btns-col">' +
      (hasSave ? '<button id="st-continue" class="btn btn-gold">续前缘</button>' : '') +
      '    <button id="st-new" class="btn">' + (hasSave ? '弃档新开' : '入世') + '</button>' +
      '  </div></div>';
    var stNew = document.getElementById('st-new');
    stNew.onclick = function () {
      if (hasSave) {
        G.ui.confirmBox('已有一段前缘存于此间。新开将抹去它，包括所有轮回记忆。', function () {
          G.save.clear();
          G.game.newGame();
        });
      } else G.game.newGame();
    };
    var stCont = document.getElementById('st-continue');
    if (stCont) stCont.onclick = function () { G.game.continueGame(); };
  };

  // ================= 出生卡 =================
  G.ui.renderBirth = function (overlay) {
    var p = G.player;
    var bdef = G.get('birth', p.birthId);
    var dreams = p.memories.map(function (id) {
      var m = G.get('memory', id);
      return m && m.dream ? m.dream : null;
    }).filter(Boolean);
    overlay.innerHTML =
      '<div class="card card-birth">' +
      '  <div class="birth-life">第 ' + p.lifeIndex + ' 世</div>' +
      '  <div class="birth-name">' + esc(bdef.name) + '</div>' +
      '  <div class="birth-pname">这一世，你唤作「' + esc(p.name) + '」</div>' +
      '  <div class="birth-desc">' + esc(bdef.desc) + '</div>' +
      (p.pflags._mingqian ? '<div class="birth-mingqian">' + esc(p.pflags._mingqian) + '</div>' : '') +
      (bdef.visibleClue ? '<div class="birth-clue">' + esc(bdef.visibleClue) + '</div>' : '') +
      (dreams.length ? '<div class="birth-dreams">' + dreams.map(function (d) {
        return '<div class="birth-dream">' + esc(d) + '</div>';
      }).join('') + '</div>' : '') +
      '  <div class="card-btns"><button id="birth-go" class="btn btn-gold">睁眼</button></div>' +
      '</div>';
    document.getElementById('birth-go').onclick = function () { G.sys.rein.enterLife(); };
  };

  // ================= 走马灯 =================
  G.ui.renderLiminal = function (overlay) {
    var L = G._liminal || { chronicle: [], carriedMems: [], confirmedInsights: [], causeText: '', lifeIndex: 1, ageY: 0 };
    var html = '<div class="card card-liminal">' +
      '<div class="liminal-title">走马灯</div>' +
      '<div class="liminal-sub">第' + L.lifeIndex + '世 · 行年' + L.ageY + ' · ' + esc(L.causeText) + '</div>' +
      '<div class="liminal-cols"><div class="liminal-col">' +
      '<div class="panel-title">此生年表</div>';
    if (L.chronicle.length) {
      L.chronicle.forEach(function (h) {
        html += '<div class="lm-line"><span class="lm-ym">' + esc(h.ym) + '</span>' + esc(h.text) + '</div>';
      });
    } else html += '<div class="side-empty">这一世，乏善可陈。</div>';
    html += '</div><div class="liminal-col"><div class="panel-title">能带走的</div>';
    if (L.carriedMems.length) {
      L.carriedMems.forEach(function (id) {
        var m = G.get('memory', id);
        if (m) html += '<div class="lm-carry">忆 · ' + esc(m.title) + '</div>';
      });
    }
    if (L.confirmedInsights.length) {
      L.confirmedInsights.forEach(function (t) {
        html += '<div class="lm-carry">悟 · ' + esc(t) + '</div>';
      });
    }
    if (L.echoes && L.echoes.length) {
      L.echoes.forEach(function (e) {
        html += '<div class="lm-carry">响 · ' + esc(e.name) + '</div>';
      });
    }
    if (!L.carriedMems.length && !L.confirmedInsights.length && !(L.echoes && L.echoes.length)) {
      html += '<div class="side-empty">两手空空，魂魄也空。</div>';
    }
    html += '</div></div>' +
      '<div class="card-btns"><button id="lm-go" class="btn btn-gold">入轮回</button></div></div>';
    overlay.innerHTML = html;
    document.getElementById('lm-go').onclick = function () { G.sys.rein.complete(); };
  };
})();
