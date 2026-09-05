const KEY="sayoda_bot_panel_v1";
let state=JSON.parse(localStorage.getItem(KEY)||'{"bots":[],"users":[],"logs":[],"replies":[],"settings":{"autoReply":true,"pollSeconds":5},"offsets":{}}');
let timers={};

function save(){localStorage.setItem(KEY,JSON.stringify(state));render();}
function log(msg){state.logs.unshift({time:new Date().toLocaleString("ar-EG"),msg});state.logs=state.logs.slice(0,300);save();}
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showPage(x.dataset.page));

async function api(bot,method,data={}){
  const r=await fetch(`https://api.telegram.org/bot${bot.token}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
  return await r.json();
}
async function addBot(){
  const name=document.getElementById("botName").value.trim();
  const token=document.getElementById("botToken").value.trim();
  if(!name||!token)return alert("اكتب اسم البوت والتوكن.");
  const bot={id:crypto.randomUUID(),name,token,info:null};
  const res=await api(bot,"getMe");
  if(!res.ok)return alert("التوكن غير صحيح أو تعذر الاتصال بتيليجرام.");
  bot.info=res.result; state.bots.push(bot); save(); log(`تمت إضافة البوت ${name}`);
  document.getElementById("botName").value="";document.getElementById("botToken").value="";
}
async function checkBot(id){
  const b=state.bots.find(x=>x.id===id); if(!b)return;
  const r=await api(b,"getMe");
  alert(r.ok?`🟢 البوت يعمل\n@${r.result.username}`:`🔴 تعذر الوصول إلى البوت`);
  log(r.ok?`تم فحص البوت ${b.name} — يعمل`:`فشل فحص البوت ${b.name}`);
}
function removeBot(id){state.bots=state.bots.filter(x=>x.id!==id);delete state.offsets[id];save();log("تم حذف بوت");}
function selectedBot(id){return state.bots.find(x=>x.id===id)}

async function sendMessage(){
  const b=selectedBot(document.getElementById("sendBot").value),chat=document.getElementById("chatId").value.trim(),text=document.getElementById("messageText").value;
  if(!b||!chat||!text)return alert("أكمل البيانات.");
  const r=await api(b,"sendMessage",{chat_id:chat,text});
  document.getElementById("sendResult").textContent=r.ok?"✅ تم إرسال الرسالة.":"❌ فشل إرسال الرسالة.";
  log(r.ok?`تم إرسال رسالة من ${b.name}`:`فشل إرسال رسالة من ${b.name}`);
}
async function broadcast(){
  const b=selectedBot(document.getElementById("broadcastBot").value),ids=document.getElementById("broadcastIds").value.split(/\n|,/).map(x=>x.trim()).filter(Boolean),text=document.getElementById("broadcastText").value;
  if(!b||!ids.length||!text)return alert("أكمل البيانات.");
  let ok=0;for(const chat_id of ids){const r=await api(b,"sendMessage",{chat_id,text});if(r.ok)ok++;}
  document.getElementById("broadcastResult").textContent=`✅ تم الإرسال إلى ${ok} من ${ids.length}.`;log(`إرسال جماعي: ${ok}/${ids.length}`);
}
function addReply(){
  const botId=document.getElementById("replyBot").value,trigger=document.getElementById("replyTrigger").value.trim(),answer=document.getElementById("replyAnswer").value;
  if(!botId||!trigger||!answer)return alert("أكمل بيانات الرد.");
  state.replies.push({id:crypto.randomUUID(),botId,trigger,answer});save();log(`تمت إضافة رد تلقائي: ${trigger}`);
}
function deleteReply(id){state.replies=state.replies.filter(x=>x.id!==id);save();log("تم حذف رد تلقائي");}

async function sendButtons(){
  const b=selectedBot(document.getElementById("buttonBot").value),chat=document.getElementById("buttonChat").value.trim(),text=document.getElementById("buttonText").value;
  const rows=document.getElementById("buttonRows").value.split("\n").map(x=>x.trim()).filter(Boolean).map(x=>{const [a,u]=x.split("|").map(y=>y.trim());return a&&u?[{text:a,url:u}]:null}).filter(Boolean);
  if(!b||!chat||!text||!rows.length)return alert("أكمل البيانات.");
  const r=await api(b,"sendMessage",{chat_id:chat,text,reply_markup:{inline_keyboard:rows}});
  alert(r.ok?"✅ تم إرسال الرسالة بالأزرار.":"❌ فشل الإرسال.");
}

async function pollBot(b){
  if(!state.settings.autoReply)return;
  const offset=state.offsets[b.id]||0;
  const r=await api(b,"getUpdates",{offset,timeout:0,allowed_updates:["message"]});
  if(!r.ok)return;
  for(const u of r.result){
    state.offsets[b.id]=u.update_id+1;
    const m=u.message;if(!m||!m.chat)return;
    const user=m.from||{};const exists=state.users.some(x=>x.id===user.id);
    if(!exists)state.users.push({id:user.id,chatId:m.chat.id,name:user.first_name||"",username:user.username||""});
    for(const rule of state.replies.filter(x=>x.botId===b.id)){
      if((m.text||"").toLowerCase().includes(rule.trigger.toLowerCase())) await api(b,"sendMessage",{chat_id:m.chat.id,text:rule.answer});
    }
  }
  save();
}
function startPolling(){
  Object.values(timers).forEach(clearInterval);timers={};
  state.bots.forEach(b=>timers[b.id]=setInterval(()=>pollBot(b),Number(state.settings.pollSeconds)*1000));
  document.getElementById("pollStatus").textContent=state.bots.length?`🟢 الاستقبال يعمل كل ${state.settings.pollSeconds} ثوانٍ طالما الصفحة مفتوحة.`:"لا توجد بوتات.";
}
function saveSettings(){
  state.settings.autoReply=document.getElementById("autoReplyToggle").checked;
  state.settings.pollSeconds=document.getElementById("pollSeconds").value;save();startPolling();log("تم حفظ الإعدادات");
}
function clearUsers(){if(confirm("مسح جميع المستخدمين؟")){state.users=[];save();log("تم مسح المستخدمين");}}
function clearLogs(){state.logs=[];save();}
function loadAudio(){const f=document.getElementById("audioFile").files[0];if(!f)return alert("اختر ملفًا.");document.getElementById("audioPlayer").src=URL.createObjectURL(f);}

function render(){
  document.getElementById("botCount").textContent=state.bots.length;document.getElementById("userCount").textContent=state.users.length;document.getElementById("logCount").textContent=state.logs.length;document.getElementById("replyCount").textContent=state.replies.length;
  document.getElementById("statBots").textContent=state.bots.length;document.getElementById("statUsers").textContent=state.users.length;document.getElementById("statLogs").textContent=state.logs.length;document.getElementById("statReplies").textContent=state.replies.length;
  ["sendBot","broadcastBot","replyBot","buttonBot"].forEach(id=>{const s=document.getElementById(id);const old=s.value;s.innerHTML=state.bots.map(b=>`<option value="${b.id}">${esc(b.name)} — @${esc(b.info?.username||"")}</option>`).join("");if(state.bots.some(b=>b.id===old))s.value=old;});
  document.getElementById("botsList").innerHTML=state.bots.length?state.bots.map(b=>`<div class="item"><b>${esc(b.name)}</b> — @${esc(b.info?.username||"غير معروف")} <span class="online">● متاح</span><button class="danger" onclick="removeBot('${b.id}')">حذف</button><button class="primary" onclick="checkBot('${b.id}')">فحص الحالة</button></div>`).join(""):"لا توجد بوتات بعد.";
  document.getElementById("repliesList").innerHTML=state.replies.length?state.replies.map(r=>`<div class="item"><b>${esc(r.trigger)}</b> ← ${esc(r.answer)} <button class="danger" onclick="deleteReply('${r.id}')">حذف</button></div>`).join(""):"لا توجد ردود تلقائية.";
  document.getElementById("usersList").innerHTML=state.users.length?state.users.map(u=>`<div class="item">👤 ${esc(u.name||"بدون اسم")} — ${esc(u.username?"@"+u.username:"بدون معرف")} — <code>${u.chatId}</code></div>`).join(""):"لا يوجد مستخدمون مستلمون بعد.";
  document.getElementById("logsList").innerHTML=state.logs.map(x=>`<div class="item">${esc(x.time)} — ${esc(x.msg)}</div>`).join("")||"السجل فارغ.";
  document.getElementById("autoReplyToggle").checked=state.settings.autoReply;document.getElementById("pollSeconds").value=state.settings.pollSeconds;
}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
render();startPolling();
