
export enum ModelType {
  LINEAR = 'Lineal',
  QUADRATIC = 'Cuadrático',
  EXPONENTIAL = 'Exponencial',
  LOGARITHMIC = 'Logarítmico',
  POWER = 'Potencial',
  AUTO = 'Selección Automática'
}

export interface DataPoint {
  x: number;
  y: number;
}

export interface ContextInfo {
  title: string;
  description: string;
  xName: string;
  xUnit: string;
  xDesc: string;
  yName: string;
  yUnit: string;
  yDesc: string;
  note: string;
}

export interface RegressionResult {
  type: ModelType;
  formula: string;
  parameters: Record<string, number>;
  rSquared: number;
  rmse: number;
  isApplicable: boolean;
  errorMessage?: string;
  predict: (x: number) => number;
}

export interface AppState {
  context: ContextInfo;
  data: DataPoint[];
  selectedModelType: ModelType;
  decimalPlaces: number;
  useAIExplanation: boolean;
}
