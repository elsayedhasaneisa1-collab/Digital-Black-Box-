const KEY="sayoda_pro_v2";let state=JSON.parse(localStorage.getItem(KEY)||'{"bot":null,"users":[],"logs":[],"replies":[],"offset":0}');let timer=null;
const $=id=>document.getElementById(id);
function save(){localStorage.setItem(KEY,JSON.stringify(state));render()}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function log(m){state.logs.unshift({t:new Date().toLocaleString("ar-EG"),m});state.logs=state.logs.slice(0,300);save()}
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));$(id).classList.add("active");document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===id));window.scrollTo({top:0,behavior:"smooth"})}
document.querySelectorAll(".nav").forEach(x=>x.onclick=()=>showPage(x.dataset.page));
async function api(method,data={}){if(!state.bot)return {ok:false};const r=await fetch(`https://api.telegram.org/bot${state.bot.token}/${method}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});return await r.json()}
async function connectBot(){
 const token=$("botToken").value.trim();if(!token)return alert("من فضلك أدخل توكن البوت.");
 const fake={token};const r=await (async()=>{const x=await fetch(`https://api.telegram.org/bot${token}/getMe`);return await x.json()})().catch(()=>({ok:false}));
 if(!r.ok)return $("botResult").textContent="❌ لم نتمكن من التعرف على البوت. تأكد من التوكن.";
 state.bot={token,info:r.result};state.offset=0;save();log(`تم ربط البوت @${r.result.username}`);$("botResult").textContent="✅ تم التعرف على البوت بنجاح.";startPolling();
}
async function broadcast(){
 if(!state.bot)return alert("أضف البوت أولًا.");const text=$("broadcastText").value.trim();if(!text)return alert("اكتب الرسالة.");
 if(!state.users.length)return alert("لا يوجد مستخدمون في القائمة حتى الآن.");
 let ok=0;for(const u of state.users){const r=await api("sendMessage",{chat_id:u.chatId,text});if(r.ok)ok++}
 $("broadcastResult").textContent=`✅ تم الإرسال إلى ${ok} من ${state.users.length} مستخدم.`;log(`إرسال جماعي: ${ok}/${state.users.length}`);
}
function addReply(){const trigger=$("replyTrigger").value.trim(),answer=$("replyAnswer").value.trim();if(!state.bot)return alert("أضف البوت أولًا.");if(!trigger||!answer)return alert("أكمل بيانات الرد.");state.replies.push({id:Date.now(),trigger,answer});save();log(`إضافة رد تلقائي: ${trigger}`);$("replyTrigger").value="";$("replyAnswer").value=""}
function delReply(id){state.replies=state.replies.filter(x=>x.id!==id);save();log("حذف رد تلقائي")}
async function sendButtons(){
 if(!state.bot)return alert("أضف البوت أولًا.");if(!state.users.length)return alert("لا يوجد مستخدمون بعد.");
 const text=$("buttonText").value.trim();const rows=$("buttonRows").value.split("\n").map(x=>{let [a,u]=x.split("|").map(y=>y.trim());return a&&u?[{text:a,url:u}]:null}).filter(Boolean);
 if(!text||!rows.length)return alert("أكمل الرسالة والأزرار.");
 let ok=0;for(const u of state.users){const r=await api("sendMessage",{chat_id:u.chatId,text,reply_markup:{inline_keyboard:rows}});if(r.ok)ok++}
 alert(`تم إرسال الأزرار إلى ${ok} مستخدم.`);log(`إرسال أزرار إلى ${ok} مستخدم`);
}
async function poll(){
 if(!state.bot)return;const r=await api("getUpdates",{offset:state.offset,timeout:0,allowed_updates:["message"]});if(!r.ok)return;
 for(const u of r.result){state.offset=u.update_id+1;const m=u.message;if(!m||!m.chat)continue;const f=m.from||{};if(!state.users.some(x=>x.id===f.id)){state.users.push({id:f.id,chatId:m.chat.id,name:f.first_name||"",username:f.username||""})}
 for(const rule of state.replies){if((m.text||"").toLowerCase().includes(rule.trigger.toLowerCase()))await api("sendMessage",{chat_id:m.chat.id,text:rule.answer})}}
 save();$("globalStatus").textContent="متصل";$("pollStatus")?.()
}
function startPolling(){if(timer)clearInterval(timer);timer=setInterval(poll,4000);poll()}
function clearUsers(){if(confirm("هل تريد مسح جميع المستخدمين؟")){state.users=[];save();log("تم مسح قائمة المستخدمين")}}
function clearLogs(){state.logs=[];save()}
function enterSite(){$("intro").classList.add("fade");setTimeout(()=>$("intro").remove(),600);$("app").classList.remove("hidden");}
function render(){
 $("userCount").textContent=state.users.length;$("replyCount").textContent=state.replies.length;$("logCount").textContent=state.logs.length;$("audienceCount").textContent=state.users.length;$("usersTotal").textContent=state.users.length;$("sUsers").textContent=state.users.length;$("sReplies").textContent=state.replies.length;$("sLogs").textContent=state.logs.length;
 if(state.bot){$("dashBot").textContent=state.bot.info.first_name||"البوت";$("dashUsername").textContent="@"+state.bot.info.username;$("botResult").textContent="البوت متصل حاليًا: @"+state.bot.info.username;$("connectedBox").innerHTML=`<div class="item"><b>🤖 @${esc(state.bot.info.username)}</b> — ${esc(state.bot.info.first_name||"")}<button class="danger" onclick="disconnectBot()">إزالة البوت</button></div>`}else{$("dashBot").textContent="لم تتم إضافة بوت";$("dashUsername").textContent="أضف التوكن للبدء";$("connectedBox").innerHTML=""}
 $("repliesList").innerHTML=state.replies.map(r=>`<div class="item"><b>${esc(r.trigger)}</b> ← ${esc(r.answer)} <button class="danger" onclick="delReply(${r.id})">حذف</button></div>`).join("")||'<div class="muted">لا توجد ردود حتى الآن.</div>';
 $("usersList").innerHTML=state.users.map(u=>`<div class="item">👤 <b>${esc(u.name||"بدون اسم")}</b> ${u.username?"— @"+esc(u.username):""} <span style="float:left">${esc(u.chatId)}</span></div>`).join("")||'<div class="muted">ستظهر المستخدمون هنا بعد تواصلهم مع البوت.</div>';
 $("logsList").innerHTML=state.logs.map(x=>`<div class="item">${esc(x.t)} — ${esc(x.m)}</div>`).join("")||'<div class="muted">السجل فارغ.</div>';
}
function disconnectBot(){if(confirm("إزالة البوت من هذه اللوحة؟")){state.bot=null;state.offset=0;save();if(timer)clearInterval(timer);log("تمت إزالة البوت")}}
render();

const canvas=$("matrix"),ctx=canvas.getContext("2d");let W,H,cols,drops;function matrix(){W=canvas.width=innerWidth;H=canvas.height=innerHeight;cols=Math.floor(W/15);drops=Array(cols).fill(0)}matrix();addEventListener("resize",matrix);setInterval(()=>{ctx.fillStyle="rgba(3,6,11,.12)";ctx.fillRect(0,0,W,H);ctx.fillStyle="#1598d8";ctx.font="12px monospace";drops.forEach((y,i)=>{ctx.fillText(Math.random()>.5?"1":"0",i*15,y*15);if(y*15>H&&Math.random()>.975)drops[i]=0;drops[i]++})},55);
const lines=["> تهيئة مركز القيادة","> تحميل واجهة SAYODA","> تجهيز أدوات الإدارة","> كل شيء جاهز — أهلاً بك"];let li=0,ci=0;function type(){if(li>=lines.length)return;$("typing").textContent=lines[li].slice(0,ci++);if(ci>lines[li].length){li++;ci=0;setTimeout(type,450)}else setTimeout(type,35)}type();
