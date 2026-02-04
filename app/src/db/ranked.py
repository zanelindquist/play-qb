import math


SQRT_2PI = math.sqrt(2 * math.pi)

RANK_STEP_SIZE = 100
RANKS = [
    { "rank_code": 0,  "name": "Dirt I", "rr": 0 },
    { "rank_code": 1,  "name": "Dirt II", "rr": 100 },
    { "rank_code": 2,  "name": "Dirt III", "rr": 200 },

    { "rank_code": 3,  "name": "Plastic I", "rr": 700 },
    { "rank_code": 4,  "name": "Plastic II", "rr": 800 },
    { "rank_code": 5,  "name": "Plastic III", "rr": 900 },

    { "rank_code": 6,  "name": "Tin I", "rr": 1000 },
    { "rank_code": 7,  "name": "Tin II", "rr": 1100 },
    { "rank_code": 8,  "name": "Tin III", "rr": 1200 },

    { "rank_code": 9,  "name": "Bronze I", "rr": 1300 },
    { "rank_code": 10, "name": "Bronze II", "rr": 1400 },
    { "rank_code": 11, "name": "Bronze III", "rr": 1500 },

    { "rank_code": 12, "name": "Silver I", "rr": 1600 },
    { "rank_code": 13, "name": "Silver II", "rr": 1700 },
    { "rank_code": 14, "name": "Silver III", "rr": 1800 },

    { "rank_code": 15, "name": "Gold I", "rr": 1900 },
    { "rank_code": 16, "name": "Gold II", "rr": 2000 },
    { "rank_code": 17, "name": "Gold III", "rr": 2100 },

    { "rank_code": 18, "name": "Diamond I", "rr": 2200 },
    { "rank_code": 19, "name": "Diamond II", "rr": 2300 },
    { "rank_code": 20, "name": "Diamond III", "rr": 2400 },

    { "rank_code": 21, "name": "Immortal I", "rr": 2500 },
    { "rank_code": 22, "name": "Immortal II", "rr": 2600 },
    { "rank_code": 23, "name": "Immortal III", "rr": 2700 }
];


QUESTION_DIFFICULTIES = {
    0: {"name": "Middle School", "mu": 1200, "sigma": 200},
    1: {"name": "High School", "mu": 1500, "sigma": 200},
    2: {"name": "Collegiate", "mu": 1800, "sigma": 200},
    3: {"name": "Open", "mu": 2200, "sigma": 200},
}

# Skill is used for players
class Skill:
    def __init__(self, mu: float, sigma: float):
        self.mu = float(mu)
        self.sigma = max(0.0, float(sigma))

    def __repr__(self):
        return f"<Skill(mu={self.mu}, sigma={self.sigma})>"

# Difficulty is for questions
class Difficulty:
    def __init__(self, mu: float, sigma: float, buzz_fraction: float = 1):
        self.base_mu = mu  # Store the original difficulty
        self.buzz_fraction = buzz_fraction
        self.sigma = sigma
        
        # Adjust mu based on how much of the question was heard
        self.mu = self.get_effective_difficulty(mu, buzz_fraction)

    def __repr__(self):
        return f"<Difficulty(base_mu={self.base_mu}, effective_mu={self.mu}, sigma={self.sigma})>"
    
    def get_effective_difficulty(self, base_mu: float, buzz_fraction: float) -> float:
        """
        Model how question difficulty decreases as more clues are revealed.
        
        buzz_fraction = 0.0: Very beginning (hardest)
        buzz_fraction = 0.5: Halfway through
        buzz_fraction = 1.0: Giveaway at end (easiest)
        """
        # Define the giveaway difficulty (what the last line is worth)
        # This scales with base difficulty but is much lower
        if base_mu >= 2100:  # Collegiate/Open
            giveaway_mu = 1500
        elif base_mu >= 1500:  # High School
            giveaway_mu = 1100
        else:  # Middle School
            giveaway_mu = 900
        
        # Define the peak difficulty (early in the question)
        # Peak is higher than base - requires connecting dots early
        peak_multiplier = 1.4  # Early buzzes are 40% harder than base
        peak_mu = base_mu * peak_multiplier
        
        # Model the difficulty curve
        # Use a power function so difficulty drops faster near the end
        # (models the "giveaway" nature of last lines)
        t = buzz_fraction
        curve_power = 2.5  # Higher = steeper drop near end
        
        # Interpolate between peak (at t=0) and giveaway (at t=1)
        # Using (1-t)^power makes it drop faster as t approaches 1
        difficulty_range = peak_mu - giveaway_mu
        effective_mu = giveaway_mu + difficulty_range * ((1 - t) ** curve_power)

        if isinstance(effective_mu, complex):
            effective_mu = effective_mu.real
        
        return effective_mu

    def time_difficulty_multiplier(self, buzz_fraction):
        """Deprecated - kept for reference"""
        # Old approach - can remove this
        val = 4 - 3 * math.sqrt(buzz_fraction)
        if isinstance(val, complex):
            val = val.real
        return float(val)
    
class Rank:
    def __init__(self, rank: str, rr: float, residual_rr: float = 0, skill_mu: float = 0, skill_sigma: float = 0):
        self.rank = rank
        self.rr = rr
        self.rank_code = next((r for r in RANKS if r.get("name") == rank ), RANKS[0]).get("rank_code")
        self.residual_rr = residual_rr
        self.skill_mu = skill_mu
        self.skill_sigma = skill_sigma

    def __repr__(self):
        return f"<{self.rank}(rr={self.rr})>"
    
    def to_dict(self):
        return self.__dict__


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
    return 4 - 3 * math.sqrt(p);

# TODO: We may want to not weight incorrect answers a ton beacuse that shows they at least thought they could answer the question
# For example, the probability that they get the incorrectly answered question right is higher than for a question they didn't buzz (hypothetically)
def update_skill(
    skill: Skill,
    difficulty: Difficulty,
    correct: bool,
    answer_time: float,
    beta: float,
    max_delta: float = 3.0 # Maximum number of standard deviations away a question difficulty gap can be
) -> Skill:
    """
    Bayesian update for one question attempt
    """
    # Combined uncertainty
    c = math.sqrt(skill.sigma**2 + difficulty.sigma**2 + beta**2)

    # Performance difference (z score) - ALWAYS POSITIVE for v_func
    # Cap delta so taht is is not so large that we don't learn anything from it
    delta = min(abs(skill.mu - difficulty.mu) / c, max_delta)
    
    # Compute v and w with positive delta
    v = v_func(delta)
    w = w_func(delta)
    
    # NOW apply the sign based on correctness
    if correct:
        # Correct answer: increase mu (positive update)
        # Weight by answer time (earlier = bigger boost)
        mu_delta = (skill.sigma**2 / c) * v * weight_answer_time(answer_time)

        if skill.mu < difficulty.mu:
            upset_bonus = min((difficulty.mu - skill.mu) * 0.03, 10)
            mu_delta += upset_bonus
    else:
        # Incorrect answer: decrease mu (negative update)
        mu_delta = -(skill.sigma**2 / c) * v
    
    # Apply the update
    mu_new = skill.mu + mu_delta
    
    # Variance update (same for correct/incorrect)
    sigma_sq_new = skill.sigma**2 * (1 - (skill.sigma**2 / (c**2)) * w)

    print("IS CORRECT", correct)
    print("DIFF", skill.mu - difficulty.mu)
    print("DELTA (abs)", delta)
    print("V", v)
    print("MU_DELTA", mu_delta)
    print("MU_NEW", mu_new)
    print("SIG_SQ_NEW", sigma_sq_new)

    return Skill(mu_new, math.sqrt(max(sigma_sq_new, 1e-6)))


def non_answer_update_skill(
    skill: Skill,
    difficulty: Difficulty, # Should be computed with buzz fraction
    buzz_fraction: float,
    beta: float = 200.0,
    power: float = 2.5,
    max_mu_drop: float = 5.0
) -> Skill:
    print("NON ANSWER CALLED")
    """
    Update user skill from NOT buzzing before buzz_fraction of the question.
    """

    # Performance comparison distribution
    mu_d = skill.mu - difficulty.mu

    # Combined uncertainty
    sigma_x = math.sqrt(
        skill.sigma**2 +
        difficulty.sigma**2 +
        beta**2
    )

    # Z score of of diff
    z = mu_d / sigma_x

    # Avoid numerical blowups
    Phi = normal_cdf(z)
    if Phi < 1e-6:
        return skill  # silence provides no info here

    v = normal_pdf(z) / Phi

    # Timing weight
    weight = buzz_fraction ** power

    # Mean update (negative)
    delta_mu = -(skill.sigma**2 / sigma_x) * v * weight

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
    power: float = 2.0,
    min_sigma: float = 50.0
):
    """
    Bayesian update of question difficulty with time-weighted evidence.
    """

    # Make sure it's not complex
    buzz_fraction = min(max(buzz_fraction, 0.0), 1.0)

    # Evidence weight (early buzz = strong signal)
    weight = (1.0001 - buzz_fraction) ** power

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

def effective_skill(global_skill: Skill, category_skill: Skill, global_weight=0.6) -> Skill:
    mu = global_weight * global_skill.mu + (1 - global_weight) * category_skill.mu

    # Conservative uncertainty
    sigma = math.sqrt(
        global_weight**2 * global_skill.sigma**2 +
        (1 - global_weight)**2 * category_skill.sigma**2
    )

    return Skill(mu, sigma)

def get_rank(skill: Skill) -> Rank:
    rank_points = max(0, skill.mu - 2 * skill.sigma)

    rank = next((rank for rank in reversed(RANKS) if rank["rr"] < rank_points), RANKS[0])

    # Add roman numerals
    residual_rr = rank_points - rank["rr"]

    return Rank(rank["name"], rank_points, residual_rr=residual_rr, skill_mu=skill.mu, skill_sigma=skill.sigma)

def skill_diff(a: Skill, b: Skill) -> Rank:
    a_rank = get_rank(a)
    b_rank = get_rank(b)

    rr_diff = b_rank.rr - a_rank.rr
    mu_diff = b.mu - a.mu

    return {"rr_diff": rr_diff, "mu_diff": mu_diff}
