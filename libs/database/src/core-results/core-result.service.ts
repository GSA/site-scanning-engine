import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Website } from '../websites/website.entity';
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
      relations: ['website'],
    });

    return result;
  }

  async create(createCoreResultDto: CreateCoreResultDto) {
    const result = await this.coreResult.findOne({
      finalUrl: createCoreResultDto.finalUrl,
    });

    if (result) {
      result.finalUrl = createCoreResultDto.finalUrl;
      result.finalUrlIsLive = createCoreResultDto.finalUrlIsLive;
      result.finalUrlBaseDomain = createCoreResultDto.finalUrlBaseDomain;
      result.finalUrlMIMEType = createCoreResultDto.finalUrlMIMEType;
      result.finalUrlSameDomain = createCoreResultDto.finalUrlSameDomain;
      result.finalUrlSameWebsite = createCoreResultDto.finalUrlSameWebsite;
      result.finalUrlStatusCode = createCoreResultDto.finalUrlStatusCode;
      result.targetUrlBaseDomain = createCoreResultDto.targetUrlBaseDomain;
      result.targetUrlRedirects = createCoreResultDto.targetUrlRedirects;
      await this.coreResult.save(result);
    } else {
      const coreResult = new CoreResult();
      const website = new Website();
      website.id = createCoreResultDto.websiteId;
      coreResult.website = website;
      coreResult.finalUrl = createCoreResultDto.finalUrl;
      coreResult.finalUrlIsLive = createCoreResultDto.finalUrlIsLive;
      coreResult.finalUrlBaseDomain = createCoreResultDto.finalUrlBaseDomain;
      coreResult.finalUrlMIMEType = createCoreResultDto.finalUrlMIMEType;
      coreResult.finalUrlSameDomain = createCoreResultDto.finalUrlSameDomain;
      coreResult.finalUrlSameWebsite = createCoreResultDto.finalUrlSameWebsite;
      coreResult.finalUrlStatusCode = createCoreResultDto.finalUrlStatusCode;
      coreResult.targetUrlBaseDomain = createCoreResultDto.targetUrlBaseDomain;
      coreResult.targetUrlRedirects = createCoreResultDto.targetUrlRedirects;
      await this.coreResult.save(coreResult);
    }
  }
}
