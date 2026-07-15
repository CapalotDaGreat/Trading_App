import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  fetchFinancialNews,
  fetchNewsBySymbol,
  type NewsFeedParams,
} from '../services/news.service';

const newsQueryKey = (params: NewsFeedParams) => ['news', params] as const;
const symbolNewsQueryKey = (symbol: string) => ['news', 'symbol', symbol] as const;

export function useNews(params: NewsFeedParams = {}) {
  const query = useInfiniteQuery({
    queryKey: newsQueryKey(params),
    queryFn: ({ pageParam }) =>
      fetchFinancialNews({ ...params, page: pageParam as number }),
    initialPageParam: 1,
    getNextPageParam: (lastPage, _pages, lastPageParam) => {
      const loaded = lastPageParam * (params.pageSize ?? 20);
      if (loaded >= lastPage.totalResults) return undefined;
      return lastPageParam + 1;
    },
    staleTime: 5 * 60 * 1000,
  });

  const articles = query.data?.pages.flatMap((page) => page.articles) ?? [];
  const source = query.data?.pages[0]?.source ?? 'rss';

  return {
    articles,
    source,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}

export function useSymbolNews(symbol: string, enabled = true) {
  const query = useQuery({
    queryKey: symbolNewsQueryKey(symbol),
    queryFn: () => fetchNewsBySymbol(symbol),
    enabled: enabled && symbol.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  return {
    articles: query.data?.articles ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
