import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../lib/api'

export const fetchProjectTasks = createAsyncThunk('tasks/fetchByProject', async (projectId, { rejectWithValue }) => {
  try {
    const res = await api.get(`/projects/${projectId}/tasks/`)
    return { projectId, tasks: res.data }
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchTask = createAsyncThunk('tasks/fetchOne', async (id, { rejectWithValue }) => {
  try {
    const res = await api.get(`/tasks/${id}/`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const createTask = createAsyncThunk('tasks/create', async ({ projectId, data }, { rejectWithValue }) => {
  try {
    const res = await api.post(`/projects/${projectId}/tasks/`, data)
    return { projectId, task: res.data }
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const startTask = createAsyncThunk('tasks/start', async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/start/`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const submitTask = createAsyncThunk('tasks/submit', async ({ id, data }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/submit/`, data)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const closeTask = createAsyncThunk('tasks/close', async (id, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/close/`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const reopenTask = createAsyncThunk('tasks/reopen', async ({ id, reason }, { rejectWithValue }) => {
  try {
    const res = await api.patch(`/tasks/${id}/reopen/`, { reason })
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchMyTasks = createAsyncThunk('tasks/fetchMine', async (statusFilter, { rejectWithValue }) => {
  try {
    const params = statusFilter ? `?status=${statusFilter}` : ''
    const res = await api.get(`/tasks/my-tasks/${params}`)
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

export const fetchReviewQueue = createAsyncThunk('tasks/fetchReview', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/tasks/review-queue/')
    return res.data
  } catch (err) {
    return rejectWithValue(err.response?.data)
  }
})

const updateTaskInList = (list, updated) =>
  list.map(t => t.id === updated.id ? updated : t)

const taskSlice = createSlice({
  name: 'tasks',
  initialState: {
    byProject: {},
    current: null,
    myTasks: [],
    reviewQueue: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearCurrent(state) { state.current = null },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProjectTasks.fulfilled, (state, action) => {
        state.byProject[action.payload.projectId] = action.payload.tasks
      })
      .addCase(fetchTask.pending, (state) => { state.loading = true })
      .addCase(fetchTask.fulfilled, (state, action) => { state.loading = false; state.current = action.payload })
      .addCase(fetchTask.rejected, (state) => { state.loading = false })
      .addCase(createTask.fulfilled, (state, action) => {
        const { projectId, task } = action.payload
        if (state.byProject[projectId]) {
          state.byProject[projectId].push(task)
        }
      })
      .addCase(startTask.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(submitTask.fulfilled, (state, action) => {
        state.current = action.payload
      })
      .addCase(closeTask.fulfilled, (state, action) => {
        state.current = action.payload
        state.reviewQueue = state.reviewQueue.filter(t => t.id !== action.payload.id)
      })
      .addCase(reopenTask.fulfilled, (state, action) => {
        state.current = action.payload
        state.reviewQueue = state.reviewQueue.filter(t => t.id !== action.payload.id)
      })
      .addCase(fetchMyTasks.fulfilled, (state, action) => { state.myTasks = action.payload })
      .addCase(fetchReviewQueue.fulfilled, (state, action) => { state.reviewQueue = action.payload })
  },
})

export const { clearCurrent } = taskSlice.actions
export default taskSlice.reducer
