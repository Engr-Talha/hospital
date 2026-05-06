import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminFeeCatalogController } from './admin-fee-catalog.controller';
import { FeeCatalogItemEntity } from './fee-catalog-item.entity';
import { FeeCatalogController } from './fee-catalog.controller';
import { FeeCatalogService } from './fee-catalog.service';

@Module({
  imports: [TypeOrmModule.forFeature([FeeCatalogItemEntity])],
  controllers: [FeeCatalogController, AdminFeeCatalogController],
  providers: [FeeCatalogService],
  exports: [FeeCatalogService, TypeOrmModule],
})
export class FeeCatalogModule implements OnModuleInit {
  constructor(private readonly feeCatalogService: FeeCatalogService) {}

  async onModuleInit(): Promise<void> {
    await this.feeCatalogService.seedDefaults();
  }
}
