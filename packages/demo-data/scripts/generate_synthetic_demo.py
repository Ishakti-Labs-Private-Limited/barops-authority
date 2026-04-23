#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import random
import uuid
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

SEED = 20260421
START_DATE = dt.date(2025, 10, 23)
DAYS = 180
END_DATE = START_DATE + dt.timedelta(days=DAYS - 1)
CITY = "Bengaluru"
STATE = "Karnataka"
N_OUTLETS = 30
N_PRODUCTS = 420

NAMESPACE = uuid.UUID("8a6f5f43-d5f1-4afc-bf9b-47ce78649c2f")


def uid(scope: str, key: str) -> str:
    return str(uuid.uuid5(NAMESPACE, f"{scope}:{key}"))


def q(value) -> str:
    if value is None:
        return "NULL"
    if isinstance(value, bool):
        return "TRUE" if value else "FALSE"
    if isinstance(value, (int, float)):
        return str(value)
    return "'" + str(value).replace("'", "''") + "'"


def q_date(d: dt.date) -> str:
    return q(d.isoformat())


def q_ts(ts: dt.datetime) -> str:
    return q(ts.strftime("%Y-%m-%d %H:%M:%S+05:30"))


def q_json(obj) -> str:
    txt = json.dumps(obj, separators=(",", ":"), ensure_ascii=True)
    return q(txt) + "::jsonb"


@dataclass
class OutletConfig:
    id: str
    outlet_code: str
    outlet_name: str
    license_type: str
    zone: str
    locality: str
    peer_group_id: str
    opened_on: dt.date
    premium: bool
    risk_tier: str
    volume_index: float
    baseline_late_prob: float
    baseline_variance_prob: float
    baseline_correction_prob: float
    baseline_missing_prob: float


def build_peer_groups() -> List[Dict]:
    groups = [
        ("BLR-CENTRAL-PREMIUM", "Central Premium Cluster", "Central", "MG Road", "Premium-heavy destination outlets"),
        ("BLR-WEST-BALANCED", "West Balanced Cluster", "West", "Rajajinagar", "Steady mixed-volume neighborhood outlets"),
        ("BLR-SOUTH-VOLUME", "South Volume Cluster", "South", "Jayanagar", "High throughput mid-premium outlets"),
        ("BLR-EAST-GROWTH", "East Growth Cluster", "East", "Indiranagar", "Emerging premium spend catchment"),
        ("BLR-NORTH-RETAIL", "North Retail Cluster", "North", "Yelahanka", "Value-led family retail mix"),
        ("BLR-PERIURBAN-VALUE", "Peri-Urban Value Cluster", "South", "Electronic City", "Price-sensitive demand pattern"),
    ]
    out = []
    for code, name, zone, locality, notes in groups:
        out.append(
            {
                "id": uid("peer_group", code),
                "code": code,
                "name": name,
                "city": CITY,
                "zone": zone,
                "locality": locality,
                "notes": notes,
            }
        )
    return out


def build_outlets(rng: random.Random, peer_groups: List[Dict]) -> List[OutletConfig]:
    localities = {
        "Central": ["MG Road", "Brigade Road", "Richmond Town", "Church Street", "Residency Road"],
        "West": ["Rajajinagar", "Vijayanagar", "Basaveshwaranagar", "Nagarbhavi", "Kengeri"],
        "South": ["Jayanagar", "Banashankari", "JP Nagar", "BTM Layout", "Electronic City"],
        "East": ["Indiranagar", "Whitefield", "Marathahalli", "KR Puram", "Domlur"],
        "North": ["Yelahanka", "Hebbal", "Sahakar Nagar", "RT Nagar", "Hennur"],
    }
    licenses = ["CL2", "CL7", "CL9"]
    risk_tiers = (["CLEAN"] * 10) + (["MODERATE"] * 12) + (["HIGH"] * 8)
    rng.shuffle(risk_tiers)

    group_by_zone = defaultdict(list)
    for g in peer_groups:
        group_by_zone[g["zone"]].append(g)

    outlets: List[OutletConfig] = []
    for i in range(1, N_OUTLETS + 1):
        zone = rng.choice(list(localities.keys()))
        locality = rng.choice(localities[zone])
        license_type = rng.choices(licenses, weights=[0.35, 0.3, 0.35], k=1)[0]
        premium = license_type == "CL9" or (zone in {"Central", "East"} and rng.random() < 0.45)
        risk_tier = risk_tiers[i - 1]
        peer_group = rng.choice(group_by_zone[zone]) if group_by_zone[zone] else rng.choice(peer_groups)
        code = f"BLR-{license_type}-{i:03d}"
        name = f"{locality} {('Reserve' if premium else 'Cellars')} {i:02d}"
        opened_on = dt.date(2022, 1, 1) + dt.timedelta(days=rng.randint(0, 1200))
        volume_index = rng.uniform(0.9, 1.45) if premium else rng.uniform(0.75, 1.2)
        if risk_tier == "CLEAN":
            late_p, variance_p, corr_p, miss_p = 0.03, 0.015, 0.02, 0.005
        elif risk_tier == "MODERATE":
            late_p, variance_p, corr_p, miss_p = 0.08, 0.05, 0.07, 0.015
        else:
            late_p, variance_p, corr_p, miss_p = 0.17, 0.12, 0.15, 0.035

        outlets.append(
            OutletConfig(
                id=uid("outlet", code),
                outlet_code=code,
                outlet_name=name,
                license_type=license_type,
                zone=zone,
                locality=locality,
                peer_group_id=peer_group["id"],
                opened_on=opened_on,
                premium=premium,
                risk_tier=risk_tier,
                volume_index=volume_index,
                baseline_late_prob=late_p,
                baseline_variance_prob=variance_p,
                baseline_correction_prob=corr_p,
                baseline_missing_prob=miss_p,
            )
        )
    return outlets


def build_users() -> List[Dict]:
    rows = [
        ("Demo HQ Admin", "hq-admin@barops.demo", "HQ_ADMIN"),
        ("Bengaluru Regional Manager", "blr-rm@barops.demo", "REGIONAL_MANAGER"),
        ("Stock Audit Lead", "audit-lead@barops.demo", "AUDITOR"),
        ("Executive Observer", "demo-viewer@barops.demo", "DEMO_VIEWER"),
    ]
    out = []
    for idx, (name, email, role) in enumerate(rows, start=1):
        out.append(
            {
                "id": uid("user", email),
                "full_name": name,
                "email": email,
                "role": role,
                "is_active": True,
                "last_login_at": dt.datetime(2026, 4, 20, 10, 30) - dt.timedelta(hours=idx * 4),
            }
        )
    return out


def build_products(rng: random.Random) -> Tuple[List[Dict], Dict[str, List[Dict]]]:
    categories = [
        ("Whisky", ["Oak Crest", "Highland Arc", "Royal Ember", "Maltspire"], [180, 375, 750], (900, 4200)),
        ("Rum", ["Storm Bay", "Dark Sails", "Cove Barrel"], [180, 375, 750], (700, 2400)),
        ("Vodka", ["Crystal Finch", "Polar Bay", "Nordline"], [180, 375, 750], (800, 2600)),
        ("Gin", ["Juniper Hills", "Botanic Loop", "Saffron Dry"], [375, 750], (1200, 3200)),
        ("Brandy", ["Golden Cask", "Mellow Crest", "Kings Oak"], [180, 375, 750], (650, 2200)),
        ("Beer", ["Hopline", "Urban Lager", "Brewfield"], [330, 500, 650], (110, 360)),
        ("Wine", ["Vine Court", "Ruby Terra", "Napa Mill"], [375, 750], (650, 2800)),
    ]
    category_weights = [0.30, 0.13, 0.13, 0.10, 0.12, 0.17, 0.05]

    products: List[Dict] = []
    by_category: Dict[str, List[Dict]] = defaultdict(list)
    for i in range(1, N_PRODUCTS + 1):
        cat_idx = rng.choices(range(len(categories)), weights=category_weights, k=1)[0]
        category, brands, packs, mrp_range = categories[cat_idx]
        brand = rng.choice(brands)
        pack = rng.choice(packs)
        abv = 5.0 if category in {"Beer", "Wine"} else rng.choice([36.0, 40.0, 42.8])
        premium = category in {"Whisky", "Gin", "Wine"} and pack >= 750 and rng.random() < 0.45
        mrp = rng.uniform(*mrp_range)
        if premium:
            mrp *= rng.uniform(1.15, 1.45)
        mrp = round(mrp, 2)
        sku = f"{category[:3].upper()}-{pack}-{i:04d}"
        name = f"{brand} {category} {pack}ml"
        product = {
            "id": uid("product", sku),
            "sku": sku,
            "product_name": name,
            "brand_name": brand,
            "category": category,
            "pack_size_ml": pack,
            "abv_percent": abv,
            "mrp": mrp,
            "is_active": True,
            "premium_tag": premium,
        }
        products.append(product)
        by_category[category].append(product)
    return products, by_category


def month_factor(d: dt.date) -> float:
    return {
        1: 0.92,
        2: 0.94,
        3: 1.03,
        4: 1.06,
        5: 1.04,
        6: 0.97,
        7: 0.96,
        8: 1.01,
        9: 1.08,
        10: 1.16,
        11: 1.12,
        12: 1.28,
    }[d.month]


def weekday_factor(d: dt.date) -> float:
    wd = d.weekday()
    if wd in (4, 5):
        return 1.26
    if wd == 6:
        return 1.13
    if wd == 0:
        return 0.92
    return 1.0


def time_for_upload(day: dt.date, late: bool, base_hour: int, rng: random.Random) -> dt.datetime:
    if late:
        hour = base_hour + rng.randint(10, 17)
        minute = rng.randint(2, 49)
    else:
        hour = base_hour + rng.randint(0, 3)
        minute = rng.randint(2, 57)
    return dt.datetime(day.year, day.month, day.day, hour % 24, minute, 0)


def choose_assortment(rng: random.Random, outlet: OutletConfig, products: List[Dict]) -> List[Dict]:
    scored = []
    for p in products:
        score = 1.0
        if outlet.premium and p["premium_tag"]:
            score *= 2.2
        if not outlet.premium and p["premium_tag"]:
            score *= 0.6
        if outlet.license_type == "CL2":
            if p["category"] in {"Beer", "Rum"}:
                score *= 1.18
            if p["pack_size_ml"] <= 375:
                score *= 1.12
        if outlet.license_type == "CL7":
            if p["category"] in {"Whisky", "Brandy", "Beer"}:
                score *= 1.14
            if p["premium_tag"]:
                score *= 0.9
        if outlet.license_type == "CL9":
            if p["category"] in {"Whisky", "Gin", "Wine"}:
                score *= 1.28
            if p["pack_size_ml"] >= 750:
                score *= 1.15
        score *= rng.uniform(0.85, 1.15)
        scored.append((score, p))
    scored.sort(key=lambda x: x[0], reverse=True)
    size = rng.randint(85, 130)
    return [x[1] for x in scored[:size]]


def pick_anomaly_status(anomaly: Dict, end_date: dt.date, rng: random.Random) -> str:
    # Keep aggregate risk findings open; cycle operational alerts realistically.
    if anomaly["rule_code"] == "RULE_RISK_ACCUMULATION":
        return "OPEN"
    age_days = (end_date - anomaly["anomaly_date"]).days
    severity = anomaly["severity"]
    if age_days <= 14:
        return "OPEN"
    if age_days >= 75:
        roll = rng.random()
        if severity in {"HIGH", "CRITICAL"}:
            return "RESOLVED" if roll < 0.42 else ("ACKNOWLEDGED" if roll < 0.65 else "OPEN")
        return "RESOLVED" if roll < 0.52 else ("ACKNOWLEDGED" if roll < 0.74 else ("FALSE_POSITIVE" if roll < 0.82 else "OPEN"))
    if age_days >= 35:
        roll = rng.random()
        if severity in {"HIGH", "CRITICAL"}:
            return "RESOLVED" if roll < 0.26 else ("ACKNOWLEDGED" if roll < 0.46 else "OPEN")
        return "RESOLVED" if roll < 0.34 else ("ACKNOWLEDGED" if roll < 0.55 else ("FALSE_POSITIVE" if roll < 0.60 else "OPEN"))
    return "OPEN"


def generate(output_path: Path, seed: int = SEED):
    rng = random.Random(seed)
    peer_groups = build_peer_groups()
    outlets = build_outlets(rng, peer_groups)
    users = build_users()
    products, _ = build_products(rng)

    dates = [START_DATE + dt.timedelta(days=i) for i in range(DAYS)]
    product_map = {p["id"]: p for p in products}
    inventories: Dict[Tuple[str, str], int] = {}
    outlet_assortments: Dict[str, List[Dict]] = {}
    outlet_baseline_sales: Dict[str, List[int]] = defaultdict(list)
    outlet_day_total_sales: Dict[Tuple[str, dt.date], int] = {}
    peer_day_totals: Dict[Tuple[str, dt.date], int] = defaultdict(int)
    outlet_day_premium_units: Dict[Tuple[str, dt.date], int] = defaultdict(int)
    outlet_day_total_units: Dict[Tuple[str, dt.date], int] = defaultdict(int)
    outlet_day_top_brand: Dict[Tuple[str, dt.date], Tuple[str, int]] = {}
    outlet_day_sales_upload_id: Dict[Tuple[str, dt.date], str] = {}
    outlet_day_stock_upload_id: Dict[Tuple[str, dt.date], str] = {}
    accumulated_risk: Dict[str, int] = defaultdict(int)
    repeated_late_counter: Dict[str, int] = defaultdict(int)
    correction_streak: Dict[str, int] = defaultdict(int)

    uploads: List[Dict] = []
    daily_sales: List[Dict] = []
    daily_stock: List[Dict] = []
    anomalies: List[Dict] = []
    audit_logs: List[Dict] = []
    executive_summaries: List[Dict] = []

    hq_admin = users[0]["id"]
    regional_manager = users[1]["id"]
    auditor = users[2]["id"]

    high_risk_outlets = [o for o in outlets if o.risk_tier == "HIGH"]
    moderate_outlets = [o for o in outlets if o.risk_tier == "MODERATE"]
    special_premium_spike = set(o.id for o in rng.sample(high_risk_outlets + moderate_outlets, k=6))
    special_top_brand_drop = set(o.id for o in rng.sample(high_risk_outlets, k=min(4, len(high_risk_outlets))))

    for outlet in outlets:
        outlet_assortments[outlet.id] = choose_assortment(rng, outlet, products)
        for p in outlet_assortments[outlet.id]:
            key = (outlet.id, p["id"])
            inventories[key] = rng.randint(10, 70)

    for day in dates:
        for outlet in outlets:
            assortment = outlet_assortments[outlet.id]
            miss_today = rng.random() < outlet.baseline_missing_prob
            late_sales = rng.random() < outlet.baseline_late_prob
            late_stock = rng.random() < (outlet.baseline_late_prob + 0.02)
            corrected = rng.random() < outlet.baseline_correction_prob

            # Inject repeated late uploads in specific high-risk outlets.
            if outlet.risk_tier == "HIGH" and day.weekday() in (0, 1, 2):
                late_sales = late_sales or (rng.random() < 0.26)
                late_stock = late_stock or (rng.random() < 0.31)

            if miss_today:
                repeated_late_counter[outlet.id] = max(0, repeated_late_counter[outlet.id] - 1)
                anomaly_id = uid("anomaly", f"{outlet.id}:{day}:missing")
                anomalies.append(
                    {
                        "id": anomaly_id,
                        "outlet_id": outlet.id,
                        "product_id": None,
                        "anomaly_date": day,
                        "rule_code": "RULE_MISSING_DAILY_UPLOAD",
                        "severity": "MEDIUM" if outlet.risk_tier != "HIGH" else "HIGH",
                        "status": "OPEN",
                        "risk_score_delta": 16 if outlet.risk_tier != "HIGH" else 24,
                        "summary": "Daily sales/stock upload missing for outlet",
                        "details": {
                            "expectedDate": day.isoformat(),
                            "outletCode": outlet.outlet_code,
                            "riskTier": outlet.risk_tier,
                        },
                        "detected_from_upload_id": None,
                    }
                )
                accumulated_risk[outlet.id] += anomalies[-1]["risk_score_delta"]
                continue

            sales_upload_id = uid("upload", f"{outlet.id}:{day}:sales:base")
            sales_upload_created = time_for_upload(day, late_sales, 21, rng)
            stock_upload_id = uid("upload", f"{outlet.id}:{day}:stock:base")
            stock_upload_created = time_for_upload(day, late_stock, 22, rng)
            correction_upload_id = uid("upload", f"{outlet.id}:{day}:stock:correction")

            if late_sales or late_stock:
                repeated_late_counter[outlet.id] += 1
            else:
                repeated_late_counter[outlet.id] = max(0, repeated_late_counter[outlet.id] - 1)

            n_skus_sold = rng.randint(14, 26)
            if outlet.license_type == "CL2":
                n_skus_sold -= 3
            elif outlet.license_type == "CL9":
                n_skus_sold += 2
            selected = rng.sample(assortment, k=min(n_skus_sold, len(assortment)))

            day_factor = month_factor(day) * weekday_factor(day) * outlet.volume_index * rng.uniform(0.88, 1.12)
            if outlet.license_type == "CL2" and day.weekday() in (4, 5):
                day_factor *= 1.14
            if outlet.license_type == "CL7" and day.weekday() in (4, 5, 6):
                day_factor *= 1.2
            if outlet.license_type == "CL9":
                if day.weekday() in (5, 6):
                    day_factor *= 1.12
                elif day.weekday() in (1, 2):
                    day_factor *= 0.97
            if outlet.id in special_premium_spike and day.day in (7, 8, 9, 10):
                day_factor *= 1.23
            if outlet.id in special_top_brand_drop and day.day in (18, 19, 20):
                day_factor *= 0.82

            base_total_units = int(155 * day_factor)
            if outlet.license_type == "CL2":
                base_total_units = int(base_total_units * 0.82)
            elif outlet.license_type == "CL7":
                base_total_units = int(base_total_units * 1.0)
            elif outlet.license_type == "CL9":
                base_total_units = int(base_total_units * 1.17)
            base_total_units = max(45, base_total_units)

            weights = [rng.uniform(0.2, 1.0) for _ in selected]
            total_weight = sum(weights)
            brand_units = defaultdict(int)
            day_premium_units = 0

            sales_upload_row = {
                "id": sales_upload_id,
                "outlet_id": outlet.id,
                "upload_type": "DAILY_SALES",
                "source": "POS" if outlet.license_type in {"CL7", "CL9"} else "EXCEL",
                "upload_date": day,
                "status": "PROCESSED",
                "file_name": f"{outlet.outlet_code.lower().replace('-', '_')}_sales_{day.strftime('%Y%m%d')}.csv",
                "checksum_sha256": f"sha256-{uid('hash', f'{outlet.id}:{day}:sales')[:16]}",
                "uploaded_by_user_id": regional_manager,
                "records_count": len(selected),
                "error_count": 0,
                "supersedes_upload_id": None,
                "correction_note": None,
                "created_at": sales_upload_created,
            }
            uploads.append(sales_upload_row)
            outlet_day_sales_upload_id[(outlet.id, day)] = sales_upload_id

            stock_status = "CORRECTED" if corrected else "PROCESSED"
            stock_error_count = 1 if corrected else 0
            stock_upload_row = {
                "id": stock_upload_id,
                "outlet_id": outlet.id,
                "upload_type": "DAILY_STOCK",
                "source": "EXCEL" if outlet.license_type == "CL2" else "MANUAL_UPLOAD",
                "upload_date": day,
                "status": stock_status,
                "file_name": f"{outlet.outlet_code.lower().replace('-', '_')}_stock_{day.strftime('%Y%m%d')}.xlsx",
                "checksum_sha256": f"sha256-{uid('hash', f'{outlet.id}:{day}:stock')[:16]}",
                "uploaded_by_user_id": auditor if corrected else regional_manager,
                "records_count": len(selected),
                "error_count": stock_error_count,
                "supersedes_upload_id": None,
                "correction_note": "Initial file had mismatched closing units" if corrected else None,
                "created_at": stock_upload_created,
            }
            uploads.append(stock_upload_row)

            final_stock_upload_id = stock_upload_id
            if corrected:
                correction_streak[outlet.id] += 1
                correction_upload_row = {
                    "id": correction_upload_id,
                    "outlet_id": outlet.id,
                    "upload_type": "MANUAL_CORRECTION",
                    "source": "MANUAL_UPLOAD",
                    "upload_date": day,
                    "status": "PROCESSED",
                    "file_name": f"{outlet.outlet_code.lower().replace('-', '_')}_stock_{day.strftime('%Y%m%d')}_correction.csv",
                    "checksum_sha256": f"sha256-{uid('hash', f'{outlet.id}:{day}:correction')[:16]}",
                    "uploaded_by_user_id": auditor,
                    "records_count": len(selected),
                    "error_count": 0,
                    "supersedes_upload_id": stock_upload_id,
                    "correction_note": "Corrected actual closing stock before daily sign-off",
                    "created_at": stock_upload_created + dt.timedelta(minutes=rng.randint(35, 105)),
                }
                uploads.append(correction_upload_row)
                final_stock_upload_id = correction_upload_id

                audit_logs.append(
                    {
                        "id": uid("audit", f"{outlet.id}:{day}:correction"),
                        "entity_type": "uploads",
                        "entity_id": correction_upload_id,
                        "action": "CREATE_CORRECTION_UPLOAD",
                        "actor_user_id": auditor,
                        "source": "SCRIPT",
                        "request_id": f"seed-corr-{day.strftime('%Y%m%d')}-{outlet.outlet_code}",
                        "before_state": {"status": "CORRECTED", "uploadId": stock_upload_id},
                        "after_state": {"status": "PROCESSED", "supersedesUploadId": stock_upload_id},
                        "notes": "Synthetic correction chain generated for demo review.",
                        "created_at": correction_upload_row["created_at"] + dt.timedelta(minutes=2),
                    }
                )
            else:
                correction_streak[outlet.id] = max(0, correction_streak[outlet.id] - 1)
            outlet_day_stock_upload_id[(outlet.id, day)] = final_stock_upload_id

            total_units_sold = 0
            for idx, p in enumerate(selected):
                proportion = weights[idx] / total_weight
                units = int(base_total_units * proportion + rng.randint(0, 3))
                units = max(1, units)

                key = (outlet.id, p["id"])
                opening = inventories[key]
                if opening < units:
                    inward = rng.randint(units - opening + 3, units + 18)
                elif opening < 8:
                    inward = rng.randint(5, 18)
                else:
                    inward = rng.randint(0, 10) if rng.random() < 0.25 else 0
                available = opening + inward
                sold = min(units, available)
                expected_closing = max(0, available - sold)

                variance = 0
                if rng.random() < outlet.baseline_variance_prob:
                    variance = rng.randint(-6, 6)
                if outlet.risk_tier == "HIGH" and rng.random() < 0.05:
                    variance += rng.choice([-8, -7, 7, 8])

                actual = max(0, expected_closing + variance)
                inventories[key] = actual

                gross = round(sold * p["mrp"], 2)
                discount_pct = rng.uniform(0.01, 0.065)
                discount = round(gross * discount_pct, 2)
                net = round(gross - discount, 2)

                sales_id = uid("daily_sales", f"{outlet.id}:{p['id']}:{day}")
                stock_id = uid("daily_stock", f"{outlet.id}:{p['id']}:{day}")
                daily_sales.append(
                    {
                        "id": sales_id,
                        "outlet_id": outlet.id,
                        "product_id": p["id"],
                        "sales_date": day,
                        "units_sold": sold,
                        "gross_revenue": gross,
                        "net_revenue": net,
                        "discount_amount": discount,
                        "upload_id": sales_upload_id,
                    }
                )
                daily_stock.append(
                    {
                        "id": stock_id,
                        "outlet_id": outlet.id,
                        "product_id": p["id"],
                        "stock_date": day,
                        "opening_units": opening,
                        "inward_units": inward,
                        "sold_units": sold,
                        "actual_closing_units": actual,
                        "upload_id": final_stock_upload_id,
                    }
                )

                total_units_sold += sold
                brand_units[p["brand_name"]] += sold
                if p["premium_tag"]:
                    day_premium_units += sold
                outlet_day_total_units[(outlet.id, day)] += sold

                if abs(actual - expected_closing) >= 7 and sold >= 4:
                    severity = "MEDIUM" if abs(actual - expected_closing) < 10 else "HIGH"
                    delta = 12 if severity == "MEDIUM" else 24
                    anomaly_id = uid("anomaly", f"{outlet.id}:{p['id']}:{day}:variance")
                    anomalies.append(
                        {
                            "id": anomaly_id,
                            "outlet_id": outlet.id,
                            "product_id": p["id"],
                            "anomaly_date": day,
                            "rule_code": "RULE_STOCK_MISMATCH_ABS_UNITS",
                            "severity": severity,
                            "status": "OPEN",
                            "risk_score_delta": delta,
                            "summary": "Reported closing stock materially mismatches expected stock.",
                            "details": {
                                "openingUnits": opening,
                                "inwardUnits": inward,
                                "soldUnits": sold,
                                "expectedClosingUnits": expected_closing,
                                "actualClosingUnits": actual,
                                "varianceUnits": actual - expected_closing,
                                "outletCode": outlet.outlet_code,
                            },
                            "detected_from_upload_id": final_stock_upload_id,
                        }
                    )
                    accumulated_risk[outlet.id] += delta

            outlet_day_total_sales[(outlet.id, day)] = total_units_sold
            outlet_baseline_sales[outlet.id].append(total_units_sold)
            peer_day_totals[(outlet.peer_group_id, day)] += total_units_sold
            outlet_day_premium_units[(outlet.id, day)] = day_premium_units
            top_brand = max(brand_units.items(), key=lambda x: x[1]) if brand_units else ("", 0)
            outlet_day_top_brand[(outlet.id, day)] = top_brand

            if repeated_late_counter[outlet.id] >= 3:
                anomaly_id = uid("anomaly", f"{outlet.id}:{day}:late_repeat")
                anomalies.append(
                    {
                        "id": anomaly_id,
                        "outlet_id": outlet.id,
                        "product_id": None,
                        "anomaly_date": day,
                        "rule_code": "RULE_REPEATED_LATE_UPLOADS",
                        "severity": "MEDIUM" if repeated_late_counter[outlet.id] < 5 else "HIGH",
                        "status": "OPEN",
                        "risk_score_delta": 10 if repeated_late_counter[outlet.id] < 5 else 18,
                        "summary": "Outlet has repeated late sales/stock uploads.",
                        "details": {
                            "consecutiveLateDays": repeated_late_counter[outlet.id],
                            "salesUploadCreatedAt": sales_upload_created.isoformat(),
                            "stockUploadCreatedAt": stock_upload_created.isoformat(),
                        },
                        "detected_from_upload_id": stock_upload_id,
                    }
                )
                accumulated_risk[outlet.id] += anomalies[-1]["risk_score_delta"]

            if correction_streak[outlet.id] >= 3:
                anomaly_id = uid("anomaly", f"{outlet.id}:{day}:corr_chain")
                latest_stock_upload_id = outlet_day_stock_upload_id.get((outlet.id, day))
                anomalies.append(
                    {
                        "id": anomaly_id,
                        "outlet_id": outlet.id,
                        "product_id": None,
                        "anomaly_date": day,
                        "rule_code": "RULE_SUSPICIOUS_CORRECTION_PATTERN",
                        "severity": "HIGH",
                        "status": "OPEN",
                        "risk_score_delta": 28,
                        "summary": "Frequent correction chain suggests possible stock manipulation.",
                        "details": {
                            "consecutiveCorrectionDays": correction_streak[outlet.id],
                            "latestCorrectionUploadId": latest_stock_upload_id,
                            "outletCode": outlet.outlet_code,
                        },
                        "detected_from_upload_id": latest_stock_upload_id,
                    }
                )
                accumulated_risk[outlet.id] += 28

        # Post-loop baseline and peer deviation checks by day.
        for outlet in outlets:
            key = (outlet.id, day)
            if key not in outlet_day_total_sales:
                continue
            units = outlet_day_total_sales[key]
            history = outlet_baseline_sales[outlet.id][:-1]
            if len(history) >= 21:
                baseline = sum(history[-21:]) / 21
                if baseline > 0 and abs(units - baseline) / baseline > 0.35:
                    direction = "drop" if units < baseline else "spike"
                    severity = "MEDIUM" if abs(units - baseline) / baseline < 0.5 else "HIGH"
                    delta = 14 if severity == "MEDIUM" else 22
                    anomalies.append(
                        {
                            "id": uid("anomaly", f"{outlet.id}:{day}:baseline_dev"),
                            "outlet_id": outlet.id,
                            "product_id": None,
                            "anomaly_date": day,
                            "rule_code": "RULE_OUTLET_BASELINE_DEVIATION",
                            "severity": severity,
                            "status": "OPEN",
                            "risk_score_delta": delta,
                            "summary": f"Outlet daily sales {direction} deviates sharply from own 3-week baseline.",
                            "details": {
                                "currentUnits": units,
                                "baselineUnits21d": round(baseline, 2),
                                "deviationPercent": round(((units - baseline) / baseline) * 100, 2),
                                "outletCode": outlet.outlet_code,
                            },
                            "detected_from_upload_id": outlet_day_sales_upload_id.get((outlet.id, day)),
                        }
                    )
                    accumulated_risk[outlet.id] += delta

            peer_total = peer_day_totals[(outlet.peer_group_id, day)]
            peer_members = [o for o in outlets if o.peer_group_id == outlet.peer_group_id and o.id != outlet.id]
            if peer_members and peer_total > 0:
                peer_avg = max(1, (peer_total - units) / len(peer_members))
                if abs(units - peer_avg) / peer_avg > 0.45:
                    anomalies.append(
                        {
                            "id": uid("anomaly", f"{outlet.id}:{day}:peer_dev"),
                            "outlet_id": outlet.id,
                            "product_id": None,
                            "anomaly_date": day,
                            "rule_code": "RULE_PEER_GROUP_DEVIATION",
                            "severity": "MEDIUM",
                            "status": "OPEN",
                            "risk_score_delta": 11,
                            "summary": "Outlet performance deviates from same-day peer group behavior.",
                            "details": {
                                "outletUnits": units,
                                "peerAverageUnits": round(peer_avg, 2),
                                "deviationPercent": round(((units - peer_avg) / peer_avg) * 100, 2),
                                "peerGroupId": outlet.peer_group_id,
                            },
                            "detected_from_upload_id": outlet_day_sales_upload_id.get((outlet.id, day)),
                        }
                    )
                    accumulated_risk[outlet.id] += 11

            total_u = outlet_day_total_units[(outlet.id, day)]
            premium_u = outlet_day_premium_units[(outlet.id, day)]
            if total_u > 0 and day.day in (7, 8, 9, 10):
                premium_mix = premium_u / total_u
                expected_mix = 0.42 if outlet.premium else 0.22
                if premium_mix > expected_mix + 0.2:
                    anomalies.append(
                        {
                            "id": uid("anomaly", f"{outlet.id}:{day}:premium_spike"),
                            "outlet_id": outlet.id,
                            "product_id": None,
                            "anomaly_date": day,
                            "rule_code": "RULE_PREMIUM_MIX_SPIKE",
                            "severity": "HIGH" if outlet.id in special_premium_spike else "MEDIUM",
                            "status": "OPEN",
                            "risk_score_delta": 17 if outlet.id not in special_premium_spike else 26,
                            "summary": "Premium product mix spiked beyond expected outlet profile.",
                            "details": {
                                "premiumUnits": premium_u,
                                "totalUnits": total_u,
                                "premiumMix": round(premium_mix, 3),
                                "expectedMix": expected_mix,
                            },
                            "detected_from_upload_id": outlet_day_sales_upload_id.get((outlet.id, day)),
                        }
                    )
                    accumulated_risk[outlet.id] += anomalies[-1]["risk_score_delta"]

            if day.day in (18, 19, 20):
                current_brand, current_units = outlet_day_top_brand.get((outlet.id, day), ("", 0))
                prev = day - dt.timedelta(days=7)
                prev_brand, prev_units = outlet_day_top_brand.get((outlet.id, prev), ("", 0))
                if current_brand and prev_brand == current_brand and prev_units > 0 and current_units < prev_units * 0.55:
                    anomalies.append(
                        {
                            "id": uid("anomaly", f"{outlet.id}:{day}:top_brand_drop"),
                            "outlet_id": outlet.id,
                            "product_id": None,
                            "anomaly_date": day,
                            "rule_code": "RULE_TOP_BRAND_SUDDEN_DROP",
                            "severity": "HIGH",
                            "status": "OPEN",
                            "risk_score_delta": 21,
                            "summary": "Top-selling brand volume dropped sharply compared with prior week.",
                            "details": {
                                "brandName": current_brand,
                                "currentUnits": current_units,
                                "units7dAgo": prev_units,
                                "dropPercent": round(((prev_units - current_units) / prev_units) * 100, 2),
                            },
                            "detected_from_upload_id": outlet_day_sales_upload_id.get((outlet.id, day)),
                        }
                    )
                    accumulated_risk[outlet.id] += 21

    # Risk accumulation narrative anomaly.
    for outlet in outlets:
        risk = accumulated_risk[outlet.id]
        if risk > 350:
            anomalies.append(
                {
                    "id": uid("anomaly", f"{outlet.id}:accumulated"),
                    "outlet_id": outlet.id,
                    "product_id": None,
                    "anomaly_date": END_DATE,
                    "rule_code": "RULE_RISK_ACCUMULATION",
                    "severity": "CRITICAL" if risk > 520 else "HIGH",
                    "status": "OPEN",
                    "risk_score_delta": min(40, max(12, risk // 25)),
                    "summary": "Outlet accumulated elevated risk over the 180-day monitoring period.",
                    "details": {
                        "totalRiskDelta180d": risk,
                        "riskTier": outlet.risk_tier,
                        "outletCode": outlet.outlet_code,
                    },
                    "detected_from_upload_id": None,
                }
            )

    # Add lifecycle realism: some older alerts are acknowledged/resolved/false positive.
    for a in anomalies:
        if a["status"] == "OPEN":
            a["status"] = pick_anomaly_status(a, END_DATE, rng)

    # Weekly executive summaries for chain and zones.
    week_start = START_DATE
    while week_start <= END_DATE:
        week_end = min(week_start + dt.timedelta(days=6), END_DATE)
        weekly = [a for a in anomalies if week_start <= a["anomaly_date"] <= week_end]
        outlet_week_score = defaultdict(int)
        for a in weekly:
            outlet_week_score[a["outlet_id"]] += a["risk_score_delta"]
        high = sum(1 for score in outlet_week_score.values() if score >= 80)
        med = sum(1 for score in outlet_week_score.values() if 35 <= score < 80)

        top_rules = defaultdict(int)
        for a in weekly:
            top_rules[a["rule_code"]] += 1
        findings = [
            {"ruleCode": r, "count": c}
            for r, c in sorted(top_rules.items(), key=lambda x: x[1], reverse=True)[:4]
        ]
        actions = [
            {"priority": 1, "action": "Review high-risk outlets for recurring correction chains."},
            {"priority": 2, "action": "Escalate repeated late upload outlets to regional manager."},
            {"priority": 3, "action": "Run spot stock recount for premium mix spikes and brand drops."},
        ]

        executive_summaries.append(
            {
                "id": uid("summary", f"city:{week_start}:{week_end}"),
                "week_start_date": week_start,
                "week_end_date": week_end,
                "scope_type": "CITY",
                "scope_ref_id": None,
                "generated_by_user_id": hq_admin,
                "generated_at": dt.datetime.combine(week_end, dt.time(9, 30)),
                "total_outlets": N_OUTLETS,
                "high_risk_outlets": high,
                "medium_risk_outlets": med,
                "top_findings": findings,
                "recommended_actions": actions,
                "narrative": f"Weekly Bengaluru review ({week_start} to {week_end}) highlights {high} high-risk and {med} medium-risk outlets requiring follow-up.",
            }
        )
        week_start += dt.timedelta(days=7)

    # Add audit entries for anomaly lifecycle changes.
    for a in anomalies:
        if a["status"] != "OPEN":
            audit_logs.append(
                {
                    "id": uid("audit", f"{a['id']}:ack"),
                    "entity_type": "anomalies",
                    "entity_id": a["id"],
                    "action": "STATUS_CHANGE",
                    "actor_user_id": auditor,
                    "source": "SCRIPT",
                    "request_id": f"seed-ack-{a['id'][:8]}",
                    "before_state": {"status": "OPEN"},
                    "after_state": {"status": a["status"]},
                    "notes": "Synthetic workflow status transition for demo realism.",
                    "created_at": dt.datetime.combine(a["anomaly_date"], dt.time(23, 30)),
                }
            )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="\n") as f:
        f.write("-- Auto-generated by packages/demo-data/scripts/generate_synthetic_demo.py\n")
        f.write(f"-- Seed: {seed}\n")
        f.write(f"-- Date Range: {START_DATE} to {END_DATE} ({DAYS} days)\n\n")
        f.write("BEGIN;\n\n")
        f.write("TRUNCATE TABLE audit_logs, executive_summaries, anomalies, daily_stock, daily_sales, uploads, users, products, outlets, outlet_peer_groups RESTART IDENTITY CASCADE;\n\n")

        def write_insert(table: str, columns: List[str], rows: List[Dict], chunk_size: int = 1000):
            if not rows:
                return
            for i in range(0, len(rows), chunk_size):
                batch = rows[i : i + chunk_size]
                f.write(f"INSERT INTO {table} ({', '.join(columns)}) VALUES\n")
                vals = []
                for row in batch:
                    ordered = []
                    for c in columns:
                        v = row.get(c)
                        if isinstance(v, dt.date) and not isinstance(v, dt.datetime):
                            ordered.append(q_date(v))
                        elif isinstance(v, dt.datetime):
                            ordered.append(q_ts(v))
                        elif c in {"details", "top_findings", "recommended_actions", "before_state", "after_state"}:
                            ordered.append(q_json(v))
                        else:
                            ordered.append(q(v))
                    vals.append("(" + ", ".join(ordered) + ")")
                f.write(",\n".join(vals))
                f.write("\nON CONFLICT (id) DO NOTHING;\n\n")

        write_insert(
            "outlet_peer_groups",
            ["id", "code", "name", "city", "zone", "locality", "notes"],
            peer_groups,
        )
        write_insert(
            "outlets",
            ["id", "outlet_code", "outlet_name", "license_type", "city", "state", "zone", "locality", "peer_group_id", "opened_on", "is_active"],
            [
                {
                    "id": o.id,
                    "outlet_code": o.outlet_code,
                    "outlet_name": o.outlet_name,
                    "license_type": o.license_type,
                    "city": CITY,
                    "state": STATE,
                    "zone": o.zone,
                    "locality": o.locality,
                    "peer_group_id": o.peer_group_id,
                    "opened_on": o.opened_on,
                    "is_active": True,
                }
                for o in outlets
            ],
        )
        write_insert(
            "products",
            ["id", "sku", "product_name", "brand_name", "category", "pack_size_ml", "abv_percent", "mrp", "is_active"],
            products,
        )
        write_insert(
            "users",
            ["id", "full_name", "email", "role", "is_active", "last_login_at"],
            users,
        )
        write_insert(
            "uploads",
            [
                "id",
                "outlet_id",
                "upload_type",
                "source",
                "upload_date",
                "status",
                "file_name",
                "checksum_sha256",
                "uploaded_by_user_id",
                "records_count",
                "error_count",
                "supersedes_upload_id",
                "correction_note",
                "created_at",
            ],
            uploads,
        )
        write_insert(
            "daily_sales",
            ["id", "outlet_id", "product_id", "sales_date", "units_sold", "gross_revenue", "net_revenue", "discount_amount", "upload_id"],
            daily_sales,
        )
        write_insert(
            "daily_stock",
            [
                "id",
                "outlet_id",
                "product_id",
                "stock_date",
                "opening_units",
                "inward_units",
                "sold_units",
                "actual_closing_units",
                "upload_id",
            ],
            daily_stock,
        )
        write_insert(
            "anomalies",
            [
                "id",
                "outlet_id",
                "product_id",
                "anomaly_date",
                "rule_code",
                "severity",
                "status",
                "risk_score_delta",
                "summary",
                "details",
                "detected_from_upload_id",
            ],
            anomalies,
        )
        write_insert(
            "executive_summaries",
            [
                "id",
                "week_start_date",
                "week_end_date",
                "scope_type",
                "scope_ref_id",
                "generated_by_user_id",
                "generated_at",
                "total_outlets",
                "high_risk_outlets",
                "medium_risk_outlets",
                "top_findings",
                "recommended_actions",
                "narrative",
            ],
            executive_summaries,
        )
        write_insert(
            "audit_logs",
            [
                "id",
                "entity_type",
                "entity_id",
                "action",
                "actor_user_id",
                "source",
                "request_id",
                "before_state",
                "after_state",
                "notes",
                "created_at",
            ],
            audit_logs,
        )
        f.write("COMMIT;\n")

    print(f"Wrote synthetic SQL seed to: {output_path}")
    print(f"Outlets: {len(outlets)}, Products: {len(products)}")
    print(f"Uploads: {len(uploads)}, Daily Sales: {len(daily_sales)}, Daily Stock: {len(daily_stock)}")
    print(f"Anomalies: {len(anomalies)}, Executive Summaries: {len(executive_summaries)}, Audit Logs: {len(audit_logs)}")


def main():
    parser = argparse.ArgumentParser(description="Generate deterministic synthetic demo SQL for BarOps Authority.")
    parser.add_argument(
        "--output",
        type=str,
        default=str(Path(__file__).resolve().parents[3] / "infra" / "postgres" / "003__barops_seed_synthetic.sql"),
        help="Output SQL file path.",
    )
    parser.add_argument("--seed", type=int, default=SEED, help="Random seed for deterministic output.")
    args = parser.parse_args()
    generate(Path(args.output), seed=args.seed)


if __name__ == "__main__":
    main()
