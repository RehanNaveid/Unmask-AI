// API client with authentication helpers

let authToken = null;

export const setAuthToken = (token) => {
  authToken = token;
};

export const clearAuthToken = () => {
  authToken = null;
};

const getHeaders = (includeAuth = true) => {
  const headers = {};
  
  if (includeAuth && authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  return headers;
};

const handleResponse = async (response) => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    const errorWithStatus = new Error(error.message || `HTTP error! status: ${response.status}`);
    errorWithStatus.status = response.status;
    errorWithStatus.statusText = response.statusText;
    throw errorWithStatus;
  }
  return response.json();
};

export const apiGet = async (url) => {
  const response = await fetch(`/api${url}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
  });
  return handleResponse(response);
};

export const apiPostJson = async (url, data) => {
  const response = await fetch(`/api${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const apiPostMultipart = async (url, formData) => {
  const response = await fetch(`/api${url}`, {
    method: 'POST',
    headers: {
      ...getHeaders(),
      // Don't set Content-Type for FormData, browser will set it with boundary
    },
    body: formData,
  });
  return handleResponse(response);
};

export const apiDelete = async (url) => {
  const response = await fetch(`/api${url}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getHeaders(),
    },
  });
  
  // DELETE might return 204 No Content
  if (response.status === 204) {
    return {};
  }
  
  return handleResponse(response);
};

