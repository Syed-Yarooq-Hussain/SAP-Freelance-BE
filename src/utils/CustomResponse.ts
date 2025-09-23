import { Response } from 'express';
import { API_STATUS } from 'src/constants/response';
import { IAPIResponse } from 'src/types/response';

export class CustomResponse<T = unknown> {
  code: number;
  status: API_STATUS;
  data: T | null;
  message: string;

  constructor(response: IAPIResponse<T>) {
    this.code = response.code;
    this.status = response.status;
    this.data = response.data;
    this.message = response.message;
  }

  static success<T>(
    res: Response,
    response: Partial<IAPIResponse<T>>,
  ): Response {
    const code = response.code || 200;
    const status = API_STATUS.SUCCESS;
    const data = response.data || null;
    const message = response.message || 'Success';

    const successObj: IAPIResponse<T> = {
      code,
      status,
      data,
      message,
    };

    return res.status(code).json(successObj);
  }

  static error<T>(res: Response, response: Partial<IAPIResponse<T>>): Response {
    const code = response.code || 500;
    const status = API_STATUS.ERROR;
    const data = response.data ?? null;
    const message = response.message || 'Something went wrong';

    const errorObj: IAPIResponse<T> = {
      code,
      status,
      data,
      message,
    };

    return res.status(code).json(errorObj);
  }
}
