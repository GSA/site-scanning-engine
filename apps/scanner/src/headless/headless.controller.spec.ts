import { Test, TestingModule } from '@nestjs/testing';
import { HeadlessController } from './headless.controller';
import { HeadlessService } from './headless.service';

describe('HeadlessController', () => {
  let controller: HeadlessController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HeadlessController],
      providers: [HeadlessService],
    }).compile();

    controller = module.get<HeadlessController>(HeadlessController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
