import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Website } from './website.entity';
import { Repository } from 'typeorm';
import { CreateWebsiteDto } from './dto/create-website.dto';

@Injectable()
export class WebsiteService {
  constructor(
    @InjectRepository(Website) private website: Repository<Website>,
  ) {}

  async findAll(): Promise<Website[]> {
    const websites = await this.website.find();
    return websites;
  }

  async findOne(id: number): Promise<Website> {
    const website = await this.findOne(id);
    return website;
  }

  async create(createWebsiteDto: CreateWebsiteDto) {
    const website = new Website();
    website.url = createWebsiteDto.url;
    website.agency = createWebsiteDto.agency;
    website.branch = createWebsiteDto.branch;
    await this.website.save(website);
  }
}
