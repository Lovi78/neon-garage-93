window.NG = window.NG || {};
NG.money=n=>'$'+Math.round(n).toLocaleString('en-US');
NG.clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
NG.condition=car=>Math.round(car.parts.engine*.3+car.parts.transmission*.2+car.parts.suspension*.2+car.parts.body*.2+car.parts.cosmetic*.1);
NG.baseValue=car=>Math.round(NG.model(car).value*(1-(1993-car.year)*.025)*NG.clamp(1-(car.mileage-60000)/500000,.65,1.05));
NG.value=(state,car)=>Math.max(200,Math.round(NG.baseValue(car)*(.3+.7*NG.condition(car)/100)*(state.demand[NG.model(car).segment]||1)-car.flaws.filter(f=>!f.fixed).reduce((a,f)=>a+f.cost*.75,0)));
NG.estimate=(state,car)=>Math.round(NG.baseValue(car)*(.3+.7*car.claim/100)*(state.demand[NG.model(car).segment]||1));
NG.cost=car=>(car.purchasePrice||0)+(car.inspectionCost||0)+(car.repairCost||0);
NG.repairQuote=(car,part)=>Math.ceil((95-car.parts[part])*NG.parts[part].rate)+car.flaws.filter(f=>f.part===part&&!f.fixed&&f.revealed).reduce((a,f)=>a+f.cost,0);
NG.busy=(state,car)=>car.readyDay>state.day;
NG.generateCar=(state,modelIndex,rng=Math.random)=>{
  const m=NG.catalog[modelIndex],parts={}; Object.keys(NG.parts).forEach(p=>parts[p]=Math.round(35+rng()*48));
  const car={id:'c'+state.nextId++,model:m.id,year:m.years[0]+Math.floor(rng()*(m.years[1]-m.years[0]+1)),mileage:Math.round((45000+rng()*130000)/1000)*1000,parts,flaws:[],claim:0,inspectionCost:0,repairCost:0,inspected:false,listed:false,offers:[],readyDay:0};
  if(rng()<.4){const f=NG.flaws[Math.floor(rng()*NG.flaws.length)];car.flaws.push({...f,fixed:false,revealed:false});}
  car.claim=NG.clamp(NG.condition(car)+Math.round(rng()*20),30,95);
  car.ask=Math.round(NG.value(state,car)*(.69+rng()*.39)/25)*25;
  return car;
};
NG.market=(state,rng=Math.random)=>Array.from({length:9},(_,i)=>NG.generateCar(state,i===0?4:i===1?9:i===2?0:Math.floor(rng()*NG.catalog.length),rng));
NG.record=(s,type,amount,description)=>{s.ledger.unshift({day:s.day,type,amount,description});};
NG.inspect=(s,id)=>{
  const car=[...s.market,...s.inventory].find(c=>c.id===id); if(!car)throw Error('Az autó már nincs a kínálatban.');
  if(car.inspected)throw Error('Ezt az autót már átvizsgáltad.'); if(s.cash<90)throw Error('Az átvizsgáláshoz $90 szükséges.');
  s.cash-=90;car.inspectionCost+=90;car.inspected=true;car.flaws.forEach(f=>f.revealed=true);NG.record(s,'inspection',-90,NG.model(car).name+' - átvizsgálás');
};
NG.buy=(s,id)=>{
  const car=s.market.find(c=>c.id===id);if(!car)throw Error('Ez a hirdetés már nem elérhető.');if(s.inventory.length>=s.capacity)throw Error('A garázs megtelt. Előbb adj el egy autót.');if(s.cash<car.ask)throw Error('Nincs elég készpénzed erre az autóra.');
  s.cash-=car.ask;car.purchasePrice=car.ask;s.inventory.push(car);s.market=s.market.filter(c=>c.id!==id);NG.record(s,'purchase',-car.ask,NG.model(car).name+' - vásárlás');
};
NG.repair=(s,id,part,rng=Math.random)=>{
  const car=s.inventory.find(c=>c.id===id);if(!car||!NG.parts[part])throw Error('Érvénytelen javítás.');if(NG.busy(s,car))throw Error('Az autó még a műhelyben van.');if(car.listed)throw Error('Javítás előtt vedd le a hirdetést.');if(car.parts[part]>=95&&!car.flaws.some(f=>f.part===part&&!f.fixed&&f.revealed))throw Error('Ez az alkatrész már rendben van.');
  const hidden=car.flaws.find(f=>f.part===part&&!f.fixed&&!f.revealed);
  if(hidden){hidden.revealed=true;return 'A műhely új hibát talált: '+hidden.label+'. Az új javítási ár már tartalmazza ezt. Még nem vontunk le pénzt.';}
  const cost=NG.repairQuote(car,part);if(s.cash<cost)throw Error('Nincs elég pénzed a javításra.');s.cash-=cost;car.repairCost+=cost;car.parts[part]=95;car.flaws.filter(f=>f.part===part&&f.revealed).forEach(f=>f.fixed=true);car.readyDay=s.day+1;car.offers=[];NG.record(s,'repair',-cost,NG.model(car).name+' - '+NG.parts[part].label);return 'Javítás elindítva. Az autó holnapra elkészül.';
};
NG.list=(s,id,price)=>{const c=s.inventory.find(c=>c.id===id);if(!c)throw Error('Az autó nem található.');if(NG.busy(s,c))throw Error('Előbb várd meg a javítás végét.');if(!Number.isFinite(price)||price<100||price>100000)throw Error('Az ár $100 és $100,000 között lehet.');c.listed=true;c.listPrice=Math.round(price);c.offers=[];};
NG.sell=(s,id,offerId)=>{
  const c=s.inventory.find(c=>c.id===id);if(!c)throw Error('Ezt az autót már eladtad.');if(NG.busy(s,c))throw Error('Javítás alatt nem adható el.');
  let price;if(offerId==='dealer')price=Math.round(NG.value(s,c)*.72);else{const offer=c.offers.find(o=>o.id===offerId);if(!c.listed||!offer)throw Error('Ez az ajánlat már nem érvényes.');price=offer.price;}
  const profit=price-NG.cost(c);s.cash+=price;s.profit+=profit;s.sold++;s.reputation+=offerId==='dealer'?0:NG.condition(c)>=65?2:1;
  s.sales.unshift({day:s.day,name:NG.model(c).name,price,cost:NG.cost(c),profit});NG.record(s,'sale',price,NG.model(c).name+' - eladás');s.inventory=s.inventory.filter(x=>x.id!==id);return profit;
};
NG.nextDay=(s,rng=Math.random)=>{
  s.day++;s.demand={japan:1,europe:1,america:1};s.event={title:'Csendes nap a városban',text:'A piac kiegyensúlyozott. Friss hirdetések és új lehetőségek várnak.',kind:'normal'};
  const r=rng();if(r<.2){s.demand.japan=1.2;s.event={title:'Tokyo fever',text:'A japán autók kereslete ma 20%-kal magasabb. Az értékük és a vevői ajánlatok is emelkednek.',kind:'japan'};}
  else if(r<.36){s.demand.america=.82;s.event={title:'Drágul a benzin',text:'Ma 18%-kal esik az amerikai autók értéke. A piac holnap újra változik.',kind:'america'};}
  else if(r<.52){s.event={title:'Fizetésnap a városban',text:'Egy sürgős vevő ma piaci ár felett is ajánlhat. Meghirdetett autóid nagyobb eséllyel kapnak ajánlatot.',kind:'rush'};}
  else if(r<.65){s.event={title:'Ritka fogás a hirdetések között',text:'Egy Nissan 300ZX került a piacra 20% hirdetési kedvezménnyel. A műszaki állapota még kérdéses.',kind:'rare'};}
  s.market=NG.market(s,rng);if(s.event.kind==='rare'){s.market[8]=NG.generateCar(s,5,rng);s.market[8].ask=Math.round(s.market[8].ask*.8);}
  s.inventory.forEach(c=>{c.offers=[];if(!c.listed||NG.busy(s,c))return;const value=NG.value(s,c),ratio=c.listPrice/value,chance=NG.clamp(1.25-ratio*.65+s.reputation*.004+(s.event.kind==='rush'?.3:0),.02,.95);
    if(rng()<chance){const price=Math.min(c.listPrice,Math.round(value*(.87+rng()*.2+(s.event.kind==='rush'?.1:0))));c.offers.push({id:'o'+s.nextId++,price,buyer:['Alex M.','Jamie R.','Chris T.','Morgan K.'][Math.floor(rng()*4)]});}
  });s.history.unshift({day:s.day,...s.event});s.history=s.history.slice(0,30);
};
