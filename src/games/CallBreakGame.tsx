import { useEffect, useMemo, useState } from "react";
import { Bot, Crown, History, RotateCcw, Shield, Sparkles, Trophy } from "lucide-react";

type Suit = "♠" | "♥" | "♦" | "♣";
type Card = { id: string; suit: Suit; rank: string };
type Played = { player: number; card: Card };
type Phase = "bidding" | "playing" | "round-over" | "match-over";
type Game = {
  round: number;
  dealer: number;
  hands: Card[][];
  bids: (number | null)[];
  tricks: number[];
  scores: number[];
  phase: Phase;
  current: number;
  lead: number;
  trick: Played[];
  lastTrick: Played[] | null;
  message: string;
};
const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const RED: Record<Suit, boolean> = { "♠": false, "♥": true, "♦": true, "♣": false };
const NAMES = ["You", "Nova", "Atlas", "Mira"];
const VALUE: Record<string, number> = { A:14, K:13, Q:12, J:11, "10":10, "9":9, "8":8, "7":7, "6":6, "5":5, "4":4, "3":3, "2":2 };
const shuffle = <T,>(input: T[]) => {
  const a = [...input];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const makeDeck = (): Card[] => shuffle(SUITS.flatMap(suit => RANKS.map(rank => ({ id: rank + suit, rank, suit }))));
const newRound = (round: number, scores: number[]): Game => {
  const deck = makeDeck(), hands = Array.from({ length: 4 }, () => [] as Card[]);
  for (let i = 0; i < 13; i++) for (let p = 0; p < 4; p++) hands[p].push(deck.pop()!);
  const dealer = (round - 1) % 4, first = (dealer + 1) % 4;
  return { round, dealer, hands, bids:[null,null,null,null], tricks:[0,0,0,0], scores, phase:"bidding", current:first, lead:first, trick:[], lastTrick:null, message:"Study your cards. Call how many tricks you expect to win." };
};
const rankValue = (card: Card) => VALUE[card.rank];
function legalCards(hand: Card[], trick: Played[]) {
  if (!trick.length) return hand;
  const led = trick[0].card.suit, following = hand.filter(card => card.suit === led);
  return following.length ? following : hand;
}
function beats(a: Card, b: Card, led: Suit) {
  if (a.suit === "♠" && b.suit !== "♠") return true;
  if (b.suit === "♠" && a.suit !== "♠") return false;
  if (a.suit !== b.suit) return false;
  return rankValue(a) > rankValue(b);
}
function trickWinner(trick: Played[]) {
  const led = trick[0].card.suit;
  return trick.reduce((best, play) => beats(play.card, best.card, led) ? play : best, trick[0]).player;
}
function estimateBid(hand: Card[]) {
  const spades = hand.filter(c => c.suit === "♠").length;
  const highSpades = hand.filter(c => c.suit === "♠" && rankValue(c) >= 11).length;
  const highOffsuit = hand.filter(c => c.suit !== "♠" && rankValue(c) >= 13).length;
  const voids = SUITS.filter(s => !hand.some(c => c.suit === s)).length;
  return Math.max(1, Math.min(13, Math.round(spades * .5 + highSpades * .55 + highOffsuit * .45 + voids * .3)));
}
function chooseBotCard(hand: Card[], trick: Played[]) {
  const legal = legalCards(hand, trick);
  if (!trick.length) {
    const nonTrump = legal.filter(c => c.suit !== "♠");
    return [...(nonTrump.length ? nonTrump : legal)].sort((a,b) => rankValue(a)-rankValue(b))[0];
  }
  const led = trick[0].card.suit;
  const currentWinner = trick.reduce((best,play) => beats(play.card,best.card,led) ? play : best, trick[0]);
  const winners = legal.filter(card => beats(card,currentWinner.card,led));
  if (winners.length) return [...winners].sort((a,b) => rankValue(a)-rankValue(b))[0];
  return [...legal].sort((a,b) => rankValue(a)-rankValue(b))[0];
}
function CardFace({ card, selected = false, dim = false }: { card: Card; selected?: boolean; dim?: boolean }) {
  return <div className={`cb-card-face ${RED[card.suit] ? "red" : "black"} ${selected ? "selected" : ""} ${dim ? "dim" : ""}`}>
    <span className="cb-corner">{card.rank}<i>{card.suit}</i></span><strong>{card.suit}</strong><span className="cb-corner bottom">{card.rank}<i>{card.suit}</i></span>
  </div>;
}

export default function CallBreakGame() {
  const [game, setGame] = useState<Game>(() => newRound(1, [0,0,0,0]));
  const [bid, setBid] = useState(3);
  const [selected, setSelected] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const hand = game.hands[0];
  const sortedHand = useMemo(() => [...hand].sort((a,b) => SUITS.indexOf(a.suit)-SUITS.indexOf(b.suit) || rankValue(b)-rankValue(a)), [hand]);
  const legal = useMemo(() => game.phase === "playing" && game.current === 0 ? legalCards(hand,game.trick).map(c=>c.id) : [], [game.phase,game.current,hand,game.trick]);
  const scoreOrder = game.scores.map((score,index)=>({score,index})).sort((a,b)=>b.score-a.score);

  const call = (player: number, value: number) => {
    setGame(old => {
      if (old.phase !== "bidding" || old.current !== player || old.bids[player] !== null) return old;
      const bids = [...old.bids]; bids[player] = value;
      const next = (player + 1) % 4;
      if (bids.every(v => v !== null)) return {...old,bids,phase:"playing",current:old.lead,message:"All calls are locked. Lead the opening trick."};
      return {...old,bids,current:next,message:`${NAMES[next]} is deciding their call.`};
    });
  };

  const play = (player: number, id: string) => {
    setGame(old => {
      if (old.phase !== "playing" || old.current !== player) return old;
      const card = old.hands[player].find(c => c.id === id);
      if (!card || !legalCards(old.hands[player],old.trick).some(c=>c.id===id)) return old;
      const hands = old.hands.map(cards=>[...cards]);
      hands[player] = hands[player].filter(c=>c.id!==id);
      const trick = [...old.trick,{player,card}];
      if (trick.length < 4) return {...old,hands,trick,current:(player+1)%4,message:`${NAMES[(player+1)%4]} is to play.`};
      const winning = trickWinner(trick), tricks = [...old.tricks]; tricks[winning]++;
      if (tricks.reduce((a,b)=>a+b,0) === 13) {
        const roundPoints = tricks.map((count,p) => {
          const target = old.bids[p] ?? 1;
          return count >= target ? target + (count-target)*.1 : -target;
        });
        const scores = old.scores.map((score,p)=>score+roundPoints[p]);
        return {...old,hands,tricks,scores,trick:[],lastTrick:trick,phase:old.round===5?"match-over":"round-over",message:`${NAMES[winning]} took the final trick. Round ${old.round} is complete.`};
      }
      return {...old,hands,tricks,trick:[],lastTrick:trick,lead:winning,current:winning,message:`${NAMES[winning]} wins the trick and leads next.`};
    });
    setSelected(0);
  };

  const nextRound = () => setGame(old=>newRound(old.round+1,old.scores));
  const newMatch = () => { setGame(newRound(1,[0,0,0,0])); setBid(3); setSelected(0); setShowScore(false); };

  useEffect(() => {
    if (game.phase === "bidding" && game.current !== 0 && game.bids[game.current] === null) {
      const player = game.current, timer = window.setTimeout(() => call(player,estimateBid(game.hands[player])),700);
      return () => window.clearTimeout(timer);
    }
    if (game.phase === "playing" && game.current !== 0) {
      const player = game.current, timer = window.setTimeout(() => {
        const card = chooseBotCard(game.hands[player],game.trick);
        if (card) play(player,card.id);
      },780);
      return () => window.clearTimeout(timer);
    }
  }, [game.phase,game.current,game.bids,game.trick,game.hands]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || game.current !== 0) return;
      if (event.key.toLowerCase() === "r") { event.preventDefault(); newMatch(); return; }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault(); setSelected(v=>Math.max(0,Math.min(sortedHand.length-1,v+(event.key==="ArrowLeft"?-1:1)))); return;
      }
      if (event.key === "Enter" && game.phase === "playing") { event.preventDefault(); const card=sortedHand[selected]; if(card)play(0,card.id); }
    };
    window.addEventListener("keydown",key); return ()=>window.removeEventListener("keydown",key);
  }, [game.current,game.phase,sortedHand,selected]);

  const activeTricks = game.tricks.reduce((a,b)=>a+b,0);
  const currentBid = game.bids[0];
  return <div className="callbreak-pro">
    <div className="cb-header">
      <div><span className="cb-kicker"><i/> SPADES ARE TRUMP · 4 PLAYER TABLE</span><h3>Call <em>Break</em></h3><p>Read the hand. Make your call. Own the trick.</p></div>
      <div className="cb-header-actions"><span className="cb-round">ROUND <b>{game.round}</b> / 5</span><button className="cb-icon-button" onClick={()=>setShowScore(v=>!v)}><History size={15}/> SCORECARD</button><button className="cb-icon-button" onClick={newMatch}><RotateCcw size={15}/> NEW MATCH</button></div>
    </div>
    <div className="cb-score-strip">{[0,1,2,3].map(p=><div key={p} className={game.current===p?"active":""}><span className={`cb-avatar cb-avatar-${p}`}>{p===0?"Y":<Bot size={15}/>}</span><div><b>{NAMES[p]}</b><small>{game.bids[p]===null?"WAITING TO CALL":`CALL ${game.bids[p]} · ${game.tricks[p]}/13 TRICKS`}</small></div><strong>{game.scores[p].toFixed(1)}</strong></div>)}</div>
    <div className="cb-felt">
      <div className="cb-table-ornament">♠ <span>PLAYVERSE · PRIVATE TABLE</span> ♠</div>
      <div className="cb-opponent-row">{[1,2,3].map(p=><div className={`cb-opponent ${game.current===p?"active":""}`} key={p}><div className={`cb-avatar cb-avatar-${p}`}><Bot size={16}/></div><b>{NAMES[p]}</b><small>{game.hands[p].length} CARDS · {game.bids[p]===null?"BIDDING":`BID ${game.bids[p]}`}</small><div className="cb-card-back">{Array.from({length:Math.min(game.hands[p].length,5)},(_,i)=><i key={i}/>)}</div></div>)}</div>
      <div className="cb-table-centre"><div className="cb-trick-pile">{game.trick.length?game.trick.map((play,index)=><div className={`cb-played cb-played-${index}`} key={play.card.id}><CardFace card={play.card}/><small>{NAMES[play.player]}</small></div>):<div className="cb-table-empty"><span>♠</span><b>{game.phase==="bidding"?"THE NEXT TRICK STARTS HERE":"LEAD A CARD"}</b><small>SPADES · PERMANENT TRUMP</small></div>}</div><div className="cb-table-status"><span><i/> {game.phase==="bidding"?"BIDDING PHASE":game.phase==="playing"?"TRICK IN PROGRESS":game.phase==="round-over"?"ROUND COMPLETE":"MATCH COMPLETE"}</span><b>{activeTricks} <small>/ 13 TRICKS</small></b></div></div>
      <div className="cb-you-seat"><span className="cb-avatar cb-avatar-0">Y</span><div><b>YOUR SEAT</b><small>{game.phase==="bidding"&&game.current===0?"CHOOSE YOUR CALL":game.phase==="playing"&&game.current===0?"YOUR TURN":game.phase==="playing"?"CPU PLAYING":"ROUND SCORE"}</small></div><span className="cb-you-badge">PLAYER 01</span></div>
    </div>
    {showScore&&<div className="cb-score-modal"><div><b>Match scorecard</b><button onClick={()=>setShowScore(false)}>×</button></div>{scoreOrder.map(({score,index})=><p key={index}><span>{NAMES[index]}</span><strong>{score.toFixed(1)}</strong></p>)}</div>}
    {game.phase==="bidding"&&game.current===0?<div className="cb-action-panel"><div className="cb-action-copy"><span className="cb-panel-label">YOUR CONTRACT</span><h4>How many tricks will you take?</h4><p>Choose a call from 1 to 13. Spades are always trump.</p><div className="cb-hand-preview">{sortedHand.map(card=><div key={card.id}><CardFace card={card}/></div>)}</div></div><div className="cb-bid-control"><div className="cb-bid-number">{bid}<small>TRICKS</small></div><div className="cb-bid-buttons">{Array.from({length:13},(_,i)=>i+1).map(n=><button key={n} className={bid===n?"active":""} onClick={()=>setBid(n)}>{n}</button>)}</div><button className="cb-primary" onClick={()=>call(0,bid)}>CONFIRM CALL <Sparkles size={15}/></button></div></div>:
      game.phase==="bidding"?<div className="cb-wait-panel"><Bot size={18}/> {NAMES[game.current]} is evaluating their hand…</div>:
      game.phase==="playing"?<div className="cb-hand-panel"><div className="cb-hand-head"><div><span className="cb-panel-label">YOUR HAND</span><h4>Player One <small>· {sortedHand.length} cards</small></h4></div><div className="cb-hand-rules"><span><Shield size={13}/> FOLLOW SUIT</span><span>HIGHEST SPADE WINS</span></div></div><div className="cb-hand">{sortedHand.map((card,index)=>{const enabled=legal.includes(card.id);return <button key={card.id} className={`cb-hand-card ${enabled?"playable":"dim"} ${selected===index?"selected":""}`} disabled={!enabled||game.current!==0} onMouseEnter={()=>setSelected(index)} onClick={()=>play(0,card.id)}><CardFace card={card} selected={selected===index}/></button>;})}</div><div className="cb-hand-footer"><span>SELECT A LEGAL CARD TO PLAY</span><span><kbd>← →</kbd> SELECT <kbd>ENTER</kbd> PLAY <kbd>R</kbd> NEW MATCH</span></div></div>:
      <div className="cb-round-result"><div className="cb-result-icon"><Trophy size={25}/></div><span className="cb-panel-label">{game.phase==="match-over"?"MATCH COMPLETE":"ROUND COMPLETE"}</span><h4>{game.phase==="match-over"?"The table has a winner.":"Calls are settled."}</h4><div className="cb-result-table">{[0,1,2,3].map(p=><div key={p}><span>{NAMES[p]}</span><b>{game.tricks[p]} / {game.bids[p]} tricks</b><strong>{game.scores[p].toFixed(1)}</strong></div>)}</div><button className="cb-primary" onClick={game.phase==="match-over"?newMatch:nextRound}>{game.phase==="match-over"?"PLAY AGAIN":"NEXT ROUND"} <Sparkles size={15}/></button></div>}
    <div className="cb-footer"><span>52-CARD DECK · 13 CARDS EACH · FIVE-ROUND MATCH</span><span>LOCAL OFFLINE GAME · 3 COMPUTER OPPONENTS</span></div>
  </div>;
}
