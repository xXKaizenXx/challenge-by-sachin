import { Injectable, OnModuleInit } from '@nestjs/common';
import { StatusService } from './status.service';

@Injectable()
export class StatusSeederService implements OnModuleInit {
  constructor(private readonly statusService: StatusService) {}

  async onModuleInit() {
    await this.seedStatuses();
  }

  private async seedStatuses() {
    const statuses = ['Pending', 'Active', 'Inactive', 'Suspended', 'Closed'];

    for (const statusName of statuses) {
      const existingStatus = await this.statusService.findByName(statusName);
      if (!existingStatus) {
        await this.statusService.create({ name: statusName });
        console.log(`Created status: ${statusName}`);
      }
    }
  }
}
