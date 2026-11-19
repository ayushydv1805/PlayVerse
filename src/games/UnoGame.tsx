import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SkipForward } from "lucide-react";

type Color="red"|"yellow"|"green"|"blue"|"wild";
type Card={id:string;color:Color;value:string};
type Pending={card:Card;player:number;chosenColor?:"red"|"yellow"|"green"|"blue"};
type Game={players:number;hands:Card[][];drawPile:Card[];discard:Card[];current:number;direction:1|-1;chosenColor:"red"|"yellow"|"green"|"blue";status:"playing"|"won";winner:number|null;message:string;pending:Pending|null;drawnCardId:string|null;mustPass:boolean};
const COLORS=["red","yellow","green","blue"] as const;
const PLAYER_COLORS=["#ef6268","#e8b94f","#59bf88","#5c8fe2","#b68cf5","#e88bb2"];
const NAMES=["Ruby","Sunshine","Jade","Sapphire","Violet","Rose"];
const SYMBOL:Record<string,string>={skip:"⊘",reverse:"↻",draw2:"+2",wild:"✦",wild4:"+4"};
const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function makeDeck():Card[]{
 const deck:Card[]=[];
 for(const color of COLORS){
  deck.push({id:`${color}-0`,color,value:"0"});
  for(let n=1;n<=9;n++)for(let copy=0;copy<2;copy++)deck.push({id:`${color}-${n}-${copy}`,color,value:String(n)});
  for(const value of ["skip","reverse","draw2"])for(let copy=0;copy<2;copy++)deck.push({id:`${color}-${value}-${copy}`,color,value});
 }
 for(let i=0;i<4;i++){deck.push({id:`wild-${i}`,color:"wild",value:"wild"});deck.push({id:`wild4-${i}`,color:"wild",value:"wild4"});}
 return shuffle(deck);
}
function newGame(players:number):Game{
 const deck=makeDeck(),hands=Array.from({length:players},()=>[] as Card[]);
 for(let i=0;i<7;i++)for(let p=0;p<players;p++)hands[p].push(deck.pop()!);
 const first=deck.splice(deck.findIndex(c=>c.color!=="wild"&&/^\d$/.test(c.value)),1)[0];
 return {players,hands,drawPile:deck,discard:[first],current:0,direction:1,chosenColor:first.color as Exclude<Color,"wild">,status:"playing",winner:null,message:"Match the colour or number. First to empty their hand wins.",pending:null,drawnCardId:null,mustPass:false};
}
function top(game:Game){return game.discard[game.discard.length-1];}
function canPlay(card:Card,game:Game){const chosen=game.pending?.chosenColor??game.chosenColor;return card.color==="wild"||card.color===chosen||card.value===top(game).value;}
function drawCards(source:Game,player:number,count:number):Game{
 let drawPile=[...source.drawPile],discard=[...source.discard],hands=source.hands.map(h=>[...h]);
 for(let i=0;i<count;i++){
  if(!drawPile.length){if(discard.length<=1)break;const last=discard.pop()!;drawPile=shuffle(discard);discard=[last];}
  const card=drawPile.pop();if(card)hands[player].push(card);
 }
 return {...source,drawPile,discard,hands};
}
function resolve(source:Game,pending:Pending,missed=false):Game{
 let game={...source,pending:null,drawnCardId:null,mustPass:false};
 const card=pending.card,player=pending.player,n=game.players;
 if(missed){game=drawCards(game,player,2);game.message=`${NAMES[player]} missed calling UNO and drew 2 cards.`;}
 if(card.color==="wild")game.chosenColor=pending.chosenColor??"red";
 let next=(player+game.direction+n)%n;
 if(card.value==="reverse"){game.direction=game.direction===1?-1:1;next=n===2?player:(player+game.direction+n)%n;game.message="Direction reversed.";}
 else if(card.value==="skip"){next=(player+2*game.direction+n*2)%n;game.message="The next player was skipped.";}
 else if(card.value==="draw2"||card.value==="wild4"){
  const amount=card.value==="draw2"?2:4,victim=(player+game.direction+n)%n;
  game=drawCards(game,victim,amount);next=(victim+game.direction+n)%n;
  game.message=`${NAMES[victim]} drew ${amount} cards and lost their turn.`;
 }else game.message=`${NAMES[next]}'s turn.`;
 return {...game,current:next};
}
function symbol(value:string){return SYMBOL[value]??value;}
function CardFace({card,small=false,selected=false,dim=false}:{card:Card;small?:boolean;selected?:boolean;dim?:boolean}){
 return <div className={`uno-card-face color-${card.color} ${small?"small":""} ${selected?"selected":""} ${dim?"dim":""}`}><span className="uno-corner">{symbol(card.value)}</span><strong>{symbol(card.value)}</strong><span className="uno-corner bottom">{symbol(card.value)}</span></div>;
}
export default function UnoGame(){
 const [game,setGame]=useState<Game>(()=>newGame(4)),[selected,setSelected]=useState(0);
 const hand=game.hands[game.current],currentTop=top(game),pending=game.pending;
 const reset=(players=game.players)=>{setGame(newGame(players));setSelected(0);};
 const playCard=(id:string)=>{
  setGame(old=>{
   if(old.status!=="playing"||old.pending||old.mustPass)return old;
   const player=old.current,index=old.hands[player].findIndex(c=>c.id===id);if(index<0)return old;
   const card=old.hands[player][index];if(old.drawnCardId&&old.drawnCardId!==id)return {...old,message:"You may only play the card you just drew."};
   if(!canPlay(card,old))return old;
   const hands=old.hands.map(h=>[...h]);hands[player].splice(index,1);
   const next={...old,hands,discard:[...old.discard,card],drawnCardId:null};
   if(!hands[player].length)return {...next,status:"won",winner:player,message:`${NAMES[player]} wins the round!`,pending:null};
   const action:Pending={card,player};
   if(card.color==="wild"&&!action.chosenColor)return {...next,pending:action,message:"Choose the colour to continue."};
   if(hands[player].length===1)return {...next,pending:action,message:"One card left. Call UNO before finishing your turn!"};
   return resolve(next,action);
  });
  setSelected(0);
 };
 const chooseColor=(color:Exclude<Color,"wild">)=>setGame(old=>{
  if(!old.pending)return old;const action={...old.pending,chosenColor:color},base={...old,pending:action,chosenColor:color};
  if(old.hands[action.player].length===1)return {...base,message:"Now call UNO to finish your turn."};
  return resolve(base,action);
 });
 const callUno=()=>setGame(old=>old.pending?resolve(old,old.pending):old);
 const missUno=()=>setGame(old=>old.pending?resolve(old,old.pending,true):old);
 const drawOne=()=>setGame(old=>{
  if(old.status!=="playing"||old.pending||old.drawnCardId||old.mustPass)return old;
  const size=old.hands[old.current].length,next=drawCards(old,old.current,1),card=next.hands[old.current][size];
  if(!card)return {...old,mustPass:true,message:"The draw pile is empty. Pass your turn."};
  const playable=canPlay(card,next);
  return {...next,drawnCardId:card.id,mustPass:!playable,message:playable?"You drew a playable card. Play it or pass.":"No match. Pass your turn."};
 });
 const passTurn=()=>setGame(old=>{
  if(old.pending||old.status!=="playing")return old;
  const next=(old.current+old.direction+old.players)%old.players;
  return {...old,current:next,drawnCardId:null,mustPass:false,message:`${NAMES[next]}'s turn.`};
 });
 useEffect(()=>{
  const key=(event:KeyboardEvent)=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key.toLowerCase()==="r"){event.preventDefault();reset();return;}
   if(event.key.toLowerCase()==="d"){event.preventDefault();drawOne();return;}
   if(event.key.toLowerCase()==="u"){event.preventDefault();if(pending?.chosenColor||pending?.card.color!=="wild")callUno();return;}
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();setSelected(v=>Math.max(0,Math.min(hand.length-1,v+(event.key==="ArrowLeft"?-1:1))));return;}
   if(event.key==="Enter"||event.key===" "){event.preventDefault();if(pending){if(pending.chosenColor||pending.card.color!=="wild")callUno();return;}if(hand[selected])playCard(hand[selected].id);}
  };
  window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
 },[hand,selected,pending,game.players]);
 return <div className="cards-game-shell uno-shell">
  <div className="card-game-topline"><span className="game-kicker"><i className="live-dot"/> LOCAL CARD PARTY</span><span className="keyboard-hint">← → SELECT <kbd>ENTER</kbd> PLAY <kbd>D</kbd> DRAW <kbd>U</kbd> UNO <kbd>R</kbd> RESET</span></div>
  <div className="uno-table"><div className="uno-table-glow"/>
   <div className="uno-opponents">{game.hands.map((cards,index)=>index!==game.current&&<div className="uno-opponent" key={index}><div className="opponent-avatar" style={{background:PLAYER_COLORS[index]}}>{NAMES[index][0]}</div><b>{NAMES[index]}</b><span>{cards.length} cards</span><div className="uno-mini-back">{Array.from({length:Math.min(cards.length,7)},(_,i)=><i key={i}/>)}</div></div>)}</div>
   <div className="uno-pile-zone"><button className="uno-draw-pile" onClick={drawOne}><div className="uno-card-back"><span>UNO</span></div><small>DRAW · {game.drawPile.length}</small></button><div className="uno-discard-pile"><CardFace card={currentTop}/><small>DISCARD PILE</small></div><div className="uno-color-indicator"><span className={`color-dot ${game.pending?.chosenColor??game.chosenColor}`}/><small>{(game.pending?.chosenColor??game.chosenColor).toUpperCase()}</small></div></div>
   <div className="uno-turn-banner"><span className="turn-pulse"/>{game.status==="won"?`${NAMES[game.winner??0]} WINS!`:pending?(pending.chosenColor?"CALL UNO OR CONTINUE":"CHOOSE A COLOUR"):`${NAMES[game.current]}'S TURN`}</div>
  </div>
  {game.status==="won"?<div className="uno-finish"><h3>🎉 {NAMES[game.winner??0]} wins!</h3><p>Everyone played their cards. Ready for another round?</p><button className="primary-button" onClick={()=>reset()}>Play again <RotateCcw size={15}/></button></div>:
   pending?.card.color==="wild"&&!pending.chosenColor?<div className="uno-resolution"><b>Choose the next colour</b><div className="uno-color-choices">{COLORS.map(color=><button key={color} className={`uno-color-choice ${color}`} onClick={()=>chooseColor(color)}>{color}</button>)}</div></div>:
   pending?<div className="uno-resolution"><b>You have one card left!</b><p>Press UNO to announce it, or continue without calling and take a 2-card penalty.</p><div className="uno-resolution-actions"><button className="uno-call-button" onClick={callUno}>UNO! <span>U</span></button><button className="ghost-button" onClick={missUno}>Forgot UNO · Draw 2</button></div></div>:
   <div className="uno-hand-panel">
    <div className="uno-hand-heading"><div><span className="stat-label">PLAYER HAND</span><h3>{NAMES[game.current]} <small>· {hand.length} cards</small></h3></div><div className="uno-hand-actions"><button className="ghost-button" onClick={drawOne} disabled={Boolean(game.drawnCardId)||game.mustPass}>Draw card <span>D</span></button>{(game.drawnCardId||game.mustPass)&&<button className="ghost-button" onClick={passTurn}>Pass turn <SkipForward size={14}/></button>}</div></div>
    <div className="uno-hand-scroll">{hand.map((card,index)=>{const legal=canPlay(card,game)&&(!game.drawnCardId||game.drawnCardId===card.id);return <button key={card.id} className={`uno-hand-card ${selected===index?"is-selected":""} ${legal?"is-playable":"is-dim"}`} onClick={()=>{setSelected(index);if(legal)playCard(card.id);}} onMouseEnter={()=>setSelected(index)} aria-label={`${card.color} ${card.value}`}><CardFace card={card} selected={selected===index} dim={!legal}/></button>;})}</div>
    <div className="uno-bottom-hint"><span>Tap a glowing card to play it.</span><span>Call <b>UNO!</b> when one card remains.</span></div>
   </div>}
  <div className="uno-footer"><div className="uno-player-count"><span className="stat-label">PLAYERS</span>{([2,3,4,5,6] as const).map(n=><button key={n} className={game.players===n?"active":""} onClick={()=>reset(n)}>{n}</button>)}</div><button className="ghost-button" onClick={()=>reset()}><RotateCcw size={14}/> New game</button></div>
 </div>;
}