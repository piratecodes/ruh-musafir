import { baseApi } from './baseApi';

export const bookingsApi = baseApi.injectEndpoints({
  overrideExisting: true, 
  endpoints: (builder) => ({
    
    getMyBookings: builder.query({
      query: () => '/bookings/my-bookings',
      providesTags: ['Bookings'], 
    }),

    checkAvailability: builder.query({
      query: ({ checkin, checkout, guests, type }) => 
        `/bookings/check-availability?checkin=${checkin}&checkout=${checkout}&guests=${guests || 1}&type=${type || 'all'}`,
      providesTags: ['Bookings'],
    }),

    createBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: ['Bookings'], 
    }),

    // THE FIX: Added 'amount' to the payload
    settleBooking: builder.mutation({
      query: ({ id, method, amount }) => ({
        url: `/bookings/${id}/settle`,
        method: 'POST',
        body: { method, amount }, 
      }),
      invalidatesTags: ['Bookings'], 
    }),

    updateBookingStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/bookings/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Bookings'], 
    }),

    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bookings'], 
    }),
  }),
});

export const { 
  useGetMyBookingsQuery, 
  useCheckAvailabilityQuery,
  useCreateBookingMutation, 
  useSettleBookingMutation,
  useUpdateBookingStatusMutation,
  useCancelBookingMutation
} = bookingsApi;