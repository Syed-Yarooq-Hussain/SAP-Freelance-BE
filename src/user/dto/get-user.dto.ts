export class GetUsersDto {
  page?: number = 1;
  limit?: number = 10;
  search?: string;
  role?: number;
}
