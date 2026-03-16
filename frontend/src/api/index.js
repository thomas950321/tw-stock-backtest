import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    let msg = "伺服器錯誤，請稍後再試";
    if (err.response?.data?.detail) {
      if (typeof err.response.data.detail === 'string') {
        msg = err.response.data.detail;
      } else if (Array.isArray(err.response.data.detail)) {
        msg = err.response.data.detail.map(e => e.msg || e.type).join(', ');
      }
    } else if (err.response?.data?.message) {
      msg = err.response.data.message;
    }
    return Promise.reject(new Error(msg));
  }
);

export const stocksApi = {
  getAll:   (params) => api.get("/stocks", { params }),
  getOne:   (id)     => api.get(`/stocks/${id}`),
  getPrice: (id, params) => api.get(`/stocks/${id}/price`, { params }),
};

export const watchlistsApi = {
  getAll:      ()         => api.get("/watchlists"),
  create:      (data)     => api.post("/watchlists", data),
  remove:      (id)       => api.delete(`/watchlists/${id}`),
  getStocks:   (id)       => api.get(`/watchlists/${id}/stocks`),
  addStock:    (id, data) => api.post(`/watchlists/${id}/stocks`, data),
  removeStock: (wid, sid) => api.delete(`/watchlists/${wid}/stocks/${sid}`),
};

export const strategiesApi = {
  getAll:  ()         => api.get("/strategies"),
  create:  (data)     => api.post("/strategies", data),
  update:  (id, data) => api.put(`/strategies/${id}`, data),
  remove:  (id)       => api.delete(`/strategies/${id}`),
};

export const backtestApi = {
  run: (data) => api.post("/backtest", data),
};

export const resultsApi = {
  getAll:       (params) => api.get("/results", { params }),
  getOne:       (id)     => api.get(`/results/${id}`),
  getTrades:    (id)     => api.get(`/results/${id}/trades`),
  getAIAnalysis:(id)     => api.get(`/results/${id}/ai-analysis`),
};

export const dashboardApi = {
  getSummary: () => api.get("/summary"),
};
