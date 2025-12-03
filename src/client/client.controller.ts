import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Req } from '@nestjs/common';
import { ClientService } from './client.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Clients')
@Controller('clients')
export class ClientController {
  constructor(private readonly clientService: ClientService) { }

  // ✅ Get all consultants
  @Get('consultants')
  @ApiOperation({ summary: '+ all consultants' })
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
  /* @Get()
  @ApiOperation({ summary: 'Get all clients' })
  findAll() {
    return this.clientService.findAll();
  } */

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  findMe(@Req() req) {
    console.log("User Info:", req.user);
    return this.clientService.findOne(req.user.id);
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


  @Get('projects')
  @UseGuards(AuthGuard('jwt'))
  getAllProjects(@Req() req) {
    return this.clientService.getAllProjectByClientId(req.user.id);
  }
  
  
  @Get('payments')
  @UseGuards(AuthGuard('jwt'))
  getAllProjectsPayments(@Req() req) {
    return this.clientService.getAllProjectsPaymentsByClientId(req.user.id);
  }
}
