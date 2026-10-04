# FinTechathon 2026: Project Concept Document
**Track:** International Track  
**Core Topic:** Topic B (Wealth Advisory Agent)  
**Integrated Topics:** Topic A (Personal Finance Assistant) & Topic C (Cross-Border & Student Finance Assistant)  
**Target User:** Expatriates (Expats)  

---

## 1. Executive Summary & Value Proposition
Modern expatriates face unique financial fragmentation: multi-currency cash flows, erratic remittance fees, differing cross-border tax jurisdictions, and volatile burn rates. Traditional wealth advisory models rely on static risk questionnaires and siloed domestic bank accounts, failing to capture the fluid financial reality of expats. 

Our project—**The Dynamic Expat Wealth Agent (DEWA)**—is an autonomous AI wealth advisory agent built for Topic B. By fusing Topic A's real-time personal finance intelligence (budgeting, spending insights, and burn-rate tracking) with Topic C's cross-border financial capabilities (multi-currency risk management, remittance optimization, and multi-jurisdictional compliance), DEWA delivers compliant, explainable, and continuously adaptive asset-allocation strategies.

---

## 2. Core Feature Set & Integration Architecture

### A. Core Wealth Advisory Workflow (Topic B - Foundation)
* **Client Risk Profiling:** Continuous behavioral profiling that maps user risk tolerance not just through static surveys, but through real-world transaction reactions and liquidity demands.
* **Product Comparison & Allocation:** Automated matching across global asset classes, index funds, and cross-border investment vehicles.
* **Explainable Advisory Dialogue:** A transparent conversational interface that cites regulatory boundaries, historical asset correlation, and risk parameters before executing or suggesting portfolio rebalancing.

### B. Personal Finance Intelligence (Topic A Integration)
* **Dynamic Burn-Rate Tracking:** Monitors monthly cash flow patterns, recurring subscription costs, and discretionary spending in real-time.
* **Adaptive Risk Adjustments:** Automatically tightens or relaxes portfolio risk recommendations when the user's monthly burn rate spikes or emergency cash buffers dip below a safe threshold.

### C. Cross-Border Financial Engine (Topic C Integration)
* **Multi-Currency Cash Flow Volatility:** Analyzes currency exposure across income and expense countries to hedge against foreign exchange risk.
* **Remittance & Transfer Cost Optimization:** Flags expensive cross-border transfers and recommends optimal timing and channels for moving capital between home and host nations.
* **Tax & Regulatory Constraint Awareness:** Incorporates cross-border tax implications (e.g., dual-tax treaties, capital gains rules) into the portfolio optimization logic.

---

## 3. Comprehensive Research Question

To guide our technical development, system architecture, security design, and final presentation deck, our overarching research question is defined as follows:

> *"How can an autonomous AI wealth-advisory agent dynamically balance multi-currency cash-flow volatility, cross-border regulatory constraints, and real-time personal burn rates to deliver explainable, compliant, and continuously adaptive asset-allocation strategies for expatriates?"*

### Sub-Questions to Be Addressed in Technical Documentation:
1. **Dynamic Adaptation:** How can real-time transactional data (Topic A) programmatically recalibrate standard portfolio optimization models (like Mean-Variance Optimization or Black-Litterman) without introducing erratic allocation shifts?
2. **Cross-Border Compliance:** What permission-tier architectures and modular guardrails are required to ensure that multi-jurisdictional tax and remittance recommendations (Topic C) remain fully compliant and explainable (satisfying the 30% Security & Compliance scoring criteria)?
3. **Autonomous Execution vs. Human Oversight:** Where should the line be drawn between autonomous agent actions (e.g., alerting, rebalancing suggestions) and required user approvals within a sandbox/simulated financial environment?

---

## 4. Next Steps & Development Roadmap
* **Step 1:** Finalize system architecture diagram (Agent Orchestrator, LLM Reasoning Engine, Financial Calculation Engine, and Mock Sandbox Environment).
* **Step 2:** Define the security self-assessment framework and permission tiers for cross-border data handling.
* **Step 3:** Draft core mock scenarios and test cases showcasing a user experiencing currency volatility and an unexpected burn-rate spike.
