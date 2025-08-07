-- Dune Dashboard Queries for USDC Yield Optimizer
-- These queries analyze on-chain data and Segment events

-- ============================================================================
-- 1. Total Value Locked (TVL) Over Time
-- ============================================================================
-- Query ID: TVL_OVER_TIME
WITH daily_deposits AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        SUM(CASE WHEN topic0 = 0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7 THEN -- Deposit event
            bytearray_to_uint256(data) / 1e6 -- Convert from USDC decimals
        ELSE 0 END) as daily_deposits,
        SUM(CASE WHEN topic0 = 0xfbde797d201c681b91056529119e0b02407c7bb96a4a2c75c01fc9667232c8db THEN -- Withdraw event
            bytearray_to_uint256(data) / 1e6
        ELSE 0 END) as daily_withdrawals
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}} -- Replace with actual vault address
      AND block_time >= NOW() - INTERVAL '90' DAY
    GROUP BY 1
),
running_tvl AS (
    SELECT 
        date,
        daily_deposits,
        daily_withdrawals,
        SUM(daily_deposits - daily_withdrawals) OVER (ORDER BY date) as tvl
    FROM daily_deposits
)
SELECT 
    date,
    tvl,
    daily_deposits,
    daily_withdrawals,
    (daily_deposits - daily_withdrawals) as net_flow
FROM running_tvl
ORDER BY date DESC;

-- ============================================================================
-- 2. Protocol Distribution and Rebalancing Activity
-- ============================================================================
-- Query ID: PROTOCOL_DISTRIBUTION
WITH rebalance_events AS (
    SELECT 
        block_time,
        CASE 
            WHEN bytearray_to_uint256(SUBSTRING(data, 1, 32)) = 0 THEN 'Aave'
            WHEN bytearray_to_uint256(SUBSTRING(data, 1, 32)) = 1 THEN 'Morpho'
            WHEN bytearray_to_uint256(SUBSTRING(data, 1, 32)) = 2 THEN 'Moonwell'
        END as from_protocol,
        CASE 
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 0 THEN 'Aave'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 1 THEN 'Morpho'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 2 THEN 'Moonwell'
        END as to_protocol,
        bytearray_to_uint256(SUBSTRING(data, 65, 32)) as apy_gain_bps,
        bytearray_to_uint256(SUBSTRING(data, 97, 32)) / 1e6 as amount
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}}
      AND topic0 = 0x{{REBALANCE_EVENT_HASH}} -- Rebalance event signature
      AND block_time >= NOW() - INTERVAL '30' DAY
)
SELECT 
    to_protocol,
    COUNT(*) as rebalance_count,
    SUM(amount) as total_rebalanced_amount,
    AVG(apy_gain_bps) as avg_apy_gain_bps,
    MAX(block_time) as last_rebalance
FROM rebalance_events
GROUP BY to_protocol
ORDER BY rebalance_count DESC;

-- ============================================================================
-- 3. Yield Performance Analysis
-- ============================================================================
-- Query ID: YIELD_PERFORMANCE
WITH yield_events AS (
    SELECT 
        CAST(topic1 as VARCHAR) as user_address,
        bytearray_to_uint256(SUBSTRING(data, 1, 32)) / 1e6 as yield_amount,
        block_time
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}}
      AND topic0 = 0x{{YIELD_EARNED_EVENT_HASH}} -- YieldEarned event
      AND block_time >= NOW() - INTERVAL '90' DAY
)
SELECT 
    DATE_TRUNC('day', block_time) as date,
    COUNT(DISTINCT user_address) as active_users,
    SUM(yield_amount) as total_yield_generated,
    AVG(yield_amount) as avg_yield_per_user,
    COUNT(*) as yield_events
FROM yield_events
GROUP BY 1
ORDER BY date DESC;

-- ============================================================================
-- 4. User Acquisition and Retention Metrics
-- ============================================================================
-- Query ID: USER_METRICS
WITH first_deposits AS (
    SELECT 
        CAST(topic2 as VARCHAR) as user_address,
        MIN(block_time) as first_deposit_time,
        COUNT(*) as total_deposits,
        SUM(bytearray_to_uint256(SUBSTRING(data, 1, 32)) / 1e6) as total_deposited
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}}
      AND topic0 = 0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7 -- Deposit event
    GROUP BY 1
),
user_cohorts AS (
    SELECT 
        DATE_TRUNC('week', first_deposit_time) as cohort_week,
        COUNT(*) as new_users,
        AVG(total_deposited) as avg_first_deposit,
        SUM(total_deposited) as cohort_tvl
    FROM first_deposits
    GROUP BY 1
)
SELECT 
    cohort_week,
    new_users,
    avg_first_deposit,
    cohort_tvl,
    SUM(new_users) OVER (ORDER BY cohort_week) as cumulative_users
FROM user_cohorts
ORDER BY cohort_week DESC;

-- ============================================================================
-- 5. Rebalancing Efficiency and Win Rate
-- ============================================================================
-- Query ID: REBALANCING_EFFICIENCY
WITH rebalance_details AS (
    SELECT 
        block_time,
        CASE 
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 0 THEN 'Aave'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 1 THEN 'Morpho'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 2 THEN 'Moonwell'
        END as to_protocol,
        bytearray_to_uint256(SUBSTRING(data, 65, 32)) as apy_gain_bps,
        bytearray_to_uint256(SUBSTRING(data, 97, 32)) / 1e6 as amount,
        hash as tx_hash
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}}
      AND topic0 = 0x{{REBALANCE_EVENT_HASH}}
      AND block_time >= NOW() - INTERVAL '30' DAY
),
tx_costs AS (
    SELECT 
        t.hash,
        t.gas_used * t.gas_price / 1e18 as gas_cost_eth
    FROM base.transactions t
    INNER JOIN rebalance_details r ON t.hash = r.tx_hash
)
SELECT 
    DATE_TRUNC('day', r.block_time) as date,
    COUNT(*) as total_rebalances,
    COUNT(CASE WHEN r.apy_gain_bps > 30 THEN 1 END) as successful_rebalances,
    AVG(r.apy_gain_bps) as avg_apy_gain,
    AVG(t.gas_cost_eth * {{ETH_PRICE}}) as avg_gas_cost_usd, -- Replace with ETH price
    COUNT(CASE WHEN r.apy_gain_bps > 30 THEN 1 END) * 100.0 / COUNT(*) as win_rate_percent
FROM rebalance_details r
LEFT JOIN tx_costs t ON r.tx_hash = t.hash
GROUP BY 1
ORDER BY date DESC;

-- ============================================================================
-- 6. Protocol APY Comparison
-- ============================================================================
-- Query ID: PROTOCOL_APY_TRENDS
-- This would typically come from Segment events or external price feeds
-- Since on-chain data doesn't include APY history, we'll show rebalancing patterns

WITH protocol_preferences AS (
    SELECT 
        DATE_TRUNC('day', block_time) as date,
        CASE 
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 0 THEN 'Aave'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 1 THEN 'Morpho'
            WHEN bytearray_to_uint256(SUBSTRING(data, 33, 32)) = 2 THEN 'Moonwell'
        END as preferred_protocol,
        COUNT(*) as rebalances_to_protocol,
        AVG(bytearray_to_uint256(SUBSTRING(data, 65, 32))) as avg_apy_advantage
    FROM base.logs
    WHERE contract_address = 0x{{VAULT_ADDRESS}}
      AND topic0 = 0x{{REBALANCE_EVENT_HASH}}
      AND block_time >= NOW() - INTERVAL '30' DAY
    GROUP BY 1, 2
)
SELECT 
    date,
    preferred_protocol,
    rebalances_to_protocol,
    avg_apy_advantage,
    rebalances_to_protocol * 100.0 / SUM(rebalances_to_protocol) OVER (PARTITION BY date) as market_share_percent
FROM protocol_preferences
ORDER BY date DESC, rebalances_to_protocol DESC;

-- ============================================================================
-- 7. Gas Optimization Analysis
-- ============================================================================
-- Query ID: GAS_OPTIMIZATION
WITH gas_analysis AS (
    SELECT 
        DATE_TRUNC('hour', t.block_time) as hour,
        AVG(t.gas_price / 1e9) as avg_gas_price_gwei,
        COUNT(CASE WHEN l.contract_address = 0x{{VAULT_ADDRESS}} THEN 1 END) as rebalance_count,
        AVG(CASE WHEN l.contract_address = 0x{{VAULT_ADDRESS}} THEN t.gas_used * t.gas_price / 1e18 END) as avg_gas_cost_eth
    FROM base.transactions t
    LEFT JOIN base.logs l ON t.hash = l.transaction_hash 
        AND l.topic0 = 0x{{REBALANCE_EVENT_HASH}}
    WHERE t.block_time >= NOW() - INTERVAL '7' DAY
    GROUP BY 1
)
SELECT 
    hour,
    avg_gas_price_gwei,
    rebalance_count,
    avg_gas_cost_eth,
    avg_gas_cost_eth * {{ETH_PRICE}} as avg_gas_cost_usd,
    CASE 
        WHEN avg_gas_price_gwei < 10 THEN 'Low'
        WHEN avg_gas_price_gwei < 20 THEN 'Medium' 
        ELSE 'High'
    END as gas_price_category
FROM gas_analysis
WHERE rebalance_count > 0
ORDER BY hour DESC;

-- ============================================================================
-- 8. Dashboard Summary Stats
-- ============================================================================
-- Query ID: SUMMARY_STATS
SELECT 
    -- TVL Stats
    (SELECT SUM(bytearray_to_uint256(data)) / 1e6 
     FROM base.logs 
     WHERE contract_address = 0x{{VAULT_ADDRESS}} 
       AND topic0 = 0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7
     ORDER BY block_time DESC 
     LIMIT 1) as current_tvl,
     
    -- User Stats
    (SELECT COUNT(DISTINCT CAST(topic2 as VARCHAR))
     FROM base.logs 
     WHERE contract_address = 0x{{VAULT_ADDRESS}} 
       AND topic0 = 0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7) as total_users,
       
    -- Rebalancing Stats  
    (SELECT COUNT(*) 
     FROM base.logs 
     WHERE contract_address = 0x{{VAULT_ADDRESS}} 
       AND topic0 = 0x{{REBALANCE_EVENT_HASH}}
       AND block_time >= NOW() - INTERVAL '30' DAY) as rebalances_30d,
       
    -- Yield Stats
    (SELECT SUM(bytearray_to_uint256(SUBSTRING(data, 1, 32))) / 1e6
     FROM base.logs 
     WHERE contract_address = 0x{{VAULT_ADDRESS}} 
       AND topic0 = 0x{{YIELD_EARNED_EVENT_HASH}}
       AND block_time >= NOW() - INTERVAL '30' DAY) as total_yield_30d;