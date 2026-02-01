import { useState, useCallback, useEffect } from "react";

/* ─────────────────────── CONSTANTS ─────────────────────── */
const INITIAL_SHEET = {
  nome: "", idade: "", sexo: "", facao: "Ghoul", nivel: 1,
  xpAtual: 0, xpMax: 1000,
  hp: 0, hpMax: 0, stamina: 0, staminaMax: 0, rc: 100, rcMax: 100,
  attrs: { STR: 5, SPD: 5, RES: 5, PER: 5, INT: 5, CHA: 5 },
  kagune: { tipo: "", rank: "C", cor: "", aparencia: "", habilidades: "" },
  quinque1: { nome: "", tipo: "", rank: "C", danoBase: "", durAtual: "", durMax: "" },
  quinque2: { nome: "", tipo: "", rank: "C", danoBase: "" },
  equipamentos: { armadura: "", suppressant: 0, kitMedico: 0, comunicador: false, extras: ["", ""] },
  pericias: {
    Combate:        { "Luta Corpo a Corpo": 0, "Armas Brancas": 0, "Armas de Fogo": 0, "Esquiva": 0, "Bloqueio": 0 },
    Sociais:        { "Persuasao": 0, "Intimidacao": 0, "Engacao": 0, "Empatia": 0, "Performance": 0 },
    Conhecimento:   { "Investigacao": 0, "Medicina": 0, "Biologia RC": 0, "Historia": 0, "Tecnologia": 0 },
    Sobrevivencia:  { "Furtividade": 0, "Acrobacia": 0, "Atletismo": 0, "Percepcao": 0, "Rastreamento": 0 },
  },
  habilidades: [
    { nome: "", custoRC: "", custoStamina: "", descricao: "" },
    { nome: "", custoRC: "", custoStamina: "", descricao: "" },
    { nome: "", custoRC: "", custoStamina: "", descricao: "" },
    { nome: "", custoRC: "", custoStamina: "", descricao: "" },
  ],
  inventario: Array.from({ length: 6 }, () => ({ nome: "", quantidade: "" })),
  consumiveis: { comida: 0, cafe: 0, sanA: 0, sanB: 0, sanO: 0, sanAB: 0 },
  dinheiro: "",
  historia: { origem: "", personalidade: "", objetivos: "", medos: "" },
  aliados:  [{ nome: "", relacao: "" }, { nome: "", relacao: "" }, { nome: "", relacao: "" }],
  inimigos: [{ nome: "", razao: "" },  { nome: "", razao: "" }],
  rolagens: Array.from({ length: 4 }, () => ({ data: "", situacao: "", resultado: "", consequencia: "" })),
  notas: "",
  criadoEm: "", ultimaAtualizacao: "", sessoes: 0,
};

const ATTR_LABELS  = { STR: "Forca", SPD: "Velocidade", RES: "Resistencia", PER: "Percepcao", INT: "Inteligencia", CHA: "Carisma" };
const ATTR_ICONS   = { STR: "💪", SPD: "⚡", RES: "🛡️", PER: "👁️", INT: "🧠", CHA: "✨" };
const KAGUNE_TYPES = ["Ukaku", "Koukaku", "Rinkaku", "Bikaku", "Chimera"];
const RANKS        = ["C", "B", "A", "S", "SS", "SSS"];
const KAGUNE_BONUS = {
  Ukaku:    { STR: 0, SPD: 3, RES: -2, PER: 2, INT: 0, CHA: 0 },
  Koukaku:  { STR: 2, SPD: -3, RES: 4, PER: 0, INT: 0, CHA: 0 },
  Rinkaku:  { STR: 3, SPD: 0, RES: 2, PER: -2, INT: 0, CHA: 0 },
  Bikaku:   { STR: 2, SPD: 2, RES: 2, PER: 2, INT: 2, CHA: 2 },
  Chimera:  { STR: 1, SPD: 1, RES: 1, PER: 1, INT: 1, CHA: 1 },
};

/* ─────────────────── MICRO COMPONENTS ─────────────────── */
const Input = ({ value, onChange, placeholder, className = "", multiline, rows = 2 }) => {
  const base = `bg-transparent border-b border-gray-600 focus:border-red-500 text-gray-100 text-sm outline-none transition-colors duration-200 w-full px-1 py-0.5 placeholder-gray-600 ${className}`;
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} className={`${base} resize-none border border-gray-600 rounded-sm px-2 py-1`} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={base} />;
};

const NumInput = ({ value, onChange, min = 0, max = 99, className = "" }) => (
  <input type="number" min={min} max={max} value={value}
    onChange={e => { const v = Math.min(max, Math.max(min, Number(e.target.value))); onChange(v); }}
    className={`bg-transparent border-b border-gray-600 focus:border-red-500 text-red-400 font-bold text-center text-sm outline-none w-full transition-colors duration-200 ${className}`} />
);

const Label = ({ children, className = "" }) => (
  <span className={`text-gray-500 text-xs uppercase tracking-widest ${className}`}>{children}</span>
);

const SectionTitle = ({ icon, children }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    <span className="text-lg">{icon}</span>
    <h3 className="text-red-400 font-bold text-sm uppercase tracking-widest border-b border-gray-700 pb-0.5 flex-1">{children}</h3>
  </div>
);

/* ─────────────────── BAR TRACKER ─────────────────── */
const BarTracker = ({ label, current, max, onChange, color = "red" }) => {
  const pct = max > 0 ? (current / max) * 100 : 0;
  const colors = {
    red:    ["bg-red-500",    "border-red-500",    "text-red-400"],
    teal:   ["bg-teal-500",   "border-teal-500",   "text-teal-400"],
    purple: ["bg-purple-500", "border-purple-500", "text-purple-400"],
  };
  const [bg, border, text] = colors[color] || colors.red;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between items-center">
        <Label>{label}</Label>
        <div className="flex items-center gap-1">
          <input type="number" value={current} min={0} max={max}
            onChange={e => onChange("cur", Math.min(max, Math.max(0, Number(e.target.value))))}
            className={`bg-transparent text-xs font-bold ${text} text-center w-10 outline-none`} />
          <span className="text-gray-600 text-xs">/</span>
          <input type="number" value={max} min={0}
            onChange={e => onChange("max", Math.max(0, Number(e.target.value)))}
            className="bg-transparent text-xs text-gray-500 text-center w-10 outline-none" />
        </div>
      </div>
      <div className={`w-full h-1.5 bg-gray-800 rounded-full border ${border} border-opacity-30 overflow-hidden`}>
        <div className={`h-full ${bg} rounded-full transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

/* ─────────────────── ATTRIBUTE RINGS ─────────────────── */
const AttrRing = ({ attrs, onEdit }) => {
  const maxVal = 20;
  const circ = 2 * Math.PI * 15;
  return (
    <div className="grid grid-cols-3 gap-2">
      {Object.keys(attrs).map(k => {
        const val = attrs[k];
        const pct = (val / maxVal) * 100;
        return (
          <div key={k} className="flex flex-col items-center gap-0.5">
            <span className="text-xs">{ATTR_ICONS[k]}</span>
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#1e293b" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e94560" strokeWidth="3"
                  strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round" className="transition-all duration-500" />
              </svg>
              <input type="number" value={val} min={1} max={20}
                onChange={e => onEdit(k, Math.min(20, Math.max(1, Number(e.target.value))))}
                className="absolute inset-0 w-full h-full text-center text-red-400 font-bold text-sm bg-transparent outline-none" />
            </div>
            <Label className="text-center leading-tight">{ATTR_LABELS[k]}</Label>
            <Label className="text-center" style={{ fontSize: "9px" }}>{k}</Label>
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────── SKILL TABLE ─────────────────── */
const SkillTable = ({ title, icon, skills, onEdit }) => (
  <div className="mb-3">
    <div className="flex items-center gap-1.5 mb-1.5">
      <span className="text-sm">{icon}</span>
      <span className="text-gray-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
    </div>
    <div className="space-y-0.5">
      {Object.entries(skills).map(([name, val]) => (
        <div key={name} className="flex items-center gap-2">
          <div className="flex gap-0.5 flex-1">
            {[...Array(10)].map((_, i) => (
              <button key={i} onClick={() => onEdit(name, i < val ? val - 1 : i + 1)}
                className={`h-1.5 flex-1 rounded-full transition-all duration-200 ${i < val ? "bg-red-500" : "bg-gray-700 hover:bg-gray-600"}`} />
            ))}
          </div>
          <span className="text-gray-300 text-xs w-28 text-right truncate">{name}</span>
          <span className="text-red-400 text-xs font-bold w-5 text-center">{val}</span>
        </div>
      ))}
    </div>
  </div>
);

/* ═════════════════════ MAIN APP ═════════════════════ */
export default function App() {
  const [players, setPlayers] = useState([
    { id: 1, name: "Player 1", sheet: JSON.parse(JSON.stringify(INITIAL_SHEET)) },
    { id: 2, name: "Player 2", sheet: JSON.parse(JSON.stringify(INITIAL_SHEET)) },
  ]);
  const [mode, setMode]                   = useState("master");
  const [activePlayer, setActivePlayer]   = useState(0);
  const [activeTab, setActiveTab]         = useState("info");
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [particles, setParticles]         = useState([]);

  useEffect(() => {
    setParticles(Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * 100, size: Math.random() * 2 + 0.5,
      speed: Math.random() * 40 + 20, delay: Math.random() * 10,
    })));
  }, []);

  const sheet = players[activePlayer]?.sheet || INITIAL_SHEET;
  const { STR, SPD, RES, PER, INT } = sheet.attrs;
  const derivedHP      = (RES * 10) + (STR * 5);
  const derivedStamina = (RES * 5)  + (SPD * 3);
  const derivedRC      = 100 + (RES * 10);
  const defBase        = Math.floor((RES + SPD) / 2);
  const initiative     = SPD + PER;
  const totalSkillPts  = Object.values(sheet.pericias).flatMap(g => Object.values(g)).reduce((a, b) => a + b, 0);

  const updateSheet = useCallback((updater) => {
    setPlayers(prev => prev.map((p, i) => (i === activePlayer ? { ...p, sheet: updater(p.sheet) } : p)));
  }, [activePlayer]);

  const set = useCallback((path, value) => {
    updateSheet(s => {
      const keys = path.split(".");
      const ns = JSON.parse(JSON.stringify(s));
      let obj = ns;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return ns;
    });
  }, [updateSheet]);

  const addPlayer = () => {
    if (!newPlayerName.trim()) return;
    setPlayers(prev => [...prev, { id: Date.now(), name: newPlayerName.trim(), sheet: JSON.parse(JSON.stringify(INITIAL_SHEET)) }]);
    setNewPlayerName("");
    setShowAddPlayer(false);
  };

  const tabs = [
    { id: "info",      label: "Perfil",     icon: "👤" },
    { id: "attrs",     label: "Atributos",  icon: "⚡" },
    { id: "skills",    label: "Pericias",   icon: "🎯" },
    { id: "kagune",    label: sheet.facao === "CCG" ? "Quinques" : "Kagune", icon: sheet.facao === "CCG" ? "🛡️" : "🦾" },
    { id: "abilities", label: "Habilidades", icon: "🌟" },
    { id: "inventory", label: "Inventario", icon: "💼" },
    { id: "lore",      label: "Historia",   icon: "📖" },
    { id: "log",       label: "Log",        icon: "📜" },
  ];

  /* ── PANELS ── */
  const renderInfo = () => (
    <div className="space-y-4">
      <div className="relative rounded-xl overflow-hidden" style={{ background: "linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)" }}>
        <div className="relative p-4">
          <div className="flex gap-4 items-start">
            <div className="w-20 h-20 rounded-full border-2 border-red-500 flex items-center justify-center text-3xl flex-shrink-0" style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)" }}>
              {sheet.facao === "Ghoul" ? "👁️" : sheet.facao === "CCG" ? "🛡️" : "⚪"}
            </div>
            <div className="flex-1 min-w-0">
              <Input value={sheet.nome} onChange={v => set("nome", v)} placeholder="Nome do personagem..." className="text-lg font-bold" />
              <div className="flex gap-3 mt-1 flex-wrap">
                <div><Label>Idade</Label><NumInput value={sheet.idade || ""} onChange={v => set("idade", v)} max={999} className="w-12" /></div>
                <div><Label>Sexo</Label><Input value={sheet.sexo} onChange={v => set("sexo", v)} placeholder="-" className="w-16" /></div>
                <div>
                  <Label>Facao</Label>
                  <select value={sheet.facao} onChange={e => set("facao", e.target.value)} className="bg-transparent text-sm text-red-400 font-bold outline-none border-b border-gray-600 focus:border-red-500 cursor-pointer">
                    <option value="Ghoul" className="bg-gray-900">Ghoul</option>
                    <option value="CCG" className="bg-gray-900">CCG</option>
                    <option value="Neutro" className="bg-gray-900">Neutro</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg p-3 space-y-2" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm">🎖️</span><Label>Nivel</Label>
            <NumInput value={sheet.nivel} onChange={v => { set("nivel", v); set("xpMax", v * 1000); }} min={1} max={99} className="w-10" />
          </div>
          <Label className="text-gray-600">XP Necessario: {sheet.nivel * 1000}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Label className="w-6 text-center">XP</Label>
          <div className="flex-1 relative h-4 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
            <div className="absolute inset-0 h-full rounded-full transition-all duration-500" style={{ width: `${sheet.xpMax > 0 ? (sheet.xpAtual / sheet.xpMax) * 100 : 0}%`, background: "linear-gradient(90deg,#e94560,#f5a623)" }} />
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-xs font-bold text-white drop-shadow">{sheet.xpAtual} / {sheet.xpMax}</span></div>
          </div>
          <NumInput value={sheet.xpAtual} onChange={v => set("xpAtual", Math.min(sheet.xpMax, v))} max={sheet.xpMax} className="w-14" />
        </div>
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="🩸">Status Vital</SectionTitle>
        <div className="space-y-2">
          <BarTracker label="Vigor (HP)" current={sheet.hp} max={sheet.hpMax || derivedHP} onChange={(t, v) => t === "cur" ? set("hp", v) : set("hpMax", v)} color="red" />
          <BarTracker label="Stamina" current={sheet.stamina} max={sheet.staminaMax || derivedStamina} onChange={(t, v) => t === "cur" ? set("stamina", v) : set("staminaMax", v)} color="teal" />
          {sheet.facao === "Ghoul" && <BarTracker label="RC Cells" current={sheet.rc} max={sheet.rcMax || derivedRC} onChange={(t, v) => t === "cur" ? set("rc", v) : set("rcMax", v)} color="purple" />}
        </div>
        <div className="pt-2 mt-2 border-t border-gray-800 flex justify-around text-center">
          <div><Label>Defesa Base</Label><div className="text-teal-400 font-bold text-sm">{defBase}</div></div>
          <div><Label>Iniciativa</Label><div className="text-teal-400 font-bold text-sm">{initiative}</div></div>
          <div><Label>HP Max (calc.)</Label><div className="text-gray-500 font-bold text-sm">{derivedHP}</div></div>
        </div>
      </div>
    </div>
  );

  const renderAttrs = () => (
    <div className="space-y-4">
      <div className="rounded-lg p-4" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="⚡">Atributos Primarios</SectionTitle>
        <p className="text-gray-600 text-xs mb-3 text-center">Pontos base: 1-20 · edite dentro dos circulos</p>
        <AttrRing attrs={sheet.attrs} onEdit={(k, v) => set(`attrs.${k}`, v)} />
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="📐">Valores Derivados</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {[
            ["Vigor (HP)", "(RES x10)+(STR x5)", derivedHP],
            ["Stamina", "(RES x5)+(SPD x3)", derivedStamina],
            ["RC Cells", "100+(RES x10)", derivedRC],
            ["Defesa Base", "(RES+SPD)/2", defBase],
            ["Iniciativa", "SPD+PER", initiative],
            ["Bonus XP INT", `x${(1 + INT / 20).toFixed(2)}`, `x${(1 + INT / 20).toFixed(2)}`],
          ].map(([label, formula, value]) => (
            <div key={label} className="rounded p-2" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 text-xs font-semibold">{label}</span>
                <span className="text-red-400 font-bold text-sm">{value}</span>
              </div>
              <span className="text-gray-600 text-xs font-mono">{formula}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
      <p className="text-gray-600 text-xs text-center mb-2">20 pontos para distribuir · nivel maximo 10 · click nas barras</p>
      <div className="text-gray-500 text-xs text-right mb-2">
        Pontos usados: <span className={`font-bold ${totalSkillPts > 20 ? "text-red-500" : "text-teal-400"}`}>{totalSkillPts}/20</span>
      </div>
      {[
        ["Combate", "⚔️", sheet.pericias.Combate],
        ["Sociais", "🗣️", sheet.pericias.Sociais],
        ["Conhecimento", "📚", sheet.pericias.Conhecimento],
        ["Sobrevivencia", "🏕️", sheet.pericias.Sobrevivencia],
      ].map(([title, icon, skills]) => (
        <SkillTable key={title} title={title} icon={icon} skills={skills}
          onEdit={(name, val) => set(`pericias.${title}.${name}`, Math.min(10, val))} />
      ))}
    </div>
  );

  const renderKagune = () => (
    <div className="space-y-3">
      {sheet.facao === "Ghoul" ? (
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <SectionTitle icon="🦾">Kagune</SectionTitle>
          <div className="space-y-2">
            <div>
              <Label>Tipo</Label>
              <div className="flex gap-1.5 flex-wrap mt-0.5">
                {KAGUNE_TYPES.map(t => (
                  <button key={t} onClick={() => set("kagune.tipo", t)}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all duration-200 ${sheet.kagune.tipo === t ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{t}</button>
                ))}
              </div>
            </div>
            {sheet.kagune.tipo && (
              <div className="rounded p-2 mt-2" style={{ background: "#0f172a", border: "1px solid #374151" }}>
                <span className="text-teal-400 text-xs font-bold">Bonus do {sheet.kagune.tipo}</span>
                <div className="flex gap-2 flex-wrap mt-1">
                  {Object.entries(KAGUNE_BONUS[sheet.kagune.tipo] || {}).filter(([, v]) => v !== 0).map(([k, v]) => (
                    <span key={k} className={`text-xs font-bold ${v > 0 ? "text-teal-400" : "text-red-400"}`}>{k} {v > 0 ? "+" : ""}{v}</span>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Rank</Label>
              <div className="flex gap-1.5 mt-0.5">
                {RANKS.map(r => (
                  <button key={r} onClick={() => set("kagune.rank", r)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-all duration-200 ${sheet.kagune.rank === r ? "bg-red-500 text-white scale-110" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Cor</Label><Input value={sheet.kagune.cor} onChange={v => set("kagune.cor", v)} placeholder="Ex: Branco cristalino" /></div>
              <div><Label>Aparencia</Label><Input value={sheet.kagune.aparencia} onChange={v => set("kagune.aparencia", v)} placeholder="Descricao..." /></div>
            </div>
            <div><Label>Habilidades Especiais</Label><Input value={sheet.kagune.habilidades} onChange={v => set("kagune.habilidades", v)} placeholder="Descreva..." multiline rows={2} /></div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {[["quinque1", "Quinque Principal"], ["quinque2", "Quinque Secundaria"]].map(([key, title]) => (
            <div key={key} className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <SectionTitle icon="🗡️">{title}</SectionTitle>
              <div className="space-y-2">
                <div><Label>Nome</Label><Input value={sheet[key].nome} onChange={v => set(`${key}.nome`, v)} placeholder="Nome da Quinque" /></div>
                <div className="flex gap-3 flex-wrap">
                  <div>
                    <Label>Tipo</Label>
                    <select value={sheet[key].tipo} onChange={e => set(`${key}.tipo`, e.target.value)} className="bg-transparent text-sm text-red-400 font-bold outline-none border-b border-gray-600 focus:border-red-500">
                      <option value="" className="bg-gray-900">-</option>
                      {["Ukaku", "Koukaku", "Rinkaku", "Bikaku"].map(t => <option key={t} value={t} className="bg-gray-900">{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Rank</Label>
                    <div className="flex gap-1 mt-0.5">
                      {["C", "B", "A", "S", "SS"].map(r => (
                        <button key={r} onClick={() => set(`${key}.rank`, r)}
                          className={`w-7 h-7 rounded text-xs font-bold transition-all ${sheet[key].rank === r ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>{r}</button>
                      ))}
                    </div>
                  </div>
                  <div><Label>Dano Base</Label><Input value={sheet[key].danoBase} onChange={v => set(`${key}.danoBase`, v)} placeholder="2d6" className="w-14" /></div>
                </div>
                {key === "quinque1" && (
                  <div className="flex gap-2 items-center">
                    <Label>Durabilidade</Label>
                    <NumInput value={sheet[key].durAtual || 0} onChange={v => set(`${key}.durAtual`, v)} max={999} className="w-12" />
                    <span className="text-gray-600 text-xs">/</span>
                    <NumInput value={sheet[key].durMax || 0} onChange={v => set(`${key}.durMax`, v)} max={999} className="w-12" />
                  </div>
                )}
              </div>
            </div>
          ))}
          <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
            <SectionTitle icon="🎒">Outros Equipamentos</SectionTitle>
            <div className="space-y-1.5">
              {[
                ["Armadura CCG", () => sheet.equipamentos.armadura, v => set("equipamentos.armadura", v), "Def +__"],
                ["RC Suppressant", () => sheet.equipamentos.suppressant, v => set("equipamentos.suppressant", v), "doses"],
                ["Kit Medico", () => sheet.equipamentos.kitMedico, v => set("equipamentos.kitMedico", v), "usos"],
              ].map(([label, get, setter, unit]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className="text-gray-300 text-xs w-32">{label}</span>
                  <Input value={get()} onChange={setter} placeholder={unit} className="w-24" />
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={sheet.equipamentos.comunicador} onChange={e => set("equipamentos.comunicador", e.target.checked)} className="accent-red-500" />
                <span className="text-gray-300 text-xs">Comunicador</span>
              </div>
              {sheet.equipamentos.extras.map((ex, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-gray-600 text-xs">+</span>
                  <Input value={ex} onChange={v => { const ne = [...sheet.equipamentos.extras]; ne[i] = v; set("equipamentos.extras", ne); }} placeholder="Outro item..." />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderAbilities = () => (
    <div className="space-y-2">
      {sheet.habilidades.map((hab, i) => (
        <div key={i} className="rounded-lg p-3 transition-colors duration-300" style={{ background: "#111827", border: `1px solid ${hab.nome ? "#e94560" : "#1e293b"}` }}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-red-500 text-xs font-bold w-5 text-center">{i + 1}</span>
            <Input value={hab.nome} onChange={v => { const n = [...sheet.habilidades]; n[i] = { ...n[i], nome: v }; set("habilidades", n); }} placeholder="Nome da habilidade..." className="font-bold text-sm" />
          </div>
          <div className="flex gap-2 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="text-purple-400 text-xs">RC</span>
              <Input value={hab.custoRC} onChange={v => { const n = [...sheet.habilidades]; n[i] = { ...n[i], custoRC: v }; set("habilidades", n); }} placeholder="0" className="w-10 text-center text-purple-400" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-teal-400 text-xs">STA</span>
              <Input value={hab.custoStamina} onChange={v => { const n = [...sheet.habilidades]; n[i] = { ...n[i], custoStamina: v }; set("habilidades", n); }} placeholder="0" className="w-10 text-center text-teal-400" />
            </div>
          </div>
          <Input value={hab.descricao} onChange={v => { const n = [...sheet.habilidades]; n[i] = { ...n[i], descricao: v }; set("habilidades", n); }} placeholder="Descricao da habilidade..." multiline rows={2} />
        </div>
      ))}
    </div>
  );

  const renderInventory = () => (
    <div className="space-y-3">
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="📦">Itens Gerais</SectionTitle>
        {sheet.inventario.map((item, i) => (
          <div key={i} className="flex items-center gap-2 mb-1">
            <span className="text-gray-600 text-xs w-4">{i + 1}</span>
            <Input value={item.nome} onChange={v => { const n = [...sheet.inventario]; n[i] = { ...n[i], nome: v }; set("inventario", n); }} placeholder="Item..." />
            <Input value={item.quantidade} onChange={v => { const n = [...sheet.inventario]; n[i] = { ...n[i], quantidade: v }; set("inventario", n); }} placeholder="Qtd" className="w-12 text-center" />
          </div>
        ))}
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="🩸">Consumiveis</SectionTitle>
        <div className="grid grid-cols-3 gap-2">
          {[["comida", "🍖 Comida"], ["cafe", "☕ Cafe"], ["sanA", "🩸 Tipo A"], ["sanB", "🩸 Tipo B"], ["sanO", "🩸 Tipo O"], ["sanAB", "🩸 Tipo AB"]].map(([key, label]) => (
            <div key={key} className="text-center">
              <Label className="text-center block">{label}</Label>
              <NumInput value={sheet.consumiveis[key]} onChange={v => set(`consumiveis.${key}`, v)} max={999} className="w-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-sm">💰</span><Label>Dinheiro</Label><span className="text-yellow-400 text-xs">¥</span>
          <Input value={sheet.dinheiro} onChange={v => set("dinheiro", v)} placeholder="0" className="flex-1 text-yellow-400 font-bold" />
        </div>
      </div>
    </div>
  );

  const renderLore = () => (
    <div className="space-y-3">
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        {[["origem", "📍 Origem"], ["personalidade", "🎭 Personalidade"], ["objetivos", "🎯 Objetivos"], ["medos", "😰 Medos / Fraquezas"]].map(([key, title]) => (
          <div key={key} className="mb-3">
            <Label>{title}</Label>
            <Input value={sheet.historia[key]} onChange={v => set(`historia.${key}`, v)} placeholder="Escreva aqui..." multiline rows={3} />
          </div>
        ))}
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="🤝">Aliados</SectionTitle>
        {sheet.aliados.map((a, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <Input value={a.nome} onChange={v => { const n = [...sheet.aliados]; n[i] = { ...n[i], nome: v }; set("aliados", n); }} placeholder="Nome" className="w-1/3" />
            <span className="text-gray-600 text-xs self-center">→</span>
            <Input value={a.relacao} onChange={v => { const n = [...sheet.aliados]; n[i] = { ...n[i], relacao: v }; set("aliados", n); }} placeholder="Relacao" />
          </div>
        ))}
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="⚔️">Inimigos</SectionTitle>
        {sheet.inimigos.map((e, i) => (
          <div key={i} className="flex gap-2 mb-1">
            <Input value={e.nome} onChange={v => { const n = [...sheet.inimigos]; n[i] = { ...n[i], nome: v }; set("inimigos", n); }} placeholder="Nome" className="w-1/3" />
            <span className="text-gray-600 text-xs self-center">→</span>
            <Input value={e.razao} onChange={v => { const n = [...sheet.inimigos]; n[i] = { ...n[i], razao: v }; set("inimigos", n); }} placeholder="Razao" />
          </div>
        ))}
      </div>
    </div>
  );

  const renderLog = () => (
    <div className="space-y-3">
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="🎲">Registro de Rolagens</SectionTitle>
        <div className="space-y-1.5">
          {sheet.rolagens.map((r, i) => (
            <div key={i} className="rounded p-2" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
              <div className="flex gap-2 mb-1 flex-wrap">
                <Input value={r.data} onChange={v => { const n = [...sheet.rolagens]; n[i] = { ...n[i], data: v }; set("rolagens", n); }} placeholder="Data" className="w-20" />
                <Input value={r.situacao} onChange={v => { const n = [...sheet.rolagens]; n[i] = { ...n[i], situacao: v }; set("rolagens", n); }} placeholder="Situacao" className="flex-1" />
                <div className="flex items-center gap-1">
                  <span className="text-red-400 text-xs">d20:</span>
                  <Input value={r.resultado} onChange={v => { const n = [...sheet.rolagens]; n[i] = { ...n[i], resultado: v }; set("rolagens", n); }} placeholder="-" className="w-8 text-center text-red-400 font-bold" />
                </div>
              </div>
              <Input value={r.consequencia} onChange={v => { const n = [...sheet.rolagens]; n[i] = { ...n[i], consequencia: v }; set("rolagens", n); }} placeholder="Consequencia..." />
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <SectionTitle icon="📝">Notas do Jogador</SectionTitle>
        <Input value={sheet.notas} onChange={v => set("notas", v)} placeholder="Notas livres..." multiline rows={5} />
      </div>
      <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid #1e293b" }}>
        <div className="flex gap-3 flex-wrap">
          <div><Label>Criado em</Label><Input value={sheet.criadoEm} onChange={v => set("criadoEm", v)} placeholder="dd/mm/aa" className="w-24" /></div>
          <div><Label>Ultima atualizacao</Label><Input value={sheet.ultimaAtualizacao} onChange={v => set("ultimaAtualizacao", v)} placeholder="dd/mm/aa" className="w-24" /></div>
          <div><Label>Sessoes</Label><NumInput value={sheet.sessoes} onChange={v => set("sessoes", v)} max={999} className="w-12" /></div>
        </div>
      </div>
    </div>
  );

  const panelMap = { info: renderInfo, attrs: renderAttrs, skills: renderSkills, kagune: renderKagune, abilities: renderAbilities, inventory: renderInventory, lore: renderLore, log: renderLog };

  /* ─── MAIN RENDER ─── */
  return (
    <div className="min-h-screen text-gray-100 relative overflow-hidden" style={{ background: "#0a0e1a", fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      {/* particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {particles.map(p => (
          <div key={p.id} className="absolute rounded-full bg-red-500 opacity-0"
            style={{ left: `${p.x}%`, bottom: "-10px", width: p.size, height: p.size, animation: `floatUp ${p.speed}s linear ${p.delay}s infinite` }} />
        ))}
        <style>{`@keyframes floatUp { 0%{transform:translateY(0);opacity:0} 10%{opacity:.6} 90%{opacity:.3} 100%{transform:translateY(-100vh);opacity:0} }`}</style>
      </div>

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2" style={{ background: "linear-gradient(90deg,#0f172a,#1a1a2e)", borderBottom: "1px solid #1e293b" }}>
        <div className="flex items-center gap-2">
          <span className="text-red-500 text-lg">👁️</span>
          <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Tokyo Ghoul RPG</span>
        </div>
        <div className="flex gap-1">
          <button onClick={() => setMode("master")} className={`px-3 py-0.5 rounded text-xs font-bold transition-all duration-200 ${mode === "master" ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>🎭 Mestre</button>
          <button onClick={() => setMode("player")} className={`px-3 py-0.5 rounded text-xs font-bold transition-all duration-200 ${mode === "player" ? "bg-red-500 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}>🎲 Jogador</button>
        </div>
      </div>

      {/* body */}
      <div className="relative z-10 flex" style={{ height: "calc(100vh - 42px)" }}>
        {/* sidebar */}
        <div className="w-44 flex-shrink-0 flex flex-col" style={{ background: "#0d1220", borderRight: "1px solid #1e293b" }}>
          <div className="p-2 border-b border-gray-800"><span className="text-gray-500 text-xs uppercase tracking-widest">Fichas</span></div>
          <div className="flex-1 overflow-y-auto">
            {players.map((p, i) => (
              <button key={p.id} onClick={() => setActivePlayer(i)}
                className={`w-full text-left px-3 py-2 flex items-center gap-2 transition-all duration-200 border-b border-gray-900 ${activePlayer === i ? "bg-gray-800" : "hover:bg-gray-900"}`}>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${activePlayer === i ? "bg-red-500" : "bg-gray-600"}`} />
                <span className={`text-xs truncate ${activePlayer === i ? "text-white font-semibold" : "text-gray-400"}`}>{p.sheet.nome || p.name}</span>
                <span className="ml-auto text-xs">{p.sheet.facao === "Ghoul" ? "👁️" : p.sheet.facao === "CCG" ? "🛡️" : "⚪"}</span>
              </button>
            ))}
          </div>
          {mode === "master" && (
            <div className="p-2 border-t border-gray-800">
              {showAddPlayer ? (
                <div className="flex gap-1">
                  <input value={newPlayerName} onChange={e => setNewPlayerName(e.target.value)} onKeyDown={e => e.key === "Enter" && addPlayer()}
                    placeholder="Nome..." autoFocus className="flex-1 bg-gray-800 text-xs text-white px-1.5 py-0.5 rounded outline-none border border-gray-600 focus:border-red-500" />
                  <button onClick={addPlayer} className="text-teal-400 text-xs font-bold">+</button>
                  <button onClick={() => setShowAddPlayer(false)} className="text-gray-600 text-xs">✕</button>
                </div>
              ) : (
                <button onClick={() => setShowAddPlayer(true)} className="w-full text-xs text-teal-400 hover:text-teal-300 py-0.5 border border-dashed border-gray-700 rounded transition-colors">+ Novo Jogador</button>
              )}
            </div>
          )}
        </div>

        {/* main */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex gap-0.5 px-2 py-1.5 overflow-x-auto flex-shrink-0" style={{ background: "#0d1220", borderBottom: "1px solid #1e293b" }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all duration-200 flex-shrink-0 ${activeTab === t.id ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "text-gray-500 hover:text-gray-300 hover:bg-gray-800"}`}>
                <span>{t.icon}</span><span>{t.label}</span>
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto p-3" style={{ background: "#0a0e1a" }}>
            <div className="max-w-xl mx-auto">
              <div className="rounded-lg p-2 mb-2 text-center" style={{ background: "#1a1a2e", border: "1px solid #374151" }}>
                {mode === "master"
                  ? <span className="text-red-400 text-xs">🎭 Modo Mestre — Edite qualquer ficha livremente</span>
                  : <span className="text-yellow-400 text-xs">🎲 Modo Jogador — Você esta editando a sua propria ficha</span>}
              </div>
              {panelMap[activeTab]?.()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
