import math


SQRT_2PI = math.sqrt(2 * math.pi)


class Skill:
    def __init__(self, mu: float, sigma: float):
        self.mu = mu
        self.sigma = sigma

    def __repr__(self):
        return f"<Skill(mu={self.mu}, sigma={self.sigma})>"

class Difficulty:
    def __init__(self, mu: float, sigma: float):
        self.mu = mu
        self.sigma = sigma

    def __repr__(self):
        return f"<Difficulty(mu={self.mu}, sigma={self.sigma})>"



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

def update_difficulty(
    skill: Skill,
    difficulty: Difficulty,
    correct: bool,
    beta: float
) -> Difficulty:
    c = math.sqrt(skill.sigma**2 + difficulty.sigma**2 + beta**2)
    delta = (skill.mu - difficulty.mu) / c

    if correct:
        delta = -delta

    v = v_func(delta)
    w = w_func(delta)

    mu_new = difficulty.mu + (difficulty.sigma**2 / c) * v
    sigma_sq_new = difficulty.sigma**2 * (
        1 - (difficulty.sigma**2 / (c**2)) * w
    )

    return Difficulty(mu_new, math.sqrt(max(sigma_sq_new, 1e-6)))

def effective_skill(global_skill: Skill, category_skill: Skill, alpha=0.6) -> Skill:
    mu = alpha * global_skill.mu + (1 - alpha) * category_skill.mu

    # Conservative uncertainty
    sigma = math.sqrt(
        alpha**2 * global_skill.sigma**2 +
        (1 - alpha)**2 * category_skill.sigma**2
    )

    return Skill(mu, sigma)