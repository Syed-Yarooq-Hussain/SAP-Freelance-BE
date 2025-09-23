import { API_STATUS } from 'src/constants/response';

interface IAPIResponse<T = null> {
  code: number;
  status: API_STATUS;
  data: T | null;
  message: string;
}
