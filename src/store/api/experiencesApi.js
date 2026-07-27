import { baseApi } from './baseApi';

export const experiencesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExperiences: builder.query({
      query: () => '/experiences/public',
      providesTags: ['Experience'],
    }),
  }),
  overrideExisting: true,
});

export const { useGetExperiencesQuery } = experiencesApi;