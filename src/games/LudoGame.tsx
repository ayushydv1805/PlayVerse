import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Dice5, RotateCcw } from "lucide-react";

type Color = "red" | "green" | "yellow" | "blue";
type Token = { progress: number };
type Point = { row: number; col: number };

const COLORS: Color[] = ["red", "green", "yellow", "blue"];
const COLOR_LABEL: Record<Color, string> = { red: "Ruby", green: "Jade", yellow: "Sun", blue: "Sapphire" };
const START_INDEX: Record<Color, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const HOME_LANES: Record<Color, Point[]> = {
  red: [{row:7,col:1},{row:7,col:2},{row:7,col:3},{row:7,col:4},{row:7,col:5},{row:7,col:6}],
  green: [{row:1,col:7},{row:2,col:7},{row:3,col:7},{row:4,col:7},{row:5,col:7},{row:6,col:7}],
  yellow: [{row:7,col:13},{row:7,col:12},{row:7,col:11},{row:7,col:10},{row:7,col:9},{row:7,col:8}],
  blue: [{row:13,col:7},{row:12,col:7},{row:11,col:7},{row:10,col:7},{row:9,col:7},{row:8,col:7}]
};
const TRACK: Point[] = [
 {row:6,col:1},{row:6,col:2},{row:6,col:3},{row:6,col:4},{row:6,col:5},
 {row:5,col:6},{row:4,col:6},{row:3,col:6},{row:2,col:6},{row:1,col:6},{row:0,col:6},
 {row:0,col:7},{row:0,col:8},{row:1,col:8},{row:2,col:8},{row:3,col:8},{row:4,col:8},{row:5,col:8},
 {row:6,col:9},{row:6,col:10},{row:6,col:11},{row:6,col:12},{row:6,col:13},{row:6,col:14},
 {row:7,col:14},{row:8,col:14},{row:8,col:13},{row:8,col:12},{row:8,col:11},{row:8,col:10},{row:8,col:9},
 {row:9,col:8},{row:10,col:8},{row:11,col:8},{row:12,col:8},{row:13,col:8},{row:14,col:8},
 {row:14,col:7},{row:14,col:6},{row:13,col:6},{row:12,col:6},{row:11,col:6},{row:10,col:6},{row:9,col:6},
 {row:8,col:5},{row:8,col:4},{row:8,col:3},{row:8,col:2},{row:8,col:1},{row:8,col:0},
 {row:7,col:0},{row:6,col:0}
];
const SAFE = new Set([0,8,13,21,26,34,39,47]);
const YARD_SPOTS: Record<Color, Point[]> = {
 red:[{row:1.7,col:1.7},{row:1.7,col:4.3},{row:4.3,col:1.7},{row:4.3,col:4.3}],
 green:[{row:1.7,col:10.7},{row:1.7,col:13.3},{row:4.3,col:10.7},{row:4.3,col:13.3}],
 yellow:[{row:10.7,col:10.7},{row:10.7,col:13.3},{row:13.3,col:10.7},{row:13.3,col:13.3}],
 blue:[{row:10.7,col:1.7},{row:10.7,col:4.3},{row:13.3,col:1.7},{row:13.3,col:4.3}]
};
const PLAYER_SETS: Record<number,Color[]> = {2:["red","yellow"],3:["red","green","yellow"],4:COLORS};
const colorHex = (color:Color) => ({red:"#ef6268",green:"#56ba83",yellow:"#e8b94f",blue:"#5c8ee0"})[color];
const cellCenter = (point:Point) => ({x:(point.col+.5)*40,y:(point.row+.5)*40});
function initialTokens():Record<Color,Token[]>{return {red:Array.from({length:4},()=>({progress:-1})),green:Array.from({length:4},()=>({progress:-1})),yellow:Array.from({length:4},()=>({progress:-1})),blue:Array.from({length:4},()=>({progress:-1}))};}
function legalTokens(tokens:Record<Color,Token[]>,color:Color,dice:number){return tokens[color].map((token,index)=>({token,index})).filter(({token})=>token.progress===-1?dice===6:token.progress+dice<=56).map(({index})=>index);}

export default function LudoGame(){
 const [playerCount,setPlayerCount]=useState<2|3|4>(4);
 const [tokens,setTokens]=useState<Record<Color,Token[]>>(initialTokens);
 const [turnIndex,setTurnIndex]=useState(0);
 const [dice,setDice]=useState<number|null>(null);
 const [pending,setPending]=useState<number[]|null>(null);
 const [selected,setSelected]=useState(0);
 const [message,setMessage]=useState("Roll a 6 to bring a token out of the yard.");
 const [winner,setWinner]=useState<Color|null>(null);
 const activePlayers=PLAYER_SETS[playerCount];
 const currentColor=activePlayers[turnIndex%activePlayers.length];
 const choices=pending??[];
 const movable=choices.length>0;

 const reset=useCallback(()=>{
  setTokens(initialTokens());setTurnIndex(0);setDice(null);setPending(null);setSelected(0);setWinner(null);
  setMessage("Roll a 6 to bring a token out of the yard.");
 },[]);
 const advanceTurn=useCallback((extra=false)=>{
  setPending(null);setSelected(0);
  if(!extra)setTurnIndex(value=>(value+1)%activePlayers.length);
 },[activePlayers.length]);

 const rollDice=useCallback(()=>{
  if(winner||pending!==null)return;
  const rolled=Math.floor(Math.random()*6)+1;
  setDice(rolled);
  const available=legalTokens(tokens,currentColor,rolled);
  if(available.length===0){
   setMessage(rolled===6?"No token can use this six. Turn passes.":"No legal move. Turn passes.");
   setPending([]);
   window.setTimeout(()=>advanceTurn(false),850);
   return;
  }
  setPending(available);setSelected(available[0]);
  setMessage(available.length===1?"One token can move. Press Enter or tap it.":"Choose a glowing token. Use ← → or tap it.");
 },[winner,pending,tokens,currentColor,advanceTurn]);

 const moveToken=useCallback((tokenIndex:number)=>{
  if(!pending?.includes(tokenIndex)||winner||dice===null)return;
  const rolled=dice;
  const nextTokens:Record<Color,Token[]>={...tokens};
  nextTokens[currentColor]=tokens[currentColor].map((t,i)=>i===tokenIndex?{progress:t.progress===-1?0:t.progress+rolled}:t);
  const moved=nextTokens[currentColor][tokenIndex];
  let captured=false;
  if(moved.progress>=0&&moved.progress<=50){
   const landing=(START_INDEX[currentColor]+moved.progress)%52;
   if(!SAFE.has(landing)){
    for(const other of activePlayers.filter(c=>c!==currentColor)){
     nextTokens[other]=nextTokens[other].map(t=>{
      if(t.progress>=0&&t.progress<=50&&(START_INDEX[other]+t.progress)%52===landing){captured=true;return {progress:-1};}
      return t;
     });
    }
   }
  }
  setTokens(nextTokens);
  if(nextTokens[currentColor].every(t=>t.progress===56)){
   setWinner(currentColor);setPending(null);setMessage(`${COLOR_LABEL[currentColor]} wins the Ludo match!`);return;
  }
  const extra=rolled===6||captured;
  setMessage(moved.progress===56?"A token reached home!":captured?"Capture! An opponent token returned to its yard.":extra?"Nice! You earned another turn.":"Move complete.");
  advanceTurn(extra);
 },[pending,winner,dice,tokens,currentColor,activePlayers,advanceTurn]);

 useEffect(()=>{
  const onKey=(event:KeyboardEvent)=>{
   if(event.key==="r"||event.key==="R"){event.preventDefault();reset();return;}
   if(event.key===" "){event.preventDefault();rollDice();return;}
   if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();if(choices.length)setSelected(v=>choices[(Math.max(0,choices.indexOf(v)-1))%choices.length]);return;}
   if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();if(choices.length)setSelected(v=>choices[(choices.indexOf(v)+1)%choices.length]);return;}
   if(event.key==="Enter"){event.preventDefault();if(pending===null)rollDice();else if(choices.includes(selected))moveToken(selected);}
  };
  window.addEventListener("keydown",onKey);return ()=>window.removeEventListener("keydown",onKey);
 },[choices,pending,selected,reset,rollDice,moveToken]);

 const squares=useMemo(()=>TRACK.map((p,index)=>{
  const center=cellCenter(p),safe=SAFE.has(index),start=COLORS.find(c=>START_INDEX[c]===index);
  return <g key={index}><rect x={p.col*40+2} y={p.row*40+2} width="36" height="36" rx="7" className={`ludo-track-square ${safe?"safe":""}`}/>{start&&<circle cx={center.x} cy={center.y} r="6" fill={colorHex(start)}/ >}{safe&&<text x={center.x} y={center.y+5} textAnchor="middle" className="ludo-star">★</text>}</g>;
 }),[]);
 const yardBases=[{color:"red" as Color,x:0,y:0},{color:"green" as Color,x:9,y:0},{color:"blue" as Color,x:0,y:9},{color:"yellow" as Color,x:9,y:9}];
 const lanes=COLORS.flatMap(color=>HOME_LANES[color].map((p,i)=><rect key={`${color}-lane-${i}`} x={p.col*40+2} y={p.row*40+2} width="36" height="36" rx="7" fill={colorHex(color)} opacity={.35+i*.1}/>));
 const tokenElements=COLORS.flatMap(color=>tokens[color].map((token,index)=>{
  const point=token.progress<0?YARD_SPOTS[color][index]:token.progress<=50?TRACK[(START_INDEX[color]+token.progress)%52]:HOME_LANES[color][Math.min(5,token.progress-51)];
  const center=cellCenter(point),same=tokens[color].slice(0,index).filter(t=>t.progress===token.progress).length;
  const offset=[[-6,-6],[6,-6],[-6,6],[6,6]][same%4],canMove=color===currentColor&&pending?.includes(index),isSelected=canMove&&selected===index;
  return <g key={`${color}-${index}`} className={`ludo-token ${canMove?"movable":""} ${isSelected?"selected":""}`} onClick={()=>canMove&&moveToken(index)} role="button" tabIndex={canMove?0:-1} aria-label={`${COLOR_LABEL[color]} token ${index+1}`}><circle cx={center.x+offset[0]} cy={center.y+offset[1]} r="13" fill={colorHex(color)} stroke="#fff" strokeWidth="2.5"/><circle cx={center.x+offset[0]-3} cy={center.y+offset[1]-4} r="3.2" fill="#ffffff99"/><circle cx={center.x+offset[0]} cy={center.y+offset[1]} r="5" fill="#ffffff35"/></g>;
 }));
 return <div className="ludo-layout">
  <div className="ludo-board-column">
   <div className="ludo-board-shell"><svg className="ludo-board-svg" viewBox="0 0 600 600" role="img" aria-label="Ludo board with four coloured home bases and token tracks">
    <rect width="600" height="600" rx="22" fill="#e9e5dc"/>
    {yardBases.map(({color,x,y})=><g key={color}><rect x={x*40} y={y*40} width="240" height="240" rx="12" fill={colorHex(color)}/><rect x={x*40+22} y={y*40+22} width="196" height="196" rx="13" fill="#f8f5ec"/><rect x={x*40+34} y={y*40+34} width="172" height="172" rx="11" fill={colorHex(color)} opacity=".1"/>{YARD_SPOTS[color].map((p,i)=>{const c=cellCenter(p);return <circle key={i} cx={c.x} cy={c.y} r="23" fill="#fff" stroke={colorHex(color)} strokeWidth="5"/>;})}</g>)}
    {squares}{lanes}
    <rect x="240" y="240" width="120" height="120" rx="9" fill="#f9f6ee" stroke="#d6d0c5" strokeWidth="2"/>
    <polygon points="240,240 360,240 300,300" fill={colorHex("green")}/><polygon points="360,240 360,360 300,300" fill={colorHex("yellow")}/><polygon points="360,360 240,360 300,300" fill={colorHex("blue")}/><polygon points="240,360 240,240 300,300" fill={colorHex("red")}/>
    <circle cx="300" cy="300" r="12" fill="#fff" stroke="#ddd" strokeWidth="2"/>
    <g>{tokenElements}</g>
   </svg></div>
   <div className="ludo-key-hint"><span>KEYBOARD</span><kbd>←</kbd><kbd>→</kbd><kbd>↑</kbd><kbd>↓</kbd> select token <kbd>ENTER</kbd> move <kbd>SPACE</kbd> roll <kbd>R</kbd> reset</div>
   <div className="ludo-actions"><button className="ludo-roll-button" onClick={rollDice} disabled={pending!==null||Boolean(winner)}><Dice5 size={18}/> Roll dice <span>{dice??"—"}</span></button><div className="ludo-arrow-controls"><button onClick={()=>choices.length&&setSelected(v=>choices[Math.max(0,choices.indexOf(v)-1)])} disabled={!movable}><ArrowLeft/></button><button onClick={()=>choices.length&&setSelected(v=>choices[(choices.indexOf(v)+1)%choices.length])} disabled={!movable}><ArrowRight/></button></div><button className="ludo-move-button" onClick={()=>moveToken(selected)} disabled={!choices.includes(selected)}>{winner?"Match complete":"Move selected token"}</button><button className="ludo-reset-button" onClick={reset} aria-label="Restart Ludo"><RotateCcw size={16}/></button></div>
  </div>
  <aside className="ludo-side-panel">
   <div className="ludo-turn-card"><span className="stat-label">{winner?"MATCH WINNER":"CURRENT TURN"}</span><div className={`ludo-player-chip ${winner??currentColor}`}><i/>{winner?COLOR_LABEL[winner]:COLOR_LABEL[currentColor]}</div><p>{message}</p></div>
   <div className="ludo-dice-card"><span className="stat-label">LAST ROLL</span><div className={`ludo-die ${dice===6?"six":""}`}>{dice??"?"}</div><small>{dice===6?"Six! A token may enter the board.":"A six brings a token out of the yard."}</small></div>
   <div className="ludo-score-card"><div className="scoreboard-heading"><span className="stat-label">PLAYERS</span><span className="ludo-player-count">{playerCount} PLAYERS</span></div>{activePlayers.map(color=><div className={`ludo-player-row ${currentColor===color&&!winner?"active":""}`} key={color}><span className={`ludo-player-dot ${color}`}/><div><b>{COLOR_LABEL[color]}</b><small>{tokens[color].filter(t=>t.progress===56).length} / 4 home</small></div><strong>{tokens[color].filter(t=>t.progress===56).length}</strong></div>)}</div>
   <div className="ludo-settings"><span className="stat-label">PLAYERS</span><div>{([2,3,4] as const).map(n=><button key={n} onClick={()=>{setPlayerCount(n);reset();}} className={playerCount===n?"active":""}>{n}</button>)}</div></div>
   <div className="tip-card"><span className="tip-icon">✦</span><div><b>How to play</b><p>Roll a 6 to launch a token. Land on rivals to send them back. Reach the centre with an exact roll.</p></div></div>
  </aside>
 </div>;
}