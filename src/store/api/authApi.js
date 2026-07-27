import { baseApi } from './baseApi';
import { setCredentials } from '../slices/authSlice';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login', 
        method: 'POST',
        body: credentials,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // The backend returns { success: true, data: safeUser }
          // We pass a placeholder string for the token so the frontend knows we are authenticated via cookies
          dispatch(setCredentials({ user: data.data, token: 'cookie-active' }));
        } catch (error) {}
      },
    }),

    signup: builder.mutation({
      query: (userData) => ({
        // THE FIX: Changed from /auth/signup to /auth/register to match your NestJS backend
        url: '/auth/register', 
        method: 'POST',
        body: userData,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          // Automatically log them in after a successful registration
          if (data.success) {
            dispatch(setCredentials({ user: data.data, token: 'cookie-active' }));
          }
        } catch (error) {}
      },
    }),

    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST',
      }),
      // We don't need onQueryStarted here, we will dispatch the local logout action directly from the component
    }),

    updatePassword: builder.mutation({
      query: (passwords) => ({
        url: '/auth/password',
        method: 'PATCH',
        body: passwords, // Expects { currentPassword, newPassword }
      }),
    }),

    deleteAccount: builder.mutation({
      query: () => ({
        url: '/auth/delete-account',
        method: 'DELETE',
      }),
    }),

    // --- NEW MISSING FUNCTIONS ADDED HERE ---
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: data,
      }),
    }),

    verifyResetToken: builder.query({
      query: (token) => `/auth/verify-reset-token/${token}`,
    }),

    resetPassword: builder.mutation({
      query: (data) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: data,
      }),
    }),

  }),
});

// THE FIX: Added useSignupMutation to the export list!
// ADDED MISSING HOOKS: useDeleteAccountMutation, useForgotPasswordMutation, useResetPasswordMutation
export const { 
  useLoginMutation, 
  useSignupMutation, 
  useLogoutMutation, 
  useUpdatePasswordMutation,
  useDeleteAccountMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyResetTokenQuery
} = authApi;