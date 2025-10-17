import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  findAll() {
    return this.clientService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }

  // ✅ NEW ENDPOINT: Get consultants (users with id = 1 or specific criteria)
  @Get('consultants/:id')
  @ApiOperation({ summary: 'Get consultant by user ID' })
  @ApiResponse({ status: 200, description: 'consultants fetched from User table' })
   async getConsultantById(@Param('id') id: string) {
    return this.clientService.findConsultantById(+id);
  }
}
