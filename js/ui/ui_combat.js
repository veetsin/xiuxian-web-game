// js/ui/ui_combat.js — 战斗屏（契约 §13 中央三态之一）。
// 渲染敌我状态条、战斗栈、持续伤害、指令行、战斗日志（触发链全程可见）、战果面板。
(function () {
  'use strict';
  var esc = function (s) { return G.ui.esc(s); };
  var STYLE_CLASS = {
    '平': 'ping', '异象': 'yixiang', '血': 'xue', '雷': 'lei', '丹': 'dan', '体': 'ti',
    '因果': 'yinguo', '凶': 'xiong', '吉': 'ji', '世界': 'shijie', '战': 'zhan', '突破': 'tupo'
  };

  function bar(cur, max, cls) {
    var pct = Math.max(0, Math.min(100, Math.round(cur / Math.max(1, max) * 100)));
    return '<div class="cbar"><div class="cbar-fill ' + cls + '" style="width:' + pct + '%"></div>' +
      '<span class="cbar-text">' + cur + ' / ' + max + '</span></div>';
  }

  G.ui.renderCombat = function () {
    var c = G.combat;
    var center = document.getElementById('center');
    if (!c || !center) return;
    var p = G.player;

    // 栈与 dot 显示
    var stacksHtml = '';
    for (var sid in c.stacks) {
      if (c.stacks[sid] <= 0) continue;
      var sd = c.stackDefs[sid];
      stacksHtml += '<span class="cstack">' + esc(sd ? sd.name : sid) + '×' + c.stacks[sid] + '</span>';
    }
    if (c.shield > 0) stacksHtml += '<span class="cstack cstack-shield">护体' + c.shield + '</span>';
    if (c.charge > 1) stacksHtml += '<span class="cstack cstack-charge">蓄势</span>';
    var dotsHtml = c.edots.map(function (d) {
      return '<span class="cdot">' + esc(d.id) + '·' + d.turns + '</span>';
    }).join('');

    var html = '<div class="combat-wrap">' +
      '<div class="combat-row">' +
      '  <div class="combat-side">' +
      '    <div class="combat-name">' + esc(p.name) + '<span class="combat-realm">' + G.realmName() + '</span></div>' +
      bar(p.hp, p.maxHp, 'cbar-hp') + bar(p.qi, p.maxQi, 'cbar-qi') +
      '    <div class="combat-tags">' + stacksHtml + '</div>' +
      '  </div>' +
      '  <div class="combat-vs">对</div>' +
      '  <div class="combat-side">' +
      '    <div class="combat-name combat-ename">' + esc(c.ename) + (c.edef.boss ? '<span class="combat-bossmark">魁</span>' : '') + '</div>' +
      bar(c.ehp, c.emaxHp, 'cbar-ehp') +
      '    <div class="combat-tags">' + dotsHtml + (c.stunned > 0 ? '<span class="cdot">僵直·' + c.stunned + '</span>' : '') + '</div>' +
      '  </div>' +
      '</div>' +
      '<div class="combat-round">第 ' + c.round + ' 回合</div>' +
      '<div id="combat-log">' +
      c.clog.map(function (l) {
        return '<div class="lg lg-' + (STYLE_CLASS[l.style] || 'zhan') + '">' + esc(l.t) + '</div>';
      }).join('') +
      '</div>';

    if (c.over) {
      // 战果面板
      var resText = { win: '胜', press: '不战而屈人', flee: '走为上', lose: '败' }[c.result] || '终';
      html += '<div class="combat-result">' +
        '<div class="combat-result-title">' + resText + (c.rating ? ' · ' + esc(c.rating) : '') + '</div>' +
        '<button id="combat-leave" class="btn btn-gold">离去</button></div>';
    } else {
      // 指令行
      var skills = G.sys.dao.skills();
      html += '<div class="combat-cmds">' +
        '<button class="btn cmd" data-cmd="attack">攻击</button>' +
        '<button class="btn cmd" data-cmd="yunqi">运气</button>' +
        '<button class="btn cmd" data-cmd="defend">守势</button>';
      skills.forEach(function (s) {
        var cost = s.skill.cost || {};
        var costText = cost.hpPct ? '耗血' : cost.qi ? '耗灵' + cost.qi : '';
        html += '<button class="btn cmd cmd-skill" data-cmd="skill" data-skill="' + s.skill.id + '">' +
          esc(s.skill.name) + (costText ? '<span class="cmd-cost">' + costText + '</span>' : '') + '</button>';
      });
      html += '<button class="btn cmd cmd-flee" data-cmd="flee">逃走</button></div>';
    }
    html += '</div>';
    center.innerHTML = html;

    var logBox = document.getElementById('combat-log');
    if (logBox) logBox.scrollTop = logBox.scrollHeight;

    if (c.over) {
      var leave = document.getElementById('combat-leave');
      if (leave) leave.onclick = function () { G.sys.combat.close(); };
    } else {
      Array.prototype.forEach.call(center.querySelectorAll('.cmd'), function (el) {
        el.onclick = function () {
          G.sys.combat.cmd(el.getAttribute('data-cmd'), el.getAttribute('data-skill'));
          // 指令结算后重绘（可能已结束/死亡/离开战斗模式）
          if (G.combat) G.ui.renderCombat();
          G.ui.renderTopbar();
        };
      });
    }
  };
})();
