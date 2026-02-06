useEffect(() => {
  supabase
    .from("returns")
    .select(`
      id,
      return_reason,
      condition_on_return,
      decision,
      created_at,
      orders (
        id,
        seller_id,
        total_amount
      )
    `)
    .eq("return_status", "inspected")
    .eq("decision", "dispute")
    .then(({ data }) => setReturns(data));
}, []);
