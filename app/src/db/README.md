# Checking a question
1. Get the type (bonus or tossup) question, answer, and category
2. Split the user's answer into tokens
3. IF the answer is a name
    - Judge it more loosely and based off of last name
4. IF the answer is not a name
    - Judge it more strictly and make sure it has every part it needs in the answer
5. Determine if the user's answer crosses the threshold for acceptability for a certain category
6. Return True or False to the user

# Answer checking todo
1. Remove the so users don't have to type it
2. Hanging ings and s
3. Quotes