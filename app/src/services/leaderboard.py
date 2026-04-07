"""
Leaderboard caching and retrieval service.
Manages in-memory cache of ranked leaderboards by category.
"""

import time
from datetime import datetime, timezone
from typing import Optional, Dict, List, Tuple
from sqlalchemy import select, func, desc
from src.db.db import get_session
from src.db.models import Stats, Users, UserCategorySkill
import src.db.ranked as ranked

# Category mapping
CATEGORY_CODES = [
    "science",
    "history",
    "literature",
    "social science",
    "philosophy",
    "religion",
    "mythology",
    "geography",
    "fine arts",
    "current events"
]


class LeaderboardCache:
    """
    In-memory cache for leaderboards.
    Stores top N users by category, refreshed on rank changes.
    """
    
    # Cache configuration
    DEFAULT_LIMIT = 20  # Default leaderboard size
    CACHE_SIZE = 100    # Cache top 100 users for flexibility with categories
    
    def __init__(self):
        """Initialize the cache with empty data."""
        self.cache = {}  # {category: {"info": {...}, "users": [...]}}
        self.last_updated = {}  # {category: timestamp}
        self.cache_ttl = 3600  # 1 hour TTL, but can be manually invalidated
    
    def get_leaderboard(
        self,
        category: str = "global",
        limit: Optional[int] = None,
        offset: int = 0,
        include_user_rank: bool = False,
        user_hash: Optional[str] = None
    ) -> Dict:
        """
        Get leaderboard data with optional user rank information.
        
        Args:
            category: "global" or category name
            limit: Number of rows to return (default: DEFAULT_LIMIT)
            offset: Pagination offset
            include_user_rank: Whether to include user's rank and percentile
            user_hash: User hash for rank query (required if include_user_rank=True)
        
        Returns:
            Dict with structure: {"info": {...}, "users": [...], "user_rank": {...}, "percentile": X}
        """
        if limit is None:
            limit = self.DEFAULT_LIMIT
        
        # Refresh cache if expired or doesn't exist
        if not self._is_cache_valid(category):
            self.refresh_cache(category)
        
        cached_data = self.cache.get(category, {"info": {}, "users": []})
        
        # Apply pagination to users
        users_paginated = cached_data["users"][offset:offset + limit]
        
        # Build response
        result = {
            "info": cached_data.get("info", {}),
            "users": users_paginated,
        }
        
        # Add user's rank and percentile if requested
        if include_user_rank and user_hash:
            user_rank, percentile, total = self._get_user_rank(category, user_hash)
            result["user_rank"] = user_rank
            result["percentile"] = percentile
            result["total_users"] = total
        else:
            # Still include total for pagination
            result["total_users"] = len(cached_data.get("users", []))
        
        return result
    
    def refresh_cache(self, category: str = "global") -> bool:
        """
        Rebuild leaderboard cache from database for given category.
        
        Args:
            category: "global" or category name
        
        Returns:
            True if successful, False otherwise
        """
        try:
            session = get_session()
            
            # Query users ordered by RR (rank_points) descending
            if category == "global":
                # Global leaderboard: order by Stats.rank_points
                query = select(
                    Users.id,
                    Users.username,
                    Users.hash,
                    Stats.rank_points,
                    Stats.visible_rank,
                    Stats.skill_mu,
                    Stats.skill_sigma
                ).join(
                    Stats, Users.id == Stats.user_id
                ).order_by(
                    desc(Stats.rank_points),
                    desc(Stats.skill_mu)  # Tiebreaker: higher mu wins
                ).limit(self.CACHE_SIZE)
            else:
                # Category-specific: use UserCategorySkill
                # Only include users who have played in this category
                category_code = CATEGORY_CODES.index(category.lower()) if category.lower() in CATEGORY_CODES else None
                
                if category_code is None:
                    session.remove()
                    return False
                
                query = select(
                    Users.id,
                    Users.username,
                    Users.hash,
                    UserCategorySkill.mu,
                    UserCategorySkill.sigma,
                    Stats.visible_rank
                ).join(
                    Stats, Users.id == Stats.user_id
                ).join(
                    UserCategorySkill,
                    (Users.id == UserCategorySkill.user_id) & 
                    (UserCategorySkill.category_code == category_code)
                ).order_by(
                    desc(UserCategorySkill.mu - 2 * UserCategorySkill.sigma),  # RR
                    desc(UserCategorySkill.mu)  # Tiebreaker
                ).limit(self.CACHE_SIZE)
            
            results = session.execute(query).fetchall()
            
            # Convert results to user list format
            users = []
            for idx, row in enumerate(results, 1):
                if category == "global":
                    user_id, username, user_hash, rank_points, visible_rank, mu, sigma = row
                    rr = rank_points
                else:
                    user_id, username, user_hash, mu, sigma, visible_rank = row
                    rr = max(0, mu - 2 * sigma)
                
                users.append({
                    "rank": idx,
                    "username": username,
                    "user_hash": user_hash,
                    "rr": int(rr),
                    "visible_rank": visible_rank,
                    "mu": float(mu),
                    "sigma": float(sigma),
                })
            
            # Store in cache
            self.cache[category] = {
                "info": {
                    "season": "Season 1",
                    "rows": len(users),
                    "type": "absolute",
                    "category": category,
                    "last_updated": datetime.now(timezone.utc).isoformat(),
                },
                "users": users,
            }
            
            self.last_updated[category] = time.time()
            session.remove()
            return True
            
        except Exception as e:
            print(f"Error refreshing leaderboard cache for {category}: {e}")
            session.remove() if session else None
            return False
    
    def invalidate_cache(self, category: Optional[str] = None) -> None:
        """
        Clear cache for specified category or all categories.
        
        Args:
            category: Category to invalidate, or None to invalidate all
        """
        if category is None:
            self.cache.clear()
            self.last_updated.clear()
        else:
            self.cache.pop(category, None)
            self.last_updated.pop(category, None)
    
    def _is_cache_valid(self, category: str) -> bool:
        """Check if cache for category is valid (exists and not expired)."""
        if category not in self.cache:
            return False
        
        if category not in self.last_updated:
            return False
        
        age = time.time() - self.last_updated[category]
        return age < self.cache_ttl
    
    def _get_user_rank(
        self, 
        category: str, 
        user_hash: str
    ) -> Tuple[Optional[Dict], Optional[float], int]:
        """
        Get user's rank and percentile for specific category.
        
        Args:
            category: "global" or category name
            user_hash: User hash to lookup
        
        Returns:
            Tuple of (user_rank_dict, percentile_float, total_users_int)
            Returns (None, None, 0) if user not found
        """
        try:
            session = get_session()
            
            # Get total count of users with rank data
            total_count = session.execute(
                select(func.count()).select_from(Stats)
            ).scalar()
            
            if category == "global":
                # Get user's rank info from Stats
                user_stats = session.execute(
                    select(
                        Users.username,
                        Users.hash,
                        Stats.rank_points,
                        Stats.visible_rank,
                        Stats.skill_mu,
                        Stats.skill_sigma
                    ).join(
                        Stats, Users.id == Stats.user_id
                    ).where(
                        Users.hash == user_hash
                    )
                ).first()
                
                if not user_stats:
                    return None, None, total_count
                
                username, user_id, rank_points, visible_rank, mu, sigma = user_stats
                
                # Count how many users have higher RR
                higher_count = session.execute(
                    select(func.count()).select_from(Stats).where(
                        Stats.rank_points > rank_points
                    )
                ).scalar()
                
                rank = higher_count + 1
                percentile = (rank / max(total_count, 1)) * 100
                
                user_rank = {
                    "rank": rank,
                    "username": username,
                    "rr": rank_points,
                    "visible_rank": visible_rank,
                    "mu": float(mu),
                    "sigma": float(sigma),
                }
                
            else:
                # Get user's category-specific rank
                category_code = CATEGORY_CODES.index(category.lower()) if category.lower() in CATEGORY_CODES else None
                
                if category_code is None:
                    return None, None, total_count
                
                user_cat_skill = session.execute(
                    select(
                        Users.username,
                        Users.hash,
                        UserCategorySkill.mu,
                        UserCategorySkill.sigma,
                        Stats.visible_rank
                    ).join(
                        Stats, Users.id == Stats.user_id
                    ).join(
                        UserCategorySkill,
                        (Users.id == UserCategorySkill.user_id) &
                        (UserCategorySkill.category_code == category_code)
                    ).where(
                        Users.hash == user_hash
                    )
                ).first()
                
                if not user_cat_skill:
                    return None, None, total_count
                
                username, user_id, mu, sigma, visible_rank = user_cat_skill
                user_rr = max(0, mu - 2 * sigma)
                
                # Count how many users have higher RR in this category
                higher_count = session.execute(
                    select(func.count()).select_from(UserCategorySkill).where(
                        (UserCategorySkill.category_code == category_code) &
                        ((UserCategorySkill.mu - 2 * UserCategorySkill.sigma) > user_rr)
                    )
                ).scalar()
                
                rank = higher_count + 1
                percentile = (rank / max(total_count, 1)) * 100
                
                user_rank = {
                    "rank": rank,
                    "username": username,
                    "rr": int(user_rr),
                    "visible_rank": visible_rank,
                    "mu": float(mu),
                    "sigma": float(sigma),
                }
            
            session.remove()
            return user_rank, percentile, total_count
            
        except Exception as e:
            print(f"Error getting user rank for {user_hash} in {category}: {e}")
            session.remove() if session else None
            return None, None, 0


# Global cache instance
leaderboard_cache = LeaderboardCache()
