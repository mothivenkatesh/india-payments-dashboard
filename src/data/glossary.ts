/**
 * Glossary — central dictionary of payments + dashboard terms.
 * Used by InfoChip to surface short definitions inline next to terms.
 *
 * Voice: plain and human. Lead with what the thing does for a person,
 * not the acronym. Short sentences. No jargon where a real word works.
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
    short: 'The instant, free way to pay straight from one bank account to another. It is what powers most phone payments in India.',
    long: 'About 22 billion payments run through it every month. Because it is free to use, payment companies earn almost nothing on each one.',
  },
  nach: {
    term: 'NACH',
    short: 'The rail behind auto-payments. Your monthly SIP, EMI, or subscription gets pulled automatically through it.',
    long: 'It charges a small fee, so it is one of the rails payment companies actually earn on. And it is growing fast.',
  },
  bbps: {
    term: 'BBPS',
    short: 'One place to pay every bill. Electricity, gas, phone, insurance, all run through it.',
    long: 'Run by NPCI. It is where Cashfree\'s Biller product plays.',
  },
  ccecom: {
    term: 'CC eCommerce',
    short: 'Credit card payments made online. This is where payment gateways earn most of their fees.',
    long: 'The fee is about 1.9 to 2 percent. It is the heart of the gateway business.',
  },
  ccpos: {
    term: 'CC POS',
    short: 'Credit card payments made by tapping or swiping at a shop\'s card machine.',
  },
  dcpos: {
    term: 'DC POS',
    short: 'Debit card payments at a shop\'s card machine. These are shrinking as people switch to UPI.',
  },
  imps: {
    term: 'IMPS',
    short: 'An older way to send money between banks instantly. UPI has mostly taken its place.',
  },

  // Sources + bodies
  rbi: {
    term: 'RBI',
    short: 'India\'s central bank. It publishes the official payment numbers about 45 days after each month ends.',
  },
  npci: {
    term: 'NPCI',
    short: 'The organisation that runs UPI, NACH, and BBPS.',
    long: 'It shares fresh UPI and NACH numbers about 15 days after each month. Card numbers still come from the RBI.',
  },
  ckan: {
    term: 'CKAN',
    short: 'The open data source this dashboard reads its history from.',
    long: 'It covers every month up to the RBI\'s cutoff. Newer months come straight from NPCI.',
  },

  // Business + money
  mdr: {
    term: 'MDR',
    short: 'The fee a merchant pays to accept a payment. It is how payment companies make money.',
    long: 'Credit cards online cost about 1.9 to 2 percent. NACH is about 0.4 percent. UPI is basically free, which is why the fee-earning rails matter most.',
  },
  pa_pg: {
    term: 'PA-PG',
    short: 'Short for Payment Aggregator and Payment Gateway. It is the kind of business Cashfree is.',
  },
  mdr_pool: {
    term: 'MDR pool',
    short: 'The total fees every merchant in India pays on a rail each month. It is the whole pie payment companies compete for.',
    long: 'Cashfree\'s revenue is a slice of this pool.',
  },

  // Chart words
  indexed: {
    term: 'Indexed',
    short: 'Every rail starts at 100, so you can compare how fast they grow side by side.',
    long: 'A rail at 200 has doubled. At 50, it has halved. This lets a small rail and a big one be compared fairly.',
  },
  yoy: {
    term: 'YoY',
    short: 'Year over year. How much something changed compared to the same month a year ago.',
  },
  mom: {
    term: 'MoM',
    short: 'Month over month. How much something changed since last month.',
  },
  cagr: {
    term: 'CAGR',
    short: 'The steady yearly growth rate that would take something from where it started to where it is now.',
  },

  // Dashboard
  rail: {
    term: 'Rail',
    short: 'A way to pay. This dashboard tracks six: UPI, credit and debit cards, NACH, and BBPS.',
  },
  pulse: {
    term: 'Pulse',
    short: 'The home page. It sums up the month in a sentence, then breaks it down.',
  },
  rail_war: {
    term: 'Rail War',
    short: 'The page that ranks every rail by how fast it is growing, so you can see who is winning.',
  },
  my_rail: {
    term: 'My Rail',
    short: 'Punch in your own numbers and see how your share stacks up against the whole market.',
  },
}

export function getEntry(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key.toLowerCase().replace(/[\s-]/g, '_')]
}
