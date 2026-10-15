import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { api } from '../api.js';

// Fixed, consistent color roles used across every chart on this dashboard —
// never re-assigned per-chart. Pre/during/post is a 3-slot categorical
// assignment (blue/orange/aqua); baseline-vs-final is a 2-step sequential
// blue ramp (light = earlier in time, dark = later), since it's the same
// measure at two ordered time points rather than two unrelated categories.
const COLOR = {
  pre: '#2a78d6',
  during: '#eb6834',
  post: '#1baf7a',
  baseline: '#86b6ef',
  final: '#184f95',
  trajectory: '#2a78d6',
};

function StatTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="rd-table rd-stat-table">
        <thead>
          <tr>
            <th>Group</th>
            <th>n</th>
            <th>Mean</th>
            <th>Median</th>
            <th>SD</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label}>
              <td>{r.label}</td>
              <td>{r.n ?? '—'}</td>
              <td>{r.mean ?? '—'}</td>
              <td>{r.median ?? '—'}</td>
              <td>{r.sd ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ title, note, children, stats }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <section className="rd-card">
      <div className="rd-row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="section-title" style={{ marginTop: 0 }}>{title}</h2>
          {note && <p className="lead" style={{ fontSize: '0.88rem', margin: '0 0 12px' }}>{note}</p>}
        </div>
        <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Show chart' : 'Show table'}
        </button>
      </div>
      {showTable ? <StatTable rows={stats} /> : <div style={{ width: '100%', height: 300 }}>{children}</div>}
    </section>
  );
}

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [includeDemo, setIncludeDemo] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    api.getSummary(includeDemo).then(setSummary).catch((err) => setError(err.message));
  }, [includeDemo]);

  const trajectoryCategories = useMemo(() => {
    if (!summary) return [];
    return Array.from(new Set(summary.individualTrajectories.map((t) => t.fearCategoryId)));
  }, [summary]);

  if (error) return <p className="error-text">{error}</p>;
  if (!summary) return <p>Loading…</p>;

  const baselineFinalFear = [
    { label: 'Baseline', value: summary.baselineVsFinalFear.baseline.mean, ...summary.baselineVsFinalFear.baseline },
    { label: 'Final', value: summary.baselineVsFinalFear.final.mean, ...summary.baselineVsFinalFear.final },
  ];
  const baselineFinalAnxiety = [
    { label: 'Baseline', value: summary.baselineVsFinalAnxiety.baseline.mean, ...summary.baselineVsFinalAnxiety.baseline },
    { label: 'Final', value: summary.baselineVsFinalAnxiety.final.mean, ...summary.baselineVsFinalAnxiety.final },
  ];

  const byLevelChart = summary.anxietyByLevel.map((l) => ({
    level: `Level ${l.level}`,
    pre: l.pre.mean,
    during: l.during.mean,
    post: l.post.mean,
  }));

  const bySessionChart = summary.anxietyBySession.map((s) => ({
    session: `Session ${s.sessionNumber}`,
    pre: s.pre.mean,
    during: s.during.mean,
    post: s.post.mean,
  }));

  const filteredTrajectories =
    categoryFilter === 'all'
      ? summary.individualTrajectories
      : summary.individualTrajectories.filter((t) => t.fearCategoryId === categoryFilter);

  // Reshape individual trajectories into one row per session number with a
  // column per participant, which is what recharts' <Line dataKey> wants.
  const sessionNumbers = Array.from(
    new Set(filteredTrajectories.flatMap((t) => t.points.map((p) => p.sessionNumber)))
  ).sort((a, b) => a - b);
  const trajectoryChartData = sessionNumbers.map((sn) => {
    const row = { session: `Session ${sn}` };
    filteredTrajectories.forEach((t) => {
      const point = t.points.find((p) => p.sessionNumber === sn);
      if (point) row[t.studyCode] = point.meanDuring;
    });
    return row;
  });

  const categoryChart = summary.aggregateByCategory.map((c) => ({
    category: c.categoryName,
    baselineFear: c.baselineFear.mean,
    finalFear: c.finalFear.mean,
  }));

  return (
    <div>
      <h1 className="screen-title">Overview &amp; Data</h1>
      <p className="lead">
        Descriptive statistics only (mean / median / SD / n) — this dashboard does not run significance tests or
        make any claim about whether the exposure protocol "worked." Paired participants (with both a baseline and
        final assessment): <strong>{summary.pairedCount}</strong> of {summary.participantCount} total.
      </p>

      <label className="rd-inline-check" style={{ marginBottom: 16, display: 'inline-flex' }}>
        <input type="checkbox" checked={includeDemo} onChange={(e) => setIncludeDemo(e.target.checked)} />
        Include demo participants
      </label>

      <ChartCard
        title="1. Baseline vs. Final Fear Rating"
        note="Mean self-reported fear rating (1-10) at baseline vs. the final assessment, across all paired participants."
        stats={[
          { label: 'Baseline', ...summary.baselineVsFinalFear.baseline },
          { label: 'Final', ...summary.baselineVsFinalFear.final },
        ]}
      >
        <ResponsiveContainer>
          <BarChart data={baselineFinalFear} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <Tooltip />
            <Bar dataKey="value" name="Mean fear rating" radius={[4, 4, 0, 0]}>
              {baselineFinalFear.map((entry, i) => (
                <Cell key={entry.label} fill={i === 0 ? COLOR.baseline : COLOR.final} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="2. Baseline vs. Final Anxiety Rating"
        note="Mean self-reported general anxiety rating (1-10) at baseline vs. the final assessment."
        stats={[
          { label: 'Baseline', ...summary.baselineVsFinalAnxiety.baseline },
          { label: 'Final', ...summary.baselineVsFinalAnxiety.final },
        ]}
      >
        <ResponsiveContainer>
          <BarChart data={baselineFinalAnxiety} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <Tooltip />
            <Bar dataKey="value" name="Mean anxiety rating" radius={[4, 4, 0, 0]}>
              {baselineFinalAnxiety.map((entry, i) => (
                <Cell key={entry.label} fill={i === 0 ? COLOR.baseline : COLOR.final} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="3. Anxiety Before / During / After Each Exposure Level"
        note="Mean rating across all recorded exposure trials at each level, regardless of session or category."
        stats={summary.anxietyByLevel.flatMap((l) => [
          { label: `Level ${l.level} — Before`, ...l.pre },
          { label: `Level ${l.level} — During`, ...l.during },
          { label: `Level ${l.level} — After`, ...l.post },
        ])}
      >
        <ResponsiveContainer>
          <BarChart data={byLevelChart} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="level" tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="pre" name="Before" fill={COLOR.pre} radius={[4, 4, 0, 0]} />
            <Bar dataKey="during" name="During" fill={COLOR.during} radius={[4, 4, 0, 0]} />
            <Bar dataKey="post" name="After" fill={COLOR.post} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="4. Anxiety Across Repeated Sessions"
        note="Mean before/during/after ratings, averaged across all participants and levels within each session number."
        stats={summary.anxietyBySession.flatMap((s) => [
          { label: `Session ${s.sessionNumber} — Before`, ...s.pre },
          { label: `Session ${s.sessionNumber} — During`, ...s.during },
          { label: `Session ${s.sessionNumber} — After`, ...s.post },
        ])}
      >
        <ResponsiveContainer>
          <LineChart data={bySessionChart} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="session" tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="pre" name="Before" stroke={COLOR.pre} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="during" name="During" stroke={COLOR.during} strokeWidth={2} dot={{ r: 4 }} />
            <Line type="monotone" dataKey="post" name="After" stroke={COLOR.post} strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <section className="rd-card">
        <div className="rd-row" style={{ justifyContent: 'space-between' }}>
          <h2 className="section-title" style={{ marginTop: 0 }}>5. Individual Participant Trajectories</h2>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {trajectoryCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <p className="lead" style={{ fontSize: '0.88rem' }}>
          Each line is one participant's mean "during exposure" rating per session — shown to reveal spread across
          individuals, not to compare specific participants against each other.
        </p>
        <div style={{ width: '100%', height: 320 }}>
          <ResponsiveContainer>
            <LineChart data={trajectoryChartData} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
              <XAxis dataKey="session" tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
              <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
              <Tooltip />
              {filteredTrajectories.map((t) => (
                <Line
                  key={t.studyCode}
                  type="monotone"
                  dataKey={t.studyCode}
                  stroke={COLOR.trajectory}
                  strokeOpacity={0.45}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls
                  isAnimationActive={false}
                  name={t.studyCode}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <ChartCard
        title="6. Aggregate Results by Fear Category"
        note="Mean baseline vs. final fear rating for each fear category, across paired participants in that category."
        stats={summary.aggregateByCategory.flatMap((c) => [
          { label: `${c.categoryName} — Baseline`, ...c.baselineFear },
          { label: `${c.categoryName} — Final`, ...c.finalFear },
        ])}
      >
        <ResponsiveContainer>
          <BarChart data={categoryChart} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
            <XAxis dataKey="category" tick={{ fill: '#52626b', fontSize: 12 }} axisLine={{ stroke: '#c3c2b7' }} />
            <YAxis domain={[0, 10]} tick={{ fill: '#52626b', fontSize: 13 }} axisLine={{ stroke: '#c3c2b7' }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="baselineFear" name="Baseline" fill={COLOR.baseline} radius={[4, 4, 0, 0]} />
            <Bar dataKey="finalFear" name="Final" fill={COLOR.final} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
