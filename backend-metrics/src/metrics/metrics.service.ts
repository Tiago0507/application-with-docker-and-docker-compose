import { Injectable } from '@nestjs/common';
import { EventsService } from '../events/events.service';

@Injectable()
export class MetricsService {
  constructor(private readonly eventsService: EventsService) {}

  async getSummary() {
    const counts = await this.eventsService.countByType();
    return {
      projects_created: counts['project_created'] ?? 0,
      projects_updated: counts['project_updated'] ?? 0,
      projects_deleted: counts['project_deleted'] ?? 0,
      tasks_created: counts['task_created'] ?? 0,
      tasks_completed: counts['task_completed'] ?? 0,
      tasks_updated: counts['task_updated'] ?? 0,
      tasks_deleted: counts['task_deleted'] ?? 0,
      total_events: Object.values(counts).reduce((a, b) => a + b, 0),
    };
  }

  async getActivity(limit = 15) {
    return this.eventsService.findRecent(limit);
  }
}
