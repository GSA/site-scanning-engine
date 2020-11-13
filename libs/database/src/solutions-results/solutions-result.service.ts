import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { SolutionsResult } from 'entities/solutions-result.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SolutionsResultService {
  constructor(
    @InjectRepository(SolutionsResult)
    private solutionsResult: Repository<SolutionsResult>,
  ) {}

  async findAll(): Promise<SolutionsResult[]> {
    const results = await this.solutionsResult.find();
    return results;
  }

  async findOne(id: number): Promise<SolutionsResult> {
    const result = await this.solutionsResult.findOne(id);
    return result;
  }

  async create(solutionsResult: SolutionsResult) {
    const exists = await this.solutionsResult.findOne({
      where: {
        website: {
          id: solutionsResult.website.id,
        },
      },
    });

    if (exists) {
      // then update
      await this.solutionsResult.save({
        ...exists,
        ...solutionsResult,
      });
    } else {
      await this.solutionsResult.save(solutionsResult);
    }
  }
}
