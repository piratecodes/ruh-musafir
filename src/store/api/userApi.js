import { baseApi } from './baseApi';
import { setCredentials } from '../slices/authSlice'; // <-- 1. Import the action to update global state

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    updateProfile: builder.mutation({
      query: (formData) => ({
        url: '/users/me/profile',
        method: 'PATCH',
        body: formData, 
      }),
      invalidatesTags: ['User'],
      
      // --- 2. THE FIX: Sync backend response with global Redux state instantly ---
      async onQueryStarted(arg, { dispatch, getState, queryFulfilled }) {
        try {
          // Wait for the backend to return the updated user data
          const { data } = await queryFulfilled;
          
          if (data.success && data.data) {
            // Grab the current active token from state so we don't accidentally log out
            const currentToken = getState().auth.token;
            
            // Instantly overwrite the old user state with the fresh database data!
            dispatch(setCredentials({ user: data.data, token: currentToken }));
          }
        } catch (error) {
          console.error("Failed to sync profile update with global state", error);
        }
      },
    }),
    
    getUserByEmail: builder.query({
      query: (email) => `/users/${email}`,
      providesTags: ['User'],
    }),
  }),
  overrideExisting: true,
});

export const { useUpdateProfileMutation, useGetUserByEmailQuery } = userApi;