/**
 * Glossary — central dictionary of payments + dashboard terms.
 * Used by InfoChip to surface short definitions inline next to terms.
 * Keep definitions to 1-2 sentences. Specific. No hype.
 */

export interface GlossaryEntry {
  term: string
  short: string
  long?: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  // Rails
  upi: {
    term: 'UPI',
    short: 'Unified Payments Interface. Real-time bank-to-bank rail run by NPCI.',
    long: 'Powers ~22B monthly transactions. Near-zero MDR, so revenue for payment processors comes from value-added services, not the rail itself.',
  },
  nach: {
    term: 'NACH',
    short: 'National Automated Clearing House. Recurring mandate rail for subscriptions, EMIs, SIPs.',
    long: 'Fee-bearing (~0.4% effective MDR). Fastest-growing fee rail in India. The Subscriptions product surface.',
  },
  bbps: {
    term: 'BBPS',
    short: 'Bharat Bill Payment System. Centralised infra for utility, telecom, insurance bills.',
    long: 'Operated by NPCI. The biller side is where Cashfree Biller plays.',
  },
  ccecom: {
    term: 'CC eCommerce',
    short: 'Credit card spend on online merchants. Primary MDR-bearing rail for payment gateways.',
    long: '~1.9-2.0% standard MDR. The core PA-PG revenue market.',
  },
  ccpos: {
    term: 'CC POS',
    short: 'Credit card swipes at physical merchant terminals.',
  },
  dcpos: {
    term: 'DC POS',
    short: 'Debit card swipes at physical merchant terminals. Declining as UPI takes over offline checkout.',
  },
  imps: {
    term: 'IMPS',
    short: 'Immediate Payment Service. Older real-time interbank rail. Mostly replaced by UPI.',
  },

  // Sources + bodies
  rbi: {
    term: 'RBI',
    short: 'Reserve Bank of India. Publishes monthly rail data with a ~45-day lag.',
  },
  npci: {
    term: 'NPCI',
    short: 'National Payments Corporation of India. Runs UPI, NACH, BBPS, IMPS, RuPay.',
    long: 'Publishes live monthly UPI and NACH stats with ~15-day lag. Card data still comes via RBI.',
  },
  ckan: {
    term: 'CKAN',
    short: 'Open-data portal serving the RBI historical dataset this dashboard reads.',
    long: 'Source for all months up to the RBI publication cutoff. Newer months come from NPCI Live.',
  },

  // Business + math
  mdr: {
    term: 'MDR',
    short: 'Merchant Discount Rate. The fee a merchant pays the payment processor per transaction.',
    long: 'CC eCommerce ~1.9-2.0%. NACH ~0.4%. UPI is near zero. This is what determines which rails are revenue-producing for Cashfree.',
  },
  pa_pg: {
    term: 'PA-PG',
    short: 'Payment Aggregator / Payment Gateway. Cashfree\'s core regulatory + business category.',
  },
  mdr_pool: {
    term: 'MDR pool',
    short: 'Total MDR payable by all merchants across India on a given rail in a given month.',
    long: 'The full revenue opportunity for the gateway market. Cashfree captures a share of this pool.',
  },

  // Chart vocab
  indexed: {
    term: 'Indexed',
    short: 'All rails rescaled to start at 100 so growth rates can be compared on the same chart.',
    long: 'A rail that ends at 200 has doubled. At 50, halved. Lets you compare a small rail (BBPS) against a big one (UPI) fairly.',
  },
  yoy: {
    term: 'YoY',
    short: 'Year-over-year. % change vs the same month 12 months ago.',
  },
  mom: {
    term: 'MoM',
    short: 'Month-over-month. % change vs the previous month.',
  },
  cagr: {
    term: 'CAGR',
    short: 'Compound annual growth rate. The yearly rate that turns a starting value into an ending value over N years.',
  },

  // Dashboard concepts
  rail: {
    term: 'Rail',
    short: 'A payment method category. This dashboard tracks 6 — UPI, CC eCom, CC POS, DC POS, NACH, BBPS.',
  },
  pulse: {
    term: 'Pulse',
    short: 'The Overview page. Synthesises the month into one paragraph, then breaks it into metric tiles and a playbook.',
  },
  rail_war: {
    term: 'Rail War',
    short: 'The /insights page. All rails indexed to 100, ranked by total return. Who is winning India payments.',
  },
  my_rail: {
    term: 'My Rail',
    short: 'Your numbers vs the market. Type in your own monthly GMV by rail; the page computes your market share.',
  },
}

export function getEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key.toLowerCase().replace(/[\s-]/g, '_')]
}
