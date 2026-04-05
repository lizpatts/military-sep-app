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