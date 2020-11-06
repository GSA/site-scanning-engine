import { classToPlain } from 'class-transformer';
import { CoreResult } from 'entities/core-result.entity';

function websiteSerializer(coreResult: CoreResult) {
  const serializedCoreResult = classToPlain(coreResult);
  const serializedWebsite = classToPlain(coreResult.website);

  return {
    ...serializedCoreResult,
    ...serializedWebsite,
  };
}

export { websiteSerializer };
