import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEntity } from './events/event.entity';
import { EventsModule } from './events/events.module';
import { MetricsModule } from './metrics/metrics.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get<string>('METRICS_DATABASE_URL'),
        entities: [EventEntity],
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),
    EventsModule,
    MetricsModule,
    HealthModule,
  ],
})
export class AppModule {}
