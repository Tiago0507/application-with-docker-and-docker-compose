import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEntity } from './event.entity';
import { CreateEventDto } from './create-event.dto';

@Injectable()
export class EventsService {
  constructor(
    @InjectRepository(EventEntity)
    private readonly repo: Repository<EventEntity>,
  ) {}

  async create(dto: CreateEventDto): Promise<EventEntity> {
    const event = this.repo.create({ type: dto.type, payload: dto.payload ?? {} });
    return this.repo.save(event);
  }

  async findRecent(limit = 20): Promise<EventEntity[]> {
    return this.repo.find({
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async countByType(): Promise<Record<string, number>> {
    const rows = await this.repo
      .createQueryBuilder('e')
      .select('e.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('e.type')
      .getRawMany();

    return rows.reduce((acc, r) => ({ ...acc, [r.type]: Number(r.count) }), {});
  }
}
