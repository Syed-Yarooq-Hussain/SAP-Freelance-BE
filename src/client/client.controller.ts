import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

    // ✅ Get all consultants
  @Get('consultants')
  @ApiOperation({ summary: 'Get all consultants' })
  getAllConsultants() {
    console.log('Fetching all consultants');
    return this.clientService.getAllConsultants();
  }
  // ✅ Create new client
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  // ✅ Get all clients
  @Get()
  @ApiOperation({ summary: 'Get all clients' })
  findAll() {
    return this.clientService.findAll();
  }

  // ✅ Get client by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get client by ID' })
  findOne(@Param('id') id: string) {
    return this.clientService.findOne(+id);
  }

  // ✅ Update a client
  @Put(':id')
  @ApiOperation({ summary: 'Update a client' })
  update(@Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientService.update(+id, updateClientDto);
  }

  // ✅ Delete a client
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }



  // ✅ Get consultant by ID
  @Get('consultants/:id')
  @ApiOperation({ summary: 'Get consultant by ID' })
  getConsultantById(@Param('id') id: string) {
    return this.clientService.getConsultantById(+id);
  }
}
