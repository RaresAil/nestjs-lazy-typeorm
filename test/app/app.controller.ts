import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get(':id')
  get(@Param('id', new ParseIntPipe()) id: number): Promise<unknown> {
    return this.appService.get(id);
  }
}
