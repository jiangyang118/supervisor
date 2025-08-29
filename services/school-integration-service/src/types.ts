export type Device = {
  id: string;
  vendor: 'MEGO';
  equipmentCode: string;
  onlineStatus: 'online' | 'offline' | 'unknown';
  lastHeartbeatAt?: string;
  baseUrl?: string;
};

export type Employee = {
  userId: string;
  name: string;
  post?: string;
  portraitUrl?: string;
  healthNumber?: string;
  healthStartTime?: string;
  healthEndTime?: string;
  healthCertUrl?: string;
  updateTime?: string;
};

export type MorningCheck = {
  id: string;
  equipmentCode: string;
  userId: string;
  checkTime: string; // YYYY-MM-DD HH:mm:ss
  foreheadTemp: number;
  normalTemperatureMin: number;
  normalTemperatureMax: number;
  abnormalTemp: 0 | 1;
  handCheckResult: string[];
  healthAskResult: string[];
  health: 0 | 1;
  images?: { face?: string; palm?: string; backOfHand?: string };
  raw?: any;
};

export type UpstreamEmployee = {
  userId: string;
  name: string;
  post?: string;
  portraitPhoto?: string;
  healthNumber?: string;
  healthStartTime?: string;
  healthEndTime?: string;
  healthUrl?: string;
  updateTime?: string;
};

