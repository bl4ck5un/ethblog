---
title: MEV Is a Trap and the Smartest Bots Are the Prey
author: Sen Yang
date: 2025-07-01
---

# MEV Is a Trap and the Smartest Bots Are the Prey

> This is a re-post of https://collective.flashbots.net/t/mev-is-a-trap-and-the-smartest-bots-are-the-prey/5050 by the author with minor revision.

Searchers — often regarded as some of the most sophisticated actors in blockchain — continuously monitor on-chain state to identify and exploit profit opportunities. Through these mechanisms, many searchers have extracted substantial profits. However, as they hunt for arbitrage and extraction in the dark forest of MEV, one must ask: are they also at risk of becoming prey themselves? This post presents real-world case studies of MEV-phishing attacks, where adversaries craft deceptive MEV opportunities as bait to exploit searchers.

## Background

Why have MEV searchers become targets — or "prey" — for hunters? The simplest answer is: by continuously extracting MEV opportunities, these searchers accumulate large amounts of ERC-20 tokens in the smart contracts they use (i.e., MEV bots). Such assets naturally attract attackers, who aim to take control of the tokens held by the searchers.

### What is the security issue behind?

In short, the main issue is the access control in MEV bot contracts. Ideally, the contract should block all external calls except those from specific contracts, like a Uniswap V3 pool. However, implementing such fine-grained checks on-chain is costly — about 450 gas for verifying a Uniswap V3 pool caller. A cheaper alternative is using `tx.origin` to block direct external calls, which costs only 8 gas by reverting if `tx.origin` is not a predefined address.

This approach is insecure because if an attacker enters the MEV bot’s call chain, they can bypass `tx.origin` check. Although this may seem difficult, searchers' continuous MEV hunting creates opportunities for such attacks.

### MEV supply chain

When can a malicious attacker become part of an MEV bot contract's call chain? A simple method is to join the MEV supply chain:

- The searcher monitors the mempool and on-chain state to find MEV opportunities.
- It sends a transaction to invoke its MEV bot contract.
- The bot executes a trade on a DEX, transferring specific tokens.
- The transaction is submitted to a builder and included via MEV-Boost auctions (details omitted here).

The key point: the DEX and tokens are already in the bot's call chain, and `tx.origin` is the searcher's address.

## MEV-phishing Attacks

*MEV-phishing attacks* resemble traditional phishing: the attacker presents a malicious but attractive MEV opportunity to lure searchers. When a searcher submits the transaction, their MEV bot executes as usual — but the crafted opportunity inserts the attacker into the call chain. This enables the attacker to bypass `tx.origin` checks and potentially drain funds. The attack relies on tricking the victim into triggering the harmful interaction. We analyze three MEV-phishing variants, each targeting a different actor in the MEV supply chain.

### Token-based

A typical token-based MEV-phishing attack was first studied by https://x.com/bertcmiller/status/1421543838569705474, where a victim searcher attempted to arbitrage the [CHUM](https://etherscan.io/token/0x1b7f405ceff357cf127a427b817d4598dfa04744) token, which was created as bait. The workflow is:
1. The attacker creates a malicious token like CHUM. The token contract modifies the standard transfer function to exploit a vulnerable function in the target MEV bot contract and drain its balances when executed.
2. The attacker deploys a Uniswap V2 pool (or other pool) containing the malicious token.
3. The attacker generates an MEV opportunity involving this pool — such as a swap — and broadcasts the transaction to the public mempool, where the targeted searcher detects it. The searcher follows the usual steps:
    a. Identifies the MEV opportunity from the mempool.
    b. Invokes its MEV bot contract to capture the opportunity.
    c. The MEV bot contract executes the swap on the pool.
    d. During the swap, the pool transfers the malicious token, including it in the call chain (searcher → MEV bot → pool → malicious token), so `tx.origin` remains the searcher.
4. The malicious logic triggers, allowing the token contract to call a vulnerable function in the MEV bot and drain its ERC-20 token balances.

### Pool-based

The second variant involves a malicious pool — when the searcher trades through this pool, it triggers an external call to the MEV bot contract that drains its ERC-20 token balances. A typical example occurred in March 2025: https://etherscan.io/tx/0x1b539dbd898971f5296cea65c5af766df34f13dd7c1bea38e6700364847dc0d9. Instead of using a malicious token, the attacker created a [malicious pool](https://etherscan.io/address/0x7f790695b65e872ab8a0709c8d1b6f91191a793d) for attacking:

1. The attacker creates a malicious pool with benign tokens. On swap execution, the pool triggers a vulnerable function in the MEV bot contract.
2. The attacker broadcasts an MEV opportunity; the searcher follows the usual workflow.
3. When the MEV bot swaps in the pool, the crafted logic attacks the MEV bot contract (call chain: searcher → MEV bot → malicious pool).
    In the attack example, the MEV bot calls `ExactETHForTokensSupportingFeeOnTransferTokens`. The DEX pays a protocol fee to the deployer, which is a malicious address. When this address receives the fee, it calls a vulnerable function in the MEV bot, bypassing the `tx.origin` check and draining funds.

### Refund-based

The third variant exploits MEV refund services that require the searcher to send ETH to a user address within the same transaction. A typical case is https://etherscan.io/tx/0x26361798094d7532c0b8dfbed4c857265c66391040eef07f91fafcd420d47df0

1. To enable this attack, the attacker deploys a malicious contract as the refund address.
2. An MEV opportunity involving a standard-compliant swap is submitted to the refund service, with the malicious address set as the refund recipient. This avoids detection based on token or pool compliance. The searcher follows the usual steps (b-d), except:
  a. It receives the opportunity from the refund service;
  e. It must send ETH to the specified address as part of the protocol.
3. When the refund is sent, the malicious contract executes crafted logic that calls a vulnerable function in the MEV bot. Since the transaction originates from the searcher, `tx.origin` checks are bypassed. (Call chain: searcher → MEV bot → malicious refund address.)

### Summary

In MEV-phishing attacks, the attacker deploys a malicious contract (token, pool, or refund address) with logic that triggers during MEV extraction. For tokens, it triggers on transfer; for pools, on swap; and for refund addresses, on receiving ETH. This logic exploits a vulnerability in the MEV bot contract to drain its balance.

## Conclusion

This post introduces MEV-phishing attacks and their three variants: token-based, pool-based, and refund-based. These cases show that **MEV is a dark forest, where searchers can also become prey**. The goal is to highlight risks to searchers and encourage a more decentralized and transparent MEV ecosystem. As part of our [paper](https://arxiv.org/abs/2504.13398), we find that MEV-phishing attacks occurred from 2021 to 2025, leading to at least $2.76 million in losses. Given both the duration and scale, these attacks represent a serious and ongoing threat.

Key lessons for MEV searchers:
- Treat MEV opportunities with caution. Always simulate transactions and check balance changes afterward.
- Any party in the MEV supply chain can be malicious. This includes tokens, pools, or refund addresses. As MEV and DeFi evolve, new components-like Uniswap V4 hooks—will introduce new attack surfaces.
- Please check MEV bot contracts. If issues are found, upgrade immediately. Your bots might already be the target.