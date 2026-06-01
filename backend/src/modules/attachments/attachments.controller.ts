import { Controller, Post, Get, Delete, Param, Query, UseGuards, Request, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';

@Controller('api/attachments')
@UseGuards(AuthGuard('jwt'))
export class AttachmentsController {
  constructor(private attachmentsService: AttachmentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('category') category: string,
    @Query('accidentId') accidentId?: string,
    @Query('repairId') repairId?: string,
    @Query('claimId') claimId?: string,
    @Request() req?,
  ) {
    return this.attachmentsService.upload(
      file,
      req.user.id,
      category,
      accidentId,
      repairId,
      claimId,
    );
  }

  @Get('accident/:accidentId')
  async findByAccident(@Param('accidentId') accidentId: string) {
    return this.attachmentsService.findByAccident(accidentId);
  }

  @Get('repair/:repairId')
  async findByRepair(@Param('repairId') repairId: string) {
    return this.attachmentsService.findByRepair(repairId);
  }

  @Get('claim/:claimId')
  async findByClaim(@Param('claimId') claimId: string) {
    return this.attachmentsService.findByClaim(claimId);
  }

  @Get(':id/download')
  async download(@Param('id') id: string, @Res() res: Response) {
    const attachment = await this.attachmentsService.findOne(id);
    const filePath = this.attachmentsService.getFilePath(attachment);
    res.download(filePath, attachment.fileName);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.attachmentsService.delete(id);
    return { success: true };
  }
}
