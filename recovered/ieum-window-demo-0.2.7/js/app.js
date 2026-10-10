/* Compact installed messenger; browser mode remains an isolated UI demonstration. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s),
    $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const icons = {
    users:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    chat: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    mail: "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M22 6l-10 7L2 6",
    calendar:
      "M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2 M8 14h.01 M12 14h.01 M16 14h.01 M8 18h.01 M12 18h.01",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
    settings:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2l2 3 3-.4.6 3.4 2.8 2-2.8 2 .6 3.4-3-.4-2 3-2-3-3 .4-.6-3.4-2.8-2 2.8-2-.6-3.4 3 .4z",
    search: "M21 21l-4.35-4.35 M19 11a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    plus: "M12 5v14 M5 12h14",
    x: "M18 6L6 18 M6 6l12 12",
    left: "M15 18l-6-6 6-6",
    right: "M9 18l6-6-6-6",
    down: "M6 9l6 6 6-6",
    arrow: "M7 17L17 7 M7 7h10v10",
    send: "M22 2L9 15 M22 2l-7 20-6-7-7-6 20-7",
    check: "M20 6L9 17l-5-5",
    school: "M3 10l9-7 9 7 M5 9v12h14V9 M9 21v-7h6v7 M10 8h4",
    leaf: "M20 4c-5-2-13 1-14 7-1 7 5 11 10 7 4-3 3-8 4-14z M5 21L16 10",
    link: "M10 13a5 5 0 0 0 7 .3l3-3a5 5 0 0 0-7-7l-2 2 M14 11a5 5 0 0 0-7-.3l-3 3a5 5 0 0 0 7 7l2-2",
    notice: "M3 10v4h4l11 5V5L7 10H3 M7 14l1 7h4l-2-6 M21 9v6",
    star: "M12 3l2.8 5.7 6.3.9-4.5 4.4 1.1 6.2-5.7-3-5.7 3 1.1-6.2L3 9.6l6.3-.9L12 3z",
    clip: "M21 11l-8 8a6 6 0 0 1-8-8l9-9a4 4 0 0 1 6 6l-9 9a2 2 0 0 1-3-3l8-8",
    file: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z M14 2v6h6 M8 13h8 M8 17h6",
    clock: "M12 8v4l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    more: "M5 12h.01 M12 12h.01 M19 12h.01",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z",
    reply: "M9 10l-5 5 5 5 M4 15h10a6 6 0 0 0 0-12h-3",
    trash: "M3 6h18 M9 6V4h6v2 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    print:
      "M6 9V3h12v6 M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2 M6 14h12v8H6z",
    download: "M12 3v12 M7 10l5 5 5-5 M5 17v4h14v-4",
    lock: "M7 11V7a5 5 0 0 1 10 0v4 M5 11h14v11H5z",
    checklist: "M9 6h12 M9 12h12 M9 18h12 M3 6h.01 M3 12h.01 M3 18h.01",
    logout: "M9 21H3V3h6 M15 8l4 4-4 4 M7 12h12",
    mute: "M11 5L6 9H3v6h3l5 4V5z M17 9l5 6 M22 9l-5 6",
    sun: "M12 3v1 M12 20v1 M3 12h1 M20 12h1 M5.6 5.6l.7.7 M17.7 17.7l.7.7 M5.6 18.4l.7-.7 M17.7 6.3l.7-.7 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
    moon: "M21 13a9 9 0 1 1-10-10 7 7 0 0 0 10 10",
    popout: "M14 3h7v7 M21 3l-9 9 M10 3H3v18h18v-7",
    note: "M4 3h16v14l-5 4H4V3z M15 21v-5h5 M8 7h8 M8 11h6",
  };
  const icon = (name, size = 20) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.file}"/></svg>`;
  const button = (action, label, name = "", cls = "", extra = "") =>
    `<button type="button" class="btn ${cls}" data-action="${action}" ${extra}>${name ? icon(name, 16) : ""}${esc(label)}</button>`;
  const ib = (action, label, name, extra = "") =>
    `<button type="button" class="icon-btn ${extra.includes("mobile-back") ? "mobile-back" : ""}" data-action="${action}" aria-label="${esc(label)}" title="${esc(label)}" ${extra.replace(/class="[^"]*"/g, "")}>${icon(name, 18)}</button>`;
  const uid = (p) =>
    `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const dateKey = (d) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const parseDate = (s) => new Date(s + "T12:00:00");
  const addDays = (date, n) => {
    const d = parseDate(date);
    d.setDate(d.getDate() + n);
    return dateKey(d);
  };
  const fmtDate = (
    date,
    options = { month: "long", day: "numeric", weekday: "long" },
  ) => parseDate(date).toLocaleDateString("ko-KR", options);
  const currentTime = () =>
    new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  const weekStart = (date) => {
    const d = parseDate(date);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return dateKey(d);
  };
  const minutes = (s) => Number(s.split(":")[0]) * 60 + Number(s.split(":")[1]);
  const windowApi = window.ieumDesktop || null;
  const desktopDemo = windowApi?.mode === "demo";
  const native = desktopDemo ? null : windowApi;
  const params = new URLSearchParams(location.search);
  const requestedWorkspace = params.get("workspace");
  const requestedChat = params.get("chat");
  const requestedToday=params.get("todayPanel")==="1";
  const requestedCompose=params.get("compose")==="1";
  let composeStarted=false,mailSending=false,eventWindowStarted=false,eventSaving=false;
  let network = null;
  let connectionStatus = native ? "서버 연결 필요" : "화면 데모";
  const state = {
    page: requestedChat ? "chat" : ["inbox", "calendar", "announcements", "links"].includes(requestedWorkspace) ? requestedWorkspace : "people",
    user: null,
    group: "department",
    search: "",
    collapsed: new Set(),
    selected: new Set(),
    room: requestedChat || "r0",
    chatQuery: "",
    chatSearch: false,
    members: false,
    reply: null,
    floating: null,
    folder: "inbox",
    mail: null,
    mailSearch: "",
    today: Mock.today,
    week: weekStart(Mock.today),
    expanded: null,
    showToday: false,
    mobileList: false,
    settings: {
      calendarPosition: "left",
      orgFont: 14,
      mailFont: 15,
      chatFont: 14,
      autoLogin: false,
      dark: false,
    },
    data: JSON.parse(JSON.stringify(Mock)),
  };
  let storageWorks = true;
  try {
    const saved = JSON.parse(localStorage.getItem(native ? "ieum-preferences" : "ieum-v1") || "null");
    if (saved) {
      Object.assign(state.settings, saved.settings);
      if (!native && saved.seedDate === Mock.today && saved.data) state.data = saved.data;
      else if (!native && saved.data) {
        ["rooms", "mails", "events", "notes", "deadlines", "tasks"].forEach(
          (key) => {
            state.data[key].push(
              ...(saved.data[key] || []).filter((item) =>
                item.id.startsWith("user-") || item.id.startsWith("auto-"),
              ),
            );
          },
        );
        state.data.rooms.forEach((room) => {
          const old = saved.data.rooms?.find((r) => r.id === room.id);
          if (old) {
            room.messages.push(
              ...old.messages.filter((m) => m.id.startsWith("user-")),
            );
            room.pinned = old.pinned;
            room.muted = old.muted;
          }
        });
        if (saved.data.deadlineDefaultPeriodsChanged!==undefined) state.data.deadlineDefaultPeriodsChanged=saved.data.deadlineDefaultPeriodsChanged;
        if (saved.data.autoDeadlineSources) state.data.autoDeadlineSources=saved.data.autoDeadlineSources;
        if (saved.data.bellSchedules) state.data.bellSchedules=saved.data.bellSchedules;
        if (saved.data.classTeachers) state.data.classTeachers=saved.data.classTeachers;
        if (saved.data.defaultPeriods) state.data.defaultPeriods=saved.data.defaultPeriods;
        if (saved.data.shortcuts) state.data.shortcuts = saved.data.shortcuts;
      }
      if (!native && saved.settings?.autoLogin) state.user = saved.user || null;
    }
  } catch {
    storageWorks = false;
  }
  function save() {
    if (!native) window.IeumDeadlines.applyDemo(state.data);
    if (native) {
      try { localStorage.setItem("ieum-preferences", JSON.stringify({ settings: state.settings })); } catch {}
      return network?.active ? network.sync(state.data) : Promise.resolve(true);
    }
    try { localStorage.setItem("ieum-v1", JSON.stringify({seedDate:Mock.today,data:state.data,settings:state.settings,user:state.user})); }
    catch { if(storageWorks) toast("저장 공간을 사용할 수 없어요", "현재 열린 화면에서만 유지됩니다.");storageWorks=false; }
    return Promise.resolve(true);
  }
  function acceptServerData(result) {
    const previous=state.data;
    const drafts=$$("[data-chat-input]").map(el=>({room:el.dataset.chatInput,value:el.value}));
    const focus=document.activeElement;
    const focusRoom=focus?.dataset?.chatInput;
    const orgScroll=$("#org-tree")?.scrollTop||0;
    const currentScroll=$("#main-content")?.scrollTop||0;
    const activeProfile=result.user;
    const hadUser=!!state.user;
    state.user=activeProfile.name;state.profile=activeProfile;state.data=result.data;
    Mock.today=state.data.today;
    if(hadUser) {
      for(const event of state.data.events.filter(e=>["makeup","lessonChange"].includes(e.type)&&e.readonly&&!previous.events.some(old=>old.id===e.id))){toast("보강 안내",event.title,"calendar");native.notify("보강 안내 · 캘린더에 등록되었습니다",event.title);}
      const oldMails=new Set(previous.mails.map(m=>m.id));
      const incoming=state.data.mails.filter(m=>m.from!=="me"&&m.folder==="inbox"&&!oldMails.has(m.id));
      for(const mail of incoming){toast("새 쪽지 · "+mailSubject(mail),person(mail.from).name,"message");native.notify("새 쪽지가 도착했습니다",mailSubject(mail));}
      for(const room of state.data.rooms){const before=previous.rooms.find(r=>r.id===room.id),oldIds=new Set((before?.messages||[]).map(m=>m.id));const fresh=room.messages.filter(m=>m.sender!=="me"&&!oldIds.has(m.id));if(fresh.length&&!room.muted){toast(room.name,fresh.at(-1).text,"message");native.notify(room.name,fresh.at(-1).text);}}
    }
    render();
    for(const draft of drafts)$$(`[data-chat-input="${draft.room}"]`).forEach(el=>{el.value=draft.value;el.closest("form").querySelector("button[type=submit]").disabled=!draft.value.trim();});
    if(focusRoom)$(`[data-chat-input="${focusRoom}"]`)?.focus();
    if($("#org-tree"))$("#org-tree").scrollTop=orgScroll;
    if($("#main-content"))$("#main-content").scrollTop=currentScroll;
  }
  function changePasswordModal(required=false) {
    openModal(required?"임시 비밀번호 변경":"비밀번호 변경", `<form id="password-form" class="event-form"><p class="muted">${required?"처음 로그인할 때는 임시 비밀번호를 변경해 주세요.":"새 비밀번호는 10자 이상이어야 합니다."}</p><label>현재 비밀번호<input class="input" id="current-password" type="password" autocomplete="current-password" required></label><label>새 비밀번호<input class="input" id="new-password" type="password" autocomplete="new-password" minlength="10" maxlength="128" required></label><label>새 비밀번호 확인<input class="input" id="confirm-password" type="password" autocomplete="new-password" required></label><div id="password-error" class="form-error" role="alert"></div></form>`, '<button class="btn btn-primary" type="submit" form="password-form">비밀번호 변경</button>');
    $("#password-form").onsubmit=async e=>{e.preventDefault();if($("#new-password").value!==$("#confirm-password").value){$("#password-error").textContent="새 비밀번호가 일치하지 않습니다.";return;}try{await network.changePassword($("#current-password").value,$("#new-password").value);closeModal();toast("비밀번호를 변경했어요");}catch(error){$("#password-error").textContent=error.message;}};
  }
  if(!native)state.data.people=state.data.people.map(p=>{const example=Mock.people.find(person=>person.id===p.id);return {...p,grade:p.grade??example?.grade??"",otherGroup:p.otherGroup??example?.otherGroup??""};});
  function applySettings() {
    document.documentElement.style.setProperty(
      "--org-font",
      state.settings.orgFont + "px",
    );
    document.documentElement.style.setProperty(
      "--mail-font",
      state.settings.mailFont + "px",
    );
    document.documentElement.style.setProperty(
      "--chat-font",
      state.settings.chatFont + "px",
    );
    document.body.classList.toggle(
      "dark",
      state.settings.dark && state.page === "calendar",
    );
  }
  const mailSubject=m=>m.title?.trim()||m.body?.split("\n").find(line=>line.trim())?.slice(0,45)||"제목 없음";
  const person = (id) =>
    (state.profile?.id===id?state.profile:state.data.people.find((p) => p.id === id)) || {
      id,
      name: id === "me" ? state.user || "교사A" : "교직원",
      department: "교무기획부",
      status: "online",
    };
  const avatar = (p, size = "", i = 0) =>
    `<span class="avatar ${["", "blue", "peach", "purple"][i % 4]} ${size}" aria-hidden="true">${esc(p.name.slice(0, 1))}<i class="status ${p.status || "online"}"></i></span>`;
  const toast = (title, body = "", type = "message") =>
    Notify.create({ title, bodyHtml: esc(body), type });
  const unreadMails = () =>
    state.data.mails.filter((m) => m.folder === "inbox" && m.unread).length;
  const unreadChats = () => state.data.rooms.reduce((n, r) => n + r.unread, 0);
  function login() {
    document.body.classList.remove("dark");
    $("#app").innerHTML =
      `<main class="login-page"><section class="login-story"><div class="brand"><span class="brand-symbol"><i></i><i></i></span>이음</div><div><div class="eyebrow">A LITTLE SPACE, A BETTER SCHOOL</div><h1>선생님의 하루가<br><span>조금 더 가벼워지도록.</span></h1><p>오가는 이야기, 함께하는 일정.<br>우리 학교의 모든 연결을 한곳에 담았어요.</p><div class="art" aria-hidden="true"><div class="art-lines"></div><div class="art-card"><span class="chip">함께하는 이야기</span><b>회의 자료, 확인했어요.</b><p>작은 대화가 모여 더 좋은 학교가 됩니다.</p></div><div class="art-card second"><span class="eyebrow">TODAY'S MOMENT</span><b>15:00 · 교과협의회</b><p>도서관에서 만나요.</p></div></div></div><div class="story-bottom"><span>학교를 잇는 작은 공간, 이음</span><span>TEACH · CONNECT · GROW</span></div></section><section class="login-area"><form id="login-form" class="login-form"><div class="eyebrow">WELCOME TO IEUM</div><h2>반가워요, 선생님.</h2><p>오늘도 함께 만들어 갈 학교의 하루를 시작해요.</p><label for="login-name">이름</label><input id="login-name" class="input" autocomplete="username" placeholder="선생님의 이름을 입력해 주세요" required maxlength="30"><label for="login-password">비밀번호</label><input id="login-password" type="password" class="input" autocomplete="current-password" placeholder="예시 화면에서는 입력하지 않아도 돼요"><div style="display:flex;align-items:center;gap:7px;margin-top:15px;font-size:11px;color:var(--muted)"><input type="checkbox" id="remember-login" ${state.settings.autoLogin ? "checked" : ""}><label for="remember-login" style="margin:0;font-weight:400">다음에도 바로 들어오기 (이 브라우저)</label></div><div id="login-error" class="login-error" role="alert"></div><button class="btn btn-primary" type="submit">이음 시작하기 ${icon("arrow", 17)}</button>${button("demo-login", "먼저 둘러보기", "users", "demo-btn")}<p class="login-note">교직원용 화면 체험 버전입니다.<br>실제 계정으로 로그인하거나 메시지를 전송하지 않습니다.<br>비밀번호는 저장하지 않습니다.</p></form></section></main>`;
    document.body.classList.add("compact-mode");
    document.body.classList.toggle("installed",!!windowApi);
    $("#app").innerHTML='<div class="desktop-frame no-today"><div class="shell">'+$("#app").innerHTML+'</div></div>';
    $(".login-form").insertAdjacentHTML("afterbegin",'<div class="brand login-brand"><span class="brand-symbol"><i></i><i></i></span>이음</div>');
    if(native){
      windowApi?.toggleToday(false);
      $("label[for=login-name]").textContent="교직원 아이디";
      $("#login-name").placeholder="관리자가 발급한 아이디";
      $("#login-password").placeholder="비밀번호";$("#login-password").required=true;
      $("[data-action=demo-login]").remove();
      $("#remember-login").closest("div").remove();
      $(".login-note").textContent="서버 관리자가 발급한 계정으로 로그인하세요. 비밀번호는 클라이언트에 저장하지 않습니다.";
      $("#login-form").insertAdjacentHTML("afterbegin",`<div class="connection-row"><span>${esc(network?.connection?.schoolName||"서버 연결 파일이 필요합니다")}</span>${button("import-server","서버 연결","link")}</div>`);
    }
  }

    
  function render() {
    if (!native) save();
    applySettings();
    document.body.classList.toggle("installed",!!windowApi);
    if(!state.user){login();return;}
    if(requestedCompose){
      document.body.classList.add("compose-window");document.body.classList.remove("compact-mode");
      $("#app").innerHTML='<div class="compose-window-background"></div>';
      if(!composeStarted){composeStarted=true;Promise.resolve(windowApi?.composeDraft?.()||{}).then(draft=>composeMail(draft));}
      return;
    }
    if(requestedToday){document.body.classList.add('today-panel-window');$("#app").innerHTML=compactAgenda();return;}
    const workspace=!!requestedWorkspace||!!requestedChat||!["people","chat"].includes(state.page);
    document.body.classList.toggle("compact-mode",!workspace);
    const labels={people:"교직원",chat:"대화",inbox:"쪽지함",calendar:"내 캘린더",announcements:"학교 소식",links:"바로가기"};
    const nav=[["inbox","mail","쪽지함"],["chat","chat","대화"],["calendar","calendar","내 캘린더"],["school-work","checklist","교무업무"],["announcements","notice","학교소식"],["links","link","바로가기"]];
    const controls=`<div class="compact-window-controls">${windowApi?ib("window-minimize","최소화","left")+ib("window-close","닫기","x"):workspace?ib("back-main","메신저 본창으로","x"):""}</div>`;
    const header=`<header class="compact-header">${avatar({name:state.user,status:"online"})}<div class="compact-profile"><button class="btn-quiet" data-action="back-main" title="조직도로 돌아가기" style="padding:0;text-align:left"><strong>${esc(state.data.schoolName||"○○고등학교")}</strong></button><small>${esc(state.user)} · ${esc(state.profile?.department||"교무기획부")}</small></div><button class="icon-btn" data-action="nav-inbox" aria-label="쪽지함">${icon("mail",20)}${unreadMails()?`<span class="badge">${unreadMails()}</span>`:""}</button>${ib("nav-chat","대화 목록","chat")}${controls}</header>`;
    const rail=`<nav class="rail" aria-label="주 메뉴">${nav.map(([p,i,l])=>`<button class="nav-item ${state.page===p?"active":""}" data-action="nav-${p}" ${state.page===p?'aria-current="page"':''}>${icon(i,23)}<span>${l}</span>${p==="chat"&&unreadChats()?`<b class="badge">${unreadChats()}</b>`:p==="inbox"&&unreadMails()?`<b class="badge">${unreadMails()}</b>`:""}</button>`).join("")}<div class="rail-bottom">${ib("settings","설정","settings")}${ib("logout","로그아웃","logout")}<button class="nav-item" data-action="toggle-today" aria-pressed="${state.showToday}">${icon("calendar",20)}<span>오늘 일정</span></button></div></nav>`;
    const status=`<footer class="connection-status" id="connection-status"><span>${esc(connectionStatus)}</span><span>${native?"교내 서버":"화면 체험"}</span></footer>`;
    $("#app").innerHTML=workspace?`<div class="workspace-frame ${requestedChat?'chat-only':''}"><div class="shell"><div class="workspace"><header class="topbar"><strong>${esc(labels[state.page]||"대화")} · 이음</strong><div class="top-actions">${!windowApi?button("back-main","본창으로","left"):""}${windowApi?ib("window-minimize","최소화","left")+ib("window-maximize","최대화","popout")+ib("window-close","닫기","x"):""}</div></header><main class="page" id="main-content"></main>${status}</div></div></div>`:`<div class="desktop-frame no-today"><div class="shell">${header}<div class="compact-body">${rail}<div class="workspace"><main class="page" id="main-content"></main>${status}</div></div></div>${!windowApi?`<div class="today-drawer ${state.settings.calendarPosition==='right'?'right':'left'} ${state.showToday?'open':''}">${compactAgenda()}</div>`:''}</div>`;
    renderPage();renderFloating();
    if(params.get("eventDraft")==="1"&&!eventWindowStarted){eventWindowStarted=true;windowApi.composeDraft().then(draft=>eventForm(draft));}

  }
  function compactAgendaList() {
    const events=state.data.events.filter(e=>e.date===state.today).sort((a,b)=>a.start.localeCompare(b.start));
    const deadlines=state.data.deadlines.filter(d=>d.date===state.today).sort((a,b)=>(a.dueTime||"24:00").localeCompare(b.dueTime||"24:00"));
    const notes=state.data.notes.filter(n=>n.date===state.today).sort((a,b)=>a.time.localeCompare(b.time));
    return `<aside class="compact-today agenda-list-panel" aria-label="오늘 일정 목록"><header class="agenda-header"><div><h2>${ib("today-prev","이전 날짜","left")}${fmtDate(state.today,{month:"long",day:"numeric",weekday:"short"})}${ib("today-next","다음 날짜","right")}</h2><small>오늘의 일정 · 목록</small></div>${button("add-event","일정 추가","plus")}</header><div class="agenda-list" role="list">${deadlines.map(d=>`<div class="agenda-list-row ${d.done?"done":""}" role="listitem"><input type="checkbox" data-deadline="${d.id}" aria-label="${esc(d.title)} 완료" ${d.done?"checked":""}><button data-action="deadline-detail" data-deadline="${d.id}"><span class="agenda-list-time">${d.dueTime?esc(d.dueTime)+"까지":"오늘 마감"}</span><strong>${esc(d.title)}</strong><small>제출 마감${d.done?" · 완료":""}</small></button></div>`).join("")}${events.map(e=>`<div class="agenda-list-row" role="listitem"><button data-action="view-event" data-event="${e.id}"><span class="agenda-list-time">${esc(e.start)}–${esc(e.end)}</span><strong>${esc(e.title)}</strong><small>${esc(e.place || typeLabel(e.type))}</small></button></div>`).join("")}${notes.map(n=>`<div class="agenda-list-row" role="listitem"><button data-action="view-note" data-note="${n.id}"><span class="agenda-list-time">${esc(n.time)}</span><strong>${esc(n.text)}</strong><small>메모</small></button></div>`).join("")}${!events.length&&!deadlines.length&&!notes.length?'<p class="agenda-list-empty">이날 등록된 일정이 없어요.</p>':""}</div></aside>`;
  }
  function compactAgenda() {
    const events=state.data.events.filter(e=>e.date===state.today).sort((a,b)=>a.start.localeCompare(b.start));
    const now=new Date(),position=(now.getHours()*60+now.getMinutes()-480)*56/60;
    return `<aside class="compact-today"><header class="agenda-header"><div><h2>${ib("today-prev","이전 날짜","left")}${fmtDate(state.today,{month:"long",day:"numeric",weekday:"short"})}${ib("today-next","다음 날짜","right")}</h2><small>오늘의 일정</small></div>${ib("toggle-today","오늘 일정 닫기","x")}</header><section class="agenda-deadlines"><h3>제출 마감</h3>${state.data.deadlines.length?state.data.deadlines.map(d=>{const diff=Math.round((parseDate(d.date)-parseDate(Mock.today))/86400000);return `<label class="task-row"><input type="checkbox" data-deadline="${d.id}" ${d.done?'checked':''}><span class="${d.done?'done':''}">${esc(d.title)}${d.dueTime ? `<small> · ${esc(d.dueTime)}까지</small>` : ""}</span><span class="due">${d.done?'완료':diff<0?'기한 지남':diff===0?'D-Day':'D-'+diff}</span></label>`}).join(""):'<p class="muted">등록된 제출 마감이 없어요.</p>'}</section><section class="agenda-body"><h3>내 일정 ${events.length?'· '+events.length:''}</h3><div class="agenda-timeline"><div class="agenda-hours">${Array.from({length:10},(_,i)=>`<div class="agenda-hour">${String(i+8).padStart(2,'0')}</div>`).join("")}</div><div class="agenda-grid" data-calendar-timeline="${state.today}" aria-label="오늘 일정 시간대 드래그 선택">${events.map((e,i)=>{const overlapping=events.filter(o=>minutes(o.start)<minutes(e.end)&&minutes(o.end)>minutes(e.start));const n=overlapping.length,slot=overlapping.indexOf(e);return `<button class="event ${e.type}" data-action="view-event" data-event="${e.id}" style="top:${(minutes(e.start)-480)*56/60}px;height:${Math.max(28,(minutes(e.end)-minutes(e.start))*56/60)}px;left:calc(${slot*100/n}% + 4px);width:calc(${100/n}% - 8px);right:auto"><strong>${esc(e.title)}</strong><small>${e.start}–${e.end}</small><small>${esc(e.place)}</small></button>`}).join("")}${state.today===Mock.today&&position>=0&&position<=560?`<div class="now-line" style="top:${position}px"></div>`:""}</div></div>${state.data.notes.filter(n=>n.date===state.today).map(n=>`<button class="agenda-note" data-action="view-note" data-note="${n.id}">${esc(n.time)} · ${esc(n.text)}</button>`).join("")}</section><footer class="agenda-footer">${state.today!==Mock.today?button("today-reset","오늘로","calendar"):button("checklist","내 체크리스트","checklist")}</footer></aside>`;
  }
  function heading(eyebrow, title, desc, actions = "") {
    return `<div class="page-heading"><div><div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><p>${esc(desc)}</p></div><div class="heading-actions">${actions}</div></div>`;
  }
  function renderPage() {
    const fn = {
      people: peoplePage,
      chat: chatPage,
      inbox: inboxPage,
      calendar: calendarPage,
      announcements: announcementsPage,
      links: linksPage,
    }[state.page];
    $("#main-content").innerHTML = fn();
    if (state.page === "chat") scrollMessages($("#main-content"));
    if (state.page === "inbox") initMailResize();
  }
  function peoplePage() {
    return (
      heading(
        "OUR SCHOOL, OUR PEOPLE",
        "함께하는 선생님들",
        "필요한 순간, 가까이 있는 동료와 이야기를 나눠요.",
        button(
          "toggle-today",
          state.showToday ? "오늘 일정 접기" : "오늘 일정 보기",
          "calendar",
        ) + button("compose-mail", "쪽지 쓰기", "plus", "btn-primary"),
      ) +
      `<div class="people-layout"><section class="panel people-panel"><div class="panel-head"><h2>${icon("users", 18)}교직원 조직도 <small>${state.data.people.length}명</small></h2><span class="stat-line"><i class="status online"></i>${state.data.people.filter((p) => p.status === "online").length}명 온라인</span></div><div class="search">${icon("search", 17)}<input class="input" id="people-search" aria-label="교직원 검색" placeholder="이름, 부서, 교과, 학년, 기타 그룹 검색" value="${esc(state.search)}"></div><div class="segmented" aria-label="조직도 분류">${[
        ["department", "부서별"],
        ["subject", "교과별"],
        ["grade", "학년별"],
        ["otherGroup", "기타"],
      ]
        .map(
          ([g, l]) =>
            `<button class="${state.group === g ? "active" : ""}" data-action="group" data-group="${g}" aria-pressed="${state.group === g}">${l}</button>`,
        )
        .join(
          "",
        )}</div><div class="school-tools"><small class="muted">v0.2.12</small></div><div class="people-summary"><label class="select-label"><input id="select-all" type="checkbox" ${state.selected.size === state.data.people.length ? "checked" : ""}>전체 선택</label><span id="selected-count">${state.selected.size ? state.selected.size + "명 선택" : "이름을 더블클릭해 쪽지를 보내세요"}</span></div><div class="org-tree" id="org-tree">${orgTree()}</div></section><aside class="side-stack">${todayPanel()}${taskPanel()}<div class="quiet-card">${icon("leaf", 28)}<div><strong style="font-size:12px">오늘도, 서로에게 든든한 동료.</strong><p>작은 인사가 하루를 바꿔요.</p></div></div><div class="welcome-strip">TEACH · CONNECT · GROW</div></aside></div>`
    );
  }
  const groupLabel=p=>String(p[state.group]||"").trim()||({grade:"학년 미지정",otherGroup:"기타 미지정"}[state.group]||"미지정");
  const matchesPersonSearch=p=>[p.name,p.department,p.subject,p.extension,p.grade,p.otherGroup].filter(v=>v!=null).join(" ").toLowerCase().includes(state.search.toLowerCase());
  function orgTree() {
    const filtered = state.data.people.filter(matchesPersonSearch);
    const groups = [...new Set(filtered.map(groupLabel))];
    if (!groups.length)
      return empty(
        "검색 결과가 없어요",
        "다른 이름이나 부서로 검색해 보세요.",
        "search",
      );
    return groups
      .map((g, gi) => {
        const people = filtered.filter((p) => groupLabel(p) === g),
          closed = state.collapsed.has(state.group+":"+g) && !state.search;
        return `<section><div class="dept-head"><input type="checkbox" data-dept-select="${esc(g)}" aria-label="${esc(g)} 전체 선택" ${people.every((p) => state.selected.has(p.id)) ? "checked" : ""}><button class="dept-toggle" data-action="dept-toggle" data-dept="${esc(g)}" aria-expanded="${!closed}">${icon(closed ? "right" : "down", 13)}${esc(g)}<small>${people.length}</small></button></div>${!closed ? `<div class="org-members" role="group" aria-label="${esc(g)} 소속 교직원">${people.map((p, i) => personRow(p, gi + i)).join("")}</div>` : ""}</section>`;
      })
      .join("");
  }
  function personRow(p) {
    const presence=p.status==='online'?'online':['away','busy'].includes(p.status)?'away':'offline';
    const label={online:'접속 중',away:'부재 중',offline:'미접속 중'}[presence];
    const mark={online:'M4 8l2.5 2.5L12 5',away:'M8 4v4l2 1.5',offline:'M5 5l6 6 M11 5l-6 6'}[presence];
    const organization=p.department||'조직 미지정',extension=p.extension||'미등록';
    return `<div class="person" data-person="${p.id}"><input type="checkbox" aria-label="${esc(p.name)} 선택" data-person-check="${p.id}" ${state.selected.has(p.id) ? "checked" : ""}><span class="person-presence ${presence}" role="img" aria-label="${label}" title="${label}"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><path d="${mark}"/></svg></span><div class="person-main"><button class="btn-quiet person-line" data-action="person-select" data-person="${p.id}" title="${esc(p.name)} · ${esc(organization)} · 내선 ${esc(extension)} · ${label}"><strong>${esc(p.name)}</strong><span class="person-organization">${esc(organization)}</span><span class="person-extension">내선 ${esc(extension)}</span></button></div></div>`;
  }
  function statusLabel(s) {
    return (
      { online: "온라인", away: "자리비움", busy: "바쁨", offline: "오프라인" }[
        s
      ] || "온라인"
    );
  }
  function todayPanel() {
    const events = state.data.events
      .filter((e) => e.date === state.today)
      .sort((a, b) => a.start.localeCompare(b.start));
    return `<section class="today-hero"><div class="today-date"><div class="eyebrow">A DAY AT A GLANCE</div><div>${ib("today-prev", "이전 날짜", "left")}${ib("today-next", "다음 날짜", "right")}</div></div><h2>${fmtDate(state.today, { month: "long", day: "numeric" })}<span style="font-size:12px;font-weight:400;margin-left:8px">${fmtDate(state.today, { weekday: "long" })}</span></h2><p>${state.today === Mock.today ? "오늘의 작은 계획, 여유 있는 하루." : "이날의 일정을 미리 살펴보세요."}</p>${state.today !== Mock.today ? button("today-reset", "오늘로", "", "btn-quiet") : ""}${icon("leaf", 65).replace("<svg", '<svg class="leaf"')}</section><section class="panel"><div class="panel-head"><h2>오늘의 일정 <small>${events.length}</small></h2>${ib("add-event", "일정 추가", "plus")}</div>${state.data.academic
      .filter((a) => a.date === state.today)
      .map(
        (a) =>
          `<div class="academic-label">${icon("calendar", 14)}${esc(a.title)}</div>`,
      )
      .join(
        "",
      )}<div class="timeline">${events.length ? events.map((e) => `<div class="timeline-item"><time class="timeline-time">${e.start}</time><div class="timeline-card ${e.type}"><button class="btn-quiet" style="padding:0;border:0;text-align:left;color:inherit" data-action="view-event" data-event="${e.id}"><strong>${esc(e.title)}</strong><small>${esc(e.place || "장소 미정")} · ${e.start}–${e.end}</small></button><span class="chip ${e.type === "personal" ? "" : e.type === "repeat" ? "orange" : "blue"}">${typeLabel(e.type)}</span>${e.note ? `<button class="note-pin" data-action="event-note" data-event="${e.id}" aria-label="일정 메모 보기" title="${esc(e.note)}">${icon("note", 15)}</button>` : ""}</div></div>`).join("") : `<div class="empty" style="padding:24px 5px">${icon("sun", 26)}<p>등록된 일정이 없어요.<br>여유로운 하루를 계획해 보세요.</p></div>`}${state.data.notes
      .filter((n) => n.date === state.today)
      .map(
        (n) =>
          `<div class="chip" style="margin-top:7px">${icon("note", 12)}${esc(n.time)} ${esc(n.text)}</div>`,
      )
      .join(
        "",
      )}</div>${button("nav-calendar", "전체 일정 보기", "arrow", "panel-foot")}</section>`;
  }
  function typeLabel(t) {
    return (
      {
        personal: "개인 일정",
        group: "단체 일정",
        repeat: "정기 업무",
        makeup: "보강 안내",
        lessonChange:"수업 변경 안내",
        note: "메모",
        deadline: "제출 마감",
      }[t] || t
    );
  }
  function taskPanel() {
    return `<section class="panel"><div class="panel-head"><h2>놓치지 말아야 할 일</h2><small>${state.data.deadlines.filter((d) => !d.done).length}</small></div><div class="task-list">${state.data.deadlines
      .map((d) => {
        const diff = Math.round(
          (parseDate(d.date) - parseDate(Mock.today)) / 86400000,
        );
        return `<label class="task-row"><input type="checkbox" data-deadline="${d.id}" ${d.done ? "checked" : ""}><span class="${d.done ? "done" : ""}">${esc(d.title)}${d.dueTime ? `<small> · ${esc(d.dueTime)}까지</small>` : ""}</span><span class="due">${d.done ? "완료" : diff < 0 ? "기한 지남" : diff === 0 ? "오늘 마감" : "D-" + diff}</span></label>`;
      })
      .join(
        "",
      )}</div>${button("checklist", "내 체크리스트", "checklist", "panel-foot")}</section>`;
  }
  function empty(title, body, name = "chat") {
    return `<div class="empty">${icon(name, 35)}<h3>${esc(title)}</h3><p>${esc(body)}</p></div>`;
  }
  function chatPage() {
    const rooms = state.data.rooms
      .slice()
      .sort((a, b) => Number(b.pinned) - Number(a.pinned));
    let r = state.data.rooms.find((r) => r.id === state.room);
    if (!r && rooms.length) {
      state.room = rooms[0].id;
      r = rooms[0];
    }
    return (
      heading(
        "CONVERSATIONS THAT CONNECT",
        "우리의 이야기",
        "짧은 질문부터 함께하는 고민까지, 편하게 나눠요.",
        button("new-chat", "새 대화", "plus", "btn-primary"),
      ) +
      `<div class="chat-layout ${state.mobileList ? "mobile-list" : ""}"><section class="panel room-panel"><div class="panel-head"><h2>대화 목록 <small>${rooms.length}</small></h2>${ib("new-chat", "새 대화", "plus")}</div><div class="search">${icon("search", 17)}<input class="input" id="room-search" aria-label="대화방 검색" placeholder="대화방 검색"></div><div class="room-list">${rooms.map((room) => roomRow(room)).join("") || empty("아직 대화가 없어요", "새 대화를 시작해 보세요.")}</div></section><section class="panel conversation" id="main-conversation">${r ? conversationHTML(r) : empty("대화를 시작해 보세요", "선생님들을 초대해 이야기를 나눠요.")}</section></div>`
    );
  }
  function roomRow(r) {
    const last = r.messages.at(-1);
    return `<button class="room ${r.id === state.room ? "active" : ""}" data-action="open-room" data-room="${r.id}">${avatar({ name: r.name, status: "online" }, "large", Number(r.id.replace(/\D/g, "")) || 0)}<div class="room-info"><strong>${esc(r.name)} ${r.pinned ? `<span class="pinned">${icon("star", 12)}</span>` : ""} ${r.muted ? icon("mute", 12) : ""}</strong><p>${esc(last?.text || "새로운 대화를 시작해 보세요.")}</p></div><div class="room-meta">${last?.time || ""}${r.unread ? `<br><span class="badge">${r.unread}</span>` : ""}</div></button>`;
  }
  function conversationHTML(r, floating = false) {
    return `<div class="conversation-header" ${floating ? 'data-drag="chat"' : ""}>${!floating ? ib("chat-back", "대화 목록", "left", 'class="icon-btn mobile-back"') : ""}${avatar({ name: r.name, status: "online" })}<div class="conversation-title"><strong>${esc(r.name)}</strong><small>${r.members.length + 1}명 참여 · ${r.muted ? "알림 꺼짐" : "편안하게 이야기를 나눠요"}</small></div><div class="conversation-tools">${ib("chat-search", "대화 검색", "search", `data-room="${r.id}"`)}${ib("chat-members", "참여자 보기", "users", `data-room="${r.id}"`)}${!floating ? ib("pop-chat", "대화창 따로 열기", "popout", `data-room="${r.id}"`) : ib("close-chat", "대화창 닫기", "x")}</div></div>${r.notice ? `<div class="notice-strip">${icon("notice", 14)}${esc(r.notice)}</div>` : ""}<div class="chat-search" ${!state.chatSearch ? "hidden" : ""}>${icon("search", 16)}<input class="input" data-chat-search="${r.id}" aria-label="대화 내용 검색" placeholder="대화 내용 찾기" value="${esc(state.chatQuery)}"><small class="search-count">${searchCount(r)}개 결과</small></div><div class="messages" data-message-room="${r.id}" role="log" aria-label="대화 내용">${messagesHTML(r)}</div><form class="chat-compose" data-chat-form="${r.id}"><div class="reply-preview" ${!state.reply || state.reply.room !== r.id ? "hidden" : ""}><span>답장 · ${esc(state.reply?.text?.slice(0, 55) || "")}</span>${ib("cancel-reply", "답장 취소", "x")}</div><div class="chat-input-row"><textarea class="input" data-chat-input="${r.id}" aria-label="메시지 입력" placeholder="따뜻한 한마디를 건네 보세요." rows="1" maxlength="5000"></textarea><button class="btn btn-primary" type="submit" aria-label="메시지 보내기" disabled>${icon("send", 18)}</button></div><div class="compose-hint"><span>Enter 전송 · Shift + Enter 줄바꿈</span><span>${native ? "교내 서버 연결" : "이 대화는 예시 화면입니다"}</span></div></form>${state.members ? membersHTML(r) : ""}`;
  }
  function searchCount(r) {
    return state.chatQuery
      ? r.messages.filter((m) =>
          m.text.toLowerCase().includes(state.chatQuery.toLowerCase()),
        ).length
      : 0;
  }
  function highlight(text) {
    if (!state.chatQuery) return esc(text);
    const needle = state.chatQuery.toLowerCase(),
      lower = text.toLowerCase();
    let result = "",
      index = 0,
      pos;
    while ((pos = lower.indexOf(needle, index)) !== -1) {
      result +=
        esc(text.slice(index, pos)) +
        "<mark>" +
        esc(text.slice(pos, pos + needle.length)) +
        "</mark>";
      index = pos + needle.length;
    }
    return result + esc(text.slice(index));
  }
  function messagesHTML(r) {
    let last = "";
    return r.messages
      .map((m) => {
        let divider = "";
        if (m.date !== last) {
          last = m.date;
          divider = `<div class="date-divider">${fmtDate(m.date, { year: "numeric", month: "long", day: "numeric", weekday: "short" })}</div>`;
        }
        const mine = m.sender === "me",
          p = person(m.sender);
        return (
          divider +
          `<article class="message ${mine ? "mine" : ""}" data-message="${m.id}">${!mine ? avatar(p, "small", r.members.indexOf(p.id)) : ""}<div class="message-body">${!mine ? `<div class="message-name">${esc(p.name)}</div>` : ""}<div class="bubble-wrap"><div class="bubble">${m.reply ? `<div class="reply-quote">${esc(m.reply)}</div>` : ""}${highlight(m.text)}</div><span class="bubble-meta">${mine ? "<b>1</b>" : ""}${m.time}</span></div>${m.likes ? `<button class="reaction ${m.liked ? "liked" : ""}" data-action="like-message" data-message="${m.id}" data-room="${r.id}" aria-pressed="${m.liked}">${icon("heart", 11)} ${m.likes}</button>` : ""}<div class="msg-actions">${button("reply-message", "답장", "reply", "btn-quiet", `data-message="${m.id}" data-room="${r.id}"`)}${button("like-message", "공감", "heart", "btn-quiet", `data-message="${m.id}" data-room="${r.id}"`)}</div></div></article>`
        );
      })
      .join("");
  }
  function membersHTML(r) {
    return `<aside class="members-drawer"><div class="panel-head"><h2>함께하는 선생님들</h2>${ib("chat-members", "참여자 닫기", "x", `data-room="${r.id}"`)}</div><div class="person">${avatar({ name: state.user, status: "online" })}<div><strong>${esc(state.user)}</strong><small class="muted" style="display:block">나</small></div></div>${r.members
      .map((id, i) => {
        const p = person(id);
        return `<div class="person">${avatar(p, "", i)}<div><strong style="font-size:12px">${esc(p.name)}</strong><small class="muted" style="display:block">${esc(p.department)}</small></div></div>`;
      })
      .join("")}</aside>`;
  }
  function scrollMessages(root) {
    $$(".messages", root).forEach((el) => {
      el.scrollTop = el.scrollHeight;
    });
  }
  function renderFloating() {
    const root = $("#floating");
    if (!state.floating) {
      root.innerHTML = "";
      return;
    }
    const r = state.data.rooms.find((r) => r.id === state.floating);
    if (!r) {
      state.floating = null;
      root.innerHTML = "";
      return;
    }
    const old = $(".floating-chat");
    const pos = old
      ? {
          left: old.style.left,
          top: old.style.top,
          width: old.style.width,
          height: old.style.height,
        }
      : null;
    root.innerHTML = `<section class="floating-chat conversation" aria-label="별도 대화창">${conversationHTML(r, true)}</section>`;
    const panel = $(".floating-chat");
    if (pos) Object.assign(panel.style, pos);
    initChatDrag(panel);
    scrollMessages(root);
  }
  function updateChat(rid) {
    const r = state.data.rooms.find((r) => r.id === rid);
    if (!r) return;
    $$(`[data-message-room="${rid}"]`).forEach((el) => {
      const bottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
      el.innerHTML = messagesHTML(r);
      if (bottom) el.scrollTop = el.scrollHeight;
    });
    $$(".search-count").forEach(
      (el) => (el.textContent = searchCount(r) + "개 결과"),
    );
  }
  function initChatDrag(panel) {
    const handle = $("[data-drag]", panel);
    handle.addEventListener("pointerdown", (e) => {
      if (e.target.closest("button") || innerWidth < 600) return;
      const rect = panel.getBoundingClientRect(),
        dx = e.clientX - rect.left,
        dy = e.clientY - rect.top;
      handle.setPointerCapture(e.pointerId);
      panel.style.right = "auto";
      panel.style.left = rect.left + "px";
      panel.style.top = rect.top + "px";
      const move = (ev) => {
        panel.style.left =
          Math.max(
            0,
            Math.min(innerWidth - panel.offsetWidth, ev.clientX - dx),
          ) + "px";
        panel.style.top =
          Math.max(0, Math.min(innerHeight - 55, ev.clientY - dy)) + "px";
      };
      const end = () => {
        handle.removeEventListener("pointermove", move);
        handle.removeEventListener("pointerup", end);
        handle.removeEventListener("pointercancel", end);
      };
      handle.addEventListener("pointermove", move);
      handle.addEventListener("pointerup", end);
      handle.addEventListener("pointercancel", end);
    });
  }
  const mailColumns = [
    { key: "from", label: "보낸 사람", width: 38 },
    { key: "title", label: "내용", width: 44 },
    { key: "date", label: "받은 날짜", width: 18 },
  ];
  function filteredMails() {
    return state.data.mails
      .filter((m) =>
        state.folder === "important"
          ? m.important && m.folder !== "trash"
          : state.folder === "unread"
            ? m.unread && m.folder === "inbox"
            : m.folder === state.folder,
      )
      .filter((m) =>
        (m.title + m.body + person(m.from).name)
          .toLowerCase()
          .includes(state.mailSearch.toLowerCase()),
      );
  }
  function inboxPage() {
    const mails = filteredMails();
    const current = mails.find((m) => m.id === state.mail);
    return (
      heading(
        "NOTES WORTH KEEPING",
        "차곡차곡, 쪽지함",
        "중요한 안내와 자료를 놓치지 않고 모아두세요.",
        button("compose-mail", "새 쪽지 쓰기", "plus", "btn-primary"),
      ) +
      `<div class="inbox-layout"><aside class="panel folder-panel">${[
        [
          "inbox",
          "mail",
          "받은 쪽지함",
          state.data.mails.filter((m) => m.folder === "inbox").length,
        ],
        [
          "sent",
          "send",
          "보낸 쪽지함",
          state.data.mails.filter((m) => m.folder === "sent").length,
        ],
        [
          "important",
          "star",
          "중요 쪽지",
          state.data.mails.filter((m) => m.important && m.folder !== "trash")
            .length,
        ],
        ["unread", "bell", "안 읽은 쪽지", unreadMails()],
        [
          "trash",
          "trash",
          "휴지통",
          state.data.mails.filter((m) => m.folder === "trash").length,
        ],
      ]
        .map(
          ([f, i, l, c]) =>
            `<button class="folder ${state.folder === f ? "active" : ""}" data-action="mail-folder" data-folder="${f}">${icon(i, 16)}<span>${l}</span><span>${c}</span></button>`,
        )
        .join(
          "",
        )}<div class="folder-divider"></div><div class="muted" style="font-size:10px;padding:12px;line-height:1.9">${native ? "교내 서버가 쪽지를 저장하고<br>받는 선생님께 전달합니다." : "전송한 쪽지는 체험 데이터입니다.<br>실제 수신자에게 전달되지 않아요."}</div></aside><section class="panel mail-workspace ${current ? "show-detail" : ""}"><div class="mail-list-panel"><div class="search">${icon("search", 17)}<input class="input" id="mail-search" placeholder="쪽지 내용, 보낸 사람 검색" aria-label="쪽지 검색" value="${esc(state.mailSearch)}"></div><div class="mail-list" id="mail-list">${mailListHTML()}</div></div><div class="mail-resizer" role="separator" tabindex="0" aria-label="목록 너비 조절" aria-orientation="vertical"></div><article class="mail-detail" id="mail-detail">${current ? mailDetail(current) : empty("한 장의 쪽지, 하나의 연결", "목록에서 쪽지를 선택해 내용을 확인하세요.", "mail")}</article></section></div>`
    );
  }
  function mailListHTML() {
    const mails = filteredMails();
    return `<div class="mail-list-header">${mailColumns.map((c) => `<span class="mail-column" draggable="true" data-column="${c.key}" style="width:${c.width}%">${state.folder === "sent" && c.key === "from" ? "수신 확인" : c.label}<i class="column-grip" data-column-resize="${c.key}"></i></span>`).join("")}</div>${mails.length ? mails.map((m) => `<div class="mail-row ${m.unread ? "unread" : ""} ${m.id === state.mail ? "active" : ""}" data-action="open-mail" data-mail="${m.id}" role="button" tabindex="0" aria-label="${esc(mailSubject(m))}"><div class="mail-row-top">${mailColumns.map((c) => `<span class="mail-data-column" style="width:${c.width}%">${c.key === "from" ? `<button class="star-button ${m.important ? "on" : ""}" data-action="star-mail" data-mail="${m.id}" aria-label="${m.important ? "중요 표시 해제" : "중요 표시"}" aria-pressed="${m.important}">${icon("star", 13)}</button><span>${state.folder === "sent" ? (m.receipts.every((r) => r === "recalled") ? "회수됨" : m.receipts.filter((r) => r === "read").length + "/" + m.to.length + " 읽음") : esc(person(m.from).name)}</span>` : c.key === "title" ? esc(mailSubject(m)) : `<time>${fmtDate(m.date, { month: "numeric", day: "numeric" })}</time>`}</span>`).join("")}${m.files.length ? icon("clip", 12) : ""}</div><strong class="mail-row-title">${esc(mailSubject(m))}</strong><p>${esc(m.body.slice(0, 50).replace(/\n/g, " "))}</p></div>`).join("") : empty("아직 쪽지가 없어요", "새 쪽지를 쓰거나 다른 폴더를 확인해 보세요.", "mail")}`;
  }
  function safeRichHTML(html) {
    const doc = new DOMParser().parseFromString(String(html), "text/html");
    const allowed = new Set([
      "B",
      "STRONG",
      "I",
      "EM",
      "U",
      "BR",
      "P",
      "DIV",
      "UL",
      "OL",
      "LI",
      "TABLE","THEAD","TBODY","TR","TH","TD",
    ]);
    const walk = (node) => {
      if (node.nodeType === 3) return esc(node.textContent);
      if (node.nodeType !== 1) return "";
      if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "SVG"].includes(node.tagName))
        return "";
      const content = Array.from(node.childNodes).map(walk).join("");
      if(node.tagName==="A"){try{const url=new URL(node.getAttribute("href")||"");if(!["http:","https:"].includes(url.protocol)||url.username||url.password)return content;return `<a href="${esc(url.href)}" target="_blank" rel="noopener noreferrer">${content}</a>`;}catch{return content;}}

      return allowed.has(node.tagName)
        ? "<" +
            node.tagName.toLowerCase() +
            ">" +
            content +
            (node.tagName === "BR"
              ? ""
              : "</" + node.tagName.toLowerCase() + ">")
        : content;
    };
    return Array.from(doc.body.childNodes).map(walk).join("");
  }
  function mailDetail(m) {
    return `<header class="mail-detail-head"><div style="display:flex;justify-content:space-between;align-items:center">${ib("mail-back", "쪽지 목록으로", "left", 'class="icon-btn mobile-back"')}<span class="chip ${m.important ? "orange" : ""}">${m.important ? "중요 쪽지" : "업무 안내"}</span>${ib("print-mail", "쪽지 인쇄", "print")}</div><h2>${esc(mailSubject(m))}</h2><div class="mail-meta">${avatar(person(m.from), "small")}<strong>${esc(person(m.from).name)} 선생님</strong><time class="muted">${fmtDate(m.date, { month: "long", day: "numeric" })} ${m.time}</time></div><div class="mail-recipients"><span>받는 사람</span>${m.to.map((id, i) => `<span class="chip ${m.receipts[i] || "unread"}" title="${{ read: "읽음", unread: "안 읽음", recalled: "회수됨" }[m.receipts[i]] || "안 읽음"}">${esc(person(id).name)} ${m.receipts[i] === "read" ? icon("check", 10) : ""}</span>`).join("")}<small class="muted">${m.to.length}명</small></div>${m.scheduled ? `<small class="muted">${native ? "예약 발송" : "예약 초안"} · ${esc(m.scheduled)} ${native ? "" : "(자동 발송되지 않음)"}</small>` : ""}</header><div class="mail-body">${m.html ? safeRichHTML(m.html) : esc(m.body)}${m.files.map((f, i) => `<div class="attachment">${icon("file", 25)}<div><strong>${esc(f.name)}</strong><br><small>${esc(f.size)}${f.demo ? " · 예시 첨부 파일" : ""}</small></div>${ib("download-file", "첨부 다운로드", "download", `data-mail="${m.id}" data-file="${i}"`)}</div>`).join("")}</div><footer class="mail-detail-foot">${button(m.folder === "trash" ? "restore-mail" : "delete-mail", m.folder === "trash" ? "복원" : "삭제", "trash", "btn-danger", `data-mail="${m.id}"`)}${m.folder === "sent" ? button("recall-mail", "회수", "", "", `data-mail="${m.id}"`) : ""}<span class="spacer"></span>${button("mail-calendar", m.eventId ? "연동된 일정" : "일정으로 등록", "calendar", "", `data-mail="${m.id}"`)}${button("reply-mail", "답장", "reply", "", `data-mail="${m.id}"`)}${button("reply-all", "전체 답장", "", "", `data-mail="${m.id}"`)}${button("forward-mail", "전달", "arrow", "", `data-mail="${m.id}"`)}</footer>`;
  }
  function initMailResize() {
    const divider = $(".mail-resizer");
    if (divider) {
      const resize = (x) => {
        const panel = $(".mail-list-panel"),
          container = $(".mail-workspace"),
          rect = container.getBoundingClientRect();
        panel.style.width =
          Math.max(230, Math.min(rect.width - 250, x - rect.left)) + "px";
      };
      divider.onpointerdown = (e) => {
        divider.setPointerCapture(e.pointerId);
        const move = (ev) => resize(ev.clientX);
        const stop = () => {
          divider.removeEventListener("pointermove", move);
          divider.removeEventListener("pointerup", stop);
          divider.removeEventListener("pointercancel", stop);
        };
        divider.addEventListener("pointermove", move);
        divider.addEventListener("pointerup", stop);
        divider.addEventListener("pointercancel", stop);
      };
      divider.onkeydown = (e) => {
        if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
          e.preventDefault();
          const rect = divider.getBoundingClientRect();
          resize(rect.left + (e.key === "ArrowRight" ? 20 : -20));
        }
      };
    }
    initMailColumns();
  }
  function initMailColumns() {
    $$("[data-column-resize]").forEach(
      (grip) =>
        (grip.onpointerdown = (e) => {
          e.stopPropagation();
          e.preventDefault();
          const key = grip.dataset.columnResize,
            col = mailColumns.find((c) => c.key === key),
            start = e.clientX,
            w = col.width,
            total = $(".mail-list-header").clientWidth;
          grip.setPointerCapture(e.pointerId);
          const move = (ev) => {
            col.width = Math.max(
              12,
              Math.min(70, w + ((ev.clientX - start) / total) * 100),
            );
            grip.parentElement.style.width = col.width + "%";
            const index = mailColumns.findIndex((c) => c.key === key);
            $$(".mail-row-top").forEach((row) => {
              if (row.children[index])
                row.children[index].style.width = col.width + "%";
            });
          };
          const end = () => {
            grip.removeEventListener("pointermove", move);
            grip.removeEventListener("pointerup", end);
          };
          grip.addEventListener("pointermove", move);
          grip.addEventListener("pointerup", end);
        }),
    );
    $$("[data-column]").forEach((col) => {
      col.ondragstart = (e) =>
        e.dataTransfer.setData("text/plain", col.dataset.column);
      col.ondragover = (e) => {
        e.preventDefault();
        col.style.borderLeft = "2px solid var(--green)";
      };
      col.ondragleave = () => (col.style.borderLeft = "");
      col.ondrop = (e) => {
        e.preventDefault();
        const src = mailColumns.findIndex(
            (c) => c.key === e.dataTransfer.getData("text/plain"),
          ),
          dest = mailColumns.findIndex((c) => c.key === col.dataset.column);
        if (src >= 0 && dest >= 0) {
          mailColumns.splice(dest, 0, mailColumns.splice(src, 1)[0]);
          $("#mail-list").innerHTML = mailListHTML();
          initMailColumns();
        }
      };
    });
  }
  let modalPreviousFocus = null,
    modalCleanup = null,
    composeDraft = null,
    eventDraft = null;
  function openModal(title, body, footer = "", cls = "") {
    if (modalCleanup) {
      modalCleanup();
      modalCleanup = null;
    }
    if (!$("#modal-root").firstChild)
      modalPreviousFocus = document.activeElement;
    $("#modal-root").innerHTML =
      `<div class="overlay"><section class="modal ${cls}" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header class="modal-head"><h2 id="modal-title">${esc(title)}</h2>${ib("close-modal", "닫기", "x")}</header><div class="modal-body">${body}</div>${footer ? `<footer class="modal-foot">${footer}</footer>` : ""}</section></div>`;
    requestAnimationFrame(() => {
      const el = $(
        ".modal input:not([type=checkbox]),.modal textarea,.modal button",
      );
      el?.focus();
    });
  }
  function closeModal() {
    if(requestedCompose&&composeDraft&&!mailSending&&windowApi){windowApi?.windowAction("close");return;}
    if (modalCleanup) {
      modalCleanup();
      modalCleanup = null;
    }
    $("#modal-root").innerHTML = "";
    modalPreviousFocus?.focus();
    composeDraft = null;
    eventDraft = null;
  }
  function composeMail({
    to = [],
    title = "",
    body = "",
    files = [],
    forwarded = false,
    richBody = "",
    noticeType = "",
  } = {}) {
    if(windowApi?.openCompose&&!requestedCompose){windowApi.openCompose({to,title,body,files,forwarded,richBody,noticeType});return;}
    const lessonPeople=state.profile?.id&&!state.data.people.some(p=>p.id===state.profile.id)?[state.profile,...state.data.people]:state.data.people;
    composeDraft = {
      to: [...new Set(to)],
      cc: [],
      files: files.map((f) => ({ ...f })),
      forwarded,
    };
    openModal(
      "새 쪽지 쓰기",
      `<form id="compose-form" class="compose-form"><label>안내 종류<select id="lesson-kind" class="input"><option value="">일반 쪽지</option><option value="makeup">보강 안내</option><option value="lessonChange">수업 변경 안내</option></select></label><section id="lesson-assignment" hidden><label>수업 날짜<input id="lesson-date" class="input" type="date" value="${state.today}"></label><p class="muted">필요한 교시를 체크하고 담당 교사를 배정하세요. 보강에서 반을 선택하면 담임과 보강 교사에게 함께 발송합니다. 수업 변경은 기존·교체 교사에게 안내하고 캘린더에 자동 등록합니다.</p><div class="lesson-table-scroll"><table class="lesson-table"><thead><tr><th>교시</th><th>반</th><th class="lesson-original" hidden>기존 교사</th><th id="lesson-teacher-heading">보강 교사</th></tr></thead><tbody>${Array.from({length:7},(_,i)=>`<tr data-lesson-row="${i+1}"><td><label><input type="checkbox" data-lesson-period="${i+1}">${i+1}교시</label><small data-lesson-time="${i+1}"></small></td><td><input class="input" data-lesson-class="${i+1}" list="school-classes" placeholder="반 선택/입력" maxlength="40" aria-label="${i+1}교시 반"><small data-lesson-homeroom="${i+1}"></small></td><td class="lesson-original" hidden><select class="input" data-lesson-original="${i+1}" aria-label="${i+1}교시 기존 교사"><option value="">교사 선택</option>${lessonPeople.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.department)}</option>`).join("")}</select></td><td><select class="input" data-lesson-teacher="${i+1}" aria-label="${i+1}교시 배정 교사"><option value="">교사 선택</option>${lessonPeople.map(p=>`<option value="${p.id}">${esc(p.name)} · ${esc(p.department)}</option>`).join("")}</select></td></tr>`).join("")}</tbody></table></div><datalist id="school-classes">${[...new Set([...(state.data.classTeachers||[]).map(c=>c.className),...Array.from({length:36},(_,i)=>`${Math.floor(i/12)+1}학년 ${i%12+1}반`)])].map(name=>`<option value="${esc(name)}">`).join("")}</datalist></section><div class="field-row"><label for="recipient-input">받는 사람</label><div class="recipient-box" id="recipient-box">${recipientChips()}<input id="recipient-input" autocomplete="off" placeholder="이름을 입력해 선택하세요" aria-label="받는 사람 검색"><div class="suggestions" id="recipient-suggestions" hidden></div></div></div><details class="recipient-picker"><summary>목록에서 필요한 수신자 선택</summary><p class="muted">받는 사람만 체크하세요. 전체 선택은 필요하지 않습니다.</p><div class="recipient-options">${state.data.people.map(p=>`<label><input type="checkbox" data-compose-person="${p.id}" ${composeDraft.to.includes(p.id)?"checked":""}><span>${esc(p.name)} <small>${esc(p.department)}</small></span></label>`).join("")}</div></details><div class="field-row"><label for="cc-input">참조</label><div class="recipient-box" id="cc-box"><input id="cc-input" autocomplete="off" placeholder="참조할 선생님 선택 (선택)" aria-label="참조 검색"><div class="suggestions" id="cc-suggestions" hidden></div></div></div><div class="field-row"><label for="mail-title">제목 (선택)</label><input id="mail-title" class="input" placeholder="비워 두어도 발송할 수 있습니다" value="${esc(title)}" maxlength="150"></div><div><div class="editor-tools" aria-label="본문 서식">${button("editor-bold", "B", "", "", 'aria-label="굵게"')}${button("editor-italic", "I", "", "", 'aria-label="기울임"')}${button("editor-underline", "U", "", "", 'aria-label="밑줄"')}${button("editor-list", "목록", "checklist")}${button("editor-clear", "서식 지우기")}</div><div class="rich-editor" id="mail-editor" contenteditable="true" role="textbox" aria-label="쪽지 본문" aria-multiline="true" data-placeholder="선생님께 전할 이야기와 자료를 적어 주세요.">${richBody?safeRichHTML(richBody):esc(body).replace(/\n/g, "<br>")}</div></div><div class="drop-zone" id="file-drop" tabindex="0" role="button" aria-label="첨부 파일 선택">${icon("clip", 16)} 파일을 끌어 놓거나 눌러서 첨부하세요 <small>· 최대 2 MB, 브라우저에만 저장</small></div><input type="file" id="mail-files" multiple hidden><div class="compose-files" id="compose-files">${composeFilesHTML()}</div><div class="compose-options"><label><input type="checkbox" id="mail-important"> 중요 쪽지</label><label><input type="checkbox" id="mail-link-calendar"> 일정으로 등록</label><label><input type="checkbox" id="mail-schedule"> ${native ? "예약 발송" : "예약 초안"}</label><input type="datetime-local" id="mail-scheduled-at" class="input" style="width:200px;padding:6px" hidden></div><p class="muted" style="font-size:10px">${native ? "서버에 등록된 교직원에게 전달되는 쪽지입니다." : "받는 사람은 예시 교직원입니다. 보내기를 눌러도 실제로 전송되지 않습니다."}</p><div id="compose-error" class="form-error" role="alert"></div></form>`,
      button("close-modal", "취소") +
        `<button class="btn btn-primary" type="submit" form="compose-form">${icon("send", 16)} 쪽지 보내기</button>`,
      "compose-modal",
    );
    initCompose();
    const refreshLesson=()=>{const kind=$("#lesson-kind").value;$("#lesson-assignment").hidden=!kind;$$('.lesson-original').forEach(el=>el.hidden=kind!=="lessonChange");$("#lesson-teacher-heading").textContent=kind==="lessonChange"?"교체 교사":"보강 교사";for(const period of Array.from({length:7},(_,i)=>i+1)){const slot=periodsForDate($("#lesson-date").value).find(p=>p.period===period);$(`[data-lesson-time="${period}"]`).textContent=slot?`${slot.start}–${slot.end}`:"미설정";}for(const id of ["mail-schedule","mail-link-calendar"]){$("#"+id).disabled=!!kind;if(kind)$("#"+id).checked=false;}};
    const updateHomeroom=()=>{const kind=$("#lesson-kind").value;for(let period=1;period<=7;period++){const name=$(`[data-lesson-class="${period}"]`).value.trim(),mapping=(state.data.classTeachers||[]).find(c=>c.className.replace(/\s+/g,"")===name.replace(/\s+/g,""));const label=$(`[data-lesson-homeroom="${period}"]`);label.textContent=kind==="makeup"&&name?(mapping?`담임: ${person(mapping.teacher).name} · 자동 수신`:"담임 미등록 · 관리자 설정 필요"):"";}};
    $$("[data-lesson-class]").forEach(el=>el.oninput=updateHomeroom);
    $("#lesson-kind").addEventListener("change",updateHomeroom);
    $("#lesson-kind").value=noticeType;$("#lesson-kind").onchange=refreshLesson;$("#lesson-date").onchange=refreshLesson;refreshLesson();updateHomeroom();
    if(native&&composeDraft.files.some(f=>f.stored&&!f.data)){
      const draft=composeDraft,button=$("button[form=compose-form]");button.disabled=true;
      Promise.all(draft.files.map(async file=>{if(file.stored&&!file.data){const result=await native.request("/attachment",{mail:file.sourceMail,index:file.index});if(result.error)throw new Error(result.error);Object.assign(file,result.file);}})).then(()=>{if(composeDraft===draft)button.disabled=false;}).catch(error=>{if(composeDraft===draft){$("#compose-error").textContent=error.message;button.disabled=false;}});
    }
  }
  function recipientChips(kind = "to") {
    return composeDraft[kind]
      .map(
        (id) =>
          `<span class="chip">${esc(person(id).name)}<button type="button" data-action="remove-recipient" data-person="${id}" data-kind="${kind}" aria-label="${esc(person(id).name)} 제외">×</button></span>`,
      )
      .join("");
  }
  function composeFilesHTML() {
    return composeDraft.files
      .map(
        (f, i) =>
          `<span class="chip">${icon("clip", 12)}${esc(f.name)}<button type="button" data-action="remove-file" data-file="${i}" aria-label="첨부 삭제">×</button></span>`,
      )
      .join("");
  }
  function initCompose() {
    const drop = $("#file-drop");
    drop.onclick = () => $("#mail-files").click();
    drop.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        $("#mail-files").click();
      }
    };
    drop.ondragover = (e) => {
      e.preventDefault();
      drop.classList.add("over");
    };
    drop.ondragleave = () => drop.classList.remove("over");
    drop.ondrop = (e) => {
      e.preventDefault();
      drop.classList.remove("over");
      addFiles(e.dataTransfer.files);
    };
    $("#mail-files").onchange = (e) => addFiles(e.target.files);
    ["recipient-input", "cc-input"].forEach((id) => {
      const input = $("#" + id),
        kind = id === "recipient-input" ? "to" : "cc";
      input.oninput = () => recipientSuggestions(input, kind);
      input.onfocus = () => recipientSuggestions(input, kind);
      input.onkeydown = (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          $(
            "#" + (kind === "to" ? "recipient" : "cc") + "-suggestions button",
          )?.click();
        }
        if (e.key === "Escape")
          $(
            "#" + (kind === "to" ? "recipient" : "cc") + "-suggestions",
          ).hidden = true;
      };
    });
    $("#mail-schedule").onchange = (e) =>
      ($("#mail-scheduled-at").hidden = !e.target.checked);
    $("#compose-form").onsubmit = sendMail;
  }
  function recipientSuggestions(input, kind) {
    const target = $(
      "#" + (kind === "to" ? "recipient" : "cc") + "-suggestions",
    );
    const people = state.data.people
      .filter(
        (p) =>
          !composeDraft[kind].includes(p.id) &&
          (p.name + p.department).includes(input.value.trim()),
      )
      .slice(0, 6);
    target.hidden = !people.length;
    target.innerHTML = people
      .map(
        (p) =>
          `<button type="button" data-action="add-recipient" data-person="${p.id}" data-kind="${kind}">${avatar(p, "small")}<span>${esc(p.name)} <small class="muted">${esc(p.department)}</small></span></button>`,
      )
      .join("");
  }
  async function addFiles(files) {
    for (const file of files) {
      if (
        file.size > 2 * 1024 * 1024 ||
        composeDraft.files.reduce((n, f) => n + (f.bytes || 0), 0) + file.size >
          3 * 1024 * 1024
      ) {
        $("#compose-error").textContent =
          "파일은 각각 2 MB, 총 3 MB 이하로 첨부해 주세요.";
        continue;
      }
      const data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      }).catch(() => null);
      if (data && composeDraft)
        composeDraft.files.push({
          name: file.name,
          size:
            file.size < 1024
              ? file.size + " B"
              : Math.ceil(file.size / 1024) + " KB",
          bytes: file.size,
          data,
        });
    }
    if (composeDraft) $("#compose-files").innerHTML = composeFilesHTML();
  }
  async function sendMail(e) {
    e.preventDefault();
    if(mailSending)return;
    const title = $("#mail-title").value.trim(),
      body = $("#mail-editor").innerText.trim(),
      scheduled = $("#mail-schedule").checked
        ? $("#mail-scheduled-at").value
        : "";
    const error = $("#compose-error");
    let notice=null;
    if($("#lesson-kind").value){const kind=$("#lesson-kind").value,date=$("#lesson-date").value;const rows=$$("[data-lesson-period]:checked").map(el=>{const period=Number(el.dataset.lessonPeriod);return {period,teacher:$(`[data-lesson-teacher="${period}"]`).value,className:$(`[data-lesson-class="${period}"]`).value.trim(),...(kind==="lessonChange"?{originalTeacher:$(`[data-lesson-original="${period}"]`).value}:{})};});
      if(!date||!rows.length||rows.some(row=>!row.teacher||kind==="lessonChange"&&(!row.className||!row.originalTeacher||row.teacher===row.originalTeacher)||!periodsForDate(date).some(p=>p.period===row.period))){error.textContent="교시와 배정 교사를 선택해 주세요. 수업 변경은 반과 서로 다른 기존·교체 교사가 필요합니다. 일과표에 없는 교시는 사용할 수 없습니다.";return;}
      if(kind==="makeup"){for(const row of rows){if(!row.className)continue;const mapping=(state.data.classTeachers||[]).find(c=>c.className.replace(/\s+/g,"")===row.className.replace(/\s+/g,""));if(!mapping){error.textContent=`${row.className}의 담임이 등록되지 않았습니다. 관리자에게 반·담임 설정을 요청하세요.`;return;}row.homeroomTeacher=mapping.teacher;}}
      notice={kind,date,rows};
    }
    if (!composeDraft.to.length&&!notice) {
      error.textContent = "받는 선생님을 목록에서 한 명 이상 선택해 주세요.";
      return;
    }
    if (!body) {
      error.textContent = "본문을 입력해 주세요.";
      return;
    }
    if (
      $("#mail-schedule").checked &&
      (!scheduled || new Date(scheduled) <= new Date())
    ) {
      error.textContent = "예약 초안의 날짜를 현재보다 이후로 지정해 주세요.";
      return;
    }
    const m = {
      id: uid("user-mail"),
      from: "me",
      to: [...new Set([...composeDraft.to, ...composeDraft.cc,...(notice?notice.rows.flatMap(row=>[row.teacher,row.originalTeacher,row.homeroomTeacher].filter(Boolean)):[])])],
      cc: composeDraft.cc,
      title,
      body,
      html: safeRichHTML($("#mail-editor").innerHTML),
      folder: "sent",
      unread: false,
      important: $("#mail-important").checked,
      date: Mock.today,
      time: currentTime(),
      files: composeDraft.files,
      receipts: [...new Set([...composeDraft.to, ...composeDraft.cc,...(notice?notice.rows.flatMap(row=>[row.teacher,row.originalTeacher,row.homeroomTeacher].filter(Boolean)):[])])].map(
        () => "unread",
      ),
      scheduled,
      ...(notice?{notice}:{}),
    };
    if(notice){const summary=notice.rows.map(row=>`${row.period}교시 · ${row.className||"반 미지정"} · ${row.originalTeacher?person(row.originalTeacher).name+" → ":""}${person(row.teacher).name}${row.homeroomTeacher?" · 담임: "+person(row.homeroomTeacher).name:""}`).join("\n");m.body=`${body}\n\n${notice.date} ${typeLabel(notice.kind)}\n${summary}`;m.html=safeRichHTML(m.html+"<br><br>"+esc(`${notice.date} ${typeLabel(notice.kind)}\n${summary}`).replace(/\n/g,"<br>"));for(const row of notice.rows){const slot=periodsForDate(notice.date).find(p=>p.period===row.period);state.data.events.push({id:m.id+"-p"+row.period,title:`${typeLabel(notice.kind)} · ${row.period}교시${row.className?" · "+row.className:""}`,date:notice.date,start:slot.start,end:slot.end,type:notice.kind,period:row.period,targets:[...new Set([row.teacher,row.originalTeacher,row.homeroomTeacher].filter(Boolean))],note:m.body,place:row.className||"",assignment:row,noticeMail:m.id});}}
    state.data.mails.unshift(m);
    const link = $("#mail-link-calendar").checked;
    mailSending=true;const submit=$('button[form="compose-form"]');if(submit)submit.disabled=true;
    const sent=await save();
    if(!sent){state.data.mails=state.data.mails.filter(item=>item.id!==m.id);state.data.events=state.data.events.filter(item=>item.noticeMail!==m.id);mailSending=false;if(submit)submit.disabled=false;error.textContent="발송하지 못했습니다. 연결을 확인하고 다시 보내 주세요.";return;}
    closeModal();mailSending=false;
    if(requestedCompose){await windowApi.composeSent(link?{title:m.title,date:state.today,mail:m.id}:undefined);return;}

    render();
    toast(
      scheduled ? "예약 초안을 저장했어요" : "쪽지를 보낸 쪽지함에 저장했어요",
      scheduled
        ? native ? "예약 시간에 서버가 자동으로 발송합니다." : "체험 버전에서는 자동 발송되지 않습니다."
        : native ? "서버에 저장되어 받는 선생님께 전달되었습니다." : "체험 데이터이며 실제 선생님에게 전송되지 않습니다.",
    );
    if (link) eventForm({ title: m.title, date: state.today, mail: m.id });
  }
  async function downloadFile(m, i) {
    const f = m.files[i];
    if (!f) return;
    if(native&&f.stored&&!f.data){const result=await native.request("/attachment",{mail:f.sourceMail,index:f.index});if(result.error){toast("첨부 파일을 열 수 없어요",result.error);return;}Object.assign(f,result.file);}
    if (!f.data) {
      toast("예시 첨부 파일입니다", "직접 첨부한 파일만 다운로드할 수 있어요.");
      return;
    }
    const a = document.createElement("a");
    a.download = f.name;
    a.href = f.data;
    a.click();
  }
  function calendarPage() {
    const days = Array.from({ length: 5 }, (_, i) => addDays(state.week, i));
    return (
      heading(
        "MAKE ROOM FOR WHAT MATTERS",
        "나의 일정",
        "함께하는 약속도, 나만의 시간도 한눈에.",
        (!native ? button("demo-deadline", "메시지 일정 체험", "mail") : "") +
        button("monthly", "월간 달력", "calendar") +
          button("add-event", "일정 등록", "plus", "btn-primary"),
      ) +
      `<div style="display:flex;align-items:center;justify-content:space-between;margin:-3px 0 18px;gap:10px"><span class="stat-line">${icon("calendar", 15)} 이번 주 ${state.data.events.filter((e) => days.includes(e.date)).length}개의 일정</span><div class="calendar-toolbar">${ib("week-prev", "이전 주", "left")}<h2>${fmtDate(days[0], { month: "numeric", day: "numeric" })} — ${fmtDate(days[4], { month: "numeric", day: "numeric" })}</h2>${ib("week-next", "다음 주", "right")}${button("week-reset", "이번 주")}</div></div><div class="calendar-layout"><section class="panel calendar-grid"><div class="time-column"><div class="calendar-top">일정</div><div class="academic-row">학사 일정</div><div class="deadline-row">제출 마감</div><div class="hours">${Array.from({ length: 10 }, (_, i) => `<div class="hour-label">${String(i + 8).padStart(2, "0")}:00</div>`).join("")}</div></div>${days.map((day) => dayColumn(day)).join("")}</section><aside class="calendar-aside"><section class="panel mini-calendar">${miniMonth()}</section>${taskPanel()}${checklistPanel()}<div class="panel legend"><span><i style="background:#7898bb"></i>단체 일정</span><span><i style="background:#80aa71"></i>개인 일정</span><span><i style="background:#be9c64"></i>정기 업무</span></div></aside></div>`
    );
  }
  function dayColumn(day) {
    const events = state.data.events
      .filter((e) => e.date === day)
      .sort((a, b) => a.start.localeCompare(b.start));
    const slots = [];
    const layouts = new Map();
    events.forEach((e) => {
      let slot = 0;
      while (slots[slot] > minutes(e.start)) slot++;
      slots[slot] = minutes(e.end);
      layouts.set(e.id, slot);
    });
    const overlapping = (e) =>
      events.filter(
        (other) =>
          minutes(other.start) < minutes(e.end) &&
          minutes(other.end) > minutes(e.start),
      );
    const clusterCount = (e) => {
      let cluster = overlapping(e),
        changed = true;
      while (changed) {
        changed = false;
        events.forEach((other) => {
          if (
            !cluster.includes(other) &&
            cluster.some(
              (c) =>
                minutes(other.start) < minutes(c.end) &&
                minutes(other.end) > minutes(c.start),
            )
          ) {
            cluster.push(other);
            changed = true;
          }
        });
      }
      return Math.max(...cluster.map((c) => layouts.get(c.id))) + 1;
    };
    const now = new Date(),
      nowMin = now.getHours() * 60 + now.getMinutes();
    return `<div class="day-column ${day === Mock.today ? "today" : ""} ${state.expanded === day ? "expanded" : state.expanded ? "dim" : ""}"><button class="calendar-top" data-action="expand-day" data-date="${day}" aria-pressed="${state.expanded === day}">${fmtDate(day, { weekday: "short" })}<b>${parseDate(day).getDate()}</b></button><div class="academic-row">${state.data.academic
      .filter((a) => a.date === day)
      .map((a) => esc(a.title))
      .join("<br>")}</div><div class="deadline-row">${state.data.deadlines
      .filter((d) => d.date === day)
      .map(
        (d) =>
          `<button class="deadline-pill ${d.done ? "done" : ""}" data-action="deadline-detail" data-deadline="${d.id}">${icon(d.done ? "check" : "clock", 10)}${esc(d.title)}${d.dueTime ? ` · ${esc(d.dueTime)}까지` : ""}</button>`,
      )
      .join(
        "",
      )}</div><div class="hours" data-day-hours="${day}" data-calendar-timeline="${day}" title="드래그로 시간대를 선택하거나 두 번 클릭해 일정을 등록하세요">${events
      .map((e) => {
        const top = minutes(e.start) - 480,
          height = minutes(e.end) - minutes(e.start),
          n = clusterCount(e),
          slot = layouts.get(e.id);
        return `<button class="event ${e.type}" data-action="view-event" data-event="${e.id}" style="top:${Math.max(0, top)}px;height:${Math.max(28, Math.min(600 - Math.max(0, top), height))}px;left:calc(${(slot * 100) / n}% + 5px);width:calc(${100 / n}% - 10px);right:auto" title="${esc(e.title)} · ${e.start}–${e.end}"><strong>${e.type === "personal" ? icon("lock", 10) + " " : ""}${esc(e.title)}</strong><small>${e.start}–${e.end}</small><small>${esc(e.place)}</small></button>`;
      })
      .join("")}${state.data.notes
      .filter((n) => n.date === day)
      .map(
        (n) =>
          `<button class="event-note" style="top:${Math.max(0, Math.min(575, minutes(n.time) - 480))}px" data-action="view-note" data-note="${n.id}" title="${esc(n.text)}">${icon("note", 11)} ${esc(n.text)}</button>`,
      )
      .join(
        "",
      )}${day === Mock.today && nowMin >= 480 && nowMin <= 1080 ? `<div class="now-line" style="top:${nowMin - 480}px"></div>` : ""}</div></div>`;
  }
  function monthDates(anchor) {
    const d = parseDate(anchor);
    d.setDate(1);
    d.setDate(1 - d.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(dateKey(d), i));
  }
  function miniMonth() {
    const month = parseDate(state.week).getMonth();
    return `<div class="mini-calendar-header"><strong>${fmtDate(state.week, { year: "numeric", month: "long" })}</strong>${ib("monthly", "월간 달력 열기", "popout")}</div><div class="mini-grid">${["일", "월", "화", "수", "목", "금", "토"].map((d) => `<span class="day-label">${d}</span>`).join("")}${monthDates(
      state.week,
    )
      .map(
        (day) =>
          `<button data-action="calendar-jump" data-date="${day}" class="${parseDate(day).getMonth() !== month ? "other" : ""} ${day === Mock.today ? "current" : ""} ${day === state.today ? "selected" : ""}" aria-label="${fmtDate(day)}">${parseDate(day).getDate()}</button>`,
      )
      .join("")}</div>`;
  }
  function checklistPanel() {
    return `<section class="panel"><div class="panel-head"><h2>나만의 체크리스트</h2><small>${state.data.tasks.filter((t) => t.done).length}/${state.data.tasks.length}</small></div><div class="task-list">${state.data.tasks.map((t) => `<label class="task-row"><input type="checkbox" data-task="${t.id}" ${t.done ? "checked" : ""}><span class="${t.done ? "done" : ""}">${esc(t.title)}</span><button class="icon-btn" style="height:20px;width:20px;margin-left:auto" data-action="remove-task" data-task="${t.id}" aria-label="할 일 삭제">${icon("x", 12)}</button></label>`).join("")}</div><form class="checklist-input" id="task-form"><input class="input" id="task-title" aria-label="새 할 일" placeholder="할 일 추가" maxlength="120" required><button class="btn" type="submit" aria-label="할 일 추가">${icon("plus", 15)}</button></form></section>`;
  }
  let monthAnchor = Mock.today;
  function monthly() {
    openModal(
      "학사 일정 · 월간 달력",
      monthlyBody(),
      button(
        "month-theme",
        state.settings.dark ? "밝게 보기" : "어둡게 보기",
        state.settings.dark ? "sun" : "moon",
      ) + button("close-modal", "닫기"),
      "wide",
    );
  }
  function monthlyBody() {
    const month = parseDate(monthAnchor).getMonth();
    return `<div class="calendar-toolbar" style="justify-content:center;margin-bottom:20px">${ib("month-prev", "이전 달", "left")}<h2 style="font-size:19px">${fmtDate(monthAnchor, { year: "numeric", month: "long" })}</h2>${ib("month-next", "다음 달", "right")}</div><div class="month-grid">${["일", "월", "화", "수", "목", "금", "토"].map((d) => `<div class="day-label">${d}</div>`).join("")}${monthDates(
      monthAnchor,
    )
      .map(
        (day, i) =>
          `<button class="month-cell ${i % 7 === 0 ? "sunday" : i % 7 === 6 ? "saturday" : ""} ${parseDate(day).getMonth() !== month ? "other" : ""} ${day === Mock.today ? "current" : ""}" data-action="month-date" data-date="${day}" aria-label="${fmtDate(day)} 일정 등록"><b>${parseDate(day).getDate()}</b>${state.data.academic
            .filter((a) => a.date === day)
            .map((a) => `<small class="academic">${esc(a.title)}</small>`)
            .join("")}${state.data.deadlines.filter(d=>d.date===day).map(d=>`<small class="deadline-pill">${esc(d.title)}${d.dueTime?` · ${esc(d.dueTime)}까지`:" · 마감"}</small>`).join("")}${state.data.events
            .filter((e) => e.date === day)
            .slice(0, 3)
            .map((e) => `<small>${esc(e.start)} ${esc(e.title)}</small>`)
            .join("")}</button>`,
      )
      .join("")}</div>`;
  }
  const periodsForDate=date=>state.data.bellSchedules?.find(s=>s.date===date)?.periods||state.data.defaultPeriods||Mock.defaultPeriods;
  function classTeachersForm(){
    const editable=!native||state.profile?.admin,people=state.profile?.id?[state.profile,...state.data.people]:state.data.people;
    const existing=state.data.classTeachers||[];const names=[...new Set([...existing.map(c=>c.className),...Array.from({length:36},(_,i)=>`${Math.floor(i/12)+1}학년 ${i%12+1}반`)])];
    const row=name=>`<div class="two-fields" data-class-row><label>반<input class="input" data-class-name value="${esc(name)}" maxlength="40" ${editable?'':'disabled'}></label><label>담임<select class="input" data-class-teacher ${editable?'':'disabled'}><option value="">미등록</option>${people.map(p=>`<option value="${p.id}" ${existing.find(c=>c.className===name)?.teacher===p.id?'selected':''}>${esc(p.name)} · ${esc(p.department)}</option>`).join("")}</select></label></div>`;
    openModal("반·담임 설정",`<form id="classes-form" class="event-form"><p class="muted">${editable?"보강에서 반을 지정하면 등록된 담임에게도 함께 발송합니다. 미등록을 선택하면 연결을 해제합니다.":"학교 관리자가 지정한 반별 담임입니다. 변경은 관리자에게 요청하세요."}${native?'':' 예시 담임 배정이므로 학교의 실제 담임에 맞게 수정하세요.'}</p><div id="classes-rows">${names.map(row).join("")}</div>${editable?'<button type="button" id="class-add" class="btn">반 추가</button>':''}<div id="classes-error" class="form-error" role="alert"></div></form>`,button("close-modal","닫기")+(editable?'<button type="submit" class="btn btn-primary" form="classes-form">담임 설정 저장</button>':''));
    if(!editable)return;$("#class-add").onclick=()=>$("#classes-rows").insertAdjacentHTML("beforeend",row(""));
    $("#classes-form").onsubmit=async event=>{event.preventDefault();const classes=$$("[data-class-row]").filter(el=>el.querySelector("[data-class-teacher]").value).map(el=>({className:el.querySelector("[data-class-name]").value.trim(),teacher:el.querySelector("[data-class-teacher]").value}));const seen=new Set();if(classes.some(c=>{const key=c.className.replace(/\s+/g,"");if(!key||seen.has(key))return true;seen.add(key);return false;})){$("#classes-error").textContent="반 이름을 입력하고 같은 반을 중복 등록하지 마세요.";return;}const old=state.data.classTeachers;state.data.classTeachers=classes;if(!(await save())){state.data.classTeachers=old;return;}closeModal();toast("반별 담임을 저장했어요");};
  }
  function bellScheduleForm(){
    const editable=!native||state.profile?.admin;
    openModal("학교 일과표",`<form id="bell-form" class="event-form"><p class="muted">${editable?"날짜별 임시 일과표는 해당 날짜에만 적용됩니다. 보강 일정 시간도 함께 갱신됩니다.":"학교 일과표는 관리자에게 변경을 요청하세요."}</p><label>적용 범위<select id="bell-scope" class="input"><option value="temporary">날짜별 임시 일과표</option><option value="default">기본 일과표</option></select></label><label id="bell-date-box">날짜<input id="bell-date" type="date" class="input" value="${state.today}" required></label><div id="bell-rows"></div><p class="muted">기본값은 예시입니다. 학교의 실제 일과에 맞게 설정하세요.</p><div id="bell-error" class="form-error" role="alert"></div></form>`,button("close-modal","닫기")+(editable?button("bell-reset","임시 일과표 해제","trash")+'<button class="btn btn-primary" type="submit" form="bell-form">저장 후 메시지 발송</button>':""));
    const load=()=>{const basic=$("#bell-scope").value==="default";$("#bell-date-box").hidden=basic;$("#bell-date").disabled=basic;const slots=basic?(state.data.defaultPeriods||Mock.defaultPeriods):periodsForDate($("#bell-date").value);$("#bell-rows").innerHTML=Array.from({length:12},(_,i)=>{const slot=slots.find(p=>p.period===i+1);return `<div class="bell-row"><label><input type="checkbox" data-bell-period="${i+1}" ${slot?'checked':''} ${!editable?'disabled':''}> ${i+1}교시</label><input aria-label="${i+1}교시 시작" type="time" value="${slot?.start||''}" data-bell-start="${i+1}" ${!editable?'disabled':''}><span>~</span><input aria-label="${i+1}교시 종료" type="time" value="${slot?.end||''}" data-bell-end="${i+1}" ${!editable?'disabled':''}></div>`;}).join("");const before=slots.find(p=>p.period===4),after=slots.find(p=>p.period===5),lunch=slots.find(p=>p.period===4.5)||(before&&after&&before.end<after.start?{start:before.end,end:after.start}:null);$('[data-bell-period="4"]').closest('.bell-row').insertAdjacentHTML('afterend',`<div class="bell-row"><label><input type="checkbox" data-bell-period="4.5" ${lunch?'checked':''} ${editable?'':'disabled'}>점심시간</label><input aria-label="점심시간 시작" type="time" value="${lunch?.start||''}" data-bell-start="4.5" ${editable?'':'disabled'}><span>~</span><input aria-label="점심시간 종료" type="time" value="${lunch?.end||''}" data-bell-end="4.5" ${editable?'':'disabled'}></div>`);const reset=$('[data-action="bell-reset"]');if(reset)reset.hidden=basic;};
    $("#bell-scope").onchange=load;$("#bell-date").onchange=load;load();
    let saving=false;
    const store=async remove=>{if(!editable||saving)return;const date=$("#bell-scope").value==="default"?'':$("#bell-date").value;if(!date&&remove)return;
      const slots=$$("[data-bell-period]:checked").map(el=>({period:Number(el.dataset.bellPeriod),start:$(`[data-bell-start="${el.dataset.bellPeriod}"]`).value,end:$(`[data-bell-end="${el.dataset.bellPeriod}"]`).value}));
      let previous="08:00";if(!remove&&(!slots.length||slots.some(p=>{const bad=!p.start||!p.end||p.start<previous||p.start<"08:00"||p.end>"18:00"||p.start>=p.end;previous=p.end;return bad;}))){$("#bell-error").textContent="08:00~18:00 범위에서 교시 시간이 겹치지 않도록 입력하세요.";return;}
      const old=JSON.parse(JSON.stringify(state.data));state.data.bellSchedules=(state.data.bellSchedules||[]).filter(s=>s.date!==date);if(date&&!remove)state.data.bellSchedules.push({date,periods:slots});if(!date&&!remove){state.data.defaultPeriods=slots;state.data.deadlineDefaultPeriodsChanged=true;}
      for(const event of state.data.events.filter(e=>["makeup","lessonChange"].includes(e.type)&&(!date||e.date===date))){const slot=periodsForDate(event.date).find(p=>p.period===event.period);if(!slot){state.data=old;$("#bell-error").textContent="등록된 보강이 사용하는 교시는 삭제할 수 없습니다.";return;}if(!event.readonly){event.start=slot.start;event.end=slot.end;}}
      const noticeDate=date||state.today,periods=date?periodsForDate(date):(state.data.defaultPeriods||Mock.defaultPeriods),title=`${Number(noticeDate.slice(5,7))}월 ${Number(noticeDate.slice(8,10))}일 일과표${date?'':' (기본 일과표)'}`;
      const rows=[1,2,3,4,4.5,5,6,7].map(period=>{let slot=periods.find(p=>p.period===period);if(period===4.5&&!slot){const before=periods.find(p=>p.period===4),after=periods.find(p=>p.period===5);if(before&&after&&before.end<after.start)slot={start:before.end,end:after.start};}return [period===4.5?'점심시간':period+'교시',slot?slot.start+' ~ '+slot.end:'미설정'];});
      const html='<table><thead><tr><th>구분</th><th>시간</th></tr></thead><tbody>'+rows.map(row=>`<tr><td>${esc(row[0])}</td><td>${esc(row[1])}</td></tr>`).join('')+'</tbody></table>',body=title+'\n'+rows.map(row=>row.join(' · ')).join('\n');const targets=state.data.people.map(p=>p.id);
      state.data.mails.unshift({id:uid('user-mail'),from:'me',to:targets,cc:[],title,body,html,folder:'sent',unread:false,important:true,date:Mock.today,time:currentTime(),files:[],receipts:targets.map(()=>"unread"),scheduled:'',scheduleAnnouncement:{date:noticeDate,scope:date?'temporary':'default'}});
      saving=true;const submit=$('button[form="bell-form"]');if(submit)submit.disabled=true;const stored=await save();saving=false;if(submit)submit.disabled=false;if(!stored){state.data=old;return;}closeModal();render();toast("일과표를 저장하고 전체 안내를 발송했어요",title,"calendar");
    };
    $("#bell-form").onsubmit=e=>{e.preventDefault();store(false);};const reset=$('[data-action="bell-reset"]');if(reset)reset.onclick=e=>{e.stopPropagation();store(true);};
  }
  function eventForm({
    id = null,
    title = "",
    date = state.today,
    start = "09:00",
    end = "10:00",
    type = "personal",
    place = "",
    note = "",
    mail = null,
    targets = [],
    period = 1,
    dueTime = "",
    done = false,
  } = {}) {
    eventDraft = { id, mail, done };
    openModal(
      id ? "일정 수정" : "새로운 일정",
      `<form id="event-form" class="event-form"><label>제목 (선택)<input class="input" id="event-title" placeholder="비워 두면 내용으로 일정을 표시합니다" value="${esc(title)}" maxlength="100"></label><div class="two-fields"><label>날짜<input class="input" id="event-date" type="date" value="${date}" required></label><label>종류<select class="input" id="event-type">${["personal", "group", "makeup", "repeat", "note", "deadline"].map((t) => `<option value="${t}" ${type === t ? "selected" : ""}>${typeLabel(t)}</option>`).join("")}</select></label></div><label id="makeup-period-box" hidden>보강 교시<select class="input" id="makeup-period"></select><small class="muted">해당 날짜의 일과표 시간을 적용합니다. 수신자 캘린더에 자동 등록됩니다.</small></label><div class="two-fields" id="event-time-range"><label>시작 시간<input class="input" id="event-start" type="time" value="${start}" required min="08:00" max="17:45"></label><label>종료 시간<input class="input" id="event-end" type="time" value="${end}" required min="08:15" max="18:00"></label></div><label id="event-deadline-time" hidden>마감 시간 (선택)<input class="input" id="event-due-time" type="time" value="${esc(dueTime)}"><small class="muted">예: 월요일 16:00까지 제출. 시작 시간 없이 마감 시각만 저장합니다. 시간을 비우면 날짜만 표시합니다.</small></label><label id="event-place-label">장소<input class="input" id="event-place" placeholder="예: 도서관 세미나실" value="${esc(place)}" maxlength="100"></label><div id="event-target-box" ${type !== "group" ? "hidden" : ""}><span>메시지 수신자 · 일정 공유</span><div id="event-targets" class="recipient-options">${state.data.people.map(p=>`<label><input type="checkbox" value="${p.id}" ${targets.includes(p.id)?"checked":""}><span>${esc(p.name)} · ${esc(p.department)}</span></label>`).join("")}</div><small class="muted">수신자가 없으면 내 개인 일정입니다. 선택하면 메시지를 발송하고 선택한 선생님들의 캘린더에도 공유합니다.</small></div><label>내용<textarea class="input" id="event-note" rows="3" placeholder="미리 기억해 둘 내용을 적어 주세요." maxlength="1000">${esc(note)}</textarea></label><div id="event-error" class="form-error" role="alert"></div></form>`,
      (id
        ? button(
            "delete-event",
            "삭제",
            "trash",
            "btn-danger",
            `data-event="${id}"`,
          )
        : "") +
        button("close-modal", "취소") +
        `<button class="btn btn-primary" type="submit" form="event-form">${icon("check", 16)} 일정 저장</button>`,
    );
    const updateEventFields=()=>{
      const deadline=$("#event-type").value==="deadline";
      const makeup=$("#event-type").value==="makeup";
      $("#event-target-box").hidden=["note","deadline"].includes($("#event-type").value);
      $("#makeup-period-box").hidden=!makeup;
      $("#event-start").readOnly=makeup;$("#event-end").readOnly=makeup;$("#event-start").max=makeup?"18:00":"17:45";$("#event-end").min=makeup?"08:00":"08:15";
      if(makeup)updateMakeupPeriod();
      $("#event-time-range").hidden=deadline;
      $("#event-start").disabled=deadline; $("#event-end").disabled=deadline;
      $("#event-deadline-time").hidden=!deadline;
      $("#event-due-time").disabled=!deadline;
      $("#event-place-label").hidden=deadline;
    };
    const updateMakeupPeriod=()=>{
      const select=$("#makeup-period"),chosen=Number(select.value)||period;
      const slots=periodsForDate($("#event-date").value).filter(p=>Number.isInteger(p.period));
      select.innerHTML=slots.map(p=>`<option value="${p.period}" ${p.period===chosen?'selected':''}>${p.period}교시 · ${p.start}–${p.end}</option>`).join("");
      const slot=slots.find(p=>p.period===Number(select.value));if(slot){$("#event-start").value=slot.start;$("#event-end").value=slot.end;}
    };
    $("#makeup-period").onchange=updateMakeupPeriod;
    $("#event-date").onchange=()=>{if($("#event-type").value==="makeup")updateMakeupPeriod();};
    $("#event-type").onchange=updateEventFields;updateEventFields();
    $("#event-form").onsubmit = saveEvent;
  }
  async function saveEvent(e) {
    e.preventDefault();if(eventSaving)return;
    const messageTitle=$("#event-title").value.trim(),content=$("#event-note").value.trim();
    const title = messageTitle||content.split("\n")[0].slice(0,80)||"새 일정",
      date = $("#event-date").value,
      type = $("#event-type").value,
      start = $("#event-start").value,
      end = $("#event-end").value;

    if(!messageTitle&&!content){$("#event-error").textContent="일정 제목 또는 내용을 입력해 주세요.";return;}
    if (type !== "deadline" && minutes(start) >= minutes(end)) {
      $("#event-error").textContent = "종료 시간은 시작 시간보다 늦어야 해요.";
      return;
    }
    if(type==="makeup"&&(!$$("#event-targets input:checked").length||!$("#event-note").value.trim())){$("#event-error").textContent="보강 수신자와 안내 내용을 입력해 주세요.";return;}
    eventSaving=true;const eventSubmit=$('button[form="event-form"]');if(eventSubmit)eventSubmit.disabled=true;
    const oldData=JSON.parse(JSON.stringify(state.data));
    const id = eventDraft.id || uid("user-event");
    if (eventDraft.id && ["note", "deadline"].includes(type))
      state.data.events = state.data.events.filter(
        (e) => e.id !== eventDraft.id,
      );
    state.data.notes=state.data.notes.filter(item=>item.id!==id);
    state.data.deadlines=state.data.deadlines.filter(item=>item.id!==id);
    if (type === "note") {
      state.data.notes.push({
        id,
        date,
        time: start,
        text:
          title +
          ($("#event-note").value ? " · " + $("#event-note").value : ""),
      });
    } else if (type === "deadline") {
      state.data.deadlines.push({ id, title, date, dueTime: $("#event-due-time").value, note: $("#event-note").value.trim(), done: eventDraft.done });
    } else {
      const ev = {
        id,
        title,
        date,
        start,
        end,
        type:["personal","group","repeat"].includes(type)?($$("#event-targets input:checked").length?"group":type==="group"?"personal":type):type,
        place: $("#event-place").value.trim(),
        note: $("#event-note").value.trim(),
        targets: $$("#event-targets input:checked").map((o) => o.value),
        ...(type==="makeup"?{period:Number($("#makeup-period").value)}:{}),
      };
      const existing = state.data.events.findIndex((e) => e.id === id);
      if (existing >= 0) state.data.events[existing] = ev;
      else state.data.events.push(ev);
    }
    const sharedEvent=state.data.events.find(item=>item.id===id);
    if(sharedEvent?.targets.length){const body=`${content||title}\n\n일정: ${date} ${sharedEvent.start}–${sharedEvent.end}${sharedEvent.place?"\n장소: "+sharedEvent.place:""}`;state.data.mails.unshift({id:uid("user-mail"),from:"me",to:[...sharedEvent.targets],cc:[],title:messageTitle,body,html:safeRichHTML(esc(body).replace(/\n/g,"<br>")),folder:"sent",unread:false,important:false,date:Mock.today,time:currentTime(),files:[],receipts:sharedEvent.targets.map(()=>"unread"),scheduled:"",eventId:id,calendarEvent:id});}
    if (eventDraft.mail) {
      const mail = state.data.mails.find((m) => m.id === eventDraft.mail);
      if (mail) mail.eventId = id;
    }
    const stored=await save();eventSaving=false;if(eventSubmit)eventSubmit.disabled=false;
    if(!stored){state.data=oldData;return;}
    closeModal();
    state.today = date;
    state.week = weekStart(date);
    render();
    toast(sharedEvent?.targets.length?"일정을 공유하고 메시지를 보냈어요":"개인 일정을 저장했어요", fmtDate(date) + " · " + title, "calendar");
  }
  function viewEvent(id) {
    const e = state.data.events.find((e) => e.id === id);
    if (!e) return;
    openModal(
      e.title,
      `<div class="chip ${e.type === "personal" ? "" : e.type === "repeat" ? "orange" : "blue"}">${typeLabel(e.type)}</div><div style="margin-top:22px;display:grid;gap:16px;font-size:13px"><p>${icon("calendar", 16)} ${fmtDate(e.date)}</p><p>${icon("clock", 16)} ${e.start} – ${e.end}</p><p>${icon("school", 16)} ${esc(e.place || "장소 미정")}</p>${e.targets?.length ? `<p>${icon("users", 16)} ${e.targets.map((id) => esc(person(id).name)).join(", ")}</p>` : ""}<p class="muted" style="white-space:pre-wrap">${esc(e.note || "등록된 메모가 없습니다.")}</p></div>`,
      button("close-modal", "닫기") +
        (e.readonly||e.noticeMail ? "" : button(
          "edit-event",
          "일정 수정",
          "note",
          "btn-primary",
          `data-event="${id}"`,
        )),
    );
  }
  function announcementsPage() {
    return (
      heading(
        "A SCHOOL WE BUILD TOGETHER",
        "우리 학교 소식",
        "같이 알아두면 좋은 이야기들을 모았어요.",
        button("compose-mail", "소식 공유하기", "plus", "btn-primary"),
      ) +
      `<div class="announcement-list">${state.data.mails
        .filter((m) => m.folder === "inbox")
        .slice(0, 6)
        .map(
          (m, i) =>
            `<button class="panel announcement-card" data-action="announcement-open" data-mail="${m.id}"><span class="chip ${i % 2 ? "" : "orange"}">${i % 2 ? "교내 안내" : "함께 확인해요"}</span><h2>${esc(mailSubject(m))}</h2><p>${esc(m.body.slice(0, 100))}…</p><footer><span>${esc(person(m.from).department)}</span><span>${fmtDate(m.date, { month: "long", day: "numeric" })} ${icon("arrow", 13)}</span></footer></button>`,
        )
        .join("")}</div>`
    );
  }
  function linksPage() {
    return (
      heading(
        "YOUR EVERYDAY SHORTCUTS",
        "자주 찾는 곳",
        "선생님의 하루에 필요한 서비스로 빠르게 이동해요.",
        button("add-shortcut", "바로가기 추가", "plus", "btn-primary"),
      ) +
      `<div class="link-list">${(
        state.data.shortcuts || [
          {
            id: "s0",
            title: "나이스 대국민서비스",
            desc: "교육 행정 관련 서비스",
            url: "https://www.neis.go.kr",
            icon: "school",
          },
          {
            id: "s1",
            title: "에듀넷 · 티클리어",
            desc: "수업과 연구를 위한 교육 자료",
            url: "https://www.edunet.net",
            icon: "file",
          },
          {
            id: "s2",
            title: "학교알리미",
            desc: "학교의 주요 정보를 살펴보세요",
            url: "https://www.schoolinfo.go.kr",
            icon: "users",
          },
        ]
      )
        .map(
          (s) =>
            `<a class="link-card" href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${icon(s.icon || "link", 28)}<h3>${esc(s.title)} ${icon("arrow", 15)}</h3><p>${esc(s.desc)}</p><small class="muted" style="display:block;margin-top:18px">외부 사이트에서 열립니다</small></a>`,
        )
        .join("")}</div>`
    );
  }
  function settingsModal() {
    openModal(
      "선생님에게 맞는 이음",
      `<div class="setting-row"><div>반·담임<small>보강 안내의 담임 자동 수신자</small></div>${button("class-teachers","설정","users")}</div><div class="setting-row"><div>학교 일과표<small>기본 교시 시간과 날짜별 임시 일과표</small></div>${button("bell-schedule","설정","clock")}</div><div class="setting-row"><div>캘린더 위치<small>본창 크기를 유지하고 선택한 방향으로 오늘 일정이 열립니다.</small></div><select class="input" id="calendar-position" aria-label="캘린더 위치" style="width:110px">${[["left","왼쪽"],["right","오른쪽"]].map(([value,label])=>`<option value="${value}" ${state.settings.calendarPosition===value?"selected":""}>${label}</option>`).join("")}</select></div><div class="setting-row"><div>다음에도 바로 들어오기<small>${native ? "설치형 앱은 보안을 위해 매 실행 시 로그인합니다." : "이 브라우저에 이름만 저장해요. 실제 자동 로그인은 아닙니다."}</small></div><label class="switch"><input type="checkbox" id="auto-login" aria-label="바로 들어오기" ${native ? "disabled" : ""} ${state.settings.autoLogin ? "checked" : ""}><span></span></label></div>${[
        ["orgFont", "교직원 목록 글자", 12, 22],
        ["mailFont", "쪽지 본문 글자", 12, 24],
        ["chatFont", "대화 글자", 12, 22],
      ]
        .map(
          ([key, label]) =>
            `<div class="setting-row"><span>${label}</span><div class="stepper">${button("font-minus", "−", "", "", `data-setting="${key}" aria-label="${label} 작게"`)}<span id="setting-${key}">${state.settings[key]}px</span>${button("font-plus", "+", "", "", `data-setting="${key}" aria-label="${label} 크게"`)}</div></div>`,
        )
        .join(
          "",
        )}<div class="setting-row"><div>캘린더 어두운 화면<small>내 캘린더에만 적용됩니다.</small></div><label class="switch"><input type="checkbox" id="dark-mode" aria-label="캘린더 어두운 화면" ${state.settings.dark ? "checked" : ""}><span></span></label></div><div class="setting-row"><div>비밀번호 변경<small>${native ? "현재 비밀번호를 확인하고 변경합니다." : "계정 서버가 연결되면 제공할 기능입니다."}</small></div>${button("password-info", "안내", "lock")}</div><div style="margin-top:18px;padding:15px;background:var(--soft);border-radius:8px;font-size:11px;line-height:1.9"><strong>이음 사용 안내</strong><br>이름을 더블클릭하면 쪽지 작성, 우클릭하면 대화를 선택할 수 있어요.<br>일정의 빈 공간을 두 번 클릭하면 새 일정을 추가할 수 있어요.<br>${native ? "대화와 쪽지는 교내 서버 PC에 저장됩니다." : "모든 데이터는 예시이며 이 브라우저에만 저장됩니다."}</div>`,
      button("notification-test", "알림 테스트", "bell") +
        button("close-modal", "완료", "", "btn-primary"),
    );
    $("#calendar-position").onchange = (e) => {
      state.settings.calendarPosition=e.target.value;
      save(); render();
      if(windowApi&&state.showToday)windowApi.toggleToday(true,state.settings.calendarPosition);
    };
    $("#auto-login").onchange = (e) => {
      state.settings.autoLogin = e.target.checked;
      save();
    };
    $("#dark-mode").onchange = (e) => {
      state.settings.dark = e.target.checked;
      applySettings();
      save();
    };
  }
  function confirmModal(title, body, action, id) {
    openModal(
      title,
      `<p style="font-size:13px;line-height:1.8">${esc(body)}</p>`,
      button("close-modal", "취소") +
        button(action, "확인", "", "btn-primary", `data-id="${esc(id)}"`),
    );
  }
  async function openPersonChat(ids) {
    ids = [...new Set(ids)];
    if (!ids.length) return;
    let room = state.data.rooms.find(
      (r) =>
        r.members.length === ids.length &&
        ids.every((id) => r.members.includes(id)),
    );
    if (!room) {
      room = {
        id: uid("user-room"),
        name:
          ids.length === 1
            ? person(ids[0]).name
            : ids
                .slice(0, 2)
                .map((id) => person(id).name)
                .join(", ") +
              " 외 " +
              Math.max(0, ids.length - 2) +
              "명",
        members: ids,
        pinned: false,
        muted: false,
        unread: 0,
        notice: "",
        messages: [],
      };
      state.data.rooms.unshift(room);
      if (!(await save())) return;
    }
    if(windowApi){await windowApi.openChat(room.id);return;}
    state.floating = room.id;
    state.reply = null;
    state.chatQuery = "";
    state.chatSearch = false;
    state.members = false;
    renderFloating();
  }
  let editorLinkRange=null;
  function captureEditorLink(event){
    const editor=$("#mail-editor"),selection=window.getSelection();
    if(selection?.rangeCount&&editor.contains(selection.getRangeAt(0).commonAncestorContainer))editorLinkRange=selection.getRangeAt(0).cloneRange();
    else{const caret=document.caretRangeFromPoint?.(event.clientX,event.clientY);if(caret&&editor.contains(caret.commonAncestorContainer))editorLinkRange=caret;else{editorLinkRange=document.createRange();editorLinkRange.selectNodeContents(editor);editorLinkRange.collapse(false);}}
    const anchor=event.target.closest("a");if(anchor&&editor.contains(anchor)&&editorLinkRange.collapsed)editorLinkRange.selectNode(anchor);
  }
  function insertEditorLink(){
    const editor=$("#mail-editor");if(!editor)return;
    const range=editorLinkRange?.cloneRange()||document.createRange();if(!editorLinkRange){range.selectNodeContents(editor);range.collapse(false);}
    let current=range.startContainer.nodeType===1?range.startContainer:range.startContainer.parentElement;const existing=current?.closest("a")||range.cloneContents().querySelector?.("a");
    const dialog=document.createElement("dialog");dialog.className="editor-link-dialog";dialog.id="editor-link-dialog";
    dialog.innerHTML=`<form id="editor-link-form"><h2>링크 삽입</h2><label>표시할 텍스트<input class="input" id="editor-link-text" maxlength="2000" required value="${esc(range.toString())}" placeholder="예: 회의 자료 보기"></label><label>연결할 주소<input class="input" id="editor-link-url" type="url" maxlength="2048" required value="${esc(existing?.getAttribute("href")||'')}" placeholder="https://example.com"></label><p id="editor-link-error" class="form-error" role="alert"></p><div class="editor-link-actions"><button class="btn" type="button" id="editor-link-cancel">취소</button><button class="btn btn-primary" type="submit">링크 삽입</button></div></form>`;
    $("#modal-root").append(dialog);
    const finish=()=>{dialog.close();dialog.remove();if(editor.isConnected){editor.focus();const selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);}editorLinkRange=null;};
    dialog.querySelector("#editor-link-cancel").onclick=finish;
    dialog.oncancel=event=>{event.preventDefault();finish();};
    dialog.addEventListener("keydown",event=>{event.stopPropagation();if(event.key==="Escape"){event.preventDefault();finish();}});
    dialog.querySelector("form").onsubmit=event=>{event.preventDefault();const text=dialog.querySelector("#editor-link-text").value.trim();let url;try{url=new URL(dialog.querySelector("#editor-link-url").value.trim());if(!["http:","https:"].includes(url.protocol)||url.username||url.password)throw Error();}catch{dialog.querySelector("#editor-link-error").textContent="http:// 또는 https://로 시작하는 주소를 입력해 주세요.";return;}if(!text)return;
      if(!editor.contains(range.commonAncestorContainer)){dialog.querySelector("#editor-link-error").textContent="작성 위치가 변경되었습니다. 취소 후 다시 삽입해 주세요.";return;}
      const link=document.createElement("a");link.href=url.href;link.target="_blank";link.rel="noopener noreferrer";link.textContent=text;range.deleteContents();range.insertNode(link);range.setStartAfter(link);range.collapse(true);const space=document.createTextNode(" ");range.insertNode(space);range.setStartAfter(space);range.collapse(true);editor.dispatchEvent(new Event("input",{bubbles:true}));finish();};
    dialog.showModal();dialog.querySelector(range.toString()?"#editor-link-url":"#editor-link-text").focus();
  }
  function menu(x, y, items) {
    const root = $("#context-root");
    root.innerHTML = `<div class="menu" role="menu">${items.map((item) => `<button role="menuitem" data-action="${item.action}" ${item.extra || ""} class="${item.danger ? "danger" : ""}">${icon(item.icon || "file", 15)}${esc(item.label)}</button>`).join("")}</div>`;
    const el = $(".menu");
    el.style.left =
      Math.max(8, Math.min(x, innerWidth - el.offsetWidth - 8)) + "px";
    el.style.top =
      Math.max(8, Math.min(y, innerHeight - el.offsetHeight - 8)) + "px";
    $("button", el)?.focus();
  }
  function refreshSelection() {
    const count = $("#selected-count");
    if (count)
      count.textContent = state.selected.size
        ? state.selected.size + "명 선택"
        : "이름을 더블클릭해 쪽지를 보내세요";
    const summary = $("#selection-summary");
    if (summary)
      summary.textContent = state.selected.size
        ? state.selected.size + "명에게 보내기"
        : "함께 나누면 더 쉬워져요";
    $$('[data-action="group-mail"],[data-action="group-chat"]').forEach(
      (b) => (b.disabled = !state.selected.size),
    );
    if ($("#select-all"))
      $("#select-all").checked =
        state.selected.size === state.data.people.length;
  }
  function refreshCounts() {
    [
      ["inbox", unreadMails()],
      ["chat", unreadChats()],
    ].forEach(([name, count]) => {
      const nav = $('[data-action="nav-' + name + '"]');
      if (nav) {
        $(".badge", nav)?.remove();
        if (count)
          nav.insertAdjacentHTML(
            "beforeend",
            '<b class="badge">' + count + "</b>",
          );
      }
    });
    $$(".folder").forEach((el) => {
      const f = el.dataset.folder;
      const count =
        f === "important"
          ? state.data.mails.filter((m) => m.important && m.folder !== "trash")
              .length
          : f === "unread"
            ? unreadMails()
            : state.data.mails.filter((m) => m.folder === f).length;
      el.lastElementChild.textContent = count;
    });
  }
  function refreshMail() {
    refreshCounts();
    if ($("#mail-list")) {
      $("#mail-list").innerHTML = mailListHTML();
      initMailColumns();
    }
    if ($("#mail-detail")) {
      const m = state.data.mails.find((m) => m.id === state.mail);
      $("#mail-detail").innerHTML = m
        ? mailDetail(m)
        : empty(
            "쪽지를 선택해 주세요",
            "목록에서 읽고 싶은 쪽지를 선택하세요.",
            "mail",
          );
    }
  }
  document.addEventListener("click", (e) => {
    const target = e.target.closest("[data-action]");
    if (!target) {
      if (!e.target.closest(".menu")) $("#context-root").innerHTML = "";
      if (e.target.classList.contains("overlay")) closeModal();
      return;
    }
    const action = target.dataset.action,
      d = target.dataset;
    $("#context-root").innerHTML = "";
    if(action === "window-minimize" || action === "window-close" || action === "window-maximize"){windowApi?.windowAction(action.slice(7));return;}
    if(action === "makeup-notice"){if(target.closest(".school-work-menu"))closeModal();composeMail({noticeType:"makeup",title:"보강 안내",to:[...state.selected]});return;}
    if(action === "lesson-change"){if(target.closest(".school-work-menu"))closeModal();composeMail({noticeType:"lessonChange",title:"수업 변경 안내",to:[...state.selected]});return;}
    if(action === "editor-link"){insertEditorLink();return;}
    if(action === "class-teachers"){classTeachersForm();return;}
    if(action === "bell-schedule"){if(target.closest(".school-work-menu"))closeModal();bellScheduleForm();return;}
    if(action === "nav-school-work"){openModal("교무업무",'<div class="school-work-menu">'+button("makeup-notice","보강 안내","calendar")+button("lesson-change","수업 변경","calendar")+button("bell-schedule","일과표","clock")+'</div>',button("close-modal","닫기"));return;}
    if(action === "back-main"){state.page="people";render();return;}
    if(action === "import-server"){native.importConnection().then(value=>{if(value?.error)toast("서버 연결 실패",value.error);else if(value){network.connection=value;login();toast("서버 연결 파일을 가져왔어요",value.schoolName);}});return;}
    if (action.startsWith("nav-")) {
      const page=action.slice(4);
      if(windowApi&&["inbox","calendar","announcements","links"].includes(page)){windowApi.openWorkspace(page);return;}
      state.page = action.slice(4);
      state.search = "";
      state.mobileList = state.page === "chat" && innerWidth <= 600;
      state.reply = null;
      render();
      return;
    }
    switch (action) {
      case "demo-login":
        state.user = "교사A";
        state.page = "people";
        save();
        render();
        break;
      case "logout":
        if(native) network.logout();
        state.user = null;
        state.settings.autoLogin = false;
        state.floating = null;
        save();
        closeModal();
        render();
        break;
      case "close-modal":
        closeModal();
        break;
      case "group":
        state.group = d.group;
        renderPage();
        break;
      case "dept-toggle":
        state.collapsed.has(state.group+":"+d.dept)
          ? state.collapsed.delete(state.group+":"+d.dept)
          : state.collapsed.add(state.group+":"+d.dept);
        $("#org-tree").innerHTML = orgTree();
        break;
      case "person-select":
        if(e.detail===0)composeMail({to:[d.person]});
        break;
      case "person-chat":
        openPersonChat([d.person]);
        break;
      case "person-mail":
        composeMail({ to: [d.person] });
        break;
      case "group-chat":
        openPersonChat([...state.selected]);
        break;
      case "group-mail":
        composeMail({ to: [...state.selected] });
        break;
      case "compose-mail":
        composeMail();
        break;
      case "toggle-today":
        if(requestedToday){windowApi?.toggleToday(false);return;}
        state.showToday = !state.showToday;
        if(windowApi)windowApi.toggleToday(state.showToday,state.settings.calendarPosition);
        else $(".today-drawer")?.classList.toggle("open",state.showToday);
        $$('[data-action="toggle-today"]').forEach(el=>el.setAttribute('aria-pressed',String(state.showToday)));
        break;
      case "today-prev":
        state.today = addDays(state.today, -1);
        render();
        break;
      case "today-next":
        state.today = addDays(state.today, 1);
        render();
        break;
      case "today-reset":
        state.today = Mock.today;
        render();
        break;
      case "open-room":
        if(windowApi){windowApi.openChat(d.room);const room=state.data.rooms.find(r=>r.id===d.room);if(room){room.unread=0;save();}return;}
        state.room = d.room;
        state.reply = null;
        state.chatQuery = "";
        state.chatSearch = false;
        state.members = false;
        state.mobileList = false;
        const room = state.data.rooms.find((r) => r.id === d.room);
        if (room) room.unread = 0;
        save();
        render();
        $(".chat-layout")?.classList.add("conversation-open");
        break;
      case "chat-back":
        state.mobileList = true;
        renderPage();
        $(".chat-layout")?.classList.remove("conversation-open");
        break;
      case "pop-chat":
        if(windowApi){windowApi.openChat(d.room);return;}
        state.floating = d.room;
        renderFloating();
        break;
      case "close-chat":
        state.floating = null;
        renderFloating();
        break;
      case "chat-search":
        state.chatSearch = !state.chatSearch;
        state.chatQuery = "";
        if (state.page === "chat") renderPage();
        renderFloating();
        $("[data-chat-search]:not([hidden])")?.focus();
        break;
      case "chat-members":
        state.members = !state.members;
        if (state.page === "chat") renderPage();
        renderFloating();
        break;
      case "cancel-reply":
        state.reply = null;
        $$(".reply-preview").forEach((el) => (el.hidden = true));
        break;
      case "reply-message": {
        const r = state.data.rooms.find((r) => r.id === d.room),
          m = r?.messages.find((m) => m.id === d.message);
        if (m) {
          state.reply = { room: r.id, text: m.text };
          $$(`[data-chat-form="${r.id}"] .reply-preview`).forEach((el) => {
            el.hidden = false;
            $("span", el).textContent = "답장 · " + m.text.slice(0, 55);
          });
          $(`[data-chat-input="${r.id}"]`)?.focus();
        }
        break;
      }
      case "like-message": {
        const m = state.data.rooms
          .find((r) => r.id === d.room)
          ?.messages.find((m) => m.id === d.message);
        if (m) {
          m.liked = !m.liked;
          m.likes = (m.likes || 0) + (m.liked ? 1 : -1);
          save();
          updateChat(d.room);
        }
        break;
      }
      case "new-chat":
        openModal(
          "새 대화 시작하기",
          `<p class="muted" style="font-size:12px;margin-bottom:12px">함께 이야기할 선생님을 골라 주세요.</p><div class="search">${icon("search", 16)}<input class="input" id="new-chat-search" aria-label="초대할 선생님 검색" placeholder="이름 검색"></div><div id="new-chat-people" style="max-height:350px;overflow:auto;margin-top:12px">${state.data.people.map((p, i) => `<label class="person" data-new-chat-person="${p.id}"><input type="checkbox" value="${p.id}" name="chat-invite">${avatar(p, "small", i)}<span>${esc(p.name)} <small class="muted">${esc(p.department)}</small></span></label>`).join("")}</div>`,
          button("close-modal", "취소") +
            button("create-chat", "대화 시작", "chat", "btn-primary"),
        );
        break;
      case "create-chat": {
        const ids = $$('[name="chat-invite"]:checked').map((el) => el.value);
        if (!ids.length) {
          toast(
            "선생님을 선택해 주세요",
            "한 명 이상 선택하면 대화를 시작할 수 있어요.",
          );
          break;
        }
        closeModal();
        openPersonChat(ids);
        break;
      }
      case "pin-room":
      case "mute-room": {
        const r = state.data.rooms.find((r) => r.id === d.room);
        if (r) {
          r[action === "pin-room" ? "pinned" : "muted"] =
            !r[action === "pin-room" ? "pinned" : "muted"];
          save();
          renderPage();
          renderFloating();
        }
        break;
      }
      case "leave-room":
        confirmModal(
          "대화방에서 나갈까요?",
          "이 브라우저에 저장된 대화 내용도 함께 삭제됩니다.",
          "confirm-leave",
          d.room,
        );
        break;
      case "confirm-leave":
        state.data.rooms = state.data.rooms.filter((r) => r.id !== d.id);
        if (state.floating === d.id) state.floating = null;
        save();
        closeModal();
        render();
        break;
      case "mail-folder":
        state.folder = d.folder;
        state.mail = null;
        state.mailSearch = "";
        renderPage();
        break;
      case "open-mail": {
        const m = state.data.mails.find((m) => m.id === d.mail);
        if (m) {
          state.mail = m.id;
          m.unread = false;
          save();
          refreshMail();
          $(".mail-workspace")?.classList.add("show-detail");
        }
        break;
      }
      case "mail-back":
        state.mail = null;
        $(".mail-workspace")?.classList.remove("show-detail");
        break;
      case "star-mail": {
        const m = state.data.mails.find((m) => m.id === d.mail);
        if (m) {
          m.important = !m.important;
          save();
          refreshMail();
        }
        break;
      }
      case "delete-mail":
        confirmModal(
          "쪽지를 휴지통으로 옮길까요?",
          "휴지통에서 언제든 다시 복원할 수 있어요.",
          "confirm-delete-mail",
          d.mail,
        );
        break;
      case "confirm-delete-mail": {
        const m = state.data.mails.find((m) => m.id === d.id);
        if (m) {
          m.previousFolder = m.folder;
          m.folder = "trash";
          state.mail = null;
          save();
          closeModal();
          render();
          toast("휴지통으로 옮겼어요");
        }
        break;
      }
      case "restore-mail": {
        const m = state.data.mails.find((m) => m.id === d.mail);
        if (m) {
          m.folder = m.previousFolder || "inbox";
          state.mail = null;
          save();
          render();
          toast("쪽지를 복원했어요");
        }
        break;
      }
      case "recall-mail":
        confirmModal(
          "아직 읽지 않은 쪽지를 회수할까요?",
          "체험 화면에서 안 읽은 수신자의 상태를 회수됨으로 바꿉니다.",
          "confirm-recall",
          d.mail,
        );
        break;
      case "confirm-recall": {
        const m = state.data.mails.find((m) => m.id === d.id);
        if (m) {
          m.receipts = m.receipts.map((r) => (r === "unread" ? "recalled" : r));
          save();
          closeModal();
          refreshMail();
          toast(
            "회수 상태를 반영했어요",
            "이미 읽은 수신자의 상태는 유지됩니다.",
          );
        }
        break;
      }
      case "reply-mail":
      case "reply-all":
      case "forward-mail": {
        const m = state.data.mails.find((m) => m.id === d.mail);
        if (m)
          composeMail({
            to:
              action === "forward-mail"
                ? []
                : action === "reply-all"
                  ? [...new Set([m.from, ...m.to].filter((id) => id !== "me"))]
                  : m.from === "me"
                    ? m.to
                    : [m.from],
            title: (action === "forward-mail" ? "전달: " : "답장: ") + m.title,
            body: "\n\n──────── 원본 쪽지 ────────\n" + m.body,
            richBody:"<br><br>──────── 원본 쪽지 ────────<br>"+safeRichHTML(m.html||esc(m.body).replace(/\n/g,"<br>")),
            files: action === "forward-mail" ? m.files : [],
            forwarded: action === "forward-mail",
          });
        break;
      }
      case "print-mail":
        window.print();
        break;
      case "download-file":
        downloadFile(
          state.data.mails.find((m) => m.id === d.mail),
          Number(d.file),
        );
        break;
      case "add-recipient": {
        const kind = d.kind || "to";
        if (!composeDraft[kind].includes(d.person)) composeDraft[kind].push(d.person);
        const checkbox = $(`[data-compose-person="${d.person}"]`); if(kind === "to" && checkbox) checkbox.checked=true;
        const box = $("#" + (kind === "to" ? "recipient" : "cc") + "-box");
        const chips = document.createElement("span");
        chips.innerHTML = recipientChips(kind);
        $$(".chip", box).forEach((el) => el.remove());
        Array.from(chips.children).forEach((el) =>
          box.insertBefore(el, $("input", box)),
        );
        $("input", box).value = "";
        $(".suggestions", box).hidden = true;
        $("input", box).focus();
        break;
      }
      case "remove-recipient":
        composeDraft[d.kind || "to"] = composeDraft[d.kind || "to"].filter(
          (id) => id !== d.person,
        );
        target.closest(".chip").remove();
        if ((d.kind || "to") === "to") { const checkbox=$(`[data-compose-person="${d.person}"]`); if(checkbox) checkbox.checked=false; }
        break;
      case "remove-file":
        composeDraft.files.splice(Number(d.file), 1);
        $("#compose-files").innerHTML = composeFilesHTML();
        break;
      case "editor-bold":
      case "editor-italic":
      case "editor-underline":
      case "editor-list":
      case "editor-clear":
        $("#mail-editor").focus();
        document.execCommand(
          {
            "editor-bold": "bold",
            "editor-italic": "italic",
            "editor-underline": "underline",
            "editor-list": "insertUnorderedList",
            "editor-clear": "removeFormat",
          }[action],
        );
        break;
      case "mail-calendar": {
        const m = state.data.mails.find((m) => m.id === d.mail);
        if (m?.eventId) {
          const event = state.data.events.find((ev) => ev.id === m.eventId);
          if (event) viewEvent(event.id);
          else if(state.data.deadlines.some(item=>item.id===m.eventId)) eventForm({...state.data.deadlines.find(item=>item.id===m.eventId),type:"deadline"});
          else
            toast("연동된 일정을 찾을 수 없어요", "일정을 다시 등록해 주세요.");
        } else if (m) eventForm({ title: m.title, mail: m.id });
        break;
      }
      case "week-prev":
        state.week = addDays(state.week, -7);
        state.expanded = null;
        renderPage();
        break;
      case "week-next":
        state.week = addDays(state.week, 7);
        state.expanded = null;
        renderPage();
        break;
      case "week-reset":
        state.week = weekStart(Mock.today);
        state.expanded = null;
        renderPage();
        break;
      case "expand-day":
        state.expanded = state.expanded === d.date ? null : d.date;
        renderPage();
        break;
      case "calendar-jump":
        state.week = weekStart(d.date);
        state.today = d.date;
        renderPage();
        break;
      case "monthly":
        monthAnchor = state.today;
        monthly();
        break;
      case "month-prev":
      case "month-next": {
        const date = parseDate(monthAnchor);
        date.setDate(1);
        date.setMonth(date.getMonth() + (action === "month-next" ? 1 : -1));
        monthAnchor = dateKey(date);
        $(".modal-body").innerHTML = monthlyBody();
        break;
      }
      case "month-date":
        eventForm({ date: d.date });
        break;
      case "month-theme":
        state.settings.dark = !state.settings.dark;
        save();
        applySettings();
        target.innerHTML =
          icon(state.settings.dark ? "sun" : "moon", 16) +
          (state.settings.dark ? "밝게 보기" : "어둡게 보기");
        break;
      case "add-event":
        eventForm();
        break;
      case "view-event":
        viewEvent(d.event);
        break;
      case "edit-event": {
        const event = state.data.events.find((e) => e.id === d.event);
        if (event) eventForm(event);
        break;
      }
      case "delete-event":
        confirmModal(
          "일정을 삭제할까요?",
          "저장된 일정이 오늘 일정과 캘린더에서 함께 사라집니다.",
          "confirm-delete-event",
          d.event,
        );
        break;
      case "confirm-delete-event":
        state.data.events = state.data.events.filter((ev) => ev.id !== d.id);
        state.data.deadlines = state.data.deadlines.filter(item => item.id !== d.id);
        state.data.notes = state.data.notes.filter(item => item.id !== d.id);
        state.data.mails.forEach((m) => {
          if (m.eventId === d.id) delete m.eventId;
        });
        save();
        closeModal();
        render();
        toast("일정을 삭제했어요");
        break;
      case "event-note": {
        const event = state.data.events.find((ev) => ev.id === d.event);
        if (event) toast(event.title, event.note, "calendar");
        break;
      }
      case "view-note": {
        const n = state.data.notes.find((n) => n.id === d.note);
        if (n)
          openModal(
            "기억해 둘 메모",
            `<span class="chip">${fmtDate(n.date)} · ${n.time}</span><p style="margin-top:20px;white-space:pre-wrap">${esc(n.text)}</p>`,
            button("close-modal", "닫기") +
              button(
                "delete-note",
                "메모 삭제",
                "trash",
                "btn-danger",
                `data-note="${n.id}"`,
              ),
          );
        break;
      }
      case "delete-note":
        state.data.notes = state.data.notes.filter((n) => n.id !== d.note);
        save();
        closeModal();
        renderPage();
        break;
      case "deadline-detail": {
        const deadline = state.data.deadlines.find((n) => n.id === d.deadline);
        if (deadline)
          openModal(
            deadline.title,
            `<p>제출 기한: ${fmtDate(deadline.date)}${deadline.dueTime ? ` ${esc(deadline.dueTime)}까지` : " · 시간 미지정"}</p>${deadline.note ? `<p style="white-space:pre-wrap">${esc(deadline.note)}</p>` : ""}<p class="muted" style="margin-top:12px">${deadline.done ? "완료한 업무입니다." : "제출한 뒤 완료로 표시해 주세요."}</p>`,
            button("close-modal", "닫기") + button("edit-deadline", "수정", "note", "", `data-deadline="${deadline.id}"`) +
              button(
                "toggle-deadline",
                deadline.done ? "미완료로 변경" : "완료로 표시",
                "check",
                "btn-primary",
                `data-deadline="${deadline.id}"`,
              ),
          );
        break;
      }
      case "demo-deadline": {
        if(native)break;
        openModal("수신 메시지 일정 체험",`<form id="demo-deadline-form" class="event-form"><p>메시지를 받으면 내 캘린더에 시작 시간 없는 마감 일정이 등록됩니다.</p><label>메시지 내용<textarea class="input" id="demo-deadline-text" maxlength="5000" rows="4" required>내일 점심시간 전까지 자료를 제출해 주세요.</textarea></label><label>발송 시각 (한국 시간)<input class="input" id="demo-deadline-sent" type="datetime-local" value="${window.IeumDeadlines.sentDate(Date.now())}T09:00" required></label><p class="muted">오전 중·점심시간 전까지는 12:05, 날짜만 있으면 16:00입니다. 해당 날짜의 일과표를 바꾸면 4교시 종료 시간을 적용합니다.</p><div id="demo-deadline-result" role="status"></div></form>`,button("close-modal","닫기")+'<button type="submit" class="btn btn-primary" form="demo-deadline-form">수신 체험</button>');
        let messageId=null;
        $("#demo-deadline-form").onsubmit=event=>{
          event.preventDefault();const text=$("#demo-deadline-text").value,at=$("#demo-deadline-sent").value+':00+09:00';
          const entries=window.IeumDeadlines.extract(text,at,state.data);
          if(!entries.length){$("#demo-deadline-result").textContent="인식한 마감 일정이 없습니다. 예: 내일까지 제출, 다음 주 수요일 오후 3시까지 회신";return;}
          if(!messageId){messageId=uid("user-incoming");state.data.mails.unshift({id:messageId,from:state.data.people[0].id,to:["me"],title:"마감 안내 체험",body:text,createdAt:new Date(at).getTime(),date:window.IeumDeadlines.sentDate(at),time:at.slice(11,16),folder:"inbox",files:[],receipts:["unread"],unread:true});}
          save();const added=state.data.deadlines.filter(d=>d.source?.id===messageId);
          $("#demo-deadline-result").textContent=added.map(d=>`${d.date} ${d.dueTime} 마감`).join(" / ")+" · 다시 눌러도 중복 등록되지 않습니다.";
          if(added[0]){state.today=added[0].date;state.week=weekStart(added[0].date);}render();
        };
        break;
      }
      case "edit-deadline": {
        const item=state.data.deadlines.find(d=>d.id===target.dataset.deadline);
        if(item)eventForm({...item,type:"deadline"});
        break;
      }
      case "toggle-deadline": {
        const item = state.data.deadlines.find((d1) => d1.id === d.deadline);
        item.done = !item.done;
        save();
        closeModal();
        renderPage();
        break;
      }
      case "checklist":
        openModal(
          "나만의 체크리스트",
          checklistPanel(),
          button("close-modal", "완료", "", "btn-primary"),
        );
        break;
      case "remove-task":
        state.data.tasks = state.data.tasks.filter((t) => t.id !== d.task);
        save();
        if ($("#modal-root").firstChild) {
          $(".modal-body").innerHTML = checklistPanel();
        } else renderPage();
        break;
      case "settings":
        settingsModal();
        break;
      case "font-minus":
      case "font-plus": {
        const key = d.setting,
          limits = key === "mailFont" ? [12, 24] : [12, 22];
        state.settings[key] = Math.max(
          limits[0],
          Math.min(
            limits[1],
            state.settings[key] + (action === "font-plus" ? 1 : -1),
          ),
        );
        $("#setting-" + key).textContent = state.settings[key] + "px";
        applySettings();
        save();
        break;
      }
      case "password-info":
        if(native){changePasswordModal();return;}
        toast(
          "체험 화면에는 비밀번호가 없어요",
          "실제 인증 서버를 연결한 뒤 제공할 기능입니다.",
        );
        break;
      case "notification-center":
        openModal(
          "학교의 새로운 소식",
          `<p class="muted" style="font-size:12px;margin-bottom:15px">현재 ${unreadMails()}개의 안 읽은 쪽지와 ${unreadChats()}개의 새 대화가 있어요.</p>${
            state.data.mails
              .filter((m) => m.unread && m.folder === "inbox")
              .map(
                (m) =>
                  `<button class="mail-row" data-action="notification-mail" data-mail="${m.id}"><span class="chip ${m.important ? "orange" : ""}">${m.important ? "중요 안내" : "새 쪽지"}</span><strong style="display:block;margin-top:10px">${esc(mailSubject(m))}</strong><small class="muted">${esc(person(m.from).name)} · ${m.time}</small></button>`,
              )
              .join("") ||
            empty(
              "모두 확인했어요",
              "새로운 소식이 오면 여기에 모아둘게요.",
              "bell",
            )
          }`,
          button("notification-test", "알림 테스트", "bell") +
            button("close-modal", "닫기"),
        );
        break;
      case "notification-mail":
      case "announcement-open":
        closeModal();
        state.page = "inbox";
        state.folder = "inbox";
        state.mail = d.mail;
        const mail = state.data.mails.find((m) => m.id === d.mail);
        if (mail) mail.unread = false;
        save();
        render();
        break;
      case "notification-test":
        [
          [
            "message",
            "새 쪽지가 도착했어요",
            "홍길동 선생님 · 회의 자료 확인 부탁드려요.",
          ],
          [
            "message_important",
            "중요 안내",
            "행사 운영 계획서를 확인해 주세요.",
          ],
          ["calendar", "곧 시작할 일정", "15:00 · 교과협의회"],
          [
            "readreceipt",
            "쪽지를 읽었어요",
            "교사A 선생님이 예시 쪽지를 확인했습니다.",
          ],
          ["chat_poll", "대화방 투표", "협의회 진행 시간을 선택해 주세요."],
          ["security", "공용 PC 사용 안내", "사용을 마치면 로그아웃해 주세요."],
        ].forEach(([type, title, body], i) =>
          setTimeout(() => toast(title, body, type), i * 130),
        );
        break;
      case "add-shortcut":
        openModal(
          "바로가기 추가",
          `<form id="shortcut-form" class="event-form"><label>이름<input id="shortcut-title" class="input" maxlength="60" required></label><label>웹 주소<input id="shortcut-url" type="url" class="input" placeholder="https://" required></label><label>설명<input id="shortcut-desc" class="input" maxlength="120"></label><div id="shortcut-error" class="form-error" role="alert"></div></form>`,
          button("close-modal", "취소") +
            '<button class="btn btn-primary" type="submit" form="shortcut-form">추가하기</button>',
        );
        break;
    }
  });
  document.addEventListener("submit", async (e) => {
    if (e.target.id === "login-form") {
      e.preventDefault();
      const name = $("#login-name").value.trim();
      if (!name) {
        $("#login-error").textContent = "이름을 입력해 주세요.";
        return;
      }
      if(native){
        const submit=$("#login-form button[type=submit]");submit.disabled=true;$("#login-error").textContent="";
        try{const user=await network.login(name,$("#login-password").value);if(user.mustChange)changePasswordModal(true);}
        catch(error){$("#login-error").textContent=error.message;}
        finally{if(submit.isConnected)submit.disabled=false;}
        return;
      }
      state.user = name;
      state.settings.autoLogin = $("#remember-login").checked;
      state.page = "people";
      save();
      render();
    } else if (e.target.matches("[data-chat-form]")) {
      e.preventDefault();
      const rid = e.target.dataset.chatForm,
        input = $("textarea", e.target),
        text = input.value.trim(),
        room = state.data.rooms.find((r) => r.id === rid);
      if (!text || !room) return;
      room.messages.push({
        id: uid("user-message"),
        sender: "me",
        text,
        date: Mock.today,
        time: currentTime(),
        likes: 0,
        liked: false,
        reply: state.reply?.room === rid ? state.reply.text : "",
      });
      room.unread = 0;
      state.reply = null;
      if (!(await save())) return;
      input.value = "";
      input.style.height = "43px";
      $("button[type=submit]", e.target).disabled = true;
      $$(".reply-preview").forEach((el) => (el.hidden = true));
      updateChat(rid);
      $$(`[data-message-room="${rid}"]`).forEach(
        (el) => (el.scrollTop = el.scrollHeight),
      );
      if (state.page === "chat") {
        $$(".room").forEach((el) => {
          const r = state.data.rooms.find((r) => r.id === el.dataset.room);
          if (r)
            $(".room-info p", el).textContent = r.messages.at(-1)?.text || "";
        });
      }
    } else if (e.target.id === "task-form") {
      e.preventDefault();
      const title = $("#task-title").value.trim();
      if (!title) return;
      state.data.tasks.push({ id: uid("user-task"), title, done: false });
      save();
      if ($("#modal-root").firstChild)
        $(".modal-body").innerHTML = checklistPanel();
      else renderPage();
    } else if (e.target.id === "shortcut-form") {
      e.preventDefault();
      const url = $("#shortcut-url").value.trim(),
        title = $("#shortcut-title").value.trim();
      if (!title) return;
      try {
        const parsed = new URL(url);
        if (!["https:", "http:"].includes(parsed.protocol))
          throw new Error("protocol");
      } catch {
        $("#shortcut-error").textContent =
          "http:// 또는 https:// 웹 주소를 입력해 주세요.";
        return;
      }
      if (!state.data.shortcuts)
        state.data.shortcuts = [
          {
            id: "s0",
            title: "나이스 대국민서비스",
            desc: "교육 행정 관련 서비스",
            url: "https://www.neis.go.kr",
            icon: "school",
          },
          {
            id: "s1",
            title: "에듀넷 · 티클리어",
            desc: "수업과 연구를 위한 교육 자료",
            url: "https://www.edunet.net",
            icon: "file",
          },
          {
            id: "s2",
            title: "학교알리미",
            desc: "학교의 주요 정보를 살펴보세요",
            url: "https://www.schoolinfo.go.kr",
            icon: "users",
          },
        ];
      state.data.shortcuts.push({
        id: uid("user-shortcut"),
        title,
        desc: $("#shortcut-desc").value,
        url,
        icon: "link",
      });
      save();
      closeModal();
      renderPage();
    }
  });
  document.addEventListener("input", (e) => {
    const el = e.target;
    if (el.id === "people-search") {
      state.search = el.value;
      $("#org-tree").innerHTML = orgTree();
    } else if (el.id === "room-search") {
      $$(".room").forEach(
        (row) =>
          (row.hidden = !state.data.rooms
            .find((r) => r.id === row.dataset.room)
            .name.includes(el.value)),
      );
    } else if (el.matches("[data-chat-input]")) {
      const form = el.closest("form");
      $("button[type=submit]", form).disabled = !el.value.trim();
      el.style.height = "auto";
      el.style.height = Math.min(100, el.scrollHeight) + "px";
    } else if (el.matches("[data-chat-search]")) {
      state.chatQuery = el.value;
      updateChat(el.dataset.chatSearch);
      const first = $(`[data-message-room="${el.dataset.chatSearch}"] mark`);
      first?.scrollIntoView({ block: "center" });
    } else if (el.id === "mail-search") {
      state.mailSearch = el.value;
      $("#mail-list").innerHTML = mailListHTML();
      initMailColumns();
    } else if (el.id === "new-chat-search") {
      $$("[data-new-chat-person]").forEach(
        (row) =>
          (row.hidden = !person(row.dataset.newChatPerson).name.includes(
            el.value,
          )),
      );
    }
  });
  document.addEventListener("change", (e) => {
    const el = e.target;
    if (el.matches("[data-compose-person]")) {
      const id=el.dataset.composePerson;
      composeDraft.to=composeDraft.to.filter(value=>value!==id);
      if(el.checked) composeDraft.to.push(id);
      const box=$("#recipient-box"),chips=document.createElement("span");
      chips.innerHTML=recipientChips();
      $$(".chip",box).forEach(chip=>chip.remove());
      Array.from(chips.children).forEach(chip=>box.insertBefore(chip,$("input",box)));
    } else if (el.matches("[data-person-check]")) {
      el.checked
        ? state.selected.add(el.dataset.personCheck)
        : state.selected.delete(el.dataset.personCheck);
      refreshSelection();
    } else if (el.id === "select-all") {
      state.selected = new Set(
        el.checked ? state.data.people.map((p) => p.id) : [],
      );
      $("#org-tree").innerHTML = orgTree();
      refreshSelection();
    } else if (el.matches("[data-dept-select]")) {
      state.data.people
        .filter((p) => groupLabel(p) === el.dataset.deptSelect && matchesPersonSearch(p))
        .forEach((p) =>
          el.checked ? state.selected.add(p.id) : state.selected.delete(p.id),
        );
      $("#org-tree").innerHTML = orgTree();
      refreshSelection();
    } else if (el.matches("[data-deadline],[data-task]")) {
      const item = el.dataset.deadline
        ? state.data.deadlines.find((d) => d.id === el.dataset.deadline)
        : state.data.tasks.find((t) => t.id === el.dataset.task);
      if (item) {
        item.done = el.checked;
        save();
        if ($("#modal-root").firstChild && el.dataset.task)
          $(".modal-body").innerHTML = checklistPanel();
        else renderPage();
      }
    }
  });
  document.addEventListener("keydown", (e) => {
    if (
      e.target.matches("[data-chat-input]") &&
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.isComposing
    ) {
      e.preventDefault();
      e.target.closest("form").requestSubmit();
    }
    if (e.key === "Escape") {
      if ($("#context-root").firstChild) $("#context-root").innerHTML = "";
      else if ($("#modal-root").firstChild) closeModal();
      else if (state.floating) {
        state.floating = null;
        renderFloating();
      }
    }
    if (
      e.target.matches(".mail-row[role=button]") &&
      (e.key === "Enter" || e.key === " ")
    ) {
      e.preventDefault();
      e.target.click();
    }
    const modal = $(".modal");
    if (modal && e.key === "Tab") {
      const focusables = $$(
        'button:not(:disabled),input:not([hidden]),textarea,select,[contenteditable=true],[tabindex="0"]',
        modal,
      ).filter((el) => el.offsetParent !== null);
      const first = focusables[0],
        last = focusables.at(-1);
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  });
  document.addEventListener("dblclick", e=>{const person=e.target.closest('.org-tree .person-line');if(person)composeMail({to:[person.dataset.person]});});
  windowApi?.subscribe(event=>{if(event.kind==='today-panel'&&!requestedToday){state.showToday=event.open;$$('[data-action="toggle-today"]').forEach(el=>el.setAttribute('aria-pressed',String(event.open)));}});
  document.addEventListener("contextmenu", (e) => {
    if(e.target.closest("#mail-editor")){e.preventDefault();captureEditorLink(e);menu(e.clientX,e.clientY,[{action:"editor-link",label:"링크 삽입",icon:"link"}]);return;}
    const p = e.target.closest(".person[data-person]"),
      r = e.target.closest(".room"),
      hours = e.target.closest("[data-day-hours]");
    if (p) {
      e.preventDefault();
      menu(e.clientX, e.clientY, [
        {
          action: "person-mail",
          label: "쪽지 보내기",
          icon: "mail",
          extra: `data-person="${p.dataset.person}"`,
        },
        {
          action: "person-chat",
          label: "대화",
          icon: "chat",
          extra: `data-person="${p.dataset.person}"`,
        },
      ]);
    } else if (r) {
      e.preventDefault();
      const room = state.data.rooms.find((room) => room.id === r.dataset.room);
      menu(e.clientX, e.clientY, [
        {
          action: "pin-room",
          label: room.pinned ? "상단 고정 해제" : "상단에 고정",
          icon: "star",
          extra: `data-room="${room.id}"`,
        },
        {
          action: "mute-room",
          label: room.muted ? "알림 켜기" : "알림 끄기",
          icon: "mute",
          extra: `data-room="${room.id}"`,
        },
        {
          action: "leave-room",
          label: "대화방 나가기",
          icon: "logout",
          danger: true,
          extra: `data-room="${room.id}"`,
        },
      ]);
    } else if (hours && !e.target.closest(".event")) {
      e.preventDefault();
      eventForm({ date: hours.dataset.dayHours });
    }
  });
  let cancelTimelineSelection = null;
  const formatTimelineTime = value => `${String(Math.floor(value/60)).padStart(2,"0")}:${String(value%60).padStart(2,"0")}`;
  document.addEventListener("pointerdown", e => {
    const grid=e.target.closest("[data-calendar-timeline]");
    if(!grid || e.button!==0 || !e.isPrimary || e.target.closest("button,input,a,.event-note") || $("#modal-root").firstChild) return;
    cancelTimelineSelection?.();
    const pointer=e.pointerId, initialY=e.clientY;
    const timeAt=y=>{const rect=grid.getBoundingClientRect();return Math.max(480,Math.min(1080,480+Math.round((y-rect.top)/rect.height*600/15)*15));};
    const anchor=timeAt(e.clientY);let moved=false,range;
    const band=document.createElement("div");band.className="timeline-selection";band.setAttribute("aria-live","polite");grid.append(band);
    const paint=y=>{
      const edge=timeAt(y);let start=Math.min(anchor,edge),end=Math.max(anchor,edge);
      if(start===end){start=Math.min(start,1065);end=start+15;}
      range={start,end};band.style.top=((start-480)/600*100)+"%";band.style.height=((end-start)/600*100)+"%";
      band.textContent=formatTimelineTime(start)+"–"+formatTimelineTime(end);
    };
    const cleanup=()=>{
      band.remove();grid.classList.remove("selecting-time");
      grid.removeEventListener("pointermove",move);grid.removeEventListener("pointerup",finish);
      grid.removeEventListener("pointercancel",cancel);grid.removeEventListener("lostpointercapture",cancel);
      document.removeEventListener("keydown",escape);window.removeEventListener("blur",cancel);
      if(grid.hasPointerCapture(pointer))grid.releasePointerCapture(pointer);
      if(cancelTimelineSelection===cancel)cancelTimelineSelection=null;
    };
    const cancel=()=>cleanup();
    const escape=event=>{if(event.key==="Escape")cancel();};
    const move=event=>{if(event.pointerId!==pointer)return;moved ||= Math.abs(event.clientY-initialY)>=4;paint(event.clientY);};
    const finish=event=>{
      if(event.pointerId!==pointer)return;paint(event.clientY);const valid=moved&&grid.isConnected,date=grid.dataset.calendarTimeline;
      cleanup();if(valid)eventForm({date,start:formatTimelineTime(range.start),end:formatTimelineTime(range.end),type:"personal"});
    };
    paint(e.clientY);grid.classList.add("selecting-time");grid.setPointerCapture(pointer);cancelTimelineSelection=cancel;
    grid.addEventListener("pointermove",move);grid.addEventListener("pointerup",finish);
    grid.addEventListener("pointercancel",cancel);grid.addEventListener("lostpointercapture",cancel);
    document.addEventListener("keydown",escape);window.addEventListener("blur",cancel);e.preventDefault();
  });
  document.addEventListener("dblclick", (e) => {
    const hours = e.target.closest("[data-day-hours]");
    if (hours && !e.target.closest(".event,.event-note")) {
      const y = Math.max(
        0,
        Math.min(570, e.clientY - hours.getBoundingClientRect().top),
      );
      const start = 480 + Math.floor(y / 30) * 30;
      eventForm({
        date: hours.dataset.dayHours,
        start:
          String(Math.floor(start / 60)).padStart(2, "0") +
          ":" +
          String(start % 60).padStart(2, "0"),
        end:
          String(Math.floor((start + 30) / 60)).padStart(2, "0") +
          ":" +
          String((start + 30) % 60).padStart(2, "0"),
      });
    }
  });
  if(desktopDemo)window.addEventListener("storage",event=>{
    if(event.key!=="ieum-v1"||!event.newValue)return;
    try{const saved=JSON.parse(event.newValue);if(!saved.data)return;
      state.data=saved.data;Object.assign(state.settings,saved.settings);
      if($("#modal-root").firstChild)return;
      const drafts=$$("[data-chat-input]").map(el=>[el.dataset.chatInput,el.value]);
      render();drafts.forEach(([id,value])=>{const el=$(`[data-chat-input="${id}"]`);if(el)el.value=value;});
    }catch{}
  });
  window.addEventListener("storage", (e) => {
    if (e.key === "ieum-v1")
      toast(
        "다른 창에서 내용이 변경됐어요",
        "새로고침하면 이 브라우저의 최신 내용을 볼 수 있어요.",
      );
  });
  if(!native&&!Array.isArray(state.data.classTeachers))state.data.classTeachers=JSON.parse(JSON.stringify(Mock.classTeachers));
  if(native){
    network=new IeumBackend(native,{
      data:acceptServerData,
      status(value){connectionStatus=value;const el=$("#connection-status span");if(el)el.textContent=value;$("#connection-status")?.classList.toggle("offline",["연결 끊김","재연결 중","연결 확인 필요"].includes(value));},
      error(message){toast("서버에 저장하지 못했어요",message,"security");},
      expired(){state.user=null;state.profile=null;state.data=JSON.parse(JSON.stringify(Mock));state.floating=null;closeModal();render();}
    });
    render();network.init().then(result=>{if(!result)login();});
  }else {if(desktopDemo)state.user=state.user||"교사A";render();}
})();
