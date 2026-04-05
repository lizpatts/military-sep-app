'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

const LinkTile = ({ label, url }) => (
  <div
    onClick={() => window.open(url, '_blank')}
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '1rem',
      backgroundColor: '#0a1628',
      border: '1px solid #1e3a5f',
      borderRadius: '10px',
      cursor: 'pointer',
      minHeight: '70px'
    }}
  >
    <span style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{label}</span>
    <span style={{ color: '#2563eb', fontSize: '0.75rem', marginTop: '0.5rem' }}>Visit →</span>
  </div>
)

export default function CalculatorsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('tsp')
  const chartRef = useRef(null)
  const chartInstance = useRef(null)

const [currentAge, setCurrentAge] = useState('')
  const [separationAge, setSeparationAge] = useState('')
  const [drawdownAge, setDrawdownAge] = useState('60')
  const [tspBalance, setTspBalance] = useState('')
  const [annualContribution, setAnnualContribution] = useState('')
  const [tspReturn, setTspReturn] = useState('7')
  const [inflation, setInflation] = useState('3')
  const [isBRS, setIsBRS] = useState(true)
  const [basePay, setBasePay] = useState('')
  const [tspResult, setTspResult] = useState(null)

  const [enrollmentType, setEnrollmentType] = useState('full')
  const [schoolState, setSchoolState] = useState('')
  const [monthsUsed, setMonthsUsed] = useState('')
  const [giBillResult, setGiBillResult] = useState(null)

  const TSP_LIMIT_2024 = 23000
  const TSP_CATCHUP_LIMIT = 30500

  const tspLinks = [
    { label: 'TSP Website', url: 'https://www.tsp.gov' },
    { label: 'TSP Contribution Limits', url: 'https://www.tsp.gov/making-contributions/contribution-limits/' },
    { label: 'TSP Fund Performance', url: 'https://www.tsp.gov/fund-performance/' },
    { label: 'TSP Retirement Income Calculator', url: 'https://www.tsp.gov/calculators/retirement-income/' },
    { label: 'Roll TSP into IRA or 401k', url: 'https://www.tsp.gov/living-in-retirement/rollover-information/' },
  ]

  const giBillLinks = [
    { label: 'Apply for GI Bill Benefits', url: 'https://www.va.gov/education/apply-for-education-benefits/' },
    { label: 'GI Bill Comparison Tool', url: 'https://www.va.gov/gi-bill-comparison-tool/' },
    { label: 'Check Your GI Bill Balance', url: 'https://www.va.gov/education/gi-bill/post-9-11/ch-33-benefit/' },
    { label: 'BAH Rate Calculator', url: 'https://www.defensetravel.dod.mil/site/bahCalc.cfm' },
    { label: 'VA Education Benefits Overview', url: 'https://www.va.gov/education/about-gi-bill-benefits/' },
  ]

  useEffect(() => {
    if (tspResult && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy()
      if (window.Chart) {
        buildChart()
      } else {
        const script = document.createElement('script')
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js'
        script.onload = () => buildChart()
        document.head.appendChild(script)
      }
    }
  }, [tspResult])

const buildChart = () => {
    if (!chartRef.current || !tspResult) return
    const totalYears = tspResult.totalYears
    const balance = parseFloat(tspBalance) || 0
    const totalAnnualContrib = tspResult.totalAnnualContribution
    const rate = parseFloat(tspReturn) / 100
    const inflationRate = parseFloat(inflation) / 100
    const realRate = rate - inflationRate
    const yearsContributing = tspResult.yearsContributing
    const nominalData = []
    const realData = []
    const labels = []
    const startAge = tspResult.currentAge
let nominalBalance = balance
    let realBalance = balance
    let totalContributed = balance
    const contributionData = []
for (let y = 0; y <= totalYears; y++) {
      nominalData.push(Math.round(nominalBalance))
      realData.push(Math.round(realBalance))
      contributionData.push(Math.round(totalContributed))
      labels.push(`Age ${startAge + y}`)

      if (y < yearsContributing) {
        nominalBalance = nominalBalance * (1 + rate) + totalAnnualContrib
        realBalance = realBalance * (1 + realRate) + totalAnnualContrib
        totalContributed += totalAnnualContrib
      } else {
        nominalBalance = nominalBalance * (1 + rate)
        realBalance = realBalance * (1 + realRate)
      }
      contributionData.push(Math.round(totalContributed))
    }
    chartInstance.current = new window.Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Nominal Growth', data: nominalData, borderColor: '#2563eb', backgroundColor: '#2563eb22', fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 6 },
          { label: 'Real Growth (inflation adjusted)', data: realData, borderColor: '#22c55e', backgroundColor: '#22c55e22', fill: true, tension: 0.4, pointRadius: 2, pointHoverRadius: 6 },
          { label: 'Your Contributions Only', data: contributionData, borderColor: '#f59e0b', backgroundColor: 'transparent', fill: false, tension: 0, pointRadius: 2, pointHoverRadius: 6, borderDash: [6, 3] }
        ]
      },
      options: {
        responsive: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { labels: { color: '#8899aa', font: { size: 12 } } },
          tooltip: {
            backgroundColor: '#0f2035',
            borderColor: '#1e3a5f',
            borderWidth: 1,
            titleColor: '#8899aa',
            bodyColor: 'white',
            padding: 12,
            callbacks: {
              label: ctx => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}`
            }
          }
        },
        scales: {
          x: { ticks: { color: '#445566', maxTicksLimit: 10 }, grid: { color: '#1e3a5f' } },
          y: { ticks: { color: '#445566', callback: val => `$${(val / 1000).toFixed(0)}k` }, grid: { color: '#1e3a5f' } }
        }
      }
    })
  }

  const calculateTSP = () => {
    const age = parseFloat(currentAge)
    const sepAge = parseFloat(separationAge) || age
    const ddAge = parseFloat(drawdownAge) || 60
    const balance = parseFloat(tspBalance) || 0
    const userContrib = parseFloat(annualContribution) || 0
    const base = parseFloat(basePay) || 0
    const rate = parseFloat(tspReturn) / 100
    const inflationRate = parseFloat(inflation) / 100
    const realRate = rate - inflationRate

    if (!age || age <= 0) { alert('Please enter your current age'); return }
    if (sepAge < age) { alert('Separation age must be greater than current age'); return }
    if (ddAge < age) { alert('Drawdown age must be greater than current age'); return }

    const yearsContributing = Math.max(0, sepAge - age)
    const yearsGrowing = Math.max(0, ddAge - sepAge)
    const totalYears = Math.max(0, ddAge - age)

    const militaryMatch = isBRS ? Math.min(userContrib, base * 0.04) + (base * 0.01) : 0
    const totalAnnualContribution = userContrib + militaryMatch

    // Phase 1: grow with contributions until separation
    const balanceAtSep = balance * Math.pow(1 + rate, yearsContributing) +
      (rate > 0 ? totalAnnualContribution * ((Math.pow(1 + rate, yearsContributing) - 1) / rate) : totalAnnualContribution * yearsContributing)

    // Phase 2: grow without contributions from separation to drawdown
    const futureBalance = balanceAtSep * Math.pow(1 + rate, yearsGrowing)

    // Real value calculations
    const realBalanceAtSep = balance * Math.pow(1 + realRate, yearsContributing) +
      (realRate > 0 ? totalAnnualContribution * ((Math.pow(1 + realRate, yearsContributing) - 1) / realRate) : totalAnnualContribution * yearsContributing)
    const realFutureBalance = realBalanceAtSep * Math.pow(1 + realRate, yearsGrowing)

    setTspResult({
      totalBalance: futureBalance,
      realTotalBalance: realFutureBalance,
      monthlyIncome: futureBalance * 0.04 / 12,
      realMonthlyIncome: realFutureBalance * 0.04 / 12,
      totalAnnualContribution,
      militaryMatch,
      userContrib,
      totalYears,
      yearsContributing,
      yearsGrowing,
      ddAge,
      sepAge,
      currentAge: age
    })
  }
  const calculateGIBill = () => {
    if (!schoolState) { alert('Please enter your school state'); return }
const used = Math.max(0, parseFloat(monthsUsed) || 0)
if (used > 36) {
      alert('GI Bill maximum is 36 months. Please enter a value between 0 and 36.')
      return
    }

    const remaining = Math.max(0, 36 - used)
    const bahRates = {
      'CA': 3200, 'NY': 3500, 'TX': 1800, 'FL': 1900,
      'VA': 2400, 'WA': 2600, 'CO': 2200, 'GA': 1800,
      'NC': 1700, 'AZ': 1900, 'OH': 1600, 'PA': 1900,
      'IL': 2100, 'MA': 2800, 'MD': 2600, 'default': 1800
    }
    const stateCode = schoolState.toUpperCase().trim()
    const monthlyBAH = bahRates[stateCode] || bahRates['default']
    const enrollmentMultiplier = enrollmentType === 'full' ? 1 :
      enrollmentType === 'three_quarter' ? 0.8 :
      enrollmentType === 'half' ? 0.6 : 0.4
    const monthlyHousing = monthlyBAH * enrollmentMultiplier
    const monthlyBooks = enrollmentType === 'full' ? 83 : 42
    setGiBillResult({
      remaining,
      monthlyHousing,
      monthlyBooks,
      totalBenefits: remaining * (monthlyHousing + monthlyBooks),
      stateCode
    })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0a1628', color: 'white', fontFamily: 'sans-serif', padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
<button onClick={() => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('guest') === 'true') {
    router.push(`/dashboard?${params.toString()}`)
  } else {
    router.push('/dashboard')
  }
}} style={backButtonStyle}>← Dashboard</button>        <h1 style={{ fontSize: '1.5rem' }}>Financial Calculators</h1>
      </div>

      <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
        Estimates only — consult a financial advisor for personalized advice.
      </p>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
{[
  { id: 'tsp', label: '💰 TSP Estimator' },
  { id: 'gibill', label: '🎓 GI Bill Calculator' },
  { id: 'va', label: '🎖️ VA Disability' },
].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px', borderRadius: '8px', border: '1px solid',
            borderColor: activeTab === tab.id ? '#2563eb' : '#1e3a5f',
            backgroundColor: activeTab === tab.id ? '#2563eb' : 'transparent',
            color: 'white', fontSize: '0.9rem', cursor: 'pointer'
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'tsp' && (
        <div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>TSP Retirement Estimator</h2>
            <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Includes Blended Retirement System (BRS) military match calculation.
            </p>

            {/* BRS Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#0a1628', borderRadius: '8px', border: '1px solid #1e3a5f' }}>
              <div>
                <p style={{ margin: 0, fontWeight: '500', fontSize: '0.9rem' }}>Blended Retirement System (BRS)</p>
                <p style={{ margin: '4px 0 0', color: '#8899aa', fontSize: '0.8rem' }}>
                  Joined after Jan 1, 2018, or opted in. Military matches up to 5% of base pay.
                </p>
              </div>
              <button
                onClick={() => setIsBRS(!isBRS)}
                style={{
                  marginLeft: 'auto',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  border: '1px solid',
                  borderColor: isBRS ? '#22c55e' : '#1e3a5f',
                  backgroundColor: isBRS ? '#22c55e22' : 'transparent',
                  color: isBRS ? '#22c55e' : '#445566',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap'
                }}
              >
                {isBRS ? '✓ BRS On' : 'BRS Off'}
              </button>
            </div>

            <div style={formGridStyle}>
<div>
                <label style={labelStyle}>Current Age</label>
                <input type="number" value={currentAge} onChange={e => setCurrentAge(e.target.value)} placeholder="e.g. 28" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Age at Military Separation</label>
                <input type="number" value={separationAge} onChange={e => setSeparationAge(e.target.value)} placeholder="e.g. 38" style={inputStyle} />
                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
                  Contributions stop at separation. Balance continues to grow.
                </p>
              </div>
              <div>
                <label style={labelStyle}>Target Drawdown Age</label>
                <input type="number" value={drawdownAge} onChange={e => setDrawdownAge(e.target.value)} placeholder="e.g. 60" style={inputStyle} />
                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
                  Penalty-free access at 59½, or 55 if separating from any federal service in the year you turn 55+
                </p>
              </div>
              <div>
                <label style={labelStyle}>Current TSP Balance ($)</label>
                <input type="number" value={tspBalance} onChange={e => setTspBalance(e.target.value)} placeholder="e.g. 50000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Your Annual Contribution ($)</label>
                <input type="number" value={annualContribution} onChange={e => setAnnualContribution(e.target.value)} placeholder="e.g. 6000" style={inputStyle} />
                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
                  2024 limit: ${TSP_LIMIT_2024.toLocaleString()} · Age 50+: ${TSP_CATCHUP_LIMIT.toLocaleString()}
                </p>
              </div>
              {isBRS && (
                <div>
                  <label style={labelStyle}>Annual Base Pay ($)</label>
                  <input type="number" value={basePay} onChange={e => setBasePay(e.target.value)} placeholder="e.g. 45000" style={inputStyle} />
                  <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>
                    Used to calculate military match (up to 5% of base pay)
                  </p>
                </div>
              )}
              <div>
                <label style={labelStyle}>Expected Annual Return (%)</label>
                <input type="number" value={tspReturn} onChange={e => setTspReturn(e.target.value)} placeholder="default: 7" style={inputStyle} />
                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>Historical average ~7%. Conservative: 5%.</p>
              </div>
              <div>
                <label style={labelStyle}>Inflation Rate (%)</label>
                <input type="number" value={inflation} onChange={e => setInflation(e.target.value)} placeholder="default: 3" style={inputStyle} />
                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '4px' }}>Historical average ~3%.</p>
              </div>
            </div>

            <button onClick={calculateTSP} style={primaryButtonStyle}>Calculate →</button>

            {tspResult && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={resultCardStyle}>
<h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#22c55e' }}>
                    Projected Balance at Drawdown Age {tspResult.ddAge}
                  </h3>
                  <p style={{ color: '#445566', fontSize: '0.8rem', marginBottom: '1rem' }}>
                    Contributing for {tspResult.yearsContributing} years · Growing without contributions for {tspResult.yearsGrowing} years
                  </p>
                  <div style={resultGridStyle}>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Nominal Balance</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>
                        ${Math.round(tspResult.totalBalance).toLocaleString()}
                      </p>
                      <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>before inflation</p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Real Balance (today's $)</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>
                        ${Math.round(tspResult.realTotalBalance).toLocaleString()}
                      </p>
                      <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>inflation adjusted</p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly Income at {tspResult.retAge}</p>
                      <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>
                        ${Math.round(tspResult.monthlyIncome).toLocaleString()}
                      </p>
                      <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>4% rule, nominal</p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly Income (real)</p>
                      <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>
                        ${Math.round(tspResult.realMonthlyIncome).toLocaleString()}
                      </p>
                      <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>inflation adjusted</p>
                    </div>
                    {isBRS && (
                      <div style={resultItemStyle}>
                        <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Military Match (annual)</p>
                        <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
                          ${Math.round(tspResult.militaryMatch).toLocaleString()}
                        </p>
                        <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>free money from BRS</p>
                      </div>
                    )}
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Total Annual Contribution</p>
                      <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0 }}>
                        ${Math.round(tspResult.totalAnnualContribution).toLocaleString()}
                      </p>
                      <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>yours + match</p>
                    </div>
                  </div>
<div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#0f2035', borderRadius: '8px', border: '1px solid #1e3a5f' }}>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#f59e0b' }}>
                      ⏰ Penalty-free access: Age 59½ (standard) · Age 55 if separating from any federal service (military or civilian GS) in the year you turn 55 or older (Rule of 55)
                    </p>
                  </div>

                  {tspResult.ddAge < 59.5 && (
                    <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#0f2035', borderRadius: '8px', border: '1px solid #ef4444' }}>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#ef4444' }}>
                        ⚠️ Your target drawdown age ({tspResult.ddAge}) is before 59½. Early withdrawals may incur a 10% penalty plus income tax unless the Rule of 55 or other exceptions apply.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ ...resultCardStyle, marginTop: '1rem' }}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Growth Over Time</h3>
                  <canvas ref={chartRef} style={{ width: '100%' }} />
                </div>

                <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '1rem' }}>
                  ⚠️ Estimates only. Does not account for taxes, RMDs, or changes in contribution rate. Consult a financial advisor.
                  Legacy retirement system members (20+ years, pre-2018) should consult tsp.gov directly.
                </p>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Official TSP Resources</p>
            <div style={tileGridStyle}>
              {tspLinks.map(link => <LinkTile key={link.url} label={link.label} url={link.url} />)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gibill' && (
        <div>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1.1rem', marginBottom: '1.5rem' }}>GI Bill Benefits Estimator</h2>
            <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
              Estimates Post-9/11 GI Bill (Chapter 33) benefits. Based on 2024 rates.
            </p>

            <div style={formGridStyle}>
              <div>
                <label style={labelStyle}>Enrollment Status</label>
                <select value={enrollmentType} onChange={e => setEnrollmentType(e.target.value)} style={inputStyle}>
                  <option value="full">Full Time</option>
                  <option value="three_quarter">3/4 Time</option>
                  <option value="half">Half Time</option>
                  <option value="less_than_half">Less than Half Time</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>School State (2-letter code)</label>
                <input type="text" value={schoolState} onChange={e => setSchoolState(e.target.value)} placeholder="e.g. TX, CA, NY" maxLength={2} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Months of GI Bill Already Used</label>
               <input type="number" value={monthsUsed} onChange={e => setMonthsUsed(Math.max(0, Math.min(36, parseFloat(e.target.value) || 0)).toString())} placeholder="0 if never used" min="0" max="36" style={inputStyle} />
              </div>
            </div>

            <button onClick={calculateGIBill} style={primaryButtonStyle}>Calculate →</button>

            {giBillResult && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={resultCardStyle}>
                  <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#22c55e' }}>Estimated Benefits</h3>
                  <div style={resultGridStyle}>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Months Remaining</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>
                        {giBillResult.remaining} months
                      </p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Monthly Housing (BAH)</p>
                      <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>
                        ${Math.round(giBillResult.monthlyHousing).toLocaleString()}
                      </p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Monthly Book Stipend</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0 }}>${giBillResult.monthlyBooks}/mo</p>
                    </div>
                    <div style={resultItemStyle}>
                      <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Total Est. Benefits</p>
                      <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>
                        ${Math.round(giBillResult.totalBenefits).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '1rem' }}>
                    ⚠️ Housing based on approx. {giBillResult.stateCode} BAH rates for E5 with dependents. Tuition varies by school.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Official GI Bill Resources</p>
            <div style={tileGridStyle}>
              {giBillLinks.map(link => <LinkTile key={link.url} label={link.label} url={link.url} />)}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'va' && (
        <VADisabilityCalculator />
      )}
    </div>
  )
}

const cardStyle = {
  backgroundColor: '#0f2035',
  border: '1px solid #1e3a5f',
  borderRadius: '12px',
  padding: '1.5rem',
  marginBottom: '1.5rem'
}

const resultCardStyle = {
  backgroundColor: '#0a1628',
  border: '1px solid #1e3a5f',
  borderRadius: '10px',
  padding: '1.25rem'
}

const formGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '1rem',
  marginBottom: '1.5rem'
}

const resultGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
  gap: '1rem'
}

const tileGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
  gap: '0.75rem'
}

const resultItemStyle = {
  backgroundColor: '#0f2035',
  borderRadius: '8px',
  padding: '0.75rem'
}

const labelStyle = {
  display: 'block',
  color: '#8899aa',
  fontSize: '0.85rem',
  marginBottom: '0.5rem'
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #1e3a5f',
  backgroundColor: '#0a1628',
  color: 'white',
  fontSize: '0.95rem',
  boxSizing: 'border-box'
}

const backButtonStyle = {
  backgroundColor: 'transparent',
  color: '#8899aa',
  border: '1px solid #1e3a5f',
  padding: '8px 16px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  cursor: 'pointer'
}

const primaryButtonStyle = {
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none',
  padding: '12px 24px',
  borderRadius: '8px',
  fontSize: '1rem',
  cursor: 'pointer'
}

function VADisabilityCalculator() {
  const [ratings, setRatings] = useState([{ id: 1, rating: '' }])
  const [dependents, setDependents] = useState({
    spouse: false,
    spouseAA: false,
    parents: '0',
    children: '0',
    over18Children: '0'
  })
  const [result, setResult] = useState(null)
  const [activeSection, setActiveSection] = useState('combined')

  // 2024 VA compensation rates
  const vaRates = {
    10: { alone: 171.23 },
    20: { alone: 338.49 },
    30: { alone: 524.31, spouse: 586.31, spouseAA: 654.31, per_parent: 524.31, per_child: 524.31 },
    40: { alone: 755.28, spouse: 838.28, spouseAA: 921.28, per_parent: 755.28, per_child: 755.28 },
    50: { alone: 1075.16, spouse: 1179.16, spouseAA: 1283.16, per_parent: 1075.16, per_child: 1075.16 },
    60: { alone: 1361.88, spouse: 1486.88, spouseAA: 1611.88, per_parent: 1361.88, per_child: 1361.88 },
    70: { alone: 1716.28, spouse: 1862.28, spouseAA: 2008.28, per_parent: 1716.28, per_child: 1716.28 },
    80: { alone: 1995.01, spouse: 2162.01, spouseAA: 2329.01, per_parent: 1995.01, per_child: 1995.01 },
    90: { alone: 2241.91, spouse: 2429.91, spouseAA: 2617.91, per_parent: 2241.91, per_child: 2241.91 },
    100: { alone: 3737.85, spouse: 3946.25, spouseAA: 4154.65, per_parent: 3737.85, per_child: 3737.85 }
  }

  const addRating = () => {
    setRatings(prev => [...prev, { id: Date.now(), rating: '' }])
  }

  const removeRating = (id) => {
    if (ratings.length === 1) return
    setRatings(prev => prev.filter(r => r.id !== id))
  }

  const updateRating = (id, value) => {
    setRatings(prev => prev.map(r => r.id === id ? { ...r, rating: value } : r))
  }

  const calculateCombinedRating = (ratingsList) => {
    // VA "whole person" method
    const sorted = [...ratingsList].sort((a, b) => b - a)
    let remaining = 100
    let combined = 0
    for (const r of sorted) {
      const contribution = (r / 100) * remaining
      combined += contribution
      remaining -= contribution
    }
    return combined
  }

  const roundToNearest10 = (val) => Math.round(val / 10) * 10

  const calculate = () => {
    const validRatings = ratings
      .map(r => parseFloat(r.rating))
      .filter(r => !isNaN(r) && r > 0 && r <= 100)

    if (validRatings.length === 0) {
      alert('Please enter at least one disability rating.')
      return
    }

    const combinedRaw = calculateCombinedRating(validRatings)
    const combinedRounded = roundToNearest10(Math.min(combinedRaw, 100))

    // Get base rate
    const rates = vaRates[combinedRounded] || vaRates[100]
    let monthly = rates.alone

    // Add dependent adjustments (only for 30%+)
    if (combinedRounded >= 30) {
      if (dependents.spouse) monthly = rates.spouse || monthly
      if (dependents.spouseAA) monthly = rates.spouseAA || monthly
      const parents = parseInt(dependents.parents) || 0
      const children = parseInt(dependents.children) || 0
      const over18 = parseInt(dependents.over18Children) || 0
      if (parents > 0) monthly += (vaRates[combinedRounded]?.per_parent - vaRates[combinedRounded]?.alone || 0) * parents * 0.3
      if (children > 0) monthly += 103.55 * children
      if (over18 > 0) monthly += 334.49 * over18
    }

    const isPT = combinedRounded === 100
    const isTDIUEligible = combinedRounded >= 60 || (validRatings.length >= 2 && combinedRounded >= 40)

    setResult({
      combinedRaw: combinedRaw.toFixed(1),
      combinedRounded,
      monthly: monthly.toFixed(2),
      annual: (monthly * 12).toFixed(2),
      isPT,
      isTDIUEligible,
      ratingBreakdown: validRatings.sort((a, b) => b - a)
    })
  }

  const calcStyle = {
    input: { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #1e3a5f', backgroundColor: '#0a1628', color: 'white', fontSize: '0.95rem', boxSizing: 'border-box' },
    label: { display: 'block', color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.5rem' },
    card: { backgroundColor: '#0f2035', border: '1px solid #1e3a5f', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' },
    resultCard: { backgroundColor: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '10px', padding: '1.25rem' },
  }

  return (
    <div>
      <div style={calcStyle.card}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>VA Disability Calculator</h2>
        <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
          Estimates combined disability rating and monthly compensation using 2024 VA rates.
        </p>

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[{ id: 'combined', label: 'Combined Rating' }, { id: 'compensation', label: 'Monthly Pay' }].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid',
              borderColor: activeSection === s.id ? '#2563eb' : '#1e3a5f',
              backgroundColor: activeSection === s.id ? '#2563eb22' : 'transparent',
              color: activeSection === s.id ? '#2563eb' : '#8899aa',
              cursor: 'pointer', fontSize: '0.85rem'
            }}>{s.label}</button>
          ))}
        </div>

        {/* Disability ratings input */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={calcStyle.label}>Your Disability Ratings (%)</label>
          <p style={{ color: '#445566', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
            Add each condition separately. The VA combines them using the "whole person" method — not simple addition.
          </p>
          {ratings.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
              <span style={{ color: '#445566', fontSize: '0.85rem', minWidth: '80px' }}>Condition {i + 1}</span>
              <input
                type="number" min="0" max="100" step="10"
                value={r.rating}
                onChange={e => updateRating(r.id, e.target.value)}
                placeholder="e.g. 70"
                style={{ ...calcStyle.input, maxWidth: '120px' }}
              />
              <span style={{ color: '#445566' }}>%</span>
              {ratings.length > 1 && (
                <button onClick={() => removeRating(r.id)}
                  style={{ background: 'transparent', border: '1px solid #ef444455', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addRating} style={{
            background: 'transparent', border: '1px solid #1e3a5f', color: '#8899aa',
            borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem'
          }}>
            + Add Another Condition
          </button>
        </div>

        {/* Dependents */}
        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#0a1628', borderRadius: '8px', border: '1px solid #1e3a5f' }}>
          <p style={{ color: '#8899aa', fontSize: '0.85rem', marginBottom: '0.75rem', margin: '0 0 0.75rem' }}>
            Dependents <span style={{ color: '#445566', fontSize: '0.75rem' }}>(only affects pay at 30%+)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8899aa', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={dependents.spouse} onChange={e => setDependents(p => ({ ...p, spouse: e.target.checked }))} />
              Spouse
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8899aa', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={dependents.spouseAA} onChange={e => setDependents(p => ({ ...p, spouseAA: e.target.checked }))} />
              Spouse needs Aid & Attendance
            </label>
            <div>
              <label style={calcStyle.label}>Dependent Children (under 18)</label>
              <input type="number" min="0" value={dependents.children} onChange={e => setDependents(p => ({ ...p, children: e.target.value }))} style={{ ...calcStyle.input }} />
            </div>
            <div>
              <label style={calcStyle.label}>Children in School (18-23)</label>
              <input type="number" min="0" value={dependents.over18Children} onChange={e => setDependents(p => ({ ...p, over18Children: e.target.value }))} style={{ ...calcStyle.input }} />
            </div>
            <div>
              <label style={calcStyle.label}>Dependent Parents</label>
              <input type="number" min="0" max="2" value={dependents.parents} onChange={e => setDependents(p => ({ ...p, parents: e.target.value }))} style={{ ...calcStyle.input }} />
            </div>
          </div>
        </div>

        <button onClick={calculate} style={{
          backgroundColor: '#2563eb', color: 'white', border: 'none',
          padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer'
        }}>
          Calculate →
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={calcStyle.resultCard}>
              <h3 style={{ color: '#22c55e', fontSize: '1rem', marginBottom: '1rem' }}>Your Results</h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ backgroundColor: '#0f2035', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Combined Raw Rating</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>{result.combinedRaw}%</p>
                  <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>before VA rounding</p>
                </div>
                <div style={{ backgroundColor: '#0f2035', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>VA Official Rating</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>{result.combinedRounded}%</p>
                  <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>rounded to nearest 10%</p>
                </div>
                <div style={{ backgroundColor: '#0f2035', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly Pay</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>${parseFloat(result.monthly).toLocaleString()}</p>
                  <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>tax-free</p>
                </div>
                <div style={{ backgroundColor: '#0f2035', borderRadius: '8px', padding: '0.75rem' }}>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Annual Pay</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>${parseFloat(result.annual).toLocaleString()}</p>
                  <p style={{ color: '#445566', fontSize: '0.7rem', margin: '4px 0 0' }}>tax-free</p>
                </div>
              </div>

              {/* Rating breakdown */}
              <div style={{ padding: '0.75rem', backgroundColor: '#0f2035', borderRadius: '8px', marginBottom: '1rem' }}>
                <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: '0 0 8px' }}>How VA combines your ratings (whole person method):</p>
                {result.ratingBreakdown.reduce((acc, r, i) => {
                  const remaining = i === 0 ? 100 : acc.remaining
                  const contribution = (r / 100) * remaining
                  const newRemaining = remaining - contribution
                  acc.steps.push({ rating: r, remaining, contribution, newRemaining })
                  acc.remaining = newRemaining
                  return acc
                }, { steps: [], remaining: 100 }).steps.map((step, i) => (
                  <p key={i} style={{ color: '#445566', fontSize: '0.75rem', margin: '2px 0', fontFamily: 'monospace' }}>
                    {i === 0 ? 'Start' : 'Then'}: {step.rating}% of {step.remaining.toFixed(1)}% remaining = {step.contribution.toFixed(1)}% → {step.newRemaining.toFixed(1)}% remaining
                  </p>
                ))}
                <p style={{ color: '#2563eb', fontSize: '0.8rem', margin: '8px 0 0', fontWeight: 600 }}>
                  Combined: {result.combinedRaw}% → rounded to {result.combinedRounded}%
                </p>
              </div>

              {/* P&T */}
              {result.isPT && (
                <div style={{ padding: '0.75rem', backgroundColor: '#14532d', borderRadius: '8px', border: '1px solid #22c55e', marginBottom: '0.75rem' }}>
                  <p style={{ color: '#22c55e', fontWeight: 600, margin: '0 0 4px' }}>🎖️ 100% — Permanent & Total (P&T) Eligible</p>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: 0 }}>
                    At 100%, you may qualify for P&T status, which means your rating is considered permanent and won't be reduced. Benefits include: free healthcare for dependents (CHAMPVA), free tuition at many state schools (DEA Chapter 35), property tax exemptions in most states, and more.
                  </p>
                </div>
              )}

              {/* TDIU */}
              {result.isTDIUEligible && !result.isPT && (
                <div style={{ padding: '0.75rem', backgroundColor: '#1e3a5f', borderRadius: '8px', border: '1px solid #2563eb', marginBottom: '0.75rem' }}>
                  <p style={{ color: '#2563eb', fontWeight: 600, margin: '0 0 4px' }}>💼 You may qualify for TDIU</p>
                  <p style={{ color: '#8899aa', fontSize: '0.8rem', margin: 0 }}>
                    Total Disability Individual Unemployability (TDIU) allows veterans rated 60%+ (or 40%+ with multiple conditions) to receive 100% compensation pay if their disabilities prevent them from holding substantially gainful employment. This is paid at the 100% rate (${(3737.85).toLocaleString()}/mo) even if your combined rating is less.
                  </p>
                </div>
              )}

              <p style={{ color: '#445566', fontSize: '0.75rem', marginTop: '0.75rem' }}>
                ⚠️ Estimates based on 2024 VA rates. Actual compensation may vary. Always verify with the VA or an accredited VSO. Rates updated annually.
              </p>
            </div>

            {/* Resources */}
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Apply for VA Disability', url: 'https://www.va.gov/disability/apply/' },
                { label: 'VA Rates Tables 2024', url: 'https://www.va.gov/disability/compensation-rates/veteran-rates/' },
                { label: 'Find a VSO', url: 'https://www.va.gov/get-help-from-accredited-representative/' },
                { label: 'TDIU Info', url: 'https://www.va.gov/disability/eligibility/special-claims/unemployability/' },
                { label: 'Combined Ratings Table', url: 'https://www.benefits.va.gov/compensation/rates-index.asp' },
              ].map(link => (
                <div key={link.url} onClick={() => window.open(link.url, '_blank')}
                  style={{ padding: '1rem', backgroundColor: '#0a1628', border: '1px solid #1e3a5f', borderRadius: '10px', cursor: 'pointer' }}>
                  <span style={{ color: 'white', fontWeight: '500', fontSize: '0.9rem' }}>{link.label}</span>
                  <span style={{ color: '#2563eb', fontSize: '0.75rem', display: 'block', marginTop: '0.5rem' }}>Visit →</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}