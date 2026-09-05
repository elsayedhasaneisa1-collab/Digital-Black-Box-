const $=s=>document.querySelector(s), $$=s=>document.querySelectorAll(s);
const session=Math.random().toString(36).slice(2,10).toUpperCase();
$("#sessionId").textContent=session;
$("#sessionShort").textContent=session.slice(0,5);

let p=0;
const bootLines=["INITIALIZING SECURE CONNECTION...","VERIFYING ENCRYPTION...","SCANNING INTERFACE...","IDENTITY: UNKNOWN","SYSTEM ONLINE"];
const timer=setInterval(()=>{
  p+=2; $("#progress").style.width=p+"%";
  if(p%20===0) $("#bootText").textContent=bootLines[Math.min(p/20-1,4)];
  if(p>=100){clearInterval(timer);$("#enterBtn").disabled=false;$("#bootText").textContent="CONNECTION ESTABLISHED // ACCESS READY";}
},55);

$("#enterBtn").onclick=()=>{$("#boot").classList.add("hidden");$("#system").classList.remove("hidden")};

$$(".nav").forEach(btn=>btn.onclick=()=>{
  $$(".nav").forEach(x=>x.classList.remove("active"));btn.classList.add("active");
  $$(".panel-view").forEach(x=>x.classList.add("hidden"));$("#"+btn.dataset.target).classList.remove("hidden");
});

const output=$("#output");
function print(t){output.textContent+=t+"\n";output.scrollTop=output.scrollHeight}
print("> SAYODA BLACKBOX TERMINAL");
print("> type 'help' to see available commands.");
$("#cmd").addEventListener("keydown",e=>{
  if(e.key!=="Enter")return;
  const c=e.target.value.trim().toLowerCase(); e.target.value="";
  print("user@sayoda:~$ "+c);
  const answers={
    help:"commands: help | status | scan | secret | clear",
    status:"SYSTEM: ONLINE\nENCRYPTION: AES-256\nNODES: 24\nSESSION: "+session,
    scan:"SCANNING...\nNODE 01 ONLINE\nNODE 07 ONLINE\nNODE 13 ONLINE\nNO THREATS DETECTED.",
    secret:"ACCESS DENIED // hint: complete the missions."
  };
  if(c==="clear"){output.textContent="";return}
  print(answers[c]||"command not found");
});

let done1=false,done2=false;
$$(".mission").forEach(m=>m.onclick=()=>{
  const n=m.dataset.mission;
  if(n==="1"){done1=true;m.querySelector("em").textContent="COMPLETED ✓";m.querySelector("em").classList.add("green")}
  if(n==="2"){done2=true;m.querySelector("em").textContent="COMPLETED ✓";m.querySelector("em").classList.add("green")}
  if(n==="3"){
    if(done1&&done2){m.querySelector("em").textContent="UNLOCKED ✓";m.querySelector("em").classList.add("green");$("#secretMessage").textContent="BLACKBOX CORE // YOU FOUND THE FIRST LAYER."}
    else alert("المهمة مقفولة — أكمل أول مهمتين.");
  }
});
