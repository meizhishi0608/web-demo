/* 青翎引路 · 人淀共生
   封面页与内容界面的少量交互。不依赖任何第三方库。 */
(function () {
  "use strict";

  var CONTENT_PAGE = "explore.html";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ===================================================== 封面页 */
  var entered = false;

  /* 转场节奏：幕布升起用 0.8 秒（和 styles.css 里 .veil 的 transition 保持一致），
     完全升起后再停留 2 秒，让人看清这一屏，然后进入内容界面。 */
  var VEIL_RISE = 800;
  var VEIL_HOLD = 2000;

  function enterContent() {
    if (entered) return;
    entered = true;
    document.body.classList.add("is-leaving");
    window.setTimeout(function () {
      window.location.href = CONTENT_PAGE;
    }, reduceMotion ? 0 : VEIL_RISE + VEIL_HOLD);
  }

  /* 只有点击「探索白洋淀」按钮才进入内容界面（不再响应鼠标滚动 / 触屏滑动） */
  var exploreLink = document.querySelector(".page-landing .btn--solid");
  if (exploreLink) {
    exploreLink.addEventListener("click", function (event) {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      enterContent();
    });
  }

  /* ================================================= 内容界面导航 */
  var menuList = document.getElementById("menuList");
  var menuToggle = document.getElementById("menuToggle");

  function closeMenu() {
    if (!menuList || !menuToggle) return;
    menuList.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  if (menuToggle && menuList) {
    menuToggle.addEventListener("click", function () {
      var open = menuList.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") closeMenu();
    });

    document.addEventListener("click", function (event) {
      if (!menuList.classList.contains("is-open")) return;
      if (menuList.contains(event.target) || menuToggle.contains(event.target)) return;
      closeMenu();
    });

    menuList.addEventListener("click", function (event) {
      if (event.target.closest("a")) closeMenu();
    });
  }

  /* 当前所在栏目的高亮 */
  var anchors = menuList
    ? Array.prototype.slice.call(menuList.querySelectorAll('a[href^="#"]'))
    : [];

  if (anchors.length && "IntersectionObserver" in window) {
    var targets = [];
    anchors.forEach(function (link) {
      var el = document.querySelector(link.getAttribute("href"));
      if (el && targets.indexOf(el) === -1) targets.push(el);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = "#" + entry.target.id;
          anchors.forEach(function (link) {
            var on = link.getAttribute("href") === id;
            link.classList.toggle("is-active", on);
            if (on) {
              link.setAttribute("aria-current", "true");
            } else {
              link.removeAttribute("aria-current");
            }
          });
        });
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ============================================== 栏目页（content.html）
     每个栏目独占一屏，靠地址栏里的 # 切换。
     这里只做两件事：高亮当前栏目、没带 # 时补上第一屏。
     全程不涉及滚动——页面本身就没有可滚动的高度。 */
  if (document.body.classList.contains("page-section")) {
    var navAnchors = Array.prototype.slice.call(
      document.querySelectorAll('.menu__list > li > a[href*="content.html#"]')
    );

    var syncActive = function () {
      var current = window.location.hash ? window.location.hash.slice(1) : "overview";
      /* 「相册」是「我们的调查」下面的子页，高亮回到父栏目 */
      if (current === "album") current = "research";
      navAnchors.forEach(function (link) {
        var on = link.getAttribute("href").split("#")[1] === current;
        link.classList.toggle("is-active", on);
        if (on) {
          link.setAttribute("aria-current", "true");
        } else {
          link.removeAttribute("aria-current");
        }
      });
      closeMenu();
    };

    /* 直接打开 content.html（没带 #）时，默认落在「项目概况」 */
    if (!window.location.hash) {
      window.location.replace("#overview");
    }

    syncActive();
    window.addEventListener("hashchange", syncActive);
  }

  /* ====================================== 青翎AI交互中心（形态切换）
     目前是「演示模式」：回答来自下面这份预置内容，不联网。
     等后端接口做好，把 reply() 换成 fetch 调用即可，其余不用动。 */
  var qling = document.querySelector(".qling");

  if (qling) {
    var qlingForms = {
      classic: {
        label: "古风形态",
        audience: "面向到访游客",
        desc: "头戴苇编渔家大斗笠，背篓里驮着青头潜鸭，腰间别一枝红色雁翎。顶的是水乡百姓的装束，讲的是淀上的生活方式。",
        img: "assets/img/qingling-classic.png",
        greeting: "你好，我是青翎。淀上的水路我熟，想先聊点什么？",
        asks: [
          ["白洋淀什么季节来最好？", "春天看芦苇抽芽，夏天荷花满淀，秋天芦花飞雪。要是专门来看鸟，十一月到次年三月最合适——青头潜鸭那时候会在淀里过冬，站在观鸟平台上就能看到。"],
          ["苇编能自己动手做吗？", "能。王家寨和邵庄子都有手艺人开的体验点，编一只小篓子大概一个多小时，成品可以直接带走。我可以帮你看看当天哪几家开课。"],
          ["雁翎队是什么？", "抗日战争时期白洋淀上的水上游击队。队员把雁翎插在土枪的点火口上防潮，「雁翎队」这个名字就是这么来的。纪念馆里有他们用过的实物和照片。"],
          ["带我走一遍生态民俗线吧", "从主码头出发，先穿万亩芦苇荡，再到王家寨民俗村，然后上望月岛，最后到邵庄子渔村，原路返回。一天走得完，想慢一点就在村里住一晚。"]
        ]
      },
      tech: {
        label: "科技形态",
        audience: "面向本土人士",
        desc: "青绿荧光色调的科技机体，头部集成检索装备，胸口佩红色雁翎胸针，腰间挂着苇编荷花。面向管理、技术人员与本地商户，做的是系统与经营上的帮手。",
        img: "assets/img/qingling-tech.png",
        greeting: "你好，我是青翎。素材、经营数据、系统上的事，都可以问我。",
        asks: [
          ["素材怎么上传？", "在「素材管理」里按点位归类上传，照片和短视频都支持。上传后我会自动打上时间、地点和主题标签，后面检索和生成内容都会方便很多。"],
          ["这个月的经营数据在哪看？", "在「经营看板」里，能看客流、订单和收入的分时曲线，也可以按周做对比。数据来自票务和订单系统，每天凌晨同步一次。"],
          ["怎么让我的店出现在线路推荐里？", "先把店铺信息补全——位置、营业时间、特色项目，再勾选想接入的主题线路。信息完整、营业时间稳定的店会被优先排进路线。"],
          ["系统怎么更新？", "有新版本我会在这里推提醒，跟着点两下就行。要是遇到报错，把屏幕上的提示发给我，我帮你定位是哪一步出的问题。"]
        ]
      }
    };

    var chatWindow = document.getElementById("chatWindow");
    var chatAsks = document.getElementById("chatAsks");
    var chatForm = document.getElementById("chatForm");
    var chatText = document.getElementById("chatText");
    var chatAvatar = document.getElementById("chatAvatar");
    var chatName = document.getElementById("chatName");
    var chatStatus = document.getElementById("chatStatus");
    var currentForm = "classic";
    var apiReady = false;        // 接口能不能用
    var apiChecked = false;
    var apiModel = "";           // 接口在用的模型（探测到了就显示出来）
    var history = [];            // 只存在浏览器内存里，刷新即清
    var busy = false;

    function bubble(kind, text) {
      var el = document.createElement("div");
      el.className = "msg msg--" + kind;
      el.textContent = text;
      chatWindow.appendChild(el);
      chatWindow.scrollTop = chatWindow.scrollHeight;
      return el;
    }

    /* 接口没通时的预置回答 */
    function reply(form, question) {
      var list = qlingForms[form].asks;
      for (var i = 0; i < list.length; i++) {
        if (list[i][0] === question) return list[i][1];
      }
      return "这个问题我先记下来。现在还没连上大模型，正式接入之后我就能细讲了。";
    }

    /* 探测接口在不在：能返回 405 就说明函数部署好了，不用真的调模型。
       顺便问一下 /api/chat?status=1，把「现在用的是哪家模型」写到状态栏上。
       旧版接口不认识这个参数，会照旧返回 405，这时候就退回原来的写法。 */
    function probeApi() {
      if (apiChecked) return;
      apiChecked = true;
      fetch("/api/chat?status=1")
        .then(function (res) {
          apiReady = res.status !== 404;
          if (!apiReady) return null;
          return res.json().catch(function () { return null; });
        })
        .then(function (info) {
          if (!info) { markStatus(); return; }
          /* 接口报了「没有配密钥」，那就按离线处理 */
          if (typeof info.ready === "boolean") apiReady = apiReady && info.ready;
          if (info.model) apiModel = (info.provider ? info.provider + " · " : "") + info.model;
          markStatus();
        })
        .catch(function () {
          apiReady = false;
          markStatus();
        });
    }

    function markStatus() {
      if (!chatStatus) return;
      chatStatus.textContent = apiReady
        ? "已接入大模型 · " + (apiModel ? "回答由 " + apiModel + " 生成" : "回答由 AI 生成")
        : "离线演示模式 · 回答来自预置内容";
    }

    /* 走真接口：服务器返回的是纯文本流，一边收一边显示 */
    function askServer(question) {
      var holder = bubble("bot", "");
      holder.textContent = "青翎正在想…";

      return fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form: currentForm,
          message: question,
          history: history.slice(-6)
        })
      }).then(function (res) {
        if (!res.ok || !res.body) throw new Error("bad");

        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        var text = "";
        holder.textContent = "";

        function pump() {
          return reader.read().then(function (chunk) {
            if (chunk.done) return;
            text += decoder.decode(chunk.value, { stream: true });
            holder.textContent = text;
            chatWindow.scrollTop = chatWindow.scrollHeight;
            return pump();
          });
        }

        return pump().then(function () {
          if (!text) throw new Error("empty");
          history.push({ role: "user", content: question });
          history.push({ role: "assistant", content: text });
        });
      }).catch(function () {
        apiReady = false;
        markStatus();
        holder.textContent = reply(currentForm, question);
      });
    }

    function ask(question) {
      if (busy) return;
      bubble("user", question);

      if (!apiChecked) probeApi();

      if (!apiReady) {
        /* 还没探测完也没关系：先给预置回答，接口通了下次就走真的 */
        window.setTimeout(function () {
          bubble("bot", reply(currentForm, question));
        }, 220);
        return;
      }

      busy = true;
      askServer(question).then(function () { busy = false; });
    }

    function renderForm(form) {
      currentForm = form;
      history = [];
      var data = qlingForms[form];

      Array.prototype.forEach.call(qling.querySelectorAll(".persona__btn"), function (btn) {
        var on = btn.getAttribute("data-form") === form;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
      });

      Array.prototype.forEach.call(qling.querySelectorAll(".persona__img"), function (img) {
        img.classList.toggle("is-active", img.getAttribute("data-form") === form);
      });

      document.getElementById("personaForm").textContent = data.label;
      document.getElementById("personaAudience").textContent = data.audience;
      document.getElementById("personaDesc").textContent = data.desc;

      chatAvatar.src = data.img;
      chatName.textContent = "青翎 · " + data.label;

      chatWindow.innerHTML = "";
      bubble("bot", data.greeting);
      markStatus();

      chatAsks.innerHTML = "";
      data.asks.forEach(function (pair) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = pair[0];
        btn.addEventListener("click", function () { ask(pair[0]); });
        chatAsks.appendChild(btn);
      });
    }

    Array.prototype.forEach.call(qling.querySelectorAll(".persona__btn"), function (btn) {
      btn.addEventListener("click", function () {
        if (btn.getAttribute("data-form") !== currentForm) {
          renderForm(btn.getAttribute("data-form"));
        }
      });
    });

    if (chatForm) {
      chatForm.addEventListener("submit", function (event) {
        event.preventDefault();
        var value = (chatText.value || "").trim();
        if (!value) return;
        chatText.value = "";
        ask(value);
      });
    }

    renderForm("classic");
    probeApi();
  }

  /* ====================================== 分页（相册、我们的调查）
     每页放几条写在容器的 data-per-page 上。页面初始化时把 .pages__page 里的
     内容按每页条数重新切分，所以以后往列表里加文章 / 加照片，
     不用自己分页，加够条数就会自动多出一页。只有一页时翻页条收起。 */
  Array.prototype.forEach.call(document.querySelectorAll("[data-pager]"), function (root) {
    var bar = root.querySelector(".pager");
    var template = root.querySelector(".pages__page");
    if (!template) return;

    var perPage = parseInt(root.getAttribute("data-per-page"), 10) || 5;
    var items = [];

    /* 先把现有各页里的条目收集起来，再重新分页 */
    Array.prototype.forEach.call(root.querySelectorAll(".pages__page"), function (page) {
      Array.prototype.slice.call(page.children).forEach(function (item) {
        items.push(item);
      });
      page.parentNode.removeChild(page);
    });

    var total = Math.max(1, Math.ceil(items.length / perPage));
    var pages = [];

    for (var index = 0; index < total; index += 1) {
      var page = template.cloneNode(false);
      page.removeAttribute("hidden");
      page.setAttribute("data-page", String(index + 1));

      items.slice(index * perPage, (index + 1) * perPage).forEach(function (item) {
        page.appendChild(item);
      });

      root.insertBefore(page, bar);
      pages.push(page);
    }

    var prev = root.querySelector("[data-pager-prev]");
    var next = root.querySelector("[data-pager-next]");
    var status = root.querySelector("[data-pager-status]");
    var unit = root.getAttribute("data-pager-unit") || "";
    var current = 0;

    var render = function () {
      pages.forEach(function (page, i) {
        if (i === current) {
          page.removeAttribute("hidden");
        } else {
          page.setAttribute("hidden", "");
        }
      });

      if (status) {
        status.textContent =
          pages.length > 1
            ? current + 1 + " / " + pages.length
            : "共 " + items.length + (unit ? " " + unit : "");
      }
      if (prev) prev.disabled = current === 0;
      if (next) next.disabled = current === pages.length - 1;
    };

    if (prev) {
      prev.addEventListener("click", function () {
        if (current > 0) {
          current -= 1;
          render();
        }
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        if (current < pages.length - 1) {
          current += 1;
          render();
        }
      });
    }

    render();
  });

  /* ====================================== 首页看板娘（青翎）
     站在相册带上方。单击她说一句（下面的数组里轮流取）；
     右上角的小按钮切换古风 / 科技形态，选过的形态浏览器会记住。
     想改她说的话，直接改 MASCOT_LINES 里的句子就行。 */
  var mascot = document.getElementById("mascot");

  if (mascot) {
    var MASCOT_WELCOME = "欢迎光临，我们一起来探索白洋淀吧";
    var MASCOT_HOLD_WELCOME = 5000;   // 开场这句停留 5 秒后自动消失（人还在）
    var MASCOT_HOLD_REPLY = 6500;     // 单击后那句停留多久

    var MASCOT_LINES = {
      classic: [
        "想坐船进苇荡吗？从主码头出发，一条水路能转小半天。",
        "夏天来看荷花，秋天来看芦花飞雪，各有各的好。",
        "要看青头潜鸭，得挑十一月到第二年三月来。",
        "王家寨的苇编能自己上手编，编个小篓子带回家。",
        "雁翎队纪念馆在安新，馆里还留着当年的大抬杆。",
        "农家院的铁锅炖鱼，早上去吃最新鲜。",
        "观鸟的时候轻一点、远一点，别把它们惊着了。",
        "望月岛的日落，太阳落山前后那半小时最好看。",
        "放荷灯是淀上的老习俗，赶上节庆能碰上。",
        "走累了就找家农家院坐坐，喝口荷叶茶歇歇脚。",
        "三条主题线路我都熟，走一天还是两天，你说了算。",
        "想拍照的话，清晨的芦苇荡有薄雾，最出片。"
      ],
      tech: [
        "素材按点位归类上传，我会自动打好时间、地点和主题标签。",
        "经营看板每天凌晨同步一次，客流和订单都能看。",
        "把店铺信息补全，更容易排进主题线路推荐里。",
        "这个月的经营数据在「经营看板」里，还能按周做对比。",
        "有新版本我会在这儿提醒你，跟着点两下就好。",
        "遇到报错，把屏幕上的提示发给我，我帮你定位是哪一步。",
        "点位信息按生态、红色、民俗三类归档，后面检索更快。",
        "想接入主题线路，在店铺资料里把对应的线路勾上就行。",
        "图片素材压在 2000 像素以内，上传更快、也更省空间。",
        "有想加的点位或玩法告诉我，我帮你补进线路里。"
      ]
    };

    var mascotBubble = document.getElementById("mascotBubble");
    var mascotBody = document.getElementById("mascotBody");
    var mascotSwitch = document.getElementById("mascotSwitch");
    var mascotImgs = Array.prototype.slice.call(mascot.querySelectorAll(".mascot__img"));
    var mascotForm = "classic";
    var mascotAt = 0;
    var mascotTimer = null;

    try {
      if (window.localStorage.getItem("qingling-mascot-form") === "tech") mascotForm = "tech";
    } catch (error) { /* 隐私模式下读不到 localStorage 也没关系，用默认形态 */ }

    function paintMascot() {
      mascotImgs.forEach(function (img) {
        img.classList.toggle("is-active", img.getAttribute("data-form") === mascotForm);
      });
    }

    function mascotSay(text, hold) {
      mascotBubble.textContent = text;
      mascotBubble.classList.add("is-show");
      window.clearTimeout(mascotTimer);
      mascotTimer = window.setTimeout(function () {
        mascotBubble.classList.remove("is-show");
      }, hold);
    }

    if (mascotBody) {
      mascotBody.addEventListener("click", function () {
        var list = MASCOT_LINES[mascotForm];
        mascotSay(list[mascotAt % list.length], MASCOT_HOLD_REPLY);
        mascotAt += 1;
      });
    }

    if (mascotSwitch) {
      mascotSwitch.addEventListener("click", function () {
        mascotForm = mascotForm === "classic" ? "tech" : "classic";
        mascotAt = 0;
        paintMascot();
        try { window.localStorage.setItem("qingling-mascot-form", mascotForm); } catch (error) {}
      });
    }

    paintMascot();
    mascot.removeAttribute("hidden");

    /* 进首页先打个招呼，5 秒后这句话自己消失，人留着 */
    window.setTimeout(function () {
      mascotSay(MASCOT_WELCOME, MASCOT_HOLD_WELCOME);
    }, 600);
  }
})();
