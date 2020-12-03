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
      query.andWhere('organization = :organization', {
        organization: dto.target_url_bureau_owner,
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
