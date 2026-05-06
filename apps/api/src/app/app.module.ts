import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { FeeCatalogItemEntity } from './fee-catalog/fee-catalog-item.entity';
import { FeeCatalogModule } from './fee-catalog/fee-catalog.module';
import { PatientFeeLineEntity } from './patient-fees/patient-fee-line.entity';
import { PatientFeesModule } from './patient-fees/patient-fees.module';
import { PatientEntity } from './patients/patient.entity';
import { PatientsModule } from './patients/patients.module';
import { UserEntity } from './users/user.entity';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', 'postgres'),
        database: config.get<string>('DB_NAME', 'hospital'),
        entities: [
          UserEntity,
          PatientEntity,
          FeeCatalogItemEntity,
          PatientFeeLineEntity,
        ],
        synchronize: config.get<string>('TYPEORM_SYNC', 'true') === 'true',
      }),
    }),
    UsersModule,
    AuthModule,
    PatientsModule,
    FeeCatalogModule,
    PatientFeesModule,
    DashboardModule,
  ],
})
export class AppModule {}
