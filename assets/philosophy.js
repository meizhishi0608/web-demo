/* 人淀共生理念专页的交互：三个维度切换、散点融合四阶段、青翎对话演示、五段旅程。
   不依赖任何第三方库。 */
(function () {
  "use strict";

  var $ = function (s, ctx) { return (ctx || document).querySelector(s); };
  var $$ = function (s, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(s));
  };

  /* ============================================ 三个共生维度 */
  var tabBtns = $$(".tabs__btn");

  tabBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      tabBtns.forEach(function (x) {
        x.classList.remove("is-active");
        x.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      $$(".tabpanel").forEach(function (p) { p.classList.remove("is-active"); });
      var panel = $("#" + btn.dataset.tab);
      if (panel) panel.classList.add("is-active");
    });
  });

  /* ============================================ 散点融合四阶段 */
  var svg = $("#scatterSvg");
  var NS = "http://www.w3.org/2000/svg";
  var pts = [
    [120, 110, "生态"], [220, 180, "湿地"], [330, 90, "红色"], [435, 170, "雁翎队"],
    [650, 110, "民俗"], [770, 200, "苇编"], [855, 95, "渔家"],
    [155, 330, "村落"], [285, 300, "游船"], [420, 360, "纪念馆"],
    [570, 300, "研学"], [710, 350, "商户"], [865, 315, "游客"]
  ];
  var copy = [
    ["离散资源状态", "点位各自有价值，但彼此缺少统一叙事、线路与数字媒介连接。"],
    ["四类「孤岛」显现", "空间、产品、产业价值与品牌传播彼此断裂，资源越多不代表体验越完整。"],
    ["「青翎」成为拟合纽带", "通过知识图谱、点位触发、个性化讲解与内容生成，建立资源之间的语义关系。"],
    ["从散点走向共生网络", "资源、居民、游客与管理者进入同一传播与体验系统，形成可持续协同。"]
  ];

  function makeNode(x, y, label, accent) {
    var g = document.createElementNS(NS, "g");

    var glow = document.createElementNS(NS, "circle");
    glow.setAttribute("cx", x); glow.setAttribute("cy", y);
    glow.setAttribute("r", accent ? 30 : 19);
    glow.setAttribute("fill", accent ? "#16233f" : "#3a4660");
    glow.setAttribute("opacity", "0.07");

    var c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", x); c.setAttribute("cy", y);
    c.setAttribute("r", accent ? 11 : 7.5);
    c.setAttribute("fill", accent ? "#16233f" : "#8f98a8");

    var t = document.createElementNS(NS, "text");
    t.setAttribute("x", x + 14); t.setAttribute("y", y + 4);
    t.setAttribute("fill", accent ? "#16233f" : "#8f98a8");
    t.setAttribute("font-size", "12");
    t.textContent = label;

    g.append(glow, c, t);
    return g;
  }

  function makeLine(a, b, opacity, dash) {
    var l = document.createElementNS(NS, "line");
    l.setAttribute("x1", a[0]); l.setAttribute("y1", a[1]);
    l.setAttribute("x2", b[0]); l.setAttribute("y2", b[1]);
    l.setAttribute("stroke", "#3a4660");
    l.setAttribute("stroke-width", "1");
    l.setAttribute("opacity", opacity);
    if (dash) l.setAttribute("stroke-dasharray", "5 7");
    return l;
  }

  function renderScatter(stage) {
    if (!svg) return;
    svg.innerHTML = "";

    if (stage === 1) {
      var boxes = [[70, 45, 390, 185], [545, 45, 390, 185], [70, 250, 390, 165], [545, 250, 390, 165]];
      var names = ["空间散点", "产品散点", "产业价值散点", "品牌传播散点"];
      boxes.forEach(function (b, i) {
        var r = document.createElementNS(NS, "rect");
        r.setAttribute("x", b[0]); r.setAttribute("y", b[1]);
        r.setAttribute("width", b[2]); r.setAttribute("height", b[3]);
        r.setAttribute("rx", 20);
        r.setAttribute("fill", "rgba(22,35,63,0.02)");
        r.setAttribute("stroke", "rgba(22,35,63,0.16)");
        r.setAttribute("stroke-dasharray", "5 7");
        svg.appendChild(r);

        var t = document.createElementNS(NS, "text");
        t.setAttribute("x", b[0] + 16); t.setAttribute("y", b[1] + 28);
        t.setAttribute("fill", "#8f98a8");
        t.setAttribute("font-size", "11");
        t.textContent = names[i];
        svg.appendChild(t);
      });
    }

    if (stage >= 2) {
      var center = [500, 230];
      pts.forEach(function (p) {
        svg.appendChild(makeLine(center, p, stage === 2 ? 0.22 : 0.3, stage === 2));
      });
      if (stage === 3) {
        [[0, 2], [2, 4], [4, 6], [1, 8], [8, 9], [9, 10], [10, 11], [11, 12], [7, 8], [5, 11], [3, 9], [6, 12]]
          .forEach(function (pair) {
            svg.appendChild(makeLine(pts[pair[0]], pts[pair[1]], 0.2, false));
          });
      }
      svg.appendChild(makeNode(center[0], center[1], "青翎智能体", true));
    }

    pts.forEach(function (p) { svg.appendChild(makeNode(p[0], p[1], p[2], false)); });

    var title = $("#scatterTitle");
    var text = $("#scatterText");
    if (title) title.textContent = copy[stage][0];
    if (text) text.textContent = copy[stage][1];

    $$(".stepbtn").forEach(function (b, i) {
      b.classList.toggle("is-active", i === stage);
    });
  }

  if (svg) {
    renderScatter(0);
    $$(".stepbtn").forEach(function (btn) {
      btn.addEventListener("click", function () { renderScatter(Number(btn.dataset.stage)); });
    });
  }

  /* ============================================ 青翎对话演示 */
  var responses = {
    eco: ["我在淀边，想了解生态", "你所在的湿地场景首先不是“景观背景”，而是整个文旅系统的生态底座。我会优先讲解水体、芦苇荡、生物多样性与湿地保护逻辑，并提示哪些区域适合观看、哪些行为需要避免。"],
    red: ["我到了纪念馆，讲讲雁翎队", "这里适合采用“场景＋人物＋行动”的叙事方式。我会把雁翎队故事和你所在点位关联起来，而不是只播一段固定讲解，让红色记忆与眼前空间发生联系。"],
    folk: ["我想体验渔家民俗", "可以把你从“观看者”变成“参与者”：例如苇编、渔家号子、渔事体验等。智能体负责解释技艺背景，本地居民则成为文化讲述与共创主体。"],
    route: ["帮我生成半日路线", "推荐思路：先生态认知 → 再红色叙事 → 再民俗参与 → 最后形成可分享的个人游记。这样不是简单“打卡四个点”，而是在半天里完成一条连续的文化叙事链。"]
  };

  $$(".chat__asks button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var pair = responses[btn.dataset.q];
      var win = $("#chatWindow");
      if (!pair || !win) return;

      var u = document.createElement("div");
      u.className = "msg msg--user";
      u.textContent = pair[0];
      win.appendChild(u);
      win.scrollTop = win.scrollHeight;

      window.setTimeout(function () {
        var r = document.createElement("div");
        r.className = "msg msg--bot";
        r.textContent = pair[1];
        win.appendChild(r);
        win.scrollTop = win.scrollHeight;
      }, 200);
    });
  });

  /* ============================================ 五段旅程 */
  var journeyData = {
    before: ["场景 01", "行前：先理解你，再推荐白洋淀", "根据游客年龄、兴趣、时间和同行人群，智能体生成主题路线，并提前解释各点位之间的文化关系，让游客还未抵达就建立“整体认知”。"],
    lake: ["场景 02", "在淀：让生态知识与眼前风景同步出现", "当游客在游船或淀边移动时，内容依据位置变化。看到的不只是“景色”，而是水体、芦苇、生物多样性与生态治理共同构成的湿地系统。"],
    red: ["场景 03", "红色：从展板阅读转向情景叙事", "将雁翎队故事与具体空间、人物、事件连接，游客可以追问、选择叙事视角，形成更具代入感的红色文化体验。"],
    folk: ["场景 04", "民俗：从观看民俗转向参与民俗", "苇编、渔事、号子等内容通过本地居民示范和游客动手参与完成传播，智能体负责补充背景与引导互动。"],
    after: ["场景 05", "行后：把体验转化为二次传播", "游览结束后，智能体辅助整理照片、路线与体验，生成个性化游记或分享卡片，让游客成为白洋淀文化的二次传播者。"]
  };

  $$(".journey__step").forEach(function (btn) {
    btn.addEventListener("click", function () {
      $$(".journey__step").forEach(function (x) { x.classList.remove("is-active"); });
      btn.classList.add("is-active");

      var d = journeyData[btn.dataset.journey];
      var detail = $("#journeyDetail");
      if (!d || !detail) return;
      detail.querySelector(".journey__scene").textContent = d[0];
      detail.querySelector("h3").textContent = d[1];
      detail.querySelector("p").textContent = d[2];
    });
  });
})();
