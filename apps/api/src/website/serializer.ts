import { classToPlain } from 'class-transformer';
import { Website } from 'entities/website.entity';

function websiteSerializer(website: Website) {
  const serializedWebsite = classToPlain(website);
  const serializedCoreResult = classToPlain(website.coreResult);
  const serializedSolutionsResult = classToPlain(website.solutionsResult);

  return {
    ...serializedCoreResult,
    ...serializedSolutionsResult,
    ...serializedWebsite,
  };
}

export { websiteSerializer };
