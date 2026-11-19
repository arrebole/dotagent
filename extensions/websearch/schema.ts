import { arr, int, obj, oneOf, opt, str, type Static } from "@earendil-works/pi-schema";
import { searchOptions } from "./providers/options.ts";

export const searchParameters = obj({
  provider: oneOf(["exa", "tavily", "firecrawl"], {
    description: "Search provider: Tavily for quick lookups, news, and finance; Exa for semantic search, in-depth research, and structured output; Firecrawl for search with full page content, or for code repositories, papers, PDFs, news, and images.",
  }),
  query: str({ minLength: 1, description: "Search query; keep it focused on one specific question." }),
  numResults: opt(int({ minimum: 1, maximum: 100, default: 10, description: "Number of results, default 10. Exa and Firecrawl allow up to 100; Tavily allows up to 20 and rejects larger values." })),
  includeDomains: opt(arr(str(), { description: "Only search these domains." })),
  excludeDomains: opt(arr(str(), { description: "Exclude these domains." })),
  startDate: opt(str({ description: "Earliest publish date. Exa accepts ISO 8601; Tavily and Firecrawl require YYYY-MM-DD." })),
  endDate: opt(str({ description: "Latest publish date. Exa accepts ISO 8601; Tavily and Firecrawl require YYYY-MM-DD." })),
  options: opt(searchOptions),
});

export type SearchInput = Static<typeof searchParameters>;
