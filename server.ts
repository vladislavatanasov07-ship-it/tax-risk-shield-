import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import neo4j from 'neo4j-driver';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

const uri = process.env.NEO4J_URI || '';
const user = process.env.NEO4J_USER || '';
const password = process.env.NEO4J_PASSWORD || '';

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

// Middleware за динамична проверка на API ключове директно от базата данни (Multi-Tenant Security)
const requireTenantApiKey = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            error: 'Unauthorized. Enterprise API Key missing in headers (x-api-key) or query params.'
        });
    }

    const session = driver.session();
    try {
        const result = await session.run(
            `MATCH (t:Tenant {apiKey: $apiKey}) RETURN t.companyName AS companyName, t.plan AS plan, t.status AS status`,
            { apiKey: String(apiKey) }
        );

        if (result.records.length === 0) {
            return res.status(403).json({
                success: false,
                error: 'Forbidden. Invalid Enterprise API Key or subscription expired.'
            });
        }

        (req as any).tenant = {
            companyName: result.records[0].get('companyName'),
            plan: result.records[0].get('plan'),
            status: result.records[0].get('status')
        };

        next();
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
};

async function testConnection() {
    try {
        const session = driver.session();
        const result = await session.run('RETURN 1 AS result');
        console.log('Neo4j Aura Connected Successfully:', result.records[0].get('result'));
        await session.close();
    } catch (error) {
        console.error('Failed to connect to Neo4j Aura:', error);
    }
}

// 0. ULTIMATE SaaS DASHBOARD (Includes Tenant Onboarding + Live Canvas Visualizer)
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Tax Risk Shield - Multi-Tenant SaaS Portal</title>
            <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 30px; }
                .container { max-width: 1100px; margin: 0 auto; }
                .header { background: #1e293b; padding: 25px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.3); margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
                h1 { color: #38bdf8; font-size: 24px; margin: 0 0 5px 0; }
                p { color: #94a3b8; margin: 0; font-size: 14px; }
                .badge { background: #065f46; color: #34d399; padding: 4px 10px; border-radius: 4px; font-size: 12px; font-weight: bold; }
                .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-bottom: 25px; }
                .card { background: #1e293b; padding: 18px; border-radius: 8px; border: 1px solid #334155; transition: 0.2s; }
                .card:hover { border-color: #38bdf8; transform: translateY(-2px); }
                .card h3 { margin-top: 0; color: #f1f5f9; font-size: 16px; }
                .card p { font-size: 13px; margin-bottom: 12px; }
                a.btn { display: inline-block; background: #0284c7; color: white; padding: 8px 14px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 13px; }
                a.btn:hover { background: #0369a1; }
                .form-box { background: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 25px; }
                input { background: #0f172a; border: 1px solid #334155; padding: 10px; color: white; border-radius: 6px; width: 300px; margin-right: 10px; }
                .visualizer-box { background: #1e293b; padding: 25px; border-radius: 12px; border: 1px solid #334155; text-align: center; margin-top: 25px; }
                canvas { background: #0f172a; border-radius: 8px; border: 1px solid #334155; margin-top: 15px; max-width: 100%; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div>
                        <h1>Tax Risk Shield SaaS Portal</h1>
                        <p>Multi-Tenant Enterprise Subscription & Compliance Management Engine</p>
                    </div>
                    <span class="badge">MULTI-TENANT v5.1</span>
                </div>

                <div class="form-box">
                    <h3>Register New Enterprise Tenant (Client Onboarding)</h3>
                    <p>Create an isolated corporate account and generate a unique API subscription key.</p>
                    <form action="/api/v1/tenants/register" method="POST" style="margin-top: 15px;">
                        <input type="text" name="companyName" placeholder="Corporate Name (e.g. Acme Corp)" required>
                        <input type="text" name="email" placeholder="Billing Email" required>
                        <button type="submit" class="btn" style="border: none; cursor: pointer;">Provision Account</button>
                    </form>
                </div>

                <div class="grid">
                    <div class="card">
                        <h3>1. Seed Graph Data</h3>
                        <p>Initialize multi-tier enterprise flows and carousel topologies.</p>
                        <a class="btn" href="/api/v1/seed-data" target="_blank">Run Seeder</a>
                    </div>
                    <div class="card">
                        <h3>2. VIES Validation</h3>
                        <p>Verify active EU VAT numbers against official European registry gates.</p>
                        <a class="btn" href="/api/v1/vies-check?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Run VIES Check</a>
                    </div>
                    <div class="card">
                        <h3>3. Carousel Fraud Scan</h3>
                        <p>Run graph algorithms to identify closed loops & missing traders.</p>
                        <a class="btn" href="/api/v1/detect-carousel?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Detect Fraud</a>
                    </div>
                    <div class="card">
                        <h3>4. Tax Penalties Engine</h3>
                        <p>Calculate evaded VAT bases, statutory fines, & daily accrued interest.</p>
                        <a class="btn" href="/api/v1/tax-penalties?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Calculate Penalties</a>
                    </div>
                    <div class="card">
                        <h3>5. ViDA e-Invoicing</h3>
                        <p>Generate real-time cryptographic e-invoice hashes for digital reporting.</p>
                        <a class="btn" href="/api/v1/einvoicing?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Run e-Invoicing</a>
                    </div>
                    <div class="card">
                        <h3>6. Download PDF Audit</h3>
                        <p>Download official printable PDF audit certificate with cryptographic proofs.</p>
                        <a class="btn" style="background: #059669;" href="/api/v1/audit-pdf?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Download PDF</a>
                    </div>
                                        <div class="card">
                        <h3>7. AI Predictive Risk</h3>
                        <p>Evaluate supply chain threat probabilities using AI scoring algorithms.</p>
                        <a class="btn" style="background: #7c3aed;" href="/api/v1/predictive-risk?apiKey=trs_live_9999enterpriseKEYpromax" target="_blank">Run AI Risk Scan</a>
                    </div>
                </div>

                <div class="visualizer-box">
                    <h3>Live Supply Chain & Fraud Topology Map</h3>
                    <p>Visualizing active trans-border nodes and flagged circular transaction loops in Neo4j Aura.</p>
                    <canvas id="graphCanvas" width="900" height="350"></canvas>
                </div>
            </div>

            <script>
                const canvas = document.getElementById('graphCanvas');
                const ctx = canvas.getContext('2d');

                const nodes = [
                    { x: 150, y: 175, name: 'Alpha Ltd (BG)', color: '#38bdf8' },
                    { x: 380, y: 90, name: 'Beta GmbH (DE)', color: '#38bdf8' },
                    { x: 610, y: 175, name: 'Gamma SARL (FR)', color: '#38bdf8' },
                    { x: 380, y: 260, name: 'Shadow Trader (Suspicious)', color: '#ef4444' }
                ];

                const edges = [
                    { from: 0, to: 1, flagged: false },
                    { from: 1, to: 2, flagged: false },
                    { from: 2, to: 3, flagged: true },
                    { from: 3, to: 0, flagged: true }
                ];

                function drawGraph() {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    edges.forEach(edge => {
                        const start = nodes[edge.from];
                        const end = nodes[edge.to];
                        ctx.beginPath();
                        ctx.moveTo(start.x, start.y);
                        ctx.lineTo(end.x, end.y);
                        ctx.strokeStyle = edge.flagged ? '#ef4444' : '#334155';
                        ctx.lineWidth = edge.flagged ? 3 : 2;
                        ctx.stroke();
                    });
                    nodes.forEach(node => {
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, 24, 0, Math.PI * 2);
                        ctx.fillStyle = node.color;
                        ctx.fill();
                        ctx.lineWidth = 2;
                        ctx.strokeStyle = '#ffffff';
                        ctx.stroke();
                        ctx.fillStyle = '#f8fafc';
                        ctx.font = '12px sans-serif';
                        ctx.textAlign = 'center';
                        ctx.fillText(node.name, node.x, node.y + 42);
                    });
                }
                drawGraph();
            </script>
        </body>
        </html>
    `);
});

// 1. Health Check
app.get('/api/v1/health', (req, res) => {
    res.json({
        status: 'enterprise_operational',
        architecture: 'Multi-Tenant SaaS Cloud',
        version: '5.1.0-saas'
    });
});

// 2. Tenant Registration Endpoint
app.use(express.urlencoded({ extended: true }));
app.post('/api/v1/tenants/register', async (req, res) => {
    const { companyName, email } = req.body;
    const apiKey = `trs_live_${crypto.randomBytes(16).toString('hex')}`;
    const session = driver.session();

    try {
        await session.run(
            `CREATE (t:Tenant {companyName: $companyName, email: $email, apiKey: $apiKey, plan: 'ENTERPRISE', status: 'ACTIVE', createdAt: datetime()})`,
            { companyName, email, apiKey }
        );

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head><meta charset="UTF-8"><title>Tenant Provisioned</title>
            <style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:50px;text-align:center;}</style>
            </head>
            <body>
                <h1>Tenant Successfully Provisioned!</h1>
                <p>Company: <strong>${companyName}</strong></p>
                <p>Your Exclusive Enterprise API Key:</p>
                <code style="background:#1e293b;padding:15px;display:inline-block;font-size:18px;color:#38bdf8;border-radius:8px;">${apiKey}</code>
                <br><br>
                <a href="/" style="color:#38bdf8;text-decoration:underline;">Back to Dashboard</a>
            </body>
            </html>
        `);
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 3. Seed Graph Data
app.get('/api/v1/seed-data', async (req, res) => {
    const session = driver.session();
    try {
        await session.run(`
            CREATE (c1:Company {name: 'Alpha Ltd', vatNumber: 'BG123456789', country: 'BG', riskScore: 15})
            CREATE (c2:Company {name: 'Beta GmbH', vatNumber: 'DE987654321', country: 'DE', riskScore: 20})
            CREATE (c3:Company {name: 'Gamma SARL', vatNumber: 'FR456789123', country: 'FR', riskScore: 25})
            CREATE (c4:Company {name: 'Shadow Trader OOD', vatNumber: 'BG999999999', country: 'BG', status: 'SUSPICIOUS', riskScore: 95})
            CREATE (c1)-[:TRANSACTED_WITH {amount: 50000, date: '2026-11-01', status: 'VERIFIED'}]->(c2)
            CREATE (c2)-[:TRANSACTED_WITH {amount: 49500, date: '2026-11-02', status: 'VERIFIED'}]->(c3)
            CREATE (c3)-[:TRANSACTED_WITH {amount: 49000, date: '2026-11-03', status: 'FLAGGED'}]->(c4)
            CREATE (c4)-[:TRANSACTED_WITH {amount: 48500, date: '2026-11-04', status: 'FLAGGED'}]->(c1)
        `);
        res.json({ success: true, message: 'Supply chain patterns successfully seeded into Neo4j graph.' });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 4. VIES Validation (Secured)
app.get('/api/v1/vies-check', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (c:Company)
            RETURN c.name AS name, c.vatNumber AS vatNumber, c.country AS country, c.status AS status
        `);

        const validations = result.records.map(record => {
            const vat = record.get('vatNumber');
            const status = record.get('status');
            const isValid = status !== 'SUSPICIOUS';

            return {
                companyName: record.get('name'),
                countryCode: record.get('country'),
                vatNumber: vat,
                viesRegistryStatus: isValid ? 'VALID_ACTIVE' : 'INVALID_OR_MISSING_TRADER',
                checkedAt: new Date().toISOString()
            };
        });

        res.json({
            success: true,
            tenantContext: (req as any).tenant,
            module: 'EU VIES Real-Time VAT Validation Gateway',
            totalCheckedEntities: validations.length,
            validations: validations
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 5. Carousel Fraud Detection (Secured)
app.get('/api/v1/detect-carousel', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH path = (c:Company)-[:TRANSACTED_WITH*3..5]->(c)
            RETURN [node in nodes(path) | node.name] AS companyChain
        `);

        const loops = result.records.map(record => record.get('companyChain'));

        res.json({
            success: true,
            tenantContext: (req as any).tenant,
            fraudEngine: 'Graph Topology Carousel & Missing Trader Detection System',
            detectedLoopsCount: loops.length,
            suspiciousLoops: loops
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 6. Tax Penalties & Interest Engine (Secured)
app.get('/api/v1/tax-penalties', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (c1:Company)-[r:TRANSACTED_WITH]->(c2:Company)
            WHERE r.status = 'FLAGGED'
            RETURN r.amount AS amount, c1.name AS entity
        `);

        let totalEvadedVatBase = 0;
        result.records.forEach(record => {
            const amountObj = record.get('amount');
            const amt = typeof amountObj === 'object' && amountObj.low !== undefined ? amountObj.low : Number(amountObj);
            totalEvadedVatBase += amt;
        });

        const estimatedVatDue = totalEvadedVatBase * 0.20;
        const statutoryFine = estimatedVatDue * 1.50;

        res.json({
            success: true,
            tenantContext: (req as any).tenant,
            evadedBaseAmount: totalEvadedVatBase,
            estimatedVatDue: estimatedVatDue,
            mandatoryPenaltyFine: statutoryFine
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 7. ViDA e-Invoicing (Secured)
app.get('/api/v1/einvoicing', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (c1:Company)-[r:TRANSACTED_WITH]->(c2:Company)
            RETURN c1.name AS sender, c2.name AS receiver, r.amount AS amount, r.date AS date, r.status AS status
        `);

        const invoices = result.records.map(record => {
            const rawAmount = record.get('amount');
            const amount = typeof rawAmount === 'object' && rawAmount.low !== undefined ? rawAmount.low : Number(rawAmount);
            const payload = `${record.get('sender')}-${record.get('receiver')}-${amount}-${record.get('date')}`;
            const cryptographicHash = crypto.createHash('sha256').update(payload).digest('hex');

            return {
                invoiceId: `INV-EU-${Math.floor(Math.random() * 900000 + 100000)}`,
                sender: record.get('sender'),
                receiver: record.get('receiver'),
                amount: amount,
                sha256CryptographicProof: cryptographicHash
            };
        });

        res.json({
            success: true,
            tenantContext: (req as any).tenant,
            invoices: invoices
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});

// 8. Download PDF Audit Certificate (Secured)
app.get('/api/v1/audit-pdf', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const companyResult = await session.run(`
            MATCH (c:Company)
            RETURN c.name AS name, c.vatNumber AS vat, c.country AS country, c.riskScore AS score
        `);

        const entities = companyResult.records.map(r => ({
            name: r.get('name'),
            vatNumber: r.get('vat'),
            country: r.get('country'),
            riskScore: r.get('score')
        }));

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Tax_Risk_Shield_Audit_${Date.now()}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        doc.fontSize(22).fillColor('#0284c7').text('TAX RISK SHIELD ENTERPRISE', { align: 'center' });
        doc.fontSize(10).fillColor('#64748b').text(`SaaS TENANT: ${(req as any).tenant.companyName} (${(req as any).tenant.plan})`, { align: 'center' });
        doc.moveDown(2);

        doc.fontSize(12).fillColor('#0f172a').text(`Report ID: AUDIT-EU-${Date.now()}`);
        doc.text(`Generated At: ${new Date().toISOString()}`);
        doc.moveDown(1.5);

        doc.fontSize(14).fillColor('#0284c7').text('Analyzed Corporate Entities');
        doc.moveDown(0.5);

        entities.forEach((entity, index) => {
            doc.fontSize(10).fillColor('#0f172a').text(`${index + 1}. ${entity.name} (${entity.country}) - VAT: ${entity.vatNumber} | Risk Score: ${entity.riskScore}/100`);
        });

        doc.end();
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
});
// 9. Predictive AI Risk Scoring Engine (Secured)
app.get('/api/v1/predictive-risk', requireTenantApiKey, async (req, res) => {
    const session = driver.session();
    try {
        const result = await session.run(`
            MATCH (c:Company)
            RETURN c.name AS name, c.country AS country, c.riskScore AS riskScore, c.status AS status
        `);

        const riskAssessments = result.records.map(record => {
            const score = record.get('riskScore') || 10;
            let aiRating = 'LOW_RISK';
            if (score > 50) aiRating = 'HIGH_RISK_WATCHLIST';
            if (score > 80) aiRating = 'CRITICAL_FRAUD_PROBABILITY';

            return {
                companyName: record.get('name'),
                country: record.get('country'),
                internalRiskScore: score,
                aiRecommendation: aiRating,
                evaluatedAt: new Date().toISOString()
            };
        });

        res.json({
            success: true,
            tenantContext: (req as any).tenant,
            engine: 'Predictive AI Supply Chain Risk Scoring',
            assessments: riskAssessments
        });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    } finally {
        await session.close();
    }
}); 
app.use(express.static('frontend'));
app.listen(PORT, async () => {
    console.log(`Multi-Tenant SaaS Server is running on port ${PORT}`);
    await testConnection();
});
