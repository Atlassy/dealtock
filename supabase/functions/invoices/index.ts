// supabase/functions/bills/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )
  
  // Get user from auth header
  const authHeader = req.headers.get('Authorization')!
  const token = authHeader.replace('Bearer ', '')
  const { data: { user } } = await supabase.auth.getUser(token)
  
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }
  
  const url = new URL(req.url)
  const path = url.pathname.replace('/functions/v1/bills', '')
  
  // Route handling
  switch (req.method) {
    case 'GET':
      if (path === '/list') {
        return handleGetBillsList(req, supabase, user)
      } else if (path.match(/\/\w+$/)) {
        const billId = path.split('/').pop()
        return handleGetBillDetail(billId, supabase, user)
      }
      break
    case 'POST':
      if (path === '/generate-pdf') {
        return handleGeneratePDF(req, supabase, user)
      }
      break
  }
  
  return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
})

async function handleGetBillsList(req, supabase, user) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const pageSize = parseInt(searchParams.get('pageSize') || '20')
  const status = searchParams.get('status')
  const search = searchParams.get('search')
  
  let query = supabase
    .from('admin_bills_overview')
    .select('*', { count: 'exact' })
  
  // Apply filters
  if (status && status !== 'all') {
    query = query.eq('bill_status', status)
  }
  
  if (search) {
    query = query.or(`bill_number.ilike.%${search}%,order_number.ilike.%${search}%,seller_name.ilike.%${search}%`)
  }
  
  // Pagination
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  
  const { data, count, error } = await query
    .order('bill_date', { ascending: false })
    .range(from, to)
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify({
    data,
    pagination: {
      page,
      pageSize,
      total: count,
      totalPages: Math.ceil(count / pageSize)
    }
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handleGetBillDetail(billId, supabase, user) {
  const { data, error } = await supabase
    .from('order_oversight_with_bills')
    .select('*')
    .eq('bill_id', billId)
    .single()
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function handleGeneratePDF(req, supabase, user) {
  const { billId } = await req.json()
  
  // Call PDF generation service (can be another Edge Function or external service)
  const { data, error } = await supabase.functions.invoke('generate-bill-pdf', {
    body: { billId }
  })
  
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  })
}