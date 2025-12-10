/**
 * Replay Webhook Test Script
 *
 * Reads captured webhook payloads from Supabase and replays them to the n8n webhook.
 *
 * Usage:
 *   node scripts/replay-webhook-test.js                    # List all captured payloads
 *   node scripts/replay-webhook-test.js MARCHON           # Replay Marchon payload
 *   node scripts/replay-webhook-test.js --all             # Replay all vendors with 5s delay
 *   node scripts/replay-webhook-test.js --all --delay=10  # Custom delay (seconds)
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const axios = require('axios');

// Config
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
const WEBHOOK_URL = 'https://n8n.opti-profit.com/webhook/9f96a3ec-cf85-40f4-9bc9-338424768726';

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function listPayloads() {
    const { data, error } = await supabase
        .from('webhook_test_payloads')
        .select('vendor_code, vendor_name, description, captured_at, use_count, is_active')
        .order('vendor_code');

    if (error) {
        console.error('Error fetching payloads:', error.message);
        return;
    }

    console.log('\n=== Captured Webhook Payloads ===\n');
    if (data.length === 0) {
        console.log('No payloads captured yet.');
        console.log('Forward a test email to capture it automatically.\n');
        return;
    }

    console.log('Vendor Code    | Active | Uses | Captured             | Description');
    console.log('-'.repeat(90));
    data.forEach(p => {
        const active = p.is_active ? '✓' : '✗';
        const captured = new Date(p.captured_at).toLocaleString();
        const desc = (p.description || '').substring(0, 30);
        console.log(`${p.vendor_code.padEnd(14)} | ${active.padEnd(6)} | ${String(p.use_count).padEnd(4)} | ${captured.padEnd(20)} | ${desc}`);
    });
    console.log('\nUsage: node scripts/replay-webhook-test.js <VENDOR_CODE>');
    console.log('       node scripts/replay-webhook-test.js --all\n');
}

async function replayPayload(vendorCode) {
    console.log(`\nFetching payload for ${vendorCode}...`);

    const { data, error } = await supabase
        .from('webhook_test_payloads')
        .select('*')
        .eq('vendor_code', vendorCode.toUpperCase())
        .eq('is_active', true)
        .single();

    if (error || !data) {
        console.error(`No active payload found for ${vendorCode}`);
        return false;
    }

    console.log(`Replaying: ${data.description || vendorCode}`);
    console.log(`Sending to: ${WEBHOOK_URL}`);

    try {
        const response = await axios.post(WEBHOOK_URL, data.payload, {
            headers: { 'Content-Type': 'application/json' },
            timeout: 60000
        });

        console.log(`✅ Response: ${response.status} ${response.statusText}`);

        // Update use count
        await supabase
            .from('webhook_test_payloads')
            .update({
                use_count: data.use_count + 1,
                last_used_at: new Date().toISOString()
            })
            .eq('id', data.id);

        return true;
    } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        if (err.response) {
            console.error(`   Status: ${err.response.status}`);
            console.error(`   Body: ${JSON.stringify(err.response.data).substring(0, 200)}`);
        }
        return false;
    }
}

async function replayAll(delaySeconds = 5) {
    const { data, error } = await supabase
        .from('webhook_test_payloads')
        .select('vendor_code')
        .eq('is_active', true)
        .order('vendor_code');

    if (error || !data || data.length === 0) {
        console.log('No active payloads to replay.');
        return;
    }

    console.log(`\nReplaying ${data.length} payloads with ${delaySeconds}s delay between each...\n`);

    let success = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
        const vendor = data[i].vendor_code;
        console.log(`\n[${i + 1}/${data.length}] ${vendor}`);

        const result = await replayPayload(vendor);
        if (result) success++;
        else failed++;

        if (i < data.length - 1) {
            console.log(`Waiting ${delaySeconds}s...`);
            await new Promise(r => setTimeout(r, delaySeconds * 1000));
        }
    }

    console.log(`\n=== Complete ===`);
    console.log(`Success: ${success}, Failed: ${failed}`);
}

// Main
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        await listPayloads();
        return;
    }

    if (args[0] === '--all') {
        const delayArg = args.find(a => a.startsWith('--delay='));
        const delay = delayArg ? parseInt(delayArg.split('=')[1]) : 5;
        await replayAll(delay);
        return;
    }

    // Single vendor
    await replayPayload(args[0]);
}

main().catch(console.error);
