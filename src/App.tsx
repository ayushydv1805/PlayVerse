import { useMemo, useState } from "react";
import {
  ArrowRight, Bell, Check, ChevronDown, ChevronRight, Clock3, Crown, Dice5,
  Gamepad2, Grid2X2, Home, Menu, Search, Settings2, ShieldCheck, Sparkles,
  Star, Swords, Trophy, Users, X, Zap
} from "lucide-react";
import SnakeGame from "./games/SnakeGame";
import TicTacToeGame from "./games/TicTacToeGame";
import LudoGame from "./games/LudoGame";
import SnakesLaddersGame from "./games/SnakesLaddersGame";

type Category = "All games" | "Board games" | "Card games" | "Quick games";
type GameId = "ludo" | "snakes-ladders" | "uno" | "three-two-five" | "tic-tac-toe" | "snake";
type Game = {
  id: GameId;
  title: string;
  subtitle: string;
  category: Exclude<Category, "All games">;
  players: string;
  time: string;
  status: "ready" | "coming";
  accent: string;
  tag?: string;
};

const GAMES: Game[] = [
  { id: "ludo", title: "Ludo Royale", subtitle: "Roll. Race. Rule the board.", category: "Board games", players: "2–4 players", time: "10–20 min", status: "ready", accent: "violet", tag: "PLAY NOW" },
  { id: "snakes-ladders", title: "Snakes & Ladders", subtitle: "Climb high. Watch your step.", category: "Board games", players: "2–4 players", time: "8–15 min", status: "ready", accent: "green", tag: "PLAY NOW" },
  { id: "uno", title: "Plus Minus", subtitle: "Wild cards. Unexpected turns.", category: "Card games", players: "2–6 players", time: "10–15 min", status: "coming", accent: "red", tag: "CARD PARTY" },
  { id: "three-two-five", title: "3–2–5", subtitle: "A proper test of your cards game.", category: "Card games", players: "3 players", time: "15–25 min", status: "coming", accent: "blue" },
  { id: "tic-tac-toe", title: "Tic Tac Toe", subtitle: "Small grid. Big brain energy.", category: "Quick games", players: "2 players", time: "2–5 min", status: "ready", accent: "orange", tag: "PLAY NOW" },
  { id: "snake", title: "Classic Snake", subtitle: "The Nokia legend is back.", category: "Quick games", players: "1 player", time: "Endless", status: "ready", accent: "lime", tag: "ARCADE MODE" }
];

const CATEGORIES: Category[] = ["All games", "Board games", "Card games", "Quick games"];

function GameArtwork({ id }: { id: GameId }) {
  if (id === "ludo") return <div className="art-ludo"><div className="ludo-board"><div className="ludo-home home-red"><i /><i /><i /><i /></div><div className="ludo-home home-blue"><i /><i /><i /><i /></div><div className="ludo-home home-green"><i /><i /><i /><i /></div><div className="ludo-home home-yellow"><i /><i /><i /><i /></div><div className="ludo-centre" /></div><span className="art-dice">⚄</span></div>;
  if (id === "snakes-ladders") return <div className="art-snakes"><div className="ladder ladder-one" /><div className="ladder ladder-two" /><div className="snake-ribbon ribbon-a">〰</div><div className="snake-ribbon ribbon-b">〰</div><div className="ladder-sun">✦</div><div className="mini-steps">{Array.from({ length: 16 }, (_, i) => <i key={i} />)}</div></div>;
  if (id === "uno") return <div className="art-uno"><div className="uno-card uno-back">+4</div><div className="uno-card uno-mid">↻</div><div className="uno-card uno-front"><b>+2</b><small>PLAY</small></div></div>;
  if (id === "three-two-five") return <div className="art-cards"><div className="playing-card card-back">♠</div><div className="playing-card card-mid">♥</div><div className="playing-card card-front">A<small>♦</small></div><div className="card-spark">✦</div></div>;
  if (id === "tic-tac-toe") return <div className="art-ttt"><div className="art-ttt-grid"><i className="x">×</i><i /><i className="o">○</i><i /><i className="x">×</i><i /><i className="o">○</i><i /><i className="x">×</i></div><span className="ttt-glow" /></div>;
  return <div className="art-snake"><div className="snake-art-grid">{Array.from({ length: 36 }, (_, i) => <i key={i} className={[7, 8, 9, 15, 21, 27].includes(i) ? "on" : ""} />)}</div><span className="snake-food-art">✦</span><span className="snake-head-art">●</span></div>;
}

function App() {
  const [category, setCategory] = useState<Category>("All games");
  const [query, setQuery] = useState("");
  const [activeGame, setActiveGame] = useState<GameId | null>(null)
  const [toast, setToast] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const filteredGames = useMemo(() => GAMES.filter((game) => {
    const matchesCategory = category === "All games" || game.category === category;
    const matchesQuery = `${game.title} ${game.subtitle}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [category, query]);

  const launchGame = (game: Game) => {
    if (game.id === "snake" || game.id === "tic-tac-toe" || game.id === "ludo" || game.id === "snakes-ladders") {
      setActiveGame(game.id);
      return;
    }
    setToast(`${game.title} is in the next PlayVerse release. Stay tuned!`);
    window.setTimeout(() => setToast(""), 3200);
  };

  const closeGame = () => setActiveGame(null);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand-lockup">
          <div className="brand-mark"><Gamepad2 size={21} strokeWidth={2.6} /></div>
          <div className="brand-name">play<span>verse</span><small>GAMES UNIVERSE</small></div>
          <button className="mobile-close icon-button" onClick={() => setMobileMenu(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <div className="sidebar-label">MENU</div>
        <nav className="side-nav">
          <button className="side-link active"><Home size={18} /><span>Discover</span><i /></button>
          <button className="side-link" onClick={() => setToast("Online rooms are coming in the multiplayer phase.")}><Users size={18} /><span>Play with friends</span><span className="nav-soon">SOON</span></button>
          <button className="side-link" onClick={() => setToast("Tournaments are coming soon.")}><Trophy size={18} /><span>Tournaments</span></button>
        </nav>
        <div className="sidebar-divider" />
        <div className="sidebar-label">YOUR LIBRARY</div>
        <nav className="side-nav">
          <button className="side-link" onClick={() => setToast("Your recently played games will appear here.")}><Clock3 size={18} /><span>Recently played</span></button>
          <button className="side-link" onClick={() => setToast("Favourite games will appear here.")}><Star size={18} /><span>Favourites</span></button>
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-promo">
          <div className="promo-orbit"><Crown size={19} /></div>
          <b>Your next game night starts here.</b>
          <p>Bring your people. Pick a game. Make a memory.</p>
          <button onClick={() => setToast("Friend invites will be enabled with online multiplayer.")}>Invite friends <ArrowRight size={14} /></button>
          <span className="promo-spark">✦</span>
        </div>
        <button className="side-link settings-link" onClick={() => setToast("Settings are coming in a later release.")}><Settings2 size={18} /><span>Settings</span></button>
        <div className="sidebar-profile">
          <div className="profile-avatar">AY</div>
          <div><b>Player One</b><small>Level 01 · New challenger</small></div>
          <ChevronDown size={15} />
        </div>
      </aside>

      {mobileMenu && <button className="mobile-backdrop" onClick={() => setMobileMenu(false)} aria-label="Close navigation" />}

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" onClick={() => setMobileMenu(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="breadcrumb"><span>PlayVerse</span><ChevronRight size={14} /><b>Discover</b></div>
          <div className="topbar-actions">
            <label className="search-box"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search games..." /><kbd>⌘ K</kbd></label>
            <div className="notification-wrap">
              <button className="icon-button notification-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="Notifications"><Bell size={18} /><i /></button>
              {showNotifications && <div className="notification-popover"><b>You're all caught up</b><p>New games and updates will show up here.</p></div>}
            </div>
            <div className="top-avatar">AY</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div><div className="eyebrow"><span className="eyebrow-line" /> THE PLAYGROUND IS OPEN</div><h1>Good games.<br /><span>Great company.</span></h1><p className="welcome-copy">Your favourite games, all in one place. What are we playing today?</p></div>
            <div className="welcome-badge"><div className="badge-ring"><Sparkles size={22} /></div><span><b>ONE UNIVERSE</b><small>ENDLESS WAYS TO PLAY</small></span></div>
          </section>

          <section className="hero-grid">
            <div className="hero-feature">
              <div className="hero-noise" />
              <div className="hero-content">
                <span className="hero-pill"><Zap size={13} fill="currentColor" /> TODAY'S PICK</span>
                <h2>Old school fun.<br /><em>New school feel.</em></h2>
                <p>Take a quick trip back to the golden age of mobile gaming. The classics never get old.</p>
                <button className="hero-button" onClick={() => setActiveGame("snake")}>Play Classic Snake <ArrowRight size={16} /></button>
                <div className="hero-meta"><span><span className="online-dot" /> READY WHEN YOU ARE</span><span className="hero-divider" /><span>NO DOWNLOAD NEEDED</span></div>
              </div>
              <div className="hero-art">
                <div className="hero-halo halo-one" /><div className="hero-halo halo-two" />
                <div className="hero-phone">
                  <div className="phone-notch" /><div className="phone-screen"><div className="phone-score">SCORE <b>240</b></div><div className="phone-snake">{Array.from({ length: 9 }, (_, i) => <i key={i} className={`seg seg-${i}`} />)}</div><div className="phone-food">✦</div><div className="phone-bottom"><i /><i /><i /></div></div>
                </div>
                <div className="floating-chip chip-top"><span>✦</span> CLASSIC MODE</div>
                <div className="floating-chip chip-bottom"><b>+10</b><small>HIGH SCORE</small></div>
                <div className="hero-spark spark-one">✦</div><div className="hero-spark spark-two">✧</div>
              </div>
            </div>
            <div className="daily-card">
              <div className="daily-top"><span className="daily-icon"><Trophy size={17} /></span><span className="daily-label">DAILY QUEST</span><span className="quest-date">01 / 03</span></div>
              <div className="quest-art"><div className="quest-die">⚄</div><div className="quest-orbit orbit-a" /><div className="quest-orbit orbit-b" /><span>✦</span></div>
              <div className="quest-body"><span className="quest-tag">YOUR FIRST CHALLENGE</span><h3>Make your<br />first move.</h3><p>Jump into a game and start your PlayVerse journey.</p></div>
              <div className="quest-progress"><div><span>QUEST PROGRESS</span><b>0 / 1</b></div><div className="progress-track"><i /></div></div>
              <button className="quest-button" onClick={() => setActiveGame("tic-tac-toe")}>Accept challenge <ArrowRight size={15} /></button>
            </div>
          </section>

          <section className="stats-strip">
            <div className="strip-item"><span className="strip-icon purple"><Grid2X2 size={16} /></span><div><b>06</b><small>GAMES IN THE HUB</small></div></div>
            <div className="strip-separator" />
            <div className="strip-item"><span className="strip-icon orange"><Users size={16} /></span><div><b>2–6</b><small>PLAYERS SUPPORTED</small></div></div>
            <div className="strip-separator" />
            <div className="strip-item"><span className="strip-icon green"><ShieldCheck size={16} /></span><div><b>100%</b><small>FREE TO EXPLORE</small></div></div>
            <div className="strip-note"><span className="live-dot" /> MORE GAMES LANDING SOON</div>
          </section>

          <section className="games-section">
            <div className="section-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> FIND YOUR NEXT FAVOURITE</div><h2>Pick your <span>playstyle.</span></h2></div><button className="view-all" onClick={() => { setCategory("All games"); setQuery(""); }}>View all games <ArrowRight size={15} /></button></div>
            <div className="filter-row">
              <div className="category-filters">{CATEGORIES.map((item) => <button key={item} onClick={() => setCategory(item)} className={category === item ? "filter active" : "filter"}>{item}</button>)}</div>
              <button className="sort-button" onClick={() => setToast("Games are currently sorted by hand-picked order.")}>Featured <ChevronDown size={14} /></button>
            </div>
            <div className="games-grid">
              {filteredGames.map((game) => <GameCard key={game.id} game={game} onClick={() => launchGame(game)} />)}
              {filteredGames.length === 0 && <div className="empty-state"><Search size={24} /><b>No games found</b><span>Try a different search or category.</span></div>}
            </div>
          </section>

          <section className="friends-banner">
            <div className="friends-icon"><Users size={22} /></div>
            <div><span>THE MORE, THE MERRIER</span><h3>Game nights are better together.</h3><p>Private rooms, friend invites and online matches are on the way.</p></div>
            <button onClick={() => setToast("Online multiplayer is planned for the next phase.")}>Coming soon <ArrowRight size={15} /></button>
            <div className="friends-decoration">✦</div>
          </section>
          <footer className="footer"><div className="footer-brand"><Gamepad2 size={16} /> play<span>verse</span></div><span>Made for the love of play.</span><span>© 2026 PlayVerse</span></footer>
        </div>
      </main>

      {activeGame && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeGame(); }}>
        <section className={`game-modal ${activeGame}-modal`} role="dialog" aria-modal="true" aria-label={`${activeGame} game`}>
          <div className="modal-header"><div className="modal-game-icon">{activeGame === "snake" ? "🐍" : activeGame === "ludo" ? "🎲" : activeGame === "snakes-ladders" ? "🪜" : "✕"}</div><div><span className="modal-kicker">PLAYVERSE ARCADE</span><h2>{activeGame === "snake" ? "Classic Snake" : activeGame === "tic-tac-toe" ? "Tic Tac Toe" : activeGame === "ludo" ? "Ludo Royale" : activeGame === "snakes-ladders" ? "Snakes & Ladders" : activeGame}</h2></div><button className="icon-button modal-close" onClick={closeGame} aria-label="Close game"><X size={20} /></button></div>
          {activeGame === "snake" ? <SnakeGame /> : activeGame === "tic-tac-toe" ? <TicTacToeGame /> : activeGame === "ludo" ? <LudoGame /> : activeGame === "snakes-ladders" ? <SnakesLaddersGame /> : null}
        </section>
      </div>}

      {toast && <div className="toast"><span>✦</span>{toast}<button onClick={() => setToast("")} aria-label="Dismiss"><X size={15} /></button></div>}
    </div>
  );
}

function GameCard({ game, onClick }: { game: Game; onClick: () => void }) {
  const Icon = game.category === "Board games" ? Dice5 : game.category === "Card games" ? Sparkles : Zap;
  return (
    <button className={`game-card card-${game.accent}`} onClick={onClick}>
      <div className="game-card-art"><GameArtwork id={game.id} /><span className={`game-tag ${game.status === "ready" ? "tag-ready" : ""}`}>{game.tag || (game.status === "ready" ? "PLAY NOW" : "COMING SOON")}</span>{game.status === "coming" && <span className="lock-chip"><span>✦</span> IN DEVELOPMENT</span>}</div>
      <div className="game-card-info"><div className="game-card-icon"><Icon size={17} /></div><div className="game-card-text"><h3>{game.title}</h3><p>{game.subtitle}</p></div><span className="game-arrow"><ArrowRight size={17} /></span></div>
      <div className="game-card-foot"><span><Users size={13} />{game.players}</span><i /><span><Clock3 size={13} />{game.time}</span></div>
    </button>
  );
}

export default App;