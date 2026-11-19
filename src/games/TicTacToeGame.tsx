import { useEffect, useMemo, useState } from "react";
import { RotateCcw, Sparkles } from "lucide-react";
type Mark="X"|"O"|null;
const WIN_LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
export default function TicTacToeGame(){
 const [board,setBoard]=useState<Mark[]>(Array(9).fill(null));
 const [turn,setTurn]=useState<"X"|"O">("X");
 const [scores,setScores]=useState({X:0,O:0,draws:0});
 const [selectedIndex,setSelectedIndex]=useState(4);
 const winner=useMemo(()=>{for(const [a,b,c] of WIN_LINES){if(board[a]&&board[a]===board[b]&&board[a]===board[c])return board[a];}return null;},[board]);
 const draw=!winner&&board.every(Boolean),finished=Boolean(winner||draw);
 const play=(index:number)=>{
  if(board[index]||finished)return;
  const next=[...board];next[index]=turn;setBoard(next);
  const won=WIN_LINES.some(([a,b,c])=>next[a]&&next[a]===next[b]&&next[a]===next[c]);
  if(won)setScores(v=>({...v,[turn]:v[turn]+1}));else if(next.every(Boolean))setScores(v=>({...v,draws:v.draws+1}));else setTurn(turn==="X"?"O":"X");
  const after=next.findIndex((cell,i)=>cell===null&&i>index);if(after>=0)setSelectedIndex(after);else{const first=next.findIndex(cell=>cell===null);if(first>=0)setSelectedIndex(first);}
 };
 const resetRound=()=>{setBoard(Array(9).fill(null));setTurn("X");setSelectedIndex(4);};
 const resetAll=()=>{resetRound();setScores({X:0,O:0,draws:0});};
 useEffect(()=>{
  const onKeyDown=(event:KeyboardEvent)=>{
   if(event.ctrlKey||event.metaKey||event.altKey)return;
   if(/^[1-9]$/.test(event.key)){event.preventDefault();play(Number(event.key)-1);return;}
   if(["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)){
    event.preventDefault();const delta=event.key==="ArrowLeft"?-1:event.key==="ArrowRight"?1:event.key==="ArrowUp"?-3:3;
    setSelectedIndex(current=>{let candidate=current;for(let step=0;step<9;step++){candidate=(candidate+delta+9)%9;if(!board[candidate])break;}return candidate;});return;
   }
   if(event.key==="Enter"||event.key===" "){event.preventDefault();play(selectedIndex);return;}
   if(event.key.toLowerCase()==="r"){event.preventDefault();resetRound();}
  };
  window.addEventListener("keydown",onKeyDown);return()=>window.removeEventListener("keydown",onKeyDown);
 },[board,finished,turn,selectedIndex]);
 return <div className="ttt-layout"><div className="ttt-main">
  <div className="ttt-status"><div className="turn-avatar">{finished?<Sparkles size={18}/>:turn}</div><div><span className="stat-label">{finished?"ROUND COMPLETE":"CURRENT TURN"}</span><b>{winner?`Player ${winner} wins!`:draw?"It's a draw!":`Player ${turn}'s turn`}</b></div>{finished&&<span className="winner-pill">NICE PLAY!</span>}</div>
  <div className="ttt-board">{board.map((mark,index)=><button key={index} className={`ttt-cell ${mark?`mark-${mark.toLowerCase()}`:""} ${selectedIndex===index&&!mark?"selected":""}`} onFocus={()=>setSelectedIndex(index)} onClick={()=>{setSelectedIndex(index);play(index);}} aria-label={`Cell ${index+1} ${mark?`is ${mark}`:"empty"}`} disabled={Boolean(mark)||finished}>{mark&&<span>{mark}</span>}{!mark&&<small>{index+1}</small>}</button>)}</div>
  <div className="ttt-actions"><button className="primary-button" onClick={resetRound}><RotateCcw size={16}/>{finished?"Next round":"Restart round"}</button><button className="ghost-button" onClick={resetAll}>Reset score</button></div>
  <div className="ttt-key-hint"><b>1–9</b> place mark <b>ARROWS</b> select cell <b>ENTER</b> play <b>R</b> restart</div>
 </div><aside className="ttt-side"><div className="scoreboard-heading"><span className="stat-label">MATCH SCORE</span><span className="score-live"><i/> LIVE</span></div>
  <div className="ttt-score-row"><span className="player-symbol x-symbol">X</span><div><b>Player X</b><small>First player</small></div><strong>{scores.X}</strong></div>
  <div className="ttt-score-row"><span className="player-symbol o-symbol">O</span><div><b>Player O</b><small>Second player</small></div><strong>{scores.O}</strong></div>
  <div className="draw-score"><span>Draws</span><b>{scores.draws}</b></div>
  <div className="tip-card"><span className="tip-icon">✦</span><div><b>Quick reminder</b><p>Line up three marks horizontally, vertically, or diagonally to win.</p></div></div>
 </aside></div>;
}