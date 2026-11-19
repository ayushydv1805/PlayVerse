import { useCallback, useEffect, useMemo, useState } from "react";
import { Dice5, RotateCcw } from "lucide-react";
const SNAKES:Record<number,number>={16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78};
const LADDERS:Record<number,number>={1:38,4:14,9:31,21:42,28:84,36:44,51:67,71:91,80:100};
const PLAYER_COLORS=["#ef6268","#5b91e3","#58bf87","#e8b84e"];
const PLAYER_NAMES=["Ruby","Sapphire","Jade","Sunshine"];
type Player={position:number};
function boardNumber(rowFromTop:number,col:number){const rowFromBottom=9-rowFromTop;return rowFromBottom%2===0?rowFromBottom*10+col+1:rowFromBottom*10+(10-col);}
export default function SnakesLaddersGame(){
 const [players,setPlayers]=useState<2|3|4>(2),[positions,setPositions]=useState<Player[]>([{position:0},{position:0}]),[turn,setTurn]=useState(0);
 const [dice,setDice]=useState<number|null>(null),[rolling,setRolling]=useState(false),[winner,setWinner]=useState<number|null>(null),[message,setMessage]=useState("Roll the dice to begin your climb.");
 const reset=useCallback((count:2|3|4=players)=>{setPlayers(count);setPositions(Array.from({length:count},()=>({position:0})));setTurn(0);setDice(null);setWinner(null);setRolling(false);setMessage("Roll the dice to begin your climb.");},[players]);
 const roll=useCallback(()=>{
  if(winner!==null||rolling)return;setRolling(true);const result=Math.floor(Math.random()*6)+1;
  window.setTimeout(()=>{
   const before=positions[turn].position,step=before+result;let after=before;
   if(step>100)setMessage(`Need an exact ${100-before} to finish. Stay on ${before}.`);
   else{after=SNAKES[step]??LADDERS[step]??step;if(SNAKES[step])setMessage(`Oh no! Snake at ${step}. Slide down to ${after}.`);else if(LADDERS[step])setMessage(`Great climb! Ladder from ${step} to ${after}.`);else setMessage(after===100?"Perfect roll! You reached the summit.":`Player ${turn+1} moved to ${after}.`);}
   setPositions(old=>old.map((p,index)=>index===turn?{position:after}:p));setDice(result);setRolling(false);
   if(after===100){setWinner(turn);setMessage(`${PLAYER_NAMES[turn]} reached 100 and wins!`);}else setTurn(value=>(value+1)%players);
  },430);
 },[winner,rolling,positions,turn,players]);
 useEffect(()=>{const onKey=(event:KeyboardEvent)=>{if(event.key===" "||event.key==="Enter"){event.preventDefault();roll();}if(event.key.toLowerCase()==="r"){event.preventDefault();reset();}};window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);},[roll,reset]);
 const cells=useMemo(()=>Array.from({length:100},(_,i)=>{
  const row=Math.floor(i/10),col=i%10,n=boardNumber(row,col),occupants=positions.map((p,index)=>({...p,index})).filter(p=>p.position===n);
  const snakeStart=Boolean(SNAKES[n]),ladderStart=Boolean(LADDERS[n]);
  return <div key={n} className={`sl-cell ${(row+col)%2===0?"sl-alt":""} ${snakeStart?"sl-snake-start":""} ${ladderStart?"sl-ladder-start":""}`}><span className="sl-cell-number">{n}</span>{snakeStart&&<span className="sl-mark sl-snake">🐍</span>}{ladderStart&&<span className="sl-mark sl-ladder">🪜</span>}<div className="sl-pawns">{occupants.map(p=><i key={p.index} style={{background:PLAYER_COLORS[p.index]}} title={PLAYER_NAMES[p.index]}/>)}</div></div>;
 }),[positions]);
 return <div className="sl-layout"><div className="sl-board-column">
  <div className="sl-board-head"><div><span className="stat-label">THE CLASSIC CLIMB</span><h3>Race to <span>100.</span></h3></div><span className="sl-board-note">2–4 LOCAL PLAYERS</span></div>
  <div className="sl-board-shell"><div className="sl-board">{cells}</div><div className="sl-route-legend"><span><i className="snake-legend"/>Snakes take you down</span><span><i className="ladder-legend"/>Ladders take you up</span></div></div>
  <div className="sl-controls"><span><b>SPACE / ENTER</b> roll dice <b>R</b> restart</span><button className="sl-roll-button" onClick={roll} disabled={rolling||winner!==null}><Dice5 size={18}/>{rolling?"Rolling…":"Roll dice"}<strong>{dice??"—"}</strong></button><button className="sl-reset-button" onClick={()=>reset()} aria-label="Restart game"><RotateCcw size={16}/></button></div>
 </div><aside className="sl-side">
  <div className="sl-turn-card"><span className="stat-label">{winner!==null?"WINNER":"CURRENT TURN"}</span><div className="sl-turn-name"><i style={{background:PLAYER_COLORS[winner??turn]}}/>{winner!==null?PLAYER_NAMES[winner]:PLAYER_NAMES[turn]}</div><p>{winner!==null?"The summit is yours!":message}</p></div>
  <div className="sl-dice-card"><span className="stat-label">DICE RESULT</span><div className={`sl-dice ${rolling?"rolling":""}`}>{dice??"?"}</div><small>Need an exact roll to reach 100.</small></div>
  <div className="sl-players-card"><div className="scoreboard-heading"><span className="stat-label">RACE STATUS</span><span className="sl-player-count">{players} PLAYERS</span></div>{positions.map((p,index)=><div className={`sl-player-row ${turn===index&&winner===null?"active":""}`} key={index}><i style={{background:PLAYER_COLORS[index]}}/><div><b>{PLAYER_NAMES[index]}</b><small>{p.position===0?"At start":`Square ${p.position}`}</small></div><strong>{p.position}</strong></div>)}</div>
  <div className="sl-player-select"><span className="stat-label">PLAYERS</span><div>{([2,3,4] as const).map(n=><button key={n} className={players===n?"active":""} onClick={()=>reset(n)}>{n}</button>)}</div></div>
  <div className="tip-card"><span className="tip-icon">✦</span><div><b>One hundred is the goal</b><p>Climb ladders to jump ahead, but watch out for snakes. You need the exact number to finish.</p></div></div>
 </aside></div>;
}