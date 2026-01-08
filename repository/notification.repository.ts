import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from '../models/notification.model';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectModel(Notification)
    private readonly notificationModel: typeof Notification,
  ) {}

  // 1️⃣ CREATE Notification
  async create(payload: Partial<Notification>): Promise<Notification> {
    return this.notificationModel.create(payload);
  }

  // 2️⃣ GET ALL Notifications
  async findAll(): Promise<Notification[]> {
    return this.notificationModel.findAll({
      order: [['created_at', 'DESC']],
    });
  }

  // 3️⃣ GET Notification by ID
  async findById(id: number): Promise<Notification | null> {
    return this.notificationModel.findByPk(id);
  }

  // 4️⃣ UPDATE Notification
  async update(
    id: number,
    payload: Partial<Notification>,
  ): Promise<Notification | null> {
    const notification = await this.notificationModel.findByPk(id);
    if (!notification) return null;

    return notification.update(payload);
  }
}
