# Bayesean Ranked System



Love this direction. We’re going to be **formal, probabilistic, and explicit**, not hand-wavy “MMR vibes.” I’ll build this **from first principles**, then specialize it to trivia.

I’ll structure this as:

1. **What “Bayesian skill” actually means**
2. **Latent skill as a random variable**
3. **Outcome model (likelihood)**
4. **Prior → posterior update**
5. **Why Gaussian skill works**
6. **Exact math for question answering**
7. **Difficulty modeling (IRT connection)**
8. **Uncertainty dynamics**
9. **Why this dominates Elo conceptually**
10. **How this extends to categories & buzzing**

No shortcuts.

---

# 1. What does “Bayesian skill model” mean?

In Bayesian inference:

> We do **not** store “true skill.”
> We store a **probability distribution over possible skill values**.

Formally:

$$[
\text{Skill} = S \sim \mathcal{D}
]$$

Instead of:

```
player.rating = 1420
```

we have:

```
player.skill ~ Normal(μ, σ²)
```

* **μ (mean)** → best estimate of skill
* **σ (std dev)** → uncertainty in that estimate

This is not cosmetic — σ is *active* in updates.

---

# 2. Latent skill as a random variable

Let:
$$[
S_p \sim \mathcal{N}(\mu_p, \sigma_p^2)
]$$

This is a **latent variable**:

* You never observe skill directly
* You only observe *performance*

In trivia, performance = answering questions.

---

# 3. Modeling outcomes: likelihood function

For each question attempt, you observe:

$$[
Y \in {0,1}
]$$

* 1 = correct
* 0 = incorrect

We need:
$$[
P(Y = 1 \mid S_p, D_q)
]$$

where:

* (S_p) = player skill
* (D_q) = question difficulty

This is the **likelihood**.

---

# 4. Core assumption: skill vs difficulty determines probability

Define a *performance difference* variable:

$$[
Z = S_p - D_q
]$$

Higher (Z) → more likely to answer correctly.

We now define:

$$[
P(Y=1 \mid Z) = \Phi\left(\frac{Z}{\beta}\right)
]$$

Where:

* (\Phi) = standard normal CDF
* (\beta) = noise parameter (question randomness)

This is the **probit model**.

> This is the exact model used in **TrueSkill** and **Item Response Theory**.

---

# 5. Why Gaussians?

Because:

* Skills combine additively
* Noise is approximately symmetric
* Posterior remains approximately Gaussian
* Updates are tractable

This gives us **conjugacy** or near-conjugacy.

---

# 6. Prior → Posterior update (Bayes’ theorem)

We start with:

$$[
P(S_p \mid Y) \propto P(Y \mid S_p) \cdot P(S_p)
]$$

Where:

* Prior: ( \mathcal{N}(\mu_p, \sigma_p^2) )
* Likelihood: Bernoulli with probit link

Exact posterior is **not Gaussian**, but we approximate it as Gaussian via moment matching.

This gives updated:

* (\mu_p')
* (\sigma_p')

---

# 7. Expected correctness probability

Because (S_p) is uncertain, we integrate over it:

$$[
P(Y=1) = \int \Phi\left(\frac{s - D_q}{\beta}\right)
\mathcal{N}(s \mid \mu_p, \sigma_p^2) ds
]$$

Closed-form result:

$$[
P(Y=1) = \Phi\left(
\frac{\mu_p - D_q}{\sqrt{\sigma_p^2 + \beta^2}}
\right)
]$$

This is *critical*.

**Interpretation:**

* High σ → predictions are conservative
* Low σ → predictions are sharp

---

# 8. Rating update equations (core math)

Define:

$$[
\Delta = \frac{\mu_p - D_q}{\sqrt{\sigma_p^2 + \beta^2}}
]$$

Let:

* (v(\Delta)) = PDF/CDF correction term
* (w(\Delta)) = variance reduction term

Specifically:

$$[
v(\Delta) = \frac{\phi(\Delta)}{\Phi(\Delta)}
]$$

$$[
w(\Delta) = v(\Delta) \cdot (v(\Delta) + \Delta)
]$$

Where:

* (\phi) = standard normal PDF

---

### Mean update (correct answer)


$$[
\mu_p' = \mu_p + \frac{\sigma_p^2}{\sqrt{\sigma_p^2 + \beta^2}} \cdot v(\Delta)
]
$$

### Variance update

$$[
\sigma_p'^2 = \sigma_p^2 \cdot \left(1 - \frac{\sigma_p^2}{\sigma_p^2 + \beta^2} \cdot w(\Delta)\right)
]
$$

---

### If incorrect?

You flip the sign:

$$[
\Delta \rightarrow -\Delta
]$$

This causes:

* Mean decreases
* Variance still shrinks (you learned something)

---

# 9. Why this works intuitively

### Easy question, strong player

* (\Delta) large
* (v(\Delta)) small
* Tiny update

### Hard question, weak player (correct)

* (\Delta) very negative
* (v(\Delta)) huge
* Massive upward shift

### New player

* Large σ
* Large update magnitude

### Veteran

* Small σ
* Stable rating

This all falls out *automatically*.

---

# 10. Modeling question difficulty as Bayesian too

You can also treat question difficulty as:

$$[
D_q \sim \mathcal{N}(\mu_q, \sigma_q^2)
]$$

Then updates become **symmetric**:

* Players learn
* Questions get calibrated

This is exactly **IRT**.

Over time:

* Badly written questions drift
* Ambiguous questions show high σ
* Too-easy questions collapse in difficulty

---

# 11. Category-specific skills

Let:
$$[
S_p^{(c)} \sim \mathcal{N}(\mu_{p,c}, \sigma_{p,c}^2)
]$$

Effective skill:

$$[
S_{eff} = \alpha S_{global} + (1-\alpha) S_{category}
]$$

This lets:

* Specialists dominate their category
* Generalists remain competitive

---

# 12. Buzzing / timing extensions

Add a **performance variable**:

$$[
P = S_p - D_q + \epsilon
]$$

Early buzz:

* Larger |P|
* Stronger signal

Neg:

* Wrong early buzz → penalize more

This is mathematically clean.

---

# 13. Why this is better than Elo (formally)

| Feature             | Elo | Bayesian |
| ------------------- | --- | -------- |
| Uncertainty         | ❌   | ✅        |
| Difficulty modeling | ❌   | ✅        |
| Partial credit      | ❌   | ✅        |
| Category skill      | ❌   | ✅        |
| Anti-farming        | ❌   | ✅        |
| Cold-start          | ❌   | ✅        |

Elo is a **point estimator**.
This is **distributional inference**.

---

# 14. Mental model (important)

Think of each question as:

> “How much information did this observation give me?”

Bayesian updating:

* High surprise → large update
* Low surprise → small update
* Uncertain prior → learn fast
* Certain prior → learn slow

No heuristics needed.

---

If you want next, we can:

* Implement this numerically
* Convert this to code
* Compare probit vs logistic (Rasch vs 2PL)
* Design exploit-resistant parameter choices
* Simulate convergence with fake players/questions

This is *exactly* the right level of rigor for a ranked trivia system.
