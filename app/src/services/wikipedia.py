import wikipediaapi

# Synchronous client
wiki = wikipediaapi.Wikipedia(user_agent='PlayQB (merlin@example.com)', language='en')

class Wikipedia:

    CACHE_LIMIT = 500;

    def __init__(self):
        self.cache = {} # "question_hash: {...}"
        pass

    def link_questions(self, questions: list) -> list:
        """
        Pass in a list of question dicts to affix ["wikipedia"] information to each item

        Args:
            questions: dict parsed answer questions

        Returns:
            A list of question dicts with a wikipedia property
        """

        # Loop through each question
        for question in questions:
            hash = question.get("hash")
            # First, check the cache for the question ID
            if self.cache.get(hash):
                question["wikipedia"] = self.cache.get(hash)
                continue

            search = question.get("answers").get("main") + " " + question.get("category")

            # If its not cached, search
            results = wiki.search(search, limit=1).pages

            if results:
                # Get the first page object
                page = list(results.values())[0]

                wiki_data = {
                    "title": page.title,
                    "summary": page.summary[:300],  # short summary (trim if you want)
                    "url": page.fullurl
                }

                self.cache_question(hash, wiki_data)
                question["wikipedia"] = wiki_data
            else:
                question["wikipedia"] = None

        return questions

    def cache_question(self, hash, wiki_dict):
        if len(self.cache) > self.CACHE_LIMIT:
            first_key = next(iter(self.cache))
            del self.cache[first_key]

        self.cache[hash] = wiki_dict

wiki_service = Wikipedia()