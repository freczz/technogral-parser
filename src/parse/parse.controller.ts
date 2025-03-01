import { Body, Controller, Get, Post } from '@nestjs/common';
import { ParseService } from './parse.service';

@Controller('parse')
export class ParseController {
  constructor(private readonly parseService: ParseService) {}
  @Get()
  getHello(): string {
    return 'Привет, мир!';
  }

  @Post()
  async parseProduct(@Body('url') url: string): Promise<any> {
    return this.parseService.getLinkData(url);
  }
}
