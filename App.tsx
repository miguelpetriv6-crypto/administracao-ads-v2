import { FormEvent, useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, ChartNoAxesCombined, Check,
  ChevronDown, CircleHelp, Clock3, Cloud, Download, ExternalLink, FileBarChart,
  LayoutDashboard, Link2, LoaderCircle, LogOut, Menu, MoreHorizontal, Pencil,
  Pause, Play, Plus, Search, Settings, ShieldCheck, Sparkles, Target, Trash2,
  Users, Wallet, X, Zap
} from 'lucide-react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { supabase } from './lib/supabase'
import type { Client, Campaign } from './data'
import { initialCampaigns } from './data'

type Page = 'Dashboard' | 'Clientes' | 'Campanhas' | 'Contas Google Ads' | 'Relatórios' | 'Análises com IA' | 'Alertas' | 'Histórico' | 'Configurações'
const nav: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Dashboard', icon: LayoutDashboard }, { label: 'Clientes', icon: Users },
  { label: 'Campanhas', icon: Target }, { label: 'Contas Google Ads', icon: Link2 },
  { label: 'Relatórios', icon: FileBarChart }, { label: 'Análises com IA', icon: Sparkles },
  { label: 'Alertas', icon: Bell }, { label: 'Histórico', icon: Activity },
  { label: 'Configurações', icon: Settings },
]
const chartData = [
  { day: '08 Out', spend: 142, clicks: 90 }, { day: '09 Out', spend: 186, clicks: 112 },
  { day: '10 Out', spend: 159, clicks: 104 }, { day: '11 Out', spend: 213, clicks: 139 },
  { day: '12 Out', spend: 197, clicks: 126 }, { day: '13 Out', spend: 244, clicks: 158 },
  { day: '14 Out', spend: 218, clicks: 146 },
]
const money = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const integer = (n: number) => n.toLocaleString('pt-BR')
const initials = (s: string) => s.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
type DbClient = { id: string; user_id: string; name: string; business: string; email: string | null; phone: string | null; niche: string | null; monthly_fee: number; status: 'Ativo' | 'Pausado'; created_at: string }
const fromDb = (c: DbClient): Client => ({ id: c.id, name: c.name, business: c.business, email: c.email || '', phone: c.phone || '', niche: c.niche || '', monthlyFee: Number(c.monthly_fee || 0), status: c.status, createdAt: c.created_at.slice(0, 10) })

function Button({ children, onClick, variant = 'primary', type = 'button', disabled = false }: { children: React.ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; type?: 'button' | 'submit'; disabled?: boolean }) {
  return <button type={type} disabled={disabled} onClick={onClick} className={`btn btn-${variant}`}>{children}</button>
}
function Status({ value }: { value: string }) {
  const cls = value.toLowerCase().includes('ativ') ? 'green' : value.toLowerCase().includes('paus') ? 'amber' : 'gray'
  return <span className={`status ${cls}`}><span />{value}</span>
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>
}
function Empty({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return <div className="empty"><div className="empty-icon"><Cloud size={22} /></div><h3>{title}</h3><p>{body}</p>{action}</div>
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [authMessage, setAuthMessage] = useState('')
  const [page, setPage] = useState<Page>('Dashboard')
  const [clients, setClients] = useState<Client[]>([])
  const [clientsLoading, setClientsLoading] = useState(false)
  const [clientLoadError, setClientLoadError] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns)
  const [search, setSearch] = useState('')
  const [showClientModal, setShowClientModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [toast, setToast] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [period, setPeriod] = useState('Últimos 7 dias')
  const [selectedClient, setSelectedClient] = useState('Todos os clientes')
  const [newClient, setNewClient] = useState({ name: '', business: '', email: '', phone: '', niche: '', monthlyFee: '500' })

  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) setAuthMessage(error.message)
      setSession(data.session)
      setAuthReady(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user.id) void loadClients()
    else setClients([])
  }, [session?.user.id])

  async function loadClients() {
    setClientsLoading(true)
    setClientLoadError('')
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false })
    if (error) setClientLoadError(error.message)
    else setClients((data as DbClient[]).map(fromDb))
    setClientsLoading(false)
  }
  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }
  async function submitAuth(e: FormEvent) {
    e.preventDefault()
    setAuthBusy(true); setAuthMessage('')
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: authEmail.trim(), password: authPassword })
        if (error) throw error
        if (!data.session) setAuthMessage('Cadastro criado. Confira seu email para confirmar a conta e depois entre.')
        else setAuthMessage('Conta criada com sucesso.')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: authEmail.trim(), password: authPassword })
        if (error) throw error
      }
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Não foi possível autenticar.')
    } finally { setAuthBusy(false) }
  }
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) notify(`Erro ao sair: ${error.message}`)
    else { setPage('Dashboard'); notify('Você saiu da sua conta.') }
  }
  function openNewClient() {
    setEditingClient(null)
    setNewClient({ name: '', business: '', email: '', phone: '', niche: '', monthlyFee: '500' })
    setShowClientModal(true)
  }
  function editClient(client: Client) {
    setEditingClient(client)
    setNewClient({ name: client.name, business: client.business, email: client.email, phone: client.phone, niche: client.niche, monthlyFee: String(client.monthlyFee) })
    setShowClientModal(true)
  }
  async function saveClient(e: FormEvent) {
    e.preventDefault()
    if (!session?.user.id) return notify('Entre na sua conta antes de cadastrar clientes.')
    if (!newClient.name.trim() || !newClient.business.trim()) return notify('Preencha o nome e a empresa.')
    const payload = {
      user_id: session.user.id,
      name: newClient.name.trim(),
      business: newClient.business.trim(),
      email: newClient.email.trim() || null,
      phone: newClient.phone.trim() || null,
      niche: newClient.niche.trim() || null,
      monthly_fee: Number(newClient.monthlyFee) || 0,
    }
    const result = editingClient
      ? await supabase.from('clients').update(payload).eq('id', editingClient.id).select().single()
      : await supabase.from('clients').insert({ ...payload, status: 'Ativo' }).select().single()
    if (result.error) {
      notify(`Não foi possível salvar: ${result.error.message}`)
      return
    }
    const saved = fromDb(result.data as DbClient)
    setClients(old => editingClient ? old.map(c => c.id === saved.id ? saved : c) : [saved, ...old])
    setShowClientModal(false)
    notify(editingClient ? 'Cliente atualizado no Supabase.' : 'Cliente salvo no Supabase.')
  }
  async function deleteClient(client: Client) {
    if (!window.confirm(`Excluir o cliente ${client.business}? Esta ação não pode ser desfeita.`)) return
    const { error } = await supabase.from('clients').delete().eq('id', client.id)
    if (error) return notify(`Não foi possível excluir: ${error.message}`)
    setClients(old => old.filter(c => c.id !== client.id))
    notify('Cliente excluído do Supabase.')
  }
  function toggleCampaign(campaign: Campaign) {
    const next = campaign.status === 'Ativa' ? 'Pausada' : 'Ativa'
    if (!window.confirm(`${next === 'Ativa' ? 'Ativar' : 'Pausar'} "${campaign.name}"?\\n\\nIsso altera apenas os dados de demonstração, não a conta Google Ads.`)) return
    setCampaigns(old => old.map(c => c.id === campaign.id ? { ...c, status: next } : c))
    notify('Status de demonstração alterado. Nenhuma alteração foi enviada ao Google Ads.')
  }
  function exportCsv() {
    const rows = [['Campanha', 'Cliente', 'Status', 'Orçamento diário', 'Cliques', 'Impressões', 'Conversões', 'Investimento'], ...campaigns.map(c => [c.name, c.client, c.status, String(c.budget), String(c.clicks), String(c.impressions), String(c.conversions), String(c.spend)])]
    const csv = '\uFEFF' + rows.map(row => row.map(cell => `"${cell.replaceAll('"', '""')}"`).join(';')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = 'administracao-campanhas.csv'; a.click(); URL.revokeObjectURL(url)
    notify('CSV de demonstração exportado.')
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'Ativa').length
  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const filteredClients = useMemo(() => clients.filter(c => `${c.name} ${c.business} ${c.email}`.toLowerCase().includes(search.toLowerCase())), [clients, search])
  const filteredCampaigns = useMemo(() => campaigns.filter(c => (selectedClient === 'Todos os clientes' || c.client === selectedClient) && `${c.name} ${c.client} ${c.id}`.toLowerCase().includes(search.toLowerCase())), [campaigns, selectedClient, search])

  if (!authReady) return <div className="auth-screen"><div className="auth-box"><LoaderCircle className="spin" size={26}/><p>Conectando à autenticação…</p></div></div>
  if (!session) return <div className="auth-screen"><form className="auth-box" onSubmit={submitAuth}><div className="auth-brand"><div className="brand-mark"><ChartNoAxesCombined size={22}/></div><div><strong>Administração</strong><small>GESTÃO DE TRÁFEGO</small></div></div><div className="eyebrow">ACESSO PRIVADO</div><h1>{authMode === 'login' ? 'Bem-vindo de volta' : 'Criar administrador'}</h1><p className="auth-description">{authMode === 'login' ? 'Entre para acessar seu painel de gestão.' : 'Crie sua conta para começar a salvar clientes.'}</p><label>Email<input required type="email" autoComplete="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="voce@exemplo.com"/></label><label>Senha<input required type="password" minLength={6} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Mínimo de 6 caracteres"/></label>{authMessage && <div className="auth-message">{authMessage}</div>}<Button type="submit" disabled={authBusy}>{authBusy && <LoaderCircle size={15} className="spin"/>}{authBusy ? 'Aguarde…' : authMode === 'login' ? 'Entrar' : 'Criar conta'}</Button><p className="auth-switch">{authMode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'} <button type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'signup' : 'login'); setAuthMessage('') }}>{authMode === 'login' ? 'Criar conta' : 'Entrar'}</button></p><small className="auth-note">Use somente sua conta pessoal. O Supabase pode exigir confirmação por email.</small></form></div>

  const sidebar = <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}><div className="brand"><div className="brand-mark"><ChartNoAxesCombined size={22}/></div><div><strong>Administração</strong><small>GESTÃO DE TRÁFEGO</small></div><button className="icon-btn mobile-close" onClick={() => setMobileOpen(false)} aria-label="Fechar menu"><X size={18}/></button></div><div className="workspace"><div className="workspace-icon">A</div><div><strong>Minha operação</strong><small>Workspace pessoal</small></div><ChevronDown size={15}/></div><div className="nav-label">MENU PRINCIPAL</div><nav>{nav.map(item => { const Icon = item.icon; return <button key={item.label} className={`nav-item ${page === item.label ? 'selected' : ''}`} onClick={() => { setPage(item.label); setMobileOpen(false); setSearch('') }}><Icon size={18}/><span>{item.label}</span>{item.label === 'Alertas' && <span className="nav-count">2</span>}</button> })}</nav><div className="sidebar-bottom"><div className="upgrade"><div className="upgrade-icon"><Zap size={17}/></div><strong>Central de integrações</strong><p>Conecte suas contas para ver dados reais.</p><button onClick={() => setPage('Contas Google Ads')}>Configurar agora <ExternalLink size={13}/></button></div><div className="profile"><div className="avatar">{initials(session.user.email || 'AD')}</div><div><strong>{session.user.email}</strong><small>Conta autenticada</small></div><button className="icon-btn" onClick={signOut} title="Sair"><LogOut size={16}/></button></div></div></aside>
  return <div className="app-shell">{sidebar}{mobileOpen && <button className="mobile-scrim" aria-label="Fechar menu" onClick={() => setMobileOpen(false)}/>}<main className="main"><header className="topbar"><div className="top-left"><button className="icon-btn mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Abrir menu"><Menu size={19}/></button><div className="breadcrumb">Workspace <span>/</span> <strong>{page}</strong></div></div><div className="top-actions"><div className="sync-pill"><span/> Supabase conectado</div><button className="icon-btn" aria-label="Ajuda" onClick={() => notify('Google Ads ainda não está conectado.') }><CircleHelp size={18}/></button><button className="icon-btn notification" aria-label="Notificações" onClick={() => setPage('Alertas')}><Bell size={18}/><i/></button><div className="avatar top-avatar">{initials(session.user.email || 'AD')}</div></div></header><div className="content">
    {page === 'Dashboard' && <Dashboard clients={clients} campaigns={campaigns} totalSpend={totalSpend} totalClicks={totalClicks} totalImpressions={totalImpressions} totalConversions={totalConversions} activeCampaigns={activeCampaigns} period={period} setPeriod={setPeriod} go={setPage}/>}
    {page === 'Clientes' && <Clients clients={filteredClients} loading={clientsLoading} error={clientLoadError} onReload={loadClients} onNew={openNewClient} onEdit={editClient} onDelete={deleteClient} search={search} setSearch={setSearch}/>}
    {page === 'Campanhas' && <Campaigns campaigns={filteredCampaigns} clients={clients} search={search} setSearch={setSearch} selectedClient={selectedClient} setSelectedClient={setSelectedClient} onToggle={toggleCampaign} onExport={exportCsv}/>}
    {page === 'Contas Google Ads' && <Connections notify={notify}/>}
    {page === 'Relatórios' && <Reports onExport={exportCsv}/>}
    {page === 'Análises com IA' && <Insights campaigns={campaigns}/>}
    {page === 'Alertas' && <Alerts/>}
    {page === 'Histórico' && <History/>}
    {page === 'Configurações' && <SettingsPage notify={notify}/>}
    </div><footer className="footer"><span>Administração <span className="dot-sep">•</span> MVP 0.2.0</span><span><span className="live-dot"/> Supabase Auth · clientes no banco</span></footer></main>
    {showClientModal && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowClientModal(false) }}><form className="modal" onSubmit={saveClient}><div className="modal-head"><div><h2>{editingClient ? 'Editar cliente' : 'Novo cliente'}</h2><p>Os dados serão salvos no Supabase.</p></div><button type="button" className="icon-btn" onClick={() => setShowClientModal(false)}><X size={18}/></button></div><div className="form-grid"><label>Nome do contato *<input required value={newClient.name} onChange={e => setNewClient({ ...newClient, name: e.target.value })} placeholder="Ex.: João Silva"/></label><label>Empresa *<input required value={newClient.business} onChange={e => setNewClient({ ...newClient, business: e.target.value })} placeholder="Ex.: Chaveiro Londrina"/></label><label>Email<input type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} placeholder="contato@empresa.com"/></label><label>Telefone<input value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} placeholder="(43) 99999-9999"/></label><label>Nicho<input value={newClient.niche} onChange={e => setNewClient({ ...newClient, niche: e.target.value })} placeholder="Ex.: Serviços locais"/></label><label>Mensalidade (R$)<input type="number" min="0" step="0.01" value={newClient.monthlyFee} onChange={e => setNewClient({ ...newClient, monthlyFee: e.target.value })}/></label></div><div className="modal-actions"><Button variant="secondary" onClick={() => setShowClientModal(false)}>Cancelar</Button><Button type="submit"><Check size={16}/> Salvar no Supabase</Button></div></form></div>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}</div>
}

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-heading"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="heading-actions">{action}</div>}</div>
}
function Dashboard({ clients, campaigns, totalSpend, totalClicks, totalImpressions, totalConversions, activeCampaigns, period, setPeriod, go }: { clients: Client[]; campaigns: Campaign[]; totalSpend: number; totalClicks: number; totalImpressions: number; totalConversions: number; activeCampaigns: number; period: string; setPeriod: (v: string) => void; go: (p: Page) => void }) {
  const ctr = totalImpressions ? totalClicks / totalImpressions * 100 : 0, cpc = totalClicks ? totalSpend / totalClicks : 0
  const stats = [{ label: 'Investimento', value: money(totalSpend), note: 'Dados de exemplo', icon: Wallet, color: 'cyan', change: '+12,8%' }, { label: 'Cliques', value: integer(totalClicks), note: 'Dados de exemplo', icon: Target, color: 'violet', change: '+8,2%' }, { label: 'Impressões', value: integer(totalImpressions), note: 'Dados de exemplo', icon: Activity, color: 'blue', change: '+5,4%' }, { label: 'Conversões', value: integer(totalConversions), note: 'Dados de exemplo', icon: Zap, color: 'green', change: '+16,3%' }]
  return <><PageHeading eyebrow="VISÃO GERAL" title="Dashboard" description="Acompanhe a operação e o desempenho das campanhas." action={<><select className="select" value={period} onChange={e => setPeriod(e.target.value)}><option>Hoje</option><option>Últimos 7 dias</option><option>Últimos 30 dias</option></select><Button onClick={() => go('Contas Google Ads')}><Link2 size={16}/> Conectar Google Ads</Button></>}/><div className="notice"><div className="notice-icon"><ShieldCheck size={18}/></div><div><strong>Google Ads em modo demonstração</strong><p>Os números de campanhas ainda são exemplos. Seus clientes agora são carregados do Supabase após login.</p></div><button onClick={() => go('Contas Google Ads')}>Configurar integração <ExternalLink size={14}/></button></div><div className="stats-grid">{stats.map(s => { const Icon = s.icon; return <Card className="stat-card" key={s.label}><div className="stat-top"><span>{s.label}</span><div className={`stat-icon ${s.color}`}><Icon size={18}/></div></div><div className="stat-value">{s.value}</div><div className="stat-bottom"><span className="stat-change"><ArrowUpRight size={14}/>{s.change}</span><span>{s.note}</span></div></Card> })}</div><div className="metric-mini-grid"><Card className="mini-metric"><span>CTR médio</span><strong>{ctr.toLocaleString('pt-BR',{maximumFractionDigits:2})}%</strong><small><ArrowUpRight size={13}/> Taxa de cliques de exemplo</small></Card><Card className="mini-metric"><span>CPC médio</span><strong>{money(cpc)}</strong><small><ArrowDownRight size={13}/> Custo por clique de exemplo</small></Card><Card className="mini-metric"><span>Campanhas ativas</span><strong>{activeCampaigns}</strong><small><span className="live-dot"/> Em demonstração</small></Card><Card className="mini-metric"><span>Clientes no banco</span><strong>{clients.length}</strong><small><Users size={13}/> Carregados do Supabase</small></Card></div><div className="charts-grid"><Card className="chart-card"><div className="card-heading"><div><h3>Investimento ao longo do tempo</h3><p>Exemplo ilustrativo · últimos 7 dias</p></div><button className="icon-btn"><MoreHorizontal size={18}/></button></div><div className="chart-legend"><span><i className="legend-cyan"/> Investimento</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#00f0ff" stopOpacity={0.24}/><stop offset="100%" stopColor="#00f0ff" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#222b3b" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" tick={{ fill: '#78869c', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#78869c', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#111827', border: '1px solid #273348', borderRadius: 10, color: '#f5f7fb' }} formatter={(value) => [money(Number(value)), 'Investimento']}/><Area type="monotone" dataKey="spend" stroke="#00f0ff" strokeWidth={2.5} fill="url(#spendGradient)"/></AreaChart></ResponsiveContainer></div></Card><Card className="chart-card"><div className="card-heading"><div><h3>Cliques por dia</h3><p>Exemplo ilustrativo</p></div><button className="icon-btn"><MoreHorizontal size={18}/></button></div><div className="chart-legend"><span><i className="legend-violet"/> Cliques</span></div><div className="chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}><CartesianGrid stroke="#222b3b" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" tick={{ fill: '#78869c', fontSize: 11 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: '#78869c', fontSize: 11 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: '#111827', border: '1px solid #273348', borderRadius: 10, color: '#f5f7fb' }}/><Bar dataKey="clicks" name="Cliques" fill="#a300ff" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div></Card></div><Card className="table-card"><div className="card-heading"><div><h3>Campanhas recentes</h3><p>Campanhas de demonstração</p></div><Button variant="secondary" onClick={() => go('Campanhas')}>Ver campanhas <ExternalLink size={14}/></Button></div><CampaignTable campaigns={campaigns.slice(0,4)} compact/></Card></>
}
function Clients({ clients, loading, error, onReload, onNew, onEdit, onDelete, search, setSearch }: { clients: Client[]; loading: boolean; error: string; onReload: () => void; onNew: () => void; onEdit: (c: Client) => void; onDelete: (c: Client) => void; search: string; setSearch: (s: string) => void }) {
  return <><PageHeading eyebrow="RELACIONAMENTO" title="Clientes" description="Os registros desta página são carregados do Supabase." action={<Button onClick={onNew}><Plus size={16}/> Novo cliente</Button>}/>{error && <div className="notice"><div className="notice-icon"><ShieldCheck size={18}/></div><div><strong>Não foi possível carregar clientes</strong><p>{error}</p></div><button onClick={onReload}>Tentar novamente</button></div>}<Card className="table-card"><div className="table-toolbar"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cliente, empresa ou email..."/></div><span className="result-count">{clients.length} cliente(s)</span></div>{loading ? <Empty title="Carregando clientes…" body="Buscando registros no Supabase."/> : clients.length ? <div className="table-wrap"><table><thead><tr><th>CLIENTE</th><th>NICHO</th><th>MENSALIDADE</th><th>STATUS</th><th>CADASTRADO</th><th/></tr></thead><tbody>{clients.map(c => <tr key={c.id}><td><div className="client-cell"><div className="client-avatar">{initials(c.business)}</div><div><strong>{c.business}</strong><small>{c.name} · {c.email || 'Sem email'}</small></div></div></td><td>{c.niche || '—'}</td><td className="money-cell">{money(c.monthlyFee)}</td><td><Status value={c.status}/></td><td>{new Date(`${c.createdAt}T12:00:00`).toLocaleDateString('pt-BR')}</td><td><div className="row-actions"><button className="icon-btn" title="Editar" onClick={() => onEdit(c)}><Pencil size={15}/></button><button className="icon-btn danger-icon" title="Excluir" onClick={() => onDelete(c)}><Trash2 size={15}/></button></div></td></tr>)}</tbody></table></div> : <Empty title="Nenhum cliente cadastrado" body="Cadastre seu primeiro cliente. Os dados serão salvos na nuvem." action={<Button onClick={onNew}><Plus size={15}/> Novo cliente</Button>}/>}</Card></>
}
function Campaigns({ campaigns, clients, search, setSearch, selectedClient, setSelectedClient, onToggle, onExport }: { campaigns: Campaign[]; clients: Client[]; search: string; setSearch: (s: string) => void; selectedClient: string; setSelectedClient: (s: string) => void; onToggle: (c: Campaign) => void; onExport: () => void }) {
  return <><PageHeading eyebrow="MÍDIA PAGA" title="Campanhas" description="Controles locais de demonstração; ainda não alteram o Google Ads." action={<Button variant="secondary" onClick={onExport}><Download size={16}/> Exportar CSV</Button>}/><div className="notice"><div className="notice-icon"><ShieldCheck size={18}/></div><div><strong>Google Ads não conectado</strong><p>Ativar ou pausar aqui altera somente os exemplos da interface.</p></div></div><Card className="table-card"><div className="table-toolbar"><div className="searchbox"><Search size={16}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar campanha..."/></div><select className="select" value={selectedClient} onChange={e => setSelectedClient(e.target.value)}><option>Todos os clientes</option>{clients.map(c => <option key={c.id}>{c.business}</option>)}</select><span className="result-count">{campaigns.length} campanha(s)</span></div><CampaignTable campaigns={campaigns} onToggle={onToggle}/></Card></>
}
function CampaignTable({ campaigns, compact = false, onToggle }: { campaigns: Campaign[]; compact?: boolean; onToggle?: (c: Campaign) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>CAMPANHA</th><th>CLIENTE</th><th>STATUS</th><th>ORÇAMENTO/DIA</th><th>CLIQUES</th><th>CONVERSÕES</th><th>INVESTIMENTO</th>{!compact && <th>AÇÃO</th>}</tr></thead><tbody>{campaigns.map(c => <tr key={c.id}><td><div className="campaign-cell"><div className="campaign-icon"><Target size={16}/></div><div><strong>{c.name}</strong><small>{c.id} · {c.channel}</small></div></div></td><td>{c.client}</td><td><Status value={c.status}/></td><td className="money-cell">{money(c.budget)}</td><td>{integer(c.clicks)}</td><td>{integer(c.conversions)}</td><td className="money-cell">{money(c.spend)}</td>{!compact && <td><Button variant="secondary" onClick={() => onToggle?.(c)}>{c.status === 'Ativa' ? <><Pause size={14}/> Pausar</> : <><Play size={14}/> Ativar</>}</Button></td>}</tr>)}</tbody></table></div>
}
function Connections({ notify }: { notify: (s: string) => void }) { return <><PageHeading eyebrow="INTEGRAÇÕES" title="Contas Google Ads" description="A integração oficial ainda precisa ser configurada."/><Card className="connection-card"><div className="google-mark">G</div><div className="connection-copy"><h2>Google Ads</h2><p>O próximo módulo será OAuth seguro e backend para consultar contas, campanhas e métricas reais.</p><div className="connection-requirements"><strong>Necessário</strong><ul><li>OAuth Client ID e callback configurados</li><li>Segredos guardados no backend</li><li>Acesso aprovado à Google Ads API</li></ul></div><Button onClick={() => notify('Integração ainda não implementada. Não há conexão real ativa.')}>Preparar conexão</Button></div></Card></> }
function Reports({ onExport }: { onExport: () => void }) { return <><PageHeading eyebrow="DESEMPENHO" title="Relatórios" description="Exportação de campanhas de demonstração." action={<Button onClick={onExport}><Download size={16}/> Exportar CSV</Button>}/><Card className="report-card"><h3>Relatório CSV</h3><p>Exporta somente os exemplos de campanhas deste MVP.</p><Button onClick={onExport}><Download size={15}/> Baixar CSV</Button></Card></> }
function Insights({ campaigns }: { campaigns: Campaign[] }) { return <><PageHeading eyebrow="OTIMIZAÇÃO" title="Análises com IA" description="A análise por IA será adicionada depois da integração com dados reais."/><Card className="insight-card"><div className="insight-symbol"><Sparkles size={24}/></div><h2>Transforme dados em decisões</h2><p>Esta página ainda não chama um provedor de IA. Nenhuma recomendação fictícia é apresentada como real.</p><div className="insight-chips"><span>{campaigns.length} campanhas de exemplo</span><span>Integração pendente</span></div></Card></> }
function Alerts() { return <><PageHeading eyebrow="MONITORAMENTO" title="Alertas" description="Pendências de configuração."/><Card className="alert-item"><div className="alert-icon amber-bg"><Link2 size={19}/></div><div className="alert-copy"><strong>Google Ads não conectado</strong><p>As métricas continuam em modo de demonstração.</p><small><Clock3 size={13}/> Configuração pendente</small></div><Status value="Pendente"/></Card></> }
function History() { return <><PageHeading eyebrow="SEGURANÇA" title="Histórico de atividades" description="A auditoria persistente será implementada numa etapa futura."/><Card className="table-card"><div className="empty"><div className="empty-icon"><Cloud size={22}/></div><h3>Nenhuma atividade no servidor</h3><p>O histórico avançado ainda não foi implementado.</p></div></Card></> }
function SettingsPage({ notify }: { notify: (s: string) => void }) { return <><PageHeading eyebrow="SISTEMA" title="Configurações" description="Status da configuração atual."/><Card className="setting-card"><div className="setting-heading"><div className="setting-icon"><ShieldCheck size={19}/></div><div><h3>Autenticação e banco</h3><p>Supabase Auth e clientes estão conectados neste MVP.</p></div></div><div className="setting-row"><div><strong>Login</strong><small>Supabase Auth</small></div><Status value="Ativo"/></div><div className="setting-row"><div><strong>Clientes</strong><small>Banco Supabase com RLS</small></div><Status value="Ativo"/></div><div className="setting-row"><div><strong>Google Ads</strong><small>Backend e OAuth pendentes</small></div><Status value="Pausado"/></div><Button variant="secondary" onClick={() => notify('Próxima etapa: integrar a API oficial do Google Ads com backend seguro.')}>Ver próximos passos</Button></Card></> }
