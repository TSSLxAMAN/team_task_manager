import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../lib/api'

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login/', { email, password })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { detail: 'Login failed' })
  }
})

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/registration/', {
      email: data.email,
      password1: data.password,
      password2: data.password,
      name: data.name,
      role: data.role,
    })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data || { detail: 'Registration failed' })
  }
})

export const fetchMe = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/user/')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: null,
    initialized: false,
  },
  reducers: {
    logout(state) {
      state.user = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        localStorage.setItem('access_token', action.payload.access)
        localStorage.setItem('refresh_token', action.payload.refresh)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(register.pending, (state) => { state.loading = true; state.error = null })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        localStorage.setItem('access_token', action.payload.access)
        localStorage.setItem('refresh_token', action.payload.refresh)
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload
        state.initialized = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.user = null
        state.initialized = true
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
