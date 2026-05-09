import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Document } from '../models/document.model';

@Injectable()
export class DocumentRepository {
  constructor(
    @InjectModel(Document)
    private readonly documentModel: typeof Document,
  ) {}

  // 📄 Create Document
  async create(data: Partial<Document>): Promise<Document> {
    return this.documentModel.create(data);
  }

  // 📋 Get All Documents
  async findAll(): Promise<Document[]> {
    return this.documentModel.findAll();
  }

  // 🔍 Get Specific Document By Id
  async findById(id: number): Promise<Document | null> {
    return this.documentModel.findByPk(id);
  }

  // 🔎 Get Users Documents By Id

  // 🧠 Update Document
  async update(id: number, data: Partial<Document>): Promise<[number, Document[]]> {
    return this.documentModel.update(data, {
      where: { id },
      returning: true,
    });
  }

  // ❌ Delete Document
  async delete(id: number): Promise<number> {
    return this.documentModel.destroy({ where: { id } });
  }
}
