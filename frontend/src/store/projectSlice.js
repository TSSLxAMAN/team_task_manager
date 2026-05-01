import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../lib/api'

export const fetchProjects = createAsyncThunk('projects/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/projects/')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchProject = createAsyncThunk('projects/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${id}/`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const createProject = createAsyncThunk('projects/create', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/projects/', data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchMembers = createAsyncThunk('projects/fetchMembers', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${id}/members/`)
    return { id, members: res.data }
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const addMember = createAsyncThunk('projects/addMember', async ({ id, email }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/projects/${id}/members/`, { email })
    return { id, members: res.data }
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const updateProjectReadme = createAsyncThunk('projects/updateReadme', async ({ id, readme }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/projects/${id}/`, { readme })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const removeMember = createAsyncThunk('projects/removeMember', async ({ projectId, userId }, { rejectWithValue }) => {
  try {
    const res = await api.delete(`/projects/${projectId}/members/${userId}/`)
    return { id: projectId, members: res.data }
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const projectSlice = createSlice({
  name: 'projects',
  initialState: {
    list: [],
    current: null,
    members: {},
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) { state.current = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjects.pending, (state) => { state.loading = true })
      .addCase(fetchProjects.fulfilled, (state, action) => { state.loading = false; state.list = action.payload })
      .addCase(fetchProjects.rejected, (state) => { state.loading = false })
      .addCase(fetchProject.pending, (state) => { state.loading = true })
      .addCase(fetchProject.fulfilled, (state, action) => { state.loading = false; state.current = action.payload })
      .addCase(fetchProject.rejected, (state) => { state.loading = false })
      .addCase(createProject.fulfilled, (state, action) => { state.list.unshift(action.payload) })
      .addCase(fetchMembers.fulfilled, (state, action) => { state.members[action.payload.id] = action.payload.members })
      .addCase(addMember.fulfilled, (state, action) => { state.members[action.payload.id] = action.payload.members })
      .addCase(removeMember.fulfilled, (state, action) => { state.members[action.payload.id] = action.payload.members })
      .addCase(updateProjectReadme.fulfilled, (state, action) => { state.current = action.payload })
  },
})

export const { clearCurrent } = projectSlice.actions
export default projectSlice.reducer
