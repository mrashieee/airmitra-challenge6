# All-India Coverage Checklist (28 States + 8 UTs)

Goal: the app must return data for **every** state/UT, including the smallest ones. Where no CPCB ground station exists, fall back to model data and label it honestly.

## 1. States (28)

| # | State | Capital | Lat | Lon | Ground data |
|---|-------|---------|-----|-----|-------------|
| 1 | Andhra Pradesh | Amaravati | 16.5131 | 80.5165 | High |
| 2 | Arunachal Pradesh | Itanagar | 27.0844 | 93.6053 | Low |
| 3 | Assam | Dispur | 26.1433 | 91.7898 | Medium |
| 4 | Bihar | Patna | 25.5941 | 85.1376 | High |
| 5 | Chhattisgarh | Raipur | 21.2514 | 81.6296 | Medium |
| 6 | Goa | Panaji | 15.4909 | 73.8278 | Medium |
| 7 | Gujarat | Gandhinagar | 23.2156 | 72.6369 | High |
| 8 | Haryana | Chandigarh | 30.7333 | 76.7794 | High |
| 9 | Himachal Pradesh | Shimla | 31.1048 | 77.1734 | Low |
| 10 | Jharkhand | Ranchi | 23.3441 | 85.3096 | Medium |
| 11 | Karnataka | Bengaluru | 12.9716 | 77.5946 | High |
| 12 | Kerala | Thiruvananthapuram | 8.5241 | 76.9366 | High |
| 13 | Madhya Pradesh | Bhopal | 23.2599 | 77.4126 | High |
| 14 | Maharashtra | Mumbai | 19.0760 | 72.8777 | High |
| 15 | Manipur | Imphal | 24.8170 | 93.9368 | Low |
| 16 | Meghalaya | Shillong | 25.5788 | 91.8933 | Low |
| 17 | Mizoram | Aizawl | 23.7271 | 92.7176 | Low |
| 18 | Nagaland | Kohima | 25.6751 | 94.1086 | Low |
| 19 | Odisha | Bhubaneswar | 20.2961 | 85.8245 | High |
| 20 | Punjab | Chandigarh | 30.7333 | 76.7794 | High |
| 21 | Rajasthan | Jaipur | 26.9124 | 75.7873 | High |
| 22 | Sikkim | Gangtok | 27.3389 | 88.6065 | Low |
| 23 | Tamil Nadu | Chennai | 13.0827 | 80.2707 | High |
| 24 | Telangana | Hyderabad | 17.3850 | 78.4867 | High |
| 25 | Tripura | Agartala | 23.8315 | 91.2868 | Low |
| 26 | Uttar Pradesh | Lucknow | 26.8467 | 80.9462 | High |
| 27 | Uttarakhand | Dehradun | 30.3165 | 78.0322 | Medium |
| 28 | West Bengal | Kolkata | 22.5726 | 88.3639 | High |

## 2. Union Territories (8)

| # | UT | Capital | Lat | Lon | Ground data |
|---|----|---------|-----|-----|-------------|
| 29 | Andaman and Nicobar Islands | Port Blair | 11.6234 | 92.7265 | Low |
| 30 | Chandigarh | Chandigarh | 30.7333 | 76.7794 | High |
| 31 | Dadra & Nagar Haveli and Daman & Diu | Daman | 20.3974 | 72.8328 | Low |
| 32 | Delhi (NCT) | New Delhi | 28.6139 | 77.2090 | Very High |
| 33 | Jammu and Kashmir | Srinagar / Jammu | 34.0837 | 74.7973 | Medium |
| 34 | Ladakh | Leh | 34.1526 | 77.5770 | Low |
| 35 | Lakshadweep | Kavaratti | 10.5669 | 72.6420 | Low |
| 36 | Puducherry | Puducherry | 11.9416 | 79.8083 | Medium |

> "Ground data" is an estimate of CAAQMS station density. **Verify at build time** against CPCB/OpenAQ. Low = likely needs the CAMS model fallback.

## 3. Resolution chain (must never show "no data")

```
For selected state/UT:
1. Find nearest CPCB station      -> source = "CPCB ground station"
2. Else nearest OpenAQ/XKDR       -> source = "OpenAQ ground station"
3. Else Open-Meteo CAMS at capital -> source = "Model estimate (CAMS)"
4. Else cached last-known         -> source = "Cached <timestamp>"
```

- Always display the **source badge** + pollutant basis.
- Convert everything to **CPCB NAQI** for display (not US EPA).
- Note: states sharing a capital (Punjab/Haryana -> Chandigarh) will initially show identical numbers; offset by nearest station within the state boundary.

## 4. Deliverable

- Ship `data/states.json` (provided in this folder) as the single source of truth for the selector.
- Add a smoke test: loop all 36 entries, assert `aqi != null` and `source != null`.

## 5. Implementation notes

- State boundaries for map drawing: use a GeoJSON of India states (e.g. datameet / Survey of India simplified). Keep it lightweight for mobile.
- For the phone PWA, lazy-load the GeoJSON and only render the selected state.
- Cache responses 15-30 min to stay within free API limits.
