
class RatingParameters:
    def __init__(self, data):
        self.beta = data.get("beta")
        self.alpha = data.get("alpha")
        self.min_sigma = data.get("min_sigma")
        self.initial_mu = data.get("initial_mu")
        self.initial_sigma = data.get("initial_sigma")