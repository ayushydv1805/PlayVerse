import { useEffect, useState } from "react";
import { RotateCcw, Target } from "lucide-react";

type Suit="♠"|"♥"|"♦"|"♣";
type Card={id:string;rank:string;suit:Suit};
type Move={player:number;card:Card;before:number;after:number;operation:"+"|"-"};
type Game={players:number;hands:Card[][];drawPile:Card[];discard:Card[];value:number;current:number;winner:number|null;status:"playing"|"won"|"draw";message:string;history:Move[]};
const SUITS:Suit[]=["♠","♥","♦","♣"],RANKS=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const COLORS:Record<Suit,string>={"♠":"black","♣":"black","♥":"red","♦":"red"};
const NAMES=["Ruby","Sunshine","Jade","Sapphire","Violet","Rose"];
const PLAYER_COLORS=["#ef6268","#e8b94f","#59bf88","#5c8fe2","#b68cf5","#e88bb2"];
const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function cardValue(rank:string){if(rank==="A")return 1;if(rank==="6")return 0;if(["J","Q","K"].includes(rank))return 10;return Number(rank);}
function createGame(players:number):Game{
 const deck=shuffle(SUITS.flatMap(suit=>RANKS.map(rank=>({id:`${rank}-${suit}`,rank,suit}))));
 const hands=Array.from({length:players},()=>[] as Card[]);
 for(let i=0;i<4;i++)for(let p=0;p<players;p++)hands[p].push(deck.pop()!);
 return {players,hands,drawPile:deck,discard:[],value:0,current:0,winner:null,status:"playing",message:"Play a card to move the running total toward exactly 50.",history:[]};
}
function CardFace({card,selected=false}:{card:Card;selected?:boolean}){
 return <div className={`pm-card-face ${COLORS[card.suit]} ${selected?"selected":""}`}><span>{card.rank}<i>{card.suit}</i></span><strong>{card.suit}</strong><span className="bottom">{card.rank}<i>{card.suit}</i></span></div>;
}
export default function PlusMinusGame(){
 const [game,setGame]=useState<Game>(()=>createGame(3)),[selected,setSelected]=useState(0);
 const hand=game.hands[game.current];
 const reset=(players=game.players)=>{setGame(createGame(players));setSelected(0);};
 const play=(id:string)=>{
  setGame(old=>{
   if(old.status!=="playing")return old;
   const index=old.hands[old.current].findIndex(card=>card.id===id);if(index<0)return old;
   const card=old.hands[old.current][index],operation: "+"|"-"=old.value<50?"+":"-";
   const nextValue=operation==="+"?old.value+cardValue(card.rank):old.value-cardValue(card.rank);
   const hands=old.hands.map(cards=>[...cards]);hands[old.current].splice(index,1);
   if(old.drawPile.length)hands[old.current].push(old.drawPile[old.drawPile.length-1]);
   const drawPile=old.drawPile.length?old.drawPile.slice(0,-1):old.drawPile;
   const history=[...old.history,{player:old.current,card,before:old.value,after:nextValue,operation}].slice(-8);
   if(nextValue===50)return {...old,hands,drawPile,discard:[...old.discard,card],value:50,winner:old.current,status:"won",history,message:`${NAMES[old.current]} hit exactly 50 and wins!`};
   const available=hands.map((cards,index)=>cards.length?index:-1).filter(index=>index>=0);
   if(!available.length)return {...old,hands,drawPile,discard:[...old.discard,card],value:nextValue,status:"draw",history,message:"The deck and every hand are empty. No one reached 50."};
   let next=(old.current+1)%old.players;while(!hands[next].length)next=(next+1)%old.players;
   return {...old,hands,drawPile,discard:[...old.discard,card],value:nextValue,current:next,history,message:`${NAMES[old.current]} ${operation} ${cardValue(card.rank)} = ${nextValue}. ${NAMES[next]} plays next.`};
  });
  setSelected(0);
 };
 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key.toLowerCase()==="r"){event.preventDefault();reset();return;}
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();setSelected(v=>Math.max(0,Math.min(hand.length-1,v+(event.key==="ArrowLeft"?-1:1))));return;}
   if(event.key==="Enter"||event.key===" "){event.preventDefault();if(hand[selected])play(hand[selected].id);return;}
   if(/^[1-4]$/.test(event.key)){const card=hand[Number(event.key)-1];if(card){event.preventDefault();play(card.id);}}
  };
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[hand,selected,game.players]);
 const operation=game.value<50?"+":"-",progress=Math.max(0,Math.min(100,game.value));
 return <div className="cards-game-shell plusminus-shell">
  <div className="card-game-topline"><span className="game-kicker"><i className="live-dot"/> EXACTLY FIFTY CHALLENGE</span><span className="keyboard-hint">← → SELECT <kbd>ENTER</kbd> PLAY <kbd>1–4</kbd> QUICK PLAY <kbd>R</kbd> RESET</span></div>
  <div className="pm-arena">
   <div className="pm-opponents">{game.hands.map((cards,index)=>index!==game.current&&<div className="pm-opponent" key={index}><span className="opponent-avatar" style={{background:PLAYER_COLORS[index]}}>{NAMES[index][0]}</span><b>{NAMES[index]}</b><small>{cards.length} cards left</small></div>)}</div>
   <div className="pm-scoreboard"><div className="pm-running-value"><span className="stat-label">RUNNING TOTAL</span><strong className={game.value>50?"over-fifty":""}>{game.value}</strong><small>{game.value===50?"TARGET REACHED":game.value<50?"Below 50 · Add the next card":"Above 50 · Subtract the next card"}</small></div>
    <div className="pm-target-meter"><div className="pm-target-label"><span>0</span><b><Target size={14}/> EXACTLY 50</b><span>100</span></div><div className="pm-meter-track"><i style={{left:`${progress}%`}}/><span style={{left:"50%"}}/></div><div className="pm-operation"><span className={operation==="+"?"plus":"minus"}>{operation} NEXT CARD</span><small>{operation==="+"?"The total is under 50.":"The total is over 50."}</small></div></div>
   </div>
   <div className="pm-active-banner"><span className="turn-pulse"/>{game.winner!==null?NAMES[game.winner]+" WINS!":game.status==="draw"?"NO WINNER":NAMES[game.current].toUpperCase()+"'S TURN"}</div>
  </div>
  {game.status!=="playing"?<div className="uno-finish"><h3>{game.status==="won"?"🎯 Exactly 50!":"Round complete"}</h3><p>{game.message}</p><button className="primary-button" onClick={()=>reset()}>Play again <RotateCcw size={15}/></button></div>:
   <div className="uno-hand-panel pm-hand-panel"><div className="uno-hand-heading"><div><span className="stat-label">YOUR FOUR CARDS</span><h3>{NAMES[game.current]} <small>· {hand.length} cards</small></h3></div><div className="pm-draw-count"><span className="stat-label">DECK LEFT</span><b>{game.drawPile.length}</b></div></div>
    <div className="uno-hand-scroll pm-hand-scroll">{hand.map((card,index)=><button key={card.id} className={`uno-hand-card pm-hand-card ${selected===index?"is-selected":""}`} onClick={()=>{setSelected(index);play(card.id);}} onMouseEnter={()=>setSelected(index)}><CardFace card={card} selected={selected===index}/><small>{cardValue(card.rank)===0?"ZERO":`VALUE ${cardValue(card.rank)}`}</small></button>)}</div>
    <div className="uno-bottom-hint"><span>Play any card. A 6 is worth zero; face cards are worth ten.</span><span>Current operation: <b>{operation==="+"?"ADD":"SUBTRACT"}</b></span></div>
   </div>}
  <div className="pm-history"><span className="stat-label">RECENT MOVES</span>{game.history.length===0?<small>No cards played yet.</small>:game.history.slice().reverse().map((item,index)=><div key={index}><b>{NAMES[item.player]}</b><span className={item.operation==="+"?"plus":"minus"}>{item.operation}{cardValue(item.card.rank)}</span><span>{item.before} → {item.after}</span></div>)}</div>
  <div className="uno-footer"><div className="uno-player-count"><span className="stat-label">PLAYERS</span>{([2,3,4,5,6] as const).map(n=><button key={n} className={game.players===n?"active":""} onClick={()=>reset(n)}>{n}</button>)}</div><button className="ghost-button" onClick={()=>reset()}><RotateCcw size={14}/> New game</button></div>
 </div>;
}