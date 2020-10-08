import { Test, TestingModule } from '@nestjs/testing';
import { RootController } from './root.controller';

describe('RootController', () => {
  let controller: RootController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RootController],
    }).compile();

    controller = module.get<RootController>(RootController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return documentation', () => {
    const expected = {
      endpoints: ['websites', 'results'],
    };
    const result = controller.documentation();
    expect(result).toStrictEqual(expected);
  });
});
