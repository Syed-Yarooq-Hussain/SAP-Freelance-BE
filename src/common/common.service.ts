import { Injectable} from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';

@Injectable()
export class CommonService {
  private industry = [
    {id:1, name:"Information tecnology"},
    {id:2, name:"Healthcare"}
  ]

  // 🔹 Create new entry
  createIndustry(dto: CreateCommonDto) {
    const newIndustry = { id: Date.now(), ...dto };
    this.industry.push(newIndustry);
    return {
      message: "Industry created successfully",
      data: newIndustry
    };
  }

  // 🔹 Get all entries
  getAllIndustry() {
    return{
      message: "Industry created successfully",
      data: this.industry
    };
  }

  // 🔹 Update entry by ID
  updateIndustry(id:number, dto: UpdateCommonDto) {
    const index = this.industry.findIndex((i) => i.id === id);
    if (index === -1){return {massage: "Industry not found"};}
    this.industry[index] = { ...this.industry[index], ...dto };
    return {
      message: 'Industry updated successfully',
      data: this.industry[index],
    };
}

  private countries = [
    { id: 1, name: 'Pakistan' },
    { id: 2, name: 'United States' },
    { id: 3, name: 'United Kingdom' },
    { id: 4, name: 'India' },
    { id: 5, name: 'Germany' },
  ];

  private currencies = [
    { id: 1, code: 'PKR', name: 'Pakistani Rupee' },
    { id: 2, code: 'USD', name: 'US Dollar' },
    { id: 3, code: 'EUR', name: 'Euro' },
    { id: 4, code: 'GBP', name: 'British Pound' },
    { id: 5, code: 'INR', name: 'Indian Rupee' },
  ]; 

 getCountries() {
    return {
      message: 'Countries fetched successfully',
      data: this.countries,
    };
  }

  getCurrencies() {
    return {
      message: 'Currencies fetched successfully',
      data: this.currencies,
    };
  }
}