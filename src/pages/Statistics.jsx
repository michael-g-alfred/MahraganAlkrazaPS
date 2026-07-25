import React, { useMemo, useState, useEffect, useRef, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Church,
  Gamepad2,
  Layers,
  TrendingUp,
  Trophy,
  ChevronDown,
  Download,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useFetch from "../hooks/useFetch";
import Loader from "../components/Loader";
import gamesData from "../data/games";
import stagesData from "../data/stages";
import { getPrivileges } from "../utils/permissions";
import { useAuth } from "../context/AuthContext";

// ─── ألوان الرسومات (متناسقة مع هوية الموقع الأزرق) ──────────────────
const PALETTE = [
  "#1d4ed8", // blue-700
  "#059669", // emerald-600
  "#e11d48", // rose-600
  "#d97706", // amber-600
  "#7c3aed", // violet-600
  "#0891b2", // cyan-600
  "#db2777", // pink-600
  "#65a30d", // lime-600
];

const GAME_COLOR = {};
gamesData.forEach((g, i) => (GAME_COLOR[g.name] = PALETTE[i % PALETTE.length]));

const STAGE_ORDER = stagesData.map((s) => s.name);
function stageIndex(stage) {
  const i = STAGE_ORDER.findIndex((s) => s === stage || s.includes(stage));
  return i === -1 ? 999 : i;
}

function shortChurch(name = "") {
  return name.replace(/^كنيسة\s+/, "").trim();
}

// ─── عداد أرقام متحرك ─────────────────────────────────────────────────
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);

    function step(ts) {
      if (startRef.current === null) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setValue(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return value;
}

// ─── حاوية Section بأنيميشن ظهور عند التمرير ───────────────────────────
function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      className={className}>
      {children}
    </motion.div>
  );
}

function StatCard({ icon: Icon, label, value, color, delay }) {
  const count = useCountUp(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45, delay, ease: "easeOut" }}
      whileHover={{ y: -3 }}
      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: `${color}1a`, color }}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      <p className="text-3xl font-extrabold text-slate-800 tabular-nums leading-none">
        {count}
      </p>
      <p className="text-xs font-semibold text-slate-400 mt-2">{label}</p>
    </motion.div>
  );
}

// ─── تاب إحصائية قابل للتوسيع (Accordion) ─────────────────────────────
function StatTab({
  icon: Icon,
  title,
  subtitle,
  badge,
  defaultOpen = false,
  forceOpen = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = open || forceOpen;
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-right hover:bg-slate-50/70 transition-colors">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold text-slate-800 leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
        {badge != null && (
          <span className="text-base font-extrabold text-blue-700 tabular-nums px-1.5 flex-shrink-0">
            {badge}
          </span>
        )}
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="flex-shrink-0 print:hidden">
          <ChevronDown className="w-4.5 h-4.5 text-slate-400" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden">
            <div className="px-4 pb-5 pt-1 flex flex-col gap-4 border-t border-slate-100">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── جدول متجاوب مع أنيميشن للصفوف ────────────────────────────────────
function DataTable({ columns, rows, highlightLastCol = false }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm min-w-[520px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((c) => (
              <th
                key={c}
                className="px-3 py-2.5 text-center font-bold text-slate-500 text-xs whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <motion.tr
              key={ri}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(ri * 0.03, 0.6) }}
              className={`border-b border-slate-100 last:border-0 ${
                ri % 2 === 0 ? "bg-white" : "bg-slate-50/60"
              } hover:bg-blue-50/60 transition-colors`}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-3 py-2 text-center whitespace-nowrap ${
                    ci === 0 ? "font-semibold text-slate-700 text-right"
                    : highlightLastCol && ci === row.length - 1 ?
                      "font-bold text-blue-700"
                    : "text-slate-500"
                  }`}>
                  {cell === 0 ?
                    <span className="text-slate-300">–</span>
                  : cell}
                </td>
              ))}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── جدول: كل المراحل كأعمدة مجمعة (فردى / جماعى) لكل مرحلة ──────────
function StageFormTable({ stages, churches, churchStageForm }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm min-w-[1000px]">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th
              rowSpan={2}
              className="px-3 py-2.5 text-center font-bold text-slate-500 text-xs whitespace-nowrap align-middle border-l border-slate-200">
              الكنيسة
            </th>
            {stages.map((s) => (
              <th
                key={s}
                colSpan={2}
                className="px-3 py-2 text-center font-bold text-slate-600 text-xs whitespace-nowrap border-l border-slate-200">
                {s.replace("المرحلة ", "")}
              </th>
            ))}
          </tr>
          <tr className="bg-slate-50 border-b border-slate-200">
            {stages.map((s) => (
              <Fragment key={s}>
                <th className="px-2 py-1.5 text-center font-semibold text-slate-400 text-[11px] whitespace-nowrap">
                  فردى
                </th>
                <th className="px-2 py-1.5 text-center font-semibold text-slate-400 text-[11px] whitespace-nowrap border-l border-slate-200">
                  جماعى
                </th>
              </Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {churches.map((c, ri) => (
            <motion.tr
              key={c}
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: Math.min(ri * 0.03, 0.6) }}
              className={`border-b border-slate-100 last:border-0 ${
                ri % 2 === 0 ? "bg-white" : "bg-slate-50/60"
              } hover:bg-blue-50/60 transition-colors`}>
              <td className="px-3 py-2 text-center whitespace-nowrap font-semibold text-slate-700 text-right border-l border-slate-100">
                {shortChurch(c)}
              </td>
              {stages.map((s) => {
                const cell = (churchStageForm[c] && churchStageForm[c][s]) || {
                  individual: 0,
                  group: 0,
                };
                return (
                  <Fragment key={s}>
                    <td className="px-2 py-2 text-center whitespace-nowrap text-slate-500">
                      {cell.individual === 0 ?
                        <span className="text-slate-300">–</span>
                      : cell.individual}
                    </td>
                    <td className="px-2 py-2 text-center whitespace-nowrap text-slate-500 border-l border-slate-100">
                      {cell.group === 0 ?
                        <span className="text-slate-300">–</span>
                      : cell.group}
                    </td>
                  </Fragment>
                );
              })}
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartCard({ children, height = 340 }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    fontSize: "12px",
    direction: "rtl",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  labelStyle: { fontWeight: 700, color: "#1e293b", marginBottom: 2 },
};

export default function Statistics() {
  const { user } = useAuth();
  const privileges = getPrivileges(user?.email);
  const canDownloadReports = privileges.canDownloadReports;
  const [loadingFetch, errorFetch, players] = useFetch();
  const [printMode, setPrintMode] = useState(false);

  useEffect(() => {
    function handleAfterPrint() {
      setPrintMode(false);
    }
    window.addEventListener("afterprint", handleAfterPrint);
    return () => window.removeEventListener("afterprint", handleAfterPrint);
  }, []);

  function handleDownload() {
    setPrintMode(true);
    // ندي وقت للتابات إنها تتفتح وتترسم قبل ما نطلب الطباعة/الحفظ كـ PDF
    setTimeout(() => {
      window.print();
    }, 350);
  }

  const stats = useMemo(() => {
    const list = players || [];
    const total = list.length;

    const countBy = (key) => {
      const map = {};
      list.forEach((p) => {
        const v = p[key] || "غير محدد";
        map[v] = (map[v] || 0) + 1;
      });
      return map;
    };

    const churchCounts = countBy("church");
    const gameCounts = countBy("game");
    const stageCounts = countBy("stage");
    const genderCounts = countBy("gender");

    const churches = Object.keys(churchCounts).sort(
      (a, b) => churchCounts[b] - churchCounts[a],
    );
    const games = Object.keys(gameCounts).sort(
      (a, b) => gameCounts[b] - gameCounts[a],
    );
    const stages = Object.keys(stageCounts).sort(
      (a, b) => stageIndex(a) - stageIndex(b),
    );

    // كنيسة × لعبة
    const churchGame = {};
    // كنيسة × مرحلة
    const churchStage = {};
    // لعبة × مرحلة
    const gameStage = {};
    // كنيسة × نوع
    const churchGender = {};
    // كنيسة × لعبة × مرحلة (لأعلى التوليفات)
    const combos = {};
    // كنيسة × لعبة × مرحلة → عدد فردى + مجموعة الفرق
    const formTeam = {};
    // كنيسة × مرحلة (بغض النظر عن اللعبة) → عدد فردى + جماعى
    const churchStageForm = {};

    list.forEach((p) => {
      const ch = p.church || "غير محدد";
      const gm = p.game || "غير محدد";
      const st = p.stage || "غير محدد";
      const gd = p.gender || "غير محدد";

      churchGame[ch] = churchGame[ch] || {};
      churchGame[ch][gm] = (churchGame[ch][gm] || 0) + 1;

      churchStage[ch] = churchStage[ch] || {};
      churchStage[ch][st] = (churchStage[ch][st] || 0) + 1;

      gameStage[gm] = gameStage[gm] || {};
      gameStage[gm][st] = (gameStage[gm][st] || 0) + 1;

      churchGender[ch] = churchGender[ch] || {};
      churchGender[ch][gd] = (churchGender[ch][gd] || 0) + 1;

      const comboKey = `${ch}__${gm}__${st}`;
      combos[comboKey] = combos[comboKey] || {
        church: ch,
        game: gm,
        stage: st,
        count: 0,
      };
      combos[comboKey].count += 1;

      // فردى / جماعى لكل كنيسة × لعبة × مرحلة
      formTeam[comboKey] = formTeam[comboKey] || {
        church: ch,
        game: gm,
        stage: st,
        individual: 0,
        group: 0,
      };
      if (p.form === "فردى") {
        formTeam[comboKey].individual += 1;
      } else if (p.form === "جماعى") {
        formTeam[comboKey].group += 1;
      }

      // فردى / جماعى لكل كنيسة × مرحلة (كل الألعاب مع بعض)
      churchStageForm[ch] = churchStageForm[ch] || {};
      churchStageForm[ch][st] = churchStageForm[ch][st] || {
        individual: 0,
        group: 0,
      };
      if (p.form === "فردى") {
        churchStageForm[ch][st].individual += 1;
      } else if (p.form === "جماعى") {
        churchStageForm[ch][st].group += 1;
      }
    });

    const topCombos = Object.values(combos)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // لكل لعبة: جدول (كنيسة × مرحلة → فردى / جماعى)
    const formTableByGame = {};
    Object.values(formTeam).forEach((r) => {
      formTableByGame[r.game] = formTableByGame[r.game] || [];
      formTableByGame[r.game].push(r);
    });
    Object.keys(formTableByGame).forEach((g) => {
      formTableByGame[g].sort(
        (a, b) =>
          a.church.localeCompare(b.church, "ar") ||
          stageIndex(a.stage) - stageIndex(b.stage),
      );
    });

    const genders = Object.keys(genderCounts);

    return {
      total,
      churchCounts,
      gameCounts,
      stageCounts,
      genderCounts,
      churches,
      games,
      stages,
      genders,
      churchGame,
      churchStage,
      gameStage,
      churchGender,
      topCombos,
      formTableByGame,
      churchStageForm,
    };
  }, [players]);

  if (loadingFetch) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader size={10} />
      </div>
    );
  }

  if (errorFetch) {
    return (
      <p className="text-red-500 text-center font-medium py-20">{errorFetch}</p>
    );
  }

  const {
    total,
    churchCounts,
    gameCounts,
    stageCounts,
    genderCounts,
    churches,
    games,
    stages,
    genders,
    churchGame,
    churchStage,
    gameStage,
    churchGender,
    topCombos,
    churchStageForm,
  } = stats;

  // بيانات الرسم: عدد كل كنيسة
  const churchBarData = churches.map((c) => ({
    name: shortChurch(c),
    full: c,
    عدد: churchCounts[c],
  }));

  // بيانات الرسم: توزيع الألعاب (دونات)
  const gamePieData = games.map((g) => ({
    name: g,
    value: gameCounts[g],
  }));

  // بيانات الرسم: توزيع المراحل
  const stageBarData = stages.map((s) => ({
    name: s.replace("المرحلة ", ""),
    عدد: stageCounts[s],
  }));

  // بيانات الرسم: لعبة × مرحلة (Stacked)
  const gameStageBarData = games.map((g) => {
    const row = { name: g };
    stages.forEach((s) => {
      row[s.replace("المرحلة ", "")] = (gameStage[g] && gameStage[g][s]) || 0;
    });
    return row;
  });

  // بيانات الرسم: كنيسة × نوع (Stacked)
  const churchGenderBarData = churches.map((c) => {
    const row = { name: shortChurch(c), full: c };
    genders.forEach((g) => {
      row[g] = (churchGender[c] && churchGender[c][g]) || 0;
    });
    return row;
  });

  const genderColors = { بنين: "#BAE6FD", بنات: "#fce7f3" };

  return (
    <div className="min-h-screen max-w-7xl mx-auto pb-10" dir="rtl">
      <style>{`
        @media print {
          body { background: #fff !important; }
          .print\\:hidden { display: none !important; }
          a[href]:after { content: none !important; }
        }
      `}</style>
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="flex items-center gap-3 bg-blue-700 text-white px-4 py-3.5 sm:px-5 rounded-2xl shadow-md mb-5">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h1 className="text-base font-bold leading-none">الإحصائيات</h1>
          <p className="text-xs text-blue-200 mt-1">
            نظرة شاملة على أعداد المشاركين حسب الكنيسة واللعبة والمرحلة
          </p>
        </div>
        {canDownloadReports && (
          <button
            type="button"
            onClick={handleDownload}
            className="print:hidden flex items-center gap-1.5 bg-white/15 hover:bg-white/25 transition-colors text-white text-xs font-bold px-3 py-2 rounded-xl flex-shrink-0">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">تحميل التقرير</span>
          </button>
        )}
      </motion.div>

      <div className="px-1 flex flex-col gap-6">
        {/* ── كروت الأرقام العامة ──────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            icon={Users}
            label="إجمالي المشاركين"
            value={total}
            color={PALETTE[0]}
            delay={0}
          />
          <StatCard
            icon={Church}
            label="عدد الكنائس المشاركة"
            value={churches.length}
            color={PALETTE[1]}
            delay={0.05}
          />
          <StatCard
            icon={Gamepad2}
            label="عدد الألعاب"
            value={games.length}
            color={PALETTE[2]}
            delay={0.1}
          />
          <StatCard
            icon={Layers}
            label="عدد المراحل"
            value={stages.length}
            color={PALETTE[3]}
            delay={0.15}
          />
        </div>

        {/* ── كل إحصائية داخل تاب قابل للتوسيع ─────────────────── */}
        <div className="flex flex-col gap-3">
          {/* 1) الكنائس: عدد المشاركين لكل كنيسة + توزيعها على الألعاب */}
          <Reveal>
            <StatTab
              icon={Church}
              title="الكنائس المشاركة"
              subtitle="عدد المشاركين من كل كنيسة، وتوزيعهم على الألعاب"
              badge={churches.length}
              forceOpen={printMode}
              defaultOpen>
              <ChartCard height={Math.max(280, churches.length * 42)}>
                <BarChart
                  data={churchBarData}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontSize: 11, fill: "#475569" }}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v) => [v, "عدد المشاركين"]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.full || ""
                    }
                  />
                  <Bar
                    dataKey="عدد"
                    radius={[0, 8, 8, 0]}
                    animationDuration={900}>
                    {churchBarData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartCard>

              <DataTable
                columns={["الكنيسة", ...games, "الإجمالي"]}
                highlightLastCol
                rows={churches.map((c) => [
                  shortChurch(c),
                  ...games.map((g) => (churchGame[c] && churchGame[c][g]) || 0),
                  churchCounts[c],
                ])}
              />
            </StatTab>
          </Reveal>

          {/* 2) الألعاب: التوزيع الإجمالي + توزيعها على المراحل */}
          <Reveal delay={0.03}>
            <StatTab
              icon={Gamepad2}
              title="الألعاب"
              subtitle="إجمالي المشاركين في كل لعبة، وتوزيعهم على المراحل"
              badge={games.length}
              forceOpen={printMode}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ChartCard height={300}>
                  <PieChart>
                    <Pie
                      data={gamePieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                      animationDuration={900}
                      label={({ value }) => value}
                      labelLine={false}>
                      {gamePieData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={GAME_COLOR[entry.name] || PALETTE[i]}
                        />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 12, direction: "rtl" }}
                    />
                  </PieChart>
                </ChartCard>

                <div className="flex flex-col gap-2 justify-center">
                  {games.map((g, i) => {
                    const pct = ((gameCounts[g] / total) * 100).toFixed(1);
                    return (
                      <motion.div
                        key={g}
                        initial={{ opacity: 0, x: 16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: i * 0.06 }}
                        className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5">
                        <span
                          className="w-2.5 h-8 rounded-full flex-shrink-0"
                          style={{ background: GAME_COLOR[g] || PALETTE[i] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-700">
                            {g}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            {pct}٪ من الإجمالي
                          </p>
                        </div>
                        <span
                          className="text-xl font-extrabold tabular-nums"
                          style={{ color: GAME_COLOR[g] || PALETTE[i] }}>
                          {gameCounts[g]}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <ChartCard height={360}>
                <BarChart
                  data={gameStageBarData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#475569" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip {...tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11, direction: "rtl" }} />
                  {stages.map((s, i) => (
                    <Bar
                      key={s}
                      dataKey={s.replace("المرحلة ", "")}
                      stackId="stage"
                      fill={PALETTE[i % PALETTE.length]}
                      radius={i === stages.length - 1 ? [6, 6, 0, 0] : 0}
                      animationDuration={900}
                    />
                  ))}
                </BarChart>
              </ChartCard>
            </StatTab>
          </Reveal>

          {/* 3) المراحل: الإجمالي لكل مرحلة + توزيعها على الكنائس */}
          <Reveal delay={0.06}>
            <StatTab
              icon={Layers}
              title="المراحل"
              subtitle="إجمالي كل مرحلة، وتوزيع كل كنيسة على المراحل"
              badge={stages.length}
              forceOpen={printMode}>
              <ChartCard height={320}>
                <BarChart
                  data={stageBarData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eef2f7"
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12, fill: "#475569" }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(v) => [v, "عدد المشاركين"]}
                  />
                  <Bar
                    dataKey="عدد"
                    radius={[8, 8, 0, 0]}
                    animationDuration={900}>
                    {stageBarData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartCard>

              <DataTable
                columns={[
                  "الكنيسة",
                  ...stages.map((s) => s.replace("المرحلة ", "")),
                ]}
                rows={churches.map((c) => [
                  shortChurch(c),
                  ...stages.map(
                    (s) => (churchStage[c] && churchStage[c][s]) || 0,
                  ),
                ])}
              />
            </StatTab>
          </Reveal>

          {/* 4) النوع: بنين وبنات */}
          <Reveal delay={0.09}>
            <StatTab
              icon={Users}
              title="التوزيع حسب النوع"
              subtitle="بنين وبنات إجمالاً، وفي كل كنيسة"
              badge={genders.length ? genderCounts[genders[0]] : 0}
              forceOpen={printMode}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <ChartCard height={280}>
                  <PieChart>
                    <Pie
                      data={genders.map((g) => ({
                        name: g,
                        value: genderCounts[g],
                      }))}
                      dataKey="value"
                      nameKey="name"
                      innerRadius="55%"
                      outerRadius="85%"
                      paddingAngle={2}
                      animationDuration={900}
                      label={({ value }) => value}
                      labelLine={false}>
                      {genders.map((g, i) => (
                        <Cell key={g} fill={genderColors[g] || PALETTE[i]} />
                      ))}
                    </Pie>
                    <Tooltip {...tooltipStyle} />
                    <Legend
                      verticalAlign="bottom"
                      wrapperStyle={{ fontSize: 12, direction: "rtl" }}
                    />
                  </PieChart>
                </ChartCard>

                <div className="lg:col-span-2">
                  <ChartCard height={Math.max(260, churches.length * 34)}>
                    <BarChart
                      data={churchGenderBarData}
                      layout="vertical"
                      stackOffset="expand"
                      margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal={false}
                        stroke="#eef2f7"
                      />
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="name"
                        width={130}
                        tick={{ fontSize: 10.5, fill: "#475569" }}
                      />
                      <Tooltip
                        {...tooltipStyle}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.full || ""
                        }
                      />
                      <Legend
                        wrapperStyle={{ fontSize: 11, direction: "rtl" }}
                      />
                      {genders.map((g) => (
                        <Bar
                          key={g}
                          dataKey={g}
                          stackId="gender"
                          fill={genderColors[g] || PALETTE[0]}
                          animationDuration={900}
                        />
                      ))}
                    </BarChart>
                  </ChartCard>
                </div>
              </div>
            </StatTab>
          </Reveal>

          {/* 6) فردى وجماعى: جدول واحد بكل المراحل كأعمدة مجمعة */}
          <Reveal delay={0.15}>
            <StatTab
              icon={Users}
              title="عدد الفردى والجماعى لكل كنيسة عبر كل المراحل"
              subtitle="جدول موحّد: كل مرحلة عمودين (فردى / جماعى)"
              badge={total}
              forceOpen={printMode}>
              <StageFormTable
                stages={stages}
                churches={churches}
                churchStageForm={churchStageForm}
              />
            </StatTab>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
