import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrialSettingsEntity } from './trial-settings.entity';
import { TrialController } from './trial.controller';
import { TrialMiddleware } from './trial.middleware';
import { TrialService } from './trial.service';

@Module({
  imports: [TypeOrmModule.forFeature([TrialSettingsEntity])],
  controllers: [TrialController],
  providers: [TrialService, TrialMiddleware],
  exports: [TrialService],
})
export class TrialModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TrialMiddleware).forRoutes('*');
  }
}
