const STARTING_BUDGET=35000;
const products=[
  ["chair-cognac","Cognac Club Chair",1299,"Seating",0,"floor","warm"],
  ["sofa-charcoal","Charcoal Tailored Sofa",2399,"Seating",1,"floor","modern"],
  ["table-walnut","Walnut Coffee Table",849,"Tables",2,"floor","warm"],
  ["lamp-brass","Arc Brass Floor Lamp",489,"Lighting",3,"floor","luxury"],
  ["rug-cream","Handwoven Cream Rug",699,"Decor",4,"floor","warm"],
  ["fig-planter","Fiddle-Leaf Fig",189,"Decor",5,"floor","organic"],
  ["art-abstract","Earthform No. 4",375,"Wall",6,"wall","modern"],
  ["console-walnut","Walnut Media Console",1199,"Storage",7,"floor","modern"],
  ["vase-stone","Hand-Thrown Stone Vase",145,"Decor",8,"surface","organic"],
  ["side-table","Round Walnut Side Table",399,"Tables",9,"floor","warm"],
  ["basket-woven","Woven Floor Basket",119,"Storage",10,"floor","organic"],
  ["lamp-table","Obsidian Table Lamp",279,"Lighting",11,"surface","luxury"],
  ["chair-onyx","Onyx Reading Chair",1499,"Seating",0,"floor","modern"],
  ["sofa-walnut","Walnut Frame Sofa",2899,"Seating",1,"floor","warm"],
  ["table-long","Gallery Coffee Table",1099,"Tables",2,"floor","luxury"],
  ["lamp-aged","Aged Brass Floor Lamp",625,"Lighting",3,"floor","warm"],
  ["rug-wool","Natural Wool Rug",949,"Decor",4,"floor","organic"],
  ["olive-planter","Indoor Olive Tree",249,"Decor",5,"floor","organic"],
  ["art-charcoal","Charcoal Study I",525,"Wall",6,"wall","luxury"],
  ["console-low","Lowline Media Cabinet",1549,"Storage",7,"floor","luxury"],
  ["vase-ivory","Sculptural Ivory Vessel",225,"Decor",8,"surface","modern"],
  ["table-pedestal","Pedestal Drink Table",449,"Tables",9,"floor","modern"],
  ["basket-tall","Tall Seagrass Basket",159,"Storage",10,"floor","organic"],
  ["lamp-ceramic","Ceramic Linen Lamp",349,"Lighting",11,"surface","warm"],
  ["exterior-planter","Black Stone Planter",289,"Exterior",5,"floor","modern"],
  ["exterior-lantern","Architectural Lantern",359,"Exterior",3,"wall","luxury"],
  ["exterior-basket","Covered Parcel Basket",139,"Exterior",10,"floor","organic"]
].map(([id,name,price,category,sprite,placement,style])=>({id,name,price,category,sprite,placement,style}));

const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const els={welcome:$("#welcome"),enter:$("#enter-game"),scene:$("#scene"),layer:$("#object-layer"),door:$("#door-hotspot"),hint:$("#scene-hint"),room:$("#room-label"),corner:$("#corner-label"),dots:$("#corner-dots"),budget:$("#budget"),catalog:$("#catalog"),grid:$("#product-grid"),categories:$("#categories"),owned:$("#owned-count"),inspector:$("#inspector"),selectedName:$("#selected-name"),selectedPrice:$("#selected-price"),scale:$("#scale-control"),rotate:$("#rotate-control"),offers:$("#offers-dialog"),offersGrid:$("#offers"),toast:$("#toast")};
let state={budget:STARTING_BUDGET,room:"exterior",corner:0,objects:[],selected:null,mode:"shop",category:"All",sold:false};
let db;
const corners=["WINDOW WALL","HEARTH WALL","GALLERY WALL","ENTRY WALL"];

const money=n=>`₢${Math.round(n).toLocaleString("en-US")}`;
function product(id){return products.find(p=>p.id===id)}
function toast(message){els.toast.textContent=message;els.toast.classList.add("show");clearTimeout(toast.timer);toast.timer=setTimeout(()=>els.toast.classList.remove("show"),1700)}
function imageStyle(sprite){return `background-image:url('assets/item-${sprite}.webp');background-size:contain;background-position:center;background-repeat:no-repeat`}

function openDB(){return new Promise(resolve=>{const req=indexedDB.open("nth-house",1);req.onupgradeneeded=()=>req.result.createObjectStore("save");req.onsuccess=()=>{db=req.result;resolve()};req.onerror=()=>resolve()})}
function load(){return new Promise(resolve=>{if(!db)return resolve();const req=db.transaction("save").objectStore("save").get("ashbury-row");req.onsuccess=()=>{if(req.result)state={...state,...req.result,selected:null};resolve()};req.onerror=()=>resolve()})}
function save(){if(!db)return;const clean={...state,selected:null};db.transaction("save","readwrite").objectStore("save").put(clean,"ashbury-row")}

function showWelcome(){if(matchMedia("(orientation: landscape)").matches)els.welcome.classList.add("hidden")}
async function enterGame(){try{await document.documentElement.requestFullscreen?.();await screen.orientation?.lock?.("landscape")}catch{}showWelcome();setTimeout(()=>els.hint.classList.add("fade"),3200)}

function renderScene(){
  const interior=state.room==="living";
  els.scene.className=`scene ${interior?"interior":"exterior"} corner-${state.corner+1}`;
  els.room.textContent=`ASHBURY ROW · ${interior?"LIVING ROOM":"EXTERIOR"}`;
  els.corner.textContent=interior?corners[state.corner]:"FRONT APPROACH";
  els.hint.textContent=interior?"Swipe to turn · tap an object to edit":"Double tap the door to enter";
  els.dots.innerHTML=interior?corners.map((_,i)=>`<i class="${i===state.corner?"active":""}"></i>`).join(""):"";
  els.budget.textContent=money(state.budget);
  renderObjects();renderCatalog();save();
}

function renderObjects(){
  els.layer.innerHTML="";
  state.objects.filter(o=>!o.stored&&o.room===state.room&&(state.room==="exterior"||o.corner===state.corner)).sort((a,b)=>a.z-b.z).forEach(o=>{
    const p=product(o.productId);if(!p)return;
    const el=document.createElement("div");el.className=`placed-object${state.selected===o.uid?" selected":""}`;el.dataset.uid=o.uid;el.dataset.placement=p.placement;
    el.style.cssText=`${imageStyle(p.sprite)};left:${o.x}%;top:${o.y}%;z-index:${o.z};transform:translate(-50%,-50%) scale(${o.scale}) rotate(${o.rotate}deg) scaleX(${o.flip})`;
    el.setAttribute("role","button");el.setAttribute("aria-label",p.name);el.addEventListener("pointerdown",startDrag);els.layer.append(el);
  });
  renderInspector();
}

function renderInspector(){
  const o=state.objects.find(x=>x.uid===state.selected),p=o&&product(o.productId);
  els.inspector.classList.toggle("visible",!!o);els.inspector.setAttribute("aria-hidden",String(!o));
  if(!o)return;els.selectedName.textContent=p.name;els.selectedPrice.textContent=money(p.price);els.scale.value=Math.round(o.scale*100);els.rotate.value=o.rotate;
}

let drag;
function startDrag(event){event.stopPropagation();const uid=event.currentTarget.dataset.uid,o=state.objects.find(x=>x.uid===uid);state.selected=uid;drag={o,el:event.currentTarget,id:event.pointerId};event.currentTarget.setPointerCapture(event.pointerId);event.currentTarget.classList.add("dragging");renderInspector();event.currentTarget.classList.add("selected")}
els.layer.addEventListener("pointermove",event=>{if(!drag||drag.id!==event.pointerId)return;const r=els.scene.getBoundingClientRect(),p=product(drag.o.productId);drag.o.x=Math.max(4,Math.min(96,(event.clientX-r.left)/r.width*100));let y=(event.clientY-r.top)/r.height*100;if(p.placement==="wall")y=Math.max(22,Math.min(62,y));else if(p.placement==="surface")y=Math.max(42,Math.min(72,y));else y=Math.max(52,Math.min(86,y));drag.o.y=y;drag.el.style.left=`${drag.o.x}%`;drag.el.style.top=`${drag.o.y}%`});
els.layer.addEventListener("pointerup",event=>{if(!drag)return;drag.el.classList.remove("dragging");drag=null;save()});
els.scene.addEventListener("pointerdown",event=>{if(event.target===els.scene||event.target.classList.contains("scene-shade")){state.selected=null;renderObjects()}});

function categories(){return ["All",...new Set(products.map(p=>p.category))]}
function renderCatalog(){
  els.owned.textContent=state.objects.length;
  els.categories.innerHTML=categories().map(c=>`<button class="${state.category===c?"active":""}" data-category="${c}">${c}</button>`).join("");
  els.categories.querySelectorAll("button").forEach(b=>b.onclick=()=>{state.category=b.dataset.category;renderCatalog()});
  const pool=state.mode==="shop"?products:state.objects.filter(o=>o.stored).map(o=>({...product(o.productId),uid:o.uid}));
  const filtered=pool.filter(p=>state.category==="All"||p.category===state.category);
  els.grid.innerHTML=filtered.length?filtered.map(p=>`<button class="product-card" data-id="${p.id}" ${p.uid?`data-uid="${p.uid}"`:""}><div class="product-visual" style="${imageStyle(p.sprite)}"></div><small>${p.category.toUpperCase()}</small><div class="product-meta"><strong>${p.name}</strong><span>${p.uid?"PLACE":money(p.price)}</span></div></button>`).join(""):`<div class="empty-state">Stored pieces will appear here.</div>`;
  els.grid.querySelectorAll(".product-card").forEach(card=>card.onclick=()=>card.dataset.uid?placeOwned(card.dataset.uid):buy(card.dataset.id));
}

function buy(id){
  const p=product(id);if(state.budget<p.price)return toast("Not enough budget for this piece");
  const room=p.category==="Exterior"?"exterior":"living";state.budget-=p.price;
  const o={uid:crypto.randomUUID(),productId:id,room,corner:room==="living"?state.corner:0,x:50+Math.random()*10-5,y:p.placement==="wall"?43:p.placement==="surface"?60:72,scale:1,rotate:0,flip:1,z:state.objects.length+1,stored:room!==state.room};
  state.objects.push(o);state.selected=o.stored?null:o.uid;renderScene();toast(o.stored?`${p.name} added to owned pieces`:`${p.name} placed · ${money(state.budget)} left`);tone(330);
}
function placeOwned(uid){const o=state.objects.find(x=>x.uid===uid);if(!o)return;o.stored=false;o.room=state.room;o.corner=state.corner;o.x=50;o.y=product(o.productId).placement==="wall"?43:72;state.selected=uid;closeCatalog();renderScene();toast("Piece ready to position")}

function changeView(delta){if(state.room!=="living")return;state.corner=(state.corner+delta+4)%4;state.selected=null;renderScene();tone(180)}
function enterLiving(){state.room="living";state.corner=0;state.selected=null;renderScene();toast("Living room · Window wall")}
function exitRoom(){state.room="exterior";state.corner=0;state.selected=null;renderScene()}
let doorTap=0;els.door.addEventListener("pointerup",()=>{const now=Date.now();if(now-doorTap<430)enterLiving();else toast("Tap once more to enter");doorTap=now});els.door.addEventListener("dblclick",enterLiving);

let swipeStart;els.scene.addEventListener("pointerdown",e=>{if(e.target.closest(".placed-object,.door-hotspot,.view-controls"))return;swipeStart={x:e.clientX,y:e.clientY}});els.scene.addEventListener("pointerup",e=>{if(!swipeStart)return;const dx=e.clientX-swipeStart.x,dy=e.clientY-swipeStart.y;swipeStart=null;if(Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy))changeView(dx<0?1:-1)});

function selected(){return state.objects.find(x=>x.uid===state.selected)}
function mutate(fn){const o=selected();if(!o)return;fn(o);renderObjects();save()}
els.scale.oninput=e=>mutate(o=>o.scale=Number(e.target.value)/100);els.rotate.oninput=e=>mutate(o=>o.rotate=Number(e.target.value));
$("#flip-object").onclick=()=>mutate(o=>o.flip*=-1);$("#layer-down").onclick=()=>mutate(o=>o.z=Math.max(1,o.z-1));$("#layer-up").onclick=()=>mutate(o=>o.z+=1);
$("#store-object").onclick=()=>mutate(o=>{o.stored=true;state.selected=null;toast("Moved to owned pieces")});
$("#sell-object").onclick=()=>{const o=selected();if(!o)return;const p=product(o.productId),refund=Math.round(p.price*.65);state.objects=state.objects.filter(x=>x.uid!==o.uid);state.selected=null;state.budget+=refund;renderScene();toast(`${p.name} sold for ${money(refund)}`)};

function openCatalog(){els.catalog.classList.add("open");els.catalog.setAttribute("aria-hidden","false");$("#shop-toggle").setAttribute("aria-expanded","true")}
function closeCatalog(){els.catalog.classList.remove("open");els.catalog.setAttribute("aria-hidden","true");$("#shop-toggle").setAttribute("aria-expanded","false")}
$("#shop-toggle").onclick=openCatalog;$("#shop-close").onclick=closeCatalog;
$$('.catalog-tabs button').forEach(b=>b.onclick=()=>{$$('.catalog-tabs button').forEach(x=>x.classList.toggle("active",x===b));state.mode=b.dataset.mode;state.category="All";renderCatalog()});
$("#prev-view").onclick=()=>changeView(-1);$("#next-view").onclick=()=>changeView(1);$("#exit-room").onclick=exitRoom;

const buyers=[
  {name:"Mara & Ellis",taste:"Warm materials · layered living",style:"warm",mult:1.02},
  {name:"Devon Price",taste:"Modern restraint · useful storage",style:"modern",mult:1.045},
  {name:"The Bennett Group",taste:"Luxury finish · statement lighting",style:"luxury",mult:1.075}
];
function appraisal(){
  const placed=state.objects.filter(o=>!o.stored),spent=STARTING_BUDGET-state.budget,styles=new Set(placed.map(o=>product(o.productId).style)),rooms=new Set(placed.map(o=>o.room));
  const score=Math.min(100,Math.round(placed.length*4+styles.size*7+rooms.size*8+Math.min(25,spent/900)));
  $("#design-score").textContent=`${score}/100`;$("#spent-total").textContent=money(spent);
  els.offersGrid.innerHTML=buyers.map((b,i)=>{const matches=placed.filter(o=>product(o.productId).style===b.style).length;const offer=Math.round((282000+spent*.72+score*420+matches*550)*b.mult/100)*100;return `<article class="offer ${i===2?"best":""}"><h3>${b.name}</h3><p>${b.taste}</p><strong>${money(offer)}</strong><button data-buyer="${b.name}" data-offer="${offer}">ACCEPT OFFER</button></article>`}).join("");
  $("#offer-note").textContent=placed.length<4?"Place at least four furnishings to make the property showing-ready.":"Offers respond to completeness, cohesion, investment, and each buyer’s taste.";
  els.offersGrid.querySelectorAll("button").forEach(b=>{b.disabled=placed.length<4;b.onclick=()=>{state.sold=true;save();els.offers.close();toast(`${b.dataset.buyer} accepted · ${money(Number(b.dataset.offer))}`);tone(520)}});els.offers.showModal();
}
$("#open-house").onclick=appraisal;$("#offers-close").onclick=()=>els.offers.close();

let audio;function tone(freq){try{audio??=new AudioContext();const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=freq;g.gain.setValueAtTime(.025,audio.currentTime);g.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.11);o.connect(g).connect(audio.destination);o.start();o.stop(audio.currentTime+.12)}catch{}}

function registerAgentTools(){const c=document.modelContext;if(!c?.registerTool)return;const schemas={type:"object",additionalProperties:false};c.registerTool({name:"get_property_status",title:"Get property status",description:"Read the current Nth House room, budget, and furnishing count.",inputSchema:schemas,annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({room:state.room,corner:state.corner,budget:state.budget,owned:state.objects.length,placed:state.objects.filter(o=>!o.stored).length})});c.registerTool({name:"purchase_furnishing",title:"Purchase furnishing",description:"Buy and place a furnishing from the Nth House catalog by product id.",inputSchema:{type:"object",properties:{productId:{type:"string"}},required:["productId"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:({productId})=>{const p=product(productId);if(!p)throw new Error("Unknown product id");if(state.budget<p.price)throw new Error("Insufficient budget");buy(productId);return {purchased:p.name,budget:state.budget}}});c.registerTool({name:"open_property_showing",title:"Open property showing",description:"Open the current buyer offers for the furnished property.",inputSchema:schemas,annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{appraisal();return {opened:true,placed:state.objects.filter(o=>!o.stored).length}}})}

window.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCatalog();state.selected=null;renderObjects()}if(e.key==="ArrowLeft")changeView(-1);if(e.key==="ArrowRight")changeView(1)});
els.enter.onclick=enterGame;window.addEventListener("orientationchange",showWelcome);
if("serviceWorker" in navigator)navigator.serviceWorker.register("sw.js");
(async()=>{await openDB();await load();renderScene();renderCatalog();registerAgentTools()})();
