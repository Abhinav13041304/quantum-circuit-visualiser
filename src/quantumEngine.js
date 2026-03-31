export const math = {
  add: (a, b) => ({ re: a.re + b.re, im: a.im + b.im }),
  mul: (a, b) => ({
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  }),
  scale: (a, s) => ({ re: a.re * s, im: a.im * s }),
  abs2: (a) => a.re * a.re + a.im * a.im,
  zero: { re: 0, im: 0 },
  one: { re: 1, im: 0 },
  i: { re: 0, im: 1 },
};

const C = (re, im = 0) => ({ re, im });

export const GATES = {
  H: {
    name: "H",
    label: "Hadamard",
    color: "#6c63ff",
    matrix: [
      [C(1 / Math.SQRT2), C(1 / Math.SQRT2)],
      [C(1 / Math.SQRT2), C(-1 / Math.SQRT2)],
    ],
    description: "Creates superposition — puts qubit in 50/50 state",
  },
  X: {
    name: "X",
    label: "Pauli-X",
    color: "#ff6584",
    matrix: [
      [C(0), C(1)],
      [C(1), C(0)],
    ],
    description: "Quantum NOT gate — flips |0⟩ to |1⟩ and vice versa",
  },
  Y: {
    name: "Y",
    label: "Pauli-Y",
    color: "#f9a825",
    matrix: [
      [C(0), C(0, -1)],
      [C(0, 1), C(0)],
    ],
    description: "Rotates qubit around Y-axis of Bloch sphere",
  },
  Z: {
    name: "Z",
    label: "Pauli-Z",
    color: "#00bcd4",
    matrix: [
      [C(1), C(0)],
      [C(0), C(-1)],
    ],
    description: "Phase flip — flips the phase of |1⟩ state",
  },
  S: {
    name: "S",
    label: "S Gate",
    color: "#4caf50",
    matrix: [
      [C(1), C(0)],
      [C(0, 0), C(0, 1)],
    ],
    description: "Phase gate — applies π/2 phase rotation",
  },
  T: {
    name: "T",
    label: "T Gate",
    color: "#ff9800",
    matrix: [
      [C(1), C(0)],
      [C(0), C(Math.cos(Math.PI / 4), Math.sin(Math.PI / 4))],
    ],
    description: "π/8 gate — applies π/4 phase rotation",
  },
};

export function initStateVector(numQubits) {
  const size = Math.pow(2, numQubits);
  const state = Array(size).fill(null).map(() => C(0));
  state[0] = C(1);
  return state;
}

export function applyGate(state, gate, targetQubit, numQubits) {
  const size = Math.pow(2, numQubits);
  const newState = Array(size).fill(null).map(() => C(0));
  const m = gate.matrix;

  for (let i = 0; i < size; i++) {
    const bit = (i >> (numQubits - 1 - targetQubit)) & 1;
    const partner = i ^ (1 << (numQubits - 1 - targetQubit));

    if (bit === 0) {
      newState[i] = math.add(
        math.mul(m[0][0], state[i]),
        math.mul(m[0][1], state[partner])
      );
    } else {
      newState[i] = math.add(
        math.mul(m[1][0], state[partner]),
        math.mul(m[1][1], state[i])
      );
    }
  }
  return newState;
}

export function applyCNOT(state, controlQubit, targetQubit, numQubits) {
  const size = Math.pow(2, numQubits);
  const newState = [...state];

  for (let i = 0; i < size; i++) {
    const controlBit = (i >> (numQubits - 1 - controlQubit)) & 1;
    if (controlBit === 1) {
      const partner = i ^ (1 << (numQubits - 1 - targetQubit));
      if (i < partner) {
        [newState[i], newState[partner]] = [newState[partner], newState[i]];
      }
    }
  }
  return newState;
}

export function getMeasurementProbabilities(state, numQubits) {
  return state.map((amp, i) => ({
    state: `|${i.toString(2).padStart(numQubits, "0")}⟩`,
    probability: math.abs2(amp),
    amplitude: amp,
  }));
}

export function simulateCircuit(circuit, numQubits) {
  let state = initStateVector(numQubits);

  for (const step of circuit) {
    for (const op of step) {
      if (op.gate === "CNOT") {
        state = applyCNOT(state, op.control, op.target, numQubits);
      } else if (GATES[op.gate]) {
        state = applyGate(state, GATES[op.gate], op.target, numQubits);
      }
    }
  }

  return {
    state,
    probabilities: getMeasurementProbabilities(state, numQubits),
  };
}