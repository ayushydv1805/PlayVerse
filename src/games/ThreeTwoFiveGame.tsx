import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, ShieldCheck } from "lucide-react";

type Suit="♠"|"♥"|"♦"|"♣";
type Card={id:string;suit:Suit;rank:string};
type Played={player:number;card:Card};
type Phase="trump"|"exchange-steal"|"exchange-return"|"playing"|"round-over"|"match-over";
type ExchangePair={thief:number;victim:number};
type State={round:number;dealer:number;fivePlayer:number;quota:number[];hands:Card[][];drawPile:Card[];phase:Phase;trump:Suit|null;current:number;leader:number;trick:Played[];tricksWon:number[];lastTrick:Played[]|null;message:string;matchScores:number[];exchangePairs:ExchangePair[];exchangeIndex:number;stolenCard:Card|null};
const SUITS:Suit[]=["♠","♥","♦","♣"];
const RANKS=["A","K","Q","J","10","9","8"];
const RED:Record<Suit,boolean>={"♠":false,"♣":false,"♥":true,"♦":true};
const PLAYER=["#ed777d","#7b9fec","#72d19a"];
const PLAYER_NAMES=["Ruby","Sapphire","Jade"];
const RANK_VALUE:Record<string,number>={A:14,K:13,Q:12,J:11,"10":10,"9":9,"8":8,"7":7};
const shuffle=<T,>(items:T[])=>{const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function makeDeck():Card[]{const cards=SUITS.flatMap(suit=>RANKS.map(rank=>({id:`${rank}-${suit}`,rank,suit})));cards.push({id:"7-♥",rank:"7",suit:"♥"},{id:"7-♠",rank:"7",suit:"♠"});return shuffle(cards);}
function buildExchange(tricks:number[],quota:number[]):ExchangePair[]{
 const over:number[]=[],under:number[]=[];
 tricks.forEach((count,p)=>{if(count>quota[p])for(let i=0;i<count-quota[p];i++)over.push(p);if(count<quota[p])for(let i=0;i<quota[p]-count;i++)under.push(p);});
 return over.map((thief,index)=>({thief,victim:under[index]})).filter(pair=>pair.victim!==undefined);
}
function newDeal(round:number,scores:number[],pairs:ExchangePair[]=[]):State{
 const dealer=round%3,five=(dealer+1)%3,three=(dealer+2)%3;
 const quota=[0,0,0];quota[dealer]=2;quota[five]=5;quota[three]=3;
 const deck=makeDeck(),hands=Array.from({length:3},()=>[] as Card[]);
 for(let card=0;card<5;card++)for(let p=0;p<3;p++)hands[p].push(deck.pop()!);
 return {round,dealer,fivePlayer:five,quota,hands,drawPile:deck,phase:"trump",trump:null,current:five,leader:five,trick:[],tricksWon:[0,0,0],lastTrick:null,message:`${PLAYER_NAMES[five]} needs 5 tricks and chooses trump.`,matchScores:scores,exchangePairs:pairs,exchangeIndex:0,stolenCard:null};
}
function compareCards(a:Card,b:Card,led:Suit,trump:Suit){
 const aTrump=a.suit===trump,bTrump=b.suit===trump;
 if(aTrump!==bTrump)return aTrump?1:-1;
 if(a.suit!==b.suit)return 0;
 return RANK_VALUE[a.rank]-RANK_VALUE[b.rank];
}
function legalCards(hand:Card[],trick:Played[]){
 if(trick.length===0)return hand;
 const led=trick[0].card.suit,following=hand.filter(card=>card.suit===led);
 return following.length?following:hand;
}
function sortHand(hand:Card[]){const order:Record<Suit,number>={"♠":0,"♥":1,"♦":2,"♣":3};return [...hand].sort((a,b)=>order[a.suit]-order[b.suit]||RANK_VALUE[b.rank]-RANK_VALUE[a.rank]);}
function CardFace({card,selected=false,dim=false}:{card:Card;selected?:boolean;dim?:boolean}){
 return <div className={`trick-card-face ${RED[card.suit]?"red":"black"} ${selected?"selected":""} ${dim?"dim":""}`}><span>{card.rank}<i>{card.suit}</i></span><strong>{card.suit}</strong><span className="bottom">{card.rank}<i>{card.suit}</i></span></div>;
}
function resolveWinner(trick:Played[],trump:Suit){
 const led=trick[0].card.suit;
 return trick.reduce((best,play)=>compareCards(play.card,best.card,led,trump)>0?play:best,trick[0]);
}
function canReturnCard(hand:Card[],stolen:Card,card:Card){
 return card.id!==stolen.id&&hand.filter(item=>item.suit===card.suit).length>=3;
}

export default function ThreeTwoFiveGame(){
 const [game,setGame]=useState<State>(()=>newDeal(0,[0,0,0]));
 const [selected,setSelected]=useState(0);
 const exchange=game.exchangePairs[game.exchangeIndex];
 const activeHand=game.phase==="exchange-return"&&exchange?game.hands[exchange.thief]:game.hands[game.current];
 const visibleHand=useMemo(()=>sortHand(activeHand??[]),[activeHand]);
 const legal=useMemo(()=>game.phase==="playing"?legalCards(game.hands[game.current]??[],game.trick).map(card=>card.id):[],[game]);
 const validReturn=game.phase==="exchange-return"&&exchange&&game.stolenCard?visibleHand.filter(card=>canReturnCard(visibleHand,game.stolenCard!,card)).map(card=>card.id):[];

 const chooseTrump=(suit:Suit)=>{
  setGame(old=>{
   if(old.phase!=="trump")return old;
   const hands=old.hands.map(cards=>[...cards]),drawPile=[...old.drawPile];
   for(let i=0;i<5;i++)for(let p=0;p<3;p++)hands[p].push(drawPile.pop()!);
   const phase:Phase=old.exchangePairs.length?"exchange-steal":"playing";
   const firstThief=old.exchangePairs[0]?.thief??old.fivePlayer;
   const firstVictim=old.exchangePairs[0]?.victim??0;
   return {...old,hands,drawPile,trump:suit,phase,current:phase==="playing"?old.fivePlayer:firstThief,leader:old.fivePlayer,message:phase==="playing"?`${PLAYER_NAMES[old.fivePlayer]} leads the first trick.`:`${PLAYER_NAMES[firstThief]} may pull a card from ${PLAYER_NAMES[firstVictim]}.`};
  });
  setSelected(0);
 };
 const blindSteal=()=>{
  setGame(old=>{
   const pair=old.exchangePairs[old.exchangeIndex];
   if(old.phase!=="exchange-steal"||!pair)return old;
   const hands=old.hands.map(cards=>[...cards]),victim=hands[pair.victim];
   if(!victim.length)return {...old,phase:"exchange-return",stolenCard:null,message:"No card is available to pull. Continue."};
   const index=Math.floor(Math.random()*victim.length),[stolen]=victim.splice(index,1);
   hands[pair.thief].push(stolen);
   return {...old,hands,stolenCard:stolen,phase:"exchange-return",current:pair.thief,message:`${PLAYER_NAMES[pair.thief]} pulled a hidden card. Choose one to give back.`};
  });
  setSelected(0);
 };
 const returnCard=(id:string)=>{
  setGame(old=>{
   const pair=old.exchangePairs[old.exchangeIndex];
   if(old.phase!=="exchange-return"||!pair||!old.stolenCard)return old;
   const hands=old.hands.map(cards=>[...cards]),hand=hands[pair.thief];
   const index=hand.findIndex(card=>card.id===id);if(index<0||!canReturnCard(hand,old.stolenCard,hand[index]))return old;
   const [returned]=hand.splice(index,1);hands[pair.victim].push(returned);
   const nextIndex=old.exchangeIndex+1;
   if(nextIndex<old.exchangePairs.length){
    const next=old.exchangePairs[nextIndex];
    return {...old,hands,exchangeIndex:nextIndex,stolenCard:null,phase:"exchange-steal",current:next.thief,message:`${PLAYER_NAMES[next.thief]} may pull a card from ${PLAYER_NAMES[next.victim]}.`};
   }
   return {...old,hands,exchangeIndex:nextIndex,stolenCard:null,phase:"playing",current:old.fivePlayer,leader:old.fivePlayer,message:"Card exchange complete. The 5-trick player leads."};
  });
  setSelected(0);
 };
 const playCard=(id:string)=>{
  setGame(old=>{
   if(old.phase!=="playing"||old.trump===null)return old;
   const player=old.current,index=old.hands[player].findIndex(card=>card.id===id);if(index<0)return old;
   const card=old.hands[player][index];if(!legalCards(old.hands[player],old.trick).some(item=>item.id===id))return old;
   const hands=old.hands.map(cards=>[...cards]);hands[player].splice(index,1);
   const trick=[...old.trick,{player,card}];
   if(trick.length<3){const next=(player+1)%3;return {...old,hands,trick,current:next,message:`${PLAYER_NAMES[next]} must follow suit if possible.`};}
   const winning=resolveWinner(trick,old.trump),tricksWon=[...old.tricksWon];tricksWon[winning.player]++;
   if(tricksWon.reduce((a,b)=>a+b,0)===10){
    const roundScores=tricksWon.map((count,p)=>count-old.quota[p]),matchScores=old.matchScores.map((score,p)=>score+roundScores[p]);
    return {...old,hands,trick:[],lastTrick:trick,tricksWon,matchScores,phase:old.round===2?"match-over":"round-over",message:`${PLAYER_NAMES[winning.player]} won the tenth trick. Deal complete.`};
   }
   return {...old,hands,trick:[],lastTrick:trick,tricksWon,leader:winning.player,current:winning.player,message:`${PLAYER_NAMES[winning.player]} won the trick and leads next.`};
  });
  setSelected(0);
 };
 const nextDeal=()=>{const pairs=buildExchange(game.tricksWon,game.quota);setGame(newDeal(game.round+1,game.matchScores,pairs));setSelected(0);};
 const newMatch=()=>{setGame(newDeal(0,[0,0,0]));setSelected(0);};

 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(event.key.toLowerCase()==="r"){event.preventDefault();newMatch();return;}
   if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();setSelected(v=>Math.max(0,Math.min(visibleHand.length-1,v+(event.key==="ArrowLeft"?-1:1))));return;}
   if(event.key==="Enter"||event.key===" "){
    event.preventDefault();
    if(game.phase==="exchange-steal"){blindSteal();return;}
    const card=visibleHand[selected];if(!card)return;
    if(game.phase==="playing"&&legal.includes(card.id))playCard(card.id);
    else if(game.phase==="exchange-return"&&validReturn.includes(card.id))returnCard(card.id);
   }
  };
  window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
 },[game,visibleHand,selected,legal,validReturn]);

 const maxScore=Math.max(...game.matchScores),winningPlayers=game.matchScores.map((score,index)=>({score,index})).filter(item=>item.score===maxScore);
 const roundTotal=game.tricksWon.reduce((a,b)=>a+b,0);
 return <div className="cards-game-shell trick-shell">
  <div className="card-game-topline"><span className="game-kicker"><i className="live-dot"/> TEEN DO PAANCH · 3 PLAYERS</span><span className="keyboard-hint">← → SELECT <kbd>ENTER</kbd> PLAY / CONFIRM <kbd>R</kbd> NEW MATCH</span></div>
  <div className="trick-scorebar">{game.matchScores.map((score,index)=><div className={game.current===index?"active":""} key={index}><span className="trick-avatar" style={{background:PLAYER[index]}}>{PLAYER_NAMES[index][0]}</span><b>{PLAYER_NAMES[index]}</b><small>Need {game.quota[index]}</small><strong>{score>0?"+":""}{score}</strong></div>)}</div>
  <div className="trick-table">
   <div className="trick-table-top"><span>ROUND {game.round+1} / 3</span><span>DEALER: {PLAYER_NAMES[game.dealer]}</span><span>TRUMP: {game.trump??"NOT SET"}</span></div>
   <div className="trick-opponents">{[0,1,2].filter(p=>p!==game.current).map(player=><div className="trick-opponent" key={player}><i style={{background:PLAYER[player]}}/><b>{PLAYER_NAMES[player]}</b><small>{game.hands[player].length} cards · {game.tricksWon[player]} tricks</small></div>)}</div>
   <div className="trick-centre"><div className="trick-count"><b>{roundTotal}</b><span>/ 10 tricks played</span></div>
    <div className="trick-cards-on-table">{game.trick.length?game.trick.map(play=><div className="trick-played-card" key={play.card.id}><CardFace card={play.card}/><small>{PLAYER_NAMES[play.player]}</small></div>):<div className="empty-trick">{game.lastTrick?"Trick collected":"Lead the first card"}<small>{game.trump?"Trump suit "+game.trump:"Choose a trump suit to begin"}</small></div>}</div>
    {game.lastTrick&&game.trick.length===0&&<div className="last-trick-note">Last trick winner: {PLAYER_NAMES[resolveWinner(game.lastTrick,game.trump??"♠").player]}</div>}
   </div>
   <div className="trick-turn-label"><span className="turn-pulse"/>{game.phase==="trump"?PLAYER_NAMES[game.fivePlayer]+" · CHOOSE TRUMP":game.phase==="exchange-steal"||game.phase==="exchange-return"?PLAYER_NAMES[exchange?.thief??game.current]+" · CARD EXCHANGE":game.phase==="round-over"?"DEAL COMPLETE":game.phase==="match-over"?"MATCH COMPLETE":PLAYER_NAMES[game.current]+"'S TURN"}</div>
  </div>
  {game.phase==="trump"?<div className="trick-resolution"><b>Choose your trump suit</b><p>You are the 5-trick player. Select the suit that beats every non-trump card.</p><div className="trick-hand trump-preview">{visibleHand.map(card=><div className="trick-hand-card" key={card.id}><CardFace card={card}/></div>)}</div><div className="trump-options">{SUITS.map(suit=><button key={suit} className={RED[suit]?"red":"black"} onClick={()=>chooseTrump(suit)}><strong>{suit}</strong><small>{suit==="♠"?"Spades":suit==="♥"?"Hearts":suit==="♦"?"Diamonds":"Clubs"}</small></button>)}</div><small className="trick-help">Choose from your first five cards; then the remaining five are dealt.</small></div>:
   game.phase==="exchange-steal"?<div className="trick-resolution"><b>Pull a card</b><p>{PLAYER_NAMES[exchange?.thief??0]} may take one hidden card from {PLAYER_NAMES[exchange?.victim??1]}.</p><button className="primary-button" onClick={blindSteal}>Blindly take a card <ShieldCheck size={15}/></button></div>:
   game.phase==="exchange-return"?<div className="trick-resolution"><b>Give one card back</b><p>Return a different card from a suit where you hold at least three cards before returning. The stolen card cannot be returned.</p><div className="trick-hand">{visibleHand.map((card,index)=>{const allowed=validReturn.includes(card.id);return <button key={card.id} className={`trick-hand-card ${allowed?"legal":"dim"} ${selected===index?"selected":""}`} onClick={()=>allowed&&returnCard(card.id)} onMouseEnter={()=>setSelected(index)}><CardFace card={card} selected={selected===index} dim={!allowed}/></button>;})}</div><small>{validReturn.length} valid return cards</small></div>:
   game.phase==="playing"?<div className="trick-hand-panel"><div className="trick-hand-heading"><div><span className="stat-label">PLAYER HAND</span><h3>{PLAYER_NAMES[game.current]} <small>· {game.hands[game.current].length} cards</small></h3></div><div className="trick-target-chip">TARGET <b>{game.quota[game.current]}</b></div></div><div className="trick-hand">{visibleHand.map((card,index)=>{const allowed=legal.includes(card.id);return <button key={card.id} className={`trick-hand-card ${allowed?"legal":"dim"} ${selected===index?"selected":""}`} onClick={()=>{setSelected(index);if(allowed)playCard(card.id);}} onMouseEnter={()=>setSelected(index)}><CardFace card={card} selected={selected===index} dim={!allowed}/></button>;})}</div><div className="uno-bottom-hint"><span>Follow the led suit if you have one.</span><span>Highest trump wins; otherwise highest led suit.</span></div></div>:
   game.phase==="round-over"?<div className="trick-resolution"><h3>Round {game.round+1} complete</h3><div className="trick-round-results">{game.tricksWon.map((count,p)=><div key={p}><b>{PLAYER_NAMES[p]}</b><span>{count} / {game.quota[p]} tricks</span><strong>{count-game.quota[p]>0?"+":""}{count-game.quota[p]}</strong></div>)}</div><p>Players above quota can pull a hidden card from players below quota in the next deal.</p><button className="primary-button" onClick={nextDeal}>Start round {game.round+2} <ArrowRight size={15}/></button></div>:
   <div className="trick-resolution"><h3>🏆 Match complete</h3><p>{winningPlayers.map(p=>PLAYER_NAMES[p.index]).join(" & ")} {winningPlayers.length>1?"share the win":"wins"} with a net score of {maxScore>0?"+":""}{maxScore}.</p><div className="trick-round-results">{game.matchScores.map((score,p)=><div key={p}><b>{PLAYER_NAMES[p]}</b><span>Net score</span><strong>{score>0?"+":""}{score}</strong></div>)}</div><button className="primary-button" onClick={newMatch}>New match <RotateCcw size={15}/></button></div>}
  <div className="trick-footer"><span>30-card deck · 10 tricks per deal · 3 rotating quota deals</span><button className="ghost-button" onClick={newMatch}><RotateCcw size={14}/> Restart match</button></div>
 </div>;
}