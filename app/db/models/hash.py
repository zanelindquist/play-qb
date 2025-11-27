import random
import string

def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))