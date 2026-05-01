const http = require('http');

async function fetchApi(path, options = {}) {
    const url = `http://127.0.0.1:3000${path}`;
    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch(e) { data = text; }
    
    // Extract set-cookie if login
    let cookie = res.headers.get('set-cookie');
    
    return { status: res.status, data, cookie };
}

async function runTests() {
    console.log("Starting QA Tests...");
    const results = [];
    let adminCookie, agent1Cookie, agent2Cookie;
    
    function report(name, pass, notes = "") {
        console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name} ${notes ? '- ' + notes : ''}`);
        results.push({ name, pass, notes });
    }

    // 1. Setup & Auth
    try {
        await fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Admin', email: 'admin@test.com', password: 'Admin123', role: 'admin' }) });
        await fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Agent1', email: 'agent1@test.com', password: 'Agent123', role: 'agent' }) });
        await fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify({ name: 'Agent2', email: 'agent2@test.com', password: 'Agent234', role: 'agent' }) }); // using 234 in case of dup
        
        const loginAdmin = await fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@test.com', password: 'Admin123' }) });
        adminCookie = loginAdmin.cookie?.split(';')[0];
        report("Admin Login", loginAdmin.status === 200 && !!adminCookie, "Got cookie");

        const loginAgent1 = await fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agent1@test.com', password: 'Agent123' }) });
        agent1Cookie = loginAgent1.cookie?.split(';')[0];
        report("Agent1 Login", loginAgent1.status === 200 && !!agent1Cookie, "Got cookie");

        const loginAgent2 = await fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'agent2@test.com', password: 'Agent234' }) });
        agent2Cookie = loginAgent2.cookie?.split(';')[0];
        
        const loginFail = await fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'admin@test.com', password: 'wrong' }) });
        report("Wrong password returns 401", loginFail.status === 401, `Status: ${loginFail.status}`);
    } catch(e) { console.error(e); }

    const adminOpts = { headers: { cookie: adminCookie } };
    const agent1Opts = { headers: { cookie: agent1Cookie } };
    const agent2Opts = { headers: { cookie: agent2Cookie } };

    // 2. Lead CRUD & Scoring
    let leadHigh, leadMedium, leadLow;
    try {
        const h = await fetchApi('/api/leads', { method: 'POST', ...adminOpts, body: JSON.stringify({ name: 'L1', email: 'l1@x.com', phone: '123', propertyInterest: 'A', budget: 25000000 }) });
        leadHigh = h.data;
        report("Lead Budget >20M is High", leadHigh.score === 'High', `Score: ${leadHigh.score}`);

        const m = await fetchApi('/api/leads', { method: 'POST', ...adminOpts, body: JSON.stringify({ name: 'L2', email: 'l2@x.com', phone: '456', propertyInterest: 'B', budget: 15000000 }) });
        leadMedium = m.data;
        report("Lead Budget 10M-20M is Medium", leadMedium.score === 'Medium', `Score: ${leadMedium.score}`);

        const l = await fetchApi('/api/leads', { method: 'POST', ...adminOpts, body: JSON.stringify({ name: 'L3', email: 'l3@x.com', phone: '789', propertyInterest: 'C', budget: 5000000 }) });
        leadLow = l.data;
        report("Lead Budget <10M is Low", leadLow.score === 'Low', `Score: ${leadLow.score}`);

        const allLeads = await fetchApi('/api/leads', adminOpts);
        report("Admin GET sees leads", Array.isArray(allLeads.data) && allLeads.data.length >= 3, `Count: ${allLeads.data?.length}`);

        const updateStatus = await fetchApi(`/api/leads/${leadHigh._id}`, { method: 'PUT', ...adminOpts, body: JSON.stringify({ status: 'Contacted' }) });
        report("Admin updates status", updateStatus.data?.status === 'Contacted', `Status: ${updateStatus.data?.status}`);

        const agentDelete = await fetchApi(`/api/leads/${leadLow._id}`, { method: 'DELETE', ...agent1Opts });
        report("Agent cannot delete (403)", agentDelete.status === 403, `Status: ${agentDelete.status}`);

        const adminDelete = await fetchApi(`/api/leads/${leadLow._id}`, { method: 'DELETE', ...adminOpts });
        report("Admin deletes lead (200)", adminDelete.status === 200, `Status: ${adminDelete.status}`);
    } catch(e) { console.error(e); }

    // 3. Lead Assignment
    try {
        const me1 = await fetchApi('/api/auth/me', agent1Opts);
        const a1Id = me1.data?.user?.userId;
        const me2 = await fetchApi('/api/auth/me', agent2Opts);
        const a2Id = me2.data?.user?.userId;

        const assign1 = await fetchApi(`/api/leads/${leadHigh._id}/assign`, { method: 'PUT', ...adminOpts, body: JSON.stringify({ agentId: a1Id }) });
        report("Admin assigns lead", assign1.status === 200, "Assigned to Agent1");

        const agent1Leads = await fetchApi('/api/leads', agent1Opts);
        report("Agent1 sees assigned lead", agent1Leads.data?.some(l => l._id === leadHigh._id), "Found lead");

        const agent2Leads = await fetchApi('/api/leads', agent2Opts);
        report("Agent2 does not see lead", !agent2Leads.data?.some(l => l._id === leadHigh._id), "Lead hidden");

        await fetchApi(`/api/leads/${leadHigh._id}/assign`, { method: 'PUT', ...adminOpts, body: JSON.stringify({ agentId: a2Id }) });
        
        const agent2LeadsUpdated = await fetchApi('/api/leads', agent2Opts);
        report("Agent2 sees reassigned lead", agent2LeadsUpdated.data?.some(l => l._id === leadHigh._id), "Found lead");
    } catch(e) { console.error(e); }

    // 5. WhatsApp Link
    report("WhatsApp Phone format", !!leadHigh?.phone, "Phone present");

    // 7. Activity Timeline
    try {
        const acts = await fetchApi(`/api/leads/${leadHigh._id}/activities`, adminOpts);
        const hasCreated = acts.data?.some(a => a.action === 'Lead Created');
        const hasStatus = acts.data?.some(a => a.action === 'Status Updated');
        const hasAssign = acts.data?.some(a => a.action === 'Lead Assigned');
        report("Activity Timeline contains actions", hasCreated && hasStatus && hasAssign, "Logs found");
    } catch(e) { console.error(e); }

    // 8. Follow-up Reminders
    try {
        const fu = await fetchApi('/api/followups', { method: 'POST', ...agent1Opts, body: JSON.stringify({ leadId: leadMedium._id, followUpDate: '2025-01-01', notes: 'call' }) });
        report("Set follow-up", fu.status === 200, "Created");
        const fus = await fetchApi('/api/followups', agent1Opts);
        report("GET follow-ups overdue", fus.data?.some(f => f.leadId._id === leadMedium._id && new Date(f.followUpDate) < new Date()), "Overdue found");
    } catch(e) { console.error(e); }

    // 9. Analytics Dashboard
    try {
        const stats = await fetchApi('/api/analytics/dashboard', adminOpts);
        report("Analytics Dashboard", stats.status === 200 && stats.data?.totalLeads !== undefined, "Data verified");
    } catch(e) { console.error(e); }

    // 10. RBAC & Rate Limiting
    try {
        const agentAdmin = await fetchApi('/api/analytics/dashboard', agent1Opts);
        report("Agent accessing Admin route (403)", agentAdmin.status === 403, `Status: ${agentAdmin.status}`);

        const noToken = await fetchApi('/api/leads');
        report("No token access (401)", noToken.status === 401, `Status: ${noToken.status}`);

        let rlStatus = 200;
        for(let i=0; i<52; i++) {
            const r = await fetchApi('/api/leads', agent1Opts);
            if(r.status === 429) rlStatus = 429;
        }
        report("Rate Limit hit (429)", rlStatus === 429, "50 req/min enforced");
    } catch(e) { console.error(e); }

    // 11. Validation Middleware
    try {
        const missingName = await fetchApi('/api/leads', { method: 'POST', ...adminOpts, body: JSON.stringify({ email: 'bad@x.com' }) });
        report("Validation missing fields (400)", missingName.status === 400, `Status: ${missingName.status}`);

        const invalidEmail = await fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: 'not-an-email', password: '123' }) });
        report("Validation invalid email (400)", invalidEmail.status === 400, `Status: ${invalidEmail.status}`);
    } catch(e) { console.error(e); }

    console.log("\n\n=== FINAL RESULTS ===");
    console.table(results);
}

runTests();
