import {Controller,Post,Get,Put,Param,Body,ParseIntPipe} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { NotificationDto } from './dto/notification.dto';
import { Notification } from '../../models/notification.model';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(
    private readonly notificationService: NotificationService,
  ) {}

   //1️⃣ CREATE Notification
  @Post()
  @ApiOperation({ summary: 'Create notification' })
  @ApiResponse({ status: 201, type: Notification })
  create(@Body() body: NotificationDto) {
    return this.notificationService.createNotification(body);}

  //2️⃣ GET ALL Notifications
  @Get()
  @ApiOperation({ summary: 'Get all notifications' })
  @ApiResponse({ status: 200, type: [Notification] })
  findAll() {return this.notificationService.getAllNotifications();}
  
  //3️⃣ GET Notification by ID
  @Get(':id')
  @ApiOperation({ summary: 'Get notification by id' })
  @ApiResponse({ status: 200, type: Notification })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.notificationService.getNotificationById(id);}

  //4️⃣ UPDATE Notification
  @Put(':id')
  @ApiOperation({ summary: 'Update notification' })
  @ApiResponse({ status: 200, type: Notification })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: NotificationDto,) {
    return this.notificationService.updateNotification(id, body);}
}
