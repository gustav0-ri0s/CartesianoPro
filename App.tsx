
import React, { useState, useMemo } from 'react';
import { 
  Plus, Trash2, 
  Layers, Type, LineChart as LineChartIcon,
  Calculator, Info, BookOpen, Printer, Github
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
    
    return {
      x: [-xAbsMax, xAbsMax],
      y: [-yAbsMax, yAbsMax]
    };
  }, [data]);

  const regressionLineData = useMemo(() => {
    if (!bestModel || !bestModel.isApplicable) return [];
    const [minX, maxX] = chartDomain.x;
    const points = [];
    const steps = 100;
    for (let i = 0; i <= steps; i++) {
      const x = minX + (i / steps) * (maxX - minX);
      // Evitar errores en logaritmos
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

  const getPointLabel = (index: number) => String.fromCharCode(65 + (index % 26));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 md:p-8 font-sans">
      
      <div className="hidden print:block mb-8 border-b-2 border-indigo-600 pb-4">
        <h1 className="text-3xl font-black text-slate-900 uppercase">Informe de Análisis Matemático</h1>
        <p className="text-sm font-bold text-indigo-600">Cartesiano Pro Lab • {new Date().toLocaleDateString()}</p>
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
             className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-500/20"
           >
             NUEVO PUNTO
           </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        <div className="lg:col-span-4 space-y-6 no-print">
          <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm">
            <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <Type size={14} className="text-indigo-400" /> Etiquetas de Variables
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">Eje X</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:border-indigo-500 outline-none transition" value={axisNames.x} onChange={e => setAxisNames({...axisNames, x: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-600 uppercase ml-1">Eje Y</label>
                <input type="text" className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm focus:border-emerald-500 outline-none transition" value={axisNames.y} onChange={e => setAxisNames({...axisNames, y: e.target.value})} />
              </div>
            </div>
          </section>

          <section className="bg-slate-900/50 border border-slate-800 rounded-[2rem] p-6 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Layers size={14} className="text-emerald-400" /> Tabla de Puntos
              </h2>
              <button onClick={() => setData([])} className="text-[10px] text-rose-500 font-bold hover:text-rose-400 uppercase tracking-tighter">Vaciar</button>
            </div>
            <div className="max-h-[350px] overflow-y-auto mb-4 border border-slate-800 rounded-2xl bg-slate-950/50">
              <table className="w-full text-xs text-center">
                <thead className="sticky top-0 bg-slate-900 text-slate-500 uppercase font-black">
                  <tr className="border-b border-slate-800">
                    <th className="p-3 w-12">ID</th>
                    <th className="p-3">X</th>
                    <th className="p-3">Y</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p, i) => (
                    <tr key={i} className="border-b border-slate-800/40 hover:bg-slate-800/30">
                      <td className="p-3 font-black text-indigo-500">{getPointLabel(i)}</td>
                      <td className="p-1"><input type="number" step="any" value={p.x} onChange={e => updatePoint(i, 'x', e.target.value)} className="w-full bg-transparent text-center py-2 text-indigo-300 font-mono outline-none" /></td>
                      <td className="p-1"><input type="number" step="any" value={p.y} onChange={e => updatePoint(i, 'y', e.target.value)} className="w-full bg-transparent text-center py-2 text-emerald-300 font-mono outline-none" /></td>
                      <td className="p-1 pr-3">
                        <button onClick={() => setData(data.filter((_, idx) => idx !== i))} className="text-slate-700 hover:text-rose-500 transition-colors">
                          <Trash2 size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button 
              onClick={() => setData([...data, {x: (data[data.length-1]?.x || 0) + 1, y: 0}])} 
              className="w-full py-4 bg-indigo-600/10 text-indigo-400 rounded-2xl border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all font-black text-xs flex items-center justify-center gap-2"
            >
              <Plus size={18} /> AÑADIR PUNTO
            </button>
          </section>
        </div>

        <div className="lg:col-span-8 space-y-6 print:w-full">
          <section className="bg-gradient-to-br from-indigo-600 to-indigo-900 border border-indigo-400/30 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.4em]">Función Matemática Identificada</p>
                <h3 className="text-3xl md:text-5xl font-mono font-black text-white tracking-tighter">
                  {bestModel ? bestModel.formula : 'Esperando datos'}
                </h3>
                <div className="flex gap-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black text-white uppercase tracking-widest border border-white/20">
                    {bestModel?.type || 'No identificado'}
                  </span>
                  <span className="text-indigo-100/60 text-[10px] font-bold uppercase tracking-widest">Confianza R²: {bestModel?.rSquared.toFixed(4) || '0.0000'}</span>
                </div>
              </div>
              <div className="p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 text-center min-w-[120px]">
                <p className="text-[10px] font-black text-indigo-200 uppercase mb-1">Puntos</p>
                <p className="text-3xl font-black text-white">{data.length}</p>
              </div>
            </div>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 h-[500px] shadow-2xl relative flex flex-col">
            <div className="mb-4">
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Plano de Coordenadas</h2>
            </div>
            <div className="flex-1 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="1 6" stroke="#1e293b" />
                  <ReferenceLine x={0} stroke="#f8fafc" strokeWidth={2} />
                  <ReferenceLine y={0} stroke="#f8fafc" strokeWidth={2} />
                  <XAxis type="number" dataKey="x" stroke="#475569" tick={{fill: '#94a3b8', fontSize: 10}} domain={chartDomain.x} axisLine={false} />
                  <YAxis type="number" dataKey="y" stroke="#475569" tick={{fill: '#94a3b8', fontSize: 10}} domain={chartDomain.y} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }} />
                  {bestModel && <Line data={regressionLineData} type="monotone" dataKey="yModel" stroke="#f43f5e" strokeWidth={4} dot={false} isAnimationActive={false} />}
                  <Scatter name="Datos" data={data}>
                    {data.map((_, index) => (
                      <Cell key={`cell-${index}`} fill="#10b981" stroke="#f8fafc" strokeWidth={2} r={6} />
                    ))}
                    <LabelList dataKey="y" content={(props: any) => {
                        const { x, y, index } = props;
                        if (index === undefined || !data[index]) return null;
                        return <text x={x + 10} y={y - 10} fill="#6366f1" fontSize={10} fontWeight="900" className="print:fill-slate-900">{getPointLabel(index)}</text>;
                    }} />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] p-8">
            <div className="flex items-start gap-4">
              <Info className="text-indigo-400 shrink-0" size={24}/>
              <div className="space-y-1">
                <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">Análisis Técnico</h4>
                <div className="text-slate-300 text-sm leading-relaxed font-medium">
                  {interpretation}
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="max-w-6xl mx-auto mt-12 pb-12 flex flex-col items-center gap-4 no-print border-t border-slate-900 pt-12">
        <p className="text-[10px] font-black text-slate-700 uppercase tracking-[0.6em]">Graficador de funciones V 1.0</p>
        <div className="flex items-center gap-3">
          <p className="text-[9px] text-slate-800 font-bold">Creado por Gustavo Eduardo Rios Quevedo</p>
          <a href="https://github.com/gustav0-ri0s" target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-indigo-400">
            <Github size={14} />
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;
