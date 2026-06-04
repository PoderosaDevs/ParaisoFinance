const API_URL = 'http://localhost:3000';

export const apiService = {
  // Envia os dados de login para o backend
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas ou erro no servidor');
    }

    return response.json(); // Espera-se retornar { user: {...}, token: "..." }
  },

  // Busca os dados do usuário usando o token salvo
  getProfile: async (token: string) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Sessão expirada');
    }

    return response.json();
  }
};