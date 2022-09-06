import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from 'entities/website.entity';
import { Repository } from 'typeorm';
import { FilterWebsiteDto } from 'apps/api/src/website/filter-website.dto';
import { AnalysisDto } from './analysis.dto';

@Injectable()
export class AnalysisService {
  constructor(
    @InjectRepository(Website) private website: Repository<Website>,
  ) {}

  async getWebsiteAnalysis(dto: FilterWebsiteDto): Promise<AnalysisDto> {
    const query = this.website
      .createQueryBuilder('website')
      .innerJoinAndSelect('website.coreResult', 'coreResult');

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
      query.andWhere('coreResult.dapDetected = :dapDetected', {
        dapDetected: dto.dap_detected_final_url,
      });
    }

    const results = await query.getMany();

    const uniqueBaseDomainCount = results
      .map((website) => website.coreResult.finalUrlBaseDomain)
      .filter((url, i, baseDomains) => baseDomains.indexOf(url) === i).length;

    const uniqueAgenciesCount = results
      .map((website) => website.agency)
      .filter((agency, i, agencies) => agencies.indexOf(agency) === i).length;

    return {
      total: results.length,
      totalFinalUrlBaseDomains: uniqueBaseDomainCount,
      totalAgencies: uniqueAgenciesCount,
    };
  }
}
