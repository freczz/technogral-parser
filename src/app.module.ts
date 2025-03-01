import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ParseController } from './parse/parse.controller';
import { ParseService } from './parse/parse.service';

@Module({
  imports: [],
  controllers: [AppController, ParseController],
  providers: [AppService, ParseService],
})
export class AppModule {}
