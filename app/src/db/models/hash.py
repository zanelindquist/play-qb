import random
import string

COLORS = [
    "#3B82F6",  # Royal Blue
    "#DC2626",  # Crimson Red
    "#F4C430",  # Golden Yellow
    "#10B981",  # Emerald Green
    "#6366F1",  # Purple Indigo
    "#06B6D4",  # Teal Cyan
    "#EA580C",  # Burnt Orange
    "#DB2777",  # Magenta Pink
    "#64748B",  # Slate Gray
    "#92400E",  # Deep Brown
]

def generate_unique_hash(length=16):
    """Generate a unique hash consisting of uppercase and lowercase letters."""
    return ''.join(random.choices(string.ascii_letters, k=length))

def get_hex_color(index: int) -> str:
    if not index:
        return random.choices(COLORS, k=1)[0]
    else:
        return COLORS[index]