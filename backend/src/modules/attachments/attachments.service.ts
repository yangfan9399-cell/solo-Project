import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../../database/entities';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AttachmentsService {
  private uploadDir = path.join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    uploaderId: string,
    category: string,
    accidentId?: string,
    repairId?: string,
    claimId?: string,
  ): Promise<Attachment> {
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(this.uploadDir, fileName);

    fs.writeFileSync(filePath, file.buffer);

    const attachment = this.attachmentRepository.create({
      uploaderId,
      fileName: file.originalname,
      filePath,
      fileType: file.mimetype,
      fileSize: file.size,
      category: category as any,
      accidentId,
      repairId,
      claimId,
    });

    return this.attachmentRepository.save(attachment);
  }

  async findByAccident(accidentId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { accidentId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByRepair(repairId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { repairId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByClaim(claimId: string): Promise<Attachment[]> {
    return this.attachmentRepository.find({
      where: { claimId },
      relations: ['uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Attachment> {
    const attachment = await this.attachmentRepository.findOne({
      where: { id },
    });
    if (!attachment) {
      throw new NotFoundException('附件不存在');
    }
    return attachment;
  }

  async delete(id: string): Promise<void> {
    const attachment = await this.findOne(id);
    if (fs.existsSync(attachment.filePath)) {
      fs.unlinkSync(attachment.filePath);
    }
    await this.attachmentRepository.delete(id);
  }

  getFilePath(attachment: Attachment): string {
    return attachment.filePath;
  }
}
