// src/api-routes/headers.ts
export function getRequestHeaders(): HeadersInit {
  const token = localStorage.getItem('@ParaisoFinaceiro:token');
  
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}