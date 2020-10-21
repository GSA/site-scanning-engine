import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CoreResult } from './core-result.entity';
import { CreateCoreResultDto } from './dto/create-core-result.dto';

@Injectable()
export class CoreResultService {
  constructor(
    @InjectRepository(CoreResult) private coreResult: Repository<CoreResult>,
  ) {}

  async findAll(): Promise<CoreResult[]> {
    const results = await this.coreResult.find();
    return results;
  }

  async findOne(id: number): Promise<CoreResult> {
    const result = await this.coreResult.findOne(id);
    return result;
  }

  async findResultsWithWebsite() {
    const result = await this.coreResult.find({
      relations: ['websiteId'],
    });

    return result;
  }

  async create(createCoreResultDto: CreateCoreResultDto) {
    const coreResult = new CoreResult();
    coreResult.websiteId = createCoreResultDto.websiteId;
    coreResult.finalUrl = createCoreResultDto.finalUrl;
    await this.coreResult.save(coreResult);
  }
}
