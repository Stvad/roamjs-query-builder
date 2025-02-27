import { DAILY_NOTE_PAGE_TITLE_REGEX } from "roamjs-components/date/constants";
import { Result } from "roamjs-components/types/query-builder";
import extractTag from "roamjs-components/util/extractTag";
import parseResultSettings from "./parseResultSettings";

const sortFunction =
  (key: string, descending?: boolean) => (a: Result, b: Result) => {
    const _aVal = a[key];
    const _bVal = b[key];
    const transform = (_val: Result[string]) =>
      typeof _val === "string"
        ? DAILY_NOTE_PAGE_TITLE_REGEX.test(extractTag(_val))
          ? window.roamAlphaAPI.util.pageTitleToDate(extractTag(_val))
          : /^(-)?\d+(\.\d*)?$/.test(_val)
          ? Number(_val)
          : _val
        : _val;
    const aVal = transform(_aVal);
    const bVal = transform(_bVal);
    if (aVal instanceof Date && bVal instanceof Date) {
      return descending
        ? bVal.valueOf() - aVal.valueOf()
        : aVal.valueOf() - bVal.valueOf();
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      return descending ? bVal - aVal : aVal - bVal;
    } else if (typeof aVal !== "undefined" && typeof bVal !== "undefined") {
      return descending
        ? bVal.toString().localeCompare(aVal.toString())
        : aVal.toString().localeCompare(bVal.toString());
    } else {
      return 0;
    }
  };

const postProcessResults = (
  results: Result[],
  settings: Omit<ReturnType<typeof parseResultSettings>, "views" | "layout">
) => {
  const sortedResults = results
    .filter((r) => {
      return Object.keys(settings.filters).every(
        (filterKey) =>
          (settings.filters[filterKey].includes.values.size === 0 &&
            (typeof r[filterKey] !== "string" ||
              !settings.filters[filterKey].excludes.values.has(
                extractTag(r[filterKey] as string)
              )) &&
            (r[filterKey] instanceof Date ||
              !settings.filters[filterKey].excludes.values.has(
                window.roamAlphaAPI.util.dateToPageTitle(r[filterKey] as Date)
              )) &&
            !settings.filters[filterKey].excludes.values.has(
              r[filterKey] as string
            )) ||
          (typeof r[filterKey] === "string" &&
            settings.filters[filterKey].includes.values.has(
              extractTag(r[filterKey] as string)
            )) ||
          (r[filterKey] instanceof Date &&
            settings.filters[filterKey].includes.values.has(
              window.roamAlphaAPI.util.dateToPageTitle(r[filterKey] as Date)
            )) ||
          settings.filters[filterKey].includes.values.has(
            r[filterKey] as string
          )
      );
    })
    .sort((a, b) => {
      for (const sort of settings.activeSort) {
        const cmpResult = sortFunction(sort.key, sort.descending)(a, b);
        if (cmpResult !== 0) return cmpResult;
      }
      return 0;
    });
  const allResults =
    settings.random > 0
      ? sortedResults.sort(() => 0.5 - Math.random()).slice(0, settings.random)
      : sortedResults;
  const paginatedResults = allResults.slice(
    (settings.page - 1) * settings.pageSize,
    settings.page * settings.pageSize
  );
  return { allResults, paginatedResults };
};

export default postProcessResults;
