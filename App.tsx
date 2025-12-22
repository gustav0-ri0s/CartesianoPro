
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, Trash2, 
  LineChart as LineChartIcon,
  Info, Printer, Github,
  ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, 
  Line, ReferenceLine, LabelList, Cell, Label
} from 'recharts';

import { DataPoint, ModelType } from './types';
import * as Regression from './regressionService';

/**
 * Componente de entrada especializado para celdas de la tabla.
 * Optimizado para móviles: selección al enfocar y botones de ajuste rápido.
 */
const TableCellInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  colorClass: string;
}> = ({ value, onChange, colorClass }) => {
  const [inputValue, setInputValue] = useState<string>(String(value));

  // Sincronizar estado local cuando el valor externo cambia (ej. al vaciar la tabla)
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permitir estados intermedios como vacío o solo el signo negativo
    if (val === "" || val === "-") {
      setInputValue(val);
      return;
    }
    const parsed = parseFloat(val);
    if (!isNaN(parsed)) {
      setInputValue(val);
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    // Si al salir el valor no es válido, resetear a 0
    const parsed = parseFloat(inputValue);
    if (isNaN(parsed)) {
      setInputValue("0");
      onChange(0);
    } else {
      setInputValue(String(parsed));
    }
  };

  const adjust = (delta: number) => {
    const current = parseFloat(inputValue) || 0;
    const next = current + delta;
    setInputValue(String(next));
    onChange(next);
  };

  const toggleSign = () => {
    const current = parseFloat(inputValue) || 0;
    const next = current * -1;
    setInputValue(String(next));
    onChange(next);
  };

  return (
    <div className="flex items-center gap-1 group no-print">
      <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => adjust(1)}
          className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-400"
          title="Aumentar"
        >
          <ChevronUp size={12} />
        </button>
        <button 
          onClick={() => adjust(-1)}
          className="p-0.5 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400"
          title="Disminuir"
        >
          <ChevronDown size={12} />
        </button>
      </div>

      <div className="relative flex-1 min-w-[80px]">
        <input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()}
          className={`w-full bg-slate-900/50 border border-transparent focus:border-slate-700 hover:border-slate-800 rounded-lg px-2 py-2 text-center text-sm font-medium outline-none transition-all ${colorClass}`}
        />
      </div>

      <button 
        onClick={toggleSign}
        className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-600 hover:text-amber-500 transition-colors"
        title="Cambiar signo (±)"
      >
        <div className="text-[10px] font-black leading-none">±</div>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [data, setData] = useState<DataPoint[]>([
    { x: -2, y: 4 },
    { x: -1, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 4 }
  ]);

  const [axisNames, setAxisNames] = useState({
    x: 'Eje X',
    y: 'Eje Y'
  });

  const bestModel = useMemo(() => {
    try {
      if (!data || data.length < 2) return null;
      return Regression.getBestModel(data);
    } catch (e) {
      console.error("Error calculando regresión:", e);
      return null;
    }
  }, [data]);

  const interpretation = useMemo(() => {
    if (bestModel && bestModel.isApplicable) {
      return Regression.getLocalInterpretation(axisNames.x, axisNames.y, bestModel);
    }
    return 'Ingresa al menos dos puntos para generar una interpretación.';
  }, [bestModel, axisNames]);

  const chartDomain = useMemo(() => {
    if (data.length === 0) return { x: [-5, 5], y: [-5, 5] };
    const xValues = data.map(p => p.x);
    const yValues = data.map(p => p.y);
    const minX = Math.min(...xValues, -5);
    const maxX = Math.max(...xValues, 5);
    const minY = Math.min(...yValues, -5);
    const maxY = Math.max(...yValues, 5);
    const xAbsMax = Math.max(Math.abs(minX), Math.abs(maxX)) + 2;
    const yAbsMax = Math.max(Math.abs(minY), Math.abs(maxY)) + 2;
    return { x: [-xAbsMax, xAbsMax], y: [-yAbsMax, yAbsMax] };
  }, [data]);

  const regressionLineData = useMemo(() => {
    if (!bestModel || !bestModel.isApplicable) return [];
    const [minX, maxX] = chartDomain.x;
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = minX + (i / steps) * (maxX - minX);
      if ((bestModel.type === ModelType.LOGARITHMIC || bestModel.type === ModelType.POWER) && x <= 0) continue;
      const yVal = bestModel.predict(x);
      if (isFinite(yVal) && !isNaN(yVal)) {
        points.push({ x, yModel: yVal });
      }
    }
    return points;
  }, [bestModel, chartDomain]);

  const updatePoint = (index: number, field: 'x' | 'y', val: number) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: val };
    setData(newData);
  };

  const getPointLabel = (index: number) => String.fromCharCode(64 + (index % 26) + 1);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans print:bg-white print:text-black print:p-0">
      
      {/* CABECERA EXCLUSIVA PDF */}
      <div className="hidden print:block mb-8 border-b-4 border-black pb-4">
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter">Reporte Científico Cartesiano</h1>
        <p className="text-sm font-bold text-slate-700 mt-2 uppercase tracking-widest">
          {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString()}
        </p>
      </div>

      <header className="max-w-6xl mx-auto flex items-center justify-between mb-8 no-print">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <LineChartIcon className="text-white" size={28} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight uppercase text-white">Cartesiano <span className="text-indigo-400">Pro</span></h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-[0.2em]">LABORATORIO DE FUNCIONES</p>
          </div>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={() => window.print()} 
             className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700"
           >
             <Printer size={14} /> EXPORTAR PDF
           </button>
           <button 
             onClick={() => setData([...data, {x:0, y:0}])} 
             className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/10"
           >
             <Plus size={14} /> NUEVO PUNTO
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        <div className="lg:col-span-5 space-y-6 print:w-full">
          <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 no-print">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Etiquetas de Ejes</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nombre Eje X</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-indigo-400 outline-none focus:border-indigo-500/50 transition-colors" value={axisNames.x} onChange={e => setAxisNames({...axisNames, x: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Nombre Eje Y</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-emerald-400 outline-none focus:border-emerald-500/50 transition-colors" value={axisNames.y} onChange={e => setAxisNames({...axisNames, y: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 print:border-black print:p-4 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                <h2 className="text-xs font-black text-slate-300 uppercase tracking-[0.2em] print:text-black">Tabla de Puntos</h2>
              </div>
              <button 
                onClick={() => setData([])} 
                className="text-[10px] text-rose-500 font-bold hover:bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 uppercase tracking-wider no-print transition-all"
              >
                Vaciar Tabla
              </button>
            </div>
            
            <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-black bg-slate-950/30">
              <table className="w-full text-xs border-collapse">
                <thead className="bg-slate-900/80 text-slate-500 font-black print:bg-slate-100 print:text-black print:border-b-2 print:border-black">
                  <tr>
                    <th className="p-3 text-center w-12 border-r border-slate-800 print:border-black">ID</th>
                    <th className="p-3 text-center border-r border-slate-800 print:border-black">{axisNames.x}</th>
                    <th className="p-3 text-center">{axisNames.y}</th>
                    <th className="w-12 no-print"></th>
                  </tr>
                </thead>
                <tbody className="print:text-black">
                  {data.map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/20 transition-colors print:border-black">
                      <td className="p-3 text-center font-black text-indigo-500/70 border-r border-slate-800 print:text-black print:border-black">
                        {getPointLabel(i)}
                      </td>
                      <td className="p-2 border-r border-slate-800 print:border-black text-center">
                        <TableCellInput 
                          value={p.x} 
                          onChange={(val) => updatePoint(i, 'x', val)} 
                          colorClass="text-indigo-400"
                        />
                        <span className="hidden print:block font-bold">{p.x}</span>
                      </td>
                      <td className="p-2 text-center">
                        <TableCellInput 
                          value={p.y} 
                          onChange={(val) => updatePoint(i, 'y', val)} 
                          colorClass="text-emerald-400"
                        />
                        <span className="hidden print:block font-bold">{p.y}</span>
                      </td>
                      <td className="p-2 no-print text-center">
                        <button 
                          onClick={() => setData(data.filter((_, idx) => idx !== i))} 
                          className="p-2 text-slate-600 hover:text-rose-500 hover:bg-rose-500/5 rounded-xl transition-all"
                        >
                          <Trash2 size={16}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-slate-600 text-[10px] text-center uppercase font-black tracking-[0.3em]">
                        No hay coordenadas registradas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <button 
              onClick={() => setData([...data, {x: (data[data.length-1]?.x || 0) + 1, y: 0}])} 
              className="w-full mt-6 py-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 font-black text-[11px] uppercase tracking-widest no-print hover:bg-indigo-600 hover:text-white transition-all shadow-lg active:scale-[0.98]"
            >
              <Plus size={14} className="inline mr-2" /> Añadir Nueva Coordenada
            </button>
          </section>
        </div>

        <div className="lg:col-span-7 space-y-6 print:w-full">
          <section className="bg-indigo-600 border border-indigo-400/30 rounded-[2.5rem] p-8 print:bg-white print:border-2 print:border-black shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.4em] print:text-black">Ecuación de Tendencia</p>
            <h3 className="text-3xl md:text-5xl font-mono font-black text-white tracking-tighter print:text-black mt-2 relative z-10">
              {bestModel ? bestModel.formula : '---'}
            </h3>
            <div className="flex gap-4 mt-6 relative z-10">
              <span className="px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-xl text-[10px] font-black text-white uppercase print:text-black print:border-black print:border">
                {bestModel?.type || 'No identificado'}
              </span>
              <span className="text-indigo-100/60 text-[10px] font-bold flex items-center print:text-black">
                Coeficiente R²: {bestModel?.rSquared.toFixed(4) || '0.0000'}
              </span>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl flex flex-col print:bg-white print:border-2 print:border-black print:rounded-none">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-8 print:text-black">Visualización en el Plano</h2>
            <div className="chart-wrapper" style={{ height: '520px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 45, left: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <ReferenceLine x={0} stroke="#f8fafc" strokeWidth={2} className="print:stroke-black" />
                  <ReferenceLine y={0} stroke="#f8fafc" strokeWidth={2} className="print:stroke-black" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                    domain={chartDomain.x} 
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                  >
                    <Label 
                      value={axisNames.x} 
                      position="insideBottom" 
                      offset={-25} 
                      fill="#818cf8" 
                      fontSize={11} 
                      fontWeight="900" 
                      className="print:fill-black uppercase tracking-widest"
                    />
                  </XAxis>
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                    domain={chartDomain.y} 
                    axisLine={{ stroke: '#475569', strokeWidth: 1 }}
                  >
                    <Label 
                      value={axisNames.y} 
                      angle={-90} 
                      position="insideLeft" 
                      offset={-15} 
                      fill="#10b981" 
                      fontSize={11} 
                      fontWeight="900" 
                      className="print:fill-black uppercase tracking-widest"
                    />
                  </YAxis>
                  <Tooltip 
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '16px', color: '#fff', padding: '12px' }}
                    itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                  />
                  {bestModel && (
                    <Line 
                      data={regressionLineData} 
                      type="monotone" 
                      dataKey="yModel" 
                      stroke="#f43f5e" 
                      strokeWidth={3} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  )}
                  <Scatter name="Puntos" data={data}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" stroke="#fff" strokeWidth={2} r={7} />
                    ))}
                    <LabelList dataKey="y" content={(props: any) => {
                        const { x, y, index } = props;
                        if (index === undefined || !data[index]) return null;
                        return (
                          <text x={x + 12} y={y - 12} fill="#6366f1" fontSize={11} fontWeight="900" className="print:fill-black">
                            {getPointLabel(index)}
                          </text>
                        );
                    }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] p-8 print:bg-white print:border-2 print:border-black shadow-inner">
            <div className="flex items-start gap-5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                <Info className="text-indigo-400 print:text-black" size={28}/>
              </div>
              <div className="space-y-2">
                <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] print:text-black">Interpretación de Datos</h4>
                <div className="text-slate-300 text-sm leading-relaxed font-medium print:text-black">
                  {interpretation}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pb-12 flex flex-col items-center gap-6 no-print border-t border-slate-900 pt-12">
        <div className="flex gap-8">
           <div className="flex flex-col items-center">
             <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Versión Pro 1.2</p>
           </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Desarrollado por</p>
          <div className="flex items-center gap-3">
            <p className="text-xs text-slate-400 font-black">Gustavo Eduardo Rios Quevedo</p>
            <div className="h-4 w-[1px] bg-slate-800"></div>
            <a href="https://github.com/gustav0-ri0s" target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:text-indigo-400 transition-colors">
              <Github size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
