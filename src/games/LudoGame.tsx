import { useCallback, useEffect, useMemo, useState } from "react";
import { Bot, Crown, Dice5, RotateCcw, Sparkles, Users } from "lucide-react";

type Color = "red" | "green" | "yellow" | "blue";
type Token = { progress: number };
type Point = { row: number; col: number };
type Mode = "computer" | "local";
type State = {
  tokens: Record<Color, Token[]>;
  turn: number;
  dice: number | null;
  diceByPlayer: (number | null)[];
  pending: number[] | null;
  message: string;
  winner: Color | null;
};

const COLORS: Color[] = ["red", "green", "yellow", "blue"];
const NAMES: Record<Color, string> = { red: "Ruby", green: "Jade", yellow: "Amber", blue: "Sapphire" };
const START: Record<Color, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const HEX: Record<Color, string> = { red: "#ee5d63", green: "#33b987", yellow: "#f0b94f", blue: "#568df3" };
const PLAYER_SETS: Record<2 | 4, Color[]> = { 2: ["red", "yellow"], 4: COLORS };
const HOME: Record<Color, Point[]> = {
  red: [{row:7,col:1},{row:7,col:2},{row:7,col:3},{row:7,col:4},{row:7,col:5},{row:7,col:6}],
  green: [{row:1,col:7},{row:2,col:7},{row:3,col:7},{row:4,col:7},{row:5,col:7},{row:6,col:7}],
  yellow: [{row:7,col:13},{row:7,col:12},{row:7,col:11},{row:7,col:10},{row:7,col:9},{row:7,col:8}],
  blue: [{row:13,col:7},{row:12,col:7},{row:11,col:7},{row:10,col:7},{row:9,col:7},{row:8,col:7}]
};
const TRACK: Point[] = [
 {row:6,col:1},{row:6,col:2},{row:6,col:3},{row:6,col:4},{row:6,col:5},{row:5,col:6},{row:4,col:6},{row:3,col:6},{row:2,col:6},{row:1,col:6},{row:0,col:6},{row:0,col:7},{row:0,col:8},{row:1,col:8},{row:2,col:8},{row:3,col:8},{row:4,col:8},{row:5,col:8},{row:6,col:9},{row:6,col:10},{row:6,col:11},{row:6,col:12},{row:6,col:13},{row:6,col:14},{row:7,col:14},{row:8,col:14},{row:8,col:13},{row:8,col:12},{row:8,col:11},{row:8,col:10},{row:8,col:9},{row:9,col:8},{row:10,col:8},{row:11,col:8},{row:12,col:8},{row:13,col:8},{row:14,col:8},{row:14,col:7},{row:14,col:6},{row:13,col:6},{row:12,col:6},{row:11,col:6},{row:10,col:6},{row:9,col:6},{row:8,col:5},{row:8,col:4},{row:8,col:3},{row:8,col:2},{row:8,col:1},{row:8,col:0},{row:7,col:0},{row:6,col:0}
];
const SAFE = new Set([0,8,13,21,26,34,39,47]);
const YARDS: Record<Color, Point[]> = {
 red:[{row:1.7,col:1.7},{row:1.7,col:4.3},{row:4.3,col:1.7},{row:4.3,col:4.3}],
 green:[{row:1.7,col:10.7},{row:1.7,col:13.3},{row:4.3,col:10.7},{row:4.3,col:13.3}],
 yellow:[{row:10.7,col:10.7},{row:10.7,col:13.3},{row:13.3,col:10.7},{row:13.3,col:13.3}],
 blue:[{row:10.7,col:1.7},{row:10.7,col:4.3},{row:13.3,col:1.7},{row:13.3,col:4.3}]
};
const centre = (p: Point) => ({ x: (p.col + .5) * 40, y: (p.row + .5) * 40 });
const initialTokens = (): Record<Color, Token[]> => ({
  red:Array.from({length:4},()=>({progress:-1})), green:Array.from({length:4},()=>({progress:-1})),
  yellow:Array.from({length:4},()=>({progress:-1})), blue:Array.from({length:4},()=>({progress:-1}))
});
const initialState = (players: number): State => ({
  tokens: initialTokens(), turn: 0, dice: null, diceByPlayer: Array.from({length:players},()=>null),
  pending: null, message: "Roll a six to launch a token, then race all four pieces home.", winner: null
});
const legalMoves = (tokens: Record<Color, Token[]>, color: Color, dice: number) =>
  tokens[color].map((t,i)=>({t,i})).filter(({t})=>t.progress===-1?dice===6:t.progress+dice<=56).map(({i})=>i);
function bestBotMove(state: State, color: Color, options: number[], active: Color[]) {
  const dice = state.dice ?? 1;
  const score = (index: number) => {
    const old = state.tokens[color][index].progress, next = old === -1 ? 0 : old + dice;
    let value = old === -1 ? 22 : dice * 1.8;
    if (next === 56) value += 120;
    if (next >= 0 && next <= 50) {
      const landing = (START[color] + next) % 52;
      if (!SAFE.has(landing)) for (const opponent of active.filter(c => c !== color)) {
        if (state.tokens[opponent].some(t => t.progress >= 0 && t.progress <= 50 && (START[opponent] + t.progress) % 52 === landing)) value += 90;
      }
      if (SAFE.has(landing)) value += 12;
    }
    return value;
  };
  return [...options].sort((a,b)=>score(b)-score(a))[0];
}

export default function LudoGame() {
  const [mode,setMode] = useState<Mode>("computer");
  const [playerCount,setPlayerCount] = useState<2|4>(2);
  const [state,setState] = useState<State>(()=>initialState(2));
  const [selected,setSelected] = useState(0);
  const [rolling,setRolling] = useState(false);
  const active = PLAYER_SETS[playerCount];
  const color = active[state.turn] ?? active[0];
  const isBot = (seat:number) => mode === "computer" && seat > 0;
  const choices = state.pending ?? [];

  const reset = (nextMode:Mode = mode,nextPlayers:2|4 = playerCount) => {
    setMode(nextMode); setPlayerCount(nextPlayers); setState(initialState(nextPlayers)); setSelected(0); setRolling(false);
  };
  const roll = useCallback(() => {
    if (rolling) return;
    setRolling(true);
    window.setTimeout(() => {
      setRolling(false);
      setState(old => {
        if (old.winner || old.pending !== null) return old;
        const activeNow = PLAYER_SETS[playerCount], current = activeNow[old.turn];
        const value = Math.floor(Math.random()*6)+1, legal = legalMoves(old.tokens,current,value);
        const history = [...old.diceByPlayer]; history[old.turn] = value;
        return {...old,dice:value,diceByPlayer:history,pending:legal,message:legal.length?(value===6?"A six! Choose a token to launch or move.":"Select a highlighted token to move."):(value===6?"No legal move. Turn passes.":"No legal move this turn.")};
      });
    },360);
  },[rolling,playerCount]);

  const advance = useCallback(() => {
    setState(old=>({...old,turn:(old.turn+1)%active.length,dice:null,pending:null,message:"Next seat is up. Roll the dice."}));
    setSelected(0);
  },[active.length]);

  const move = (index:number) => {
    setState(old => {
      if (old.winner || old.pending === null || !old.pending.includes(index) || old.dice === null) return old;
      const movingColor = active[old.turn], rollValue = old.dice;
      const tokens = {...old.tokens};
      tokens[movingColor] = old.tokens[movingColor].map((t,i)=>i===index?{progress:t.progress===-1?0:t.progress+rollValue}:t);
      const moved = tokens[movingColor][index]; let captured = false;
      if (moved.progress >= 0 && moved.progress <= 50) {
        const landing = (START[movingColor]+moved.progress)%52;
        if (!SAFE.has(landing)) for (const opponent of active.filter(c=>c!==movingColor)) {
          tokens[opponent] = tokens[opponent].map(t=>{
            if (t.progress>=0&&t.progress<=50&&(START[opponent]+t.progress)%52===landing) { captured=true; return {progress:-1}; }
            return t;
          });
        }
      }
      if (tokens[movingColor].every(t=>t.progress===56)) return {...old,tokens,winner:movingColor,pending:null,message:NAMES[movingColor]+" takes the crown. Match won!"};
      const bonus = rollValue===6 || captured;
      return {...old,tokens,turn:bonus?old.turn:(old.turn+1)%active.length,dice:null,pending:null,message:moved.progress===56?"A token made it to the finish!":captured?"Capture! An opponent token returns to base.":bonus?"Another turn earned.":"Move complete. Next player is up."};
    });
    setSelected(0);
  };

  useEffect(()=>{
    if(state.winner) return;
    if(state.pending!==null && state.pending.length===0) {
      const timer=window.setTimeout(()=>advance(),900);
      return ()=>window.clearTimeout(timer);
    }
    if(!isBot(state.turn)) return;
    if(state.pending===null) {
      const timer=window.setTimeout(()=>roll(),760);
      return ()=>window.clearTimeout(timer);
    }
    const timer=window.setTimeout(()=>{
      const choice=bestBotMove(state,color,choices,active);
      if(choice!==undefined) move(choice);
    },760);
    return ()=>window.clearTimeout(timer);
  },[state.turn,state.pending,state.dice,state.winner,mode,playerCount]);

  useEffect(()=>{
    const key=(event:KeyboardEvent)=>{
      if(event.ctrlKey||event.metaKey||event.altKey||isBot(state.turn)) return;
      if(event.key.toLowerCase()==="r"){event.preventDefault();reset();return;}
      if(event.key===" "&&state.pending===null){event.preventDefault();roll();return;}
      if(event.key==="ArrowLeft"||event.key==="ArrowUp"){event.preventDefault();if(choices.length)setSelected(v=>choices[(Math.max(0,choices.indexOf(v)-1))%choices.length]);return;}
      if(event.key==="ArrowRight"||event.key==="ArrowDown"){event.preventDefault();if(choices.length)setSelected(v=>choices[(choices.indexOf(v)+1)%choices.length]);return;}
      if(event.key==="Enter"){event.preventDefault();if(choices.includes(selected))move(selected);else if(state.pending===null)roll();}
    };
    window.addEventListener("keydown",key);return ()=>window.removeEventListener("keydown",key);
  },[state,choices,selected,roll,mode]);

  const squares = useMemo(()=>TRACK.map((p,index)=>{
    const c=centre(p),safe=SAFE.has(index),start=COLORS.find(item=>START[item]===index);
    return <g key={index}><rect x={p.col*40+2} y={p.row*40+2} width="36" height="36" rx="7" className={`ludo-track-square ${safe?"safe":""}`}/>{start&&<circle cx={c.x} cy={c.y} r="5.5" fill={HEX[start]} />}{safe&&<text x={c.x} y={c.y+5} textAnchor="middle" className="ludo-star">✦</text>}</g>;
  }),[]);
  const bases=[{color:"red" as Color,x:0,y:0},{color:"green" as Color,x:9,y:0},{color:"blue" as Color,x:0,y:9},{color:"yellow" as Color,x:9,y:9}];
  const lanes=COLORS.flatMap(item=>HOME[item].map((p,i)=><rect key={item+i} x={p.col*40+2} y={p.row*40+2} width="36" height="36" rx="7" fill={HEX[item]} opacity={.43+i*.085}/>));
  const pieces=COLORS.flatMap(item=>state.tokens[item].map((token,index)=>{
    const point=token.progress<0?YARDS[item][index]:token.progress<=50?TRACK[(START[item]+token.progress)%52]:HOME[item][Math.min(5,token.progress-51)];
    const c=centre(point),same=state.tokens[item].slice(0,index).filter(t=>t.progress===token.progress).length,offset=[[-6,-6],[6,-6],[-6,6],[6,6]][same%4];
    const movable=item===color&&choices.includes(index),focus=movable&&selected===index;
    return <g key={item+index} className={`ludo-token ${movable?"movable":""} ${focus?"selected":""}`} onClick={()=>movable&&move(index)} role="button" tabIndex={movable?0:-1} aria-label={NAMES[item]+" token "+(index+1)}><ellipse cx={c.x+offset[0]} cy={c.y+offset[1]+7} rx="12" ry="5" fill="#07131b" opacity=".25"/><circle cx={c.x+offset[0]} cy={c.y+offset[1]} r="13" fill={HEX[item]} stroke="#fff" strokeWidth="2.2" filter="url(#pieceShadow)"/><circle cx={c.x+offset[0]-3} cy={c.y+offset[1]-4} r="3.4" fill="#ffffffb8"/><circle cx={c.x+offset[0]} cy={c.y+offset[1]} r="5" fill="#ffffff38"/></g>;
  }));
  return <div className="ludo-pro">
    <div className="pro-game-toolbar">
      <div className="pro-game-title"><span className="pro-live"><i/> TABLE 01 · LIVE MATCH</span><h3>Ludo <em>Royale</em></h3><p>A classic race, presented like a premium tabletop match.</p></div>
      <div className="pro-toolbar-actions"><div className="pro-segment"><button className={mode==="computer"?"active":""} onClick={()=>reset("computer",playerCount)}><Bot size={14}/> VS COMPUTER</button><button className={mode==="local"?"active":""} onClick={()=>reset("local",2)}><Users size={14}/> PASS & PLAY</button></div><button className="pro-icon-button" onClick={()=>reset()} aria-label="New match"><RotateCcw size={16}/></button></div>
    </div>
    <div className="ludo-pro-layout">
      <section className="ludo-pro-stage">
        <div className="pro-seat-row">{active.map((seat,index)=><div key={seat} className={`pro-seat ${state.turn===index?"turn":""} ${seat}`}>
          <div className="pro-seat-avatar">{isBot(index)?<Bot size={16}/>:<span>{NAMES[seat][0]}</span>}</div>
          <div><b>{index===0?"YOU":isBot(index)?"COMPUTER":NAMES[seat]}</b><small>{state.tokens[seat].filter(t=>t.progress===56).length}/4 HOME</small></div>
          {state.turn===index&&!state.winner&&<span className="seat-live">YOUR TURN</span>}
          <div className={`mini-die ${state.diceByPlayer[index]===6?"six":""}`}>{state.diceByPlayer[index]??"·"}</div>
        </div>)}</div>
        <div className="ludo-pro-frame">
          <div className="ludo-pro-frame-top"><span><i/> PLAYING ON THE ROYALE BOARD</span><span>SAFE ZONES <b>✦</b></span></div>
          <div className="ludo-pro-board-shell">
            <svg className="ludo-board-svg ludo-premium-svg" viewBox="0 0 600 600" role="img" aria-label="Four-colour Ludo board">
              <defs><linearGradient id="ludo-board-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f5f0e4"/><stop offset="1" stopColor="#d4ccbc"/></linearGradient><filter id="pieceShadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="2"/><feOffset dy="2"/><feComponentTransfer><feFuncA type="linear" slope=".32"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
              <rect width="600" height="600" rx="22" fill="url(#ludo-board-bg)"/>
              {bases.map(({color:c,x,y})=><g key={c}><rect x={x*40} y={y*40} width="240" height="240" rx="12" fill={HEX[c]}/><rect x={x*40+20} y={y*40+20} width="200" height="200" rx="12" fill="#f9f6ee"/><rect x={x*40+32} y={y*40+32} width="176" height="176" rx="10" fill={HEX[c]} opacity=".11"/>{YARDS[c].map((p,i)=>{const q=centre(p);return <g key={i}><circle cx={q.x} cy={q.y} r="24" fill="#fff" stroke={HEX[c]} strokeWidth="5"/><circle cx={q.x} cy={q.y} r="17" fill={HEX[c]} opacity=".08"/></g>;})}</g>)}
              {squares}{lanes}
              <rect x="240" y="240" width="120" height="120" rx="8" fill="#faf8f0" stroke="#c7bba7" strokeWidth="2"/>
              <polygon points="240,240 360,240 300,300" fill={HEX.green}/><polygon points="360,240 360,360 300,300" fill={HEX.yellow}/><polygon points="360,360 240,360 300,300" fill={HEX.blue}/><polygon points="240,360 240,240 300,300" fill={HEX.red}/>
              <circle cx="300" cy="300" r="13" fill="#fff" stroke="#cbbda8" strokeWidth="2"/><g>{pieces}</g>
            </svg>
          </div>
          <div className="ludo-board-caption"><span>ROLL A SIX TO ENTER</span><span>EXACT COUNT TO FINISH</span><span>CAPTURE ON OPEN SQUARES</span></div>
        </div>
        <div className="pro-keyboard-note"><span>KEYBOARD</span><kbd>SPACE</kbd> ROLL <kbd>← →</kbd> SELECT TOKEN <kbd>ENTER</kbd> MOVE <kbd>R</kbd> RESET</div>
      </section>
      <aside className="ludo-pro-panel">
        <div className="pro-turn-panel"><span className="pro-panel-label">CURRENT PLAYER</span><div className={`pro-current-player ${color}`}><i/>{state.winner?NAMES[state.winner]:isBot(state.turn)?"Computer":state.turn===0?"You":NAMES[color]}</div><p>{state.winner?"The crown is yours. Start a new match to play again.":state.message}</p>{state.winner&&<div className="pro-victory"><Crown size={18}/> VICTORY · {NAMES[state.winner].toUpperCase()}</div>}</div>
        <div className="pro-dice-panel"><div><span className="pro-panel-label">TURN DICE</span><small>{state.pending===null?"WAITING TO ROLL":state.pending.length?"SELECT A TOKEN":"NO LEGAL MOVE"}</small></div><button className={`pro-dice-button ${rolling?"rolling":""} ${state.dice===6?"six":""}`} onClick={roll} disabled={state.pending!==null||Boolean(state.winner)||isBot(state.turn)}><span>{state.dice??"?"}</span><Dice5 size={21}/></button><button className="pro-roll-cta" onClick={roll} disabled={state.pending!==null||Boolean(state.winner)||isBot(state.turn)}>ROLL DICE <span>SPACE</span></button></div>
        <div className="pro-roster-panel"><div className="pro-panel-heading"><span className="pro-panel-label">SEAT STATUS</span><span>{playerCount} PLAYERS</span></div>{active.map((seat,index)=><div className={`pro-roster-row ${state.turn===index&&!state.winner?"active":""}`} key={seat}><span className={`pro-roster-dot ${seat}`}/><div><b>{index===0?"You":isBot(index)?"Computer":NAMES[seat]}</b><small>{state.tokens[seat].filter(t=>t.progress===56).length} tokens finished</small></div><strong>{state.diceByPlayer[index]??"—"}</strong></div>)}</div>
        <div className="pro-match-options"><span className="pro-panel-label">BOARD SIZE</span><div><button className={playerCount===2?"active":""} onClick={()=>reset(mode,2)}>2 SEATS</button><button className={playerCount===4?"active":""} onClick={()=>reset(mode,4)}>4 SEATS</button></div></div>
        <div className="pro-round-tools"><span><Sparkles size={15}/> Local play · No account needed</span><button onClick={()=>reset()}>NEW GAME <RotateCcw size={13}/></button></div>
      </aside>
    </div>
  </div>;
}
