import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCommonDto } from './dto/create-common.dto';
import { UpdateCommonDto } from './dto/update-common.dto';

@Injectable()
export class CommonService {
  private commons: any[] = []; // in-memory store
  private idCounter = 1;

  // 🔹 Create new entry
  async createCommon(dto: CreateCommonDto) {
    const newEntry = { id: this.idCounter++, ...dto };
    this.commons.push(newEntry);
    return newEntry;
  }

  // 🔹 Get all entries
  async getAllCommons() {
    return this.commons;
  }

  // 🔹 Get entry by ID
  async getCommonById(id: number) {
    const entry = this.commons.find((c) => c.id === id);
    if (!entry) throw new NotFoundException(`Common entry with ID ${id} not found`);
    return entry;
  }

  // 🔹 Update entry by ID
  async updateCommon(id: number, dto: UpdateCommonDto) {
    const index = this.commons.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Common entry with ID ${id} not found`);
    this.commons[index] = { ...this.commons[index], ...dto };
    return this.commons[index];
  }

  // 🔹 Delete entry by ID
  async deleteCommon(id: number) {
    const index = this.commons.findIndex((c) => c.id === id);
    if (index === -1) throw new NotFoundException(`Common entry with ID ${id} not found`);
    const deleted = this.commons.splice(index, 1);
    return deleted[0];
  }
}
