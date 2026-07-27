import { baseApi } from './baseApi';

export const menuApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMenu: builder.query({
      query: () => '/menu',
      providesTags: ['Menu'],
    }),
    // We will add the submitOrder mutation here later!
  }),
  overrideExisting: true,
});

export const { useGetMenuQuery } = menuApi;