/**
 * `PaginationResponseDto` defines the schema of a paginated response from the API. Note that
 * this should be a generic class where items is generic type `T` but the Swagger autogeneration does not
 * like this. Instead, we're using `extends` to add the type.
 */
export class PaginationResponseDto {
  /**
   * `meta` contains information various counts related to items and pages.
   */
  meta: Meta;

  /**
   * `links` provides cursors for pagination (next and previous) and links to the first and last page of results.
   */
  links: Links;
}

class Meta {
  /**
   *  `totalItems` is the total number of items that match the query.
   *
   * @example 1000
   */
  totalItems: number;

  /**
   * `itemCount` is number of items in the `PaginationResponseDto.items` array.
   *
   * @example 1
   */
  itemCount: number;

  /**
   * `itemsPerPage` is the number of items per page. This should be the same as the `limit` query parameter.
   *
   * @example 1
   */
  itemsPerPage: number;

  /**
   * `totalPages` is the total number of pages. Should be equal to `floor(totalItems / itemsPerPage)`
   *
   * @example 1000
   */
  totalPages: number;

  /**
   * `currentPage` is the page the cursor is currently on.
   *
   * @example 2
   */
  currentPage: number;
}

class Links {
  /**
   * `first` is a link to the first page of results.
   *
   * @example /websites/?page=1&limit=1
   */
  first: string;

  /**
   * `previous` is a link to the previous page of results. On the first page of results this will be an empty string `""`.
   *
   * @example /websites/?page=1&limit=1
   */
  previous: string;

  /**
   * `next` is a link to the next page of results. On the last page of results this will be an empty string `""`.
   *
   * @example /websites/?page=3&limit=1
   */
  next: string;

  /**
   * `last` is a link to the last page of results.
   *
   * @example /websites/?page=1000&limit=1
   */
  last: string;
}
