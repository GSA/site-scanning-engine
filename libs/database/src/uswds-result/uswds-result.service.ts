import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UswdsResult } from 'entities/uswds-result.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UswdsResultService {
  constructor(
    @InjectRepository(UswdsResult) private uswdsResult: Repository<UswdsResult>,
  ) {}

  async findAll(): Promise<UswdsResult[]> {
    const results = await this.uswdsResult.find();
    return results;
  }

  async findOne(id: number): Promise<UswdsResult> {
    const result = await this.uswdsResult.findOne(id);
    return result;
  }

  async create(uswdsResult: UswdsResult) {
    const exists = await this.uswdsResult.findOne({
      where: {
        website: {
          id: uswdsResult.website.id,
        },
      },
    });

    if (exists) {
      // then update
      await this.uswdsResult.save({
        ...exists,
        ...uswdsResult,
      });
    } else {
      await this.uswdsResult.save(uswdsResult);
    }
  }
}
