import { Body, Controller, Get, Param, Post, Put, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new common entry' })
  @ApiResponse({ status: 201, description: 'Common entry created successfully.' })
  @ApiBody({ type: CreateCommonDto })
  create(@Body() dto: CreateCommonDto) {
    return this.commonService.createCommon(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all common entries' })
  @ApiResponse({ status: 200, description: 'List of all common entries.' })
  getAll() {
    return this.commonService.getAllCommons();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get common entry by ID' })
  @ApiResponse({ status: 200, description: 'Common entry fetched successfully.' })
  getById(@Param('id') id: string) {
    return this.commonService.getCommonById(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update common entry by ID' })
  @ApiBody({ type: UpdateCommonDto })
  update(@Param('id') id: string, @Body() dto: UpdateCommonDto) {
    return this.commonService.updateCommon(+id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete common entry by ID' })
  delete(@Param('id') id: string) {
    return this.commonService.deleteCommon(+id);
  }
}
