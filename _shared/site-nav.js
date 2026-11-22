/* ============================================================
   SITE-NAV v2（2026-11-04）— 站点导航条的「行为层」
   ------------------------------------------------------------
   唯一真相源：_shared/site-nav.js，由 inject_shared.py 内联进七页。
   导航条本体（HTML + CSS）已改为静态块 _shared/site-nav-static.html，
   放在 <body> 开头随文档解析立即呈现，消除 v1 的首屏闪烁：
   v1 在 DOMContentLoaded 才 createElement 插入，任务台 FCP 1220ms /
   DCL 1555ms，中间约 335ms 显示的是没有导航条的旧版布局。
   本文件只负责：当前页高亮 + 站点级 PWA 注册。幂等、零外部依赖。
   - 非吸顶：不与各页 sticky 顶栏抢 top:0
   - 颜色全部取页面自身 CSS 变量，跟随亮/暗主题
   - 同标签跳转（静态链接无 target="_blank"）
   ============================================================ */
(function(){
  if (typeof document === "undefined") return;

  function currentPage(){
    var f = "";
    try { f = decodeURIComponent((location.pathname.split("/").pop() || "index.html")).toLowerCase(); } catch(e){ f = "index.html"; }
    if (!f || f === "index.html") return "home";        /* 2026-11-22 P1：根入口=门户副本 */
    if (f.indexOf("home") >= 0) return "home";
    if (f.indexOf("任务管理台") >= 0 || f.indexOf("taskhub") >= 0) return "tasks";
    if (f.indexOf("明信片") >= 0 || f.indexOf("postcard") >= 0) return "postcards";
    if (f.indexOf("书影音海报墙") >= 0 || f.indexOf("media") >= 0) return "media";
    if (f.indexOf("观剧") >= 0 || f.indexOf("theatre") >= 0) return "theatre";
    if (f.indexOf("旅行地图") >= 0 || f.indexOf("map") >= 0) return "map";
    if (f.indexOf("随笔") >= 0 || f.indexOf("notes") >= 0) return "notes";
    if (f.indexOf("作品集") >= 0 || f.indexOf("portfolio") >= 0) return "portfolio";
    if (f.indexOf("时间线") >= 0 || f.indexOf("timeline") >= 0) return "timeline";
    return "";
  }

  /* 站点级 PWA：七页共用同一个 sw.js，重复 register 天然幂等；file:// 双击时静默跳过 */
  function registerSW(){
    try{
      if(!("serviceWorker" in navigator)) return;
      if(location.protocol!=="https:" && location.protocol!=="http:") return;
      /* 批三：updateViaCache:"none" —— SW 脚本自身也走 max-age=600，
         默认策略下浏览器可能从 HTTP 缓存拿旧 sw.js，更新检查失效拖 24h。 */
      navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).catch(function(){});
    }catch(e){}
  }

  function init(){
    var bar = document.getElementById("__wsn_bar");
    if (!bar || bar.getAttribute("data-wsn-ready") === "1") return;
    var cur = currentPage();
    var a = cur ? bar.querySelector('.__wsn_links a[data-page="' + cur + '"]') : null;
    if (a){ a.className = "__wsn_on"; a.setAttribute("aria-current", "page"); }
    bar.setAttribute("data-wsn-ready", "1");
    registerSW();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();

/* ============================================================
   主题切换（20261122 复审 B1 收敛）—— 新页唯一行为源
   ------------------------------------------------------------
   观剧 / 地图 / 随笔 / 作品集及未来新页的 #btnTheme 行为统一在此；
   旧五页（任务台/明信片/海报墙/时间线/首页）保留页内实现，其按钮
   带 data-theme-bound="1" 标记，本模块遇到标记即整体跳过，
   避免双绑与主题初值互相覆盖。幂等、零外部依赖。
   ============================================================ */
(function(){
  var KEY = "wb_theme_v1";
  function wbThemeBtnSync(b){
    if(!b) return;
    var dark = document.documentElement.getAttribute("data-theme") === "dark";
    b.setAttribute("aria-pressed", dark ? "true" : "false");
    var sun='<svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    var contrast='<svg class="ic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none"/></svg>';
    b.innerHTML = (dark?sun:contrast) + " 切换主题";
    var title = dark ? "当前：暗色主题 · 点击切换为亮色" : "当前：亮色主题 · 点击切换为暗色";
    b.title = title; b.setAttribute("aria-label", title);
  }
  function wbThemeApply(t){
    try{
      var de = document.documentElement;
      if(de) de.setAttribute("data-theme", t==="dark"?"dark":"light");
      var m = document.querySelector('meta[name="theme-color"]');
      if(m) m.setAttribute("content", t==="dark" ? "#0f1320" : "#4F7CFF");
      wbThemeBtnSync(document.getElementById("btnTheme"));
    }catch(e){}   /* 主题非关键路径：异常环境（如测试沙箱）静默跳过 */
  }
  function wbThemeInit(){
    var b = document.getElementById("btnTheme");
    if(!b || b.getAttribute("data-theme-bound") === "1") return;   /* 旧页内联实现自管 */
    if(b.getAttribute("data-wb-theme") === "1") return;            /* 幂等 */
    b.setAttribute("data-wb-theme","1");
    b.addEventListener("click", function(){
      var cur = document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light";
      var next = cur==="dark" ? "light" : "dark";
      wbThemeApply(next);
      try{ localStorage.setItem("wb_theme_v1",next); }catch(e){}
    });
    try{
      var t0=null; try{ t0=localStorage.getItem(KEY); }catch(e){}
      wbThemeApply(t0 || ((window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) ? "dark":"light"));
    }catch(e){}
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", wbThemeInit);
  else wbThemeInit();
})();
