import { classToPlain } from 'class-transformer';
import { Website } from 'entities/website.entity';

function websiteSerializer(website: Website) {
  const serializedWebsite = classToPlain(website);
  const serializedCoreResult = classToPlain(website.coreResult);
  const serializedUswdsResult = classToPlain(website.uswdsResult);

  return {
    ...serializedCoreResult,
    ...serializedUswdsResult,
    ...serializedWebsite,
  };
}

export { websiteSerializer };
