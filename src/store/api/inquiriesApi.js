import { baseApi } from './baseApi';

export const inquiriesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    submitInquiry: builder.mutation({
      query: (inquiryData) => ({
        url: '/inquiries', // Change this to '/contact' if your NestJS uses that!
        method: 'POST',
        body: inquiryData,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useSubmitInquiryMutation } = inquiriesApi;