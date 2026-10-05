# Persona: Elena

| | |
|---|---|
| Profile | 31, remote software consultant between Berlin and London; family in East Asia |
| Mode | `FAMILY_HOUSEHOLD` |
| Income | €7,500/month (EU clients), £3,000/month (UK contracts) |
| Remittances | ~25,000 RMB / ~S$4,800 per month to Shanghai/Singapore |
| Portfolio | €95,000: US tech equities 60%, European corporate bonds 25%, EUR cash 15%; base EUR |
| Devices | iPhone (mobile web, TestFlight app) in dark mode; MacBook browser |

## Journey
```mermaid
sequenceDiagram
    autonumber
    actor Elena
    participant UI as DEWA (mobile)
    participant Engine as Calculation engine
    participant Agent as Advisory agent
    participant Passkey as Face ID
    participant Ledger as Sandbox ledger
    actor Family as Co-planner / judge

    Elena->>UI: passkey sign-in
    UI->>Elena: net worth shows EUR/GBP −6% vs Asian currencies
    Engine->>UI: alert: household runway 3.2 months (family threshold 6)
    Elena->>UI: asks how the household portfolio should adapt
    UI->>Agent: prompt + household multi-currency context (locale en)
    Agent->>Engine: get_currency_exposure, calculate_burn_rate(FAMILY)
    Engine-->>Agent: EUR/GBP exposure 85%; Asian liabilities 35% of outflow
    Agent->>Engine: calculate_adaptive_portfolio(risk 4.0, hedge EUR/CNY)
    Engine-->>Agent: shift 20% US equities → Asian money market + EUR cash buffer
    Agent-->>UI: action card + three-pillar rationale
    Elena->>UI: share plan, masked
    Elena->>Family: sends the /share link
    Family->>UI: views weights and rationale without an account
    Elena->>UI: simulate −5% EUR shock (Tier 2)
    Elena->>UI: approve rebalance (Tier 3)
    UI->>Passkey: Face ID
    Passkey-->>UI: assertion
    UI->>Ledger: commit order with assertion
    Ledger-->>UI: transaction hash + new state
```
