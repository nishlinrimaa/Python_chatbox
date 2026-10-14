const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE = {
  chats: "pybuddy_chats_v1",
  active: "pybuddy_active_v1",
  progress: "pybuddy_progress_v1",
  theme: "pybuddy_theme_v1"
};
const TOPICS = ["Python basics","Variables","Data types","If statements","For loops","While loops","Functions","Lists","Tuples","Dictionaries","Strings","Classes and objects","Exceptions","Modules","File handling","List comprehensions","Operators","Comments","Debugging"];
let chats = load(STORAGE.chats, []);
let activeChatId = load(STORAGE.active, null);
let progress = load(STORAGE.progress, {questions:0, topics:[], bestScore:null, quizRuns:0});
let quiz = null;
let toastTimer;

function load(key, fallback){try{const value=localStorage.getItem(key);return value?JSON.parse(value):fallback}catch{return fallback}}
function save(key,value){localStorage.setItem(key,JSON.stringify(value))}
function makeId(){return Date.now().toString(36)+Math.random().toString(36).slice(2,8)}
function currentChat(){return chats.find(c=>c.id===activeChatId)}
function ensureChat(){let chat=currentChat();if(!chat){chat={id:makeId(),title:"New conversation",createdAt:Date.now(),messages:[]};chats.unshift(chat);activeChatId=chat.id;persistChats()}return chat}
function persistChats(){save(STORAGE.chats,chats);save(STORAGE.active,activeChatId)}
function showToast(message){const toast=$("#toast");toast.textContent=message;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2200)}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function renderMessage(message){
  const isUser=message.role==="user";
  const row=document.createElement("div");row.className="message-row"+(isUser?" user":"");
  const avatar=document.createElement("div");avatar.className=isUser?"user-avatar":"bot-avatar";avatar.textContent=isUser?"👤":"🐍";
  const content=document.createElement("div");content.className="message-content";
  const meta=document.createElement("div");meta.className="message-meta";meta.textContent=isUser?"YOU":"PYBUDDY";
  const bubble=document.createElement("div");bubble.className="message-bubble";bubble.textContent=message.text;
  content.append(meta,bubble);
  if(!isUser){const tools=document.createElement("div");tools.className="message-tools";const copy=document.createElement("button");copy.className="small-action";copy.textContent="⧉ Copy answer";copy.addEventListener("click",()=>copyText(message.text));tools.append(copy);content.append(tools)}
  row.append(avatar,content);return row;
}
function renderChat(){
  const windowEl=$("#chatWindow");windowEl.replaceChildren();const chat=currentChat();
  if(!chat||chat.messages.length===0){
    const welcome=document.createElement("div");welcome.className="welcome-card";
    const avatar=document.createElement("div");avatar.className="bot-avatar";avatar.textContent="🐍";
    const content=document.createElement("div");content.className="message-content";
    const meta=document.createElement("div");meta.className="message-meta";meta.textContent="PYBUDDY • READY TO HELP";
    const bubble=document.createElement("div");bubble.className="message-bubble";bubble.textContent="Hey there! 👋 I'm your Python learning assistant. Ask me about Python concepts, syntax, or examples. I can also help you practice with quizzes.";
    const suggestions=document.createElement("div");suggestions.className="suggestion-row";
    [["What is Python?","What is Python?"],["Simple program","Show a simple Python program"],["Debugging help","How do I fix Python errors?"]].forEach(([label,q])=>{const b=document.createElement("button");b.textContent=label;b.dataset.question=q;suggestions.append(b)});
    content.append(meta,bubble,suggestions);welcome.append(avatar,content);windowEl.append(welcome);
  }else chat.messages.forEach(m=>windowEl.append(renderMessage(m)));
  windowEl.scrollTop=windowEl.scrollHeight;
}
function setPanel(name){
  $$(".panel").forEach(p=>p.classList.remove("active-panel"));
  const panel=$("#"+name+"Panel");if(panel)panel.classList.add("active-panel");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.panel===name));
  if(name==="history")renderHistory();if(name==="progress")renderProgress();if(name==="chat")renderChat();
  $("#sidebar").classList.remove("open");
}
function topicFor(question,topic){
  const text=(topic||question).toLowerCase();
  return TOPICS.find(t=>text.includes(t.toLowerCase())) || TOPICS.find(t=>text.includes(t.replace(" statements","").replace(" loops","").toLowerCase())) || null;
}
async function sendQuestion(question){
  question=(question||"").trim();if(!question)return;
  const chat=ensureChat();chat.messages.push({role:"user",text:question,at:Date.now()});
  if(chat.title==="New conversation")chat.title=question.length>42?question.slice(0,39)+"…":question;
  progress.questions=(progress.questions||0)+1;
  persistChats();save(STORAGE.progress,progress);renderChat();$("#questionInput").value="";
  $("#sendBtn").disabled=true;$("#sendBtn").textContent="…";
  try{
    const response=await fetch("/api/ask",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({question})});
    if(!response.ok)throw new Error("Request failed");
    const data=await response.json();
    chat.messages.push({role:"assistant",text:data.answer,topic:data.topic,at:Date.now()});
    const topic=topicFor(question,data.topic);
    if(topic&&!progress.topics.includes(topic))progress.topics.push(topic);
    save(STORAGE.progress,progress);persistChats();renderChat();
  }catch(error){
    chat.messages.push({role:"assistant",text:"I couldn't reach the local chatbot server. Check that Flask is still running in the VS Code terminal, then try again."});
    persistChats();renderChat();
  }finally{$("#sendBtn").disabled=false;$("#sendBtn").innerHTML='Send <span>➤</span>'}
}
function newChat(){activeChatId=null;ensureChat();persistChats();renderChat();setPanel("chat");$("#questionInput").focus()}
function renderHistory(){
  const list=$("#historyList");list.replaceChildren();
  if(!chats.length){list.innerHTML='<div class="empty-state">🗂️<br><strong>No saved conversations yet</strong><br>Ask your first question and your chat will appear here.</div>';return}
  chats.forEach(chat=>{
    const item=document.createElement("div");item.className="history-item";
    const icon=document.createElement("div");icon.className="bot-avatar";icon.textContent="💬";
    const open=document.createElement("button");open.className="history-open";
    const title=document.createElement("strong");title.textContent=chat.title;
    const last=document.createElement("small");last.textContent=(chat.messages.at(-1)?.text||"Empty conversation").slice(0,120);
    const date=document.createElement("small");date.textContent=new Date(chat.createdAt).toLocaleString();
    open.append(title,last,date);open.addEventListener("click",()=>{activeChatId=chat.id;persistChats();setPanel("chat")});
    const del=document.createElement("button");del.className="delete-chat";del.textContent="Delete";del.addEventListener("click",()=>{chats=chats.filter(c=>c.id!==chat.id);if(activeChatId===chat.id)activeChatId=null;persistChats();renderHistory();showToast("Conversation deleted")});
    item.append(icon,open,del);list.append(item);
  });
}
function renderProgress(){
  $("#statQuestions").textContent=progress.questions||0;
  $("#statTopics").textContent=(progress.topics||[]).length;
  $("#statBest").textContent=progress.bestScore===null||progress.bestScore===undefined?"—":`${progress.bestScore}/5`;
  const list=$("#topicProgressList");list.replaceChildren();
  const displayed=["Python basics","Variables","Data types","If statements","For loops","While loops","Functions","Lists","Dictionaries","Strings","Classes and objects","Exceptions","Modules","File handling","Debugging"];
  displayed.forEach(topic=>{const done=(progress.topics||[]).includes(topic);const row=document.createElement("div");row.className="topic-progress"+(done?" done":"");const check=document.createElement("span");check.className="checkmark";check.textContent=done?"✓":"";const label=document.createElement("span");label.textContent=topic;row.append(check,label);list.append(row)});
  const count=displayed.filter(t=>(progress.topics||[]).includes(t)).length;$("#topicCount").textContent=`${count} / ${displayed.length}`;
}
const QUIZ_QUESTIONS=[
 {q:"Which function displays text in the terminal?",opts:["input()","print()","type()","show()"],a:1,why:"print() writes values to the output."},
 {q:"Which symbol is used to start a single-line Python comment?",opts:["//","#","<!--","**"],a:1,why:"Python single-line comments begin with #."},
 {q:"What is the first index of a Python list?",opts:["1","-1","0","It has no index"],a:2,why:"Python sequence indexing starts at 0."},
 {q:"Which keyword defines a function?",opts:["func","function","define","def"],a:3,why:"A Python function definition starts with def."},
 {q:"What does range(3) produce when iterated?",opts:["1, 2, 3","0, 1, 2","0, 1, 2, 3","3 only"],a:1,why:"range(3) produces 0, 1, and 2; the stop value is excluded."},
 {q:"Which collection stores key-value pairs?",opts:["list","tuple","dictionary","string"],a:2,why:"Dictionaries map keys to values."},
 {q:"Which operator checks equality?",opts:["=","==",":=","!="],a:1,why:"== compares values; = assigns a value."},
 {q:"Which block can handle an exception?",opts:["try/except","if/else only","for/while","def/return"],a:0,why:"try/except is used to handle exceptions."},
 {q:"Which list method adds an item to the end?",opts:["insert_end()","push()","append()","add_last()"],a:2,why:"append(value) adds one item to the end of a list."},
 {q:"What does len('cat') return?",opts:["2","3","4","cat"],a:1,why:"The string 'cat' contains three characters."}
];
function startQuiz(){
  const pool=[...QUIZ_QUESTIONS].sort(()=>Math.random()-.5);quiz={questions:pool.slice(0,5),index:0,answers:[],locked:false};renderQuizQuestion();
}
function renderQuizQuestion(){
  const card=$("#quizCard");card.replaceChildren();const q=quiz.questions[quiz.index];
  const top=document.createElement("div");top.className="quiz-question-top";top.innerHTML=`<span>QUESTION ${quiz.index+1} OF ${quiz.questions.length}</span><span>${quiz.answers.filter(x=>x!==null).length} answered</span>`;
  const question=document.createElement("div");question.className="quiz-question";question.textContent=q.q;
  const options=document.createElement("div");options.className="quiz-options";
  q.opts.forEach((label,i)=>{const b=document.createElement("button");b.className="quiz-option";b.textContent=String.fromCharCode(65+i)+".  "+label;if(quiz.answers[quiz.index]===i)b.classList.add("selected");b.disabled=quiz.locked;b.addEventListener("click",()=>{quiz.answers[quiz.index]=i;renderQuizQuestion()});options.append(b)});
  const controls=document.createElement("div");controls.className="quiz-controls";
  const back=document.createElement("button");back.className="ghost-btn";back.textContent="← Previous";back.disabled=quiz.index===0;back.addEventListener("click",()=>{quiz.index--;quiz.locked=false;renderQuizQuestion()});
  const next=document.createElement("button");next.className="primary-btn";next.textContent=quiz.index===4?"Finish quiz":"Next question →";next.disabled=quiz.answers[quiz.index]===undefined||quiz.answers[quiz.index]===null;next.addEventListener("click",()=>{if(quiz.index<4){quiz.index++;quiz.locked=false;renderQuizQuestion()}else finishQuiz()});
  controls.append(back,next);card.append(top,question,options,controls);
}
function finishQuiz(){
  const score=quiz.questions.reduce((sum,q,i)=>sum+(quiz.answers[i]===q.a?1:0),0);
  progress.bestScore=progress.bestScore===null||progress.bestScore===undefined?score:Math.max(progress.bestScore,score);progress.quizRuns=(progress.quizRuns||0)+1;save(STORAGE.progress,progress);
  const card=$("#quizCard");card.replaceChildren();const title=document.createElement("h2");title.textContent=`You scored ${score}/5 ${score>=4?"🎉":"💪"}`;
  const p=document.createElement("p");p.className="quiz-feedback";p.textContent=score>=4?"Great work! Keep building on that knowledge.":"Good practice. Review the explanations below, then try another round.";
  const review=document.createElement("div");review.className="quiz-options";
  quiz.questions.forEach((q,i)=>{const row=document.createElement("div");row.className="topic-progress "+(quiz.answers[i]===q.a?"done":"");row.style.display="block";row.style.padding="13px";const head=document.createElement("strong");head.textContent=`${i+1}. ${q.q}`;const detail=document.createElement("div");detail.style.marginTop="7px";detail.style.lineHeight="1.5";detail.textContent=`Your answer: ${q.opts[quiz.answers[i]]||"Not answered"} · Correct answer: ${q.opts[q.a]}. ${q.why}`;row.append(head,detail);review.append(row)});
  const again=document.createElement("button");again.className="primary-btn";again.style.marginTop="18px";again.textContent="Try another quiz";again.addEventListener("click",startQuiz);
  card.append(title,p,review,again);renderProgress();
}
async function copyText(text){try{await navigator.clipboard.writeText(text);showToast("Copied to clipboard")}catch{const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove();showToast("Copied to clipboard")}}

$("#chatForm").addEventListener("submit",e=>{e.preventDefault();sendQuestion($("#questionInput").value)});
$("#questionInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();$("#chatForm").requestSubmit()}});
document.addEventListener("click",e=>{const questionButton=e.target.closest("[data-question]");if(questionButton)sendQuestion(questionButton.dataset.question)});
$("#newChatBtn").addEventListener("click",newChat);$("#historyNewBtn").addEventListener("click",newChat);
$$(".nav-item").forEach(b=>b.addEventListener("click",()=>setPanel(b.dataset.panel)));
$("#startQuizBtn").addEventListener("click",startQuiz);
$("#resetProgressBtn").addEventListener("click",()=>{if(confirm("Reset your learning progress and quiz score? Your saved conversations will remain.")){progress={questions:0,topics:[],bestScore:null,quizRuns:0};save(STORAGE.progress,progress);renderProgress();showToast("Progress reset")}});
$("#themeBtn").addEventListener("click",()=>{const light=!document.body.classList.contains("light");document.body.classList.toggle("light",light);save(STORAGE.theme,light?"light":"dark");$("#themeBtn").textContent=light?"🌙 Switch to dark mode":"☀️ Switch to light mode"});
$("#menuBtn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
document.addEventListener("click",e=>{if(window.innerWidth<=650&&!e.target.closest("#sidebar")&&!e.target.closest("#menuBtn"))$("#sidebar").classList.remove("open")});
if(load(STORAGE.theme,"dark")==="light"){document.body.classList.add("light");$("#themeBtn").textContent="🌙 Switch to dark mode"}
if(!activeChatId||!chats.some(c=>c.id===activeChatId)){activeChatId=null;ensureChat()}renderChat();renderProgress();
