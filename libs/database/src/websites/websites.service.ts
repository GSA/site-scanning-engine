import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { Repository } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';
import {
  IPaginationOptions,
  paginate,
  Pagination,
} from 'nestjs-typeorm-paginate';
import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website) private website: Repository<Website>,
  ) {}

  async findWebsiteResults(): Promise<Website[]> {
    const websites = this.website
      .createQueryBuilder('website')
      .leftJoinAndSelect('website.coreResult', 'coreResult')
      .leftJoinAndSelect('website.solutionsResult', 'solutionsResult')
      .getMany();

    return websites;
  }

  async findAllWebsites(): Promise<Website[]> {
    const result = await this.website.find();
    return result;
  }

  async paginatedFilter(
    dto: FilterWebsiteDto,
    options: IPaginationOptions,
  ): Promise<Pagination<Website>> {
    const query = this.website
      .createQueryBuilder('website')
      .leftJoinAndSelect('website.coreResult', 'coreResult')
      .leftJoinAndSelect('website.solutionsResult', 'solutionsResult');

    if (dto.target_url_domain) {
      query.andWhere('coreResult.targetUrlBaseDomain = :baseDomain', {
        baseDomain: dto.target_url_domain,
      });
    }

    if (dto.final_url_domain) {
      query.andWhere('coreResult.finalUrlBaseDomain = :baseDomain', {
        baseDomain: dto.final_url_domain,
      });
    }

    if (dto.target_url_agency_owner) {
      query.andWhere('agency = :agency', {
        agency: dto.target_url_agency_owner,
      });
    }

    if (dto.target_url_bureau_owner) {
      query.andWhere('bureau = :bureau', {
        bureau: dto.target_url_bureau_owner,
      });
    }

    if (dto.scan_status) {
      query.andWhere('coreResult.status = :status', {
        status: dto.scan_status,
      });
    }

    if (typeof dto.final_url_live != 'undefined') {
      query.andWhere('coreResult.finalUrlIsLive = :finalUrlLive', {
        finalUrlLive: dto.final_url_live,
      });
    }

    if (typeof dto.target_url_redirects != 'undefined') {
      query.andWhere('coreResult.targetUrlRedirects = :targetUrlRedirects', {
        targetUrlRedirects: dto.target_url_redirects,
      });
    }

    if (typeof dto.dap_detected_final_url != 'undefined') {
      query.andWhere('solutionsResult.dapDetected = :dapDetected', {
        dapDetected: dto.dap_detected_final_url,
      });
    }

    query.orderBy('website.url');

    return await paginate(query, options);
  }

  async findOne(id: number): Promise<Website> {
    const website = await this.website.findOne(id);
    return website;
  }

  async findByUrl(url: string): Promise<Website> {
    url = url.toLowerCase();
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
    website.url = createWebsiteDto.website;
    website.agency = createWebsiteDto.agency;
    website.bureau = createWebsiteDto.bureau;
    website.branch = createWebsiteDto.branch;
    website.agencyCode = createWebsiteDto.agencyCode;
    website.bureauCode = createWebsiteDto.bureauCode;

    const exists = await this.website.findOne({
      where: {
        url: website.url,
      },
    });
    if (exists) {
      await this.website.update(exists.id, website);
    } else {
      await this.website.insert(website);
    }
  }
}
