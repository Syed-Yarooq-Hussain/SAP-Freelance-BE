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

  // ✅ Get All Consultants
  @Get('consultants')
  @ApiOperation({ summary: '+ all consultants' })
  getAllConsultants() {
    console.log('Fetching all consultants');
    return this.clientService.getAllConsultants();
  }
  // ✅ Create Client
  @Post()
  @ApiOperation({ summary: 'Create a new client' })
  @ApiResponse({ status: 201, description: 'Client created successfully' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientService.create(createClientDto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getClient(@Req() req, @Body() body: any) {
    return this.clientService.getClient(req.user.id);
  }

  // ✅ Update Client
  @UseGuards(AuthGuard('jwt'))
  @Put()
  @ApiOperation({ summary: 'Update a client' })
  update(@Body() updateClientDto: UpdateClientDto, @Req() req) {
    return this.clientService.update(+req.user.id, updateClientDto);
  }

  // ✅ Delete Client
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  remove(@Param('id') id: string) {
    return this.clientService.remove(+id);
  }

 // ✅ Get Projects
  @Get('projects')
  @UseGuards(AuthGuard('jwt'))
  getAllProjects(@Req() req) {
    return this.clientService.getAllProjectByClientId(req.user.id);
  }
  
  // ✅ Get Payments
  @Get('payments')
  @UseGuards(AuthGuard('jwt'))
  getAllProjectsPayments(@Req() req) {
    return this.clientService.getAllProjectsPaymentsByClientId(req.user.id);
  }
  
  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  getAllStats(@Req() req) {
    return this.clientService.getAllClientStats(req.user.id);
  }
}
