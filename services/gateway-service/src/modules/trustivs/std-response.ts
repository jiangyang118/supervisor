export type StdResponse<T = any> = {
  code: '1' | '0' | string;
  message: string;
  data?: T;
};

