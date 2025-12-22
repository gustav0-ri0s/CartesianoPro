
import { DataPoint, ModelType, RegressionResult } from './types';

const fmt = (n: number, precision: number = 2) => {
  if (n === undefined || n === null || isNaN(n)) return "?";
  if (Math.abs(n) < 0.0001) return "0";
  // Redondeo inteligente para valores cercanos a enteros o decimales comunes
  if (Math.abs(n - Math.round(n)) < 0.005) return Math.round(n).toString();
  
  const str = n.toFixed(precision);
  return str.endsWith('.00') ? str.slice(0, -3) : str.replace(/\.?0+$/, "");
};

const det3 = (
  a: number, b: number, c: number,
  d: number, e: number, f: number,
  g: number, h: number, i: number
) => a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);

const calculateMetrics = (data: DataPoint[], predict: (x: number) => number) => {
  const n = data.length;
  if (n === 0) return { rSquared: 0, rmse: 0 };
  const yMean = data.reduce((sum, p) => sum + p.y, 0) / n;
  let ssRes = 0;
  let ssTot = 0;
  data.forEach(p => {
    const yPred = predict(p.x);
    if (isNaN(yPred) || !isFinite(yPred)) {
        ssRes = Infinity;
        return;
    }
    ssRes += Math.pow(p.y - yPred, 2);
    ssTot += Math.pow(p.y - yMean, 2);
  });
  
  if (ssRes === Infinity) return { rSquared: 0, rmse: Infinity };
  return { rSquared: ssTot === 0 ? 1 : Math.max(0, 1 - (ssRes / ssTot)), rmse: Math.sqrt(ssRes / n) };
};

export const getLocalInterpretation = (xAxis: string, yAxis: string, result: RegressionResult): string => {
  const type = result.type;
  const base = `Se trata de una función ${type}. `;
  
  switch (type) {
    case ModelType.LINEAR:
      return base + `Los datos muestran una relación de proporcionalidad directa entre "${xAxis}" y "${yAxis}". Por cada unidad que aumenta el eje X, el eje Y cambia de forma constante y predecible. 📈`;
    case ModelType.QUADRATIC:
      return base + `Se observa un comportamiento parabólico. El cambio en "${yAxis}" se acelera (o desacelerara) conforme "${xAxis}" aumenta, indicando una variación no lineal que forma una curva simétrica. 🎢`;
    case ModelType.LOGARITHMIC:
      let logDetail = "";
      if (result.formula.includes("log₂")) logDetail = "Cada vez que X se duplica, Y aumenta en una unidad. ";
      if (result.formula.includes("log₁₀")) logDetail = "Cada vez que X se multiplica por 10, Y aumenta en una unidad. ";
      return base + logDetail + `Representa un fenómeno que crece rápidamente al principio pero cuya tasa de crecimiento disminuye gradualmente hasta estabilizarse. 🪵`;
    case ModelType.EXPONENTIAL:
      return base + `Muestra un cambio extremadamente rápido. El valor de "${yAxis}" se multiplica por un factor constante por cada incremento en "${xAxis}", lo que genera un crecimiento o caída acelerada. 🚀`;
    case ModelType.POWER:
      return base + `La relación sigue una ley de potencias. Esto significa que "${yAxis}" es proporcional a una potencia de "${xAxis}", algo muy común en leyes físicas de escala y volúmenes. ⚛️`;
    default:
      return base + `Los datos sugieren una tendencia clara con un ajuste R² de ${result.rSquared.toFixed(4)}.`;
  }
};

export const runLinearRegression = (data: DataPoint[]): RegressionResult => {
  const n = data.length;
  if (n < 2) return { type: ModelType.LINEAR, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  const sumX = data.reduce((s, p) => s + p.x, 0);
  const sumY = data.reduce((s, p) => s + p.y, 0);
  const sumXY = data.reduce((s, p) => s + p.x * p.y, 0);
  const sumX2 = data.reduce((s, p) => s + p.x * p.x, 0);
  const denom = (n * sumX2 - sumX * sumX);
  if (Math.abs(denom) < 1e-12) return { type: ModelType.LINEAR, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const m = (n * sumXY - sumX * sumY) / denom;
  const b = (sumY - m * sumX) / n;
  const predict = (x: number) => m * x + b;
  const { rSquared, rmse } = calculateMetrics(data, predict);

  const mStr = m === 1 ? 'x' : m === -1 ? '-x' : (m === 0 ? '' : `${fmt(m)} · x`);
  const bStr = b === 0 ? (m === 0 ? '0' : '') : (b > 0 ? `${m === 0 ? '' : ' + '}${fmt(b)}` : ` - ${fmt(Math.abs(b))}`);

  return { type: ModelType.LINEAR, formula: `y = ${mStr}${bStr}`, parameters: { m, b }, rSquared, rmse, isApplicable: true, predict };
};

export const runLogarithmicRegression = (data: DataPoint[]): RegressionResult => {
  const applicable = data.every(p => p.x > 0);
  if (!applicable || data.length < 2) return { type: ModelType.LOGARITHMIC, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const linearizedData = data.map(p => ({ x: Math.log(p.x), y: p.y }));
  const linReg = runLinearRegression(linearizedData);
  const a = linReg.parameters.m;
  const c = linReg.parameters.b;

  const predict = (x: number) => a * Math.log(x) + c;
  const { rSquared, rmse } = calculateMetrics(data, predict);

  const ln2 = Math.log(2);
  const ln10 = Math.log(10);
  
  let formula = "";
  const cStr = c === 0 ? '' : (c > 0 ? ` + ${fmt(c)}` : ` - ${fmt(Math.abs(c))}`);

  if (Math.abs(a - (1/ln2)) < 0.01) {
    formula = `y = log₂(x)${cStr}`;
  } else if (Math.abs(a - (1/ln10)) < 0.01) {
    formula = `y = log₁₀(x)${cStr}`;
  } else if (Math.abs(a - 1) < 0.01) {
    formula = `y = ln(x)${cStr}`;
  } else {
    formula = `y = ${fmt(a)} · ln(x)${cStr}`;
  }

  return { 
    type: ModelType.LOGARITHMIC, 
    formula, 
    parameters: { a, c }, 
    rSquared, rmse, isApplicable: true, predict 
  };
};

export const runPowerRegression = (data: DataPoint[]): RegressionResult => {
  const applicable = data.every(p => p.x > 0 && p.y > 0);
  if (!applicable || data.length < 2) return { type: ModelType.POWER, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const linearizedData = data.map(p => ({ x: Math.log(p.x), y: Math.log(p.y) }));
  const linReg = runLinearRegression(linearizedData);
  const p = linReg.parameters.m;
  const A = Math.exp(linReg.parameters.b);

  const predict = (x: number) => A * Math.pow(x, p);
  const { rSquared, rmse } = calculateMetrics(data, predict);

  return { 
    type: ModelType.POWER, 
    formula: `y = ${fmt(A)} · x^(${fmt(p)})`, 
    parameters: { A, p }, 
    rSquared, rmse, isApplicable: true, predict 
  };
};

export const runExponentialRegression = (data: DataPoint[]): RegressionResult => {
  const applicable = data.every(p => p.y > 0);
  if (!applicable || data.length < 2) return { type: ModelType.EXPONENTIAL, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const linearizedData = data.map(p => ({ x: p.x, y: Math.log(p.y) }));
  const linReg = runLinearRegression(linearizedData);
  const A = Math.exp(linReg.parameters.b);
  const r = Math.exp(linReg.parameters.m); 

  const predict = (x: number) => A * Math.pow(r, x);
  const { rSquared, rmse } = calculateMetrics(data, predict);

  const rFormated = r > 1.01 || r < 0.99 ? fmt(r) : r.toFixed(3);
  return { 
    type: ModelType.EXPONENTIAL, 
    formula: `y = ${fmt(A)} · (${rFormated})^x`, 
    parameters: { A, r }, 
    rSquared, rmse, isApplicable: true, predict 
  };
};

export const runQuadraticRegression = (data: DataPoint[]): RegressionResult => {
  const n = data.length;
  if (n < 3) return { type: ModelType.QUADRATIC, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const sx = data.reduce((s, p) => s + p.x, 0);
  const sx2 = data.reduce((s, p) => s + p.x**2, 0);
  const sx3 = data.reduce((s, p) => s + p.x**3, 0);
  const sx4 = data.reduce((s, p) => s + p.x**4, 0);
  const sy = data.reduce((s, p) => s + p.y, 0);
  const sxy = data.reduce((s, p) => s + p.x*p.y, 0);
  const sx2y = data.reduce((s, p) => s + p.x**2*p.y, 0);

  const D = det3(n, sx, sx2, sx, sx2, sx3, sx2, sx3, sx4);
  if (Math.abs(D) < 1e-12) return { type: ModelType.QUADRATIC, formula: '', parameters: {}, rSquared: 0, rmse: 0, isApplicable: false, predict: () => 0 };
  
  const Dc = det3(sy, sx, sx2, sxy, sx2, sx3, sx2y, sx3, sx4);
  const Db = det3(n, sy, sx2, sx, sxy, sx3, sx2, sx2y, sx4);
  const Da = det3(n, sx, sy, sx, sx2, sxy, sx2, sx3, sx2y);

  const a = Da / D;
  const b = Db / D;
  const c = Dc / D;

  const predict = (x: number) => a * x**2 + b * x + c;
  const { rSquared, rmse } = calculateMetrics(data, predict);

  if (Math.abs(a) < 0.0001) {
    return { ...runLinearRegression(data), type: ModelType.QUADRATIC };
  }

  const aStr = a === 0 ? '' : (a === 1 ? 'x²' : a === -1 ? '-x²' : `${fmt(a)}·x²`);
  const bStr = b === 0 ? '' : (b > 0 ? ` + ${fmt(b)}·x` : ` - ${fmt(Math.abs(b))}·x`);
  const cStr = c === 0 ? '' : (c > 0 ? ` + ${fmt(c)}` : ` - ${fmt(Math.abs(c))}`);

  return { 
    type: ModelType.QUADRATIC, 
    formula: `y = ${aStr}${bStr}${cStr}`, 
    parameters: { a, b, c }, 
    rSquared, rmse, isApplicable: true, predict 
  };
};

export const getBestModel = (data: DataPoint[]): RegressionResult => {
  if (!data || data.length < 2) return runLinearRegression([]);
  
  const linear = runLinearRegression(data);
  if (linear.isApplicable && linear.rSquared > 0.999) return linear;

  const models = [
    linear,
    runLogarithmicRegression(data),
    runQuadraticRegression(data),
    runExponentialRegression(data),
    runPowerRegression(data)
  ].filter(m => m.isApplicable && !isNaN(m.rSquared) && isFinite(m.rSquared));

  if (models.length === 0) return linear;
  
  return models.sort((a, b) => {
    const diff = b.rSquared - a.rSquared;
    if (Math.abs(diff) < 0.001) return 0;
    return diff;
  })[0];
};
