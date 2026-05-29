/** @jsxImportSource preact */
import { useState } from 'preact/hooks'
import clsx from 'clsx'
import Icon from './Icon'

/**
 * AppLogo — renders the actual brand logo via Brandfetch's public CDN
 * (returns real brand marks at 300-500px, not 32px favicons). Falls back
 * to Google's S2 favicon, then to a neutral briefcase icon. No
 * first-letter dummy tile, so tables stay clean even for unknown names.
 *
 * Pass either a known `name` (UPI app, bank, data source) or an explicit
 * `domain` override.
 */

// UPI apps + data sources + known fintechs
const KNOWN_DOMAINS: Record<string, string> = {
  // UPI apps
  'PhonePe':       'phonepe.com',
  'Google Pay':    'pay.google.com',
  'Paytm':         'paytm.com',
  'BHIM':          'npci.org.in',
  'Amazon Pay':    'amazonpay.in',
  'WhatsApp Pay':  'whatsapp.com',
  'CRED':          'cred.club',
  'Navi':          'navi.com',
  'super.money':   'super.money',

  // Data sources
  'NPCI':          'npci.org.in',
  'RBI':           'rbi.org.in',
  'CKAN':          'ckan.org',

  // Fintech / PG players (for future use)
  'Cashfree':      'cashfree.com',
  'Razorpay':      'razorpay.com',
  'Juspay':        'juspay.in',
  'PayU':          'payu.in',
  'CCAvenue':      'ccavenue.com',
  'BillDesk':      'billdesk.com',
  'Pine Labs':     'pinelabs.com',
  'PineLabs':      'pinelabs.com',
  'Mswipe':        'mswipe.com',
  'Easebuzz':      'easebuzz.in',
  'Instamojo':     'instamojo.com',
  'Stripe':        'stripe.com',
  'Adyen':         'adyen.com',
}

// Indian bank canonical names → primary domain
const BANK_DOMAINS: Record<string, string> = {
  'HDFC BANK LTD':                       'hdfcbank.com',
  'HDFC BANK':                           'hdfcbank.com',
  'ICICI BANK LTD':                      'icicibank.com',
  'ICICI BANK':                          'icicibank.com',
  'STATE BANK OF INDIA':                 'sbi.co.in',
  'SBI':                                 'sbi.co.in',
  'AXIS BANK LTD':                       'axisbank.com',
  'AXIS BANK':                           'axisbank.com',
  'KOTAK MAHINDRA BANK LTD':             'kotak.com',
  'KOTAK MAHINDRA BANK':                 'kotak.com',
  'INDUSIND BANK LTD':                   'indusind.com',
  'INDUSIND BANK':                       'indusind.com',
  'YES BANK LTD':                        'yesbank.in',
  'YES BANK':                            'yesbank.in',
  'IDFC FIRST BANK LIMITED':             'idfcfirstbank.com',
  'IDFC FIRST BANK':                     'idfcfirstbank.com',
  'IDFC BANK LTD':                       'idfcfirstbank.com',
  'FEDERAL BANK LTD':                    'federalbank.co.in',
  'FEDERAL BANK':                        'federalbank.co.in',
  'RBL BANK':                            'rblbank.com',
  'RBL BANK LTD':                        'rblbank.com',
  'BANK OF BARODA':                      'bankofbaroda.in',
  'PUNJAB NATIONAL BANK':                'pnbindia.in',
  'CANARA BANK':                         'canarabank.com',
  'UNION BANK OF INDIA':                 'unionbankofindia.co.in',
  'BANK OF INDIA':                       'bankofindia.co.in',
  'INDIAN BANK':                         'indianbank.in',
  'CENTRAL BANK OF INDIA':               'centralbankofindia.co.in',
  'INDIAN OVERSEAS BANK':                'iob.in',
  'UCO BANK':                            'ucobank.com',
  'BANK OF MAHARASHTRA':                 'bankofmaharashtra.in',
  'PUNJAB AND SIND BANK':                'punjabandsindbank.co.in',
  'IDBI BANK LIMITED':                   'idbibank.in',
  'IDBI BANK LTD':                       'idbibank.in',
  'STANDARD CHARTERED BANK':             'sc.com',
  'CITIBANK':                            'citibank.com',
  'CITIBANK N.A.':                       'citibank.com',
  'HSBC LTD':                            'hsbc.co.in',
  'THE HONGKONG AND SHANGHAI BANKING CORPORATION LIMITED': 'hsbc.co.in',
  'DEUTSCHE BANK AG':                    'deutschebank.co.in',
  'DBS BANK INDIA LTD':                  'dbs.com',
  'DBS BANK LTD':                        'dbs.com',
  'BARCLAYS BANK PLC':                   'barclays.in',
  'BNP PARIBAS':                         'bnpparibas.co.in',
  'AU SMALL FINANCE BANK':               'aubank.in',
  'AU SMALL FINANCE BANK LIMITED':       'aubank.in',
  'JANA SMALL FINANCE BANK':             'janabank.com',
  'EQUITAS SMALL FINANCE BANK':          'equitasbank.com',
  'EQUITAS SMALL FINANCE BANK LIMITED':  'equitasbank.com',
  'UJJIVAN SMALL FINANCE BANK':          'ujjivansfb.in',
  'ESAF SMALL FINANCE BANK':             'esafbank.com',
  'SURYODAY SMALL FINANCE BANK':         'suryodaybank.com',
  'CAPITAL SMALL FINANCE BANK':          'capitalbank.co.in',
  'FINCARE SMALL FINANCE BANK':          'fincarebank.com',
  'AIRTEL PAYMENTS BANK':                'airtel.in',
  'AIRTEL PAYMENTS BANK LTD':            'airtel.in',
  'PAYTM PAYMENTS BANK':                 'paytmbank.com',
  'PAYTM PAYMENTS BANK LTD':             'paytmbank.com',
  'FINO PAYMENTS BANK':                  'finobank.com',
  'FINO PAYMENTS BANK LTD':              'finobank.com',
  'INDIA POST PAYMENTS BANK':            'ippbonline.com',
  'INDIA POST PAYMENTS BANK LTD':        'ippbonline.com',
  'KARNATAKA BANK LTD':                  'karnatakabank.com',
  'KARNATAKA BANK':                      'karnatakabank.com',
  'KARUR VYSYA BANK':                    'kvb.co.in',
  'CITY UNION BANK LTD':                 'cityunionbank.com',
  'CITY UNION BANK':                     'cityunionbank.com',
  'SOUTH INDIAN BANK':                   'southindianbank.com',
  'TAMILNAD MERCANTILE BANK':            'tmb.in',
  'DHANLAXMI BANK':                      'dhanbank.com',
  'CSB BANK':                            'csb.co.in',
  'JAMMU AND KASHMIR BANK':              'jkbank.com',
  'BANDHAN BANK LTD':                    'bandhanbank.com',
  'BANDHAN BANK':                        'bandhanbank.com',
  'NAINITAL BANK':                       'nainitalbank.co.in',
}

function resolveDomain(name: string, override?: string): string {
  if (override) return override
  if (KNOWN_DOMAINS[name]) return KNOWN_DOMAINS[name]
  const upper = name.toUpperCase().trim()
  if (BANK_DOMAINS[upper]) return BANK_DOMAINS[upper]
  return ''
}

interface Props {
  name: string
  size?: number
  domain?: string
  color?: string
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export default function AppLogo({
  name,
  size = 32,
  domain,
  color,
  className,
  rounded = 'lg',
}: Props) {
  // Two-stage logo loading: try Brandfetch CDN (real brand logos) first,
  // fall back to Google S2 favicon (always renders something), then to a
  // neutral briefcase icon.
  const [stage, setStage] = useState<'brand' | 's2' | 'failed'>('brand')
  const resolved = resolveDomain(name, domain)
  const logoUrl = !resolved ? ''
    : stage === 'brand' ? `https://cdn.brandfetch.io/${resolved}/w/256/h/256`
    : stage === 's2'    ? `https://www.google.com/s2/favicons?domain=${resolved}&sz=128`
    : ''
  const failed = stage === 'failed'
  const setFailed = () => setStage(s => s === 'brand' ? 's2' : 'failed')
  const radiusClass = `rounded-${rounded}`

  if (failed || !logoUrl) {
    // Neutral icon fallback — no first-letter dummy tile.
    const tone = color ?? '#94A3B8'
    return (
      <div
        class={clsx('flex items-center justify-center shrink-0 bg-surface-gray-1 border border-outline-gray-2', radiusClass, className)}
        style={{ width: size, height: size, color: tone }}
        title={name}
      >
        <Icon name="briefcase" size={Math.max(10, Math.round(size * 0.5))} />
      </div>
    )
  }

  return (
    <img
      src={logoUrl}
      alt=""
      aria-hidden="true"
      title={name}
      width={size}
      height={size}
      class={clsx('shrink-0 bg-white object-contain border border-outline-gray-1', radiusClass, className)}
      style={{ width: size, height: size, padding: Math.max(1, size * 0.06) }}
      onError={setFailed}
      loading="lazy"
    />
  )
}
