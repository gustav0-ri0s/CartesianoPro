
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, 
  Layers, Type, LineChart as LineChartIcon,
  Info, Printer, Github
} from 'lucide-react';
import { 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ScatterChart, Scatter, 
  Line, ReferenceLine, LabelList, Cell
} from 'recharts';

import { DataPoint, ModelType } from './types';
import * as Regression from './regressionService';

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

  const updatePoint = (index: number, field: 'x' | 'y', val: string) => {
    const num = parseFloat(val);
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: isNaN(num) ? 0 : num };
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
            <h1 className="text-xl font-black tracking-tight uppercase">Cartesiano <span className="text-indigo-400">Pro</span></h1>
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
             className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition"
           >
             <Plus size={14} /> NUEVO PUNTO
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
        
        <div className="lg:col-span-4 space-y-6 print:w-full">
          <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 no-print">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Etiquetas</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Eje X</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-indigo-400 outline-none" value={axisNames.x} onChange={e => setAxisNames({...axisNames, x: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase">Eje Y</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-emerald-400 outline-none" value={axisNames.y} onChange={e => setAxisNames({...axisNames, y: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-6 print:border-black print:p-4">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 print:text-black">Tabla de Datos</h2>
            <div className="border border-slate-800 rounded-xl overflow-hidden print:border-black">
              <table className="w-full text-xs text-center border-collapse">
                <thead className="bg-slate-900 text-slate-500 font-black print:bg-slate-100 print:text-black print:border-b-2 print:border-black">
                  <tr>
                    <th className="p-2 border-r border-slate-800 print:border-black">ID</th>
                    <th className="p-2 border-r border-slate-800 print:border-black">{axisNames.x}</th>
                    <th className="p-2">{axisNames.y}</th>
                    <th className="w-10 no-print"></th>
                  </tr>
                </thead>
                <tbody className="print:text-black">
                  {data.map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/40 print:border-black">
                      <td className="p-2 font-black text-indigo-500 print:text-black">{getPointLabel(i)}</td>
                      <td className="p-1 border-r border-slate-800 print:border-black">
                        <input type="number" step="any" value={p.x} onChange={e => updatePoint(i, 'x', e.target.value)} className="w-full bg-transparent text-center py-2 text-indigo-300 no-print" />
                        <span className="hidden print:block">{p.x}</span>
                      </td>
                      <td className="p-1">
                        <input type="number" step="any" value={p.y} onChange={e => updatePoint(i, 'y', e.target.value)} className="w-full bg-transparent text-center py-2 text-emerald-300 no-print" />
                        <span className="hidden print:block">{p.y}</span>
                      </td>
                      <td className="p-1 no-print">
                        <button onClick={() => setData(data.filter((_, idx) => idx !== i))} className="text-slate-700"><Trash2 size={14}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => setData([...data, {x: (data[data.length-1]?.x || 0) + 1, y: 0}])} 
              className="w-full mt-4 py-3 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20 font-black text-xs no-print"
            >
              AÑADIR PUNTO
            </button>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6 print:w-full">
          <section className="bg-indigo-600 border border-indigo-400/30 rounded-[2.5rem] p-8 print:bg-white print:border-2 print:border-black">
            <p className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.4em] print:text-black">Ecuación de la Función</p>
            <h3 className="text-3xl md:text-5xl font-mono font-black text-white tracking-tighter print:text-black mt-2">
              {bestModel ? bestModel.formula : '---'}
            </h3>
            <div className="flex gap-4 mt-4">
              <span className="px-3 py-1 bg-white/20 rounded-lg text-[10px] font-black text-white uppercase print:text-black print:border-black print:border">
                {bestModel?.type || 'No identificado'}
              </span>
              <span className="text-indigo-100/60 text-[10px] font-bold print:text-black">
                R²: {bestModel?.rSquared.toFixed(4) || '0.0000'}
              </span>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2rem] p-8 shadow-2xl flex flex-col print:bg-white print:border-2 print:border-black print:rounded-none">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 print:text-black">Representación Gráfica del Plano</h2>
            <div className="chart-wrapper" style={{ height: '500px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <ReferenceLine x={0} stroke="#f8fafc" strokeWidth={2} className="print:stroke-black" />
                  <ReferenceLine y={0} stroke="#f8fafc" strokeWidth={2} className="print:stroke-black" />
                  <XAxis 
                    type="number" 
                    dataKey="x" 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                    domain={chartDomain.x} 
                    axisLine={{ stroke: '#000', strokeWidth: 1 }}
                  />
                  <YAxis 
                    type="number" 
                    dataKey="y" 
                    stroke="#475569" 
                    tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                    domain={chartDomain.y} 
                    axisLine={{ stroke: '#000', strokeWidth: 1 }}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', color: '#fff' }}
                  />
                  {bestModel && (
                    <Line 
                      data={regressionLineData} 
                      type="monotone" 
                      dataKey="yModel" 
                      stroke="#f43f5e" 
                      strokeWidth={4} 
                      dot={false} 
                      isAnimationActive={false} 
                    />
                  )}
                  <Scatter name="Datos" data={data}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" stroke="#000" strokeWidth={1} r={6} />
                    ))}
                    <LabelList dataKey="y" content={(props: any) => {
                        const { x, y, index } = props;
                        if (index === undefined || !data[index]) return null;
                        return (
                          <text x={x + 10} y={y - 10} fill="#6366f1" fontSize={12} fontWeight="900" className="print:fill-black">
                            {getPointLabel(index)}
                          </text>
                        );
                    }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2rem] p-8 print:bg-white print:border-2 print:border-black">
            <div className="flex items-start gap-4">
              <Info className="text-indigo-400 shrink-0 print:text-black" size={24}/>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] print:text-black">Conclusiones del Análisis</h4>
                <div className="text-slate-300 text-sm leading-relaxed font-medium print:text-black">
                  {interpretation}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pb-12 flex flex-col items-center gap-4 no-print border-t border-slate-900 pt-12">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Cartesiano Pro V1.1</p>
        <div className="flex items-center gap-3">
          <p className="text-[9px] text-slate-800 font-bold">Gustavo Eduardo Rios Quevedo</p>
          <a href="https://github.com/gustav0-ri0s" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-indigo-400"><Github size={16} /></a>
        </div>
      </footer>
    </div>
  );
};

export default App;
