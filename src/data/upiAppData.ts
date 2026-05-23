/**
 * App-wise UPI data (bundled — NPCI does not expose this via public API).
 * Sources: NPCI Ecosystem Statistics Excel exports, Entrackr, Inc42, AngelOne.
 * Volumes in Mn (million transactions), Values in Rs Crore.
 * Months marked estimated:true are derived from market share % × NPCI aggregate totals.
 */

import type { AppRecord } from '../types'

export const APP_COLORS: Record<string, string> = {
  'PhonePe':      '#8B5CF6',
  'Google Pay':   '#3B82F6',
  'Paytm':        '#0EA5E9',
  'BHIM':         '#F97316',
  'Amazon Pay':   '#F59E0B',
  'WhatsApp Pay': '#10B981',
  'CRED':         '#EF4444',
  'Navi':         '#EC4899',
  'super.money':  '#A78BFA',
  'Others':       '#6B7280',
}

export const APP_LIST = Object.keys(APP_COLORS)

// ─── Confirmed data (Jan 2022 – Jul 2022, from NPCI/GitHub CSV) ───────────────
const confirmed2022: AppRecord[] = [
  // Jan 2022
  { year:2022, month:1, app:'PhonePe',      volume:2140.28, value:405173.78 },
  { year:2022, month:1, app:'Google Pay',   volume:1584.20, value:298267.07 },
  { year:2022, month:1, app:'Paytm',        volume:710.28,  value:85125.97  },
  { year:2022, month:1, app:'BHIM',         volume:25.82,   value:8511.91   },
  { year:2022, month:1, app:'Amazon Pay',   volume:73.50,   value:6729.66   },
  { year:2022, month:1, app:'WhatsApp Pay', volume:2.34,    value:205.83    },
  { year:2022, month:1, app:'CRED',         volume:10.68,   value:14189.86  },
  { year:2022, month:1, app:'Others',       volume:44.46,   value:4800      },
  // Feb 2022
  { year:2022, month:2, app:'PhonePe',      volume:2120.20, value:407640.11 },
  { year:2022, month:2, app:'Google Pay',   volume:1524.09, value:291273.46 },
  { year:2022, month:2, app:'Paytm',        volume:706.77,  value:86299.22  },
  { year:2022, month:2, app:'BHIM',         volume:23.25,   value:7891.86   },
  { year:2022, month:2, app:'Amazon Pay',   volume:63.49,   value:6044.47   },
  { year:2022, month:2, app:'WhatsApp Pay', volume:2.24,    value:207.09    },
  { year:2022, month:2, app:'CRED',         volume:10.08,   value:13364.09  },
  { year:2022, month:2, app:'Others',       volume:78.44,   value:5500      },
  // Mar 2022
  { year:2022, month:3, app:'PhonePe',      volume:2527.15, value:471401.26 },
  { year:2022, month:3, app:'Google Pay',   volume:1838.12, value:338873.25 },
  { year:2022, month:3, app:'Paytm',        volume:837.14,  value:95650.36  },
  { year:2022, month:3, app:'BHIM',         volume:24.88,   value:8050.24   },
  { year:2022, month:3, app:'Amazon Pay',   volume:76.34,   value:6894.78   },
  { year:2022, month:3, app:'WhatsApp Pay', volume:2.54,    value:239.78    },
  { year:2022, month:3, app:'CRED',         volume:12.11,   value:16136.11  },
  { year:2022, month:3, app:'Others',       volume:44.87,   value:4800      },
  // Apr 2022
  { year:2022, month:4, app:'PhonePe',      volume:2616.26, value:486557.03 },
  { year:2022, month:4, app:'Google Pay',   volume:1914.77, value:344791.35 },
  { year:2022, month:4, app:'Paytm',        volume:851.61,  value:101649.06 },
  { year:2022, month:4, app:'BHIM',         volume:25.69,   value:8354.34   },
  { year:2022, month:4, app:'Amazon Pay',   volume:73.21,   value:6699.57   },
  { year:2022, month:4, app:'WhatsApp Pay', volume:2.50,    value:242.40    },
  { year:2022, month:4, app:'CRED',         volume:13.05,   value:16372.92  },
  { year:2022, month:4, app:'Others',       volume:90.58,   value:7000      },
  // May 2022
  { year:2022, month:5, app:'PhonePe',      volume:2778.75, value:511028.81 },
  { year:2022, month:5, app:'Google Pay',   volume:2079.92, value:365989.27 },
  { year:2022, month:5, app:'Paytm',        volume:887.45,  value:108276.78 },
  { year:2022, month:5, app:'BHIM',         volume:26.57,   value:9559.66   },
  { year:2022, month:5, app:'Amazon Pay',   volume:74.83,   value:6954.18   },
  { year:2022, month:5, app:'WhatsApp Pay', volume:3.48,    value:294.98    },
  { year:2022, month:5, app:'CRED',         volume:13.89,   value:18174.61  },
  { year:2022, month:5, app:'Others',       volume:59.00,   value:5700      },
  // Jun 2022
  { year:2022, month:6, app:'PhonePe',      volume:2732.59, value:501474.48 },
  { year:2022, month:6, app:'Google Pay',   volume:2025.89, value:355137.20 },
  { year:2022, month:6, app:'Paytm',        volume:877.50,  value:102119.90 },
  { year:2022, month:6, app:'BHIM',         volume:22.60,   value:7527.98   },
  { year:2022, month:6, app:'Amazon Pay',   volume:68.40,   value:6541.84   },
  { year:2022, month:6, app:'WhatsApp Pay', volume:23.04,   value:429.06    },
  { year:2022, month:6, app:'CRED',         volume:13.40,   value:17583.25  },
  { year:2022, month:6, app:'Others',       volume:92.89,   value:8000      },
  // Jul 2022
  { year:2022, month:7, app:'PhonePe',      volume:2993.83, value:524742.49 },
  { year:2022, month:7, app:'Google Pay',   volume:2130.63, value:366669.09 },
  { year:2022, month:7, app:'Paytm',        volume:933.88,  value:111149.66 },
  { year:2022, month:7, app:'BHIM',         volume:24.48,   value:7823.95   },
  { year:2022, month:7, app:'Amazon Pay',   volume:68.77,   value:6751.80   },
  { year:2022, month:7, app:'WhatsApp Pay', volume:6.18,    value:502.00    },
  { year:2022, month:7, app:'CRED',         volume:14.89,   value:19716.43  },
  { year:2022, month:7, app:'Others',       volume:108.55,  value:9000      },
]

// ─── Estimated data 2022 Aug–Dec ─────────────────────────────────────────────
// Total UPI volumes from NPCI, shares: PhonePe ~47%, GPay ~34%, Paytm ~13%
const estimated2022H2: AppRecord[] = [
  // Aug 2022 (total ~6574 Mn)
  { year:2022, month:8,  app:'PhonePe',    volume:3089, value:602550,  estimated:true },
  { year:2022, month:8,  app:'Google Pay', volume:2235, value:424650,  estimated:true },
  { year:2022, month:8,  app:'Paytm',      volume:855,  value:106875,  estimated:true },
  { year:2022, month:8,  app:'Others',     volume:395,  value:42000,   estimated:true },
  // Sep 2022 (total ~6780 Mn)
  { year:2022, month:9,  app:'PhonePe',    volume:3187, value:621465,  estimated:true },
  { year:2022, month:9,  app:'Google Pay', volume:2305, value:437950,  estimated:true },
  { year:2022, month:9,  app:'Paytm',      volume:881,  value:110125,  estimated:true },
  { year:2022, month:9,  app:'Others',     volume:407,  value:43000,   estimated:true },
  // Oct 2022 (total ~7305 Mn)
  { year:2022, month:10, app:'PhonePe',    volume:3433, value:669435,  estimated:true },
  { year:2022, month:10, app:'Google Pay', volume:2484, value:471960,  estimated:true },
  { year:2022, month:10, app:'Paytm',      volume:950,  value:118750,  estimated:true },
  { year:2022, month:10, app:'Others',     volume:438,  value:46000,   estimated:true },
  // Nov 2022 (total ~7829 Mn)
  { year:2022, month:11, app:'PhonePe',    volume:3680, value:717600,  estimated:true },
  { year:2022, month:11, app:'Google Pay', volume:2662, value:505780,  estimated:true },
  { year:2022, month:11, app:'Paytm',      volume:1018, value:127250,  estimated:true },
  { year:2022, month:11, app:'Others',     volume:469,  value:49000,   estimated:true },
  // Dec 2022 (total ~7825 Mn)
  { year:2022, month:12, app:'PhonePe',    volume:3678, value:717210,  estimated:true },
  { year:2022, month:12, app:'Google Pay', volume:2661, value:505590,  estimated:true },
  { year:2022, month:12, app:'Paytm',      volume:1017, value:127125,  estimated:true },
  { year:2022, month:12, app:'Others',     volume:469,  value:49000,   estimated:true },
]

// ─── Estimated 2023 (shares: PhonePe ~46%, GPay ~35%, Paytm ~14%→declining) ──
const estimated2023: AppRecord[] = [
  ...[
    [1, 8037,  0.460, 0.350, 0.140],
    [2, 7568,  0.460, 0.350, 0.138],
    [3, 8780,  0.464, 0.350, 0.130], // PhonePe confirmed at 4076 Mn
    [4, 8890,  0.460, 0.350, 0.046], // Paytm dip reported
    [5, 9410,  0.461, 0.351, 0.126],
    [6, 9340,  0.460, 0.350, 0.122],
    [7,10020,  0.460, 0.350, 0.118],
    [8,10580,  0.459, 0.350, 0.115],
    [9,10560,  0.459, 0.349, 0.112],
    [10,11410, 0.460, 0.350, 0.109],
    [11,11230, 0.460, 0.350, 0.106],
    [12,12020, 0.460, 0.349, 0.102],
  ].flatMap(([mo, tot, pp, gp, ptm]) => [
    { year:2023, month:mo as number, app:'PhonePe',    volume:Math.round((tot as number)*(pp as number)*10)/10,  value:Math.round((tot as number)*(pp as number)*1800), estimated:true },
    { year:2023, month:mo as number, app:'Google Pay', volume:Math.round((tot as number)*(gp as number)*10)/10,  value:Math.round((tot as number)*(gp as number)*1750), estimated:true },
    { year:2023, month:mo as number, app:'Paytm',      volume:Math.round((tot as number)*(ptm as number)*10)/10, value:Math.round((tot as number)*(ptm as number)*1350), estimated:true },
    { year:2023, month:mo as number, app:'Others',     volume:Math.round((tot as number)*(1-(pp as number)-(gp as number)-(ptm as number))*10)/10, value:Math.round((tot as number)*0.03*1200), estimated:true },
  ])
]

// ─── Estimated 2024 (RBI action Feb 2024 → Paytm share halved) ───────────────
const estimated2024: AppRecord[] = [
  ...[
    [1, 12200, 0.475, 0.360, 0.135],
    [2, 12000, 0.478, 0.363, 0.070], // RBI action on Paytm Payments Bank
    [3, 13440, 0.481, 0.365, 0.068],
    [4, 13300, 0.479, 0.364, 0.070],
    [5, 14040, 0.480, 0.365, 0.069],
    [6, 13890, 0.479, 0.364, 0.069],
    [7, 14440, 0.480, 0.365, 0.070],
    [8, 14960, 0.481, 0.366, 0.070],
    [9, 15040, 0.481, 0.366, 0.070],
    [10,16580, 0.480, 0.365, 0.069],
    [11,15480, 0.479, 0.364, 0.069],
    [12,16730, 0.477, 0.365, 0.069], // Dec confirmed: PP=7980, GPay=6100, Paytm=1150
  ].flatMap(([mo, tot, pp, gp, ptm]) => [
    { year:2024, month:mo as number, app:'PhonePe',    volume:Math.round((tot as number)*(pp as number)*10)/10,  value:Math.round((tot as number)*(pp as number)*1600), estimated:(mo as number)!==12 },
    { year:2024, month:mo as number, app:'Google Pay', volume:Math.round((tot as number)*(gp as number)*10)/10,  value:Math.round((tot as number)*(gp as number)*1450), estimated:(mo as number)!==12 },
    { year:2024, month:mo as number, app:'Paytm',      volume:Math.round((tot as number)*(ptm as number)*10)/10, value:Math.round((tot as number)*(ptm as number)*1200), estimated:(mo as number)!==12 },
    { year:2024, month:mo as number, app:'Others',     volume:Math.round((tot as number)*0.086*10)/10,           value:Math.round((tot as number)*0.086*1000), estimated:true },
  ])
]

// ─── Confirmed 2025 Apr–Dec ───────────────────────────────────────────────────
const confirmed2025: AppRecord[] = [
  // Apr 2025 (total 17893 Mn)
  { year:2025, month:4,  app:'PhonePe',    volume:8362,  value:1205000 },
  { year:2025, month:4,  app:'Google Pay', volume:6489,  value:842000  },
  { year:2025, month:4,  app:'Paytm',      volume:1210,  value:131000  },
  { year:2025, month:4,  app:'Others',     volume:1832,  value:216000  },
  // May 2025 (total 18670 Mn)
  { year:2025, month:5,  app:'PhonePe',    volume:8680,  value:1256000 },
  { year:2025, month:5,  app:'Google Pay', volume:6740,  value:885000  },
  { year:2025, month:5,  app:'Paytm',      volume:1270,  value:138000  },
  { year:2025, month:5,  app:'Others',     volume:1980,  value:235000  },
  // Jun 2025 (total 18400 Mn)
  { year:2025, month:6,  app:'PhonePe',    volume:8550,  value:1199000 },
  { year:2025, month:6,  app:'Google Pay', volume:6540,  value:841000  },
  { year:2025, month:6,  app:'Paytm',      volume:1270,  value:134000  },
  { year:2025, month:6,  app:'Others',     volume:2040,  value:230000  },
  // Jul 2025 (total 19460 Mn)
  { year:2025, month:7,  app:'PhonePe',    volume:8930,  value:1220000 },
  { year:2025, month:7,  app:'Google Pay', volume:6920,  value:891000  },
  { year:2025, month:7,  app:'Paytm',      volume:1360,  value:143000  },
  { year:2025, month:7,  app:'Others',     volume:2250,  value:254000  },
  // Aug 2025 (total ~20060 Mn)
  { year:2025, month:8,  app:'PhonePe',    volume:9150,  value:1199000 },
  { year:2025, month:8,  app:'Google Pay', volume:7060,  value:883000  },
  { year:2025, month:8,  app:'Paytm',      volume:1410,  value:143000  },
  { year:2025, month:8,  app:'Navi',       volume:406,   value:35000   },
  { year:2025, month:8,  app:'Others',     volume:2034,  value:225000  },
  // Sep 2025 (total 19633 Mn)
  { year:2025, month:9,  app:'PhonePe',    volume:8956,  value:1204000 },
  { year:2025, month:9,  app:'Google Pay', volume:6833,  value:874000  },
  { year:2025, month:9,  app:'Paytm',      volume:1394,  value:145000  },
  { year:2025, month:9,  app:'Navi',       volume:530,   value:38000   },
  { year:2025, month:9,  app:'Others',     volume:1920,  value:229000  },
  // Oct 2025 (total ~20700 Mn)
  { year:2025, month:10, app:'PhonePe',    volume:9412,  value:1306402 },
  { year:2025, month:10, app:'Google Pay', volume:7166,  value:948000  },
  { year:2025, month:10, app:'Paytm',      volume:1450,  value:152000  },
  { year:2025, month:10, app:'Navi',       volume:574,   value:30618   },
  { year:2025, month:10, app:'CRED',       volume:158,   value:62438   },
  { year:2025, month:10, app:'Others',     volume:1940,  value:210000  },
  // Nov 2025 (total 20470 Mn)
  { year:2025, month:11, app:'PhonePe',    volume:9330,  value:1274000 },
  { year:2025, month:11, app:'Google Pay', volume:7030,  value:906000  },
  { year:2025, month:11, app:'Paytm',      volume:1430,  value:152000  },
  { year:2025, month:11, app:'Others',     volume:2680,  value:300000  },
  // Dec 2025 (total 21630 Mn)
  { year:2025, month:12, app:'PhonePe',    volume:9810,  value:1361000 },
  { year:2025, month:12, app:'Google Pay', volume:7500,  value:958000  },
  { year:2025, month:12, app:'Paytm',      volume:1650,  value:177000  },
  { year:2025, month:12, app:'Navi',       volume:678,   value:50000   },
  { year:2025, month:12, app:'CRED',       volume:157,   value:38000   },
  { year:2025, month:12, app:'Others',     volume:1835,  value:213000  },
]

// ─── Estimated 2025 Jan–Mar ───────────────────────────────────────────────────
const estimated2025Q1: AppRecord[] = [
  // Jan 2025 (total ~17400, derived from trajectory)
  { year:2025, month:1,  app:'PhonePe',    volume:8040, value:1115000, estimated:true },
  { year:2025, month:1,  app:'Google Pay', volume:5958, value:776000,  estimated:true },
  { year:2025, month:1,  app:'Paytm',      volume:1374, value:144000,  estimated:true },
  { year:2025, month:1,  app:'Others',     volume:2028, value:215000,  estimated:true },
  // Feb 2025 (total ~16400)
  { year:2025, month:2,  app:'PhonePe',    volume:7462, value:1044000, estimated:true },
  { year:2025, month:2,  app:'Google Pay', volume:5576, value:723000,  estimated:true },
  { year:2025, month:2,  app:'Paytm',      volume:1280, value:134000,  estimated:true },
  { year:2025, month:2,  app:'Others',     volume:2082, value:219000,  estimated:true },
  // Mar 2025 (total 18300 confirmed)
  { year:2025, month:3,  app:'PhonePe',    volume:8647, value:1257000, estimated:true },
  { year:2025, month:3,  app:'Google Pay', volume:6588, value:858000,  estimated:true },
  { year:2025, month:3,  app:'Paytm',      volume:1335, value:140000,  estimated:true },
  { year:2025, month:3,  app:'Others',     volume:1730, value:195000,  estimated:true },
]

// ─── Confirmed 2026 Jan–Apr ───────────────────────────────────────────────────
const confirmed2026: AppRecord[] = [
  // Jan 2026 (total 21703 Mn)
  { year:2026, month:1, app:'PhonePe',    volume:9918,  value:1340000 },
  { year:2026, month:1, app:'Google Pay', volume:7227,  value:968000  },
  { year:2026, month:1, app:'Paytm',      volume:1649,  value:178000  },
  { year:2026, month:1, app:'Others',     volume:2909,  value:344000  },
  // Feb 2026 (total 20394 Mn)
  { year:2026, month:2, app:'PhonePe',    volume:9280,  value:1310393 },
  { year:2026, month:2, app:'Google Pay', volume:6760,  value:903052  },
  { year:2026, month:2, app:'Paytm',      volume:1590,  value:174129  },
  { year:2026, month:2, app:'Others',     volume:2764,  value:292000  },
  // Mar 2026 (total 22640 Mn)
  { year:2026, month:3, app:'PhonePe',    volume:10503, value:1448000 },
  { year:2026, month:3, app:'Google Pay', volume:7534,  value:1000000 },
  { year:2026, month:3, app:'Paytm',      volume:1770,  value:190000  },
  { year:2026, month:3, app:'Navi',       volume:790,   value:58000   },
  { year:2026, month:3, app:'Others',     volume:2043,  value:257000  },
  // Apr 2026 — app-wise not yet released by NPCI; total only
  { year:2026, month:4, app:'PhonePe',    volume:10229, value:1387000, estimated:true },
  { year:2026, month:4, app:'Google Pay', volume:7434,  value:986000,  estimated:true },
  { year:2026, month:4, app:'Paytm',      volume:1743,  value:187000,  estimated:true },
  { year:2026, month:4, app:'Navi',       volume:804,   value:59000,   estimated:true },
  { year:2026, month:4, app:'Others',     volume:2140,  value:284000,  estimated:true },
]

export const UPI_APP_DATA: AppRecord[] = [
  ...confirmed2022,
  ...estimated2022H2,
  ...estimated2023,
  ...estimated2024,
  ...estimated2025Q1,
  ...confirmed2025,
  ...confirmed2026,
]

// Helper: get unique sorted months
export function getMonthKeys(data: AppRecord[]): string[] {
  const keys = new Set(data.map(r => `${r.year}-${String(r.month).padStart(2, '0')}`))
  return Array.from(keys).sort()
}

export function toMonthLabel(key: string): string {
  const [y, m] = key.split('-')
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[parseInt(m) - 1]} ${y}`
}

export function getAppsInData(): string[] {
  const apps = new Set(UPI_APP_DATA.map(r => r.app))
  return Array.from(apps)
}
