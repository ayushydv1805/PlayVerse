import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Pause, Play, RotateCcw } from "lucide-react";

type Point = { x: number; y: number };
type Direction = "up" | "down" | "left" | "right";
const SIZE = 16;
const START_SNAKE: Point[] = [{ x: 7, y: 8 }, { x: 6, y: 8 }, { x: 5, y: 8 }];

function randomFood(snake: Point[]): Point {
  let point: Point;
  do {
    point = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
  } while (snake.some((part) => part.x === point.x && part.y === point.y));
  return point;
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>(START_SNAKE);
  const [food, setFood] = useState<Point>(() => randomFood(START_SNAKE));
  const [status, setStatus] = useState<"ready" | "playing" | "paused" | "over">("ready");
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("playverse-snake-best") || 0));
  const direction = useRef<Direction>("right");
  const queuedDirection = useRef<Direction>("right");
  const foodRef = useRef(food);

  useEffect(() => { foodRef.current = food; }, [food]);

  const reset = useCallback(() => {
    setSnake(START_SNAKE);
    const nextFood = randomFood(START_SNAKE);
    setFood(nextFood);
    foodRef.current = nextFood;
    direction.current = "right";
    queuedDirection.current = "right";
    setScore(0);
    setStatus("playing");
  }, []);

  const changeDirection = useCallback((next: Direction) => {
    const current = direction.current;
    const opposite = (current === "up" && next === "down") ||
      (current === "down" && next === "up") ||
      (current === "left" && next === "right") ||
      (current === "right" && next === "left");
    if (!opposite) queuedDirection.current = next;
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const keys: Record<string, Direction> = {
        ArrowUp: "up", w: "up", ArrowDown: "down", s: "down",
        ArrowLeft: "left", a: "left", ArrowRight: "right", d: "right"
      };
      const next = keys[event.key];
      if (next) {
        event.preventDefault();
        if (status === "ready") setStatus("playing");
        changeDirection(next);
      }
      if (event.code === "Space" && (status === "playing" || status === "paused")) {
        event.preventDefault();
        setStatus(status === "playing" ? "paused" : "playing");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [changeDirection, status]);

  useEffect(() => {
    if (status !== "playing") return;
    const timer = window.setInterval(() => {
      direction.current = queuedDirection.current;
      setSnake((current) => {
        const head = current[0];
        const delta: Record<Direction, Point> = {
          up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
          left: { x: -1, y: 0 }, right: { x: 1, y: 0 }
        };
        const next = { x: head.x + delta[direction.current].x, y: head.y + delta[direction.current].y };
        const ate = next.x === foodRef.current.x && next.y === foodRef.current.y;
        const collisionBody = ate ? current : current.slice(0, -1);
        const hitWall = next.x < 0 || next.x >= SIZE || next.y < 0 || next.y >= SIZE;
        const hitSelf = collisionBody.some((part) => part.x === next.x && part.y === next.y);
        if (hitWall || hitSelf) {
          setStatus("over");
          setBest((previous) => {
            const nextBest = Math.max(previous, score);
            localStorage.setItem("playverse-snake-best", String(nextBest));
            return nextBest;
          });
          return current;
        }
        const nextSnake = [next, ...current];
        if (!ate) nextSnake.pop();
        else {
          setScore((value) => value + 10);
          const nextFood = randomFood(nextSnake);
          foodRef.current = nextFood;
          setFood(nextFood);
        }
        return nextSnake;
      });
    }, 135);
    return () => window.clearInterval(timer);
  }, [status, score]);

  const cells = Array.from({ length: SIZE * SIZE }, (_, index) => {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    const snakeIndex = snake.findIndex((part) => part.x === x && part.y === y);
    const isFood = food.x === x && food.y === y;
    const isHead = snakeIndex === 0;
    return (
      <div key={index} className={`snake-cell ${snakeIndex >= 0 ? "snake-body" : ""} ${isHead ? "snake-head" : ""} ${isFood ? "snake-food" : ""} ${(x + y) % 2 === 0 ? "cell-light" : ""}`}>
        {isHead ? <span className="snake-eyes">••</span> : isFood ? <span>✦</span> : null}
      </div>
    );
  });

  const overlay = status !== "playing";
  return (
    <div className="snake-game-layout">
      <div className="snake-stage">
        <div className="snake-stage-top">
          <span className="game-kicker"><span className="live-dot" /> CLASSIC ARCADE</span>
          <span className="keyboard-hint">WASD / ARROW KEYS <kbd>SPACE</kbd> PAUSE</span>
        </div>
        <div className="snake-board-wrap">
          <div className="snake-board">{cells}</div>
          {overlay && (
            <div className="snake-overlay">
              <div className="overlay-orb">{status === "over" ? "↻" : status === "paused" ? "Ⅱ" : "✦"}</div>
              <h3>{status === "over" ? "Game over" : status === "paused" ? "Take a breather" : "Ready to play?"}</h3>
              <p>{status === "over" ? `You scored ${score} points. One more round?` : status === "paused" ? "Your snake is waiting right where you left it." : "Collect the glowing orbs. Don't hit the walls or your own tail."}</p>
              <button className="primary-button" onClick={status === "paused" ? () => setStatus("playing") : reset}>
                {status === "paused" ? <Play size={16} fill="currentColor" /> : status === "over" ? <RotateCcw size={16} /> : <Play size={16} fill="currentColor" />}
                {status === "paused" ? "Resume game" : status === "over" ? "Play again" : "Start game"}
              </button>
            </div>
          )}
        </div>
        <div className="snake-controls">
          <button aria-label="Move up" onClick={() => changeDirection("up")}><ArrowUp /></button>
          <div className="snake-control-row">
            <button aria-label="Move left" onClick={() => changeDirection("left")}><ArrowLeft /></button>
            <button aria-label="Move down" onClick={() => changeDirection("down")}><ArrowDown /></button>
            <button aria-label="Move right" onClick={() => changeDirection("right")}><ArrowRight /></button>
          </div>
        </div>
      </div>
      <aside className="snake-stats">
        <div className="stat-card score-card">
          <span className="stat-label">CURRENT SCORE</span>
          <strong>{String(score).padStart(3, "0")}</strong>
          <span className="stat-foot">+10 for every orb</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">PERSONAL BEST</span>
          <strong>{String(best).padStart(3, "0")}</strong>
          <span className="stat-foot">Saved on this device</span>
        </div>
        <div className="tip-card">
          <span className="tip-icon">✦</span>
          <div><b>Pro tip</b><p>Plan your turns early. The longer you grow, the more space you need.</p></div>
        </div>
        <button className="ghost-button full-width" onClick={() => setStatus(status === "playing" ? "paused" : status === "paused" ? "playing" : status)} disabled={status === "ready" || status === "over"}>
          <Pause size={15} /> {status === "paused" ? "Resume" : "Pause game"}
        </button>
      </aside>
    </div>
  );
}