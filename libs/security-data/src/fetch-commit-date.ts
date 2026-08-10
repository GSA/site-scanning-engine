import { Logger } from '@nestjs/common';

const GITHUB_COMMITS_API =
  'https://api.github.com/repos/GSA/federal-website-index/commits';

/**
 * Fetches the date of the most recent commit that touched a given file path in
 * the GSA/federal-website-index repository, returning it as a YYYY-MM-DD string.
 *
 * Throws on non-200 responses or when the commits array is empty (the file path
 * is wrong or has never been committed).
 */
export async function fetchCommitDate(
  filePath: string,
  logger: Logger,
): Promise<string> {
  const url = `${GITHUB_COMMITS_API}?path=${encodeURIComponent(filePath)}&per_page=1`;
  logger.log(`Fetching last commit date for ${filePath} from ${url}`);

  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed for path "${filePath}": ${response.status} ${response.statusText}`,
    );
  }

  const commits: Array<{
    commit: { committer: { date: string } };
  }> = await response.json();

  if (!commits.length) {
    throw new Error(
      `GitHub API returned no commits for path "${filePath}" — check that the path is correct`,
    );
  }

  // The date field is ISO 8601 (e.g. "2026-05-21T18:00:00Z"); keep only YYYY-MM-DD.
  const isoDate = commits[0].commit.committer.date;
  const dateOnly = isoDate.split('T')[0];
  logger.log(`Last commit date for ${filePath}: ${dateOnly}`);
  return dateOnly;
}
