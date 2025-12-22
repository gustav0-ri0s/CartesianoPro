
import { ContextInfo, DataPoint, ModelType } from './types';

export const INITIAL_CONTEXT: ContextInfo = {
  title: 'Análisis de Variación',
  description: 'Estudio de la relación entre variables.',
  xName: 'X',
  xUnit: 'unidades',
  xDesc: '',
  yName: 'Y',
  yUnit: 'unidades',
  yDesc: '',
  note: ''
};

export const EXAMPLES: Record<string, { context: ContextInfo, data: DataPoint[], type: ModelType }> = {
  lineal: {
    context: {
      title: 'Costo de Taxi',
      description: 'Costo del viaje según los kilómetros recorridos.',
      xName: 'Distancia',
      xUnit: 'km',
      xDesc: 'Kilómetros recorridos',
      yName: 'Costo',
      yUnit: 'soles',
      yDesc: 'Monto total a pagar',
      note: 'Tarifa base + variable'
    },
    data: [
      { x: 0, y: 5 },
      { x: 2, y: 9 },
      { x: 5, y: 15 },
      { x: 8, y: 21 },
      { x: 10, y: 25 }
    ],
    type: ModelType.LINEAR
  },
  cuadratico: {
    context: {
      title: 'Lanzamiento Proyectil',
      description: 'Altura de un objeto lanzado hacia arriba.',
      xName: 'Tiempo',
      xUnit: 's',
      xDesc: 'Segundos transcurridos',
      yName: 'Altura',
      yUnit: 'm',
      yDesc: 'Altura sobre el nivel del suelo',
      note: 'Movimiento parabólico'
    },
    data: [
      { x: 0, y: 0 },
      { x: 1, y: 25 },
      { x: 2, y: 40 },
      { x: 3, y: 45 },
      { x: 4, y: 40 },
      { x: 5, y: 25 }
    ],
    type: ModelType.QUADRATIC
  },
  exponencial: {
    context: {
      title: 'Crecimiento Bacteriano',
      description: 'Número de bacterias en un cultivo controlado.',
      xName: 'Tiempo',
      xUnit: 'h',
      xDesc: 'Horas transcurridas',
      yName: 'Población',
      yUnit: 'bacterias',
      yDesc: 'Total de organismos',
      note: 'Crecimiento ilimitado'
    },
    data: [
      { x: 0, y: 100 },
      { x: 1, y: 150 },
      { x: 2, y: 225 },
      { x: 3, y: 337 },
      { x: 4, y: 506 },
      { x: 5, y: 759 }
    ],
    type: ModelType.EXPONENTIAL
  }
};
