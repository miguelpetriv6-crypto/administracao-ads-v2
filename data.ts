export type Client = {
  id: string
  name: string
  business: string
  email: string
  phone: string
  niche: string
  monthlyFee: number
  status: 'Ativo' | 'Pausado'
  createdAt: string
}

export type Campaign = {
  id: string
  name: string
  client: string
  channel: string
  status: 'Ativa' | 'Pausada' | 'Rascunho'
  budget: number
  clicks: number
  impressions: number
  conversions: number
  spend: number
}

export const initialClients: Client[] = [
  { id: 'CLI-001', name: 'Carlos Oliveira', business: 'Chaveiro Londrina', email: 'contato@exemplo.com', phone: '(43) 99999-0000', niche: 'Serviços locais', monthlyFee: 600, status: 'Ativo', createdAt: '2026-09-01' },
  { id: 'CLI-002', name: 'Mariana Santos', business: 'Studio MS', email: 'mariana@exemplo.com', phone: '(43) 98888-0000', niche: 'Beleza', monthlyFee: 750, status: 'Ativo', createdAt: '2026-09-15' },
  { id: 'CLI-003', name: 'Rafael Lima', business: 'RL Auto Center', email: 'rafael@exemplo.com', phone: '(43) 97777-0000', niche: 'Automotivo', monthlyFee: 500, status: 'Pausado', createdAt: '2026-10-01' },
]

export const initialCampaigns: Campaign[] = [
  { id: 'CMP-001', name: 'Pesquisa — Serviços urgentes', client: 'Chaveiro Londrina', channel: 'Pesquisa', status: 'Ativa', budget: 35, clicks: 428, impressions: 6120, conversions: 38, spend: 486.2 },
  { id: 'CMP-002', name: 'Pesquisa — Marca', client: 'Studio MS', channel: 'Pesquisa', status: 'Ativa', budget: 25, clicks: 312, impressions: 5020, conversions: 24, spend: 298.5 },
  { id: 'CMP-003', name: 'Rede de Pesquisa', client: 'RL Auto Center', channel: 'Pesquisa', status: 'Pausada', budget: 40, clicks: 190, impressions: 3700, conversions: 9, spend: 230.9 },
  { id: 'CMP-004', name: 'Leads locais', client: 'Chaveiro Londrina', channel: 'Pesquisa', status: 'Rascunho', budget: 20, clicks: 0, impressions: 0, conversions: 0, spend: 0 },
]