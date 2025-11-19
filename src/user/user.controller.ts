import {Body,Controller,Delete,Get,Param,Post,Put,Query,Req,UseGuards,} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UserService } from './user.service';
import { GetUsersDto } from './dto/get-user.dto';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('User') 
@ApiBearerAuth() 
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}
    @Get('filter')
  async getFilteredUsers(
    @Query('experience') experience?: number,
    @Query('availability') availability?: number,
    @Query('budget') budget?: number,
    @Query('country') country?: string,
  ) {
    return this.userService.getFilteredUsers(experience, availability, budget, country);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get users with filters (Admin/User specific)' })
  @ApiResponse({ status: 200, description: 'List of users returned successfully' })
  async getUsers(@Req() req, @Query() query: GetUsersDto) {
    console.log('Current User:', req.user);
    console.log('Query Params:', req.query);
    return this.userService.getUsers(req.user.id, query);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'All users fetched successfully' })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User details returned successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update user by ID' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  update(@Param('id') id: string, @Body() updateUserDto: Partial<CreateUserDto>) {
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete user by ID' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }
}
