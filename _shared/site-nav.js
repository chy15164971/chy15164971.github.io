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

/* ============================================================
   页面设置（2026-11-23）—— 导航显隐 / 自定义入口 / 排序
   ------------------------------------------------------------
   唯一真相源：_shared/site-nav.js，由 inject_shared.py 注入十页。
   设置只存本机 localStorage(wb_nav_pages_v1)，不碰任何业务数据键；
   隐藏只收起导航链接与首页对应卡片，页面本身和数据完整保留。
   PWA 长按快捷方式是 manifest.json 静态清单，无法按本机设置动态隐藏。
   ============================================================ */
(function(){
  var KEY = "wb_nav_pages_v1";
  var BUILTIN = [
    ["home","首页"],["tasks","任务台"],["postcards","明信片"],["media","海报墙"],
    ["theatre","观剧"],["map","地图"],["notes","随笔"],["portfolio","作品集"],["timeline","时间线"]
  ];
  var CARD = {tasks:"cardTasks",postcards:"cardPostcards",media:"cardMedia",theatre:"cardTheatre",
              map:"cardMap",notes:"cardNotes",portfolio:"cardPortfolio",timeline:"cardTimeline"};
  var state = null, panel = null, btn = null, resetArmed = 0, resetTimer = null;

  function nameOf(id){ for(var i=0;i<BUILTIN.length;i++) if(BUILTIN[i][0]===id) return BUILTIN[i][1]; return ""; }
  function trim(s){ return (s||"").replace(/^\s+|\s+$/g,""); }
  function safeUrl(u){
    if(typeof u !== "string") return false;
    u = trim(u);
    if(!u || /[\s<>"']/.test(u)) return false;
    return /^(https?:\/\/|\.\/|\/)/i.test(u) || /^[\w\u4e00-\u9fa5.\/-]+\.html$/i.test(u);
  }
  function load(){
    var d = {hidden:{},custom:[],order:[]}, o = null;
    try{ o = JSON.parse(localStorage.getItem(KEY) || "null"); }catch(e){}
    if(o && typeof o === "object"){
      if(o.hidden && typeof o.hidden === "object") d.hidden = o.hidden;
      if(Array.isArray(o.custom)) for(var i=0;i<o.custom.length && d.custom.length<20;i++){
        var c = o.custom[i];
        if(c && typeof c.id === "string" && /^c_/.test(c.id) && typeof c.name === "string" && c.name && safeUrl(c.url))
          d.custom.push({id:c.id, name:c.name.slice(0,12), url:trim(c.url)});
      }
      if(Array.isArray(o.order)) d.order = o.order.slice(0,60);
    }
    var all = BUILTIN.map(function(b){ return b[0]; }).concat(d.custom.map(function(c){ return c.id; }));
    var seen = {}, ord = [];
    for(var j=0;j<d.order.length;j++){
      var id = d.order[j];
      if(!seen[id] && all.indexOf(id) >= 0){ seen[id] = 1; ord.push(id); }
    }
    for(var k=0;k<all.length;k++) if(!seen[all[k]]){ seen[all[k]] = 1; ord.push(all[k]); }
    d.order = ord;
    return d;
  }
  /* 写入口用字面量键：明信片 P2-15 白名单守卫要求业务写键显式可审计（变量键会被判可疑） */
  function save(){ try{ localStorage.setItem("wb_nav_pages_v1", JSON.stringify(state)); }catch(e){} }
  function apply(){
    var bar = document.getElementById("__wsn_bar");
    var links = bar && bar.querySelector(".__wsn_links");
    if(!links) return;
    var olds = links.querySelectorAll ? links.querySelectorAll("a[data-wbnav-custom]") : [];
    for(var i=olds.length-1;i>=0;i--) olds[i].parentNode.removeChild(olds[i]);
    for(var j=0;j<BUILTIN.length;j++){
      var a = links.querySelector('a[data-page="'+BUILTIN[j][0]+'"]');
      if(a) a.hidden = !!state.hidden[BUILTIN[j][0]];
    }
    state.custom.forEach(function(c){
      var a = document.createElement("a");
      a.setAttribute("data-wbnav-custom", c.id);
      a.setAttribute("href", c.url);
      a.setAttribute("title", c.url);
      if(/^https?:/i.test(c.url)){ a.target = "_blank"; a.rel = "noopener noreferrer"; }
      a.textContent = c.name;
      links.appendChild(a);
    });
    state.order.forEach(function(id){
      var el = links.querySelector('a[data-page="'+id+'"]') || links.querySelector('a[data-wbnav-custom="'+id+'"]');
      if(el && links.appendChild) links.appendChild(el);
    });
    var p = "";
    try{ p = location.pathname || ""; }catch(e){}   /* DOM 桩无 location 时静默跳过首页卡片联动 */
    if(p === "/" || p === "" || /(^|\/)(home|index)\.html$/i.test(p)){
      Object.keys(CARD).forEach(function(id){
        var c = document.getElementById(CARD[id]);
        if(c) c.hidden = !!state.hidden[id];
      });
    }
  }
  function mk(tag, cls, txt){ var e=document.createElement(tag); if(cls) e.className=cls; if(txt!=null) e.textContent=txt; return e; }
  function mini(txt, title, fn, disabled){
    var b = mk("button", "", txt);
    b.type="button"; b.title=title; b.setAttribute("aria-label",title);
    if(disabled) b.disabled=true; else b.addEventListener("click",fn);
    return b;
  }
  function err(msg){ var e=document.getElementById("__wsnErr"); if(e) e.textContent = msg || ""; }
  function move(idx,dir){
    var j = idx + dir;
    if(j<0 || j>=state.order.length) return;
    var t=state.order[idx]; state.order[idx]=state.order[j]; state.order[j]=t;
    save(); apply(); render();
  }
  function render(){
    var box = document.getElementById("__wsnRows");
    if(!box) return;
    while(box.firstChild) box.removeChild(box.firstChild);
    state.order.forEach(function(id, idx){
      var row = mk("div","__wsn_row"), nm = nameOf(id);
      if(nm){
        var cb = document.createElement("input");
        cb.type="checkbox"; cb.checked = !state.hidden[id]; cb.id="__wsnCb_"+id;
        cb.setAttribute("aria-label","显示"+nm);
        cb.addEventListener("change",function(){ state.hidden[id]=!cb.checked; save(); apply(); });
        row.appendChild(cb);
        var lb = mk("label","nm",nm); lb.setAttribute("for",cb.id); row.appendChild(lb);
      }else{
        var c = null;
        for(var i=0;i<state.custom.length;i++) if(state.custom[i].id===id) c=state.custom[i];
        if(!c) return;
        var t = mk("span","nm",c.name); t.title=c.url; row.appendChild(t);
        var u = mk("span","u",c.url.replace(/^https?:\/\//i,"").slice(0,22)); u.title=c.url; row.appendChild(u);
        row.appendChild(mini("×","删除自定义入口 "+c.name,function(){
          state.custom = state.custom.filter(function(x){ return x.id!==id; });
          state.order = state.order.filter(function(x){ return x!==id; });
          save(); apply(); render(); err("已删除自定义入口");
        }));
      }
      row.appendChild(mini("↑","上移",function(){ move(idx,-1); }, idx===0));
      row.appendChild(mini("↓","下移",function(){ move(idx,1); }, idx===state.order.length-1));
      box.appendChild(row);
    });
  }
  function close(){
    if(!panel) return;
    panel.hidden = true;
    if(btn) btn.setAttribute("aria-expanded","false");
  }
  function open(){
    if(!panel) return;
    state = load(); render(); err("");
    panel.hidden = false;
    if(btn) btn.setAttribute("aria-expanded","true");
    var f = panel.querySelector("input,button");
    if(f && f.focus) f.focus();
  }
  function init(){
    btn = document.getElementById("__wsnSetBtn");
    panel = document.getElementById("__wsnPanel");
    if(!btn || !panel || btn.getAttribute("data-wbnav-ready")==="1") return;
    btn.setAttribute("data-wbnav-ready","1");
    state = load(); apply();
    btn.addEventListener("click",function(){ panel.hidden ? open() : close(); });
    var x = document.getElementById("__wsnSetClose"); if(x) x.addEventListener("click",close);
    document.addEventListener("keydown",function(e){ if(e.key==="Escape" && !panel.hidden) close(); });
    document.addEventListener("click",function(e){
      if(panel.hidden) return;
      if((panel.contains && panel.contains(e.target)) || (btn.contains && btn.contains(e.target))) return;
      close();
    });
    var add = document.getElementById("__wsnAdd");
    if(add) add.addEventListener("click",function(){
      var ni=document.getElementById("__wsnNewName"), ui=document.getElementById("__wsnNewUrl");
      var n=trim(ni.value), u=trim(ui.value);
      if(!n){ err("请先填写名称"); ni.focus(); return; }
      if(!safeUrl(u)){ err("网址需以 https:// 开头，或填写站内 .html 页面"); ui.focus(); return; }
      if(state.custom.length>=20){ err("自定义入口最多 20 个"); return; }
      var id = "c_"+Date.now().toString(36)+Math.floor(Math.random()*1000).toString(36);
      state.custom.push({id:id,name:n.slice(0,12),url:u});
      state.order.push(id);
      ni.value=""; ui.value=""; err("已添加"); save(); apply(); render();
    });
    var rb = document.getElementById("__wsnReset");
    if(rb) rb.addEventListener("click",function(){
      if(resetTimer){ clearTimeout(resetTimer); resetTimer=null; }
      if(!resetArmed){
        resetArmed=1; rb.textContent="再次点击确认";
        resetTimer=setTimeout(function(){ resetArmed=0; rb.textContent="恢复默认"; resetTimer=null; },3500);
        return;
      }
      resetArmed=0; rb.textContent="恢复默认";
      try{ localStorage.removeItem(KEY); }catch(e){}
      state=load(); save(); apply(); render(); err("已恢复默认");
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
