
class RatingParameters:
    def __init__(self, data):
        for key in data.keys():
            setattr(self, key, data[key])