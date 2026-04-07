'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
import Sidebar from '../components/Sidebar'

const LinkTile = ({ label, url }) => (
  <div onClick={() => window.open(url, '_blank')} style={{
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    padding: '1rem', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb',
    borderRadius: '10px', cursor: 'pointer', minHeight: '70px'
  }}>
    <span style={{ color: '#111', fontWeight: '500', fontSize: '0.9rem' }}>{label}</span>
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
    { label: 'About GI Bill Benefits', url: 'https://www.va.gov/education/about-gi-bill-benefits/' },
    { label: 'Apply for Education Benefits', url: 'https://www.va.gov/education/how-to-apply/' },
    { label: 'GI Bill Comparison Tool', url: 'https://www.va.gov/education/choosing-a-school/gi-bill-comparison-tool/' },
    { label: 'Check Your GI Bill Balance', url: 'https://www.va.gov/education/gi-bill/post-9-11/ch-33-benefit/' },
    { label: 'BAH Rate Calculator', url: 'https://www.travel.dod.mil/Allowances/Basic-Allowance-for-Housing/BAH-Rate-Lookup/' },
  ]

  useEffect(() => {
    if (tspResult && chartRef.current) {
      if (chartInstance.current) chartInstance.current.destroy()
      if (window.Chart) { buildChart() } else {
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
    const contributionData = []
    const labels = []
    const startAge = tspResult.currentAge
    let nominalBalance = balance
    let realBalance = balance
    let totalContributed = balance

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
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { labels: { color: '#6b7280', font: { size: 12 } } },
          tooltip: {
            backgroundColor: '#fff', borderColor: '#e5e7eb', borderWidth: 1,
            titleColor: '#6b7280', bodyColor: '#111', padding: 12,
            callbacks: { label: ctx => `${ctx.dataset.label}: $${ctx.raw.toLocaleString()}` }
          }
        },
        scales: {
          x: { ticks: { color: '#9ca3af', maxTicksLimit: 10 }, grid: { color: '#f3f4f6' } },
          y: { ticks: { color: '#9ca3af', callback: val => `$${(val / 1000).toFixed(0)}k` }, grid: { color: '#f3f4f6' } }
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

    const balanceAtSep = balance * Math.pow(1 + rate, yearsContributing) +
      (rate > 0 ? totalAnnualContribution * ((Math.pow(1 + rate, yearsContributing) - 1) / rate) : totalAnnualContribution * yearsContributing)
    const futureBalance = balanceAtSep * Math.pow(1 + rate, yearsGrowing)
    const realBalanceAtSep = balance * Math.pow(1 + realRate, yearsContributing) +
      (realRate > 0 ? totalAnnualContribution * ((Math.pow(1 + realRate, yearsContributing) - 1) / realRate) : totalAnnualContribution * yearsContributing)
    const realFutureBalance = realBalanceAtSep * Math.pow(1 + realRate, yearsGrowing)

    setTspResult({
      totalBalance: futureBalance, realTotalBalance: realFutureBalance,
      monthlyIncome: futureBalance * 0.04 / 12, realMonthlyIncome: realFutureBalance * 0.04 / 12,
      totalAnnualContribution, militaryMatch, userContrib,
      totalYears, yearsContributing, yearsGrowing, ddAge, sepAge, currentAge: age
    })
  }

  const calculateGIBill = () => {
    if (!schoolState) { alert('Please enter your school state'); return }
    const used = Math.max(0, parseFloat(monthsUsed) || 0)
    if (used > 36) { alert('GI Bill maximum is 36 months.'); return }
    const remaining = Math.max(0, 36 - used)
    const bahRates = {
      'CA': 3200, 'NY': 3500, 'TX': 1800, 'FL': 1900, 'VA': 2400, 'WA': 2600,
      'CO': 2200, 'GA': 1800, 'NC': 1700, 'AZ': 1900, 'OH': 1600, 'PA': 1900,
      'IL': 2100, 'MA': 2800, 'MD': 2600, 'default': 1800
    }
    const stateCode = schoolState.toUpperCase().trim()
    const monthlyBAH = bahRates[stateCode] || bahRates['default']
    const enrollmentMultiplier = enrollmentType === 'full' ? 1 : enrollmentType === 'three_quarter' ? 0.8 : enrollmentType === 'half' ? 0.6 : 0.4
    const monthlyHousing = monthlyBAH * enrollmentMultiplier
    const monthlyBooks = enrollmentType === 'full' ? 83 : 42
    setGiBillResult({ remaining, monthlyHousing, monthlyBooks, totalBenefits: remaining * (monthlyHousing + monthlyBooks), stateCode })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, Inter, sans-serif', display: 'flex' }}>
      <Sidebar />
      <div style={{ marginLeft: '220px', flex: 1 }}>
        <div style={{ backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', padding: '14px 32px' }}>
          <h1 style={{ fontSize: '17px', fontWeight: '600', color: '#111', margin: 0, letterSpacing: '-0.3px' }}>Financial Calculators</h1>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '2px 0 0' }}>Estimates only — consult a financial advisor for personalized advice.</p>
        </div>
        <div style={{ padding: '28px 32px' }}>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
            {[
              { id: 'tsp', label: '💰 TSP Estimator' },
              { id: 'gibill', label: '🎓 GI Bill Calculator' },
              { id: 'va', label: '🎖️ VA Disability' },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: '10px 20px', borderRadius: '8px', border: '1px solid',
                borderColor: activeTab === tab.id ? '#2563eb' : '#e5e7eb',
                backgroundColor: activeTab === tab.id ? '#2563eb' : '#fff',
                color: activeTab === tab.id ? '#fff' : '#6b7280',
                fontSize: '0.9rem', cursor: 'pointer'
              }}>
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'tsp' && (
            <div>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111' }}>TSP Retirement Estimator</h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                  Includes Blended Retirement System (BRS) military match calculation.
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9rem', color: '#1d4ed8' }}>Blended Retirement System (BRS)</p>
                    <p style={{ margin: '4px 0 0', color: '#6b7280', fontSize: '0.8rem' }}>
                      Joined after Jan 1, 2018, or opted in. Military matches up to 5% of base pay.
                    </p>
                  </div>
                  <button onClick={() => setIsBRS(!isBRS)} style={{
                    marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px', border: '1px solid',
                    borderColor: isBRS ? '#22c55e' : '#e5e7eb',
                    backgroundColor: isBRS ? '#f0fdf4' : '#f9fafb',
                    color: isBRS ? '#15803d' : '#6b7280',
                    cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap'
                  }}>
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
                    <p style={noteStyle}>Contributions stop at separation. Balance continues to grow.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Target Drawdown Age</label>
                    <input type="number" value={drawdownAge} onChange={e => setDrawdownAge(e.target.value)} placeholder="e.g. 60" style={inputStyle} />
                    <p style={noteStyle}>Penalty-free access at 59½, or 55 if separating from federal service that year.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Current TSP Balance ($)</label>
                    <input type="number" value={tspBalance} onChange={e => setTspBalance(e.target.value)} placeholder="e.g. 50000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Your Annual Contribution ($)</label>
                    <input type="number" value={annualContribution} onChange={e => setAnnualContribution(e.target.value)} placeholder="e.g. 6000" style={inputStyle} />
                    <p style={noteStyle}>2024 limit: ${TSP_LIMIT_2024.toLocaleString()} · Age 50+: ${TSP_CATCHUP_LIMIT.toLocaleString()}</p>
                  </div>
                  {isBRS && (
                    <div>
                      <label style={labelStyle}>Annual Base Pay ($)</label>
                      <input type="number" value={basePay} onChange={e => setBasePay(e.target.value)} placeholder="e.g. 45000" style={inputStyle} />
                      <p style={noteStyle}>Used to calculate military match (up to 5% of base pay)</p>
                    </div>
                  )}
                  <div>
                    <label style={labelStyle}>Expected Annual Return (%)</label>
                    <input type="number" value={tspReturn} onChange={e => setTspReturn(e.target.value)} placeholder="default: 7" style={inputStyle} />
                    <p style={noteStyle}>Historical average ~7%. Conservative: 5%.</p>
                  </div>
                  <div>
                    <label style={labelStyle}>Inflation Rate (%)</label>
                    <input type="number" value={inflation} onChange={e => setInflation(e.target.value)} placeholder="default: 3" style={inputStyle} />
                    <p style={noteStyle}>Historical average ~3%.</p>
                  </div>
                </div>

                <button onClick={calculateTSP} style={primaryButtonStyle}>Calculate →</button>

                {tspResult && (
                  <div style={{ marginTop: '1.5rem' }}>
                    <div style={resultCardStyle}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#22c55e' }}>
                        Projected Balance at Drawdown Age {tspResult.ddAge}
                      </h3>
                      <p style={{ color: '#6b7280', fontSize: '0.8rem', marginBottom: '1rem' }}>
                        Contributing for {tspResult.yearsContributing} years · Growing without contributions for {tspResult.yearsGrowing} years
                      </p>
                      <div style={resultGridStyle}>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Nominal Balance</p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>${Math.round(tspResult.totalBalance).toLocaleString()}</p>
                          <p style={noteStyle}>before inflation</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Real Balance (today's $)</p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>${Math.round(tspResult.realTotalBalance).toLocaleString()}</p>
                          <p style={noteStyle}>inflation adjusted</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly Income</p>
                          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>${Math.round(tspResult.monthlyIncome).toLocaleString()}</p>
                          <p style={noteStyle}>4% rule, nominal</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly (real)</p>
                          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>${Math.round(tspResult.realMonthlyIncome).toLocaleString()}</p>
                          <p style={noteStyle}>inflation adjusted</p>
                        </div>
                        {isBRS && (
                          <div style={resultItemStyle}>
                            <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Military Match (annual)</p>
                            <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>${Math.round(tspResult.militaryMatch).toLocaleString()}</p>
                            <p style={noteStyle}>free money from BRS</p>
                          </div>
                        )}
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Total Annual Contribution</p>
                          <p style={{ fontSize: '1.3rem', fontWeight: 'bold', margin: 0, color: '#111' }}>${Math.round(tspResult.totalAnnualContribution).toLocaleString()}</p>
                          <p style={noteStyle}>yours + match</p>
                        </div>
                      </div>

                      <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fffbeb', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#92400e' }}>
                          ⏰ Penalty-free access: Age 59½ (standard) · Age 55 if separating from federal service in the year you turn 55+ (Rule of 55)
                        </p>
                      </div>

                      {tspResult.ddAge < 59.5 && (
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fca5a5' }}>
                          <p style={{ margin: 0, fontSize: '0.8rem', color: '#dc2626' }}>
                            ⚠️ Your target drawdown age ({tspResult.ddAge}) is before 59½. Early withdrawals may incur a 10% penalty plus income tax unless the Rule of 55 applies.
                          </p>
                        </div>
                      )}
                    </div>

                    <div style={{ ...resultCardStyle, marginTop: '1rem' }}>
                      <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#111' }}>Growth Over Time</h3>
                      <canvas ref={chartRef} style={{ width: '100%' }} />
                    </div>

                    <p style={noteStyle}>
                      ⚠️ Estimates only. Does not account for taxes, RMDs, or changes in contribution rate. Consult a financial advisor.
                    </p>
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Official TSP Resources</p>
                <div style={tileGridStyle}>
                  {tspLinks.map(link => <LinkTile key={link.url} label={link.label} url={link.url} />)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'gibill' && (
            <div>
              <div style={cardStyle}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: '#111' }}>GI Bill Benefits Estimator</h2>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
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
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Months Remaining</p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>{giBillResult.remaining} months</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Monthly Housing (BAH)</p>
                          <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>${Math.round(giBillResult.monthlyHousing).toLocaleString()}</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Monthly Book Stipend</p>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#111' }}>${giBillResult.monthlyBooks}/mo</p>
                        </div>
                        <div style={resultItemStyle}>
                          <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Total Est. Benefits</p>
                          <p style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>${Math.round(giBillResult.totalBenefits).toLocaleString()}</p>
                        </div>
                      </div>
                      <p style={noteStyle}>⚠️ Housing based on approx. {giBillResult.stateCode} BAH rates for E5 with dependents. Tuition varies by school.</p>
                    </div>
                  </div>
                )}
              </div>

              <div style={cardStyle}>
                <p style={{ color: '#6b7280', fontSize: '0.85rem', marginBottom: '0.75rem' }}>Official GI Bill Resources</p>
                <div style={tileGridStyle}>
                  {giBillLinks.map(link => <LinkTile key={link.url} label={link.label} url={link.url} />)}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'va' && <VADisabilityCalculator />}

        </div>
      </div>
    </div>
  )
}

const cardStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '1.5rem', marginBottom: '1.5rem' }
const resultCardStyle = { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1.25rem' }
const resultItemStyle = { backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }
const resultGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }
const tileGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }
const labelStyle = { display: 'block', color: '#2563eb', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }
const inputStyle = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '0.95rem', boxSizing: 'border-box' }
const primaryButtonStyle = { backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '12px 24px', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }
const noteStyle = { color: '#9ca3af', fontSize: '0.75rem', marginTop: '4px' }

function VADisabilityCalculator() {
  const [ratings, setRatings] = useState([{ id: 1, rating: '', name: '' }])
  const [dependents, setDependents] = useState({ spouse: false, spouseAA: false, parents: '0', children: '0', over18Children: '0' })
  const [result, setResult] = useState(null)
  const [activeSection, setActiveSection] = useState('combined')
  const [user, setUser] = useState(null)
  const [scenarios, setScenarios] = useState([])
  const [scenarioName, setScenarioName] = useState('')
  const [saveLoading, setSaveLoading] = useState(false)
  const [showScenarios, setShowScenarios] = useState(false)
  const [saveMessage, setSaveMessage] = useState(null)

  useEffect(() => {
    const init = async () => {
      try {
        const mod = await import('../../lib/supabase')
        const sb = mod.supabase || mod.default
        const { data: { session } } = await sb.auth.getSession()
        if (session?.user) { setUser(session.user); loadScenarios(session.user.id, sb) }
      } catch (e) { console.log('Auth init error:', e) }
    }
    init()
  }, [])

  async function loadScenarios(userId, sb) {
    const { data } = await sb.from('va_disability_scenarios').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    setScenarios(data || [])
  }

  async function saveScenario() {
    if (!user) { alert('Sign in to save scenarios.'); return }
    if (!result) { alert('Calculate a result first.'); return }
    if (!scenarioName.trim()) { alert('Please name this scenario.'); return }
    setSaveLoading(true)
    setSaveMessage(null)
    const { supabase: sb } = await import('../../lib/supabase')
    const { error } = await sb.from('va_disability_scenarios').insert({ user_id: user.id, name: scenarioName.trim(), ratings, dependents, result })
    if (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save. Try again.' })
    } else {
      setSaveMessage({ type: 'success', text: `"${scenarioName}" saved!` })
      setScenarioName('')
      const { supabase: sb2 } = await import('../../lib/supabase')
      loadScenarios(user.id, sb2)
    }
    setSaveLoading(false)
  }

  async function deleteScenario(id) {
    if (!confirm('Delete this scenario?')) return
    const { supabase: sb } = await import('../../lib/supabase')
    await sb.from('va_disability_scenarios').delete().eq('id', id)
    setScenarios(prev => prev.filter(s => s.id !== id))
  }

  function loadScenario(scenario) {
    setRatings(scenario.ratings)
    setDependents(scenario.dependents)
    setResult(scenario.result)
    setShowScenarios(false)
    setSaveMessage({ type: 'success', text: `Loaded "${scenario.name}"` })
  }

  const vaRates = {
    10: { alone: 171.23 }, 20: { alone: 338.49 },
    30: { alone: 524.31, spouse: 586.31, spouseAA: 654.31 },
    40: { alone: 755.28, spouse: 838.28, spouseAA: 921.28 },
    50: { alone: 1075.16, spouse: 1179.16, spouseAA: 1283.16 },
    60: { alone: 1361.88, spouse: 1486.88, spouseAA: 1611.88 },
    70: { alone: 1716.28, spouse: 1862.28, spouseAA: 2008.28 },
    80: { alone: 1995.01, spouse: 2162.01, spouseAA: 2329.01 },
    90: { alone: 2241.91, spouse: 2429.91, spouseAA: 2617.91 },
    100: { alone: 3737.85, spouse: 3946.25, spouseAA: 4154.65 }
  }

  const addRating = () => { setRatings(prev => [...prev, { id: Date.now(), rating: '', name: '' }]); setResult(null) }
  const removeRating = (id) => { if (ratings.length > 1) { setRatings(prev => prev.filter(r => r.id !== id)); setResult(null) } }
  const updateRating = (id, field, value) => { setRatings(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r)); setResult(null) }

  const calculateCombinedRating = (ratingsList) => {
    const sorted = [...ratingsList].sort((a, b) => b - a)
    let remaining = 100, combined = 0
    for (const r of sorted) { const c = (r / 100) * remaining; combined += c; remaining -= c }
    return combined
  }

  const roundToNearest10 = (val) => Math.round(val / 10) * 10

  const calculate = () => {
    setResult(null)
    const validRatings = ratings.filter(r => !isNaN(parseFloat(r.rating)) && parseFloat(r.rating) > 0)
    if (validRatings.length === 0) { alert('Please enter at least one disability rating.'); return }
    const numericRatings = validRatings.map(r => parseFloat(r.rating))
    const combinedRaw = calculateCombinedRating(numericRatings)
    const combinedRounded = roundToNearest10(Math.min(combinedRaw, 100))
    const rates = vaRates[combinedRounded] || vaRates[100]
    let monthly = rates.alone
    if (combinedRounded >= 30) {
      if (dependents.spouseAA && rates.spouseAA) monthly = rates.spouseAA
      else if (dependents.spouse && rates.spouse) monthly = rates.spouse
      const children = parseInt(dependents.children) || 0
      const over18 = parseInt(dependents.over18Children) || 0
      const parents = parseInt(dependents.parents) || 0
      if (children > 0) monthly += 103.55 * children
      if (over18 > 0) monthly += 334.49 * over18
      if (parents > 0) monthly += 43.00 * parents
    }
    const isPT = combinedRounded === 100
    const isTDIUEligible = combinedRounded >= 60 || (validRatings.length >= 2 && combinedRounded >= 40)
    setResult({
      combinedRaw: combinedRaw.toFixed(1), combinedRounded,
      monthly: monthly.toFixed(2), annual: (monthly * 12).toFixed(2),
      isPT, isTDIUEligible,
      ratingBreakdown: validRatings.map(r => ({ rating: parseFloat(r.rating), name: r.name || null })).sort((a, b) => b.rating - a.rating)
    })
  }

  const vaInput = { width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#f9fafb', color: '#111', fontSize: '0.95rem', boxSizing: 'border-box' }
  const vaLabel = { display: 'block', color: '#2563eb', fontSize: '0.85rem', marginBottom: '0.5rem', fontWeight: '600' }

  return (
    <div>
      <div style={cardStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: '#111' }}>VA Disability Calculator</h2>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '4px', marginBottom: 0 }}>
              Estimates combined rating and monthly compensation using 2024 VA rates.
            </p>
          </div>
          {user && (
            <button onClick={() => setShowScenarios(!showScenarios)} style={{
              background: showScenarios ? '#eff6ff' : 'transparent', border: '1px solid #2563eb',
              color: '#2563eb', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}>
              📋 My Scenarios ({scenarios.length})
            </button>
          )}
        </div>

        {showScenarios && (
          <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#111', fontSize: '0.95rem', margin: '0 0 1rem' }}>Saved Scenarios</h3>
            {scenarios.length === 0 ? (
              <p style={{ color: '#6b7280', fontSize: '0.85rem' }}>No saved scenarios yet. Calculate a result and save it below.</p>
            ) : (
              scenarios.map(s => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <p style={{ color: '#111', margin: 0, fontWeight: 600, fontSize: '0.9rem' }}>{s.name}</p>
                    <p style={{ color: '#6b7280', margin: 0, fontSize: '0.8rem' }}>
                      {s.result.combinedRounded}% combined · ${parseFloat(s.result.monthly).toLocaleString()}/mo · {new Date(s.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => loadScenario(s)} style={{ background: '#eff6ff', color: '#2563eb', border: '1px solid #2563eb', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Load</button>
                    <button onClick={() => deleteScenario(s.id)} style={{ background: 'transparent', color: '#ef4444', border: '1px solid #fca5a5', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '0.8rem' }}>Delete</button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
          {[{ id: 'combined', label: 'Combined Rating' }, { id: 'compensation', label: 'Monthly Pay' }].map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id)} style={{
              padding: '8px 16px', borderRadius: '8px', border: '1px solid',
              borderColor: activeSection === s.id ? '#2563eb' : '#e5e7eb',
              backgroundColor: activeSection === s.id ? '#eff6ff' : '#fff',
              color: activeSection === s.id ? '#2563eb' : '#6b7280',
              cursor: 'pointer', fontSize: '0.85rem'
            }}>{s.label}</button>
          ))}
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={vaLabel}>Your Disability Ratings (%)</label>
          <p style={noteStyle}>Add each condition separately. Name is optional but helps you track what's what.</p>
          {ratings.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ color: '#9ca3af', fontSize: '0.85rem', minWidth: '24px' }}>{i + 1}.</span>
              <input value={r.name} onChange={e => updateRating(r.id, 'name', e.target.value)} placeholder="Condition name (optional)" style={{ ...vaInput, maxWidth: '220px' }} />
              <input type="number" min="0" max="100" step="10" value={r.rating} onChange={e => updateRating(r.id, 'rating', e.target.value)} placeholder="e.g. 70" style={{ ...vaInput, maxWidth: '100px' }} />
              <span style={{ color: '#6b7280' }}>%</span>
              {ratings.length > 1 && (
                <button onClick={() => removeRating(r.id)} style={{ background: 'transparent', border: '1px solid #fca5a5', color: '#ef4444', borderRadius: '6px', padding: '6px 10px', cursor: 'pointer', fontSize: '0.8rem' }}>✕</button>
              )}
            </div>
          ))}
          <button onClick={addRating} style={{ background: '#f9fafb', border: '1px solid #e5e7eb', color: '#6b7280', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            + Add Another Condition
          </button>
        </div>

        <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>
            Dependents <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>(only affects pay at 30%+)</span>
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={dependents.spouse} onChange={e => setDependents(p => ({ ...p, spouse: e.target.checked }))} />
              Spouse
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6b7280', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={dependents.spouseAA} onChange={e => setDependents(p => ({ ...p, spouseAA: e.target.checked }))} />
              Spouse needs Aid & Attendance
            </label>
            <div>
              <label style={vaLabel}>Dependent Children (under 18)</label>
              <input type="number" min="0" value={dependents.children} onChange={e => setDependents(p => ({ ...p, children: e.target.value }))} style={vaInput} />
            </div>
            <div>
              <label style={vaLabel}>Children in School (18-23)</label>
              <input type="number" min="0" value={dependents.over18Children} onChange={e => setDependents(p => ({ ...p, over18Children: e.target.value }))} style={vaInput} />
            </div>
            <div>
              <label style={vaLabel}>Dependent Parents</label>
              <input type="number" min="0" max="2" value={dependents.parents} onChange={e => setDependents(p => ({ ...p, parents: e.target.value }))} style={vaInput} />
            </div>
          </div>
        </div>

        <button onClick={calculate} style={primaryButtonStyle}>Calculate →</button>

        {result && (
          <div style={{ marginTop: '1.5rem' }}>
            <div style={resultCardStyle}>
              <h3 style={{ color: '#22c55e', fontSize: '1rem', marginBottom: '1rem' }}>Your Results</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div style={resultItemStyle}>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Combined Raw Rating</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#2563eb' }}>{result.combinedRaw}%</p>
                  <p style={noteStyle}>before VA rounding</p>
                </div>
                <div style={resultItemStyle}>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>VA Official Rating</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#22c55e' }}>{result.combinedRounded}%</p>
                  <p style={noteStyle}>rounded to nearest 10%</p>
                </div>
                <div style={resultItemStyle}>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Monthly Pay</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#f59e0b' }}>${parseFloat(result.monthly).toLocaleString()}</p>
                  <p style={noteStyle}>tax-free</p>
                </div>
                <div style={resultItemStyle}>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 4px' }}>Est. Annual Pay</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: '#111' }}>${parseFloat(result.annual).toLocaleString()}</p>
                  <p style={noteStyle}>tax-free</p>
                </div>
              </div>

              <div style={{ padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', marginBottom: '1rem' }}>
                <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: '0 0 8px' }}>How VA combines your ratings (whole person method):</p>
                {result.ratingBreakdown.reduce((acc, r, i) => {
                  const remaining = i === 0 ? 100 : acc.remaining
                  const contribution = (r.rating / 100) * remaining
                  const newRemaining = remaining - contribution
                  acc.steps.push({ ...r, remaining, contribution, newRemaining })
                  acc.remaining = newRemaining
                  return acc
                }, { steps: [], remaining: 100 }).steps.map((step, i) => (
                  <p key={i} style={{ color: '#9ca3af', fontSize: '0.75rem', margin: '2px 0', fontFamily: 'monospace' }}>
                    {i === 0 ? 'Start' : 'Then'}: {step.name ? `${step.name} (${step.rating}%)` : `${step.rating}%`} of {step.remaining.toFixed(1)}% remaining = {step.contribution.toFixed(1)}% → {step.newRemaining.toFixed(1)}% left
                  </p>
                ))}
                <p style={{ color: '#2563eb', fontSize: '0.8rem', margin: '8px 0 0', fontWeight: 600 }}>
                  Combined: {result.combinedRaw}% → rounded to {result.combinedRounded}%
                </p>
              </div>

              {result.isPT && (
                <div style={{ padding: '0.75rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #86efac', marginBottom: '0.75rem' }}>
                  <p style={{ color: '#15803d', fontWeight: 600, margin: '0 0 4px' }}>🎖️ 100% — Permanent & Total (P&T) Eligible</p>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
                    At 100%, you may qualify for P&T status meaning your rating won't be reduced. Benefits include free healthcare for dependents (CHAMPVA), free tuition at many state schools (DEA Ch. 35), property tax exemptions in most states, and more.
                  </p>
                </div>
              )}

              {result.isTDIUEligible && !result.isPT && (
                <div style={{ padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', marginBottom: '0.75rem' }}>
                  <p style={{ color: '#1d4ed8', fontWeight: 600, margin: '0 0 4px' }}>💼 You may qualify for TDIU</p>
                  <p style={{ color: '#6b7280', fontSize: '0.8rem', margin: 0 }}>
                    Total Disability Individual Unemployability (TDIU) allows veterans rated 60%+ (or 40%+ with multiple conditions) to receive 100% pay if disabilities prevent gainful employment. Paid at the 100% rate (${(3737.85).toLocaleString()}/mo) even if your combined rating is less.
                  </p>
                </div>
              )}

              {user ? (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: '0 0 0.75rem' }}>💾 Save this scenario</p>
                  {saveMessage && (
                    <p style={{ color: saveMessage.type === 'success' ? '#22c55e' : '#ef4444', fontSize: '0.85rem', margin: '0 0 0.5rem' }}>{saveMessage.text}</p>
                  )}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input value={scenarioName} onChange={e => setScenarioName(e.target.value)} placeholder='e.g. "Best case" or "Current claim"' onKeyDown={e => e.key === 'Enter' && saveScenario()} style={{ ...vaInput, flex: 1 }} />
                    <button onClick={saveScenario} disabled={saveLoading} style={{ background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap', opacity: saveLoading ? 0.6 : 1 }}>
                      {saveLoading ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', textAlign: 'center' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.85rem', margin: 0 }}>Sign in to save and compare scenarios</p>
                </div>
              )}

              <p style={noteStyle}>⚠️ Estimates based on 2024 VA rates. Always verify with the VA or an accredited VSO.</p>
            </div>

            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
{[
                { label: 'File a VA Disability Claim', url: 'https://www.va.gov/disability/file-disability-claim-form-21-526ez/' },
                { label: 'VA Compensation Rates 2024', url: 'https://www.va.gov/disability/compensation-rates/veteran-rates/' },
                { label: 'Find an Accredited VSO', url: 'https://www.va.gov/get-help-from-accredited-representative/find-rep/' },
                { label: 'TDIU — Unemployability Info', url: 'https://www.va.gov/disability/eligibility/special-claims/unemployability/' },
                { label: 'VA Combined Ratings Info', url: 'https://www.va.gov/disability/about-disability-ratings/' },
              ].map(link => <LinkTile key={link.url} label={link.label} url={link.url} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}