// ReturnedProductsImporter.jsx
// Sprint 2 — CSV intake tool for returned products from delivery companies
// Features:
//   1. Downloadable Dealtock standard CSV template
//   2. Drag-and-drop CSV upload
//   3. Smart column mapper (any CSV → Dealtock fields)
//   4. Row-level preview with validation
//   5. Bulk approve/reject per row before import
//   6. Bulk insert to products as pending_review

import React, { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "../../../../lib/supabaseClient";
import { toast } from "sonner";
import {
  Upload, Download, FileText, X, Check, AlertCircle,
  ChevronDown, RefreshCw, Package, MapPin, Clock,
  Tag, ArrowRight, CheckCircle2, XCircle, Eye,
  RotateCcw, Truck, Warehouse
} from "lucide-react";

// ── Dealtock standard fields ─────────────────────────────────────
const DEALTOCK_FIELDS = [
  { key: "name",             label: "Product Name",       required: true,  hint: "Short product description" },
  { key: "category",         label: "Category",           required: false, hint: "Electronics, Fashion, Home…" },
  { key: "asking_price",     label: "Asking Price (MAD)", required: true,  hint: "Delivery company's listing price" },
  { key: "quantity",         label: "Quantity",           required: false, hint: "Default: 1" },
  { key: "location",         label: "City",               required: true,  hint: "Storage city (e.g. Casablanca)" },
  { key: "days_in_storage",  label: "Days in Storage",    required: false, hint: "Admin-only, never shown to buyers" },
  { key: "description",      label: "Description",        required: false, hint: "Additional product details" },
  { key: "ignore",           label: "— Ignore column —",  required: false, hint: "Skip this column" },
];

const REQUIRED_FIELDS = DEALTOCK_FIELDS.filter(f => f.required).map(f => f.key);

// ── Standard CSV template ─────────────────────────────────────────
const TEMPLATE_HEADERS = [
  "product_name", "category", "asking_price_mad",
  "quantity", "city", "days_in_storage", "description"
];

const TEMPLATE_EXAMPLE = [
  ["Casque Bluetooth Sony WH-1000XM4", "Electronics", "450", "1", "Casablanca", "12", "Sealed box, never opened. Refused delivery."],
  ["Robe d'été fleurie taille M", "Fashion", "180", "1", "Rabat", "8", ""],
  ["Cafetière Delonghi EC260", "Home", "320", "2", "Marrakech", "21", "Original packaging intact"],
];

// ── Validate a parsed row ─────────────────────────────────────────
function validateRow(row) {
  const errors = [];
  if (!row.name?.trim())         errors.push("Product name is required");
  if (!row.location?.trim())     errors.push("City is required");
  const price = parseFloat(row.asking_price);
  if (isNaN(price) || price <= 0) errors.push("Valid asking price required (> 0 MAD)");
  if (row.days_in_storage !== undefined && row.days_in_storage !== "") {
    const days = parseInt(row.days_in_storage);
    if (isNaN(days) || days < 0) errors.push("Days in storage must be a positive number");
  }
  return errors;
}

// ── Download template CSV ─────────────────────────────────────────
// BOM (﻿) tells Excel this is UTF-8 — prevents re-encoding on save.
// Only quotes fields that contain commas, quotes, or newlines.
function downloadTemplate() {
  function escapeCell(val) {
    const s = String(val);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  }
  const rows = [TEMPLATE_HEADERS, ...TEMPLATE_EXAMPLE];
  const bom  = "\uFEFF";
  const csv  = bom + rows.map(r => r.map(escapeCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = "dealtock_returned_products_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Parse a single CSV line ───────────────────────────────────────
// Handles two formats that Excel/LibreOffice produce:
//   Format A (standard RFC4180):   field1,"field 2","field,3"
//   Format B (Excel outer-quoted): "field1,\"\"field2\"\",\"\"field3\"\"" 
//     → entire line wrapped in quotes, inner fields double-quoted,
//       first field unquoted, rest end with trailing ""
function parseSingleLine(line) {
  const t = line.trim();
  if (!t) return [];

  // ── Format B detection: Excel outer-quoted ──
  // Signature: starts with ", ends with ", contains ,""
  if (t.startsWith('"') && t.endsWith('"') && t.includes(',""')) {
    const inner = t.slice(1, -1); // strip outer quotes
    const parts = inner.split(',""');
    return parts.map((part, i) => {
      if (i === 0) return part.trim(); // first field: plain text
      // Subsequent fields: strip trailing closing "" or "
      let clean = part;
      if (clean.endsWith('""')) clean = clean.slice(0, -2);
      else if (clean.endsWith('"')) clean = clean.slice(0, -1);
      return clean.trim();
    });
  }

  // ── Format A: standard RFC4180 ──
  const result = [];
  let i = 0;
  while (i < t.length) {
    if (t[i] === '"') {
      i++;
      let field = "";
      while (i < t.length) {
        if (t[i] === '"' && t[i + 1] === '"') { field += '"'; i += 2; }
        else if (t[i] === '"') { i++; break; }
        else { field += t[i++]; }
      }
      result.push(field.trim());
      if (t[i] === ",") i++;
    } else {
      const start = i;
      while (i < t.length && t[i] !== ",") i++;
      result.push(t.slice(start, i).trim());
      if (i < t.length) i++;
    }
  }
  return result;
}

// ── Parse full CSV → { headers, rows } ───────────────────────────
function parseCSV(text) {
  const clean = text.replace(/^\uFEFF/, "").trim();
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseSingleLine(lines[0]);
  const rows = lines.slice(1).map((line, i) => {
    const values = parseSingleLine(line);
    const obj    = { _rowIndex: i + 2 };
    headers.forEach((h, j) => { obj[h] = values[j] ?? ""; });
    return obj;
  });

  return { headers, rows };
}

// ── Smart auto-mapper: guess Dealtock field from CSV column name ──
function autoMap(csvHeader) {
  const h = csvHeader.toLowerCase().replace(/[\s_-]/g, "");
  if (/product|name|description|titre|libelle|designation/.test(h) && !/desc/.test(h)) return "name";
  if (/categ|type|famille/.test(h))  return "category";
  if (/price|prix|montant|amount|asking/.test(h)) return "asking_price";
  if (/qty|quant|nombre|nbre/.test(h)) return "quantity";
  if (/city|ville|location|ville|depot/.test(h)) return "location";
  if (/day|jour|storage|stockage|anciennete/.test(h)) return "days_in_storage";
  if (/desc|detail|note|comment|remark/.test(h)) return "description";
  return "ignore";
}

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
const ReturnedProductsImporter = ({ deliveryCompanies = [], onImportComplete }) => {
  const [step, setStep]             = useState("upload"); // upload | map | preview | done
  const [dragging, setDragging]     = useState(false);
  const [csvData, setCsvData]       = useState(null);     // { headers, rows }
  const [mapping, setMapping]       = useState({});       // csvHeader → dealtock key
  const [preview, setPreview]       = useState([]);       // mapped + validated rows
  const [rowChecked, setRowChecked] = useState({});       // rowIndex → bool (include?)
  const [importing, setImporting]   = useState(false);
  const [result, setResult]         = useState(null);     // { imported, skipped, errors }
  const [selectedDC, setSelectedDC] = useState("");       // delivery company id
  const [warehousePartners, setWarehousePartners] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState(""); // warehouse partner profile id
  const fileRef = useRef();

  // Products need a real owner (products.user_id has a FK to profiles) -
  // the delivery company is just who dropped the parcel off, not who
  // manages/resells it. Load warehouse partner accounts to assign to.
  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, full_name, email, city")
      .eq("role", "warehouse")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error loading warehouse partners:", error);
        } else {
          setWarehousePartners(data || []);
        }
      });
  }, []);

  // ── File handling ───────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file || !file.name.endsWith(".csv")) {
      toast.error("Please upload a CSV file (.csv)");
      return;
    }
    const reader = new FileReader();
    // Try UTF-8 first, fall back to ISO-8859 (common for Excel on Windows/French locale)
    reader.onload = (e) => {
      let text = e.target.result;
      // Detect garbled encoding: if common French chars look wrong, retry as latin-1
      // We detect this by checking for replacement character or common ISO-8859 artifacts
      if (text.includes("\uFFFD") || (text.includes("Ã") && !text.includes("ã"))) {
        const reader2 = new FileReader();
        reader2.onload = (e2) => {
          const parsed = parseCSV(e2.target.result);
          if (!parsed.headers.length) { toast.error("CSV appears empty or unreadable"); return; }
          const initialMapping = {};
          parsed.headers.forEach(h => { initialMapping[h] = autoMap(h); });
          setCsvData(parsed);
          setMapping(initialMapping);
          setStep("map");
        };
        reader2.readAsText(file, "ISO-8859-1");
        return;
      }
      const parsed = parseCSV(text);
      if (!parsed.headers.length) {
        toast.error("CSV appears empty or unreadable");
        return;
      }
      const initialMapping = {};
      parsed.headers.forEach(h => { initialMapping[h] = autoMap(h); });
      setCsvData(parsed);
      setMapping(initialMapping);
      setStep("map");
    };
    reader.readAsText(file, "UTF-8");
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }, [handleFile]);

  // ── Build preview rows from mapping ────────────────────────────
  const buildPreview = () => {
    if (!csvData) return;

    // Check all required fields are mapped
    const mappedTargets = Object.values(mapping).filter(v => v !== "ignore");
    const missingRequired = REQUIRED_FIELDS.filter(f => !mappedTargets.includes(f));
    if (missingRequired.length) {
      const labels = missingRequired.map(f => DEALTOCK_FIELDS.find(d => d.key === f)?.label);
      toast.error(`Please map required fields: ${labels.join(", ")}`);
      return;
    }
    if (!selectedDC) {
      toast.error("Please select the delivery company before proceeding");
      return;
    }
    if (!selectedWarehouse) {
      toast.error("Please select the warehouse partner before proceeding");
      return;
    }

    const mapped = csvData.rows.map((row) => {
      const out = { _rowIndex: row._rowIndex };
      Object.entries(mapping).forEach(([csvCol, dealtockKey]) => {
        if (dealtockKey !== "ignore") out[dealtockKey] = row[csvCol];
      });
      out._errors = validateRow(out);
      return out;
    });

    const checked = {};
    mapped.forEach(r => { checked[r._rowIndex] = r._errors.length === 0; });

    setPreview(mapped);
    setRowChecked(checked);
    setStep("preview");
  };

  // ── Import selected rows ────────────────────────────────────────
  const handleImport = async () => {
    const toImport = preview.filter(r => rowChecked[r._rowIndex] && r._errors.length === 0);
    if (!toImport.length) {
      toast.error("No valid rows selected for import");
      return;
    }
    setImporting(true);
    const errors = [];
    let imported  = 0;

    const dc = deliveryCompanies.find(d => d.id === selectedDC);

    for (const row of toImport) {
      const payload = {
        name:                       row.name?.trim() || "Unnamed Product",
        description:                row.description?.trim() || null,
        category:                   row.category?.trim() || null,
        asking_price:               parseFloat(row.asking_price) || null,
        purchase_price:             parseFloat(row.asking_price) || 0, // mirror for display
        sale_price:                 parseFloat(row.asking_price) || 0,
        quantity:                   parseInt(row.quantity) || 1,
        location:                   row.location?.trim() || null,
        days_in_storage:            row.days_in_storage ? parseInt(row.days_in_storage) : null,
        source_type:                "returned",
        condition:                  "A",            // V1: sealed only
        listing_status:             "pending_review",
        city_locked:                true,           // always city-locked
        available_for_sale:         false,          // goes live only after admin approval
        status:                     "available",
        origin_delivery_company_id: selectedDC,
        user_id:                    selectedWarehouse, // the warehouse partner who manages/resells it
      };

      const { error } = await supabase.from("products").insert([payload]);
      if (error) {
        errors.push({ row: row._rowIndex, message: error.message });
      } else {
        imported++;
      }
    }

    setResult({
      imported,
      skipped: preview.length - toImport.length,
      errors,
    });
    setImporting(false);
    setStep("done");
    if (imported > 0) onImportComplete?.();
  };

  const reset = () => {
    setStep("upload");
    setCsvData(null);
    setMapping({});
    setPreview([]);
    setRowChecked({});
    setResult(null);
    setSelectedDC("");
  };

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-kraft-500 dark:text-kraft-400" />
            Import Returned Products
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload a CSV from a delivery company to list returned parcels on the marketplace.
            All listings go to <span className="font-medium text-kraft-600 dark:text-kraft-400">pending review</span> before going live.
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Template
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {["upload", "map", "preview", "done"].map((s, i) => {
          const labels  = ["Upload CSV", "Map Columns", "Review Rows", "Done"];
          const current = ["upload", "map", "preview", "done"].indexOf(step);
          const isCurrent = s === step;
          const isDone    = i < current;
          return (
            <React.Fragment key={s}>
              <div className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                isCurrent ? "text-kraft-600 dark:text-kraft-400" : isDone ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isCurrent ? "bg-kraft-500 text-white" :
                  isDone    ? "bg-green-500 text-white" :
                              "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {isDone ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {labels[i]}
              </div>
              {i < 3 && <div className={`flex-1 h-0.5 ${isDone ? "bg-green-400" : "bg-gray-200 dark:bg-gray-700"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* ── STEP 1: Upload ── */}
      {step === "upload" && (
        <div className="space-y-4">
          {/* Delivery company selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Truck className="inline w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
              Select Delivery Company *
            </label>
            <select
              value={selectedDC}
              onChange={e => setSelectedDC(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-kraft-400 focus:border-kraft-400"
            >
              <option value="">— Choose delivery company —</option>
              {deliveryCompanies.map(dc => (
                <option key={dc.id} value={dc.id}>{dc.name}</option>
              ))}
            </select>
          </div>

          {/* Warehouse partner selector */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Warehouse className="inline w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
              Select Warehouse Partner *
            </label>
            <select
              value={selectedWarehouse}
              onChange={e => setSelectedWarehouse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-kraft-400 focus:border-kraft-400"
            >
              <option value="">— Choose warehouse partner —</option>
              {warehousePartners.map(w => (
                <option key={w.id} value={w.id}>{w.full_name || w.email}{w.city ? ` (${w.city})` : ""}</option>
              ))}
            </select>
            {warehousePartners.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                No warehouse partner accounts found — create one with role "warehouse" first.
              </p>
            )}
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-all ${
              dragging
                ? "border-kraft-400 bg-kraft-50 dark:bg-kraft-900/20"
                : "border-gray-300 dark:border-gray-600 hover:border-kraft-300 hover:bg-kraft-50/40 dark:hover:bg-kraft-900/10"
            }`}
          >
            <Upload className={`w-10 h-10 mx-auto mb-3 transition-colors ${dragging ? "text-kraft-500" : "text-gray-400 dark:text-gray-500"}`} />
            <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Drop your CSV here or click to browse</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Accepts .csv files — any column format</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden"
              onChange={e => handleFile(e.target.files[0])} />
          </div>

          {/* Template info */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-semibold mb-1">First time? Download the standard template.</p>
                <p>The importer accepts <strong>any CSV format</strong> — you'll map columns in the next step.
                The template is the easiest option to share with delivery company partners.</p>
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  ℹ️ Days in storage is for internal tracking only — it will never be shown to buyers.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: Map Columns ── */}
      {step === "map" && csvData && (
        <div className="space-y-4">
          {/* DC selector (shown again if not filled) */}
          {!selectedDC && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-kraft-200 dark:border-kraft-800 p-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Truck className="inline w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                Select Delivery Company *
              </label>
              <select
                value={selectedDC}
                onChange={e => setSelectedDC(e.target.value)}
                className="w-full px-3 py-2 border border-kraft-300 dark:border-kraft-700 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-kraft-400"
              >
                <option value="">— Choose delivery company —</option>
                {deliveryCompanies.map(dc => (
                  <option key={dc.id} value={dc.id}>{dc.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Warehouse selector (shown again if not filled) */}
          {!selectedWarehouse && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-kraft-200 dark:border-kraft-800 p-5">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                <Warehouse className="inline w-4 h-4 mr-1 text-gray-400 dark:text-gray-500" />
                Select Warehouse Partner *
              </label>
              <select
                value={selectedWarehouse}
                onChange={e => setSelectedWarehouse(e.target.value)}
                className="w-full px-3 py-2 border border-kraft-300 dark:border-kraft-700 dark:bg-gray-700 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-kraft-400"
              >
                <option value="">— Choose warehouse partner —</option>
                {warehousePartners.map(w => (
                  <option key={w.id} value={w.id}>{w.full_name || w.email}{w.city ? ` (${w.city})` : ""}</option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-white">Map CSV Columns → Dealtock Fields</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {csvData.rows.length} rows detected · {csvData.headers.length} columns
                  · Auto-mapped where possible
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {csvData.headers.map(header => {
                const dealtockField = DEALTOCK_FIELDS.find(f => f.key === mapping[header]);
                const isRequired    = dealtockField?.required;
                const isIgnored     = mapping[header] === "ignore";
                const preview3      = csvData.rows.slice(0, 3).map(r => r[header]).filter(Boolean);

                return (
                  <div key={header} className={`grid grid-cols-[1fr_auto_1fr] gap-3 items-center p-3 rounded-lg border ${
                    isIgnored ? "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 opacity-60" :
                    isRequired && mapping[header] === "ignore" ? "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20" :
                    "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}>
                    {/* CSV column */}
                    <div>
                      <div className="text-xs font-mono font-semibold text-gray-600 dark:text-gray-300">{header}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
                        {preview3.length ? preview3.join(" · ") : "—"}
                      </div>
                    </div>

                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />

                    {/* Dealtock field selector */}
                    <div className="relative">
                      <select
                        value={mapping[header] || "ignore"}
                        onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg text-sm appearance-none pr-8 focus:ring-2 focus:ring-kraft-400 ${
                          isIgnored     ? "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 dark:bg-gray-800" :
                          isRequired    ? "border-green-300 dark:border-green-700 text-green-800 dark:text-green-400 bg-green-50 dark:bg-green-900/20" :
                                          "border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        }`}
                      >
                        {DEALTOCK_FIELDS.map(f => (
                          <option key={f.key} value={f.key}>
                            {f.label}{f.required ? " *" : ""}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 dark:text-gray-500" />
                      {dealtockField?.hint && !isIgnored && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{dealtockField.hint}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Required fields status */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap gap-2">
              {DEALTOCK_FIELDS.filter(f => f.required).map(f => {
                const mapped = Object.values(mapping).includes(f.key);
                return (
                  <span key={f.key} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                    mapped ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  }`}>
                    {mapped ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {f.label}
                  </span>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={reset} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              ← Back
            </button>
            <button onClick={buildPreview}
              className="px-6 py-2 bg-kraft-500 hover:bg-kraft-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
              Preview Rows
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview & Select Rows ── */}
      {step === "preview" && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Total rows",    value: preview.length,                                     color: "text-gray-800 dark:text-white" },
              { label: "Valid",         value: preview.filter(r => r._errors.length === 0).length, color: "text-green-600 dark:text-green-400" },
              { label: "Has errors",    value: preview.filter(r => r._errors.length > 0).length,   color: "text-red-500 dark:text-red-400" },
              { label: "Selected",      value: Object.values(rowChecked).filter(Boolean).length,    color: "text-kraft-600 dark:text-kraft-400" },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bulk select */}
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-3">
            <div className="flex gap-2">
              <button onClick={() => {
                const next = {};
                preview.forEach(r => { next[r._rowIndex] = r._errors.length === 0; });
                setRowChecked(next);
              }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                Select valid rows
              </button>
              <button onClick={() => {
                const next = {};
                preview.forEach(r => { next[r._rowIndex] = false; });
                setRowChecked(next);
              }} className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300">
                Deselect all
              </button>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              ℹ️ Rows with errors cannot be selected until fixed
            </p>
          </div>

          {/* Row table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400 w-10">#</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Import</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Product Name</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Category</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Price (MAD)</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Qty</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <MapPin className="inline w-3 h-3 mr-0.5" />City
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                      <Clock className="inline w-3 h-3 mr-0.5" />
                      Days Stored <span className="text-kraft-500 dark:text-kraft-400">(admin)</span>
                    </th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row) => {
                    const hasErrors = row._errors.length > 0;
                    const checked   = rowChecked[row._rowIndex];
                    return (
                      <tr key={row._rowIndex} className={`border-t border-gray-200 dark:border-gray-700 transition-colors ${
                        hasErrors ? "bg-red-50/60 dark:bg-red-900/10" :
                        checked   ? "bg-kraft-50/40 dark:bg-kraft-900/10" :
                                    "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}>
                        <td className="p-3 text-xs text-gray-400 dark:text-gray-500">{row._rowIndex}</td>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={!hasErrors && checked}
                            disabled={hasErrors}
                            onChange={e => setRowChecked(prev => ({ ...prev, [row._rowIndex]: e.target.checked }))}
                            className="rounded accent-kraft-500 disabled:opacity-30"
                          />
                        </td>
                        <td className="p-3 font-medium text-gray-800 dark:text-white max-w-[200px] truncate">{row.name || "—"}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{row.category || <span className="text-gray-300 dark:text-gray-600">—</span>}</td>
                        <td className="p-3 font-semibold text-gray-800 dark:text-white">{row.asking_price ? `${parseFloat(row.asking_price).toFixed(2)}` : <span className="text-red-400 dark:text-red-400">!</span>}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">{row.quantity || 1}</td>
                        <td className="p-3">
                          {row.location
                            ? <span className="flex items-center gap-1 text-gray-700 dark:text-gray-300"><MapPin className="w-3 h-3 text-gray-400 dark:text-gray-500" />{row.location}</span>
                            : <span className="text-red-400 dark:text-red-400">!</span>
                          }
                        </td>
                        <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                          {row.days_in_storage
                            ? <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">{row.days_in_storage}d</span>
                            : <span className="text-gray-300 dark:text-gray-600">—</span>
                          }
                        </td>
                        <td className="p-3">
                          {hasErrors
                            ? <div className="group relative">
                                <span className="flex items-center gap-1 text-red-500 dark:text-red-400 text-xs cursor-help">
                                  <XCircle className="w-3.5 h-3.5" />Error
                                </span>
                                <div className="hidden group-hover:block absolute z-20 bg-gray-900 text-white text-xs rounded-lg p-2 w-48 bottom-full left-0 mb-1">
                                  {row._errors.map((e, i) => <div key={i}>• {e}</div>)}
                                </div>
                              </div>
                            : <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs">
                                <CheckCircle2 className="w-3.5 h-3.5" />Valid
                              </span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button onClick={() => setStep("map")} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
              ← Back to mapping
            </button>
            <button
              onClick={handleImport}
              disabled={importing || !Object.values(rowChecked).some(Boolean)}
              className="px-6 py-2 bg-kraft-500 hover:bg-kraft-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {importing
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Importing…</>
                : <><Upload className="w-4 h-4" />Import {Object.values(rowChecked).filter(Boolean).length} products</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Done ── */}
      {step === "done" && result && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
            {result.imported > 0
              ? <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              : <XCircle     className="w-16 h-16 text-red-400  mx-auto mb-4" />
            }
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              {result.imported > 0 ? "Import complete!" : "Import failed"}
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              {result.imported > 0
                ? `${result.imported} product${result.imported > 1 ? "s" : ""} submitted for admin review. They'll appear in the marketplace once approved.`
                : "No products were imported. Check the errors below."}
            </p>

            <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto mt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{result.imported}</div>
                <div className="text-xs text-gray-500">Imported</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-400">{result.skipped}</div>
                <div className="text-xs text-gray-500">Skipped</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{result.errors.length}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="mt-6 text-left bg-red-50 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-sm font-semibold text-red-700 mb-2">Import errors:</p>
                {result.errors.map((e, i) => (
                  <p key={i} className="text-xs text-red-600">Row {e.row}: {e.message}</p>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center mt-8">
              <button onClick={reset}
                className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                <RotateCcw className="w-4 h-4" />
                Import another file
              </button>
              <button onClick={() => onImportComplete?.()}
                className="flex items-center gap-2 px-5 py-2 bg-kraft-500 hover:bg-kraft-600 text-white rounded-lg text-sm font-medium">
                <Eye className="w-4 h-4" />
                Go to review queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnedProductsImporter;
