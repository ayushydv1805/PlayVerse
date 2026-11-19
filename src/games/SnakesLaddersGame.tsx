import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Crown, Dice5, Footprints, RotateCcw, Users } from "lucide-react";

type Mode = "computer" | "local";
type Player = { position: number; dice: number | null };
const SNAKES:Record<number,number>={16:6,47:26,49:11,56:53,62:19,64:60,87:24,93:73,95:75,98:78};
const LADDERS:Record<number,number>={1:38,4:14,9:31,21:42,28:84,36:44,51:67,71:91,80:100};
const COLORS=["#f4c45c","#60a3ff","#4bd0a0","#ee7c86"];
const NAMES=["You","Nova","Atlas","Mira"];
function boardNumber(row:number,col:number){const fromBottom=9-row;return fromBottom%2===0?fromBottom*10+col+1:fromBottom*10+(10-col);}
export default function SnakesLaddersGame(){
  const [mode,setMode]=useState<Mode>("computer");
  const [playerCount,setPlayerCount]=useState<2|3|4>(2);
  const [positions,setPositions]=useState<Player[]>(()=>Array.from({length:2},()=>({position:0,dice:null})));
  const [turn,setTurn]=useState(0),[rolling,setRolling]=useState(false),[winner,setWinner]=useState<number|null>(null);
  const [message,setMessage]=useState("Roll the dice. Every step brings you closer to the summit.");
  const bot=(seat:number)=>mode==="computer"&&seat>0;
  const reset=(nextMode:Mode=mode,count:2|3|4=playerCount)=>{
    setMode(nextMode);setPlayerCount(count);setPositions(Array.from({length:count},()=>({position:0,dice:null})));
    setTurn(0);setWinner(null);setRolling(false);setMessage("Roll the dice. Every step brings you closer to the summit.");
  };
  const roll=useCallback(()=>{
    if(winner!==null||rolling)return;
    setRolling(true);
    const player=turn;
    window.setTimeout(()=>{
      const result=Math.floor(Math.random()*6)+1;
      const before=positions[player].position,step=before+result;
      const after=step>100?before:(SNAKES[step]??LADDERS[step]??step);
      setPositions(old=>old.map((p,index)=>index===player?{position:after,dice:result}:p));
      if(step>100)setMessage("A precise roll is needed. You stay on square "+before+".");
      else if(SNAKES[step])setMessage(`Snake! ${step} sends ${NAMES[player]} back to ${after}.`);
      else if(LADDERS[step])setMessage(`Beautiful climb. Ladder ${step} → ${after}.`);
      else setMessage(after===100?NAMES[player]+" reached the summit!":NAMES[player]+" moved to square "+after+".");
      setRolling(false);
      if(after===100){setWinner(player);setMessage(NAMES[player]+" reached 100 and wins the match.");}
      else setTurn((player+1)%playerCount);
    },420);
  },[winner,rolling,turn,playerCount,positions]);
  useEffect(()=>{
    if(winner!==null||!bot(turn))return;
    const timer=window.setTimeout(()=>roll(),850);
    return ()=>window.clearTimeout(timer);
  },[turn,winner,mode,roll]);
  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.ctrlKey||event.metaKey||event.altKey||bot(turn))return;
      if(event.key.toLowerCase()==="r"){event.preventDefault();reset();return;}
      if(event.key===" "||event.key==="Enter"){event.preventDefault();roll();}
    };
    window.addEventListener("keydown",key);return()=>window.removeEventListener("keydown",key);
  },[roll,turn,mode]);
  const cells=useMemo(()=>Array.from({length:100},(_,i)=>{
    const row=Math.floor(i/10),col=i%10,n=boardNumber(row,col),occupants=positions.map((p,index)=>({...p,index})).filter(p=>p.position===n);
    return <div key={n} className={`sl-pro-cell ${(row+col)%2===0?"stone":""} ${SNAKES[n]?"snake-start":""} ${LADDERS[n]?"ladder-start":""}`}>
      <span className="sl-pro-number">{n}</span>{SNAKES[n]&&<span className="sl-pro-symbol snake">⌁</span>}{LADDERS[n]&&<span className="sl-pro-symbol ladder">↗</span>}
      <div className="sl-pro-pawns">{occupants.map(p=><i key={p.index} style={{background:COLORS[p.index]}} title={NAMES[p.index]}/>)}</div>
    </div>;
  }),[positions]);
  return <div className="snakes-pro">
    <div className="pro-game-toolbar">
      <div className="pro-game-title"><span className="pro-live"><i/> ADVENTURE BOARD · TABLE 02</span><h3>Snakes <em>&</em> Ladders</h3><p>One hundred squares. A hundred chances to change the game.</p></div>
      <div className="pro-toolbar-actions"><div className="pro-segment"><button className={mode==="computer"?"active":""} onClick={()=>reset("computer",playerCount)}><Bot size={14}/> VS COMPUTER</button><button className={mode==="local"?"active":""} onClick={()=>reset("local",2)}><Users size={14}/> PASS & PLAY</button></div><button className="pro-icon-button" onClick={()=>reset()} aria-label="New match"><RotateCcw size={16}/></button></div>
    </div>
    <div className="sl-pro-layout">
      <section className="sl-pro-stage">
        <div className="sl-pro-score-row">{positions.map((p,index)=><div key={index} className={`sl-pro-seat ${turn===index?"turn":""}`}><span className="sl-pro-avatar" style={{background:COLORS[index]}}>{bot(index)?<Bot size={16}/>:index===0?"Y":NAMES[index][0]}</span><div><b>{NAMES[index]}</b><small>{p.position===0?"AT START":p.position===100?"FINISHED":`SQUARE ${p.position}`}</small></div><div className={`sl-pro-die ${p.dice===6?"six":""}`}>{p.dice??"·"}</div></div>)}</div>
        <div className="sl-pro-board-frame"><div className="sl-pro-board-meta"><span><i/> THE CLIMB TO 100</span><span><b>↗</b> LADDER <b className="snake-legend-symbol">⌁</b> SNAKE</span></div><div className="sl-pro-board">{cells}</div><div className="sl-pro-board-foot"><span>START <b>01</b></span><span>FINISH <b>100</b></span><span>NEED AN EXACT ROLL</span></div></div>
        <div className="pro-keyboard-note"><span>KEYBOARD</span><kbd>SPACE / ENTER</kbd> ROLL DICE <kbd>R</kbd> NEW MATCH</div>
      </section>
      <aside className="sl-pro-panel">
        <div className="pro-turn-panel"><span className="pro-panel-label">{winner!==null?"MATCH WINNER":"CURRENT PLAYER"}</span><div className="pro-current-player gold"><i/>{winner!==null?NAMES[winner]:bot(turn)?"Nova · CPU":NAMES[turn]}</div><p>{message}</p>{winner!==null&&<div className="pro-victory"><Crown size={18}/> VICTORY · {NAMES[winner].toUpperCase()}</div>}</div>
        <div className="pro-dice-panel"><div><span className="pro-panel-label">TURN DICE</span><small>{rolling?"ROLLING…":bot(turn)?"COMPUTER TURN":winner!==null?"MATCH COMPLETE":"READY TO ROLL"}</small></div><button className={`pro-dice-button ${rolling?"rolling":""} ${positions[turn]?.dice===6?"six":""}`} onClick={roll} disabled={rolling||winner!==null||bot(turn)}><span>{positions[turn]?.dice??"?"}</span><Dice5 size={21}/></button><button className="pro-roll-cta" onClick={roll} disabled={rolling||winner!==null||bot(turn)}>ROLL DICE <span>SPACE</span></button></div>
        <div className="pro-roster-panel"><div className="pro-panel-heading"><span className="pro-panel-label">RACE STANDINGS</span><span>{playerCount} SEATS</span></div>{positions.map((p,index)=><div key={index} className={`pro-roster-row ${turn===index&&winner===null?"active":""}`}><span className="pro-roster-dot" style={{background:COLORS[index]}}/><div><b>{NAMES[index]} {bot(index)?"· CPU":""}</b><small>{p.position===0?"Waiting at start":`Square ${p.position}`}</small></div><strong>{p.dice??"—"}</strong></div>)}</div>
        <div className="pro-match-options"><span className="pro-panel-label">RACE SIZE</span><div>{([2,3,4] as const).map(n=><button key={n} className={playerCount===n?"active":""} onClick={()=>reset(mode,n)}>{n} SEATS</button>)}</div></div>
        <div className="pro-round-tools"><span><Footprints size={15}/> Ladders lift you. Snakes test your luck.</span><button onClick={()=>reset()}>NEW GAME <RotateCcw size={13}/></button></div>
      </aside>
    </div>
  </div>;
}
