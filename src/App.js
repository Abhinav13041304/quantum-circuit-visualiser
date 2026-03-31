import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { GATES, simulateCircuit } from "./quantumEngine";

const COLORS = ["#6c63ff", "#ff6584", "#f9a825", "#00bcd4", "#4caf50", "#ff9800"];

const NUM_QUBITS_OPTIONS = [1, 2, 3, 4];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [numQubits, setNumQubits] = useState(2);
  const [circuit, setCircuit] = useState([[], [], [], [], []]);
  const [selectedGate, setSelectedGate] = useState("H");
  const [cnotMode, setCnotMode] = useState(false);
  const [cnotControl, setCnotControl] = useState(null);
  const [result, setResult] = useState(null);
  const [showInfo, setShowInfo] = useState(null);

  const bg = darkMode ? "#0a0a1a" : "#f5f5ff";
  const surface = darkMode ? "#12122a" : "#ffffff";
  const surface2 = darkMode ? "#1a1a3a" : "#f0f0ff";
  const text = darkMode ? "#e0e0ff" : "#1a1a3a";
  const textMuted = darkMode ? "#8888aa" : "#6666aa";
  const border = darkMode ? "#2a2a5a" : "#d0d0ff";

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

  const getGateAtCell = (stepIndex, qubitIndex) => {
    const step = circuit[stepIndex];
    const op = step.find(op => op.target === qubitIndex || op.control === qubitIndex);
    if (!op) return null;
    if (op.gate === "CNOT") {
      return op.control === qubitIndex ? "●" : "⊕";
    }
    return op.gate;
  };

  const chartData = result
    ? result.probabilities
        .filter(p => p.probability > 0.001)
        .map(p => ({
          state: p.state,
          probability: parseFloat((p.probability * 100).toFixed(1)),
        }))
    : [];

  return (
    <div style={{ minHeight: "100vh", background: bg, color: text, fontFamily: "'Segoe UI', sans-serif", transition: "all 0.3s" }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${border}`, padding: "16px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "700", background: "linear-gradient(135deg, #6c63ff, #00bcd4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Quantum Circuit Visualiser
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: textMuted }}>Build and simulate quantum circuits in real time</p>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{ padding: "8px 16px", borderRadius: "20px", border: `1px solid ${border}`, background: surface2, color: text, cursor: "pointer", fontSize: "13px" }}
        >
          {darkMode ? "Light mode" : "Dark mode"}
        </button>
      </div>

      <div style={{ padding: "24px 32px", display: "grid", gridTemplateColumns: "280px 1fr", gap: "24px" }}>

        {/* Left Panel */}
        <div>

          {/* Qubit selector */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Qubits</p>
            <div style={{ display: "flex", gap: "8px" }}>
              {NUM_QUBITS_OPTIONS.map(n => (
                <button
                  key={n}
                  onClick={() => { setNumQubits(n); resetCircuit(); }}
                  style={{ flex: 1, padding: "8px", borderRadius: "8px", border: `1px solid ${numQubits === n ? "#6c63ff" : border}`, background: numQubits === n ? "#6c63ff22" : surface2, color: numQubits === n ? "#6c63ff" : text, cursor: "pointer", fontWeight: "600", fontSize: "14px" }}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Gate selector */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "16px", marginBottom: "16px" }}>
            <p style={{ margin: "0 0 10px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Gates</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.values(GATES).map(gate => (
                <motion.button
                  key={gate.name}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSelectedGate(gate.name); setCnotMode(false); setShowInfo(gate); }}
                  style={{
                    padding: "10px 14px", borderRadius: "8px", border: `1px solid ${selectedGate === gate.name && !cnotMode ? gate.color : border}`,
                    background: selectedGate === gate.name && !cnotMode ? `${gate.color}22` : surface2,
                    color: text, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px"
                  }}
                >
                  <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: gate.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: "700", color: "white", flexShrink: 0 }}>
                    {gate.name}
                  </span>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "500" }}>{gate.label}</div>
                    <div style={{ fontSize: "11px", color: textMuted }}>{gate.description.slice(0, 30)}...</div>
                  </div>
                </motion.button>
              ))}

              {/* CNOT button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setCnotMode(!cnotMode); setSelectedGate(null); setCnotControl(null); }}
                style={{
                  padding: "10px 14px", borderRadius: "8px", border: `1px solid ${cnotMode ? "#ff6584" : border}`,
                  background: cnotMode ? "#ff658422" : surface2, color: text, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: "10px"
                }}
              >
                <span style={{ width: "28px", height: "28px", borderRadius: "6px", background: "#ff6584", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", color: "white", flexShrink: 0 }}>
                  CX
                </span>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: "500" }}>CNOT</div>
                  <div style={{ fontSize: "11px", color: textMuted }}>Entangles two qubits...</div>
                </div>
              </motion.button>
            </div>
          </div>

          {/* Info box */}
          <AnimatePresence>
            {showInfo && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                style={{ background: surface, border: `1px solid ${showInfo.color}44`, borderRadius: "12px", padding: "14px" }}
              >
                <p style={{ margin: "0 0 4px", fontWeight: "600", color: showInfo.color }}>{showInfo.label}</p>
                <p style={{ margin: 0, fontSize: "12px", color: textMuted, lineHeight: "1.6" }}>{showInfo.description}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Panel */}
        <div>

          {/* CNOT hint */}
          <AnimatePresence>
            {cnotMode && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                style={{ background: "#ff658422", border: "1px solid #ff6584", borderRadius: "10px", padding: "12px 16px", marginBottom: "16px", fontSize: "13px", color: "#ff6584" }}
              >
                {cnotControl === null
                  ? "Click a cell to set the CONTROL qubit"
                  : `Control set at qubit ${cnotControl.qubit}, step ${cnotControl.step + 1}. Now click the TARGET qubit in the same step.`}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Circuit */}
          <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <p style={{ margin: 0, fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Circuit</p>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => runSimulation()} style={{ padding: "6px 14px", borderRadius: "8px", border: "none", background: "#6c63ff", color: "white", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>
                  Run
                </button>
                <button onClick={resetCircuit} style={{ padding: "6px 14px", borderRadius: "8px", border: `1px solid ${border}`, background: surface2, color: text, cursor: "pointer", fontSize: "12px" }}>
                  Reset
                </button>
              </div>
            </div>

            {/* Qubit lines */}
            {Array.from({ length: numQubits }).map((_, qi) => (
              <div key={qi} style={{ display: "flex", alignItems: "center", marginBottom: "12px" }}>
                <div style={{ width: "40px", fontSize: "13px", fontWeight: "600", color: textMuted, flexShrink: 0 }}>
                  q{qi}
                </div>
                <div style={{ flex: 1, height: "2px", background: border, position: "relative", display: "flex", alignItems: "center" }}>
                  <div style={{ position: "absolute", left: 0, right: 0, height: "1px", background: `linear-gradient(90deg, ${border}, #6c63ff44, ${border})` }} />
                  <div style={{ display: "flex", gap: "8px", position: "relative", zIndex: 1 }}>
                    {circuit.map((step, si) => {
                      const gateLabel = getGateAtCell(si, qi);
                      const gateColor = gateLabel && gateLabel !== "●" && gateLabel !== "⊕"
                        ? (GATES[gateLabel]?.color || "#6c63ff")
                        : "#ff6584";
                      return (
                        <motion.div
                          key={si}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => gateLabel ? removeGate(si, qi) : addGate(si, qi)}
                          style={{
                            width: "44px", height: "44px", borderRadius: "8px",
                            border: `1px solid ${gateLabel ? gateColor : border}`,
                            background: gateLabel ? `${gateColor}33` : surface2,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", fontSize: gateLabel ? "13px" : "18px",
                            fontWeight: "700", color: gateLabel ? gateColor : border,
                            transition: "all 0.2s",
                            boxShadow: gateLabel ? `0 0 12px ${gateColor}44` : "none"
                          }}
                        >
                          {gateLabel || "+"}
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", border: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "center", marginLeft: "8px", fontSize: "12px", color: textMuted }}>
                  M
                </div>
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
                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 16px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>Measurement Probabilities</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <XAxis dataKey="state" tick={{ fill: textMuted, fontSize: 12 }} />
                      <YAxis tick={{ fill: textMuted, fontSize: 12 }} unit="%" domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: surface2, border: `1px solid ${border}`, borderRadius: "8px", color: text }}
                        labelStyle={{ color: text }}
                        itemStyle={{ color: text }}
  f                     ormatter={(val) => [`${val}%`, "Probability"]}
/>
                      <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: surface, border: `1px solid ${border}`, borderRadius: "12px", padding: "20px" }}>
                  <p style={{ margin: "0 0 12px", fontSize: "12px", fontWeight: "600", color: textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>State Vector</p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "8px" }}>
                    {result.probabilities.filter(p => p.probability > 0.001).map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ background: surface2, border: `1px solid ${COLORS[i % COLORS.length]}44`, borderRadius: "8px", padding: "10px 12px" }}
                      >
                        <div style={{ fontSize: "16px", fontWeight: "700", color: COLORS[i % COLORS.length], marginBottom: "4px" }}>{p.state}</div>
                        <div style={{ fontSize: "12px", color: textMuted }}>{(p.probability * 100).toFixed(1)}%</div>
                        <div style={{ height: "4px", background: border, borderRadius: "2px", marginTop: "6px" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p.probability * 100}%` }}
                            style={{ height: "100%", background: COLORS[i % COLORS.length], borderRadius: "2px" }}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!result && (
            <div style={{ background: surface, border: `1px dashed ${border}`, borderRadius: "12px", padding: "40px", textAlign: "center", color: textMuted }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>⚛</div>
              <p style={{ margin: 0, fontSize: "14px" }}>Add gates to qubits and click Run to simulate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}