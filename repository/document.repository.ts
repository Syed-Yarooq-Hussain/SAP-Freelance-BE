import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Document } from '../models/document.model';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,
  ) {}

  // 📄 Naya document create karne ke liye
  async create(data: Partial<Document>): Promise<Document> {
    return this.documentModel.create(data);
  }

  // 📋 Sare documents get karne ke liye
  async findAll(): Promise<Document[]> {
    return this.documentModel.findAll();
  }

  // 🔍 Kisi specific document ko ID se find karne ke liye
  async findById(id: number): Promise<Document | null> {
    return this.documentModel.findByPk(id);
  }

  // 🔎 User ke documents nikalne ke liye (agar user_id foreign key hai)
  async findByUserId(userId: number): Promise<Document[]> {
    return this.documentModel.findAll({ where: { user_id: userId } });
  }

  // 🧠 Document update karne ke liye
  async update(id: number, data: Partial<Document>): Promise<[number, Document[]]> {
    return this.documentModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Document delete karne ke liye
  async delete(id: number): Promise<number> {
    return this.documentModel.destroy({ where: { id } });
  }
}
