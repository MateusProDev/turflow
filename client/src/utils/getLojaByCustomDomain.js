export async function getLojaByCustomDomain(customDomain, apiBaseUrl = "http://localhost:3000") {
  try {
    const url = `${apiBaseUrl}/public/loja?customDomain=${encodeURIComponent(customDomain)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Loja não encontrada para este domínio.");
    return await response.json();
  } catch (err) {
    throw new Error(err.message || "Erro ao buscar loja pelo domínio customizado.");
  }
}
