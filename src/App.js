import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, ReferenceLine } from "recharts";
import { GATES, simulateCircuit } from "./quantumEngine";

const COLORS = ["#6c63ff", "#ff6584", "#f9a825", "#00bcd4", "#4caf50", "#ff9800"];
const NUM_QUBITS_OPTIONS = [1, 2, 3, 4];

// Quick-start presets for the empty state
const PRESETS = [
  {
    label: "H gate →",
    description: "Superposition",
    qubits: 1,
    circuit: [[{ gate: "H", target: 0 }], [], [], [], []],
  },
  {
    label: "Bell state →",
    description: "Entanglement",
    qubits: 2,
    circuit: [
      [{ gate: "H", target: 0 }],
      [{ gate: "CNOT", control: 0, target: 1 }],
      [], [], [],
    ],
  },
  {
    label: "X flip →",
    description: "NOT gate",
    qubits: 1,
    circuit: [[{ gate: "X", target: 0 }], [], [], [], []],
  },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [numQubits, setNumQubits] = useState(2);
  const [circuit, setCircuit] = useState([[], [], [], [], []]);
  const [selectedGate, setSelectedGate] = useState("H");
  const [cnotMode, setCnotMode] = useState(false);
  const [cnotControl, setCnotControl] = useState(null);
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(null);

  // Theme variables
  const bg = darkMode
    ? "radial-gradient(ellipse at 50% 0%, #1a1040 0%, #0a0a1a 60%)"
    : "radial-gradient(ellipse at 50% 0%, #e8e0ff 0%, #f5f5ff 60%)";
  const surface = darkMode ? "#12122a" : "#ffffff";
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";

  // ── Logic (unchanged) ──────────────────────────────────────────────────────

  const addGate = useCallback((stepIndex, qubitIndex) => {
    if (cnotMode) {
      if (cnotControl === null) {
        setCnotControl({ step: stepIndex, qubit: qubitIndex });
      } else {
        if (cnotControl.step === stepIndex && cnotControl.qubit !== qubitIndex) {
          const newCircuit = circuit.map((step, si) =>
            si === stepIndex
              ? [...step, { gate: "CNOT", control: cnotControl.qubit, target: qubitIndex }]
              : step
          );
          setCircuit(newCircuit);
          setCnotControl(null);
          setCnotMode(false);
          runSimulation(newCircuit);
        } else {
          setCnotControl(null);
        }
      }
      return;
    }

    const newCircuit = circuit.map((step, si) =>
      si === stepIndex
        ? [...step.filter(op => !(op.target === qubitIndex && !op.gate === "CNOT")),
           { gate: selectedGate, target: qubitIndex }]
        : step
    );
    setCircuit(newCircuit);
    runSimulation(newCircuit);
  }, [circuit, selectedGate, cnotMode, cnotControl]);

  const removeGate = useCallback((stepIndex, qubitIndex) => {
    const newCircuit = circuit.map((step, si) =>
      si === stepIndex
        ? step.filter(op => op.target !== qubitIndex && op.control !== qubitIndex)
        : step
    );
    setCircuit(newCircuit);
    runSimulation(newCircuit);
  }, [circuit]);

  const runSimulation = (circ = circuit) => {
    const res = simulateCircuit(circ, numQubits);
    setResult(res);
  };

  const resetCircuit = () => {
    const empty = [[], [], [], [], []];
    setCircuit(empty);
    setResult(null);
    setCnotControl(null);
    setCnotMode(false);
  };

  const applyPreset = (preset) => {
    setNumQubits(preset.qubits);
    setCircuit(preset.circuit);
    setCnotControl(null);
    setCnotMode(false);
    const res = simulateCircuit(preset.circuit, preset.qubits);
    setResult(res);
  };

  const getGateAtCell = (stepIndex, qubitIndex) => {
    const step = circuit[stepIndex];
    const op = step.find(op => op.target === qubitIndex || op.control === qubitIndex);
    if (!op) return null;
    if (op.gate === "CNOT") {
      return op.control === qubitIndex ? "●" : "⊕";
    }
    return op.gate;
  };

  // ── Chart data ─────────────────────────────────────────────────────────────

  const chartData = result
    ? result.probabilities
        .filter(p => p.probability > 0.001)
        .map(p => ({
          state: p.state,
          probability: parseFloat((p.probability * 100).toFixed(1)),
        }))
    : [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      color: text,
      fontFamily: "'Space Grotesk', sans-serif",
      transition: "all 0.3s",
    }}>

      {/* Global keyframes */}
      <style>{`
        @keyframes flowGradient {
          0%   { background-position: 0%   50%; }
          100% { background-position: 200% 50%; }
        }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #6c63ff44; border-radius: 3px; }
      `}</style>

      {/* ── Header ── */}
      <div style={{
        borderBottom: `1px solid ${border}`,
        padding: "16px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: surface,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <motion.img
              src="/logo.svg"
              alt="Qircuit logo"
              animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.1, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "36px", height: "36px", display: "inline-block" }}
            />
            <h1 style={{
              margin: 0,
              fontSize: "22px",
              fontWeight: "700",
              background: "linear-gradient(135deg, #6c63ff, #00bcd4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              Qircuit
            </h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ margin: "4px 0 0", fontSize: "13px", color: textMuted }}
          >
            Build and simulate quantum circuits in real time
          </motion.p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: "8px 18px", borderRadius: "20px",
            border: `1px solid ${border}`,
            background: surface2, color: text, cursor: "pointer",
            fontSize: "13px", fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: "500", display: "flex", alignItems: "center", gap: "6px",
          }}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </motion.button>
      </div>

      <div style={{
        padding: "24px 32px",
        display: "grid",
        gridTemplateColumns: "280px 1fr",
        gap: "24px",
        alignItems: "start",
      }}>

        {/* ── Left Panel — sticky ── */}
        <div style={{
          position: "sticky",
          top: "24px",
          maxHeight: "calc(100vh - 80px)",
          overflowY: "auto",
          scrollbarWidth: "thin",
          scrollbarColor: "#6c63ff44 transparent",
        }}>

          {/* Qubit selector */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Qubits</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {NUM_QUBITS_OPTIONS.map(n => (
                <motion.button
                  key={n}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { setNumQubits(n); resetCircuit(); }}
                  style={{
                    flex: 1, padding: "8px", borderRadius: "8px",
                    border: `1px solid ${numQubits === n ? "#6c63ff" : border}`,
                    background: numQubits === n ? "#6c63ff22" : surface2,
                    color: numQubits === n ? "#6c63ff" : text,
                    cursor: "pointer", fontWeight: "600", fontSize: "14px",
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: numQubits === n ? "0 0 12px #6c63ff33" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  {n}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Gate selector */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Gates</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.values(GATES).map(gate => (
                <motion.button
                  key={gate.name}
                  whileHover={{ scale: 1.02, boxShadow: `0 0 18px ${gate.color}44` }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedGate(gate.name); setCnotMode(false); setShowInfo(gate); }}
                  style={{
                    padding: "10px 14px", borderRadius: "8px",
                    border: selectedGate === gate.name && !cnotMode
                      ? `1px solid ${gate.color}`
                      : `1px solid ${border}`,
                    borderLeft: selectedGate === gate.name && !cnotMode
                      ? `3px solid ${gate.color}`
                      : `1px solid ${border}`,
                    background: selectedGate === gate.name && !cnotMode
                      ? `${gate.color}18`
                      : surface2,
                    color: text, cursor: "pointer", textAlign: "left",
                    display: "flex", alignItems: "center", gap: "10px",
                    boxShadow: selectedGate === gate.name && !cnotMode
                      ? `0 0 14px ${gate.color}33`
                      : "none",
                    transition: "all 0.2s",
                    fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  <span style={{
                    width: "28px", height: "28px", borderRadius: "6px",
                    background: gate.color,
                    boxShadow: `0 0 8px ${gate.color}66`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: "700", color: "white", flexShrink: 0,
                  }}>
                    {gate.name}
                  </span>
                  <div style={{ overflow: "hidden" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>{gate.label}</div>
                    <div style={{
                      fontSize: "11px", color: textMuted,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    }}>
                      {gate.description}
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* CNOT */}
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 0 18px #ff658444" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setCnotMode(!cnotMode); setSelectedGate(null); setCnotControl(null); }}
                style={{
                  padding: "10px 14px", borderRadius: "8px",
                  border: cnotMode ? "1px solid #ff6584" : `1px solid ${border}`,
                  borderLeft: cnotMode ? "3px solid #ff6584" : `1px solid ${border}`,
                  background: cnotMode ? "#ff658418" : surface2,
                  color: text, cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: "10px",
                  boxShadow: cnotMode ? "0 0 14px #ff658433" : "none",
                  transition: "all 0.2s",
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <span style={{
                  width: "28px", height: "28px", borderRadius: "6px",
                  background: "#ff6584", boxShadow: "0 0 8px #ff658466",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "11px", fontWeight: "700", color: "white", flexShrink: 0,
                }}>
                  CX
                </span>
                <div style={{ overflow: "hidden" }}>
                  <div style={{ fontSize: "13px", fontWeight: "600" }}>CNOT</div>
                  <div style={{
                    fontSize: "11px", color: textMuted,
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  }}>
                    Entangles two qubits via controlled-NOT
                  </div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Gate info box */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{
                  background: surface,
                  border: `1px solid ${showInfo.color}55`,
                  borderLeft: `3px solid ${showInfo.color}`,
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: `0 0 20px ${showInfo.color}22`,
                }}
              >
                <p style={{ margin: "0 0 6px", fontWeight: "700", color: showInfo.color, fontSize: "14px" }}>{showInfo.label}</p>
                <p style={{ margin: 0, fontSize: "12px", color: textMuted, lineHeight: "1.6" }}>{showInfo.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right Panel ── */}
        <div>

          {/* CNOT hint banner */}
          <AnimatePresence>
            {cnotMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{
                  background: "#ff658418",
                  border: "1px solid #ff6584",
                  borderRadius: "10px",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#ff6584",
                  fontWeight: "500",
                }}
              >
                {cnotControl === null
                  ? "🎯 Click a cell to set the CONTROL qubit"
                  : `✅ Control set at q${cnotControl.qubit}, step ${cnotControl.step + 1}. Now click the TARGET qubit in the same step.`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Circuit board */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Circuit</p>
              <div style={{ display: "flex", gap: "8px" }}>
                {/* Run button — gradient + icon */}
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 6px 24px #6c63ff66" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => runSimulation()}
                  style={{
                    padding: "7px 18px", borderRadius: "8px", border: "none",
                    background: "linear-gradient(135deg, #6c63ff, #00bcd4)",
                    color: "white", cursor: "pointer", fontSize: "13px", fontWeight: "700",
                    fontFamily: "'Space Grotesk', sans-serif",
                    boxShadow: "0 4px 16px #6c63ff55",
                    display: "flex", alignItems: "center", gap: "6px",
                  }}
                >
                  ▶ Run
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={resetCircuit}
                  style={{
                    padding: "7px 14px", borderRadius: "8px",
                    border: `1px solid ${border}`,
                    background: surface2, color: text, cursor: "pointer",
                    fontSize: "12px", fontFamily: "'Space Grotesk', sans-serif",
                  }}
                >
                  Reset
                </motion.button>
              </div>
            </div>

            {/* Qubit rows */}
            {Array.from({ length: numQubits }).map((_, qi) => (
              <div key={qi} style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div style={{
                  width: "40px", fontSize: "13px", fontWeight: "600",
                  color: textMuted, flexShrink: 0,
                  fontFamily: "'Space Mono', monospace",
                }}>
                  q{qi}
                </div>
                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                  {/* Animated wire */}
                  <div style={{
                    position: "absolute", left: 0, right: 0, height: "2px",
                    background: `linear-gradient(90deg, ${border}, #6c63ff88, #00bcd488, ${border})`,
                    backgroundSize: "200% 100%",
                    animation: "flowGradient 3s linear infinite",
                    borderRadius: "1px",
                  }} />
                  <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 1 }}>
                    {circuit.map((step, si) => {
                      const gateLabel = getGateAtCell(si, qi);
                      const gateColor = gateLabel && gateLabel !== "●" && gateLabel !== "⊕"
                        ? (GATES[gateLabel]?.color || "#6c63ff")
                        : "#ff6584";
                      return (
                        <motion.div
                          key={si}
                          whileHover={{ scale: 1.12 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => gateLabel ? removeGate(si, qi) : addGate(si, qi)}
                          style={{
                            width: "44px", height: "44px", borderRadius: "8px",
                            border: `1px solid ${gateLabel ? gateColor : border}`,
                            background: gateLabel ? `${gateColor}2a` : surface2,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer",
                            fontSize: gateLabel ? "14px" : "18px",
                            fontWeight: "700",
                            color: gateLabel ? gateColor : `${border}`,
                            transition: "all 0.2s",
                            boxShadow: gateLabel ? `0 0 14px ${gateColor}55` : "none",
                          }}
                        >
                          {gateLabel || "·"}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                {/* Measurement node */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  style={{
                    width: "34px", height: "34px", borderRadius: "50%",
                    border: `1px solid ${result ? "#6c63ff" : border}`,
                    background: result ? "#6c63ff18" : surface2,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginLeft: "8px", fontSize: "11px",
                    color: result ? "#6c63ff" : textMuted,
                    fontWeight: "700", transition: "all 0.3s", flexShrink: 0,
                  }}
                >
                  M
                </motion.div>
              </div>
            ))}
          </div>

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
              >
                {/* Probability chart */}
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    Measurement Probabilities
                  </p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <defs>
                        {COLORS.map((color, i) => (
                          <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.35} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid stroke={darkMode ? "#ffffff08" : "#00000008"} vertical={false} />
                      <XAxis
                        dataKey="state"
                        tick={{ fill: textMuted, fontSize: 12, fontFamily: "'Space Mono', monospace" }}
                        axisLine={false} tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: textMuted, fontSize: 11 }}
                        unit="%" domain={[0, 100]}
                        axisLine={false} tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: surface2, border: `1px solid ${border}`,
                          borderRadius: "8px", color: text,
                          fontFamily: "'Space Grotesk', sans-serif",
                        }}
                        labelStyle={{ color: text }}
                        itemStyle={{ color: text }}
                        formatter={(val) => [`${val}%`, "Probability"]}
                      />
                      {chartData.length > 1 && (
                        <ReferenceLine
                          y={50}
                          stroke="#6c63ff44"
                          strokeDasharray="4 4"
                          label={{ value: "50%", fill: textMuted, fontSize: 10 }}
                        />
                      )}
                      <Bar dataKey="probability" radius={[6, 6, 0, 0]} isAnimationActive animationDuration={700}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={`url(#barGrad${i % COLORS.length})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* State vector cards */}
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    State Vector
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "10px" }}>
                    {result.probabilities.filter(p => p.probability > 0.001).map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{
                          background: surface2,
                          border: `1px solid ${COLORS[i % COLORS.length]}44`,
                          borderRadius: "10px",
                          padding: "12px 14px",
                          boxShadow: `0 0 12px ${COLORS[i % COLORS.length]}18`,
                        }}
                      >
                        {/* State label — monospace */}
                        <div style={{
                          fontSize: "17px", fontWeight: "700",
                          color: COLORS[i % COLORS.length],
                          marginBottom: "3px",
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {p.state}
                        </div>
                        {/* Percentage */}
                        <div style={{ fontSize: "13px", fontWeight: "600", color: text }}>
                          {(p.probability * 100).toFixed(1)}%
                        </div>
                        {/* Amplitude — real + imaginary */}
                        <div style={{
                          fontSize: "10px", color: textMuted,
                          marginBottom: "8px",
                          fontFamily: "'Space Mono', monospace",
                        }}>
                          {p.amplitude.re.toFixed(3)}
                          {p.amplitude.im >= 0 ? " +" : " "}
                          {p.amplitude.im.toFixed(3)}i
                        </div>
                        {/* Progress bar — 6px, gradient, glowing */}
                        <div style={{ height: "6px", background: border, borderRadius: "3px" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p.probability * 100}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            style={{
                              height: "100%",
                              background: `linear-gradient(90deg, ${COLORS[i % COLORS.length]}, ${COLORS[i % COLORS.length]}88)`,
                              borderRadius: "3px",
                              boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}66`,
                            }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty state with quick-start presets */}
          {!result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: surface,
                border: `1px dashed ${border}`,
                borderRadius: "12px",
                padding: "40px 24px",
                textAlign: "center",
                color: textMuted,
              }}
            >
              <motion.img
                src="/logo.svg"
                alt="Quantum circuit"
                animate={{ rotate: [0, 6, -6, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
                style={{ width: "72px", height: "72px", marginBottom: "16px", display: "inline-block" }}
              />
              <p style={{ margin: "0 0 20px", fontSize: "14px" }}>
                Add gates to qubits and click Run — or try a preset:
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {PRESETS.map((preset, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.06, boxShadow: "0 0 16px #6c63ff44" }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => applyPreset(preset)}
                    style={{
                      padding: "10px 20px", borderRadius: "20px",
                      border: "1px solid #6c63ff66",
                      background: "#6c63ff18",
                      color: "#a89fff",
                      cursor: "pointer", fontSize: "13px", fontWeight: "600",
                      fontFamily: "'Space Grotesk', sans-serif",
                      transition: "all 0.2s",
                    }}
                  >
                    {preset.label}
                    <span style={{ fontSize: "11px", display: "block", color: textMuted, fontWeight: "400", marginTop: "2px" }}>
                      {preset.description}
                    </span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}