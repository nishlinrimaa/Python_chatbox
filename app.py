from flask import Flask, render_template, request, jsonify
import re

app = Flask(__name__)

# Beginner-friendly, predefined Python knowledge base.
KNOWLEDGE = [
    {
        "topic": "What is Python?",
        "keywords": ["what is python", "python language", "about python", "define python"],
        "answer": """Python is a high-level, beginner-friendly programming language. Its readable syntax makes it useful for automation, web development, data science, AI, and scripting.

Example:
print("Hello, world!")

The print() function displays text in the output."""
    },
    {
        "topic": "Variables",
        "keywords": ["variable", "variables", "assign value"],
        "answer": """A variable is a name used to store a value. Python creates a variable when you assign a value to it.

Example:
name = "Arun"
age = 20
print(name)
print(age)

You do not need to declare the variable's type first."""
    },
    {
        "topic": "Data types",
        "keywords": ["data type", "data types", "int string float bool", "types in python"],
        "answer": """Common Python data types include:
• int — whole numbers, such as 10
• float — decimal numbers, such as 3.14
• str — text, such as "hello"
• bool — True or False
• list — an ordered, changeable collection
• tuple — an ordered, unchangeable collection
• dict — key-value pairs
• set — a collection of unique values

Example:
age = 20
price = 19.5
name = "Maya"
is_student = True"""
    },
    {
        "topic": "If statements",
        "keywords": ["if statement", "if else", "conditional", "condition"],
        "answer": """An if statement runs code only when a condition is True. Use elif for another condition and else for the default case.

Example:
age = 18

if age >= 18:
    print("Adult")
else:
    print("Not an adult")

Indentation is important in Python."""
    },
    {
        "topic": "For loops",
        "keywords": ["for loop", "for loops", "iterate", "range"],
        "answer": """A for loop repeats code for each item in a sequence. range(5) produces 0, 1, 2, 3, 4.

Example:
for number in range(5):
    print(number)

Use for when you want to go through items or repeat a known number of times."""
    },
    {
        "topic": "While loops",
        "keywords": ["while loop", "while loops"],
        "answer": """A while loop repeats as long as its condition is True. Make sure the condition can eventually become False to avoid an infinite loop.

Example:
count = 1
while count <= 3:
    print(count)
    count += 1"""
    },
    {
        "topic": "Functions",
        "keywords": ["function", "functions", "def keyword", "return statement"],
        "answer": """A function is a reusable block of code. Define it with def, pass information through parameters, and use return to send a result back.

Example:
def add(a, b):
    return a + b

result = add(3, 4)
print(result)  # 7"""
    },
    {
        "topic": "Lists",
        "keywords": ["list", "lists", "append", "list methods"],
        "answer": """A list stores multiple items in a specific order. Lists are changeable and use square brackets.

Example:
fruits = ["apple", "mango", "banana"]
fruits.append("orange")
print(fruits[0])  # apple
print(fruits)

Indexes start at 0. append() adds an item to the end."""
    },
    {
        "topic": "Tuples",
        "keywords": ["tuple", "tuples"],
        "answer": """A tuple is an ordered collection that cannot be changed after it is created. Tuples use parentheses.

Example:
point = (10, 20)
print(point[0])  # 10

Use a tuple when the collection should remain fixed."""
    },
    {
        "topic": "Dictionaries",
        "keywords": ["dictionary", "dictionaries", "dict", "key value"],
        "answer": """A dictionary stores values using keys. It is written with curly braces.

Example:
student = {"name": "Ravi", "age": 20}
print(student["name"])
student["age"] = 21

Use dict.get("key") when you want to safely read a key that might be missing."""
    },
    {
        "topic": "Strings",
        "keywords": ["string", "strings", "text", "string methods"],
        "answer": """A string is text enclosed in quotes. Strings are immutable, which means you create a new string instead of changing individual characters.

Example:
message = "hello python"
print(message.upper())
print(message.title())
print(len(message))

Common methods include lower(), upper(), strip(), replace(), and split()."""
    },
    {
        "topic": "Classes and objects",
        "keywords": ["class", "classes", "object", "objects", "oop", "self", "constructor"],
        "answer": """A class is a blueprint for creating objects. An object is an instance of a class. __init__ initializes an object, and self refers to the current instance.

Example:
class Dog:
    def __init__(self, name):
        self.name = name

    def bark(self):
        print(self.name, "says woof")

pet = Dog("Buddy")
pet.bark()"""
    },
    {
        "topic": "Exceptions",
        "keywords": ["exception", "exceptions", "try except", "error handling", "raise"],
        "answer": """Use try and except to handle expected runtime errors without crashing the whole program.

Example:
try:
    number = int(input("Enter a number: "))
    print(10 / number)
except ValueError:
    print("Please enter a whole number.")
except ZeroDivisionError:
    print("You cannot divide by zero.")

Catch specific exceptions where possible."""
    },
    {
        "topic": "Modules",
        "keywords": ["module", "modules", "import", "library", "pip"],
        "answer": """A module is a Python file or library that provides reusable code. Use import to access it.

Example:
import math
print(math.sqrt(25))

Install third-party packages with:
python -m pip install package_name

Built-in modules such as math do not need to be installed."""
    },
    {
        "topic": "File handling",
        "keywords": ["file handling", "read file", "write file", "open file"],
        "answer": """Use open() to work with files. The with statement closes the file automatically when the block ends.

Example:
with open("notes.txt", "w", encoding="utf-8") as file:
    file.write("Hello!")

with open("notes.txt", "r", encoding="utf-8") as file:
    content = file.read()
    print(content)

Modes include "r" for reading, "w" for writing, and "a" for appending."""
    },
    {
        "topic": "List comprehensions",
        "keywords": ["list comprehension", "comprehension"],
        "answer": """A list comprehension creates a list from an iterable in a compact way.

Example:
squares = [number ** 2 for number in range(1, 6)]
print(squares)  # [1, 4, 9, 16, 25]

Start with a normal for loop if the compact version feels confusing."""
    },
    {
        "topic": "Operators",
        "keywords": ["operator", "operators", "arithmetic", "comparison"],
        "answer": """Python operator examples:
• Arithmetic: +, -, *, /, //, %, **
• Comparison: ==, !=, <, >, <=, >=
• Logical: and, or, not
• Assignment: =, +=, -=

Remember: = assigns a value, while == compares two values."""
    },
    {
        "topic": "Comments",
        "keywords": ["comment", "comments", "hashtag", "hash symbol"],
        "answer": """A comment explains code and is ignored by Python. A single-line comment starts with #.

Example:
# Calculate the total price
price = 100
quantity = 2
total = price * quantity

Use clear comments to explain why something is done, not just repeat the code."""
    },
    {
        "topic": "Debugging",
        "keywords": ["debug", "debugging", "syntax error", "nameerror", "traceback"],
        "answer": """To debug Python:
1. Read the last line of the traceback first; it often names the error.
2. Check the file and line number mentioned.
3. Check spelling, brackets, quotes, colons, and indentation.
4. Print intermediate values or use a debugger.
5. Fix one issue and run the program again.

Common errors: SyntaxError (invalid syntax), NameError (unknown name), TypeError (wrong kind of value), and IndexError (invalid sequence index)."""
    },
]

def normalize(text):
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9_ ]", " ", text.lower())).strip()

def get_answer(question):
    q = normalize(question)
    if not q:
        return {"topic": "Try a question", "answer": "Type a Python question, such as “What is a list?” or “Explain for loops.”"}
    # Exact-ish keyword matching; prefer the strongest match.
    best_item = None
    best_score = 0
    for item in KNOWLEDGE:
        score = 0
        for keyword in item["keywords"]:
            k = normalize(keyword)
            if k and k in q:
                score += max(1, len(k.split()))
        topic = normalize(item["topic"])
        if topic in q:
            score += 3
        if score > best_score:
            best_score = score
            best_item = item
    if best_item and best_score > 0:
        return {"topic": best_item["topic"], "answer": best_item["answer"]}
    return {
        "topic": "Let's narrow it down",
        "answer": """I don't have a matching answer in my built-in knowledge base yet.

Try asking about:
• variables and data types
• if/else statements
• for and while loops
• functions and return
• lists, tuples, dictionaries, and strings
• classes and objects
• exceptions, modules, or file handling

Tip: ask one specific question, for example: “Show me a Python function that adds two numbers.”"""
    }

@app.route("/")
def index():
    return render_template("index.html")

@app.post("/api/ask")
def ask():
    data = request.get_json(silent=True) or {}
    question = str(data.get("question", ""))[:2000]
    result = get_answer(question)
    return jsonify(result)

@app.get("/api/topics")
def topics():
    return jsonify([item["topic"] for item in KNOWLEDGE])

if __name__ == "__main__":
    app.run(debug=True)
