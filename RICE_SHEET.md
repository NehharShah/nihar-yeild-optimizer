# RICE Sheet — USDC Yield Optimizer PoC

## Definitions
- **Reach**: estimated users impacted in the next week
- **Impact**: 3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal
- **Confidence**: certainty (0–1)
- **Effort**: person‑weeks (this 1‑week sprint)
- **RICE** = (Reach × Impact × Confidence) ÷ Effort

## Assumptions (week 1)
- 500 site visits, 150 wallet connects, 60 depositors, 30 enable Auto‑Yield.

## Initiatives and Scores

| # | Initiative | Reach | Impact | Confidence | Effort | RICE | One‑liner |
|---|------------|------:|------:|-----------:|-------:|-----:|-----------|
| 11 | Waitlist + referral for mainnet access | 500 | 0.7 | 0.6 | 0.3 | 700.0 | Capture intent; amplify via referral. |
| 10 | Segment events + live debug panel | 150 | 1.0 | 0.9 | 0.2 | 675.0 | Verify funnel; unblock iteration. |
| 1 | One‑click Safe + session key during onboarding | 150 | 2.5 | 0.7 | 0.6 | 437.5 | Create Safe and grant session key in one flow. |
| 9 | Deposit presets (10/50/100 USDC) | 60 | 1.2 | 0.9 | 0.2 | 324.0 | Quick amounts increase completion. |
| 4 | Keeper live‑status widget (+last rebalance) | 150 | 1.5 | 0.7 | 0.5 | 315.0 | Trust via health and last run. |
| 6 | APY‑delta alert + "Rebalance now" CTA (sim) | 150 | 1.6 | 0.6 | 0.5 | 288.0 | Actionable deltas; manual trigger. |
| 7 | Gas‑sponsored testnet actions (paymaster) | 150 | 1.4 | 0.6 | 0.5 | 252.0 | Remove ETH requirement to try. |
| 2 | Inline Approve + Deposit (single CTA) | 60 | 2.0 | 0.8 | 0.4 | 240.0 | Reduce friction to first success. |
| 3 | Auto‑Yield toggle prompt after first deposit | 60 | 1.8 | 0.75 | 0.4 | 202.5 | Nudge to enable automation. |
| 5 | Dune snapshot on homepage (TVL, win‑rate) | 500 | 1.2 | 0.8 | 0.3 | 160.0 | Public proof via metrics. |
| 8 | "Why Safe" trust modal (threshold, limits) | 500 | 0.8 | 0.75 | 0.2 | 150.0 | Reduce AA/security anxiety. |
| 12 | Email/webhook on rebalance success | 60 | 1.0 | 0.7 | 0.3 | 140.0 | Notify at key value moments. |

## Top Picks (This Week)

### High Priority (RICE > 400)
1. **Waitlist + referral** (#11) — RICE: 700.0
2. **Segment events + live debug panel** (#10) — RICE: 675.0
3. **One‑click Safe + session key** (#1) — RICE: 437.5

### Medium Priority (RICE 200-400)
4. **Deposit presets** (#9) — RICE: 324.0
5. **Keeper live‑status widget** (#4) — RICE: 315.0
6. **APY‑delta alert + manual trigger** (#6) — RICE: 288.0
7. **Gas‑sponsored testnet actions** (#7) — RICE: 252.0
8. **Inline Approve + Deposit** (#2) — RICE: 240.0

### Lower Priority (RICE < 200)
9. **Auto‑Yield toggle prompt** (#3) — RICE: 202.5
10. **Dune snapshot on homepage** (#5) — RICE: 160.0
11. **"Why Safe" trust modal** (#8) — RICE: 150.0
12. **Email/webhook notifications** (#12) — RICE: 140.0

## Implementation Strategy

### If engineering bandwidth is tight:
Ship **#10, #9, #4, #5** in parallel — they're fast and high‑value.

### If AA friction is the bottleneck:
Prioritize **#1, #7, #8, #3** to reduce onboarding friction.

### Week 1 Focus:
- **Must have**: Segment tracking (#10), Deposit presets (#9)
- **Should have**: Keeper status (#4), Waitlist (#11)
- **Nice to have**: One-click Safe (#1) if development is ahead of schedule

---

*Note: This RICE analysis is tailored for the 1-week PoC timeline. Scores would be recalibrated for longer-term roadmap planning.*
