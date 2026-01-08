import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationRepository } from '../../repository/notification.repository';
import { NotificationDto } from './dto/notification.dto';
import { Notification } from '../../models/notification.model';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepository,
  ) {}

     //1️⃣ CREATE (POST)
    async createNotification(payload: NotificationDto): Promise<Notification> {
    return this.notificationRepo.create({
        title: payload.title,
        message: payload.message,
        type: payload.type,
        target: payload.target,
        action: payload.action ?? false,
        date: new Date(),
    });
    }

     //2️⃣ GET ALL
  async getAllNotifications(): Promise<Notification[]> {
    return this.notificationRepo.findAll();
  }

    // 3️⃣ GET BY ID
  async getNotificationById(id: number): Promise<Notification> {
    const notification = await this.notificationRepo.findById(id);
    if (!notification) {throw new NotFoundException('Notification not found');}
    return notification;
  }

     //4️⃣ UPDATE (PUT)
    async updateNotification(id: number,payload: NotificationDto,): Promise<Notification> {
    const updated = await this.notificationRepo.update(id, {
        ...payload, 
        action:payload.action ?? undefined});
    if (!updated) {throw new NotFoundException('Notification not found');}
    return updated;
    }
}
