import { Controller, Get, Res } from '@nestjs/common';
import { join } from 'path';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getDashboard(@Res() res: Response) {
    return res.sendFile(join(process.cwd(), 'public', 'index.html'));
  }

  @Get('health')
  getHello(): string {
    return this.appService.getHello();
  }
}
