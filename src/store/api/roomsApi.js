import { baseApi } from './baseApi';

export const roomsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getRooms: builder.query({
      query: () => '/rooms/public',
      providesTags: ['Room'],
    }),

    getRoomBySlug: builder.query({
      query: (slug) => `/rooms/public/${slug}`,
      providesTags: (result, error, slug) => [{ type: 'Room', id: slug }],
    }),
  }),
  overrideExisting: true,
});

export const { useGetRoomsQuery, useGetRoomBySlugQuery } = roomsApi;