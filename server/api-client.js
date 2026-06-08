import axios from "axios";
import FormData from "form-data";
import fs from "fs";

const BASE_URL = process.env.ALGOGLIDE_BASE_URL ?? "https://api.algoglide.com";
const API_KEY = process.env.ALGOGLIDE_API_KEY ?? "";

const http = axios.create({
  baseURL: BASE_URL,
  headers: { Authorization: `Bearer ${API_KEY}` },
});

async function get(path, params = {}) {
  const { data } = await http.get(path, { params });
  return data;
}

async function post(path, params = {}, body = null) {
  const { data } = await http.post(path, body, { params });
  return data;
}

async function del(path, params = {}) {
  const { data } = await http.delete(path, { params });
  return data;
}

async function postForm(path, fields = {}, filePath = null, fileField = "strategy_file") {
  const form = new FormData();
  for (const [k, v] of Object.entries(fields)) form.append(k, v);
  if (filePath) form.append(fileField, fs.createReadStream(filePath));
  const { data } = await http.post(path, form, { headers: form.getHeaders() });
  return data;
}

export const api = { get, post, del, postForm };
