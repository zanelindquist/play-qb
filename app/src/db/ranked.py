import math


SQRT_2PI = math.sqrt(2 * math.pi)

RANK_STEP_SIZE = 100
RANKS = [
    {"name": "Dirt", "rr": 0},
    {"name": "Plastic", "rr": 900},
    {"name": "Tin", "rr": 1000},
    {"name": "Bronze", "rr": 1100},
    {"name": "Silver", "rr": 1200},
    {"name": "Gold", "rr": 1300},
    {"name": "Diamond", "rr": 1400},
    {"name": "Immortal", "rr": 1500}
]

# Skill is used for players
class Skill:
    def __init__(self, mu: float, sigma: float):
        self.mu = mu
        self.sigma = sigma

    def __repr__(self):
        return f"<Skill(mu={self.mu}, sigma={self.sigma})>"

# Difficulty is for questions
class Difficulty:
    def __init__(self, mu: float, sigma: float):
        self.mu = mu
        self.sigma = sigma

    def __repr__(self):
        return f"<Difficulty(mu={self.mu}, sigma={self.sigma})>"
    
class Rank:
    def __init__(self, name: str, rr: float, numeral: str = "I", skill_mu: float = 0, skill_sigma: float = 0):
        self.name = name
        self.rr = rr
        self.numeral = numeral
        self.rank = f"{name} {numeral}"
        self.skill_mu = skill_mu
        self.skill_sigma = skill_sigma

    def __repr__(self):
        return f"<{self.name}(rr={self.rr})>"
    
    def to_dict(self):
        return {"rank": f"{self.name} {self.numeral}", "rr": self.rr, "skill_mu": self.skill_mu, "skill_sigma": self.skill_sigma}


def normal_pdf(x: float) -> float:
    return math.exp(-0.5 * x * x) / SQRT_2PI

def normal_cdf(x: float) -> float:
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def v_func(delta: float) -> float:
    return normal_pdf(delta) / max(normal_cdf(delta), 1e-9)

def w_func(delta: float) -> float:
    v = v_func(delta)
    return v * (v + delta)

def weight_answer_time(p: float) -> float:
    return 2 - math.sqrt(p);

# TODO: We may want to not weight incorrect answers a ton beacuse that shows they at least thought they could answer the question
# For example, the probability that they get the incorrectly answered question right is higher than for a question they didn't buzz (hypothetically)
def update_skill(
    skill: Skill,
    difficulty: Difficulty,
    correct: bool,
    answer_time: float,
    beta: float
) -> Skill:
    """
    Bayesian update for one question attempt
    """

    # Combined uncertainty
    c = math.sqrt(skill.sigma**2 + difficulty.sigma**2 + beta**2)

    # Performance difference
    delta = (skill.mu - difficulty.mu) / c

    if not correct:
        delta = -delta
    else:
        delta *= weight_answer_time(answer_time)

    v = v_func(delta)
    w = w_func(delta)

    # Mean update
    mu_new = skill.mu + (skill.sigma**2 / c) * v

    # Variance update
    sigma_sq_new = skill.sigma**2 * (1 - (skill.sigma**2 / (c**2)) * w)

    return Skill(mu_new, math.sqrt(max(sigma_sq_new, 1e-6)))

def non_answer_update_skill(
    skill: Skill,
    difficulty: Difficulty,
    buzz_fraction: float,
    beta: float = 200.0,
    power: float = 2.5,
    max_mu_drop: float = 5.0
) -> Skill:
    """
    Update user skill from NOT buzzing before buzz_fraction of the question.
    """

    # Effective difficulty at cutoff
    eff_mu_q = difficulty.mu + difficulty.timing_penalty(buzz_fraction)

    # Performance comparison distribution
    mu_d = skill.mu - eff_mu_q
    sigma_x = math.sqrt(
        skill.sigma**2 +
        difficulty.sigma**2 +
        beta**2
    )

    z = mu_d / sigma_x

    # Avoid numerical blowups
    Phi = normal_cdf(z)
    if Phi < 1e-6:
        return skill  # silence provides no info here

    v = normal_pdf(z) / Phi

    # Timing weight
    weight = buzz_fraction ** power

    # Mean update (negative)
    delta_mu = - (skill.sigma**2 / sigma_x) * v * weight

    # Cap penalty for safety
    delta_mu = max(delta_mu, -max_mu_drop)

    # Variance reduction (very mild)
    w = v * (v + z)
    delta_sigma_sq = - (skill.sigma**2 / sigma_x**2) * w * weight

    # Apply updates
    skill.mu += delta_mu
    skill.sigma = math.sqrt(max(skill.sigma**2 + delta_sigma_sq, 1.0))

    return skill

def update_question_difficulty(
    difficulty,
    player_skill,
    correct: bool,
    buzz_fraction: float,
    beta: float,
    gamma: float = 2.0,
    min_sigma: float = 50.0
):
    """
    Bayesian update of question difficulty with time-weighted evidence.
    """

    # Evidence weight (early buzz = strong signal)
    weight = (1.0 - buzz_fraction) ** gamma

    # If basically a giveaway, ignore
    if weight < 1e-3:
        return difficulty

    # Combined uncertainty
    c = math.sqrt(
        player_skill.sigma**2 +
        difficulty.sigma**2 +
        beta**2
    )

    # Performance delta
    delta = (player_skill.mu - difficulty.mu) / c

    # Correct answer implies question easier → difficulty decreases
    # Wrong answer implies question harder → difficulty increases
    if correct:
        delta = -delta

    v = v_func(delta)
    w = w_func(delta)

    # Mean update (scaled by evidence weight)
    mu_new = difficulty.mu + weight * (difficulty.sigma**2 / c) * v

    # Variance update
    sigma_sq_new = difficulty.sigma**2 * (
        1 - weight * (difficulty.sigma**2 / (c**2)) * w
    )

    return Difficulty(
        mu=mu_new,
        sigma=max(math.sqrt(max(sigma_sq_new, 1e-6)), min_sigma)
    )

def effective_skill(global_skill: Skill, category_skill: Skill, alpha=0.6) -> Skill:
    mu = alpha * global_skill.mu + (1 - alpha) * category_skill.mu

    # Conservative uncertainty
    sigma = math.sqrt(
        alpha**2 * global_skill.sigma**2 +
        (1 - alpha)**2 * category_skill.sigma**2
    )

    return Skill(mu, sigma)

def get_rank(skill: Skill) -> Rank:
    rank_points = skill.mu - 2 * skill.sigma

    print(
        type(skill.mu),
        type(skill.sigma),
        type(rank_points),
        rank_points
    )

    raw_rank = next((rank for rank in reversed(RANKS) if rank["rr"] < rank_points), RANKS[0])

    # Add roman numerals
    numeral = "III"
    residual_rr = rank_points - raw_rank["rr"]

    if residual_rr < RANK_STEP_SIZE / 3:
        numeral = "I"
    elif residual_rr < 2 * RANK_STEP_SIZE / 3:
        numeral = "II"

    return Rank(raw_rank["name"], raw_rank["rr"], numeral=numeral, skill_mu=skill.mu, skill_sigma=skill.sigma)

def skill_diff(a: Skill, b: Skill) -> Rank:
    a_rank = get_rank(a)
    b_rank = get_rank(b)

    rr_diff = b_rank.rr - a_rank.rr
    mu_diff = b.mu - a.mu

    return {"rr_diff": rr_diff, "mu_diff": mu_diff}
