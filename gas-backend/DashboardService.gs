/**
 * @file DashboardService.gs
 * Handles aggregation and analytics
 */

const DashboardService = {
  
  getKPIs: () => {
    const d = new Date();
    const currentMonth = d.getMonth();
    const currentYear = d.getFullYear();
    
    const quotes = QuotesService.helper().getAll({}, 1, 10000).data;
    const invoices = InvoicesService.helper().getAll({}, 1, 10000).data;

    let revenueMonth = 0;
    let revenueYear = 0;
    let revenueMonthPrev = 0;
    
    let pendingQuotesCount = 0;
    let pendingQuotesAmount = 0;
    
    let unpaidInvoicesCount = 0;
    let unpaidInvoicesAmount = 0;
    
    let overdueInvoicesCount = 0;
    let overdueInvoicesAmount = 0;
    
    let totalQuotesCount = 0;
    let acceptedQuotesCount = 0;
    
    const clientsRevenue = {};

    invoices.forEach(inv => {
      const invDate = new Date(inv.issue_date);
      const ttc = parseFloat(inv.total_ttc) || 0;
      const amountPaid = parseFloat(inv.amount_paid) || 0;
      const remaining = ttc - amountPaid;

      // Unpaid & Overdue
      if (inv.status !== 'paid') {
        unpaidInvoicesCount++;
        unpaidInvoicesAmount += remaining;
        
        if (isOverdue(inv.due_date)) {
          overdueInvoicesCount++;
          overdueInvoicesAmount += remaining;
        }
      }

      // Revenue (based on payment_date if paid, or issue_date simplistically)
      // For accuracy, let's use amount_paid if > 0, otherwise rely on status.
      // Usually revenue is recognized either on invoice date or payment date. Let's use issue_date for simplicity.
      if (invDate.getFullYear() === currentYear) {
        revenueYear += ttc;
        if (invDate.getMonth() === currentMonth) {
          revenueMonth += ttc;
        } else if (invDate.getMonth() === currentMonth - 1 || (currentMonth === 0 && invDate.getMonth() === 11)) {
          revenueMonthPrev += ttc;
        }
      }

      // Top clients aggregation
      const clientId = inv.company_id || inv.contact_id;
      if (clientId && inv.status !== 'cancelled') {
        if (!clientsRevenue[clientId]) clientsRevenue[clientId] = 0;
        clientsRevenue[clientId] += ttc;
      }
    });

    quotes.forEach(q => {
      totalQuotesCount++;
      const ttc = parseFloat(q.total_ttc) || 0;
      
      if (q.status === 'draft' || q.status === 'sent') {
        pendingQuotesCount++;
        pendingQuotesAmount += ttc;
      } else if (q.status === 'accepted' || q.status === 'converted') {
        acceptedQuotesCount++;
      }
    });

    const conversionRate = totalQuotesCount > 0 ? Math.round((acceptedQuotesCount / totalQuotesCount) * 100) : 0;

    // Sort Top Clients
    const topClientsIds = Object.keys(clientsRevenue)
      .sort((a, b) => clientsRevenue[b] - clientsRevenue[a])
      .slice(0, 5);
      
    // Fetch names for top clients
    const topClients = topClientsIds.map(id => {
      let name = 'Unknown';
      try {
        const c = CompaniesService.getById(id);
        if (c) name = c.name;
        else {
          const u = ContactsService.getById(id);
          if (u) name = `${u.first_name} ${u.last_name}`;
        }
      } catch (e) {}
      return { id, name, revenue: clientsRevenue[id] };
    });

    return {
      revenue_month: Number(revenueMonth.toFixed(2)),
      revenue_year: Number(revenueYear.toFixed(2)),
      revenue_month_prev: Number(revenueMonthPrev.toFixed(2)),
      quotes_pending: { count: pendingQuotesCount, amount: Number(pendingQuotesAmount.toFixed(2)) },
      invoices_unpaid: { count: unpaidInvoicesCount, amount: Number(unpaidInvoicesAmount.toFixed(2)) },
      invoices_overdue: { count: overdueInvoicesCount, amount: Number(overdueInvoicesAmount.toFixed(2)) },
      conversion_rate: conversionRate,
      top_clients: topClients
    };
  },

  getRevenueChart: (year) => {
    const targetYear = parseInt(year, 10) || new Date().getFullYear();
    const invoices = InvoicesService.helper().getAll({}, 1, 10000).data;
    const quotes = QuotesService.helper().getAll({}, 1, 10000).data;
    
    const chart = Array.from({length: 12}, (_, i) => ({
      month: i + 1,
      revenue: 0,
      collected: 0,
      quotes: 0
    }));
    
    invoices.forEach(inv => {
      const date = new Date(inv.issue_date);
      if (date.getFullYear() === targetYear) {
        const m = date.getMonth();
        chart[m].revenue += (parseFloat(inv.total_ttc) || 0);
        chart[m].collected += (parseFloat(inv.amount_paid) || 0);
      }
    });

    quotes.forEach(q => {
      const date = new Date(q.created_at);
      if (date.getFullYear() === targetYear && q.status !== 'cancelled') {
        const m = date.getMonth();
        chart[m].quotes += (parseFloat(q.total_ttc) || 0);
      }
    });

    // Format numbers
    chart.forEach(c => {
      c.revenue = Number(c.revenue.toFixed(2));
      c.collected = Number(c.collected.toFixed(2));
      c.quotes = Number(c.quotes.toFixed(2));
    });

    return chart;
  },

  getActivityFeed: (limit = 20) => {
    const feed = [];
    
    // Simplistic feed logic: grab latest items from all tables
    const modules = [
      { s: ContactsService.helper(), type: 'contact' },
      { s: CompaniesService.helper(), type: 'company' },
      { s: PipelineService.helper(), type: 'pipeline' },
      { s: QuotesService.helper(), type: 'quote' },
      { s: InvoicesService.helper(), type: 'invoice' }
    ];

    modules.forEach(m => {
      try {
        // Fetch last 20 from each to be safe
        const res = m.s.getAll({}, 1, 20);
        res.data.forEach(item => {
          feed.push({
            id: item.id,
            type: m.type,
            action: 'created',
            date: item.created_at,
            title: item.title || item.number || item.name || `${item.first_name} ${item.last_name}`
          });
          if (item.updated_at && item.updated_at !== item.created_at) {
            feed.push({
              id: item.id,
              type: m.type,
              action: 'updated',
              date: item.updated_at,
              title: item.title || item.number || item.name || `${item.first_name} ${item.last_name}`
            });
          }
        });
      } catch (e) {
        // Ignore sheet errors
      }
    });

    // Sort descending by date
    feed.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    return feed.slice(0, parseInt(limit, 10));
  }
};
