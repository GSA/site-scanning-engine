import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { Repository } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';
import { FilterWebsiteDto } from './dto/filter-website.dto';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website) private website: Repository<Website>,
  ) {}

  async findAll(): Promise<Website[]> {
    const websites = await this.website.find();
    return websites;
  }

  async findAllWithResult(dto: FilterWebsiteDto): Promise<Website[]> {
    const query = this.website
      .createQueryBuilder('website')
      .leftJoinAndSelect('website.coreResult', 'coreResult')
      .leftJoinAndSelect('website.solutionsResult', 'solutionsResult');

    if (dto.baseDomain) {
      query.where('coreResult.targetUrlBaseDomain = :baseDomain', {
        baseDomain: dto.baseDomain,
      });
    }

    return await query.getMany();
  }

  async findOne(id: number): Promise<Website> {
    const website = await this.website.findOne(id);
    return website;
  }

  async findByUrl(url: string): Promise<Website> {
    const result = await this.website.findOne({
      relations: ['coreResult', 'solutionsResult'],
      where: {
        url: url,
      },
    });
    return result;
  }

  async create(createWebsiteDto: CreateWebsiteDto) {
    const website = new Website();
    website.url = createWebsiteDto.url;
    website.agency = createWebsiteDto.agency;
    website.organization = createWebsiteDto.organization;
    website.type = createWebsiteDto.type;
    website.city = createWebsiteDto.city;
    website.state = createWebsiteDto.state;
    website.securityContactEmail = createWebsiteDto.securityContactEmail;

    await this.website.save(website);
  }
}
