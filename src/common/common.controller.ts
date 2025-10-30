import { Body, Controller, Get, Param, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post("industry")
  @ApiOperation({ summary: 'Create a new industry entry' })
  @ApiResponse({ status: 201, description: 'Industry created successfully.' })
  @ApiBody({ type: CreateCommonDto })
  createIndustry(@Body() dto: CreateCommonDto) {
    return this.commonService.createIndustry(dto);
  }

  @Get("industry")
  @ApiOperation({ summary: 'Get all industry' })
  @ApiResponse({ status: 200, description: 'List of all industry fetched successfully' })
  getAllIndustry() {
    return this.commonService.getAllIndustry();
  }

  @Put('industry/:id')
  @ApiOperation({ summary: 'Update an existing industry' })
  @ApiBody({ type: UpdateCommonDto })
  @ApiResponse({ status: 200, description: 'Industry updated successfully.' })
  updateIndustry(@Param('id') id: string,@Body() dto: UpdateCommonDto) {
    return this.commonService.updateIndustry(+id,dto);
  }

  @Get('country')
  @ApiOperation({ summary: 'Fetch all Countries' })
  @ApiResponse({ status: 200, description: 'List of countries fetched successfully.' })
  getCountries() {
    return this.commonService.getCountries();
  }

  @Get('currency')
  @ApiOperation({ summary: 'Fetch all Currencies' })
  @ApiResponse({ status: 200, description: 'List of currencies fetched successfully.' })
  getCurrencies() {
    return this.commonService.getCurrencies();
  }
}